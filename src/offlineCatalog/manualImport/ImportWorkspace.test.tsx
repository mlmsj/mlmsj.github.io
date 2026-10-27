import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Blob as NodeBlob } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ImportWorkspace } from './ImportWorkspace';
import { categories } from '../../categories';
import { parseManualImport } from './index';
const blobs: NodeBlob[] = [];
const createUrl = vi.fn(), revokeUrl = vi.fn();
const record = (n: number) => within(screen.getByRole('article', { name: `记录 ${n}` }));
const stat = (label: string) => within(screen.getByLabelText('实际记录统计')).getByText(label).closest('div')!.querySelector('dd')!.textContent;
function file(text: string, name = 'fictional.json') {
  const value = new File([text], name);
  const bytes = new TextEncoder().encode(text);
  Object.defineProperty(value, 'arrayBuffer', { value: vi.fn(async () => bytes.buffer), configurable: true });
  return value;
}
const select = (value: File) => fireEvent.change(screen.getByLabelText('选择文件'), { target: { files: [value] } });
async function load(records: unknown[]) { select(file(JSON.stringify(records))); await waitFor(() => expect(stat('记录总数')).toBe(String(records.length))); }
const clickRow = (n: number, name: string) => fireEvent.click(record(n).getByRole('button', { name }));
const exportStart = () => fireEvent.click(screen.getByRole('button', { name: '导出 JSON' }));
const confirmExport = () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '确认导出' }));

beforeEach(() => {
  blobs.length = 0; createUrl.mockReset(); revokeUrl.mockReset();
  createUrl.mockImplementation((blob: NodeBlob) => { blobs.push(blob); return 'blob:fictional-export'; });
  const OriginalURL = URL;
  vi.stubGlobal('URL', class extends OriginalURL { static createObjectURL = createUrl; static revokeObjectURL = revokeUrl; });
  vi.stubGlobal('Blob', NodeBlob);
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('local file import', () => {
  it('starts empty without auto-read/download, preserves the administrator blocker', () => {
    render(<ImportWorkspace />); expect(screen.getByText('尚未选择清单')).toBeVisible(); expect(stat('记录总数')).toBe('0');
    expect(screen.getByRole('button', { name: /保存为草稿/ })).toBeDisabled(); expect(screen.getByRole('button', { name: '导出 JSON' })).toBeDisabled(); expect(createUrl).not.toHaveBeenCalled();
    expect(screen.getByText('未启用管理员认证 · 不可公开发布')).toBeVisible();
  });
  it.each(['csv', 'json'] as const)('imports BOM %s through the strict parser', async format => {
    render(<ImportWorkspace />); select(file('\ufeff' + (format === 'json' ? '[{"name":"示例"}]' : 'name,fileType\n示例,pdf'), `fictional.${format}`));
    await screen.findByRole('heading', { name: '示例' }); expect(stat('有效')).toBe('1'); expect(createUrl).not.toHaveBeenCalled();
  });
  it.each([
    ['[{"name":"PRIVATE_CANARY","name":"SECRET_CANARY"}]', 'json', 'DUPLICATE_KEY'],
    ['[{"name":"a","na\\u006de":"b"}]', 'json', 'DUPLICATE_KEY'],
    ['name,name\na,b', 'csv', 'CSV_HEADER'],
    ['name\n"unclosed', 'csv', 'CSV_SYNTAX'],
    ['name,note\na', 'csv', 'CSV_COLUMNS'],
    ['[{"name":"a","password":"PRIVATE_CANARY"}]', 'json', 'UNKNOWN_FIELD'],
    [JSON.stringify(Array.from({ length: 101 }, () => ({ name: '' }))), 'json', 'TOO_MANY_RECORDS'],
  ])('rejects malformed input with anonymous code %s', async (text, extension, code) => {
    render(<ImportWorkspace />); select(file(text, `PRIVATE_FILENAME.${extension}`));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain(code));
    expect(document.body.textContent).not.toMatch(/CANARY|PRIVATE_FILENAME/); expect(stat('记录总数')).toBe('0');
  });
  it('blocks oversize and empty files before reading', async () => {
    render(<ImportWorkspace />); const large = file('x'); Object.defineProperty(large, 'size', { value: 1_048_577 }); select(large);
    expect(large.arrayBuffer).not.toHaveBeenCalled(); expect(screen.getByRole('status')).toHaveTextContent('FILE_TOO_LARGE');
    const empty = file(''); select(empty); expect(empty.arrayBuffer).not.toHaveBeenCalled(); expect(screen.getByRole('status')).toHaveTextContent('EMPTY_FILE');
  });
  it('accepts exact 1 MiB and 100 raw records including invalid records', async () => {
    render(<ImportWorkspace />); select(file('[]' + ' '.repeat(1_048_574))); await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('已检查 0 条'));
    select(file(JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ name: i === 0 ? '' : `record ${i}` })))));
    fireEvent.click(screen.getByRole('button', { name: '确认替换' })); await waitFor(() => expect(stat('记录总数')).toBe('100')); expect(stat('错误')).toBe('1'); expect(screen.getAllByRole('article')).toHaveLength(10);
  });
  it('shows invalid UTF-8 failure without raw bytes', async () => {
    render(<ImportWorkspace />); const invalid = file('x'); Object.defineProperty(invalid, 'arrayBuffer', { value: vi.fn(async () => new Uint8Array([0xff]).buffer) }); select(invalid);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('INVALID_UTF8'));
  });
  it('retains safe blank placeholders and supports complete manual reentry', async () => {
    render(<ImportWorkspace />); await load([{ name: 'PRIVATE_CANARY', fileType: 'invalid' }]); expect(document.body.textContent).not.toContain('PRIVATE_CANARY');
    expect(record(1).getByText('原始无效字段未保留，请重新填写这条记录。')).toBeVisible();
    clickRow(1, '编辑'); fireEvent.change(screen.getByLabelText('名称（必填）'), { target: { value: '重新填写' } });
    fireEvent.click(screen.getByRole('button', { name: '应用编辑并校验' })); expect(stat('有效')).toBe('1'); expect(stat('错误')).toBe('0');
  });
});

