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
    expect(within(desktop).queryByRole("button", { name: /数学/ })).not.toBeInTheDocument();

    fireEvent.click(within(sidebar).getByRole("button", { name: /高中/ }));
    expect(window.location.search).toBe("?category=stage-senior");
    expect(within(desktop).queryByText("考试资料")).not.toBeInTheDocument();
    expect(within(desktop).getByText("课本教材")).toBeVisible();

    fireEvent.click(within(sidebar).getByRole("button", { name: /初中/ }));
    expect(within(desktop).queryByRole("button", { name: /数学/ })).not.toBeInTheDocument();
  });

  it("supports the mobile progressive flow and back controls", () => {
    renderPage();
    const mobile = screen.getByTestId("category-mobile");

    expect(within(mobile).getByText("选择学习阶段或用途")).toBeVisible();
    fireEvent.click(within(mobile).getByRole("button", { name: /初中/ }));
    expect(window.location.search).toBe("?category=stage-junior");
    expect(within(mobile).queryByRole("button", { name: /数学/ })).not.toBeInTheDocument();
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
    const sidebar = within(desktop).getByRole("complementary", {
      name: "一级分类",
    });
    expect(within(desktop).getByRole("link", { name: /查看数学全部资料/ })).toBeVisible();
    expect(within(desktop).queryByText("知识点整理")).not.toBeInTheDocument();

    window.history.pushState({}, "", "/categories?category=stage-senior");
    fireEvent.popState(window);

    expect(within(desktop).getByText("竞赛")).toBeVisible();
    expect(within(sidebar).getByRole("button", { name: /高中/ })).toHaveAttribute(
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
    expect(within(desktop).getByText("大学专业")).toBeVisible();
    expect(within(desktop).getByText("大学证明")).toBeVisible();
    expect(within(desktop).queryByText("复习资料")).not.toBeInTheDocument();
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

  it("shows resources assigned directly to a selected category", () => {
    const directResource: Resource = {
      id: "ai-direct-fixture",
      title: "AI+办公",
      meta: "2026-11-15",
      tag: "AI 与人工智能",
      description: "AI 办公资料入口。",
      categoryId: "skill-ai-knowledge",
      classificationStatus: "classified",
      publicationStatus: "published",
      isPubliclyAccessible: true,
      delivery: {
        provider: "baidu",
        shareUrl: "https://pan.baidu.com/s/fixture?pwd=abcd",
        accessStatus: "verified",
        checkedOn: "2026-11-15",
      },
      fileType: "folder",
    };
    window.history.replaceState(
      {},
      "",
      "/categories?category=skill-ai-digital-tech&subject=skill-ai-knowledge",
    );
    render(
      <CategoriesPage
        onHome={vi.fn()}
        onOpenResources={openResources}
        counts={{ "skill-ai-knowledge": 1 }}
        resourceValues={[directResource]}
      />,
    );

    const desktop = screen.getByTestId("category-desktop");
    expect(within(desktop).getByRole("heading", { name: /AI 与人工智能直接资料/ })).toBeVisible();
    const directLink = desktop.querySelector<HTMLAnchorElement>("a.category-direct-resource");
    expect(directLink?.getAttribute("href")).toBe(directResource.delivery?.shareUrl);
  });

  it("opens the university professional-course folder pilot without adding global categories", () => {
    window.history.replaceState(
      {},
      "",
      "/categories?category=stage-university&subject=domain-university-major",
    );
    renderPage();

    const desktop = screen.getByTestId("category-desktop");
    fireEvent.click(
      within(desktop).getByRole("button", { name: /大学专业课/ }),
    );

    expect(window.location.search).toBe(
      "?categoryPath=stage-university%2Cdomain-university-major%2Cdomain-university-major-courses",
    );
    expect(within(desktop).getByRole("heading", { name: /下级资料/ })).toBeVisible();
    expect(within(desktop).getByText("专业课教材")).toBeVisible();
    expect(within(desktop).getByText("AutoCAD")).toBeVisible();
    expect(within(desktop).getByText("136 项内容")).toBeVisible();
    expect(within(desktop).getByText("2 项内容")).toBeVisible();
    expect(within(desktop).queryByText("暂无资料类型")).not.toBeInTheDocument();
    expect(
      within(desktop)
        .getByRole("link", { name: /专业课教材/ })
        .getAttribute("href"),
    ).toBe("https://pan.quark.cn/s/9efad3c16921");

    const mobile = screen.getByTestId("category-mobile");
    expect(within(mobile).getByText("专业课教材")).toBeVisible();
    expect(within(mobile).getByText("AutoCAD")).toBeVisible();
  });

  it("uses current local folder totals on the university-major cards", () => {
    window.history.replaceState(
      {},
      "",
      "/categories?category=stage-university&subject=domain-university-major",
    );
    renderPage();

    const desktop = screen.getByTestId("category-desktop");
    expect(within(desktop).getByRole("button", { name: /大学专业课.*138 项内容/ })).toBeVisible();
    expect(within(desktop).getByRole("button", { name: /思政系列.*16 项内容/ })).toBeVisible();
    expect(within(desktop).getByRole("button", { name: /大学教材.*1969 项内容/ })).toBeVisible();
    expect(within(desktop).getByRole("button", { name: /大学数学.*61 项内容/ })).toBeVisible();
  });

  it("keeps keyword search data without rendering a keyword strip", () => {
    const cetResource: Resource = {
      id: "cet-keyword-fixture",
      title: "四六级",
      meta: "2026-11-24",
      tag: "大学 / 大学考证 / 计算机",
      description: "大学英语四六级资料",
      keywords: ["大学英语", "四级", "刘晓燕"],
      categoryId: "domain-university-certification-computer",
      classificationStatus: "classified",
      publicationStatus: "published",
      isPubliclyAccessible: true,
      delivery: {
        provider: "quark",
        shareUrl: "https://pan.quark.cn/s/categories-cet-fixture",
        accessStatus: "verified",
        checkedOn: "2026-11-24",
      },
    };
    window.history.replaceState(
      {},
      "",
      "/categories?categoryPath=stage-university,domain-university-certification,domain-university-certification-computer",
    );
    render(
      <CategoriesPage
        onHome={vi.fn()}
        onOpenResources={openResources}
        counts={{ "domain-university-certification-computer": 1 }}
        resourceValues={[cetResource]}
      />,
    );

    const desktop = screen.getByTestId("category-desktop");
    expect(within(desktop).queryByText("关键词")).not.toBeInTheDocument();
    expect(within(desktop).queryByRole("link", { name: "刘晓燕" })).not.toBeInTheDocument();
  });

  it("shows the four verified CET course folders and their search aliases", () => {
    window.history.replaceState(
      {},
      "",
      "/categories?category=purpose-certification&subject=purpose-certification-cet",
    );
    render(
      <CategoriesPage
        onHome={vi.fn()}
        onOpenResources={openResources}
        counts={{ "domain-university-certification-cet": 1 }}
      />,
    );

    const desktop = screen.getByTestId("category-desktop");
    expect(within(desktop).getByRole("button", { name: /考证/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(within(desktop).getByRole("navigation", { name: "当前位置" })).toHaveTextContent(
      "分类考证四六级",
    );
    expect(within(desktop).getByRole("heading", { name: /网课子资料/ })).toBeVisible();
    expect(within(desktop).getAllByText("梁伟").length).toBeGreaterThan(0);
    expect(within(desktop).getAllByText("烤鸭TV").length).toBeGreaterThan(0);
    expect(within(desktop).getAllByText("刘晓燕").length).toBeGreaterThan(0);
    expect(within(desktop).getAllByText("我是瑞斯拜").length).toBeGreaterThan(0);
    expect(within(desktop).getByRole("link", { name: /查看四六级全部资料 11 项内容/ })).toBeVisible();
    expect(
      within(desktop).queryByRole("link", { name: "梁伟" }),
    ).not.toBeInTheDocument();
    expect(
      within(desktop).getByRole("link", { name: /夸克网盘 · 文件夹 刘晓燕/ }),
    ).toHaveAttribute("href", "https://pan.quark.cn/s/02cbaeb0dfef");
  });

  it("keeps the CET entry out of the visible university navigation", () => {
    window.history.replaceState({}, "", "/categories?category=stage-university");
    renderPage();

    const desktop = screen.getByTestId("category-desktop");
    expect(within(desktop).queryByRole("button", { name: /四六级/ })).not.toBeInTheDocument();
  });

  it("shows junior resource detail categories on the category page like textbooks", () => {
    const cases = [
      ["domain-junior-workbooks", "数学核心考点"],
      ["domain-junior-exams", "真题"],
      ["domain-junior-courses", "按机构分类"],
      ["domain-junior-subjects", "数学"],
      ["domain-junior-sprint", "考前冲刺押题卷"],
    ] as const;

    for (const [categoryId, childName] of cases) {
      window.history.replaceState(
        {},
        "",
        `/categories?category=stage-junior&subject=${categoryId}`,
      );
      const { unmount } = renderPage();
      const desktop = screen.getByTestId("category-desktop");
      expect(within(desktop).getByText(childName)).toBeVisible();
      expect(within(desktop).queryByText("暂无资料类型")).not.toBeInTheDocument();
      unmount();
    }
  });

  it("uses audited Quark totals for junior course mappings", () => {
    window.history.replaceState(
      {},
      "",
      "/categories?category=stage-junior&subject=domain-junior-courses",
    );
    renderPage();

    const desktop = screen.getByTestId("category-desktop");
    expect(
      within(desktop).getByRole("button", { name: /按机构分类.*7 项内容/ }),
    ).toBeVisible();
    expect(
      within(desktop).getByRole("button", { name: /按年级分类.*3 项内容/ }),
    ).toBeVisible();

    const mobile = screen.getByTestId("category-mobile");
    expect(
      within(mobile).getByRole("button", { name: /按机构分类.*7 项内容/ }),
    ).toBeVisible();
    expect(
      within(mobile).getByRole("button", { name: /按年级分类.*3 项内容/ }),
    ).toBeVisible();
  });

  it("opens the dedicated junior-high course index from the category page", () => {
    const openJuniorHighCourses = vi.fn();
    window.history.replaceState({}, "", "/categories?category=stage-junior");
    render(
      <CategoriesPage
        onHome={vi.fn()}
        onOpenResources={openResources}
        onOpenJuniorHighCourses={openJuniorHighCourses}
      />,
    );

    const desktop = screen.getByTestId("category-desktop");
    fireEvent.click(within(desktop).getByRole("button", { name: /网课/ }));

    expect(openJuniorHighCourses).toHaveBeenCalledWith("/junior-high/courses");
    expect(openResources).not.toHaveBeenCalled();
  });

  it("uses audited Quark totals for senior series, subjects, and exams", () => {
    const cases = [
      [
        "domain-senior-one-series",
        /【一数儿】.*9 项内容/,
        /【FREE 高考】.*15 项内容/,
      ],
      [
        "domain-senior-subjects",
        /语文.*7 项内容/,
        /化学.*12 项内容/,
      ],
      [
        "domain-senior-mocks",
        /^真题 .*5 项内容/,
        /广东春考.*6 项内容/,
      ],
    ] as const;

    for (const [categoryId, firstCard, secondCard] of cases) {
      window.history.replaceState(
        {},
        "",
        `/categories?category=stage-senior&subject=${categoryId}`,
      );
      const { unmount } = renderPage();
      const desktop = screen.getByTestId("category-desktop");
      expect(within(desktop).getByRole("button", { name: firstCard })).toBeVisible();
      expect(within(desktop).getByRole("button", { name: secondCard })).toBeVisible();
      unmount();
    }
  });

  it("hides only the certification root direct-resource section", () => {
    const certificationResource: Resource = {
      id: "certification-root-fixture",
      title: "大学考证",
      meta: "2026-11-24",
      tag: "考证",
      description: "考证资料总入口",
      categoryId: "domain-university-certification",
      classificationStatus: "classified",
      publicationStatus: "published",
      isPubliclyAccessible: true,
      delivery: {
        provider: "quark",
        shareUrl: "https://pan.quark.cn/s/certification-root-fixture",
        accessStatus: "verified",
        checkedOn: "2026-11-24",
      },
    };
    window.history.replaceState({}, "", "/categories?category=purpose-certification");
    render(
      <CategoriesPage
        onHome={vi.fn()}
        onOpenResources={openResources}
        resourceValues={[certificationResource]}
      />,
    );

    expect(screen.getByTestId("category-desktop")).not.toHaveTextContent("考证直接资料");
    expect(screen.getByTestId("category-mobile")).not.toHaveTextContent("考证直接资料");
  });
});
