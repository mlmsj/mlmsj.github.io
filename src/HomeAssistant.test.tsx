import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("home guidance", () => {
  it("removes the duplicated assistant block and keeps the real guide entry", () => {
    render(<App />);

    expect(screen.queryByRole("group", { name: "学习助手任务入口" })).not.toBeInTheDocument();
    expect(screen.queryByText("学习助手")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "使用说明" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "使用说明" }));

    expect(window.location.pathname).toBe("/guide");
  });
});
