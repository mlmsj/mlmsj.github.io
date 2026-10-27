import { Blob as NodeBlob } from 'node:buffer';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { PdfPageNumberAsyncTool } from './PdfAsyncTools';
import { addPageNumbers } from './pdfText';
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument: vi.fn(() => ({ promise: new Promise(() => {}) })) }));
vi.mock('./pdfText', () => ({ addPageNumbers: vi.fn(async () => 1), addTextWatermark: vi.fn() }));
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
async function pdf(name: string, pages = 1) { const doc = await PDFDocument.create(); for (let i=0;i<pages;i++) doc.addPage(); const data = await doc.save(); const file = new File([data as BlobPart], name, {type:'application/pdf'}); Object.defineProperty(file,'arrayBuffer',{configurable:true,value: async () => data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)}); return file; }
function upload(file: File) { fireEvent.change(document.querySelector('input[type=file]')!,{target:{files:[file]}}); }
const button = () => screen.getByRole('button',{name:'生成带页码的 PDF'});
async function loaded(file: File) { upload(file); await waitFor(()=>expect(screen.getByText(file.name)).toBeVisible()); }
beforeEach(()=> { vi.stubGlobal('Blob',NodeBlob); vi.mocked(addPageNumbers).mockClear(); vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:synthetic'); vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{}); vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{}); });
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('R15-01 file identity and task invalidation',()=>{
  it('replaces one valid PDF with another and generates only the replacement',async()=>{
    render(<PdfPageNumberAsyncTool/>);
    await loaded(await pdf('A.pdf'));
    await loaded(await pdf('B.pdf',3));
    expect(screen.queryByText('A.pdf')).toBeNull();
    expect(screen.getByText('B.pdf')).toBeVisible();
    expect(button()).toBeEnabled();
    fireEvent.click(button());
    await waitFor(()=>expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce());
    expect(vi.mocked(addPageNumbers).mock.calls[0][0].getPageCount()).toBe(3);
  });
  it('clears A on corrupt B, disables generation, then recovers with C',async()=>{
    render(<PdfPageNumberAsyncTool/>); await loaded(await pdf('A.pdf'));
    const bad=new File(['broken'],'B.pdf'); Object.defineProperty(bad,'arrayBuffer',{value:async()=>new TextEncoder().encode('broken').buffer}); upload(bad);
    expect(button()).toBeDisabled(); expect((document.querySelector('input[type=file]') as HTMLInputElement).value).toBe(''); expect(screen.queryByText('A.pdf')).toBeNull();
    await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('原文件已取消选择，请重新选择有效 PDF'));
    fireEvent.click(button()); expect(addPageNumbers).not.toHaveBeenCalled();
    await loaded(await pdf('C.pdf',2)); expect(button()).toBeEnabled(); expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
  it.each(['success','failure'])('ignores late upload %s after newer C',async(outcome)=>{
    render(<PdfPageNumberAsyncTool/>); const old=await pdf('B.pdf'); const delay=deferred<ArrayBuffer>(); const bytes=await old.arrayBuffer(); Object.defineProperty(old,'arrayBuffer',{value:()=>delay.promise,configurable:true});
    upload(old); await loaded(await pdf('C.pdf',2));
    await act(async()=>{if(outcome==='success')delay.resolve(bytes);else delay.reject(new Error('late failure'));});
    expect(screen.getByText('C.pdf')).toBeVisible(); expect(screen.getByRole('status')).toBeEmptyDOMElement(); expect(button()).toBeEnabled();
  });
  it('keeps an upload valid when settings change during parsing',async()=>{
    render(<PdfPageNumberAsyncTool/>); const file=await pdf('A.pdf'); const bytes=await file.arrayBuffer(); const delay=deferred<ArrayBuffer>(); Object.defineProperty(file,'arrayBuffer',{value:()=>delay.promise}); upload(file);
    fireEvent.change(screen.getByLabelText('起始编号'),{target:{value:'10'}}); expect(button()).toBeDisabled();
    await act(async()=>delay.resolve(bytes)); expect(screen.getByText('A.pdf')).toBeVisible(); expect(button()).toBeEnabled();
  });
  it('rejects repeat generation and late result after file replacement',async()=>{
    render(<PdfPageNumberAsyncTool/>); await loaded(await pdf('A.pdf')); const delay=deferred<number>(); vi.mocked(addPageNumbers).mockImplementationOnce(()=>delay.promise);
    fireEvent.click(button()); await waitFor(()=>expect(addPageNumbers).toHaveBeenCalledTimes(1)); fireEvent.click(button()); expect(addPageNumbers).toHaveBeenCalledTimes(1);
    await loaded(await pdf('C.pdf',2)); await act(async()=>delay.resolve(1)); expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled(); expect(screen.getByRole('status')).toBeEmptyDOMElement(); expect(screen.getByText('C.pdf')).toBeVisible();
  });
  it('ignores late generation failure after a successful replacement',async()=>{
    render(<PdfPageNumberAsyncTool/>); await loaded(await pdf('A.pdf')); const delay=deferred<number>(); vi.mocked(addPageNumbers).mockImplementationOnce(()=>delay.promise); fireEvent.click(button()); await waitFor(()=>expect(addPageNumbers).toHaveBeenCalled()); await loaded(await pdf('C.pdf'));
    await act(async()=>delay.reject(new Error('late generation error'))); expect(screen.getByRole('status')).toBeEmptyDOMElement(); expect(button()).toBeEnabled();
  });
  it('invalidates output on settings change and prevents download after unmount',async()=>{
    const view=render(<PdfPageNumberAsyncTool/>); await loaded(await pdf('A.pdf')); const delay=deferred<number>(); vi.mocked(addPageNumbers).mockImplementationOnce(()=>delay.promise); fireEvent.click(button()); await waitFor(()=>expect(addPageNumbers).toHaveBeenCalled()); fireEvent.change(screen.getByLabelText('起始编号'),{target:{value:'5'}}); view.unmount(); await act(async()=>delay.resolve(1)); expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });
  it('settings change alone rejects late generation and restores readiness',async()=>{
    render(<PdfPageNumberAsyncTool/>); await loaded(await pdf('A.pdf')); const delay=deferred<number>(); vi.mocked(addPageNumbers).mockImplementationOnce(()=>delay.promise); fireEvent.click(button()); await waitFor(()=>expect(addPageNumbers).toHaveBeenCalled()); fireEvent.change(screen.getByLabelText('起始编号'),{target:{value:'5'}}); await act(async()=>delay.resolve(1)); expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled(); expect(button()).toBeEnabled(); expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
  it('replacement during generation re-read prevents old document transformation',async()=>{
    render(<PdfPageNumberAsyncTool/>); const file=await pdf('A.pdf'); await loaded(file); const delay=deferred<ArrayBuffer>(); const bytes=await file.arrayBuffer(); Object.defineProperty(file,'arrayBuffer',{value:()=>delay.promise}); fireEvent.click(button()); await loaded(await pdf('C.pdf')); await act(async()=>delay.resolve(bytes)); expect(addPageNumbers).not.toHaveBeenCalled(); expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled(); expect(screen.getByText('C.pdf')).toBeVisible();
  });
  it('downloads current C, preserves its page count and clears preview on replacement',async()=>{
    render(<PdfPageNumberAsyncTool/>); await loaded(await pdf('C.pdf',2)); fireEvent.click(button()); await waitFor(()=>expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce());
    expect(screen.getByRole('status')).toHaveTextContent('完成'); expect(vi.mocked(addPageNumbers).mock.calls[0][0].getPageCount()).toBe(2);
    const blob=vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob; expect((await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()))).getPageCount()).toBe(2);
    await loaded(await pdf('D.pdf')); expect(document.querySelector('canvas')).toBeNull();
  });
});
