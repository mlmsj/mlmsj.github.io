// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseManualImport } from './index';
import { clearWorkspace, createWorkspace, getWorkspaceView, prepareExport, revalidateWorkspace, updateWorkspace, type ImportWorkspaceState, type WorkspaceAction, type WorkspaceResult } from './workspace';
import type { Field, ImportResult } from './types';
const cats = new Set(['usable']);
const parsed = (records: unknown[], categories: ReadonlySet<string> = cats) => parseManualImport(new TextEncoder().encode(JSON.stringify(records)), 'json', categories);
const unwrap = (result: WorkspaceResult): ImportWorkspaceState => { if (!result.ok) throw new Error(result.code); return result.state; };
const stateOf = (records: unknown[]) => unwrap(createWorkspace(parsed(records), cats));
const edited = (state: ImportWorkspaceState, field: Field, value: string | number | boolean | null, id = 'local-row-0') => unwrap(updateWorkspace(state, { type: 'edit', id, field, value }, cats));
const reviewed = (state: ImportWorkspaceState, id = 'local-row-0', value = true) => unwrap(updateWorkspace(state, { type: 'review', id, reviewed: value }, cats));
const excluded = (state: ImportWorkspaceState, id = 'local-row-0', value = true) => unwrap(updateWorkspace(state, { type: 'exclude', id, excluded: value }, cats));
const duplicates = () => stateOf([{ name: 'Ａ  b', fileType: 'pdf' }, { name: 'a b', fileType: 'pdf' }]);
function freezeDeep(value: unknown): void {
  if (value && typeof value === 'object') { Object.values(value).forEach(freezeDeep); Object.freeze(value); }
}

describe('memory model and boundaries', () => {
  it('creates stable session-local rows in original order and independent nested data', () => {
    const result = parsed([{ name: 'one' }, { name: 'two' }]);
    const state = unwrap(createWorkspace(result, cats));
    expect(state.rows.map(row => [row.id, row.originalIndex, row.values.name])).toEqual([['local-row-0', 0, 'one'], ['local-row-1', 1, 'two']]);
    expect(state.dataClassification).toBe('sensitive-in-memory');
    if (result.status === 'accepted' && result.rows[0].status === 'valid') result.rows[0].candidate.name = 'changed';
    expect(state.rows[0].values.name).toBe('one');
  });
  it('creates invalid blank placeholders without recovering private invalid input', () => {
    const result = parsed([{ name: 'PRIVATE_CANARY', fileType: 'bad' }, { name: 'good' }]);
    const state = unwrap(createWorkspace(result, cats));
    expect(state.rows[0]).toMatchObject({ validation: 'invalid', values: { name: '', fileType: null }, errors: [{ code: 'REQUIRED', field: 'name', index: 0 }] });
    expect(JSON.stringify(state)).not.toContain('PRIVATE_CANARY');
    expect(edited(state, 'name', 'reentered').rows[0].validation).toBe('valid');
  });
  it('rejects batch failure and 101 parser records', () => {
    expect(createWorkspace(parsed(Array.from({ length: 101 }, () => ({ name: 'a' }))), cats)).toEqual({ ok: false, code: 'IMPORT_REJECTED' });
  });
  it('rejects forged 101-row success and changed totals', () => {
    const result = parsed([{ name: 'a' }]);
    if (result.status !== 'accepted') throw new Error('fixture');
    expect(createWorkspace({ ...result, totalRecords: 2 }, cats)).toEqual({ ok: false, code: 'INVALID_STATE' });
    const rows = Array.from({ length: 101 }, (_, index) => ({ ...result.rows[0], index }));
    expect(createWorkspace({ ...result, totalRecords: 101, validCount: 101, rows }, cats)).toEqual({ ok: false, code: 'INVALID_STATE' });
  });
  it('does not add rows through repeated edits, exclusions and restorations at 100', () => {
    let state = stateOf(Array.from({ length: 100 }, (_, i) => ({ name: `unique ${i}` })));
    for (let i = 0; i < 5; i++) { state = excluded(state); state = excluded(state, 'local-row-0', false); state = edited(state, 'note', `edit ${i}`); }
    expect(state.originalCount).toBe(100); expect(state.rows).toHaveLength(100);
    expect(updateWorkspace(state, { type: 'edit', id: 'local-row-100', field: 'name', value: 'new' }, cats)).toEqual({ ok: false, code: 'UNKNOWN_ROW' });
  });
  it('rejects sparse state arrays and accessor fields without executing getters', () => {
    const state = stateOf([{ name: 'a' }]); const getter = vi.fn(() => 'PRIVATE_CANARY');
    const values = { ...state.rows[0].values }; Object.defineProperty(values, 'name', { get: getter });
    expect(revalidateWorkspace({ ...state, rows: [{ ...state.rows[0], values }] }, cats)).toEqual({ ok: false, code: 'INVALID_STATE' });
    expect(getter).not.toHaveBeenCalled();
    expect(revalidateWorkspace({ ...state, rows: new Array(1) }, cats)).toEqual({ ok: false, code: 'INVALID_STATE' });
  });
  it.each([null, {}, { version: 1 }, { rows: [], originalCount: 101 }])('rejects illegal input state %j', value => {
    expect(revalidateWorkspace(value as unknown as ImportWorkspaceState, cats)).toEqual({ ok: false, code: 'INVALID_STATE' });
    expect(prepareExport(value as unknown as ImportWorkspaceState, cats)).toEqual({ ok: false, code: 'INVALID_STATE' });
  });
  it('rejects unknown state properties and extra credential fields', () => {
    const state = stateOf([{ name: 'a' }]);
    expect(revalidateWorkspace({ ...state, token: 'PRIVATE_CANARY' } as ImportWorkspaceState, cats)).toEqual({ ok: false, code: 'INVALID_STATE' });
    expect(revalidateWorkspace({ ...state, rows: [{ ...state.rows[0], values: { ...state.rows[0].values, password: 'PRIVATE_CANARY' } }] } as unknown as ImportWorkspaceState, cats)).toEqual({ ok: false, code: 'INVALID_STATE' });
  });
  it('uses current classification on creation rather than trusting prior success', () => {
    const state = unwrap(createWorkspace(parsed([{ name: 'a', categoryId: 'usable' }]), new Set()));
    expect(state.rows[0].errors[0].code).toBe('INVALID_CATEGORY');
  });
  it('clears by dropping reference only', () => expect(clearWorkspace()).toBeNull());
});

