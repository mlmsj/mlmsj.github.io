import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResourcesPage } from "./ResourcesPage";
import {
  formatResourceSize,
  getResourceMetadataLabel,
  type Resource,
} from "./resources";
import { categories, type Category } from "./categories";

const verifiedDelivery: NonNullable<Resource["delivery"]> = {
  provider: "quark",
  shareUrl: "https://pan.quark.cn/s/resources-fixture",
  accessStatus: "verified",
  checkedOn: "2026-01-01",
};

const visibleResource: Resource = {
  id: "visible",
  title: "可见测试资料",
  meta: "2026-10-12",
  tag: "测试",
  description: "测试公开资料",
  categoryId: "type-junior-math-notes",
  classificationStatus: "classified",
  publicationStatus: "published",
  isPubliclyAccessible: true,
  delivery: verifiedDelivery,
};

const hiddenResources: Resource[] = [
  { ...visibleResource, id: "pending", title: "待分类资料", classificationStatus: "pending" },
  { ...visibleResource, id: "draft", title: "草稿资料", publicationStatus: "draft" },
  { ...visibleResource, id: "private", title: "非公开资料", isPubliclyAccessible: false },
  {
    ...visibleResource,
    id: "unchecked",
    title: "未经核验资料",
    delivery: { ...verifiedDelivery, accessStatus: "unchecked", checkedOn: null },
  },
  {
    ...visibleResource,
    id: "unknown-status",
    title: "未知状态资料",
    delivery: {
      ...verifiedDelivery,
      accessStatus: "unknown" as unknown as NonNullable<Resource["delivery"]>["accessStatus"],
    },
  },
];

const mixedResources: Resource[] = [
  { ...visibleResource, id: "root-university", title: "合成大学一级资料", categoryId: "stage-university" },
  { ...visibleResource, id: "root-junior", title: "合成初中一级资料", categoryId: "stage-junior" },
  { ...visibleResource, id: "second-math", title: "合成数学二级资料", categoryId: "subject-junior-math" },
  { ...visibleResource, id: "third-notes", title: "合成数学三级资料" },
  { ...visibleResource, id: "withdrawn", title: "合成撤回资料", categoryId: "stage-university", publicationStatus: "withdrawn" },
  { ...visibleResource, id: "missing-category", title: "合成无效分类资料", categoryId: "missing" },
];

describe("resource discovery layout", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/resources");
  });

  it("prioritizes four stage entries and three recommended topics", () => {
    render(<ResourcesPage detail={vi.fn()} resourceValues={mixedResources} />);

    expect(screen.getByRole("heading", { name: "按学习阶段浏览" })).toBeVisible();
    expect(screen.getAllByRole("link", { name: /初中/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /高中/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /大学/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /考证/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "推荐主题" })).toBeVisible();
    expect(screen.getByRole("link", { name: /AI 与数字科技/ })).toHaveAttribute("href", "/skill-growth");
    expect(screen.getByRole("link", { name: /数字创作与自媒体/ })).toHaveAttribute("href", "/categories?category=skill-digital-creation-media");
    expect(screen.getByRole("link", { name: /生活技能与兴趣/ })).toHaveAttribute("href", "/categories?category=skill-life-interests");
  });

  it("keeps the full resource list behind an explicit action", () => {
    render(<ResourcesPage detail={vi.fn()} resourceValues={mixedResources} />);

    expect(screen.queryByText("合成大学一级资料")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /查看全部公开资料/ }));

    expect(window.location.search).toBe("?view=all");
    expect(screen.getByText("合成大学一级资料")).toBeVisible();
    expect(screen.getByRole("heading", { name: "全部资料" })).toBeVisible();
  });

  it("does not fall back to static demonstration data", () => {
    render(<ResourcesPage detail={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "按学习阶段浏览" })).toBeVisible();
    expect(screen.queryByText("2026高考数学真题及答案（全国卷）")).not.toBeInTheDocument();
    expect(screen.queryByText("暂无正式发布资料")).not.toBeInTheDocument();
  });

  it("shows real stage counts and opens the corresponding result scope", () => {
    render(<ResourcesPage detail={vi.fn()} resourceValues={mixedResources} />);
    const junior = screen.getByRole("link", { name: /初中.*3 份公开资料/ });

    fireEvent.click(junior);

    expect(window.location.search).toBe("?category=stage-junior");
    expect(screen.getByRole("heading", { name: "初中（3）" })).toBeVisible();
    expect(screen.getByText("合成初中一级资料")).toBeVisible();
  });
});

