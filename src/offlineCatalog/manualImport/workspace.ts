import { MAX_FILE_BYTES, MAX_RECORDS, parseManualImport, validateManualRecord } from './index';
import { normalizeNameForMatching } from '../normalize';
import { FIELDS, type Candidate, type Field, type ImportResult, type Issue } from './types';

export type EditableValue = string | number | boolean | null;
export type EditableFields = Readonly<Record<Field, EditableValue>>;
export type WorkspaceRow = {
  readonly id: string;
  readonly originalIndex: number;
  readonly values: EditableFields;
  readonly excluded: boolean;
  readonly validation: 'valid' | 'invalid';
  readonly errors: readonly Issue[];
  readonly duplicateReview: 'not-needed' | 'pending' | 'reviewed';
  readonly similarRowIds: readonly string[];
};
export type ImportWorkspaceState = {
  readonly version: 1;
  readonly dataClassification: 'sensitive-in-memory';
  readonly originalCount: number;
  readonly rows: readonly WorkspaceRow[];
};
export type WorkspaceCode = 'IMPORT_REJECTED' | 'INVALID_STATE' | 'UNKNOWN_ROW' | 'INVALID_FIELD' | 'INVALID_VALUE' | 'INVALID_ACTION' | 'INVALID_PAGE' | 'NO_DUPLICATE' | 'NO_EXPORTABLE_ROWS' | 'EXPORT_TOO_LARGE' | 'EXPORT_CONTRACT';
export type SafeError = { ok: false; code: WorkspaceCode };
export type WorkspaceResult = { ok: true; state: ImportWorkspaceState } | SafeError;
export type WorkspaceAction =
  | { type: 'edit'; id: string; field: Field; value: EditableValue }
  | { type: 'exclude'; id: string; excluded: boolean }
  | { type: 'review'; id: string; reviewed: boolean };
export type SimilarityHint = { leftId: string; rightId: string; reason: 'similar-name-and-type'; requiresHumanReview: true };
const error = (code: WorkspaceCode): SafeError => ({ ok: false, code });
const blank = (): EditableFields => ({ name: '', fileType: null, sizeBytes: null, categoryId: null, sourceLabel: null, note: null });
const copyFields = (values: EditableFields): EditableFields => ({ name: values.name, fileType: values.fileType, sizeBytes: values.sizeBytes, categoryId: values.categoryId, sourceLabel: values.sourceLabel, note: values.note });

// Accept only plain own data properties; never invoke getters or copy unknown keys.
function exactObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype) return false;
  const own = Reflect.ownKeys(value);
  return own.length === keys.length && own.every(key => typeof key === 'string' && keys.includes(key) && 'value' in Object.getOwnPropertyDescriptor(value, key)!);
}
const scalar = (value: unknown): value is EditableValue => value === null || ['string', 'number', 'boolean'].includes(typeof value);
function plainArray(value: unknown, limit: number): value is unknown[] {
  return Array.isArray(value) && Object.getPrototypeOf(value) === Array.prototype && value.length <= limit && Reflect.ownKeys(value).length === value.length + 1 && Array.from({ length: value.length }, (_, i) => Object.getOwnPropertyDescriptor(value, String(i))).every(descriptor => descriptor && 'value' in descriptor);
}
function validState(value: unknown): value is ImportWorkspaceState {
  if (!exactObject(value, ['version', 'dataClassification', 'originalCount', 'rows']) || value.version !== 1 || value.dataClassification !== 'sensitive-in-memory') return false;
  if (!Number.isInteger(value.originalCount) || (value.originalCount as number) < 0 || (value.originalCount as number) > MAX_RECORDS || !plainArray(value.rows, MAX_RECORDS) || value.rows.length !== value.originalCount) return false;
  return value.rows.every((row: unknown, index: number) => {
    if (!exactObject(row, ['id', 'originalIndex', 'values', 'excluded', 'validation', 'errors', 'duplicateReview', 'similarRowIds'])) return false;
    if (row.id !== `local-row-${index}` || row.originalIndex !== index || typeof row.excluded !== 'boolean' || !['valid', 'invalid'].includes(row.validation as string) || !['not-needed', 'pending', 'reviewed'].includes(row.duplicateReview as string)) return false;
    if (!exactObject(row.values, FIELDS) || !FIELDS.every(field => scalar((row.values as Record<string, unknown>)[field])) || !plainArray(row.errors, FIELDS.length)) return false;
    if (!plainArray(row.similarRowIds, MAX_RECORDS - 1) || new Set(row.similarRowIds).size !== row.similarRowIds.length || !row.similarRowIds.every(id => typeof id === 'string' && id !== row.id && /^local-row-(?:0|[1-9]\d*)$/.test(id) && Number(id.slice(10)) < (value.originalCount as number))) return false;
    return row.errors.every((issue: unknown) => exactObject(issue, ['field', 'code', 'index']) && FIELDS.includes(issue.field as Field) && typeof issue.code === 'string' && ['REQUIRED', 'INVALID_TYPE', 'TOO_LONG', 'INVALID_FILE_TYPE', 'INVALID_SIZE', 'CATEGORY_UNCONFIRMED', 'INVALID_CATEGORY', 'INVALID_TEXT'].includes(issue.code) && issue.index === index);
  });
}