describe('editor, categories, similarity and pagination', () => {
  it('isolates unapplied edits, allows cancel, and revalidates applied errors', async () => {
    render(<ImportWorkspace />); await load([{ name: 'original' }]); clickRow(1, '编辑');
    fireEvent.change(screen.getByLabelText('名称（必填）'), { target: { value: 'draft' } }); expect(record(1).getByRole('heading')).toHaveTextContent('original'); expect(screen.getByRole('button', { name: '导出 JSON' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '取消编辑' })); expect(record(1).getByRole('heading')).toHaveTextContent('original');
    clickRow(1, '编辑'); fireEvent.change(screen.getByLabelText('大小（字节）'), { target: { value: '1e3' } }); fireEvent.click(screen.getByRole('button', { name: '应用编辑并校验' })); expect(stat('错误')).toBe('1');
    clickRow(1, '编辑'); expect(screen.getByLabelText('大小（字节）')).toHaveAccessibleDescription(/INVALID_SIZE/);
    fireEvent.change(screen.getByLabelText('大小（字节）'), { target: { value: '012' } }); fireEvent.click(screen.getByRole('button', { name: '应用编辑并校验' })); expect(stat('有效')).toBe('1');
  });
  it('edits all six fields, displays labels while storing IDs, excludes disabled classification', async () => {
    render(<ImportWorkspace />); await load([{ name: 'a' }]); clickRow(1, '编辑');
    fireEvent.change(screen.getByLabelText('名称（必填）'), { target: { value: 'new' } }); fireEvent.change(screen.getByLabelText('文件类型'), { target: { value: 'pdf' } });
    fireEvent.change(screen.getByLabelText('大小（字节）'), { target: { value: '20' } }); fireEvent.change(screen.getByLabelText('分类'), { target: { value: 'type-junior-math-notes' } });
    fireEvent.change(screen.getByLabelText('来源'), { target: { value: '手动' } }); fireEvent.change(screen.getByLabelText('备注'), { target: { value: '说明' } });
    fireEvent.click(screen.getByRole('button', { name: '应用编辑并校验' })); exportStart(); confirmExport();
    expect(JSON.parse(await blobs[0].text())[0]).toEqual({ name: 'new', fileType: 'pdf', sizeBytes: 20, categoryId: 'type-junior-math-notes', sourceLabel: '手动', note: '说明' });
  });
  it('category change revalidates data and invalidates open export confirmation', async () => {
    const { rerender } = render(<ImportWorkspace />); await load([{ name: 'a', categoryId: 'type-junior-math-notes' }]); exportStart();
    rerender(<ImportWorkspace categoryValues={categories.map(c => c.id === 'stage-junior' ? { ...c, enabled: false } : c)} />);
    await waitFor(() => expect(stat('错误')).toBe('1')); confirmExport(); expect(createUrl).not.toHaveBeenCalled(); expect(screen.getByRole('status')).toHaveTextContent('EXPORT_CHANGED');
    clickRow(1, '编辑'); expect(screen.queryByRole('option', { name: /知识点整理/ })).not.toBeInTheDocument();
  });
  it('requires individual review, resets on edits, never merges, and supports exclusion/restoration', async () => {
    render(<ImportWorkspace />); await load([{ name: 'Ａ' }, { name: 'a' }]); expect(stat('待确认')).toBe('2');
    clickRow(1, '已人工核对此记录'); expect(stat('待确认')).toBe('1'); clickRow(2, '已人工核对此记录'); expect(stat('待确认')).toBe('0');
    clickRow(1, '撤销人工复核'); expect(stat('待确认')).toBe('1'); clickRow(1, '已人工核对此记录');
    clickRow(1, '编辑'); fireEvent.change(screen.getByLabelText('备注'), { target: { value: 'changed' } }); fireEvent.click(screen.getByRole('button', { name: '应用编辑并校验' })); expect(stat('待确认')).toBe('2');
    clickRow(1, '排除记录'); expect(record(1).getByText('已排除')).toBeVisible(); expect(stat('记录总数')).toBe('2');
    clickRow(1, '恢复记录'); expect(stat('待确认')).toBe('2'); expect(screen.getAllByRole('article')).toHaveLength(2);
  });
  it('pages ten records and filters invalid/excluded rows without dropping originals', async () => {
    render(<ImportWorkspace />); await load(Array.from({ length: 11 }, (_, i) => ({ name: i === 10 ? '' : `r${i}` }))); expect(screen.getAllByRole('article')).toHaveLength(10);
    fireEvent.click(screen.getByRole('button', { name: '下一页' })); expect(screen.getAllByRole('article')).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('状态筛选'), { target: { value: 'invalid' } }); expect(record(11).getByText('字段错误')).toBeVisible();
    clickRow(11, '排除记录'); expect(screen.queryByRole('article')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('状态筛选'), { target: { value: 'excluded' } }); expect(record(11).getByText('已排除')).toBeVisible(); expect(stat('记录总数')).toBe('11');
  });
  it('renders HTML-like text as text, never as executable markup', async () => {
    const { container } = render(<ImportWorkspace />); await load([{ name: '<img src=x onerror=alert(1)>', note: '<script>attack()</script>' }]);
    expect(container.querySelector('img')).toBeNull(); expect(container.querySelector('script')).toBeNull(); expect(record(1).getByRole('heading')).toHaveTextContent('<img src=x');
  });
});

