import { fail, ParseFailure, parseCsv, parseJson, type RawRecord } from './structure';
import { FIELDS, type Candidate, type Field, type Format, type ImportResult, type Issue, type RowCode } from './types';
export type { Candidate, Format, ImportResult, Issue } from './types';
export const MAX_FILE_BYTES = 1_048_576;
export const MAX_RECORDS = 100;
const fileTypes = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'other']);
// Intentional input safety policy; TAB/CR/LF remain allowed.
// eslint-disable-next-line no-control-regex
const unsafeText = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/;
const unpairedSurrogate = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u;

/** Shared business validation; structural/unknown-key gates belong to callers. */
export function validateManualRecord(row: RawRecord, index: number, format: Format, categories?: ReadonlySet<string>) {
  const errors: Issue[] = [];
  const issue = (field: Field, code: RowCode) => errors.push({ field, code, index });
  const candidate: Candidate = { name: '', fileType: null, sizeBytes: null, categoryId: null, sourceLabel: null, note: null };
  for (const field of FIELDS) {
    const raw = row[field];
    if (field === 'sizeBytes') {
      if (raw == null || (format === 'csv' && typeof raw === 'string' && !raw.trim())) continue;
      const number = format === 'csv' && typeof raw === 'string' && /^\d+$/.test(raw.trim()) ? Number(raw.trim()) : raw;
      if (typeof number !== 'number' || !Number.isSafeInteger(number) || number < 0) issue(field, 'INVALID_SIZE');
      else candidate.sizeBytes = number;
      continue;
    }
    if (raw == null) { if (field === 'name') issue(field, 'REQUIRED'); continue; }
    if (typeof raw !== 'string') { issue(field, 'INVALID_TYPE'); continue; }
    if (unsafeText.test(raw) || unpairedSurrogate.test(raw)) { issue(field, 'INVALID_TEXT'); continue; }
    const value = raw.trim();
    if (!value) { if (field === 'name') issue(field, 'REQUIRED'); continue; }
    const max = field === 'name' ? 200 : field === 'sourceLabel' ? 50 : field === 'note' ? 500 : undefined;
    if (max !== undefined && [...value].length > max) { issue(field, 'TOO_LONG'); continue; }
    if (field === 'fileType' && !fileTypes.has(value)) { issue(field, 'INVALID_FILE_TYPE'); continue; }
    if (field === 'categoryId') {
      if (!categories) { issue(field, 'CATEGORY_UNCONFIRMED'); continue; }
      if (!categories.has(value)) { issue(field, 'INVALID_CATEGORY'); continue; }
    }
    candidate[field] = value;
  }
  return errors.length ? { index, status: 'invalid' as const, errors } : { index, status: 'valid' as const, candidate };
}

/** categories contains only IDs the caller has already verified as usable. */
export function parseManualImport(bytes: Uint8Array, format: Format, categories?: ReadonlySet<string>): ImportResult {
  try {
    if (bytes.byteLength === 0) fail('EMPTY_FILE');
    if (bytes.byteLength > MAX_FILE_BYTES) fail('FILE_TOO_LARGE');
    if (format !== 'csv' && format !== 'json') fail('INVALID_FORMAT');
    let text: string;
    try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes); }
    catch { return { status: 'rejected', code: 'INVALID_UTF8', summary: 'Import rejected' }; }
    if (unsafeText.test(text)) fail('CONTROL_CHARACTER');
    const records = format === 'csv' ? parseCsv(text) : parseJson(text);
    const rows = records.map((row, index) => validateManualRecord(row, index, format, categories));
    const validCount = rows.filter(row => row.status === 'valid').length;
    return { status: 'accepted', dataClassification: 'sensitive-in-memory', totalRecords: rows.length, validCount, invalidCount: rows.length - validCount, rows };
  } catch (error) {
    return { status: 'rejected', code: error instanceof ParseFailure ? error.code : format === 'csv' ? 'CSV_SYNTAX' : 'JSON_SYNTAX', summary: 'Import rejected' };
  }
}
