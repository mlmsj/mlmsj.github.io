// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { build } from 'vite';
import { convertMetadata, type MetadataSource } from './convertMetadata';
import { MAX_FILE_BYTES, parseManualImport } from '../manualImport/index';
import { createWorkspace, getWorkspaceView } from '../manualImport/workspace';

const file = (name = '合成练习.PDF', size: unknown = 120) => ({ filename: name, file_type: '1', size });
afterEach(() => vi.unstubAllGlobals());
function success(input: unknown, source: MetadataSource = 'quark', budget = MAX_FILE_BYTES) {
  const result = convertMetadata(source, input, budget);
  if (result.status !== 'accepted') throw new Error('Expected synthetic conversion success');
  return result;
}
const rows = (input: unknown) => JSON.parse(success(input).jsonText) as Record<string, unknown>[];

describe('synthetic metadata contracts', () => {
  it.each(['quark', 'baidu-synthetic'] as const)('round-trips %s through the strict parser and workspace', source => {
    const input = source === 'quark' ? [file()] : [{ server_filename: '合成练习.PDF', isdir: 0, size: 120 }];
    const converted = success(input, source);
    expect(converted.schemaEvidence).toBe(source === 'quark' ? 'quark-documented' : 'baidu-synthetic-assumption');
    const parsed = parseManualImport(new TextEncoder().encode(converted.jsonText), 'json');
    expect(parsed).toMatchObject({ status: 'accepted', totalRecords: 1, validCount: 1, invalidCount: 0 });
    expect(createWorkspace(parsed).ok).toBe(true);
    expect(Object.keys(JSON.parse(converted.jsonText)[0])).toEqual(['name', 'fileType', 'sizeBytes', 'categoryId', 'sourceLabel', 'note']);
    expect(JSON.parse(converted.jsonText)[0]).toMatchObject({ name: '合成练习.PDF', fileType: 'pdf', sizeBytes: 120, categoryId: null, note: null });
  });
  it.each(['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'pdf'])('maps terminal extension %s', ext => {
    expect(rows([file(`合成.${ext.toUpperCase()}`)])[0].fileType).toBe(ext);
  });
  it.each(['合成.zip', '合成', '.pdf', '合成.pdf.exe'])('uses other for unsupported extension case %#', name => {
    expect(rows([file(name)])[0].fileType).toBe('other');
  });
  it.each([undefined, null])('missing size case %# stays null', size => {
    expect(rows([{ filename: ' 合成.pdf ', file_type: '1', size }])[0]).toMatchObject({ name: '合成.pdf', sizeBytes: null });
  });
  it.each([0, Number.MAX_SAFE_INTEGER])('preserves valid byte size case %#', size => expect(rows([file('合成', size)])[0].sizeBytes).toBe(size));
  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, '120', true, {}])('rejects invalid byte size case %# anonymously', size => {
    const result = success([file('合成', size)]);
    expect(result.exportedCount).toBe(0); expect(result.rejectedRows).toEqual([{ index: 0, code: 'INVALID_SIZE' }]);
  });
  it.each([undefined, '', ' ', 'a'.repeat(201), '\u0000', '\ud800'])('rejects missing/invalid filename case %#', name => {
    const result = success([{ filename: name, file_type: '1' }]);
    expect(result.rejectedRows).toEqual([{ index: 0, code: 'INVALID_NAME' }]);
  });
  it('counts Unicode code points without truncation', () => {
    expect(success([file('😀'.repeat(200))]).exportedCount).toBe(1);
    expect(success([file('😀'.repeat(201))]).exportedCount).toBe(0);
  });
  it.each(['folder/sample.pdf', 'folder\\sample.pdf', 'https://example.invalid/x', 'token=SYNTHETIC_CANARY', '提取码=SYNTHETIC_CANARY', 'fid=SYNTHETIC_CANARY'])('rejects path/credential-bearing filename case %# without echo', name => {
    const result = success([file(name)]);
    expect(result.rejectedRows).toEqual([{ index: 0, code: 'SENSITIVE_NAME' }]);
    expect(JSON.stringify(result).includes('SYNTHETIC_CANARY')).toBe(false);
  });
  it('omits directories and rejects unknown kind without inferring from extension', () => {
    const result = success([{ filename: '目录.pdf', file_type: '0' }, { filename: '未知.pdf' }, file()]);
    expect(result).toMatchObject({ inputCount: 3, directoryCount: 1, exportedCount: 1, rejectedRows: [{ index: 1, code: 'UNKNOWN_KIND' }] });
    expect(success([{ server_filename: '目录', isdir: 1 }, { server_filename: '未知', isdir: '0' }], 'baidu-synthetic')).toMatchObject({ directoryCount: 1, exportedCount: 0 });
  });
  it('preserves same names/order and delegates duplicate review to existing workspace', () => {
    const output = success([file('重复.pdf', 1), file('重复.pdf', 2), file('第三.txt', 3)]);
    expect(JSON.parse(output.jsonText).map((row: { sizeBytes: number }) => row.sizeBytes)).toEqual([1, 2, 3]);
    const parsed = parseManualImport(new TextEncoder().encode(output.jsonText), 'json');
    const workspace = createWorkspace(parsed);
    if (!workspace.ok) throw new Error('Expected workspace');
    const view = getWorkspaceView(workspace.state);
    expect(view).toMatchObject({ ok: true, stats: { pendingReview: 2, exportable: 1 } });
  });
  it('strips every extra field without invoking extra getters or retaining raw values', () => {
    const input = { ...file(), fid: 'SYNTHETIC_CANARY', path: 'SYNTHETIC_CANARY', token: 'SYNTHETIC_CANARY', note: 'SYNTHETIC_CANARY', sourceLabel: 'SYNTHETIC_CANARY', categoryId: 'invented' };
    const getter = vi.fn(() => { throw new Error('Synthetic private exception'); });
    Object.defineProperty(input, 'cookie', { get: getter });
    const output = success([input]);
    expect(getter).not.toHaveBeenCalled(); expect(JSON.stringify(output).includes('SYNTHETIC_CANARY')).toBe(false);
    expect(JSON.parse(output.jsonText)[0]).toMatchObject({ sourceLabel: '夸克网盘', categoryId: null, note: null });
  });
  it('counts all 100 entries including directories/rejected entries, rejects 101 before inspection', () => {
    const input = Array.from({ length: 100 }, (_, i) => i === 0 ? {} : { file_type: '0' });
    expect(success(input)).toMatchObject({ inputCount: 100, directoryCount: 99, exportedCount: 0 });
    const oversized = new Array(101); const getter = vi.fn(); Object.defineProperty(oversized, '0', { get: getter });
    expect(convertMetadata('quark', oversized)).toEqual({ status: 'rejected', code: 'TOO_MANY_RECORDS', summary: 'Conversion rejected' });
    expect(getter).not.toHaveBeenCalled();
  });
  it('accepts exact encoded byte budget and rejects one fewer without partial JSON', () => {
    const input = [file('合成😀.pdf')]; const output = success(input);
    expect(output.byteLength).toBe(new TextEncoder().encode(output.jsonText).byteLength);
    expect(output.byteLength).toBeGreaterThan(output.jsonText.length);
    expect(success(input, 'quark', output.byteLength).jsonText).toBe(output.jsonText);
    expect(convertMetadata('quark', input, output.byteLength - 1)).toEqual({ status: 'rejected', code: 'OUTPUT_TOO_LARGE', summary: 'Conversion rejected' });
    expect(success([], 'quark', 2).jsonText).toBe('[]');
  });
  it.each([1, MAX_FILE_BYTES + 1, Infinity, 2.5])('never widens the 1 MiB budget case %#', budget => expect(convertMetadata('quark', [], budget)).toMatchObject({ status: 'rejected', code: 'INVALID_BUDGET' }));
  it('handles maximum escaped names and 100 records under the default cap', () => {
    const result = success(Array.from({ length: 100 }, () => file('<'.repeat(200))));
    expect(result.byteLength).toBeLessThanOrEqual(MAX_FILE_BYTES);
    expect(result.jsonText).not.toContain('<');
  });
  it('does not mutate frozen input and does not execute relevant accessors', () => {
    const input = Object.freeze([Object.freeze(file())]);
    expect(convertMetadata('quark', input)).toEqual(convertMetadata('quark', input));
    const accessor = vi.fn(() => '合成'); const record = { file_type: '1' };
    Object.defineProperty(record, 'filename', { get: accessor });
    expect(success([record]).rejectedRows).toEqual([{ index: 0, code: 'INVALID_RECORD' }]); expect(accessor).not.toHaveBeenCalled();
  });
  it('rejects sparse/accessor rows, nested records and throwing proxies without leaking exceptions', () => {
    const accessor = vi.fn(); const input = new Array(2); Object.defineProperty(input, '0', { get: accessor });
    expect(success(input).rejectedRows).toHaveLength(2); expect(accessor).not.toHaveBeenCalled();
    expect(success([[], null, new Date()]).rejectedRows).toHaveLength(3);
    const proxy = new Proxy({}, { getPrototypeOf() { throw new Error('SYNTHETIC_CANARY'); } });
    expect(convertMetadata('quark', [proxy])).toEqual({ status: 'rejected', code: 'INVALID_INPUT', summary: 'Conversion rejected' });
  });
  it('rejects wrong input/source', () => {
    expect(convertMetadata('quark', {})).toMatchObject({ code: 'INVALID_INPUT' });
    expect(convertMetadata('unknown' as MetadataSource, [])).toMatchObject({ code: 'INVALID_SOURCE' });
  });
  it('performs no network, storage, console, URL or file operation', () => {
    const forbidden = vi.fn(() => { throw new Error('Forbidden synthetic side effect'); });
    for (const key of ['fetch', 'XMLHttpRequest', 'WebSocket', 'localStorage', 'sessionStorage', 'indexedDB', 'URL', 'console']) vi.stubGlobal(key, key === 'console' ? { log: forbidden, error: forbidden, warn: forbidden } : forbidden);
    expect(success([file()]).exportedCount).toBe(1); expect(forbidden).not.toHaveBeenCalled();
    const source = readFileSync('src/offlineCatalog/offlineMetadata/convertMetadata.ts', 'utf8');
    expect(source.match(/^import .*$/gm)).toEqual(["import { MAX_FILE_BYTES, MAX_RECORDS, parseManualImport } from '../manualImport/index';"]);
    expect(source).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|console)\s*[.(]/);
  });
  it('keeps the converter outside the default production module graph', async () => {
    const built = await build({ configFile: 'vite.config.ts', configLoader: 'runner', logLevel: 'silent', build: { write: false, copyPublicDir: false } });
    for (const bundle of Array.isArray(built) ? built : [built]) {
      if (!('output' in bundle)) throw new Error('Expected in-memory output');
      for (const output of bundle.output) if (output.type === 'chunk') expect(Object.keys(output.modules).some(id => /offlineMetadata[/\\]/.test(id))).toBe(false);
    }
  }, 60_000);
});
