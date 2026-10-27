import { Blob as NodeBlob } from 'node:buffer';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as pdfjs from 'pdfjs-dist';
import { OcrTool, type OcrWorkerFactory } from './OcrTool';
import { PDFDocument } from 'pdf-lib';
import { ToolDetail, type ToolKey } from './Toolbox';
import { toolCatalog } from './toolCatalog';
import { addPageNumbers, addTextWatermark } from './pdfText';
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument: vi.fn(() => ({ promise: new Promise(() => { }) })) }));
vi.mock('./pdfText', () => ({ addPageNumbers: vi.fn(async () => 1), addTextWatermark: vi.fn(async () => 1) }));
function deferred<T>() { let resolve!: (x: T) => void; let reject!: (x: Error) => void; const promise = new Promise<T>((y, n) => { resolve = y; reject = n; }); return { promise, resolve, reject }; }
async function pdf(name: string, pages = 1) { const doc = await PDFDocument.create(); for (let i = 0; i < pages; i++) {
    const p = doc.addPage([120, 160]);
    p.drawRectangle({ x: 5, y: 5, width: 20, height: 30 });
} const data = await doc.save(); const file = new File([data as BlobPart], name, { type: 'application/pdf' }); Object.defineProperty(file, 'arrayBuffer', { configurable: true, value: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) }); return file; }
const corrupt = (name = 'bad.pdf') => { const f = new File(['broken'], name, { type: 'application/pdf' }); Object.defineProperty(f, 'arrayBuffer', { value: async () => new TextEncoder().encode('broken').buffer }); return f; };
function show(tool: ToolKey) { return render(<ToolDetail tool={tool} back={() => { }}/>); }
function upload(files: File[]) { fireEvent.change(document.querySelector('input[type=file]')!, { target: { files } }); }
const primary = () => document.querySelector<HTMLButtonElement>('button.primary-action')!;
async function loaded(file: File) { upload([file]); await waitFor(() => expect(screen.getByText(file.name)).toBeVisible()); const range = screen.queryByLabelText('页码范围'); if (range)
    fireEvent.change(range, { target: { value: '1' } }); }
beforeEach(() => { vi.stubGlobal('Blob', NodeBlob); vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 320, height: 200, close: vi.fn() }))); vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:audit'); vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => { }); vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { }); vi.mocked(pdfjs.getDocument).mockReset().mockReturnValue({ promise: new Promise(() => { }) } as never); vi.mocked(addPageNumbers).mockClear(); vi.mocked(addTextWatermark).mockClear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it.each(toolCatalog.map(t => [t.id, t.name]))('EMPTY %s %s main action disabled', (tool) => { show(tool as ToolKey); expect(primary()).toBeDisabled(); });
const singles = ['nup', 'split', 'print-page-adjust', 'pdf-page-organizer', 'pdf-to-images', 'pdf-compress', 'watermark', 'page-number'] as ToolKey[];
it.each(singles)('REPLACE %s A→badB→C', async (tool) => { show(tool); await loaded(await pdf('A.pdf')); upload([corrupt()]); await waitFor(() => expect(document.body.textContent).toMatch(/损坏|失败|无法读取/)); const retained = !!screen.queryByText('A.pdf'); const enabled = !primary().disabled; expect(retained).toBe(false); expect(enabled).toBe(false); await loaded(await pdf('C.pdf', 2)); expect(primary()).toBeEnabled(); });
it.each(singles)('ZERO %s zero-byte PDF feedback', async (tool) => { show(tool); const f = new File([], 'zero.pdf', { type: 'application/pdf' }); Object.defineProperty(f, 'arrayBuffer', { value: async () => new ArrayBuffer(0) }); upload([f]); await waitFor(() => expect(document.body.textContent).toMatch(/损坏|失败|无法读取/)); expect(primary()).toBeDisabled(); });
it.each(singles)('RACE %s old parse completes after C', async (tool) => { show(tool); const file = await pdf('old.pdf'); const data = await file.arrayBuffer(); const delay = deferred<ArrayBuffer>(); Object.defineProperty(file, 'arrayBuffer', { value: () => delay.promise }); upload([file]); await loaded(await pdf('C.pdf', 2)); await act(async () => delay.resolve(data)); const old = !!screen.queryByText('old.pdf'); expect(old).toBe(false); });
it.each(['nup', 'split', 'print-page-adjust', 'pdf-page-organizer', 'merge'] as ToolKey[])('UNMOUNT %s late download after leaving tool', async (tool) => { const view = show(tool); const f = await pdf('A.pdf'); await loaded(f); if (tool === 'merge')
    await loaded(await pdf('B.pdf')); const bytes = await f.arrayBuffer(); const d = deferred<ArrayBuffer>(); Object.defineProperty(f, 'arrayBuffer', { value: () => d.promise }); fireEvent.click(primary()); view.unmount(); await act(async () => d.resolve(bytes)); expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled(); });
