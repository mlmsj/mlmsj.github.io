import type { PDFDocument } from "pdf-lib";
import {
  addPageNumbersWithFont,
  addTextWatermarkWithFont,
} from "./pdfTextCore";

const notoSansScUrl = `${import.meta.env.BASE_URL}fonts/NotoSansSC-GB2312.ttf`;
export const PDF_FONT_LICENSE_URL = `${import.meta.env.BASE_URL}fonts/NotoSansSC-OFL-1.1.txt`;

let bundledFontBytes: Promise<ArrayBuffer> | undefined;

const fetchBundledFont = () => {
  bundledFontBytes ??= fetch(notoSansScUrl).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.arrayBuffer();
  });
  return bundledFontBytes;
};

async function withBundledFont<T>(
  operation: (fontBytes: ArrayBuffer) => Promise<T>,
): Promise<T> {
  let fontBytes: ArrayBuffer;
  try {
    fontBytes = await fetchBundledFont();
  } catch (error) {
    bundledFontBytes = undefined;
    const detail = error instanceof Error ? `（${error.message}）` : "";
    throw new Error(
      `中文字体加载失败${detail}。为避免生成缺字或乱码的 PDF，本次未导出，请刷新页面后重试。`,
    );
  }
  return operation(fontBytes);
}

export async function addPageNumbers(
  document: PDFDocument,
  options: {
    selectedPages: ReadonlySet<number>;
    start: number;
    position: string;
    format: string;
    fontSize?: number; color?: { r: number; g: number; b: number }; offsetX?: number; offsetY?: number;
  },
) {
  return withBundledFont((fontBytes) =>
    addPageNumbersWithFont(document, { ...options, fontBytes }),
  );
}

export async function addTextWatermark(
  document: PDFDocument,
  options: {
    text: string;
    selectedPages: ReadonlySet<number>;
    opacity: number;
    angle: number;
    fontSize?: number; color?: { r: number; g: number; b: number }; position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"; offsetX?: number; offsetY?: number;
  },
) {
  return withBundledFont((fontBytes) =>
    addTextWatermarkWithFont(document, { ...options, fontBytes }),
  );
}
