import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { addPageNumbersWithFont, addTextWatermarkWithFont } from "../src/pdfTextCore";

const fontBytes = await readFile("public/fonts/NotoSansSC-GB2312.ttf");
const source = await PDFDocument.create();
const font = await source.embedFont(StandardFonts.Helvetica);
for (let page = 1; page <= 3; page += 1) {
  const pdfPage = source.addPage([420, 595]);
  pdfPage.drawText(`ORIGINAL PAGE ${page}`, { x: 40, y: 520, font, size: 20 });
}
const sourceBytes = await source.save();

const select = (range: string, skip: boolean, total = 3) => {
  const pages = new Set<number>();
  if (!range.trim()) for (let page = 1; page <= total; page += 1) pages.add(page);
  else { const [first, last = first] = range.split("-").map(Number); for (let page = first; page <= last; page += 1) pages.add(page); }
  if (skip) pages.delete(1);
  return pages;
};

async function run(name: string, range: string, skip: boolean, operation: (doc: PDFDocument, pages: Set<number>) => Promise<number>, expected: number) {
  const doc = await PDFDocument.load(sourceBytes);
  const changed = await operation(doc, select(range, skip));
  const output = await doc.save();
  const reopened = await PDFDocument.load(output);
  if (changed !== expected || reopened.getPageCount() !== 3) throw new Error(`${name} failed: changed=${changed}`);
  return { name, changed, pages: reopened.getPageCount(), bytes: output.byteLength };
}

const pageNumber = (doc: PDFDocument, pages: Set<number>) => addPageNumbersWithFont(doc, { selectedPages: pages, start: 1, position: "footer-center", format: "plain", fontBytes });
const watermark = (doc: PDFDocument, pages: Set<number>) => addTextWatermarkWithFont(doc, { selectedPages: pages, text: "TEST", opacity: .3, angle: 0, fontBytes });
const results = [];
for (const operation of [pageNumber, watermark]) {
  results.push(await run("empty-range-skip", "", true, operation, 2));
  results.push(await run("range-all-skip", "1-3", true, operation, 2));
  results.push(await run("empty-range-keep-cover", "", false, operation, 3));
  const none = await PDFDocument.load(sourceBytes);
  let rejected = false;
  try { await operation(none, select("1", true)); } catch (error) { rejected = error instanceof Error && error.message.includes("没有可处理的页面"); }
  if (!rejected) throw new Error("empty-after-filter was not rejected");
  const one = await PDFDocument.load(sourceBytes);
  let oneRejected = false;
  try { await operation(one, new Set<number>()); } catch (error) { oneRejected = error instanceof Error && error.message.includes("没有可处理的页面"); }
  if (!oneRejected) throw new Error("one-page equivalent empty selection was not rejected");
}
for (const operation of [pageNumber, watermark]) {
  const onePage = await PDFDocument.create();
  onePage.addPage([420, 595]);
  let rejected = false;
  try { await operation(onePage, select("", true, 1)); } catch (error) { rejected = error instanceof Error && error.message.includes("没有可处理的页面"); }
  if (!rejected) throw new Error("one-page PDF skip-cover was not rejected");
}
console.log(JSON.stringify(results, null, 2));
console.log("PASS skip-cover selection matrix for page numbers and watermarks");