it('WATERMARK parameter change preserves pending valid upload', async () => { show('watermark'); const f = await pdf('new.pdf'); const bytes = await f.arrayBuffer(); const d = deferred<ArrayBuffer>(); Object.defineProperty(f, 'arrayBuffer', { value: () => d.promise }); upload([f]); fireEvent.change(screen.getByLabelText('水印文字'), { target: { value: 'changed' } }); await act(async () => d.resolve(bytes)); expect(screen.getByText('new.pdf')).toBeVisible(); expect(primary()).toBeEnabled(); expect(document.body.textContent).not.toContain('正在读取'); });
it.each(['0', '4', '2-1', 'abc', '1,'])('PAGE_RANGE %s rejects invalid pages', async (value) => { show('page-number'); await loaded(await pdf('A.pdf', 3)); fireEvent.change(screen.getByLabelText('指定页面（可选）'), { target: { value } }); fireEvent.click(primary()); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('范围无效')); expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled(); });
it('WATERMARK empty text and skip-cover empty selection reject', async () => { show('watermark'); await loaded(await pdf('A.pdf')); fireEvent.change(screen.getByLabelText('水印文字'), { target: { value: '' } }); fireEvent.click(primary()); expect(document.body.textContent).toContain('水印文字不能为空'); fireEvent.change(screen.getByLabelText('水印文字'), { target: { value: 'OK' } }); fireEvent.click(screen.getByLabelText('跳过封面')); fireEvent.click(primary()); await waitFor(() => expect(document.body.textContent).toContain('没有可处理')); expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled(); });
it('SPLIT invalid range disables output then valid recovery', async () => { show('split'); await loaded(await pdf('A.pdf', 3)); for (const value of ['0', '4', '2-1', 'abc', '']) {
    fireEvent.change(screen.getByLabelText('页码范围'), { target: { value } });
    expect(primary()).toBeDisabled();
} fireEvent.change(screen.getByLabelText('页码范围'), { target: { value: '1-2' } }); expect(primary()).toBeEnabled(); });
it('PDF_IMAGES duplicate/empty range blocks then recovers', async () => { show('pdf-to-images'); await loaded(await pdf('A.pdf', 3)); fireEvent.click(screen.getByLabelText('指定范围')); for (const value of ['1,1', '0', '4', '2-1', '']) {
    fireEvent.change(screen.getByLabelText('页码范围'), { target: { value } });
    expect(primary()).toBeDisabled();
} fireEvent.change(screen.getByLabelText('页码范围'), { target: { value: '1-2' } }); expect(primary()).toBeEnabled(); });
it('ORGANIZER rejects deleting last page, supports rotate undo', async () => { show('pdf-page-organizer'); await loaded(await pdf('A.pdf')); fireEvent.click(screen.getByRole('button', { name: '删除' })); expect(document.body.textContent).toContain('至少需要保留一页'); fireEvent.click(screen.getByRole('button', { name: '旋转' })); expect(document.body.textContent).toContain('旋转 90°'); fireEvent.click(screen.getByRole('button', { name: '撤销' })); expect(document.body.textContent).toContain('旋转 0°'); });
function fakeBitmap() { vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 320, height: 200, close: vi.fn() }))); vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn(), fillRect: vi.fn() } as never); vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb, type) { cb(new NodeBlob(['synthetic result'], { type }) as unknown as Blob); }); }
const image = () => new File(['fake codec input'], 'audit.png', { type: 'image/png' });
it.each(['image-compress', 'image-format-convert', 'image-resize'] as ToolKey[])('DUPLICATE_RESULTS %s retains both rows without duplicate keys', async (tool) => {
    fakeBitmap();
    let sequence = 0;
    vi.mocked(URL.createObjectURL).mockImplementation(() => `blob:result-${++sequence}`);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    show(tool);
    upload([image(), image()]);
    await waitFor(() => expect(screen.getAllByText('audit.png')).toHaveLength(2));
    fireEvent.click(primary());
    await waitFor(() => expect(screen.getByRole('button', { name: '打包下载 ZIP' })).toBeVisible());
    expect(document.querySelectorAll(tool === 'image-compress' ? '.compress-row' : '.conversion-results article')).toHaveLength(2);
    expect(errors.mock.calls.flat().join(' ')).not.toContain('same key');
});
it.each(['images-to-pdf', 'image-compress', 'image-sheet-layout', 'image-format-convert', 'image-resize'] as ToolKey[])('IMAGE_INPUT %s unsupported MIME gives feedback', async (tool) => { show(tool); upload([new File(['x'], 'unsupported.txt', { type: 'text/plain' })]); await waitFor(() => expect(document.body.textContent).toContain('请选择 JPG、PNG 或 WebP')); expect(primary()).toBeDisabled(); });
it.each(['image-format-convert', 'image-compress'] as ToolKey[])('STALE_FORMAT %s settings change clears old downloadable results', async (tool) => { fakeBitmap(); show(tool); await loaded(image()); fireEvent.click(primary()); await waitFor(() => expect(screen.getByRole('button', { name: tool === 'image-compress' ? '下载压缩图片' : '下载转换结果' })).toBeVisible()); fireEvent.change(screen.getByLabelText('输出格式'), { target: { value: 'image/webp' } }); expect(screen.queryByRole('button', { name: tool === 'image-compress' ? '下载压缩图片' : '下载转换结果' })).toBeNull(); });
it('RESIZE rejects 60MP excess without allocation', async () => { fakeBitmap(); show('image-resize'); await loaded(image()); fireEvent.click(screen.getByLabelText('锁定宽高比')); fireEvent.change(screen.getByLabelText('宽度（px）'), { target: { value: '10000' } }); fireEvent.change(screen.getByLabelText('高度（px）'), { target: { value: '10000' } }); fireEvent.click(primary()); await waitFor(() => expect(document.body.textContent).toContain('输出尺寸过大')); expect(HTMLCanvasElement.prototype.toBlob).not.toHaveBeenCalled(); });
it('RESIZE zero width rejected before generation', async () => { fakeBitmap(); show('image-resize'); await loaded(image()); fireEvent.click(screen.getByLabelText('锁定宽高比')); fireEvent.change(screen.getByLabelText('宽度（px）'), { target: { value: '0' } }); fireEvent.click(primary()); await waitFor(() => expect(document.body.textContent).toContain('输出宽高必须是正整数')); expect(document.querySelector('.conversion-results article')).toBeNull(); });
it('OCR injected recognition finishes after replacement and requires cancelling before replacement', async () => { const d = deferred<{
    data: {
        text: string;
    };
}>(); const recognize = vi.fn(() => d.promise); const factory: OcrWorkerFactory = async () => ({ recognize, terminate: vi.fn(async () => { }) } as never); render(<OcrTool workerFactory={factory}/>); await loaded(new File(['synthetic'], 'A.png', { type: 'image/png' })); fireEvent.click(primary()); await waitFor(() => expect(recognize).toHaveBeenCalled()); upload([new File(['synthetic'], 'C.png', { type: 'image/png' })]); expect(screen.getByRole('status')).toHaveTextContent('请先取消'); expect(screen.queryByText('C.png')).toBeNull(); await act(async () => d.resolve({ data: { text: 'OLD A' } })); expect(screen.getByRole('textbox')).toHaveValue('OLD A'); });
it('OCR cancel during PDF validation rejects late selection commit', async () => { const d = deferred<unknown>(); vi.mocked(pdfjs.getDocument).mockReturnValue({ promise: d.promise, destroy: vi.fn(async () => { }) } as never); render(<OcrTool workerFactory={async () => { throw Error('Worker must not start'); }}/>); const f = await pdf('late.pdf'); const data = await f.arrayBuffer(); Object.defineProperty(f, 'slice', { value: () => new NodeBlob([data.slice(0, 5)]) }); upload([f]); await waitFor(() => expect(screen.getByRole('button', { name: '取消识别' })).toBeVisible()); fireEvent.click(screen.getByRole('button', { name: '取消识别' })); expect(screen.getByRole('status')).toHaveTextContent('cancelled'); await act(async () => d.resolve({ numPages: 1, cleanup: vi.fn(), destroy: vi.fn(async () => { }) })); expect(screen.getByRole('status')).toHaveTextContent('cancelled'); expect(screen.queryByText('late.pdf')).toBeNull(); });
it('OCR 10 image files accepted, 11 rejected without Worker', async () => { const factory = vi.fn(async () => { throw Error('No Worker'); }); render(<OcrTool workerFactory={factory}/>); const files = Array.from({ length: 10 }, (_, i) => new File(['x'], i + '.png', { type: 'image/png' })); upload(files); await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('10 个文件已准备就绪')); upload([...files, files[0]]); expect(screen.getByRole('alert')).toHaveTextContent('每批最多选择 10'); expect(factory).not.toHaveBeenCalled(); });
it.each([['image', 15 * 1024 * 1024 + 1], ['pdf', 30 * 1024 * 1024 + 1]])('OCR %s oversize metadata rejected before file read', async (kind, size) => { render(<OcrTool />); const f = new File([], kind === 'pdf' ? 'large.pdf' : 'large.png', { type: kind === 'pdf' ? 'application/pdf' : 'image/png' }); Object.defineProperty(f, 'size', { value: size }); upload([f]); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('error')); expect(primary()).toBeDisabled(); });
it('MERGE mixed valid+corrupt batch adds no partial inputs and valid retry recovers', async () => { show('merge'); upload([await pdf('A.pdf'), corrupt()]); await waitFor(() => expect(document.body.textContent).toContain('无法读取')); expect(screen.queryByText('A.pdf')).toBeNull(); await loaded(await pdf('B.pdf')); await loaded(await pdf('C.pdf')); expect(primary()).toBeEnabled(); });
it.each(['image-format-convert', 'image-compress', 'image-resize'] as ToolKey[])('IMAGE_REMOVE %s late processing cannot restore removed target result', async (tool) => { fakeBitmap(); show(tool); await loaded(image()); const d = deferred<ImageBitmap>(); vi.mocked(createImageBitmap).mockImplementationOnce(() => d.promise); fireEvent.click(primary()); fireEvent.click(screen.getByRole('button', { name: '移除 audit.png' })); expect(primary()).toBeDisabled(); await act(async () => d.resolve({ width: 320, height: 200, close: vi.fn() } as never)); const text = tool === 'image-compress' ? '下载压缩图片' : tool === 'image-resize' ? '下载调整结果' : '下载转换结果'; expect(screen.queryByRole('button', { name: text })).toBeNull(); });
it.each(['nup', 'split', 'print-page-adjust', 'pdf-page-organizer', 'pdf-to-images', 'pdf-compress'] as ToolKey[])('LATE_ERROR %s older upload failure cannot overwrite current C status', async (tool) => { show(tool); const f = await pdf('old.pdf'); const d = deferred<ArrayBuffer>(); Object.defineProperty(f, 'arrayBuffer', { value: () => d.promise }); upload([f]); await loaded(await pdf('C.pdf', 2)); await act(async () => d.reject(Error('old error'))); expect(screen.getByText('C.pdf')).toBeVisible(); expect(document.body.textContent).not.toMatch(/old error|无法读取|加载失败/); });

