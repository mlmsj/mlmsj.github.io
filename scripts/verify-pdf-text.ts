import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  addPageNumbersWithFont,
  addTextWatermarkWithFont,
} from "../src/pdfTextCore";

const outputDir = resolve("tmp/pdfs");
const fontPath = resolve(
  "public/fonts/NotoSansSC-GB2312.ttf",
);
const fontBytes = await readFile(fontPath);
await mkdir(outputDir, { recursive: true });

const source = await PDFDocument.create();
const baseFont = await source.embedFont(StandardFonts.Helvetica);
for (let index = 1; index <= 3; index += 1) {
  const page = source.addPage([420, 595]);
  page.drawRectangle({
    x: 36,
    y: 90,
    width: 348,
    height: 440,
    color: rgb(0.94, 0.98, 0.96),
    borderColor: rgb(0.2, 0.5, 0.35),
    borderWidth: 1,
  });
  page.drawText(`ORIGINAL PAGE ${index}`, {
    x: 72,
    y: 470,
    size: 24,
    font: baseFont,
    color: rgb(0.05, 0.2, 0.12),
  });
  page.drawText("This original content must remain readable.", {
    x: 72,
    y: 430,
    size: 12,
    font: baseFont,
  });
}
const sourceBytes = await source.save();
await writeFile(resolve(outputDir, "source-real.pdf"), sourceBytes);

async function edit(
  name: string,
  operation: (document: PDFDocument) => Promise<number>,
) {
  const document = await PDFDocument.load(sourceBytes);
  const changed = await operation(document);
  const bytes = await document.save();
  const reopened = await PDFDocument.load(bytes);
  if (reopened.getPageCount() !== 3) throw new Error(`${name}: reopen/page-count failed`);
  await writeFile(resolve(outputDir, name), bytes);
  return { name, changed, bytes: bytes.byteLength };
}

const results = [
  await edit("page-number-cn.pdf", (document) =>
    addPageNumbersWithFont(document, {
      selectedPages: new Set([2]),
      start: 1,
      position: "footer-center",
      format: "cn",
      fontBytes,
    }),
  ),
  await edit("watermark-cn.pdf", (document) =>
    addTextWatermarkWithFont(document, {
      selectedPages: new Set([3]),
      text: "仅供学习使用",
      opacity: 0.3,
      angle: -30,
      fontBytes,
    }),
  ),
  await edit("page-number-en.pdf", (document) =>
    addPageNumbersWithFont(document, {
      selectedPages: new Set([1]),
      start: 1,
      position: "footer-center",
      format: "plain",
      fontBytes,
    }),
  ),
  await edit("watermark-en.pdf", (document) =>
    addTextWatermarkWithFont(document, {
      selectedPages: new Set([2]),
      text: "STUDY COPY",
      opacity: 0.3,
      angle: -30,
      fontBytes,
    }),
  ),
];

if (results.some((result) => result.changed !== 1)) {
  throw new Error(`Selected-page count failed: ${JSON.stringify(results)}`);
}

const unsupported = await PDFDocument.load(sourceBytes);
let unsupportedRejected = false;
try {
  await addTextWatermarkWithFont(unsupported, {
    selectedPages: new Set([1]),
    text: "不支持字符 🧪",
    opacity: 0.3,
    angle: 0,
    fontBytes,
  });
} catch (error) {
  unsupportedRejected =
    error instanceof Error && error.message.includes("为避免生成缺字或乱码的 PDF，本次未导出");
}
if (!unsupportedRejected) throw new Error("Unsupported glyph was not rejected clearly");

console.log(JSON.stringify(results, null, 2));
console.log("PASS unsupported-glyph rejection");