describe('immutable edits and revalidation', () => {
  it.each([
    ['name', '😀'.repeat(200), true], ['name', '😀'.repeat(201), false], ['name', '   ', false],
    ['fileType', 'pdf', true], ['fileType', 'PDF', false],
    ['sizeBytes', 0, true], ['sizeBytes', Number.MAX_SAFE_INTEGER, true], ['sizeBytes', Number.MAX_SAFE_INTEGER + 1, false], ['sizeBytes', -1, false], ['sizeBytes', 1.5, false], ['sizeBytes', '1e3', false], ['sizeBytes', true, false], ['sizeBytes', NaN, false], ['sizeBytes', Infinity, false],
    ['categoryId', 'usable', true], ['categoryId', 'removed', false],
    ['sourceLabel', '😀'.repeat(50), true], ['sourceLabel', '😀'.repeat(51), false],
    ['note', '😀'.repeat(500), true], ['note', '😀'.repeat(501), false], ['note', '\u0000', false], ['note', '\ud800', false],
  ] as const)('revalidates %s with boundary value', (field, value, valid) => {
    const state = edited(stateOf([{ name: 'a' }]), field, value);
    expect(state.rows[0].validation).toBe(valid ? 'valid' : 'invalid');
    expect(prepareExport(state, cats).ok).toBe(valid);
  });
  it.each(['name', 'fileType', 'categoryId', 'sourceLabel', 'note'] as const)('rejects boolean text %s', field => expect(edited(stateOf([{ name: 'a' }]), field, true).rows[0].validation).toBe('invalid'));
  it('normalizes optional empty fields only for export and preserves editable whitespace', () => {
    const state = edited(edited(stateOf([{ name: 'a' }]), 'name', ' a '), 'note', '  ');
    expect(state.rows[0].values.name).toBe(' a ');
    const output = prepareExport(state, cats); expect(output.ok).toBe(true);
    if (output.ok) expect(JSON.parse(output.jsonText)[0]).toMatchObject({ name: 'a', note: null });
  });
  it('marks stale category invalid, allows explicit correction and current category restoration', () => {
    const initial = stateOf([{ name: 'a', categoryId: 'usable' }]);
    const changed = unwrap(revalidateWorkspace(initial, new Set()));
    expect(changed.rows[0].validation).toBe('invalid');
    expect(prepareExport(initial, new Set())).toEqual({ ok: false, code: 'NO_EXPORTABLE_ROWS' });
    expect(unwrap(revalidateWorkspace(initial)).rows[0].errors[0].code).toBe('CATEGORY_UNCONFIRMED');
    expect(edited(changed, 'categoryId', null).rows[0].validation).toBe('valid');
    expect(unwrap(revalidateWorkspace(changed, cats)).rows[0].validation).toBe('valid');
  });
  it.each(['path', '__proto__', 'constructor', 'password'])('rejects illegal editable field %s anonymously', field => {
    expect(updateWorkspace(stateOf([{ name: 'a' }]), { type: 'edit', id: 'local-row-0', field, value: 'PRIVATE_CANARY' } as WorkspaceAction, cats)).toEqual({ ok: false, code: 'INVALID_FIELD' });
  });
  it.each([{ type: 'append', id: 'local-row-0' }, { type: 'edit', id: 'local-row-0', field: 'name', value: {} }, { type: 'exclude', id: 'local-row-0', excluded: 'yes' }, { type: 'review', id: 'local-row-0', reviewed: 1 }])('rejects unsafe action %j', action => expect(updateWorkspace(stateOf([{ name: 'a' }]), action as WorkspaceAction, cats).ok).toBe(false));
  it.each(['edit', 'exclude', 'review'] as const)('rejects unknown row for %s', type => {
    const action = type === 'edit' ? { type, id: 'UNKNOWN_CANARY', field: 'name' as const, value: 'PRIVATE_CANARY' } : type === 'exclude' ? { type, id: 'UNKNOWN_CANARY', excluded: true } : { type, id: 'UNKNOWN_CANARY', reviewed: true };
    expect(updateWorkspace(stateOf([{ name: 'a' }]), action, cats)).toEqual({ ok: false, code: 'UNKNOWN_ROW' });
  });
  it('rejects accessor actions', () => {
    const getter = vi.fn(); const action = { id: 'local-row-0', field: 'name', value: 'a' };
    Object.defineProperty(action, 'type', { get: getter, enumerable: true });
    expect(updateWorkspace(stateOf([{ name: 'a' }]), action as WorkspaceAction, cats)).toEqual({ ok: false, code: 'INVALID_ACTION' }); expect(getter).not.toHaveBeenCalled();
  });
  it('operates on frozen inputs and does not share nested state or errors', () => {
    const initial = stateOf([{ name: 'a' }, { name: 'b' }]); const before = JSON.stringify(initial); freezeDeep(initial);
    const next = edited(initial, 'name', ''); expect(JSON.stringify(initial)).toBe(before);
    expect(next.rows).not.toBe(initial.rows); expect(next.rows[1]).not.toBe(initial.rows[1]); expect(next.rows[1].values).not.toBe(initial.rows[1].values);
    const fresh = unwrap(revalidateWorkspace(next, cats)); expect(fresh.rows[0].errors[0]).not.toBe(next.rows[0].errors[0]);
    const page = getWorkspaceView(fresh, cats); if (!page.ok) throw new Error('fixture'); expect(page.rows[0].values).not.toBe(fresh.rows[0].values);
  });
});