function similarities(rows: readonly WorkspaceRow[]): SimilarityHint[] {
  const hints: SimilarityHint[] = [];
  for (let a = 0; a < rows.length; a++) {
    const left = rows[a]; if (left.excluded || left.validation !== 'valid') continue;
    for (let b = a + 1; b < rows.length; b++) {
      const right = rows[b]; if (right.excluded || right.validation !== 'valid') continue;
      const type = (row: WorkspaceRow) => typeof row.values.fileType === 'string' ? row.values.fileType.trim() || null : null;
      if (normalizeNameForMatching(left.values.name as string) === normalizeNameForMatching(right.values.name as string) && type(left) === type(right)) hints.push({ leftId: left.id, rightId: right.id, reason: 'similar-name-and-type', requiresHumanReview: true });
    }
  }
  return hints;
}
function refreshed(state: ImportWorkspaceState, categories?: ReadonlySet<string>, resetReview = false): ImportWorkspaceState {
  const rows: WorkspaceRow[] = state.rows.map(row => {
    const values = copyFields(row.values);
    const checked = validateManualRecord(values, row.originalIndex, 'json', categories);
    return { id: row.id, originalIndex: row.originalIndex, values, excluded: row.excluded, validation: checked.status, errors: checked.status === 'invalid' ? checked.errors.map(issue => ({ ...issue })) : [], duplicateReview: resetReview ? 'not-needed' : row.duplicateReview, similarRowIds: [...row.similarRowIds] };
  });
  const hints = similarities(rows);
  return { version: 1, dataClassification: 'sensitive-in-memory', originalCount: rows.length, rows: rows.map(row => {
    const peers = hints.filter(hint => hint.leftId === row.id || hint.rightId === row.id).map(hint => hint.leftId === row.id ? hint.rightId : hint.leftId);
    const samePeers = peers.length === row.similarRowIds.length && peers.every((id, i) => id === row.similarRowIds[i]);
    return { ...row, similarRowIds: peers, duplicateReview: peers.length ? row.duplicateReview === 'reviewed' && samePeers ? 'reviewed' : 'pending' : 'not-needed' };
  }) };
}

export function createWorkspace(result: ImportResult, categories?: ReadonlySet<string>): WorkspaceResult {
  try {
    if (exactObject(result, ['status', 'code', 'summary']) && result.status === 'rejected') return error('IMPORT_REJECTED');
    if (!exactObject(result, ['status', 'dataClassification', 'totalRecords', 'validCount', 'invalidCount', 'rows']) || result.status !== 'accepted' || result.dataClassification !== 'sensitive-in-memory' || !plainArray(result.rows, MAX_RECORDS) || result.rows.length !== result.totalRecords || !Number.isInteger(result.validCount) || !Number.isInteger(result.invalidCount) || result.validCount < 0 || result.invalidCount < 0 || result.validCount + result.invalidCount !== result.totalRecords) return error('INVALID_STATE');
    const rows: WorkspaceRow[] = [];
    for (const [index, row] of result.rows.entries()) {
      if (!exactObject(row, ['index', 'status', 'candidate']) && !exactObject(row, ['index', 'status', 'errors'])) return error('INVALID_STATE');
      if (row.index !== index || (row.status !== 'valid' && row.status !== 'invalid')) return error('INVALID_STATE');
      if (row.status === 'valid' && (!exactObject(row.candidate, FIELDS) || !FIELDS.every(field => scalar(row.candidate[field])))) return error('INVALID_STATE');
      rows.push({ id: `local-row-${index}`, originalIndex: index, values: row.status === 'valid' ? copyFields(row.candidate) : blank(), excluded: false, validation: 'invalid', errors: [], duplicateReview: 'not-needed', similarRowIds: [] });
    }
    if (result.rows.filter(row => row.status === 'valid').length !== result.validCount) return error('INVALID_STATE');
    const state = { version: 1 as const, dataClassification: 'sensitive-in-memory' as const, originalCount: rows.length, rows };
    return { ok: true, state: refreshed(state, categories) };
  } catch { return error('INVALID_STATE'); }
}

