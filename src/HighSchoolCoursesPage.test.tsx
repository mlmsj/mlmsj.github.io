import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HighSchoolCoursesPage } from "./HighSchoolCoursesPage";

describe("高中网课课程索引页面", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/high-school/courses");
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  afterEach(() => cleanup());

  it("展示三个年级和九门学科，并把选择写入 canonical route", () => {
    render(<HighSchoolCoursesPage onSearch={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "高中网课" })).toBeVisible();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: /个教师资料入口|暂无已发布教师入口/ })).toHaveLength(9);
    expect(screen.getAllByRole("link", { name: /打开网盘资料/ })).toHaveLength(7);

    fireEvent.click(screen.getByRole("button", { name: /数学/ }));

    expect(window.location.pathname).toBe("/high-school/courses");
    expect(window.location.search).toBe("?grade=%E9%AB%98%E4%B8%80&subject=%E6%95%B0%E5%AD%A6");
    expect(screen.getByRole("link", { name: /王子悦.*打开网盘资料/ })).toHaveAttribute(
      "href",
      "https://pan.quark.cn/s/f5a8677f9c22",
    );
  });

  it("保留浏览器后退时的年级和学科状态", async () => {
    render(<HighSchoolCoursesPage onSearch={vi.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: /高二/ }));
    expect(window.location.search).toContain("grade=%E9%AB%98%E4%BA%8C");

    await act(async () => {
      window.history.replaceState(
        {},
        "",
        "/high-school/courses?grade=%E9%AB%98%E4%B8%80&subject=%E8%AF%AD%E6%96%87",
      );
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /高一/ })).toHaveAttribute("aria-selected", "true");
    });
  });

  it("使用正式网课资源关键词定位到对应教师入口", () => {
    render(<HighSchoolCoursesPage onSearch={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("搜索高中课程或资料"), {
      target: { value: "电解池" },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));

    expect(window.location.search).toBe("?grade=%E9%AB%98%E4%BA%8C&subject=%E5%8C%96%E5%AD%A6&q=%E7%94%B5%E8%A7%A3%E6%B1%A0");
    expect(screen.getByRole("link", { name: /李政.*打开网盘资料/ })).toBeVisible();
    expect(screen.getAllByRole("link", { name: /打开网盘资料/ })).toHaveLength(1);
  });
});
