import type { ToolKey } from "./Toolbox";

export type ToolCatalogItem = { id: ToolKey; name: string; path: string; available: boolean };

export const toolCatalog: readonly ToolCatalogItem[] = [
  ["nup", "PDF 拼版打印", "/tools/pdf-nup"],
  ["print-page-adjust", "打印页面调整", "/tools/print-page-adjust"],
  ["image-sheet-layout", "图片批量排版", "/tools/image-sheet-layout"],
  ["pdf-page-organizer", "PDF 页面整理", "/tools/pdf-page-organizer"],
  ["merge", "PDF 合并", "/tools/pdf-merge"],
  ["split", "PDF 拆分", "/tools/pdf-split"],
  ["pdf-compress", "PDF 压缩", "/tools/pdf-compress"],
  ["images-to-pdf", "图片转 PDF", "/tools/images-to-pdf"],
  ["pdf-to-images", "PDF 转图片", "/tools/pdf-to-images"],
  ["image-compress", "图片压缩", "/tools/image-compress"],
  ["image-format-convert", "图片格式转换", "/tools/image-format-convert"],
  ["image-resize", "图片尺寸调整", "/tools/image-resize"],
  ["ocr", "OCR 文字识别", "/tools/ocr"],
  ["page-number", "PDF 添加页码", "/tools/page-number"],
  ["watermark", "PDF 添加文字水印", "/tools/watermark"],
].map(([id, name, path]) => ({ id: id as ToolKey, name, path, available: true }));
