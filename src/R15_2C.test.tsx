import { Blob as NodeBlob, Buffer } from "node:buffer";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PDFDocument } from "pdf-lib";
import * as pdfjs from "pdfjs-dist";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OcrTool } from "./OcrTool";
import { ToolDetail, type ToolKey } from "./Toolbox";

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn(() => ({ promise: new Promise(() => undefined) })),
}));
vi.mock("./pdfText", () => ({
  addPageNumbers: vi.fn(async () => 1),
  addTextWatermark: vi.fn(async () => 1),
}));

const imageTools = ["images-to-pdf", "image-compress"] as const satisfies readonly ToolKey[];
const ONE_PIXEL_JPEG = Uint8Array.from(Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=",
  "base64",
));
const primary = () => document.querySelector<HTMLButtonElement>("button.primary-action")!;
const upload = (files: File[]) => fireEvent.change(document.querySelector("input[type=file]")!, { target: { files } });
const gridNames = () => Array.from(document.querySelectorAll(".image-file-grid strong"), node => node.textContent);
const toolMessage = () => document.querySelector<HTMLElement>(".tool-message")!;
const validImage = (name = "valid.png", type = "image/png") => new File(["synthetic image"], name, { type });
const badImage = (name = "bad.png") => new File(["not an image"], name, { type: "image/png" });

async function syntheticPdf(name: string, pages: number) {
  const document = await PDFDocument.create();
  for (let index = 0; index < pages; index++) document.addPage([120, 160]);
  const bytes = await document.save();
  const file = new File([bytes as BlobPart], name, { type: "application/pdf" });
  Object.defineProperty(file, "arrayBuffer", {
    configurable: true,
    value: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  });
  return file;
}

function show(tool: ToolKey) {
  render(<ToolDetail tool={tool} back={() => undefined} />);
}

async function expectImageProcessing(tool: (typeof imageTools)[number], expected: number) {
  if (tool === "images-to-pdf") {
    vi.spyOn(PDFDocument, "create").mockResolvedValue({
      embedJpg: vi.fn(async () => ({ width: 8, height: 6 })),
      addPage: vi.fn(() => ({ drawImage: vi.fn() })),
      save: vi.fn(async () => new Uint8Array([1, 2, 3])),
    } as never);
  }
  fireEvent.click(primary());
  if (tool === "images-to-pdf") {
    await waitFor(() => expect(toolMessage()).toHaveTextContent("PDF 已真实生成"));
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  } else {
    await waitFor(() => expect(document.querySelectorAll(".compress-row")).toHaveLength(expected));
    expect(toolMessage()).toHaveTextContent("完成");
  }
}

beforeEach(() => {
  vi.stubGlobal("Blob", NodeBlob);
  vi.stubGlobal("createImageBitmap", vi.fn(async (source: ImageBitmapSource) => {
    const name = source instanceof File ? source.name : "";
    if (name.startsWith("bad")) throw new DOMException("The image source is invalid", "InvalidStateError");
    return { width: 8, height: 6, close: vi.fn() } as unknown as ImageBitmap;
  }));
  let objectUrl = 0;
  vi.spyOn(URL, "createObjectURL").mockImplementation(() => `blob:r15-2c-${++objectUrl}`);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
    fillRect: vi.fn(),
  } as never);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (callback, type) {
    callback(new NodeBlob([ONE_PIXEL_JPEG], { type: type ?? "image/jpeg" }) as unknown as Blob);
  });
  vi.mocked(pdfjs.getDocument).mockReset().mockReturnValue({ promise: new Promise(() => undefined) } as never);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([
  [1, "1"],
  [3, "1-3"],
] as const)("R15-2B-01: %i-page PDF gets valid default range %s and can generate", async (pages, expectedRange) => {
  show("split");
  upload([await syntheticPdf(`${pages}-page.pdf`, pages)]);
  await waitFor(() => expect(screen.getByText(`${pages}-page.pdf`)).toBeVisible());
  expect(screen.getByLabelText("页码范围")).toHaveValue(expectedRange);
  expect(primary()).toBeEnabled();
  fireEvent.click(primary());
  await waitFor(() => expect(toolMessage()).toHaveTextContent("已生成 1 个真实文件"));
  expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
});

it("R15-2B-01: custom valid and invalid ranges retain existing semantics", async () => {
  show("split");
  upload([await syntheticPdf("three-page.pdf", 3)]);
  await waitFor(() => expect(screen.getByText("three-page.pdf")).toBeVisible());
  const range = screen.getByLabelText("页码范围");
  fireEvent.change(range, { target: { value: "1-2, 3" } });
  expect(primary()).toBeEnabled();
  for (const invalid of ["0", "4", "2-1", "abc", ""]) {
    fireEvent.change(range, { target: { value: invalid } });
    expect(primary()).toBeDisabled();
  }
});

it.each([
  ["valid.png", "image/png"],
  ["valid.jpg", "image/jpeg"],
  ["valid.webp", "image/webp"],
] as const)("R15-2B-02: OCR accepts decodable %s", async (name, type) => {
  render(<OcrTool workerFactory={async () => { throw new Error("OCR model must not start"); }} />);
  upload([validImage(name, type)]);
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 个文件已准备就绪"));
  expect(primary()).toBeEnabled();
});

