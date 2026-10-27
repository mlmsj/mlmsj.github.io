import { describe, expect, it } from "vitest";
import type { Category } from "./categories";
import {
  getPublishedResourceCount,
  getPublishedResourcesForCategory,
  isPublishedPublicResource,
} from "./categoryCounts";
import type { Resource } from "./resources";

const root: Category = {
  id: "university-fixture",
  parentId: null,
  name: "合成大学",
  description: "",
  level: 1,
  sortOrder: 10,
  enabled: true,
};
const subject: Category = {
  ...root,
  id: "subject-fixture",
  parentId: root.id,
  name: "合成学科",
  level: 2,
};
const leaf: Category = {
  ...root,
  id: "leaf-fixture",
  parentId: subject.id,
  name: "合成类型",
  level: 3,
};
const other: Category = { ...root, id: "other-fixture", name: "合成其他" };
const values = [root, subject, leaf, other];
const verifiedDelivery: NonNullable<Resource["delivery"]> = {
  provider: "quark",
  shareUrl: "https://pan.quark.cn/s/category-fixture",
  accessStatus: "verified",
  checkedOn: "2026-01-01",
};
const resource = (id: string, categoryId: string | null): Resource => ({
  id,
  title: `合成资料 ${id}`,
  meta: "2026-01-01",
  tag: "合成",
  description: "仅用于分类契约测试",
  categoryId,
  classificationStatus: "classified",
  publicationStatus: "published",
  isPubliclyAccessible: true,
  delivery: verifiedDelivery,
});

describe("public resources and recursive category counts", () => {
  it("includes direct resources at each supported level and valid descendants", () => {
    const items = [
      resource("root", root.id),
      resource("subject", subject.id),
      resource("leaf", leaf.id),
      resource("other", other.id),
    ];
    for (const item of items) expect(isPublishedPublicResource(item, values)).toBe(true);
    for (const [id, expected] of [
      [root.id, ["root", "subject", "leaf"]],
      [subject.id, ["subject", "leaf"]],
      [leaf.id, ["leaf"]],
      [other.id, ["other"]],
    ] as const) {
      const selected = getPublishedResourcesForCategory(id, values, items);
      expect(selected.map(({ id: resourceId }) => resourceId)).toEqual(expected);
      expect(getPublishedResourceCount(id, values, items)).toBe(selected.length);
    }
  });

  it("denies unknown, disabled, incomplete, wrong-level, cyclic, and ambiguous paths", () => {
    const cases: readonly Category[][] = [
      values.map((category) => category.id === root.id ? { ...category, enabled: false } : category),
      values.map((category) => category.id === subject.id ? { ...category, enabled: false } : category),
      values.map((category) => category.id === leaf.id ? { ...category, enabled: false } : category),
      values.filter(({ id }) => id !== subject.id),
      values.map((category) => category.id === subject.id ? { ...category, level: 1 as const, parentId: null } : category),
      values.map((category) => category.id === root.id ? { ...category, parentId: leaf.id } : category),
      [...values, { ...subject }],
    ];
    for (const categoryValues of cases) {
      const item = resource("invalid-path", leaf.id);
      expect(isPublishedPublicResource(item, categoryValues)).toBe(false);
      expect(getPublishedResourcesForCategory(root.id, categoryValues, [item])).toEqual([]);
      expect(getPublishedResourceCount(root.id, categoryValues, [item])).toBe(0);
    }
    const unknown = resource("unknown", "missing");
    expect(isPublishedPublicResource(unknown, values)).toBe(false);
    expect(getPublishedResourcesForCategory("missing", values, [unknown])).toEqual([]);
    expect(getPublishedResourceCount("missing", values, [unknown])).toBe(0);
  });

  it("keeps unchecked, unknown, pending, private, draft, and withdrawn resources out of every count and filter", () => {
    const published = resource("published", leaf.id);
    const items: Resource[] = [
      published,
      {
        ...resource("unchecked", leaf.id),
        delivery: { ...verifiedDelivery, accessStatus: "unchecked", checkedOn: null },
      },
      {
        ...resource("unknown-status", leaf.id),
        delivery: {
          ...verifiedDelivery,
          accessStatus: "unknown" as unknown as NonNullable<Resource["delivery"]>["accessStatus"],
        },
      },
      { ...resource("pending", leaf.id), classificationStatus: "pending" },
      { ...resource("draft", root.id), publicationStatus: "draft" },
      { ...resource("withdrawn", subject.id), publicationStatus: "withdrawn" },
      { ...resource("private", root.id), isPubliclyAccessible: false },
      { ...resource("unclassified", null) },
      { ...resource("missing-delivery", leaf.id), delivery: undefined },
      {
        ...resource("withdrawn-delivery", leaf.id),
        delivery: { provider: "quark", shareUrl: null, accessStatus: "withdrawn" },
      },
    ];
    expect(items.filter((item) => isPublishedPublicResource(item, values))).toEqual([published]);
    for (const category of [root, subject, leaf]) {
      expect(getPublishedResourcesForCategory(category.id, values, items)).toEqual([published]);
      expect(getPublishedResourceCount(category.id, values, items)).toBe(1);
    }
  });
});