it.each(['0', '-1', '1.5', ''])('RESIZE rejects non-positive/integer width %s before allocation', async value => {
  fakeBitmap(); show('image-resize'); await loaded(image()); fireEvent.click(screen.getByLabelText('锁定宽高比'));
  fireEvent.change(screen.getByLabelText('宽度（px）'), {target:{value}}); fireEvent.click(primary());
  await waitFor(()=>expect(document.body.textContent).toContain('输出宽高必须是正整数'));
  expect(HTMLCanvasElement.prototype.toBlob).not.toHaveBeenCalled();
});
it('OCR late initialized Worker is disposed after the model-init timeout (injected only)',async()=>{
  const init=deferred<Awaited<ReturnType<OcrWorkerFactory>>>(); const terminate=vi.fn(async()=>{});
  render(<OcrTool workerFactory={()=>init.promise}/>); await loaded(new File(['synthetic'],'A.png',{type:'image/png'}));
  vi.useFakeTimers(); try { fireEvent.click(primary()); await act(async()=>{await vi.advanceTimersByTimeAsync(30001);});
    expect(screen.getByRole('alert')).toHaveTextContent('OCR 模型加载超时');
    await act(async()=>init.resolve({recognize:vi.fn(),terminate} as never)); expect(terminate).toHaveBeenCalledOnce();
  } finally {vi.useRealTimers();}
});
it('OCR unmount waits for injected pending recognition before terminating',async()=>{
  const pending=deferred<{data:{text:string}}>(); const terminate=vi.fn(async()=>{}); const recognize=vi.fn(()=>pending.promise);
  const view=render(<OcrTool workerFactory={async()=>({recognize,terminate} as never)}/>); await loaded(new File(['synthetic'],'A.png',{type:'image/png'}));
  fireEvent.click(primary());await waitFor(()=>expect(recognize).toHaveBeenCalledOnce());view.unmount();expect(terminate).not.toHaveBeenCalled();
  await act(async()=>pending.resolve({data:{text:'late'}}));expect(terminate).toHaveBeenCalledOnce();
});

