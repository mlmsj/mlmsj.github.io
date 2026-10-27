import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ResourcesPage,
} from "./ResourcesPage";
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

describe("ResourcesPage category filtering", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/resources");
  });

  it("does not fall back to static demonstration data", async () => {
    render(<ResourcesPage detail={vi.fn()} />);

    await waitFor(()=>expect(screen.getByText("暂无正式发布资料")).toBeVisible());
    expect(screen.queryByText("2026高考数学真题及答案（全国卷）")).not.toBeInTheDocument();
    expect(screen.getByText("全部公开资料")).toBeVisible();
  });

  it("shows only published, public resources matching the stable level-three ID", () => {
    window.history.replaceState(
      {},
      "",
      "/resources?category=type-junior-math-notes",
    );
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
    expect(screen.queryByText("未经核验资料")).not.toBeInTheDocument();
    expect(screen.queryByText("未知状态资料")).not.toBeInTheDocument();
    expect(screen.getByText(/初中 \/ 数学 \/ 知识点整理/)).toBeVisible();
  });

  it("shows an honest empty state only after a successful empty response", async () => {
    window.history.replaceState(
      {},
      "",
      "/resources?category=type-junior-math-notes",
    );
    render(<ResourcesPage detail={vi.fn()} />);

    await screen.findByText("该分类暂无公开资料");
    expect(screen.queryByText("2026高考数学真题及答案（全国卷）")).not.toBeInTheDocument();
  });

  it("handles invalid filters safely and clears them", async () => {
    window.history.replaceState({}, "", "/resources?category=missing");
    render(<ResourcesPage detail={vi.fn()} />);

    expect(screen.getAllByRole("status")[0]).toHaveTextContent("分类链接无效或已停用");
    expect(screen.queryByText("2026高考数学真题及答案（全国卷）")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "查看全部公开资料" }));
    expect(window.location.search).toBe("");
    await waitFor(()=>expect(screen.getByText("暂无正式发布资料")).toBeVisible());
  });

  it("restores filtering after browser history changes", async () => {
    render(<ResourcesPage detail={vi.fn()} />);
    await waitFor(()=>expect(screen.getByText("暂无正式发布资料")).toBeVisible());

    window.history.pushState(
      {},
      "",
      "/resources?category=type-junior-math-notes",
    );
    fireEvent.popState(window);

    await screen.findByText("该分类暂无公开资料");
  });

  it("keeps the mobile category directory and back flow available", () => {
    render(
      <ResourcesPage
        resourceValues={[visibleResource]}
        catalogPhase="ready"
        detail={vi.fn()}
      />,
    );
    const mobile = screen.getByLabelText("移动端资料分类");
    fireEvent.click(within(mobile).getByRole("button", { name: /初中/ }));
    fireEvent.click(within(mobile).getByRole("button", { name: /数学/ }));
    expect(within(mobile).getByText("知识点整理")).toBeVisible();
    fireEvent.click(within(mobile).getByRole("button", { name: "← 返回上一级" }));
    expect(within(mobile).getByRole("button", { name: /数学/ })).toBeVisible();
  });

  it.each([
    ["stage-university", "合成大学一级资料", 1],
    ["subject-junior-math", "合成数学二级资料", 2],
    ["type-junior-math-notes", "合成数学三级资料", 1],
  ])("displays and searches valid category %s", (categoryId, title, count) => {
    window.history.replaceState({}, "", `/resources?category=${categoryId}`);
    render(<ResourcesPage detail={vi.fn()} resourceValues={mixedResources} />);
    expect(screen.getByText(title)).toBeVisible();
    expect(screen.getByText(`共 ${count} 条`)).toBeVisible();
    expect(screen.queryByText("合成撤回资料")).not.toBeInTheDocument();
    expect(screen.queryByText("合成无效分类资料")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "关键词" }), { target: { value: title } });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));
    expect(screen.getByText(title)).toBeVisible();
    expect(screen.getByText("共 1 条")).toBeVisible();
    expect(new URLSearchParams(window.location.search).get("category")).toBe(categoryId);
    expect(new URLSearchParams(window.location.search).get("q")).toBe(title);
  });

  it("filters direct root and subject resources together with their descendants", () => {
    render(<ResourcesPage detail={vi.fn()} resourceValues={mixedResources} />);
    const directory = screen.getByRole("complementary", { name: "资料分类目录" });
    fireEvent.click(within(directory).getByRole("button", { name: "查看大学全部资料" }));
    expect(window.location.search).toBe("?category=stage-university");
    expect(screen.getByText("合成大学一级资料")).toBeVisible();
    expect(screen.queryByText("合成数学二级资料")).not.toBeInTheDocument();
    fireEvent.click(within(directory).getByRole("button", { name: "查看初中全部资料" }));
    expect(screen.getByText("共 3 条")).toBeVisible();
    fireEvent.click(within(directory).getByRole("button", { name: "查看数学全部资料" }));
    expect(screen.getByText("共 2 条")).toBeVisible();
    expect(screen.queryByText("合成初中一级资料")).not.toBeInTheDocument();
  });

  it("keeps mobile browsing while allowing root and subject scope selection", () => {
    render(<ResourcesPage detail={vi.fn()} resourceValues={mixedResources} />);
    const mobile = screen.getByLabelText("移动端资料分类");
    fireEvent.click(within(mobile).getByRole("button", { name: /大学/ }));
    expect(window.location.search).toBe("?category=stage-university");
    fireEvent.click(within(mobile).getByRole("button", { name: /初中/ }));
    expect(within(mobile).getByRole("button", { name: "查看初中全部资料" })).toBeVisible();
    fireEvent.click(within(mobile).getByRole("button", { name: /数学/ }));
    fireEvent.click(within(mobile).getByRole("button", { name: "查看数学全部资料" }));
    expect(window.location.search).toBe("?category=subject-junior-math");
    expect(screen.getByText("共 2 条")).toBeVisible();
  });

  it("restores first and second level filters after popstate and remount", () => {
    window.history.replaceState({}, "", "/resources?category=stage-university");
    const page = render(<ResourcesPage detail={vi.fn()} resourceValues={mixedResources} />);
    expect(screen.getByText("合成大学一级资料")).toBeVisible();
    window.history.pushState({}, "", "/resources?category=subject-junior-math&q=二级");
    fireEvent.popState(window);
    expect(screen.getByText("合成数学二级资料")).toBeVisible();
    expect(screen.queryByText("合成数学三级资料")).not.toBeInTheDocument();
    page.unmount();
    render(<ResourcesPage detail={vi.fn()} resourceValues={mixedResources} />);
    expect(screen.getByText("合成数学二级资料")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "关键词" })).toHaveValue("二级");
    window.history.replaceState({}, "", "/resources?category=stage-university");
    fireEvent.popState(window);
    expect(screen.getByText("合成大学一级资料")).toBeVisible();
  });

  it.each(["disabled", "missing-parent", "wrong-level"])("rejects the %s category branch without hiding other valid roots", (shape) => {
    const values: Category[] = categories.map((category) => {
      if (category.id !== "subject-junior-math") return category;
      if (shape === "disabled") return { ...category, enabled: false };
      if (shape === "missing-parent") return { ...category, parentId: "missing" };
      return { ...category, level: 3 };
    });
    render(<ResourcesPage detail={vi.fn()} resourceValues={mixedResources} categoryValues={values} />);
    expect(screen.getByText("合成大学一级资料")).toBeVisible();
    expect(screen.queryByText("合成数学二级资料")).not.toBeInTheDocument();
    expect(screen.queryByText("合成数学三级资料")).not.toBeInTheDocument();
  });
});

describe("resource card metadata and layout contracts", () => {
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

  it("renders valid type and size metadata without fabricating missing values", () => {
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
    expect(favorite).toHaveClass("resource-favorite-button");
    fireEvent.click(favorite);
    expect(onToggleFavorite).toHaveBeenCalledWith("full-metadata");
  });

  it("does not create a metadata label when both fields are absent or invalid", () => {
    expect(getResourceMetadataLabel({ fileType: "  ", sizeBytes: undefined })).toBeNull();
    expect(getResourceMetadataLabel({ fileType: undefined, sizeBytes: -1 })).toBeNull();
  });
});