describe("resource category filtering and deep links", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/resources");
  });

  it("shows only published, public resources for a stable leaf ID", () => {
    window.history.replaceState({}, "", "/resources?category=type-junior-math-notes");
    render(
      <ResourcesPage
        detail={vi.fn()}
        resourceValues={[visibleResource, ...hiddenResources]}
      />,
    );

    expect(screen.getByText("可见测试资料")).toBeVisible();
    expect(screen.queryByText("待分类资料")).not.toBeInTheDocument();
    expect(screen.queryByText("草稿资料")).not.toBeInTheDocument();
    expect(screen.queryByText("非公开资料")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "知识点整理（1）" })).toBeVisible();
  });

  it("handles invalid filters safely and clears them", () => {
    window.history.replaceState({}, "", "/resources?category=missing");
    render(<ResourcesPage detail={vi.fn()} />);

    expect(screen.getAllByRole("status")[0]).toHaveTextContent("分类链接无效或已停用");
    fireEvent.click(screen.getByRole("button", { name: "清除筛选" }));

    expect(window.location.search).toBe("");
    expect(screen.getByRole("heading", { name: "按学习阶段浏览" })).toBeVisible();
  });

  it("restores filtering after browser history changes", async () => {
    render(<ResourcesPage detail={vi.fn()} resourceValues={mixedResources} />);
    window.history.pushState({}, "", "/resources?category=type-junior-math-notes");
    fireEvent.popState(window);
    await screen.findByRole("heading", { name: "知识点整理（1）" });

    window.history.pushState({}, "", "/resources");
    fireEvent.popState(window);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "按学习阶段浏览" })).toBeVisible(),
    );
  });

  it.each([
    ["stage-university", "合成大学一级资料", "大学", 1],
    ["subject-junior-math", "合成数学二级资料", "数学", 2],
    ["type-junior-math-notes", "合成数学三级资料", "知识点整理", 1],
  ])("displays and searches valid category %s", (categoryId, title, label, count) => {
    window.history.replaceState({}, "", `/resources?category=${categoryId}`);
    render(<ResourcesPage detail={vi.fn()} resourceValues={mixedResources} />);
    expect(screen.getByText(title)).toBeVisible();
    expect(screen.getByRole("heading", { name: `${label}（${count}）` })).toBeVisible();

    fireEvent.change(screen.getByRole("textbox", { name: "关键词" }), {
      target: { value: title },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));

    expect(screen.getByRole("heading", { name: `搜索结果：${title}（1）` })).toBeVisible();
    expect(new URLSearchParams(window.location.search).get("category")).toBe(categoryId);
    expect(new URLSearchParams(window.location.search).get("q")).toBe(title);
  });

  it("filters a root category and its descendants without a recursive directory", () => {
    window.history.replaceState({}, "", "/resources?category=stage-junior");
    render(<ResourcesPage detail={vi.fn()} resourceValues={mixedResources} />);

    expect(screen.getByText("合成初中一级资料")).toBeVisible();
    expect(screen.getByText("合成数学二级资料")).toBeVisible();
    expect(screen.getByText("合成数学三级资料")).toBeVisible();
    expect(screen.queryByRole("complementary", { name: "资料分类目录" })).not.toBeInTheDocument();
  });

  it("keeps textbook subject entries directly below the textbook entry", () => {
    window.history.replaceState({}, "", "/resources?category=stage-junior");
    const textbook = {
      ...visibleResource,
      id: "textbook-total",
      title: "初中课本教材",
      tag: "初中 / 课本教材",
      categoryId: "domain-junior-textbooks",
    };
    const mathTextbook = {
      ...visibleResource,
      id: "textbook-math",
      title: "初中数学",
      tag: "初中 / 课本教材 / 初中数学",
      categoryId: "type-junior-textbooks-math",
    };
    const detail = vi.fn();
    render(<ResourcesPage detail={detail} resourceValues={[textbook, mathTextbook]} />);

    const textbookTitle = screen.getByText("初中课本教材");
    const textbookBody = textbookTitle.closest(".resource-item");
    const toggle = screen.getByRole("button", { name: "展开下级资料（1项）" });
    expect(textbookTitle).toBeVisible();
    expect(textbookBody).toHaveClass("resource-item--group-parent-body");
    expect(screen.getByRole("link", { name: "打开总资料：初中课本教材" })).toHaveAttribute(
      "href",
      verifiedDelivery.shareUrl,
    );
    fireEvent.click(textbookTitle);
    expect(detail).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle.closest(".resource-item-shell")).toHaveClass("resource-item-shell--group-parent");
    expect(screen.queryByRole("button", { name: /初中数学/ })).not.toBeInTheDocument();
    expect(within(textbookBody as HTMLElement).getByText("01")).toBeVisible();

    fireEvent.click(toggle);

    const mathButton = screen.getByRole("button", { name: /初中数学/ });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(textbookTitle.compareDocumentPosition(mathButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(mathButton.closest(".resource-item-shell")).toHaveClass("resource-item-shell--nested");
    expect(mathButton.closest(".resource-group-children")).toHaveAttribute("role", "group");
    expect(within(mathButton.closest(".resource-item-shell") as HTMLElement).getByText("01-01")).toBeVisible();
    expect(screen.getByText("初中 / 课本教材 / 初中数学")).toBeVisible();
  });

  it("opens a textbook group automatically when its category is selected", () => {
    window.history.replaceState({}, "", "/resources?category=domain-junior-textbooks");
    const textbook = {
      ...visibleResource,
      id: "textbook-total-direct",
      title: "初中课本教材",
      tag: "初中 / 课本教材",
      categoryId: "domain-junior-textbooks",
    };
    const mathTextbook = {
      ...visibleResource,
      id: "textbook-math-direct",
      title: "初中数学",
      tag: "初中 / 课本教材 / 初中数学",
      categoryId: "type-junior-textbooks-math",
    };
    render(<ResourcesPage detail={vi.fn()} resourceValues={[textbook, mathTextbook]} />);

    expect(screen.getByRole("button", { name: "收起下级资料（1项）" })).toBeVisible();
    expect(screen.getByRole("button", { name: /初中数学/ })).toBeVisible();
  });

  it("groups all five junior secondary branches without changing the category page", () => {
    window.history.replaceState({}, "", "/resources?category=stage-junior");
    const branches = [
      ["domain-junior-workbooks", "type-junior-workbooks-wanwei", "初中教辅与刷题", "万唯系列"],
      ["domain-junior-exams", "type-junior-exams-real", "初中模拟题与真题", "真题"],
      ["domain-junior-courses", "type-junior-courses-by-org", "初中网课", "按机构分类"],
      ["domain-junior-subjects", "type-junior-subjects-math", "初中学科分类", "数学"],
      ["domain-junior-sprint", "type-junior-sprint-math", "初中考前冲刺", "数学冲刺"],
    ] as const;
    const resources = branches.flatMap(([parentCategoryId, childCategoryId, parentTitle, childTitle], index) => [
      {
        ...visibleResource,
        id: `junior-group-parent-${index}`,
        title: parentTitle,
        categoryId: parentCategoryId,
        tag: `初中 / ${parentTitle.replace("初中", "")}`,
      },
      {
        ...visibleResource,
        id: `junior-group-child-${index}`,
        title: childTitle,
        categoryId: childCategoryId,
        tag: `初中 / ${parentTitle.replace("初中", "")} / ${childTitle}`,
      },
    ]);

    render(<ResourcesPage detail={vi.fn()} resourceValues={resources} />);

    const toggles = screen.getAllByRole("button", { name: "展开下级资料（1项）" });
    expect(toggles).toHaveLength(branches.length);
    for (const toggle of toggles) {
      expect(toggle.closest(".resource-item-shell")).toHaveClass("resource-item-shell--group-parent");
      expect(toggle).toHaveAttribute("aria-expanded", "false");
    }

    fireEvent.click(toggles[0]);

    expect(screen.getByRole("button", { name: /万唯系列/ })).toBeVisible();
    expect(screen.getByRole("button", { name: "收起下级资料（1项）" })).toBeVisible();
  });

  it("groups university second-level materials below their first-level entries", () => {
    window.history.replaceState({}, "", "/resources?category=stage-university");
    const branches = [
      ["domain-university-major", "domain-university-major-textbooks", "大学专业", "大学教材"],
      ["domain-university-competition", "domain-university-competition-english", "大学竞赛", "大英赛"],
      ["domain-university-certification", "domain-university-certification-cet", "大学考证", "四六级"],
      ["domain-university-postgraduate", "domain-university-postgraduate-kaoyan", "大学升学", "考研"],
      ["domain-university-planning", "domain-university-planning-resume", "大学规划", "简历模板"],
    ] as const;
    const resources = [
      ...branches.flatMap(([parentCategoryId, childCategoryId, parentTitle, childTitle], index) => [
        {
          ...visibleResource,
          id: `university-group-parent-${index}`,
          title: parentTitle,
          categoryId: parentCategoryId,
          tag: `大学 / ${parentTitle}`,
        },
        {
          ...visibleResource,
          id: `university-group-child-${index}`,
          title: childTitle,
          categoryId: childCategoryId,
          tag: `大学 / ${parentTitle} / ${childTitle}`,
        },
      ]),
      {
        ...visibleResource,
        id: "university-group-proof",
        title: "大学证明",
        categoryId: "domain-university-proof",
        tag: "大学 / 大学证明",
      },
    ];

    render(<ResourcesPage detail={vi.fn()} resourceValues={resources} />);

    const toggles = screen.getAllByRole("button", { name: "展开下级资料（1项）" });
    expect(toggles).toHaveLength(branches.length);
    expect(screen.getByText("大学证明")).toBeVisible();
    expect(screen.queryByRole("button", { name: "展开下级资料（0项）" })).not.toBeInTheDocument();

    fireEvent.click(toggles[0]);

    expect(screen.getByRole("button", { name: /大学教材/ })).toBeVisible();
    expect(screen.getByRole("button", { name: "收起下级资料（1项）" })).toBeVisible();
  });

  it("groups high-school second-level materials below their first-level entries", () => {
    window.history.replaceState({}, "", "/resources?category=stage-senior");
    const branches = [
      ["domain-senior-courses", "type-senior-courses-2027", "高中网课", "2027版"],
      ["domain-senior-one-series", "type-senior-one-series-yishu", "一系列", "【一数儿】"],
      ["domain-senior-subjects", "type-senior-subjects-math", "高中学科分类", "数学"],
      ["domain-senior-textbooks", "type-senior-textbooks-chinese", "高中课本教材", "全部版本 • 高中语文【电子课本】"],
      ["domain-senior-policies", "type-senior-policies-exam-notes", "高考相关政策", "考前注意事项"],
    ] as const;
    const resources = branches.flatMap(([parentCategoryId, childCategoryId, parentTitle, childTitle], index) => [
      {
        ...visibleResource,
        id: `senior-group-parent-${index}`,
        title: parentTitle,
        categoryId: parentCategoryId,
        tag: `高中 / ${parentTitle}`,
      },
      {
        ...visibleResource,
        id: `senior-group-child-${index}`,
        title: childTitle,
        categoryId: childCategoryId,
        tag: `高中 / ${parentTitle} / ${childTitle}`,
      },
    ]);

    render(<ResourcesPage detail={vi.fn()} resourceValues={resources} />);

    const toggles = screen.getAllByRole("button", { name: "展开下级资料（1项）" });
    expect(toggles).toHaveLength(branches.length);
    for (const toggle of toggles) {
      expect(toggle.closest(".resource-item-shell")).toHaveClass("resource-item-shell--group-parent");
      expect(toggle).toHaveAttribute("aria-expanded", "false");
    }

    fireEvent.click(toggles[0]);

    expect(screen.getByRole("button", { name: /2027版/ })).toBeVisible();
    expect(screen.getByRole("button", { name: "收起下级资料（1项）" })).toBeVisible();
  });

  it.each(["disabled", "missing-parent", "wrong-level"])("keeps a valid root result when the child branch is %s", (shape) => {
    const values: Category[] = categories.map((category) => {
      if (category.id !== "subject-junior-math") return category;
      if (shape === "disabled") return { ...category, enabled: false };
      if (shape === "missing-parent") return { ...category, parentId: "missing" };
      return { ...category, level: 3 };
    });
    window.history.replaceState({}, "", "/resources?category=stage-university");
    render(
      <ResourcesPage
        detail={vi.fn()}
        resourceValues={mixedResources}
        categoryValues={values}
      />,
    );

    expect(screen.getByText("合成大学一级资料")).toBeVisible();
    expect(screen.queryByText("合成数学二级资料")).not.toBeInTheDocument();
  });
});

