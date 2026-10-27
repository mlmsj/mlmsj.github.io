import metrics from "./notoFontMetrics.json";
import type { PDFDocument } from "pdf-lib";

// This adapter only supports the exact bundled TrueType font and full embedding.
// The metrics are derived from that font, which is distributed under the OFL.
const entries = new Map(metrics.entries.map(([codePoint, id, advanceWidth]) => [codePoint, { id, advanceWidth, codePoints: [codePoint] }]));
const fallback = { id: 0, advanceWidth: 0, codePoints: [] as number[] };
const fixedFont = {
  postscriptName: metrics.postscriptName,
  unitsPerEm: metrics.unitsPerEm,
  ascent: metrics.ascent,
  descent: metrics.descent,
  capHeight: metrics.capHeight,
  xHeight: metrics.xHeight,
  italicAngle: metrics.italicAngle,
  bbox: metrics.bbox,
  characterSet: metrics.entries.map(([codePoint]) => codePoint),
  cff: false,
  "OS/2": { sFamilyClass: 0 },
  head: { macStyle: { italic: false } },
  post: { isFixedPitch: false },
  glyphForCodePoint: (codePoint: number) => entries.get(codePoint) ?? fallback,
  layout: (text: string) => ({ glyphs: Array.from(text, c => entries.get(c.codePointAt(0)!) ?? fallback) }),
};

export async function registerBundledNotoFont(document: PDFDocument, fontBytes: ArrayBuffer | Uint8Array) {
  const bytes = fontBytes instanceof Uint8Array ? Uint8Array.from(fontBytes) : new Uint8Array(fontBytes);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), b => b.toString(16).padStart(2, "0")).join("");
  if (hash !== metrics.fontSha256) throw new Error("内置字体校验失败，请刷新后重试。");
  // pdf-lib accesses only these members with subset: false.
  const adapter = { create: () => fixedFont } as unknown as Parameters<PDFDocument["registerFontkit"]>[0];
  document.registerFontkit(adapter);
}
