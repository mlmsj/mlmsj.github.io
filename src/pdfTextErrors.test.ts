import { afterEach, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

it('reports invalid layout without falsely blaming font loading', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })));
  const { addTextWatermark } = await import('./pdfText');
  const doc = await PDFDocument.create();
  await expect(addTextWatermark(doc, { text: 'hello', selectedPages: new Set([1]), opacity: .5, angle: 0, fontSize: 0 })).rejects.toThrow('水印字号无效');
});

it('reports font fetch failures separately', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
  const { addTextWatermark } = await import('./pdfText');
  const doc = await PDFDocument.create();
  await expect(addTextWatermark(doc, { text: 'hello', selectedPages: new Set([1]), opacity: .5, angle: 0 })).rejects.toThrow('中文字体加载失败');
});