describe('conservative similarity and human review', () => {
  it('uses normalized name plus normalized type, without cloud identity', () => {
    const state = duplicates(); const view = getWorkspaceView(state, cats); if (!view.ok) throw new Error('fixture');
    expect(view.similarities).toEqual([{ leftId: 'local-row-0', rightId: 'local-row-1', reason: 'similar-name-and-type', requiresHumanReview: true }]);
    expect(view.stats.pendingReview).toBe(2); expect(prepareExport(state, cats)).toEqual({ ok: false, code: 'NO_EXPORTABLE_ROWS' });
    const same = edited(state, 'fileType', ' pdf '); expect(same.rows[0].duplicateReview).toBe('pending');
    const different = edited(state, 'fileType', 'txt'); expect(different.rows.every(row => row.duplicateReview === 'not-needed')).toBe(true);
  });
  it('reviews rows individually, never merges, permits revoke', () => {
    const one = reviewed(duplicates()); expect(prepareExport(one, cats)).toMatchObject({ exportedCount: 1, omittedCount: 1 });
    const both = reviewed(one, 'local-row-1'); expect(prepareExport(both, cats)).toMatchObject({ exportedCount: 2 }); expect(both.rows).toHaveLength(2);
    const revoked = reviewed(both, 'local-row-0', false); expect(revoked.rows[0].duplicateReview).toBe('pending');
    expect(prepareExport(revoked, cats)).toMatchObject({ exportedCount: 1 });
  });
  it('invalidates every approval on edit, exclusion and restoration', () => {
    const both = reviewed(reviewed(duplicates()), 'local-row-1');
    const changed = edited(both, 'note', 'changed'); expect(changed.rows.every(row => row.duplicateReview === 'pending')).toBe(true);
    const removed = excluded(both); expect(removed.rows[0].excluded).toBe(true); expect(prepareExport(removed, cats)).toMatchObject({ exportedCount: 1 });
    const restored = excluded(removed, 'local-row-0', false); expect(restored.rows.every(row => row.duplicateReview === 'pending')).toBe(true);
  });
  it('does not consider invalid or excluded rows similar', () => {
    const invalid = edited(duplicates(), 'name', ''); const view = getWorkspaceView(invalid, cats);
    expect(view).toMatchObject({ similarities: [], stats: { invalid: 1, exportable: 1 } });
    expect(updateWorkspace(invalid, { type: 'review', id: 'local-row-0', reviewed: true }, cats)).toEqual({ ok: false, code: 'NO_DUPLICATE' });
  });
  it('invalidates old review if current categories introduce another similar row', () => {
    let state = stateOf([{ name: 'same' }, { name: 'same' }, { name: 'same', categoryId: 'usable' }]);
    state = unwrap(revalidateWorkspace(state, new Set()));
    state = unwrap(updateWorkspace(state, { type: 'review', id: 'local-row-0', reviewed: true }, new Set()));
    state = unwrap(updateWorkspace(state, { type: 'review', id: 'local-row-1', reviewed: true }, new Set()));
    expect(prepareExport(state, new Set())).toMatchObject({ exportedCount: 2 });
    expect(prepareExport(state, cats)).toEqual({ ok: false, code: 'NO_EXPORTABLE_ROWS' });
    const fresh = unwrap(revalidateWorkspace(state, cats)); expect(fresh.rows.every(row => row.duplicateReview === 'pending')).toBe(true);
    expect(fresh.rows[0].similarRowIds).toEqual(['local-row-1', 'local-row-2']);
  });
});