export function revalidateWorkspace(state: ImportWorkspaceState, categories?: ReadonlySet<string>): WorkspaceResult {
  try { return validState(state) ? { ok: true, state: refreshed(state, categories) } : error('INVALID_STATE'); }
  catch { return error('INVALID_STATE'); }
}

export function updateWorkspace(state: ImportWorkspaceState, action: WorkspaceAction, categories?: ReadonlySet<string>): WorkspaceResult {
  try {
    if (!validState(state)) return error('INVALID_STATE');
    if (action === null || typeof action !== 'object') return error('INVALID_ACTION');
    const kind = Object.getOwnPropertyDescriptor(action, 'type');
    if (!kind || !('value' in kind)) return error('INVALID_ACTION');
    if (!['edit', 'exclude', 'review'].includes(kind.value)) return error('INVALID_ACTION');
    const keys = kind.value === 'edit' ? ['type', 'id', 'field', 'value'] : kind.value === 'exclude' ? ['type', 'id', 'excluded'] : ['type', 'id', 'reviewed'];
    if (!exactObject(action, keys)) return error('INVALID_ACTION');
    if (action.type === 'edit' && !FIELDS.includes(action.field)) return error('INVALID_FIELD');
    if (action.type === 'edit' && !scalar(action.value)) return error('INVALID_VALUE');
    if ((action.type === 'exclude' && typeof action.excluded !== 'boolean') || (action.type === 'review' && typeof action.reviewed !== 'boolean')) return error('INVALID_VALUE');
    const current = refreshed(state, categories);
    const row = current.rows.find(item => item.id === action.id);
    if (!row) return error('UNKNOWN_ROW');
    if (action.type === 'review' && row.duplicateReview === 'not-needed') return error('NO_DUPLICATE');
    const rows = current.rows.map(item => {
      if (item.id !== action.id) return item;
      if (action.type === 'edit') return { ...item, values: { ...copyFields(item.values), [action.field]: action.value } };
      if (action.type === 'exclude') return { ...item, excluded: action.excluded };
      return { ...item, duplicateReview: action.reviewed ? 'reviewed' as const : 'pending' as const };
    });
    return { ok: true, state: refreshed({ ...current, rows }, categories, action.type !== 'review') };
  } catch { return error('INVALID_STATE'); }
}

export function getWorkspaceView(state: ImportWorkspaceState, categories?: ReadonlySet<string>, page = 0, pageSize = 20) {
  if (!Number.isSafeInteger(page) || page < 0 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_RECORDS) return error('INVALID_PAGE');
  const result = revalidateWorkspace(state, categories); if (!result.ok) return result;
  const rows = result.state.rows;
  const stats = { total: rows.length, valid: rows.filter(row => row.validation === 'valid').length, invalid: rows.filter(row => row.validation === 'invalid').length, excluded: rows.filter(row => row.excluded).length, pendingReview: rows.filter(row => row.duplicateReview === 'pending').length, exportable: rows.filter(row => !row.excluded && row.validation === 'valid' && row.duplicateReview !== 'pending').length };
  return { ok: true as const, stats, page, pageSize, pageCount: Math.ceil(rows.length / pageSize), rows: rows.slice(page * pageSize, (page + 1) * pageSize), similarities: similarities(rows) };
}

export function prepareExport(state: ImportWorkspaceState, categories?: ReadonlySet<string>) {
  const result = revalidateWorkspace(state, categories); if (!result.ok) return result;
  const candidates: Candidate[] = [];
  for (const row of result.state.rows) {
    if (row.excluded || row.validation !== 'valid' || row.duplicateReview === 'pending') continue;
    const checked = validateManualRecord(row.values, row.originalIndex, 'json', categories);
    if (checked.status === 'valid') candidates.push({ ...checked.candidate });
  }
  if (candidates.length === 0) return error('NO_EXPORTABLE_ROWS');
  // Escapes also make HTML-like strings inert if text is later embedded; UI must still render as text.
  const jsonText = JSON.stringify(candidates).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const bytes = new TextEncoder().encode(jsonText);
  if (bytes.byteLength > MAX_FILE_BYTES) return error('EXPORT_TOO_LARGE');
  const roundTrip = parseManualImport(bytes, 'json', categories);
  if (roundTrip.status !== 'accepted' || roundTrip.invalidCount !== 0 || roundTrip.validCount !== candidates.length) return error('EXPORT_CONTRACT');
  return { ok: true as const, dataClassification: 'sensitive-in-memory' as const, jsonText, encoding: 'utf-8' as const, exportedCount: candidates.length, omittedCount: result.state.originalCount - candidates.length, byteLength: bytes.byteLength };
}

/** Drops this state reference only; does not physically erase engine memory. */
export function clearWorkspace(): null { return null; }
