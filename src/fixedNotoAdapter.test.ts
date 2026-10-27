import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { embedPdfTextFont } from "./pdfTextCore";

describe("bundled font verification", () => {
  it("rejects changed font bytes before embedding", async () => {
    const bytes = new Uint8Array(readFileSync("public/fonts/NotoSansSC-GB2312.ttf"));
    bytes[100] ^= 1;
    const doc = await PDFDocument.create();
    await expect(embedPdfTextFont(doc, bytes)).rejects.toThrow("内置字体校验失败");
  });
});
