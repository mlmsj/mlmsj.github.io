import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { addPageNumbersWithFont, addTextWatermarkWithFont } from "../src/pdfTextCore";

const fontBytes = await readFile("public/fonts/NotoSansSC-GB2312.ttf");
const cases = [
  { text: "office ffi", size: 28 },
  { text: "中文 office 123", size: 28 },
  { text: "Test () [] @# & / - %", size: 12 },
  { text: "学习 AB 19", size: 8 },
  { text: "学习 AB 19", size: 48 },
];
async function extract(bytes: Uint8Array) {
  const task = getDocument({ data: Uint8Array.from(bytes), useSystemFonts: true });
  try {
    const pdf = await task.promise;
    if (pdf.numPages !== 3) throw new Error("Page count changed");
    const pages = [];
    for (let n = 1; n <= 3; n++) {
      const content = await (await pdf.getPage(n)).getTextContent();
      pages.push(content.items.filter((x): x is typeof x & { str: string; transform: number[]; width: number } => "str" in x));
    }
    return pages;
  } finally { await task.destroy(); }
}
for (const {text, size} of cases) {
  const doc = await PDFDocument.create();
  for (let i=0; i<3; i++) doc.addPage([420, 595]);
  const count = await addTextWatermarkWithFont(doc, { text, fontSize:size, selectedPages:new Set([1,3]), angle:0, opacity:0.5, fontBytes });
  if (count !== 2) throw new Error("Unexpected selected-page count");
  const pages = await extract(await doc.save());
  if (pages[1].length !== 0) throw new Error("Unselected page changed");
  for (const n of [0,2]) {
    const item=pages[n][0];
    if (!item || item.str !== text || Math.abs(item.transform[0] - size) > 0.01 || Math.abs(item.transform[4] + item.width / 2 - 210) > 0.1) throw new Error(`Text or centered layout mismatch: ${text}`);
  }
  console.log(`PASS watermark ${JSON.stringify(text)} size=${size} pages=1,3`);
}
const pagesDoc = await PDFDocument.create();
for (let i=0; i<3; i++) pagesDoc.addPage([420,595]);
await addPageNumbersWithFont(pagesDoc,{selectedPages:new Set([1,3]),start:1,position:"footer-center",format:"cn",fontSize:18,fontBytes});
const numbered=await extract(await pagesDoc.save());
if (numbered[0][0]?.str!=="第 1 页" || numbered[1].length!==0 || numbered[2][0]?.str!=="第 2 页") throw new Error("Page numbering mismatch");
console.log("PASS selected-page Chinese numbering");
