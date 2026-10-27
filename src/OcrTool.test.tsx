import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OcrTool, type OcrWorkerFactory } from "./OcrTool";

type Outcome = string | Error | Promise<string | Error>;

const image = (name: string) => new File([new Uint8Array([137, 80, 78, 71])], name, { type: "image/png" });

const factoryFrom = (...outcomes: Outcome[]): { factory: OcrWorkerFactory; recognizeCalls: () => number; terminateCalls: () => number } => {
  let index = 0;
  let recognizes = 0;
  let terminates = 0;
  const factory: OcrWorkerFactory = async () => ({
    recognize: async () => {
      recognizes++;
      const outcome = outcomes[index++];
      if (outcome instanceof Error) throw outcome;
      return { data: { text: await outcome } };
    },
    terminate: async () => { terminates++; },
  } as never);
  return { factory, recognizeCalls: () => recognizes, terminateCalls: () => terminates };
};

const uploadThree = async (factory: OcrWorkerFactory) => {
  render(<OcrTool workerFactory={factory} />);
  const input = screen.getByLabelText(/点击选择 PDF/);
  fireEvent.change(input, { target: { files: [image("page-1.png"), image("page-2.png"), image("page-3.png")] } });
  await waitFor(() => expect(screen.getByText(/3 个文件已准备就绪/)).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "开始本地识别" }));
};

const pageButton = (page: string) => screen.getAllByRole("button").find(button => button.textContent?.startsWith(page))!;
const fileButton = (name: string) => screen.getByRole("button", { name });
const activeResult = () => screen.getByRole("textbox");