describe('replacement, async race and leave protection', () => {
  it('replacement cancellation retains edits and confirmed replacement changes the state', async () => {
    render(<ImportWorkspace />); await load([{ name: 'first' }]); const next = file('[{"name":"second"}]'); select(next);
    expect(next.arrayBuffer).not.toHaveBeenCalled(); fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '取消' })); expect(record(1).getByRole('heading')).toHaveTextContent('first');
    select(next); fireEvent.click(screen.getByRole('button', { name: '确认替换' })); await screen.findByRole('heading', { name: 'second' });
  });
  it('late old file result cannot overwrite a newer selection', async () => {
    render(<ImportWorkspace />); let finish!: (buffer: ArrayBuffer) => void;
    const old = file('old'); Object.defineProperty(old, 'arrayBuffer', { value: vi.fn(() => new Promise<ArrayBuffer>(resolveBuffer => { finish = resolveBuffer; })) }); select(old);
    select(file('[{"name":"new"}]')); await screen.findByRole('heading', { name: 'new' });
    await act(async () => finish(new TextEncoder().encode('[{"name":"old"}]').buffer)); expect(screen.queryByRole('heading', { name: 'old' })).not.toBeInTheDocument();
  });
  it('canceling a pending read discards its late result', async () => {
    render(<ImportWorkspace />); let finish!: (buffer: ArrayBuffer) => void; const pending = file('x'); Object.defineProperty(pending, 'arrayBuffer', { value: vi.fn(() => new Promise<ArrayBuffer>(r => { finish = r; })) }); select(pending);
    fireEvent.click(screen.getByRole('button', { name: '取消读取' })); await act(async () => finish(new TextEncoder().encode('[{"name":"late"}]').buffer)); expect(stat('记录总数')).toBe('0');
  });
  it('uses current classification when a pending read resolves', async () => {
    const { rerender } = render(<ImportWorkspace />); let finish!: (buffer: ArrayBuffer) => void;
    const pending = file('x'); Object.defineProperty(pending, 'arrayBuffer', { value: vi.fn(() => new Promise<ArrayBuffer>(r => { finish = r; })) }); select(pending);
    rerender(<ImportWorkspace categoryValues={categories.map(c => ({ ...c, enabled: false }))} />);
    await act(async () => finish(new TextEncoder().encode('[{"name":"a","categoryId":"type-junior-math-notes"}]').buffer));
    expect(stat('错误')).toBe('1'); expect(screen.getByText('待重新填写')).toBeVisible();
  });
  it('preserves prior preview on local file read failure without exposing exception text', async () => {
    render(<ImportWorkspace />); await load([{ name: 'retained' }]); const broken = file('x'); Object.defineProperty(broken, 'arrayBuffer', { value: vi.fn(async () => { throw new Error('SECRET_CANARY'); }) }); select(broken);
    fireEvent.click(screen.getByRole('button', { name: '确认替换' })); await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('FILE_READ_FAILED'));
    expect(record(1).getByRole('heading')).toHaveTextContent('retained'); expect(document.body.textContent).not.toContain('CANARY');
  });
  it('clear cancellation preserves state, confirms clear and never restores on remount', async () => {
    const { unmount } = render(<ImportWorkspace />); await load([{ name: 'a' }]); fireEvent.click(screen.getByRole('button', { name: '清空预览' }));
    fireEvent.click(screen.getByRole('button', { name: '取消' })); expect(stat('记录总数')).toBe('1'); fireEvent.click(screen.getByRole('button', { name: '清空预览' })); fireEvent.click(screen.getByRole('button', { name: '确认清空' })); expect(stat('记录总数')).toBe('0');
    unmount(); render(<ImportWorkspace />); expect(stat('记录总数')).toBe('0');
  });
  it('beforeunload is best-effort while data or edits remain, clears after full export', async () => {
    render(<ImportWorkspace />); const clean = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(clean); expect(clean.defaultPrevented).toBe(false);
    await load([{ name: 'a' }]); const dirty = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(dirty); expect(dirty.defaultPrevented).toBe(true);
    exportStart(); confirmExport(); const exported = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(exported); expect(exported.defaultPrevented).toBe(false);
    clickRow(1, '编辑'); const draft = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(draft); expect(draft.defaultPrevented).toBe(true);
  });
});