describe("resource result state and metadata", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/resources");
  });

  it("shows the committed search term and result count for matches and misses", () => {
    const resource = {
      ...visibleResource,
      title: "高考真题公开资料",
      description: "高考真题与答案整理",
    };
    render(<ResourcesPage detail={vi.fn()} resourceValues={[resource]} />);

    fireEvent.change(screen.getByRole("textbox", { name: "关键词" }), {
      target: { value: "高考真题" },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));
    expect(screen.getByRole("heading", { name: "搜索结果：高考真题（1）" })).toBeVisible();

    fireEvent.change(screen.getByRole("textbox", { name: "关键词" }), {
      target: { value: "不存在的关键词" },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));
    expect(screen.getByRole("heading", { name: "搜索结果：不存在的关键词（0）" })).toBeVisible();
  });

  it("renders valid type and size metadata without fabricating missing values", () => {
    window.history.replaceState({}, "", "/resources?view=all");
    const resources: Resource[] = [
      {
        ...visibleResource,
        id: "full-metadata",
        title: "完整元数据资料",
        fileType: " PDF ",
        sizeBytes: 2_516_582,
        meta: "2026-10-12 18:30:00 +08:00 / 超长日期合成值",
      },
      {
        ...visibleResource,
        id: "type-only",
        title: "只有格式资料",
        fileType: "DOCX",
      },
      {
        ...visibleResource,
        id: "size-only",
        title: "只有大小资料",
        sizeBytes: 1024,
      },
      {
        ...visibleResource,
        id: "invalid-metadata",
        title: "无效元数据资料",
        fileType: "   ",
        sizeBytes: -1,
      },
    ];

    const onToggleFavorite = vi.fn();
    render(
      <ResourcesPage
        detail={vi.fn()}
        resourceValues={resources}
        onToggleFavorite={onToggleFavorite}
      />,
    );

    expect(screen.getByText("PDF · 2.4 MB")).toBeVisible();
    expect(screen.getByText("DOCX")).toBeVisible();
    expect(screen.getByText("1 KB")).toBeVisible();
    expect(screen.queryByLabelText("文件信息：")).not.toBeInTheDocument();

    const longDate = screen.getByText(/2026-10-12 18:30:00/);
    expect(longDate).toHaveClass("resource-item-time");
    const favorite = screen.getByRole("button", { name: "收藏：完整元数据资料" });
    fireEvent.click(favorite);
    expect(onToggleFavorite).toHaveBeenCalledWith("full-metadata");
  });

  it.each([
    [0, "0 B"],
    [1023, "1023 B"],
    [1024, "1 KB"],
    [1536, "1.5 KB"],
    [2_516_582, "2.4 MB"],
    [1_610_612_736, "1.5 GB"],
  ])("formats %s bytes as %s", (sizeBytes, expected) => {
    expect(formatResourceSize(sizeBytes)).toBe(expected);
  });

  it.each([
    [undefined, null],
    [null, null],
    [-1, null],
    [Number.NaN, null],
    [Number.POSITIVE_INFINITY, null],
    [1.5, null],
  ])("rejects invalid size %s", (sizeBytes, expected) => {
    expect(formatResourceSize(sizeBytes as number | null | undefined)).toBe(expected);
  });

  it("keeps metadata label helpers honest", () => {
    expect(getResourceMetadataLabel({ fileType: "folder", sizeBytes: undefined })).toBe("文件夹");
    expect(getResourceMetadataLabel({ fileType: "  ", sizeBytes: undefined })).toBeNull();
    expect(getResourceMetadataLabel({ fileType: undefined, sizeBytes: -1 })).toBeNull();
  });
});
