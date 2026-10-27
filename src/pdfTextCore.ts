import { registerBundledNotoFont } from "./fixedNotoAdapter";
import {
  type PDFDocument,
  degrees,
  rgb,
  type PDFFont,
} from "pdf-lib";

export async function embedPdfTextFont(
  document: PDFDocument,
  fontBytes: ArrayBuffer | Uint8Array,
): Promise<PDFFont> {
  await registerBundledNotoFont(document, fontBytes);
  // pdf-lib/fontkit can emit incomplete CJK subsets for some glyph sequences.
  // This asset is already reduced to ASCII + GB2312, so embed it whole for reliable rendering.
  return document.embedFont(fontBytes, { subset: false });
}

function assertFontSupportsText(font: PDFFont, text: string) {
  const supported = new Set(font.getCharacterSet());
  const missing = [...new Set(Array.from(text).filter((character) => !supported.has(character.codePointAt(0)!)))];
  if (missing.length) {
    throw new Error(
      `内置中文字体不支持以下字符：${missing.join(" ")}。为避免生成缺字或乱码的 PDF，本次未导出。`,
    );
  }
}

function assertInsidePage(left: number, bottom: number, right: number, top: number, width: number, height: number) {
  const tolerance = 0.001;
  if (left < -tolerance || bottom < -tolerance || right > width + tolerance || top > height + tolerance) {
    throw new Error("文字位置或大小超出页面范围，请缩短文字、减小字号或调整位置与偏移。错误：无法安全导出。");
  }
}

export async function addPageNumbersWithFont(
  document: PDFDocument,
  options: {
    selectedPages: ReadonlySet<number>;
    start: number;
    position: string;
    format: string;
    fontSize?: number;
    color?: { r: number; g: number; b: number };
    offsetX?: number;
    offsetY?: number;
    fontBytes: ArrayBuffer | Uint8Array;
  },
) {
  if (!options.selectedPages.size) throw new Error("过滤后没有可处理的页面，请调整页面范围或取消“跳过封面”。");
  if (!Number.isFinite(options.fontSize ?? 10) || (options.fontSize ?? 10) < 6 || (options.fontSize ?? 10) > 72) {
    throw new Error("页码字号无效，请输入 6 至 72 之间的数值。");
  }
  if (![options.offsetX ?? 0, options.offsetY ?? 0].every(Number.isFinite)) throw new Error("页码偏移无效，请输入有效数值。");
  const font = await embedPdfTextFont(document, options.fontBytes);
  let number = options.start;
  let changedPages = 0;

  document.getPages().forEach((page, index) => {
    const pageNumber = index + 1;
    if (!options.selectedPages.has(pageNumber)) return;

    const text =
      options.format === "cn"
        ? `第 ${number} 页`
        : options.format === "fraction"
          ? `${number} / ${options.selectedPages.size || document.getPageCount()}`
          : String(number);
    const size = options.fontSize ?? 10;
    assertFontSupportsText(font, text);
    const textWidth = font.widthOfTextAtSize(text, size);
    const x = options.position.endsWith("left")
      ? 30 + (options.offsetX ?? 0)
      : options.position.endsWith("right")
        ? page.getWidth() - textWidth - 30 + (options.offsetX ?? 0)
        : (page.getWidth() - textWidth) / 2 + (options.offsetX ?? 0);
    const ascent = font.heightAtSize(size, { descender: false });
    const descent = font.heightAtSize(size) - ascent;
    const y = options.position.startsWith("header")
      ? Math.min(page.getHeight() - 28, page.getHeight() - 10 - ascent)
      : Math.max(24, 10 + descent);
    const finalY = y + (options.offsetY ?? 0);
    assertInsidePage(x, finalY - descent, x + textWidth, finalY + ascent, page.getWidth(), page.getHeight());

    page.drawText(text, {
      x,
      y: finalY,
      size,
      font,
      color: rgb(options.color?.r ?? 0.08, options.color?.g ?? 0.25, options.color?.b ?? 0.16),
    });
    number += 1;
    changedPages += 1;
  });

  return changedPages;
}

export async function addTextWatermarkWithFont(
  document: PDFDocument,
  options: {
    text: string;
    selectedPages: ReadonlySet<number>;
    opacity: number;
    angle: number;
    fontSize?: number;
    color?: { r: number; g: number; b: number };
    position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
    offsetX?: number;
    offsetY?: number;
    fontBytes: ArrayBuffer | Uint8Array;
  },
) {
  if (!options.selectedPages.size) throw new Error("过滤后没有可处理的页面，请调整页面范围或取消“跳过封面”。");
  if (!Number.isFinite(options.fontSize ?? 28) || (options.fontSize ?? 28) < 8 || (options.fontSize ?? 28) > 120) {
    throw new Error("水印字号无效，请输入 8 至 120 之间的数值。");
  }
  if (!Number.isFinite(options.angle) || Math.abs(options.angle) > 180 || ![options.offsetX ?? 0, options.offsetY ?? 0].every(Number.isFinite)) {
    throw new Error("水印角度或偏移无效，请输入有效数值。");
  }
  const font = await embedPdfTextFont(document, options.fontBytes);
  const text = options.text.trim();
  const size = options.fontSize ?? 28;
  assertFontSupportsText(font, text);
  const textWidth = font.widthOfTextAtSize(text, size);
  let changedPages = 0;

  document.getPages().forEach((page, index) => {
    if (!options.selectedPages.has(index + 1)) return;
    const margin = 30;
    const position = options.position ?? "center";
    const angleRadians = (options.angle * Math.PI) / 180;
    const ascent = font.heightAtSize(size, { descender: false });
    const descent = font.heightAtSize(size) - ascent;
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);
    const corners = [[0, -descent], [0, ascent], [textWidth, -descent], [textWidth, ascent]]
      .map(([x, y]) => ({ x: x * cos - y * sin, y: x * sin + y * cos }));
    const minX = Math.min(...corners.map((p) => p.x));
    const maxX = Math.max(...corners.map((p) => p.x));
    const minY = Math.min(...corners.map((p) => p.y));
    const maxY = Math.max(...corners.map((p) => p.y));
    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;
    if (boxWidth > page.getWidth() || boxHeight > page.getHeight()) {
      throw new Error("水印文字超出页面范围，请缩短文字或减小字号。错误：无法安全导出。");
    }
    const left = position.endsWith("left")
      ? Math.min(margin, page.getWidth() - boxWidth)
      : position.endsWith("right")
        ? Math.max(0, page.getWidth() - margin - boxWidth)
        : (page.getWidth() - boxWidth) / 2;
    const bottom = position.startsWith("top")
      ? Math.max(0, page.getHeight() - margin - boxHeight)
      : position.startsWith("bottom")
        ? Math.min(margin, page.getHeight() - boxHeight)
        : (page.getHeight() - boxHeight) / 2;
    const x = left - minX + (options.offsetX ?? 0);
    const y = bottom - minY + (options.offsetY ?? 0);
    assertInsidePage(x + minX, y + minY, x + maxX, y + maxY, page.getWidth(), page.getHeight());
    page.drawText(text, {
      x,
      y,
      size,
      font,
      rotate: degrees(options.angle),
      opacity: options.opacity,
      color: rgb(options.color?.r ?? 0.85, options.color?.g ?? 0.15, options.color?.b ?? 0.25),
    });
    changedPages += 1;
  });

  return changedPages;
}
