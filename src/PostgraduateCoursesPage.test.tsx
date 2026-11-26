import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostgraduateCoursesPage } from "./PostgraduateCoursesPage";

describe("postgraduate course pilot", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/postgraduate/courses?subject=%E8%8B%B1%E8%AF%AD");
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  afterEach(() => cleanup());

  it("shows the 38 non-empty English subdirectories", () => {
    render(<PostgraduateCoursesPage />);

    expect(screen.getByRole("heading", { name: "考研网课" })).toBeVisible();
    expect(screen.getByText("38 个已整理入口 · 127 个内容目录")).toBeVisible();
    expect(screen.getAllByRole("link")).toHaveLength(38);
    expect(screen.getByRole("link", { name: /李旭高途腾飞班/ })).toHaveAttribute(
      "href",
      "https://pan.quark.cn/s/df7079b3bfe0",
    );
  });

  it("filters by teacher or platform keyword without changing the source hierarchy", () => {
    render(<PostgraduateCoursesPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "搜索考研网课老师或机构" }), {
      target: { value: "新东方" },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));

    const cards = screen.getAllByRole("link");
    expect(cards).toHaveLength(3);
    expect(within(cards[0]).getByText("王江涛新东方班")).toBeVisible();
    expect(within(cards[1]).getByText("无忧计划新东方")).toBeVisible();
    expect(within(cards[2]).getByText("直通车新东方班")).toBeVisible();
  });

  it("switches to the next subject while keeping its own count and links", () => {
    render(<PostgraduateCoursesPage />);

    fireEvent.click(screen.getByRole("tab", { name: /政治/ }));

    expect(screen.getByText(/45 个内容目录/)).toBeVisible();
    expect(screen.getByText("19 个匹配入口")).toBeVisible();
    expect(screen.getAllByRole("link")).toHaveLength(19);
    expect(screen.getByRole("link", { name: /徐涛研途全程班/ })).toHaveAttribute(
      "href",
      "https://pan.quark.cn/s/f8d40e367fc3",
    );
  });

  it("keeps the selected subject when searching within that subject", () => {
    window.history.replaceState({}, "", "/postgraduate/courses?subject=%E6%94%BF%E6%B2%BB");
    render(<PostgraduateCoursesPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "搜索考研网课老师或机构" }), {
      target: { value: "徐涛" },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));

    expect(window.location.search).toBe(
      `?subject=${encodeURIComponent("政治")}&q=${encodeURIComponent("徐涛")}`,
    );
    expect(screen.getByRole("tab", { name: /政治/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /徐涛研途全程班/ })).toBeVisible();
  });

  it("switches to the matching subject when searching a teacher from another subject", () => {
    window.history.replaceState({}, "", "/postgraduate/courses?subject=%E6%94%BF%E6%B2%BB");
    render(<PostgraduateCoursesPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "搜索考研网课老师或机构" }), {
      target: { value: "田静" },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));

    expect(window.location.search).toBe(
      `?subject=${encodeURIComponent("英语")}&q=${encodeURIComponent("田静")}`,
    );
    expect(screen.getByRole("tab", { name: /英语/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("link", { name: /田静启航全程班/ })).toBeVisible();
  });
});
