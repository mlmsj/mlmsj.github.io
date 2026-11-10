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

describe("home learning assistant", () => {
  it("shows three real task entries instead of an unavailable assistant state", () => {
    render(<App />);

    const tasks = screen.getByRole("group", { name: "学习助手任务入口" });
    expect(tasks).toBeVisible();
    expect(screen.getByRole("button", { name: /资料不会找/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /想制作自己的讲义/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /不知道工具怎么用/ })).toBeVisible();
    expect(screen.queryByText("学习助手暂未开放，敬请期待。")).not.toBeInTheDocument();
  });

  it.each([
    ["资料不会找", "/resources"],
    ["想制作自己的讲义", "/tools"],
    ["不知道工具怎么用", "/guide"],
  ])("routes %s to a real page", (label, expectedPath) => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: new RegExp(label) }));

    expect(window.location.pathname).toBe(expectedPath);
  });
});
