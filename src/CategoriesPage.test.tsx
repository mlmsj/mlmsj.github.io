import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoriesPage } from "./CategoriesPage";
import { getPublishedResourceCount } from "./categoryCounts";
import { categories, type Category } from "./categories";
import type { Resource } from "./resources";

const openResources = vi.fn();
const renderPage = () =>
  render(
    <CategoriesPage onHome={vi.fn()} onOpenResources={openResources} />,
  );

describe("CategoriesPage", () => {
  beforeEach(() => {
    openResources.mockReset();
    window.history.replaceState({}, "", "/categories");
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  it("switches desktop first- and second-level categories with selected state", () => {
    renderPage();
    const desktop = screen.getByTestId("category-desktop");
    const sidebar = within(desktop).getByRole("complementary", {
      name: "一级分类",
    });
    const junior = within(sidebar).getByRole("button", { name: /初中/ });

    expect(junior).toHaveAttribute("aria-current", "true");
    expect(within(desktop).getByRole("button", { name: /数学/ })).toBeVisible();

    fireEvent.click(within(sidebar).getByRole("button", { name: /高中/ }));
    expect(window.location.search).toBe("?category=stage-senior");
    expect(within(desktop).getByText("暂无下级分类")).toBeVisible();

    fireEvent.click(within(sidebar).getByRole("button", { name: /初中/ }));
    fireEvent.click(within(desktop).getByRole("button", { name: /数学/ }));
    expect(window.location.search).toBe(
      "?category=stage-junior&subject=subject-junior-math",
    );
    expect(within(desktop).getByText("资料类型")).toBeVisible();
    expect(within(desktop).getByText("知识点整理")).toBeVisible();

    fireEvent.click(
      within(desktop).getByRole("link", { name: /知识点整理/ }),
    );
    expect(openResources).toHaveBeenCalledWith(
      expect.stringContaining(
        "/resources?category=type-junior-math-notes",
      ),
    );

    fireEvent.click(within(desktop).getByRole("button", { name: "← 返回学科" }));
    expect(window.location.search).toBe("?category=stage-junior");
  });

  it("supports the mobile progressive flow and back controls", () => {
    renderPage();
    const mobile = screen.getByTestId("category-mobile");

    expect(within(mobile).getByText("选择学习阶段或用途")).toBeVisible();
    fireEvent.click(within(mobile).getByRole("button", { name: /初中/ }));
    expect(window.location.search).toBe("?category=stage-junior");
    expect(within(mobile).getByRole("button", { name: /数学/ })).toBeVisible();

    fireEvent.click(within(mobile).getByRole("button", { name: /数学/ }));
    expect(within(mobile).getByText("知识点整理")).toBeVisible();
    fireEvent.click(within(mobile).getByRole("button", { name: "← 返回上一级" }));
    expect(window.location.search).toBe("?category=stage-junior");
    fireEvent.click(within(mobile).getByRole("button", { name: "← 返回上一级" }));
    expect(window.location.search).toBe("");
  });

  it("restores selection from URL and browser popstate", () => {
    window.history.replaceState(
      {},
      "",
      "/categories?category=stage-junior&subject=subject-junior-math",
    );
    renderPage();
    const desktop = screen.getByTestId("category-desktop");
    expect(within(desktop).getByText("知识点整理")).toBeVisible();

    window.history.pushState({}, "", "/categories?category=stage-senior");
    fireEvent.popState(window);

    expect(within(desktop).getByText("暂无下级分类")).toBeVisible();
    expect(within(desktop).getByRole("button", { name: /高中/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("shows a recovery notice for invalid category parameters", () => {
    window.history.replaceState(
      {},
      "",
      "/categories?category=missing&subject=missing",
    );
    renderPage();

    expect(screen.getByRole("status", { name: "分类链接提示" })).toHaveTextContent(
      "一级分类不可用",
    );
    expect(screen.getByRole("status", { name: "分类链接提示" })).toHaveTextContent(
      "学科分类不可用",
    );
  });

  it("counts only published, public resources with a valid enabled level-three path", () => {
    const validResource: Resource = {
      id: "published-one",
      title: "已发布资料",
      meta: "2026-10-12",
      tag: "仅作展示",
      description: "测试",
      categoryId: "type-junior-math-notes",
      classificationStatus: "classified",
      publicationStatus: "published",
      isPubliclyAccessible: true,
      delivery: {
        provider: "quark",
        shareUrl: "https://pan.quark.cn/s/categories-fixture",
        accessStatus: "verified",
        checkedOn: "2026-01-01",
      },
    };
    const ignoredResources: Resource[] = [
      { ...validResource, id: "pending", classificationStatus: "pending" },
      { ...validResource, id: "draft", publicationStatus: "draft" },
      { ...validResource, id: "private", isPubliclyAccessible: false },
      { ...validResource, id: "missing", categoryId: "missing" },
    ];

    expect(
      getPublishedResourceCount("stage-junior", categories, [
        validResource,
        ...ignoredResources,
      ]),
    ).toBe(1);
    expect(getPublishedResourceCount("stage-junior")).toBe(0);

    const disabledCategories: Category[] = categories.map((category) =>
      category.id === "subject-junior-math"
        ? { ...category, enabled: false }
        : category,
    );
    expect(
      getPublishedResourceCount("stage-junior", disabledCategories, [
        validResource,
      ]),
    ).toBe(0);
  });

  it("offers a root resource route even when the category has no children", () => {
    render(<CategoriesPage onHome={vi.fn()} onOpenResources={openResources} counts={{ "stage-university": 1 }} />);
    const desktop = screen.getByTestId("category-desktop");
    fireEvent.click(within(desktop).getByRole("button", { name: /大学/ }));
    const link = within(desktop).getByRole("link", { name: /查看大学全部资料/ });
    expect(link).toHaveAttribute("href", expect.stringContaining("/resources?category=stage-university"));
    expect(link).toHaveTextContent("1 份资料");
    fireEvent.click(link);
    expect(openResources).toHaveBeenCalledWith(expect.stringContaining("/resources?category=stage-university"));
    expect(within(desktop).getByText("暂无下级分类")).toBeVisible();
  });

  it("offers the selected second-level scope on desktop and mobile after URL restoration", () => {
    window.history.replaceState({}, "", "/categories?category=stage-junior&subject=subject-junior-math");
    render(<CategoriesPage onHome={vi.fn()} onOpenResources={openResources} counts={{ "subject-junior-math": 2 }} />);
    for (const region of ["category-desktop", "category-mobile"]) {
      const link = within(screen.getByTestId(region)).getByRole("link", { name: /查看数学全部资料/ });
      expect(link).toHaveTextContent("2 份资料");
      expect(link).toHaveAttribute("href", expect.stringContaining("/resources?category=subject-junior-math"));
    }
  });
});