beforeEach(() => {
  vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 8, height: 6, close: vi.fn() })));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("OCR isolated failure and retry behavior", () => {
  it("A: isolates a middle-page failure", async () => {
    const mock = factoryFrom("PAGE-1", new Error("page 2 failed"), "PAGE-3");
    await uploadThree(mock.factory);
    await waitFor(() => expect(pageButton("1")).toHaveTextContent("成功"));
    expect(fileButton("page-2.png")).toHaveTextContent("page-2.png");
    fireEvent.click(fileButton("page-2.png"));
    expect(pageButton("1")).toHaveTextContent("失败");
    fireEvent.click(fileButton("page-1.png"));
    expect(activeResult()).toHaveValue("PAGE-1");
    fireEvent.click(fileButton("page-3.png"));
    expect(activeResult()).toHaveValue("PAGE-3");
  });

  it("B: retries only the failed page and preserves other pages", async () => {
    const mock = factoryFrom(new Error("first failure"), "PAGE-2", "PAGE-3", "PAGE-2-RETRY");
    await uploadThree(mock.factory);
    await waitFor(() => expect(pageButton("1")).toHaveTextContent("失败"));
    fireEvent.click(pageButton("1"));
    fireEvent.click(screen.getByRole("button", { name: "重新识别" }));
    await waitFor(() => expect(pageButton("1")).toHaveTextContent("成功"));
    expect(activeResult()).toHaveValue("PAGE-2-RETRY");
    expect(mock.recognizeCalls()).toBe(4);
  });

  it("C: keeps existing edited text when retry fails again", async () => {
    const mock = factoryFrom(new Error("first failure"), "PAGE-2", "PAGE-3", new Error("retry failure"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await uploadThree(mock.factory);
    await waitFor(() => expect(pageButton("1")).toHaveTextContent("失败"));
    fireEvent.change(activeResult(), { target: { value: "人工保留文本" } });
    fireEvent.click(screen.getByRole("button", { name: "重新识别" }));
    await waitFor(() => expect(pageButton("1")).toHaveTextContent("失败"));
    expect(activeResult()).toHaveValue("人工保留文本");
  });

  it("D: cancelling overwrite confirmation does not start OCR", async () => {
    const mock = factoryFrom(new Error("first failure"), "PAGE-2", "PAGE-3", "SHOULD-NOT-RUN");
    vi.spyOn(window, "confirm").mockReturnValue(false);
    await uploadThree(mock.factory);
    await waitFor(() => expect(pageButton("1")).toHaveTextContent("失败"));
    fireEvent.change(activeResult(), { target: { value: "人工文本" } });
    fireEvent.click(screen.getByRole("button", { name: "重新识别" }));
    expect(window.confirm).toHaveBeenCalled();
    expect(mock.recognizeCalls()).toBe(3);
    expect(activeResult()).toHaveValue("人工文本");
  });

  it("E: confirming overwrite retries and replaces only the target page", async () => {
    const mock = factoryFrom(new Error("first failure"), "PAGE-2", "PAGE-3", "NEW-OCR");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await uploadThree(mock.factory);
    await waitFor(() => expect(pageButton("1")).toHaveTextContent("失败"));
    fireEvent.change(activeResult(), { target: { value: "人工文本" } });
    fireEvent.click(screen.getByRole("button", { name: "重新识别" }));
    await waitFor(() => expect(pageButton("1")).toHaveTextContent("成功"));
    expect(activeResult()).toHaveValue("NEW-OCR");
    fireEvent.click(fileButton("page-2.png"));
    expect(activeResult()).toHaveValue("PAGE-2");
  });

  it("F: ignores an old task callback after a newer task completes", async () => {
    let releaseOld!: (value: string) => void;
    const oldResult = new Promise<string>(resolve => { releaseOld = resolve; });
    const first = factoryFrom(oldResult);
    const second = factoryFrom("NEW-TASK");
    let factoryCalls = 0;
    const factory: OcrWorkerFactory = async (...args) => factoryCalls++ === 0 ? first.factory(...args) : second.factory(...args);
    render(<OcrTool workerFactory={factory} />);
    const input = screen.getByLabelText(/点击选择 PDF/);
    fireEvent.change(input, { target: { files: [image("page-1.png")] } });
    await waitFor(() => expect(screen.getByText(/1 个文件已准备就绪/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "开始本地识别" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "取消识别" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "取消识别" }));
    fireEvent.click(screen.getByRole("button", { name: "开始本地识别" }));
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue("NEW-TASK"));
    releaseOld("OLD-TASK");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(screen.getByRole("textbox")).toHaveValue("NEW-TASK");
  });

  it("G: ignores a late callback after cancellation", async () => {
    let release!: (value: string) => void;
    const delayed = new Promise<string>(resolve => { release = resolve; });
    const mock = factoryFrom(delayed);
    render(<OcrTool workerFactory={mock.factory} />);
    const input = screen.getByLabelText(/点击选择 PDF/);
    fireEvent.change(input, { target: { files: [image("page-1.png")] } });
    await waitFor(() => expect(screen.getByText(/1 个文件已准备就绪/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "开始本地识别" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "取消识别" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "取消识别" }));
    expect(screen.getByRole("textbox")).toHaveValue("");
    release("LATE-RESULT");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(mock.terminateCalls()).toBe(1);
  });

  it("H: waits for an in-flight rejection before terminating the Worker", async () => {
    let rejectRecognition!: (reason: Error) => void;
    const inFlight = new Promise<never>((_, reject) => { rejectRecognition = reject; });
    let terminateCalls = 0;
    const factory: OcrWorkerFactory = async () => ({
      recognize: () => inFlight,
      terminate: async () => { terminateCalls++; },
    } as never);
    render(<OcrTool workerFactory={factory} />);
    const input = screen.getByLabelText(/点击选择 PDF/);
    fireEvent.change(input, { target: { files: [image("page-1.png")] } });
    await waitFor(() => expect(screen.getByText(/1 个文件已准备就绪/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "开始本地识别" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "取消识别" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "取消识别" }));
    expect(terminateCalls).toBe(0);
    rejectRecognition(Error("识别请求已取消"));
    await waitFor(() => expect(terminateCalls).toBe(1));
    expect(pageButton("1")).toHaveTextContent("已取消");
  });
});
