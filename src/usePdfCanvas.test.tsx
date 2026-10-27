import { Blob as NodeBlob } from 'node:buffer';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as pdfjs from 'pdfjs-dist';
import { usePdfCanvas } from './usePdfCanvas';

vi.mock('pdfjs-dist', () => ({ getDocument: vi.fn() }));
function pending<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function Preview({ file }: { file?: Blob }) {
  const { canvas, error } = usePdfCanvas(file);
  return <><canvas ref={canvas} /><span role="status">{error}</span></>;
}
const file = () => new NodeBlob(['synthetic PDF bytes']) as unknown as Blob;
function documentTask(width: number, height: number, rendering?: ReturnType<typeof pending<void>>) {
  const cancel = vi.fn(() => rendering?.reject(Error('cancelled')));
  const page = { getViewport: vi.fn(() => ({ width, height })), render: vi.fn(() => ({ promise: rendering?.promise ?? Promise.resolve(), cancel })) };
  const document = { numPages: 1, getPage: vi.fn(async () => page) };
  const loading = { promise: Promise.resolve(document), destroy: vi.fn(async () => {}) };
  return { loading, document, page, cancel };
}
beforeEach(() => {
  vi.mocked(pdfjs.getDocument).mockReset();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('clears rendered pixels when the file is removed and destroys each loading task once', async () => {
  const task = documentTask(100, 200);
  vi.mocked(pdfjs.getDocument).mockReturnValue(task.loading as never);
  const view = render(<Preview file={file()} />);
  const canvas = view.container.querySelector('canvas')!;
  await waitFor(() => expect(canvas.width).toBe(100));
  view.rerender(<Preview />);
  expect([canvas.width, canvas.height]).toEqual([0, 0]);
  expect(task.loading.destroy).toHaveBeenCalledOnce();
});

it('ignores a document that finishes loading after a newer file', async () => {
  const slow = pending<unknown>();
  const old = documentTask(100, 200);
  const next = documentTask(300, 400);
  vi.mocked(pdfjs.getDocument).mockReturnValueOnce({ ...old.loading, promise: slow.promise } as never).mockReturnValueOnce(next.loading as never);
  const view = render(<Preview file={file()} />);
  await waitFor(() => expect(pdfjs.getDocument).toHaveBeenCalledOnce());
  view.rerender(<Preview file={file()} />);
  const canvas = view.container.querySelector('canvas')!;
  await waitFor(() => expect(canvas.width).toBe(300));
  await act(async () => slow.resolve(old.document));
  expect([canvas.width, canvas.height]).toEqual([300, 400]);
  expect(old.document.getPage).not.toHaveBeenCalled();
  expect(old.loading.destroy).toHaveBeenCalledOnce();
});

it('cancels an obsolete render without clearing the newer preview or showing an error', async () => {
  const running = pending<void>();
  const old = documentTask(100, 200, running);
  const next = documentTask(300, 400);
  vi.mocked(pdfjs.getDocument).mockReturnValueOnce(old.loading as never).mockReturnValueOnce(next.loading as never);
  const view = render(<Preview file={file()} />);
  await waitFor(() => expect(old.page.render).toHaveBeenCalledOnce());
  view.rerender(<Preview file={file()} />);
  await waitFor(() => expect(next.page.render).toHaveBeenCalledOnce());
  expect(old.cancel).toHaveBeenCalledOnce();
  expect(view.container.querySelector('canvas')!.width).toBe(300);
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});

it('recovers from a preview failure on a new file', async () => {
  const next = documentTask(300, 400);
  vi.mocked(pdfjs.getDocument).mockReturnValueOnce({ promise: Promise.reject(Error('broken')), destroy: vi.fn(async () => {}) } as never).mockReturnValueOnce(next.loading as never);
  const view = render(<Preview file={file()} />);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('PDF 预览失败'));
  view.rerender(<Preview file={file()} />);
  await waitFor(() => expect(view.container.querySelector('canvas')!.width).toBe(300));
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});

it('does not surface an obsolete loading failure after the new preview succeeds', async () => {
  const slow = pending<unknown>();
  const next = documentTask(300, 400);
  vi.mocked(pdfjs.getDocument).mockReturnValueOnce({ promise: slow.promise, destroy: vi.fn(async () => {}) } as never).mockReturnValueOnce(next.loading as never);
  const view = render(<Preview file={file()} />);
  await waitFor(() => expect(pdfjs.getDocument).toHaveBeenCalledOnce());
  view.rerender(<Preview file={file()} />);
  await waitFor(() => expect(next.page.render).toHaveBeenCalledOnce());
  await act(async () => slow.reject(Error('old failure')));
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
  expect(view.container.querySelector('canvas')!.width).toBe(300);
});
