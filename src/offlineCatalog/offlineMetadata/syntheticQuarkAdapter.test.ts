// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { listSyntheticQuarkMetadata, SYNTHETIC_QUARK_LIMITS, type SyntheticQuarkProvider } from './syntheticQuarkAdapter';
import { parseManualImport } from '../manualImport/index';
import { createWorkspace, getWorkspaceView } from '../manualImport/workspace';

const directory = Object.freeze({ kind: 'synthetic-non-root', id: 'synthetic-dir-test' });
const file = (filename = '合成.pdf', size: unknown = 12) => ({ filename, file_type: '1', size });
const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));
const wire = (items: unknown[] = [file()]) => encode({ items, lastPage: true });
const fixture = (bytes = wire()) => ({ mode: 'synthetic-only' as const, listDirectChildren: vi.fn(async () => bytes) });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('synthetic-only Quark request boundary', () => {
  it.each([1, 2, 3])('accepts a single page of %i records and round-trips into the workspace', async count => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    const provider = fixture(wire(Array.from({ length: count }, (_, i) => file(`合成${i}.pdf`))));
    const result = await listSyntheticQuarkMetadata(directory, provider);
    expect(result).toMatchObject({ status: 'accepted', exportedCount: count, verification: 'synthetic-only', realAccessAllowed: false });
    if (result.status !== 'accepted') throw new Error('Expected synthetic success');
    const parsed = parseManualImport(new TextEncoder().encode(result.jsonText), 'json');
    expect(parsed).toMatchObject({ status: 'accepted', validCount: count, invalidCount: 0 });
    expect(createWorkspace(parsed).ok).toBe(true);
    expect(provider.listDirectChildren).toHaveBeenCalledTimes(1);
    const request = provider.listDirectChildren.mock.calls[0] as unknown as [{ directoryId: string; pageSize: number; singlePage: boolean; signal: AbortSignal }];
    expect(request[0]).toMatchObject({ directoryId: directory.id, pageSize: 3, singlePage: true });
    expect(Object.isFrozen(request[0])).toBe(true);
    expect(Object.keys(request[0])).toEqual(['directoryId', 'pageSize', 'singlePage', 'signal']);
    expect(request[0].signal.aborted).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each([undefined, null, {}, '', { kind: 'synthetic-non-root' }, { kind: 'synthetic-non-root', id: '0' }, { kind: 'synthetic-non-root', id: '/' }, { kind: 'synthetic-non-root', id: 'root' }, { kind: 'synthetic-non-root', id: 'synthetic-dir-root' }, { kind: 'synthetic-non-root', id: 'synthetic-dir-0' }, { kind: 'synthetic-non-root', id: 'synthetic-dir-../x' }, { kind: 'synthetic-non-root', id: 12 }, { kind: 'real', id: 'synthetic-dir-test' }])('rejects missing/root/unproven directory case %# before any provider call', async value => {
    const provider = fixture();
    expect(await listSyntheticQuarkMetadata(value, provider)).toMatchObject({ status: 'rejected', code: 'INVALID_DIRECTORY', realAccessAllowed: false });
    expect(provider.listDirectChildren).not.toHaveBeenCalled();
  });
  it('does not invoke directory or provider property getters', async () => {
    const getter = vi.fn(() => { throw new Error('SYNTHETIC_CANARY'); });
    const provider = fixture(); const unsafeDirectory = { kind: 'synthetic-non-root' };
    Object.defineProperty(unsafeDirectory, 'id', { get: getter });
    expect(await listSyntheticQuarkMetadata(unsafeDirectory, provider)).toMatchObject({ code: 'INVALID_DIRECTORY' });
    const unsafeProvider = { mode: 'synthetic-only' };
    Object.defineProperty(unsafeProvider, 'listDirectChildren', { get: getter });
    expect(await listSyntheticQuarkMetadata(directory, unsafeProvider as SyntheticQuarkProvider)).toMatchObject({ code: 'REAL_PROVIDER_BLOCKED' });
    expect(getter).not.toHaveBeenCalled(); expect(provider.listDirectChildren).not.toHaveBeenCalled();
  });
  it('keeps real/default providers absent and blocked', async () => {
    expect(await listSyntheticQuarkMetadata(directory)).toMatchObject({ code: 'REAL_PROVIDER_BLOCKED' });
    const list = vi.fn();
    expect(await listSyntheticQuarkMetadata(directory, { mode: 'real', listDirectChildren: list } as unknown as SyntheticQuarkProvider)).toMatchObject({ code: 'REAL_PROVIDER_BLOCKED' });
    expect(list).not.toHaveBeenCalled();
  });
  it('counts directories in the three-item raw limit and returns no partial list at four', async () => {
    const provider = fixture(wire([file(), file(), file(), { file_type: '0' }]));
    expect(await listSyntheticQuarkMetadata(directory, provider)).toEqual({ status: 'rejected', code: 'TOO_MANY_ITEMS', summary: 'Synthetic metadata request rejected', realAccessAllowed: false });
    expect(provider.listDirectChildren).toHaveBeenCalledTimes(1);
  });
  it.each([{ lastPage: false }, { nextCursor: null }, { next_query_cursor: 'SYNTHETIC_CANARY' }, { cursor: '' }, { hasMore: false }, { has_more: true }])('rejects pagination/cursor presence case %# without follow-up', async pagination => {
    const provider = fixture(encode({ items: [file()], lastPage: true, ...pagination }));
    const result = await listSyntheticQuarkMetadata(directory, provider);
    expect(result).toMatchObject({ status: 'rejected', code: 'PAGINATION_BLOCKED' });
    expect(JSON.stringify(result).includes('SYNTHETIC_CANARY')).toBe(false);
    expect(provider.listDirectChildren).toHaveBeenCalledTimes(1);
  });
  it('accepts exactly 64 KiB including whitespace and rejects the extra byte before decoding', async () => {
    const small = wire(); const exact = new Uint8Array(65_536).fill(32); exact.set(small);
    expect(await listSyntheticQuarkMetadata(directory, fixture(exact))).toMatchObject({ status: 'accepted' });
    const oversized = new Uint8Array(65_537).fill(255);
    expect(await listSyntheticQuarkMetadata(directory, fixture(oversized))).toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
    expect(SYNTHETIC_QUARK_LIMITS).toEqual({ maxCalls: 1, pageSize: 3, timeoutMs: 10_000, responseBytes: 65_536 });
    expect(Object.isFrozen(SYNTHETIC_QUARK_LIMITS)).toBe(true);
  });
  it('counts raw UTF-8 bytes of discarded sensitive metadata rather than serialized six fields', async () => {
    const bytes = wire([{ ...file(), path: '合'.repeat(22_000) }]);
    expect(bytes.byteLength).toBeGreaterThan(65_536);
    expect(await listSyntheticQuarkMetadata(directory, fixture(bytes))).toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
  });
  it.each([new Uint8Array([255]), encode([]), encode({ items: null, lastPage: true }), encode({ items: [], lastPage: true, token: 'SYNTHETIC_CANARY' }), new TextEncoder().encode('{"items":[],"items":[],"lastPage":true}'), new TextEncoder().encode('{"items":[{"filename":"a","filename":"b","file_type":"1"}],"lastPage":true}')])('rejects malformed UTF-8/envelope/duplicate keys case %# anonymously', async bytes => {
    const result = await listSyntheticQuarkMetadata(directory, fixture(bytes));
    expect(result).toMatchObject({ status: 'rejected', code: 'INVALID_RESPONSE' });
    expect(JSON.stringify(result).includes('SYNTHETIC_CANARY')).toBe(false);
  });
  it.each([{ filename: '', file_type: '1' }, file('合成.pdf', -1), { filename: '未知.pdf' }, file('token=SYNTHETIC_CANARY')])('rejects the whole mixed batch on invalid metadata case %#', async invalid => {
    const result = await listSyntheticQuarkMetadata(directory, fixture(wire([file(), invalid])));
    expect(result).toEqual({ status: 'rejected', code: 'INVALID_METADATA', summary: 'Synthetic metadata request rejected', realAccessAllowed: false });
  });
  it('excludes directories, maps unknown extensions to other and preserves duplicate review', async () => {
    const result = await listSyntheticQuarkMetadata(directory, fixture(wire([file('重复.zip'), file('重复.zip'), { filename: '合成目录', file_type: '0' }])));
    expect(result).toMatchObject({ status: 'accepted', inputCount: 3, directoryCount: 1, exportedCount: 2 });
    if (result.status !== 'accepted') throw new Error('Expected success');
    expect(JSON.parse(result.jsonText).map((row: { fileType: string }) => row.fileType)).toEqual(['other', 'other']);
    const workspace = createWorkspace(parseManualImport(new TextEncoder().encode(result.jsonText), 'json'));
    if (!workspace.ok) throw new Error('Expected workspace');
    expect(getWorkspaceView(workspace.state)).toMatchObject({ stats: { pendingReview: 2, exportable: 0 } });
  });
  it('strips IDs, paths, links, tokens and private source/note without logs or persistence', async () => {
    const forbidden = vi.fn(() => { throw new Error('Forbidden side effect'); });
    for (const key of ['fetch', 'XMLHttpRequest', 'WebSocket', 'localStorage', 'sessionStorage', 'indexedDB']) vi.stubGlobal(key, forbidden);
    vi.stubGlobal('console', { log: forbidden, warn: forbidden, error: forbidden });
    const item = Object.freeze({ ...file(), fid: 'SYNTHETIC_CANARY', path: 'SYNTHETIC_CANARY', check_link: 'SYNTHETIC_CANARY', token: 'SYNTHETIC_CANARY', sourceLabel: 'SYNTHETIC_CANARY', note: 'SYNTHETIC_CANARY' });
    const bytes = wire([item]); const before = bytes.slice();
    const result = await listSyntheticQuarkMetadata(directory, fixture(bytes));
    expect(result.status).toBe('accepted'); expect(bytes).toEqual(before);
    expect(JSON.stringify(result).includes('SYNTHETIC_CANARY')).toBe(false); expect(forbidden).not.toHaveBeenCalled();
    if (result.status !== 'accepted') throw new Error('Expected success');
    expect(Object.keys(JSON.parse(result.jsonText)[0])).toEqual(['name', 'fileType', 'sizeBytes', 'categoryId', 'sourceLabel', 'note']);
  });
  it('handles synchronous throw and asynchronous rejection once with anonymous errors', async () => {
    for (const list of [vi.fn(() => { throw new Error('SYNTHETIC_CANARY'); }), vi.fn(async () => { throw new Error('SYNTHETIC_CANARY'); })]) {
      const result = await listSyntheticQuarkMetadata(directory, { mode: 'synthetic-only', listDirectChildren: list });
      expect(result).toEqual({ status: 'rejected', code: 'PROVIDER_FAILED', summary: 'Synthetic metadata request rejected', realAccessAllowed: false });
      expect(list).toHaveBeenCalledTimes(1);
    }
  });
  it('rejects at ten seconds, aborts signal, ignores late success and clears timeout', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    let late: ((value: Uint8Array) => void) | undefined;
    let signal: AbortSignal | undefined;
    const list = vi.fn((request: { signal: AbortSignal }) => { signal = request.signal; return new Promise<Uint8Array>(resolve => { late = resolve; }); });
    const result = listSyntheticQuarkMetadata(directory, { mode: 'synthetic-only', listDirectChildren: list });
    await vi.advanceTimersByTimeAsync(9_999); expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toMatchObject({ code: 'TIMEOUT' }); expect(signal?.aborted).toBe(true);
    late?.(wire()); await Promise.resolve(); expect(await result).toMatchObject({ code: 'TIMEOUT' });
    expect(list).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
  });
  it('handles late rejection without retry or unhandled rejection', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    let reject: ((reason: Error) => void) | undefined;
    const list = vi.fn(() => new Promise<Uint8Array>((_, fail) => { reject = fail; }));
    const result = listSyntheticQuarkMetadata(directory, { mode: 'synthetic-only', listDirectChildren: list });
    await vi.advanceTimersByTimeAsync(10_000); expect(await result).toMatchObject({ code: 'TIMEOUT' });
    reject?.(new Error('SYNTHETIC_CANARY')); await Promise.resolve(); await Promise.resolve();
    expect(list).toHaveBeenCalledTimes(1); expect(await result).toMatchObject({ code: 'TIMEOUT' });
  });
  it('accepts a result before the deadline and rejects a synchronous elapsed overrun', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    const provider = { mode: 'synthetic-only' as const, listDirectChildren: vi.fn(() => new Promise<Uint8Array>(resolve => setTimeout(() => resolve(wire()), 9_999))) };
    const early = listSyntheticQuarkMetadata(directory, provider);
    await vi.advanceTimersByTimeAsync(9_999); expect(await early).toMatchObject({ status: 'accepted' }); expect(vi.getTimerCount()).toBe(0);
    const blocking = { mode: 'synthetic-only' as const, listDirectChildren: vi.fn(async () => { vi.advanceTimersByTime(10_001); return wire(); }) };
    expect(await listSyntheticQuarkMetadata(directory, blocking)).toMatchObject({ code: 'TIMEOUT' }); expect(blocking.listDirectChildren).toHaveBeenCalledTimes(1);
  });
  it('has only the pure converter dependency and no real service/tool entry', () => {
    const source = readFileSync('src/offlineCatalog/offlineMetadata/syntheticQuarkAdapter.ts', 'utf8');
    expect(source.match(/^import .*$/gm)).toEqual(["import { convertMetadata, type ConversionResult } from './convertMetadata';"]);
    expect(source).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|console)\s*[.(]|\brequire\s*\(|\bimport\s*\(/);
  });
});