function workingPdfPreview() {
  fakeBitmap();
  const doc = { numPages: 3, getPage: vi.fn(async () => ({ getViewport: () => ({width:120,height:160}), render: () => ({promise:Promise.resolve(),cancel:vi.fn()}) })), destroy:vi.fn(async () => {}) };
  vi.mocked(pdfjs.getDocument).mockImplementation(() => ({ promise:Promise.resolve(doc),destroy:vi.fn(async () => {}) }) as never);
}
it('PDF_IMAGES changing thumbnail selection clears completed downloads', async () => {
  workingPdfPreview(); show('pdf-to-images'); await loaded(await pdf('A.pdf',3));
  fireEvent.click(screen.getByLabelText('缩略图选择'));fireEvent.click(primary());
  await waitFor(()=>expect(document.querySelectorAll('.conversion-results article')).toHaveLength(1));
  fireEvent.click(screen.getByRole('button',{name:'第 2 页'}));
  expect(document.querySelectorAll('.conversion-results article')).toHaveLength(0);
  expect(screen.queryByText('已转换 1 页，可下载真实图片结果。')).toBeNull();
  fireEvent.click(primary());
  await waitFor(()=>expect(document.querySelectorAll('.conversion-results article')).toHaveLength(2));
});
it('PDF_IMAGES thumbnail change during encoding rejects late output',async()=>{
  workingPdfPreview();show('pdf-to-images');await loaded(await pdf('A.pdf',3));fireEvent.click(screen.getByLabelText('缩略图选择'));
  let finish!:BlobCallback;
  vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementationOnce(callback=>{finish=callback;});
  fireEvent.click(primary());await waitFor(()=>expect(finish).toBeDefined());
  fireEvent.click(screen.getByRole('button',{name:'第 2 页'}));
  await act(async()=>finish(new NodeBlob(['late encoded page']) as unknown as Blob));
  expect(document.querySelectorAll('.conversion-results article')).toHaveLength(0);
  expect(primary()).toBeEnabled();
});
it('COMPRESS bad replacement unmounts old preview pixels and page status',async()=>{
  workingPdfPreview();show('pdf-compress');await loaded(await pdf('A.pdf'));
  await waitFor(()=>expect(screen.getByText('第 1 / 3 页')).toBeVisible());
  expect(document.querySelector('canvas')).not.toBeNull();upload([corrupt()]);
  await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('原文件已取消选择'));
  expect(document.querySelector('canvas')).toBeNull();expect(screen.queryByText('第 1 / 3 页')).toBeNull();
  expect(screen.getByText('处理后的 PDF 预览将在这里显示')).toBeVisible();
});