describe('confirmed JSON download and accessibility', () => {
  it('confirms quantity, cancels safely, serializes six keys, clicks once and releases object URL', async () => {
    render(<ImportWorkspace />); await load([{ name: 'a' }, { name: '' }]); exportStart(); expect(createUrl).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toHaveTextContent('1 条记录'); expect(screen.getByRole('dialog')).toHaveTextContent('文件将保存在本机设备');
    fireEvent.click(screen.getByRole('button', { name: '取消' })); expect(createUrl).not.toHaveBeenCalled(); exportStart();
    vi.useFakeTimers(); confirmExport(); expect(createUrl).toHaveBeenCalledTimes(1); expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1); expect(revokeUrl).not.toHaveBeenCalled();
    const json = await blobs[0].text(); expect(Object.keys(JSON.parse(json)[0])).toEqual(['name', 'fileType', 'sizeBytes', 'categoryId', 'sourceLabel', 'note']);
    expect(parseManualImport(new TextEncoder().encode(json), 'json')).toMatchObject({ validCount: 1 });
    act(() => vi.advanceTimersByTime(1000)); expect(revokeUrl).toHaveBeenCalledWith('blob:fictional-export'); expect(document.querySelector('a[download]')).toBeNull();
    const leave = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(leave); expect(leave.defaultPrevented).toBe(true);
  });
  it('retains preview on download failure, revokes failed URL and permits retry', async () => {
    render(<ImportWorkspace />); await load([{ name: 'a' }]); vi.mocked(HTMLAnchorElement.prototype.click).mockImplementationOnce(() => { throw new Error('SECRET_CANARY'); });
    exportStart(); confirmExport(); expect(screen.getByRole('status')).toHaveTextContent('DOWNLOAD_FAILED'); expect(screen.getByRole('status')).not.toHaveTextContent('CANARY'); expect(stat('记录总数')).toBe('1'); expect(revokeUrl).toHaveBeenCalled();
    exportStart(); confirmExport(); expect(screen.getByRole('status')).toHaveTextContent('已发起');
  });
  it('starts modal focus on cancel, traps tab, supports Esc and restores focus', async () => {
    render(<ImportWorkspace />); await load([{ name: 'a' }]); const trigger = screen.getByRole('button', { name: '导出 JSON' }); trigger.focus(); exportStart();
    const cancel = screen.getByRole('button', { name: '取消' }), confirm = screen.getByRole('button', { name: '确认导出' }); expect(cancel).toHaveFocus();
    fireEvent.keyDown(cancel, { key: 'Tab', shiftKey: true }); expect(confirm).toHaveFocus(); fireEvent.keyDown(confirm, { key: 'Tab' }); expect(cancel).toHaveFocus();
    fireEvent.keyDown(cancel, { key: 'Escape' }); expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(trigger).toHaveFocus(); expect(createUrl).not.toHaveBeenCalled();
  });
  it('makes no network, storage or URL data writes during import/edit/export', async () => {
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('forbidden')); const storage = vi.spyOn(Storage.prototype, 'setItem'); const history = vi.spyOn(window.history, 'pushState'); const log = vi.spyOn(console, 'log');
    render(<ImportWorkspace />); await load([{ name: 'a' }]); clickRow(1, '编辑'); fireEvent.change(screen.getByLabelText('备注'), { target: { value: 'PRIVATE_CANARY' } }); fireEvent.click(screen.getByRole('button', { name: '应用编辑并校验' })); exportStart(); confirmExport();
    expect(network).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled(); expect(history).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled();
    const source = readFileSync(resolve('src/offlineCatalog/manualImport/ImportWorkspace.tsx'), 'utf8'); expect(source).not.toMatch(/fetch\(|localStorage|sessionStorage|indexedDB|document\.cookie|console\.|dangerouslySetInnerHTML/);
  });
});
