import { Blob as NodeBlob } from "node:buffer";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  IMAGE_SHEET_GAP_ERROR,
  IMAGE_SHEET_GAP_MAX,
  ImageSheetLayoutTool,
  parseImageSheetGap,
} from "./ToolboxPhase2";

const image = () => new File(["synthetic image"], "sheet.png", { type: "image/png" });
const primary = () => screen.getByRole("button", { name: "生成可打印 PDF" });
const gapInput = () => screen.getByLabelText("图片间距（mm）");

function installGenerationStubs() {
  const page = { drawImage: vi.fn() };
  const document = {
    addPage: vi.fn(() => page),
    embedJpg: vi.fn(async () => ({ width: 320, height: 200 })),
    save: vi.fn(async () => new Uint8Array([1, 2, 3])),
  };
  vi.spyOn(PDFDocument, "create").mockResolvedValue(document as never);
  return { document, page };
}

async function loadImage() {
  render(<ImageSheetLayoutTool />);
  fireEvent.change(document.querySelector("input[type=file]")!, { target: { files: [image()] } });
  await waitFor(() => expect(screen.getByText("sheet.png")).toBeVisible());
}

beforeEach(() => {
  vi.stubGlobal("Blob", NodeBlob);
  vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 320, height: 200, close: vi.fn() })));
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:image");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
    fillRect: vi.fn(),
  } as never);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => {
    callback(new NodeBlob(["synthetic jpeg"], { type: "image/jpeg" }) as unknown as Blob);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("parseImageSheetGap", () => {
  it.each([
    [-1, undefined],
    ["-1", undefined],
    [0, 0],
    ["0", 0],
    [10, 10],
    ["12.5", 12.5],
    [IMAGE_SHEET_GAP_MAX, IMAGE_SHEET_GAP_MAX],
    ["40", IMAGE_SHEET_GAP_MAX],
    [41, undefined],
    ["40.1", undefined],
    ["", undefined],
    ["abc", undefined],
    [NaN, undefined],
    [Infinity, undefined],
    ["Infinity", undefined],
  ])("accepts only finite gaps in the legal range: %s", (value, expected) => {
    expect(parseImageSheetGap(value)).toBe(expected);
  });
});

it.each(["-1", "41", "abc", "", "1e309"]) (
  "rejects invalid input %s before generation and download",
  async value => {
    await loadImage();
    const { document } = installGenerationStubs();
    fireEvent.change(gapInput(), { target: { value } });
    expect(primary()).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(IMAGE_SHEET_GAP_ERROR);

    // Simulate a caller bypassing the disabled UI control.
    (primary() as HTMLButtonElement).disabled = false;
    fireEvent.click(primary());
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(IMAGE_SHEET_GAP_ERROR));
    expect(document.addPage).not.toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
    expect(screen.queryByText("排版完成，PDF 已开始下载。")).toBeNull();
  },
);

it.each(["0", "10", "40"])("keeps legal gap %s mm generatable", async value => {
  await loadImage();
  const { document, page } = installGenerationStubs();
  fireEvent.change(gapInput(), { target: { value } });
  expect(primary()).toBeEnabled();
  fireEvent.click(primary());
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("排版完成，PDF 已开始下载。"));
  expect(document.addPage).toHaveBeenCalledOnce();
  expect(page.drawImage).toHaveBeenCalledOnce();
  expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
});
