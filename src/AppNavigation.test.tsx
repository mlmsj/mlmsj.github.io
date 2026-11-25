import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("home category navigation", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  afterEach(() => cleanup());

  it("removes the four stage cards while keeping the category page available", () => {
    const { container } = render(<App />);
    expect(container.querySelector(".entrance-grid")).not.toBeInTheDocument();

    fireEvent.click(
      within(screen.getByRole("navigation", { name: "主导航" })).getByRole(
        "button",
        { name: "分类" },
      ),
    );

    expect(window.location.pathname).toBe("/categories");
    expect(screen.getByRole("heading", { name: "分类浏览" })).toBeVisible();
  });

  it("keeps skill growth in navigation without a duplicate homepage module", () => {
    const { container } = render(<App />);
    expect(container.querySelector(".entrance-grid")).not.toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /浏览技能成长/ })).not.toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("navigation", { name: "主导航" })).getByRole("button", { name: "技能成长" }));

    expect(window.location.pathname).toBe("/skill-growth");
    expect(screen.getByRole("heading", { name: "技能成长" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "AI 与数字科技" })).toBeVisible();
  });

  it("keeps three concise hot-search entries and opens the high-school index", () => {
    const { container } = render(<App />);
    const hotSearch = container.querySelector<HTMLElement>(".home-hot-search");
    expect(hotSearch).not.toBeNull();
    expect(within(hotSearch!).getAllByRole("button")).toHaveLength(3);

    fireEvent.click(within(hotSearch!).getByRole("button", { name: "高中课程" }));

    expect(window.location.pathname).toBe("/high-school/courses");
  });

  it("opens the postgraduate course pilot as a separate subject index", () => {
    window.history.replaceState({}, "", "/postgraduate/courses?subject=%E8%8B%B1%E8%AF%AD");
    render(<App />);

    expect(screen.getByTestId("postgraduate-courses-page")).toBeVisible();
    expect(screen.getByRole("heading", { name: "考研网课" })).toBeVisible();
    expect(screen.getByText("38 个已整理入口 · 127 个内容目录")).toBeVisible();
  });

  it("opens the junior-high teacher index as a separate course page", () => {
    window.history.replaceState({}, "", "/junior-high/courses");
    render(<App />);

    expect(screen.getByTestId("junior-high-courses-page")).toBeVisible();
    expect(screen.getByRole("heading", { name: "初中网课" })).toBeVisible();
    expect(screen.getByText("31 位老师 · 10 个机构与年级总目录")).toBeVisible();
  });

  it.each([
    ["大学教材", "?category=stage-university"],
    ["考试资料", "?category=purpose-certification"],
  ])("routes hot-search %s through an existing category", (name, expectedSearch) => {
    const { container } = render(<App />);
    const hotSearch = container.querySelector<HTMLElement>(".home-hot-search");

    fireEvent.click(within(hotSearch!).getByRole("button", { name: new RegExp(`^${name}$`) }));

    expect(window.location.pathname).toBe("/categories");
    expect(window.location.search).toBe(expectedSearch);
  });

  it.each([
    ["找学习资料", "/resources"],
    ["使用学习工具", "/tools"],
    ["OCR 文字识别", "/tools/ocr"],
    ["PDF 合并", "/tools/pdf-merge"],
    ["图片尺寸调整", "/tools/image-resize"],
  ])("opens the existing destination for homepage entry %s", (name, path) => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${name}`) }));
    expect(window.location.pathname).toBe(path);
  });

  it.each([
    ["李政", "高二", "化学"],
    ["数学", "高一", "数学"],
    ["英语", "高一", "英语"],
  ])("routes home search %s into the high-school course index", (query, grade, subject) => {
    render(<App />);

    fireEvent.change(screen.getByRole("textbox", { name: "搜索学习资料" }), {
      target: { value: query },
    });
    const homeSearch = screen.getByRole("textbox", { name: "搜索学习资料" }).parentElement;
    fireEvent.click(within(homeSearch!).getByRole("button", { name: "搜索" }));

    expect(window.location.pathname).toBe("/high-school/courses");
    expect(window.location.search).toBe(
      `?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}&q=${encodeURIComponent(query)}`,
    );
    expect(screen.getByRole("heading", { name: "高中网课" })).toBeVisible();
  });

  it("routes a postgraduate teacher search from the homepage to the matching subject", () => {
    render(<App />);

    fireEvent.change(screen.getByRole("textbox", { name: "搜索学习资料" }), {
      target: { value: "田静" },
    });
    const homeSearch = screen.getByRole("textbox", { name: "搜索学习资料" }).parentElement;
    fireEvent.click(within(homeSearch!).getByRole("button", { name: "搜索" }));

    expect(window.location.pathname).toBe("/postgraduate/courses");
    expect(window.location.search).toBe(
      `?subject=${encodeURIComponent("英语")}&q=${encodeURIComponent("田静")}`,
    );
    expect(screen.getByRole("heading", { name: "考研网课" })).toBeVisible();
    expect(screen.getByRole("link", { name: /田静启航全程班/ })).toBeVisible();
  });

  it("routes a junior-high teacher search from the homepage to the matching grade and subject", () => {
    render(<App />);

    fireEvent.change(screen.getByRole("textbox", { name: "搜索学习资料" }), {
      target: { value: "张笑" },
    });
    const homeSearch = screen.getByRole("textbox", { name: "搜索学习资料" }).parentElement;
    fireEvent.click(within(homeSearch!).getByRole("button", { name: "搜索" }));

    expect(window.location.pathname).toBe("/junior-high/courses");
    expect(window.location.search).toBe(
      `?grade=${encodeURIComponent("初三")}&subject=${encodeURIComponent("语文")}&q=${encodeURIComponent("张笑")}`,
    );
    expect(screen.getByRole("link", { name: /张笑/ })).toBeVisible();
  });

  it("routes child-folder keywords from the homepage into the global library search", () => {
    render(<App />);

    fireEvent.change(screen.getByRole("textbox", { name: "搜索学习资料" }), {
      target: { value: "作文素材" },
    });
    const homeSearch = screen.getByRole("textbox", { name: "搜索学习资料" }).parentElement;
    fireEvent.click(within(homeSearch!).getByRole("button", { name: "搜索" }));

    expect(window.location.pathname).toBe("/resources");
    expect(window.location.search).toBe("?q=%E4%BD%9C%E6%96%87%E7%B4%A0%E6%9D%90");
  });

  it("keeps the same postgraduate route when the library search finds a teacher", () => {
    window.history.replaceState({}, "", "/resources");
    render(<App />);

    fireEvent.change(screen.getByRole("textbox", { name: "关键词" }), {
      target: { value: "田静" },
    });
    const resourceSearch = screen.getByRole("textbox", { name: "关键词" }).parentElement;
    fireEvent.click(within(resourceSearch!).getByRole("button", { name: "搜索" }));

    expect(window.location.pathname).toBe("/postgraduate/courses");
    expect(window.location.search).toContain("q=%E7%94%B0%E9%9D%99");
    expect(screen.getByRole("link", { name: /田静启航全程班/ })).toBeVisible();
  });

  it("keeps the same junior-high route when the library search finds a teacher", () => {
    window.history.replaceState({}, "", "/resources");
    render(<App />);

    fireEvent.change(screen.getByRole("textbox", { name: "关键词" }), {
      target: { value: "张笑" },
    });
    const resourceSearch = screen.getByRole("textbox", { name: "关键词" }).parentElement;
    fireEvent.click(within(resourceSearch!).getByRole("button", { name: "搜索" }));

    expect(window.location.pathname).toBe("/junior-high/courses");
    expect(window.location.search).toContain("q=%E5%BC%A0%E7%AC%91");
    expect(screen.getByRole("link", { name: /张笑/ })).toBeVisible();
  });
});
