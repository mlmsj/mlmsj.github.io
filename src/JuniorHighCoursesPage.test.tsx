import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JuniorHighCoursesPage } from "./JuniorHighCoursesPage";
import { JUNIOR_HIGH_TEACHERS } from "./juniorHighCourseIndex";

describe("junior-high course index", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/junior-high/courses");
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  afterEach(() => cleanup());

  it("shows teacher links together with the audited organization and grade directories", () => {
    render(<JuniorHighCoursesPage />);

    expect(screen.getByRole("heading", { name: "初中网课" })).toBeVisible();
    expect(screen.getByText("31 位老师 · 10 个机构与年级总目录")).toBeVisible();
    expect(screen.getByRole("link", { name: /金鸽/ })).toHaveAttribute(
      "href",
      JUNIOR_HIGH_TEACHERS.find(({ teacher }) => teacher === "金鸽")?.shareUrl,
    );
    expect(screen.getByRole("link", { name: /高途课堂/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /初三/ })).toBeVisible();
  });

  it("switches grade and subject while keeping teacher cards direct", () => {
    render(<JuniorHighCoursesPage />);

    fireEvent.click(screen.getByRole("tab", { name: /初三/ }));
    fireEvent.click(screen.getByRole("tab", { name: /物理/ }));

    expect(window.location.search).toBe(
      `?grade=${encodeURIComponent("初三")}&subject=${encodeURIComponent("物理")}`,
    );
    expect(screen.getByRole("link", { name: /谭清军/ })).toBeVisible();
    expect(screen.getByText("3 个匹配入口")).toBeVisible();
  });

  it("searches across grades and lands on the matching teacher", () => {
    render(<JuniorHighCoursesPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "搜索初中网课老师" }), {
      target: { value: "张笑" },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));

    expect(window.location.search).toBe(
      `?grade=${encodeURIComponent("初三")}&subject=${encodeURIComponent("语文")}&q=${encodeURIComponent("张笑")}`,
    );
    expect(screen.getByRole("link", { name: /张笑/ })).toBeVisible();
    expect(screen.getByText("1 个匹配入口")).toBeVisible();

    fireEvent.change(screen.getByRole("textbox", { name: "搜索初中网课老师" }), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));

    expect(window.location.search).toBe(
      `?grade=${encodeURIComponent("初三")}&subject=${encodeURIComponent("语文")}`,
    );
  });
});