it.each([
  ["zero", "zero.png"],
  ["corrupt", "bad.png"],
] as const)("R15-2B-02: OCR rejects %s image before ready", async (kind, name) => {
  render(<OcrTool workerFactory={async () => { throw new Error("OCR model must not start"); }} />);
  const file = kind === "zero" ? new File([], name, { type: "image/png" }) : badImage(name);
  upload([file]);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(name));
  expect(screen.getByRole("alert")).toHaveTextContent("无法读取");
  expect(primary()).toBeDisabled();
  expect(document.querySelector(".ocr-workspace")).toBeNull();
});

it("R15-2B-02: OCR valid to invalid to valid recovers without starting the model", async () => {
  const factory = vi.fn(async () => { throw new Error("OCR model must not start"); });
  render(<OcrTool workerFactory={factory} />);
  upload([validImage("first.png")]);
  await waitFor(() => expect(screen.getByText("first.png")).toBeVisible());
  upload([badImage()]);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("bad.png"));
  expect(screen.queryByText("first.png")).toBeNull();
  expect(primary()).toBeDisabled();
  upload([validImage("recovered.png")]);
  await waitFor(() => expect(screen.getByText("recovered.png")).toBeVisible());
  expect(primary()).toBeEnabled();
  expect(factory).not.toHaveBeenCalled();
});

it("R15-2B-02: OCR keeps the 15 MiB image and 10-file limits", async () => {
  render(<OcrTool workerFactory={async () => { throw new Error("OCR model must not start"); }} />);
  const exact = validImage("exact-limit.png");
  Object.defineProperty(exact, "size", { value: 15 * 1024 * 1024 });
  upload([exact]);
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 个文件已准备就绪"));
  const eleven = Array.from({ length: 11 }, (_, index) => validImage(`${index}.png`));
  upload(eleven);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("每批最多选择 10"));
  expect(primary()).toBeDisabled();
});

it("R15-2B-02: OCR keeps the 20-page PDF boundary", async () => {
  const documentFor = (pages: number) => ({
    numPages: pages,
    cleanup: vi.fn(),
    destroy: vi.fn(async () => undefined),
  });
  vi.mocked(pdfjs.getDocument)
    .mockReturnValueOnce({ promise: Promise.resolve(documentFor(20)), destroy: vi.fn(async () => undefined) } as never)
    .mockReturnValueOnce({ promise: Promise.resolve(documentFor(21)), destroy: vi.fn(async () => undefined) } as never);
  render(<OcrTool workerFactory={async () => { throw new Error("OCR model must not start"); }} />);
  const pdf = (name: string) => {
    const file = new File(["%PDF-synthetic"], name, { type: "application/pdf" });
    Object.defineProperty(file, "slice", { value: () => new NodeBlob(["%PDF-"]) });
    Object.defineProperty(file, "arrayBuffer", { value: async () => new TextEncoder().encode("%PDF-synthetic").buffer });
    return file;
  };
  upload([pdf("twenty.pdf")]);
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("20 个页面"));
  expect(primary()).toBeEnabled();
  upload([pdf("twenty-one.pdf")]);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("PDF 最多支持 20 页"));
  expect(primary()).toBeDisabled();
});

it.each(imageTools)("R15-2B-03: %s processes one valid image", async tool => {
  show(tool);
  upload([validImage()]);
  await waitFor(() => expect(gridNames()).toEqual(["valid.png"]));
  await expectImageProcessing(tool, 1);
});

it.each(imageTools)("R15-2B-03: %s processes two valid images", async tool => {
  show(tool);
  upload([validImage("one.png"), validImage("two.png")]);
  await waitFor(() => expect(gridNames()).toEqual(["one.png", "two.png"]));
  await expectImageProcessing(tool, 2);
});

it.each(imageTools)("R15-2B-03: %s keeps valid input when a later bad image is rejected", async tool => {
  show(tool);
  upload([validImage()]);
  await waitFor(() => expect(gridNames()).toEqual(["valid.png"]));
  upload([badImage()]);
  await waitFor(() => expect(toolMessage()).toHaveTextContent("bad.png"));
  expect(toolMessage()).toHaveTextContent("无法读取");
  expect(gridNames()).toEqual(["valid.png"]);
  expect(primary()).toBeEnabled();
  await expectImageProcessing(tool, 1);
});

it.each(imageTools)("R15-2B-03: %s recovers from bad input when a valid image is selected", async tool => {
  show(tool);
  upload([badImage()]);
  await waitFor(() => expect(toolMessage()).toHaveTextContent("bad.png"));
  expect(primary()).toBeDisabled();
  upload([validImage()]);
  await waitFor(() => expect(gridNames()).toEqual(["valid.png"]));
  expect(primary()).toBeEnabled();
  await expectImageProcessing(tool, 1);
});

it.each(imageTools)("R15-2B-03: %s isolates a bad image in a mixed selection", async tool => {
  show(tool);
  upload([validImage(), badImage()]);
  await waitFor(() => expect(toolMessage()).toHaveTextContent("bad.png"));
  expect(toolMessage()).toHaveTextContent("无法读取");
  expect(gridNames()).toEqual(["valid.png"]);
  expect(primary()).toBeEnabled();
  await expectImageProcessing(tool, 1);
});

it.each(imageTools)("R15-2B-03: %s rejects an all-bad selection", async tool => {
  show(tool);
  upload([badImage("bad-one.png"), badImage("bad-two.png")]);
  await waitFor(() => expect(toolMessage()).toHaveTextContent("bad-one.png"));
  expect(toolMessage()).toHaveTextContent("bad-two.png");
  expect(gridNames()).toEqual([]);
  expect(primary()).toBeDisabled();
});