describe('safe export and pagination', () => {
  it('exports only valid, included, sufficiently reviewed records', () => {
    let state = stateOf([{ name: 'good' }, { name: 'same' }, { name: 'same' }, { name: 'bad', fileType: 'wrong' }, { name: 'excluded' }, { name: 'category', categoryId: 'usable' }]);
    state = excluded(state, 'local-row-4'); const output = prepareExport(state, new Set());
    expect(output).toMatchObject({ ok: true, exportedCount: 1, omittedCount: 5 });
    if (output.ok) expect(JSON.parse(output.jsonText).map((row: { name: string }) => row.name)).toEqual(['good']);
  });
  it('serializes exactly six keys and round-trips special characters and HTML as text', () => {
    const text = '<script>"&\\\n😀\u2028</script>';
    const state = stateOf([{ name: text, note: text }]); const output = prepareExport(state, cats); if (!output.ok) throw new Error(output.code);
    expect(output.jsonText).not.toContain('<script>'); expect(output.encoding).toBe('utf-8'); expect(output.byteLength).toBe(new TextEncoder().encode(output.jsonText).length);
    expect(Object.keys(JSON.parse(output.jsonText)[0])).toEqual(['name', 'fileType', 'sizeBytes', 'categoryId', 'sourceLabel', 'note']);
    expect(JSON.parse(output.jsonText)[0]).toMatchObject({ name: text, note: text });
    expect(output.jsonText).not.toMatch(/local-row-|originalIndex|duplicateReview|errors|validation|dataClassification/);
    expect(parseManualImport(new TextEncoder().encode(output.jsonText), 'json', cats)).toMatchObject({ validCount: 1, invalidCount: 0 });
  });
  it('checks control characters and forged validation at export time', () => {
    const state = stateOf([{ name: 'a' }]);
    const tampered = { ...state, rows: [{ ...state.rows[0], values: { ...state.rows[0].values, name: '\u0000' }, validation: 'valid' as const, errors: [] }] };
    expect(prepareExport(tampered, cats)).toEqual({ ok: false, code: 'NO_EXPORTABLE_ROWS' });
  });
  it('blocks output exceeding the original 1 MiB reimport bound', () => {
    const state = edited(stateOf([{ name: 'a' }]), 'categoryId', 'x'.repeat(1_048_576));
    const hugeCategories = new Set(['x'.repeat(1_048_576)]);
    expect(prepareExport(state, hugeCategories)).toEqual({ ok: false, code: 'EXPORT_TOO_LARGE' });
  });
  it('zero records and all-excluded records cannot export', () => {
    expect(prepareExport(stateOf([]), cats)).toEqual({ ok: false, code: 'NO_EXPORTABLE_ROWS' });
    expect(prepareExport(excluded(stateOf([{ name: 'a' }])), cats)).toEqual({ ok: false, code: 'NO_EXPORTABLE_ROWS' });
  });
  it('paginates stable original order, without filtering excluded rows out of total', () => {
    const state = excluded(stateOf(Array.from({ length: 25 }, (_, i) => ({ name: `row ${i}` }))));
    const view = getWorkspaceView(state, cats, 1, 20); expect(view).toMatchObject({ stats: { total: 25, excluded: 1, exportable: 24 }, pageCount: 2 });
    if (view.ok) expect(view.rows.map(row => row.originalIndex)).toEqual([20, 21, 22, 23, 24]);
    expect(getWorkspaceView(state, cats, 99, 20)).toMatchObject({ rows: [] });
  });
  it.each([[-1, 20], [0.5, 20], [0, 0], [0, 101], [Infinity, 20]])('rejects invalid pagination %s/%s', (page, size) => expect(getWorkspaceView(stateOf([]), cats, page, size)).toEqual({ ok: false, code: 'INVALID_PAGE' }));
  it('is repeatable, does not mutate or retain categories/state', () => {
    const state = stateOf([{ name: 'a', categoryId: 'usable' }]); const before = JSON.stringify(state); const beforeCats = [...cats]; freezeDeep(state);
    expect(prepareExport(state, cats)).toEqual(prepareExport(state, cats)); expect(JSON.stringify(state)).toBe(before); expect([...cats]).toEqual(beforeCats);
    const next = unwrap(revalidateWorkspace(state, cats)); const separate = new Set(['usable']); separate.clear(); expect(next.rows[0].validation).toBe('valid');
  });
  it('rejects unknown field/ID with no value disclosure', () => {
    const result = updateWorkspace(stateOf([{ name: 'a' }]), { type: 'edit', id: 'PRIVATE_ID', field: 'note', value: 'PRIVATE_NOTE' }, cats);
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE|stack|note/);
  });
  it('has no persistence, network, downloads or external imports and calls none at runtime', () => {
    const source = readFileSync(new URL('workspace.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/\b(fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB|cookie|sendBeacon|console|Blob|document|window|eval|Function)\b|node:|createObjectURL|\.click\(/);
    for (const match of source.matchAll(/from ['"]([^'"]+)['"]/g)) expect(match[1]).toMatch(/^\.\.?(?:\/)/);
    const forbidden = vi.fn(() => { throw new Error('forbidden'); });
    for (const key of ['fetch', 'Blob', 'localStorage', 'sessionStorage', 'indexedDB']) vi.stubGlobal(key, forbidden);
    try { const state = edited(stateOf([{ name: 'a' }]), 'note', 'text'); expect(prepareExport(state, cats).ok).toBe(true); expect(forbidden).not.toHaveBeenCalled(); }
    finally { vi.unstubAllGlobals(); }
  });
  it('rejects unsupported creation data safely', () => {
    expect(createWorkspace(null as unknown as ImportResult, cats)).toEqual({ ok: false, code: 'INVALID_STATE' });
    const result = parsed([{ name: 'a' }]); if (result.status !== 'accepted') throw new Error('fixture');
    expect(createWorkspace({ ...result, validCount: 0, invalidCount: 1 }, cats)).toEqual({ ok: false, code: 'INVALID_STATE' });
  });
});
