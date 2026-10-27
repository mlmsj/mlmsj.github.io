import { describe, expect, it } from "vitest";
import {
  categories,
  getCategoryPath,
  getEnabledCategoryPath,
  getChildCategories,
  isCategoryDataValid,
  validateCategories,
  type Category,
} from "./categories";

const root: Category = {
  id: "root",
  parentId: null,
  name: "一级",
  description: "",
  level: 1,
  sortOrder: 10,
  enabled: true,
};

describe("category data contract", () => {
  it("accepts the built-in three-level tree and resolves its path", () => {
    expect(isCategoryDataValid(categories)).toBe(true);
    expect(getCategoryPath("type-junior-math-notes").map(({ id }) => id)).toEqual(
      ["stage-junior", "subject-junior-math", "type-junior-math-notes"],
    );
  });

  it("rejects duplicate IDs, invalid parents, cycles, and a fourth level", () => {
    const invalid: Category[] = [
      root,
      { ...root },
      { ...root, id: "orphan", level: 2, parentId: "missing" },
      { ...root, id: "cycle-a", level: 2, parentId: "cycle-b" },
      { ...root, id: "cycle-b", level: 3, parentId: "cycle-a" },
      {
        ...root,
        id: "level-four",
        level: 4,
        parentId: "cycle-b",
      } as unknown as Category,
    ];
    const codes = validateCategories(invalid).map(({ code }) => code);

    expect(codes).toContain("duplicate-id");
    expect(codes).toContain("invalid-parent");
    expect(codes).toContain("cycle");
    expect(codes).toContain("invalid-level");
  });

  it("rejects duplicate names under the same parent", () => {
    expect(
      validateCategories([
        root,
        { ...root, id: "second", name: root.name, sortOrder: 20 },
      ]).map(({ code }) => code),
    ).toContain("duplicate-sibling-name");
  });

  it("sorts siblings by sortOrder", () => {
    const values: Category[] = [
      root,
      {
        ...root,
        id: "later",
        parentId: root.id,
        level: 2,
        name: "稍后",
        sortOrder: 20,
      },
      {
        ...root,
        id: "earlier",
        parentId: root.id,
        level: 2,
        name: "较早",
        sortOrder: 10,
      },
    ];

    expect(getChildCategories(root.id, values).map(({ id }) => id)).toEqual([
      "earlier",
      "later",
    ]);
  });

  it("keeps stable IDs when a category is renamed", () => {
    const renamed = categories.map((category) =>
      category.id === "stage-junior"
        ? { ...category, name: "初中阶段" }
        : category,
    );

    expect(getCategoryPath("type-junior-math-notes", renamed)[0].id).toBe(
      "stage-junior",
    );
  });

  it("resolves complete enabled paths at every supported level", () => {
    for (const [id, length] of [
      ["stage-junior", 1],
      ["subject-junior-math", 2],
      ["type-junior-math-notes", 3],
    ] as const) {
      expect(getEnabledCategoryPath(id)).toHaveLength(length);
    }
  });

  it("rejects missing parents, wrong levels, cycles, and ambiguous path IDs", () => {
    const child: Category = {
      ...root,
      id: "child",
      level: 2,
      parentId: root.id,
    };
    const leaf: Category = {
      ...root,
      id: "leaf",
      level: 3,
      parentId: child.id,
    };
    const cases: readonly [string, Category[]][] = [
      [child.id, [child]],
      [child.id, [root, { ...child, level: 3 }]],
      [child.id, [{ ...root, parentId: child.id }, child]],
      [leaf.id, [root, child, leaf, { ...root }]],
      [leaf.id, [root, child, leaf, { ...child }]],
      [leaf.id, [root, child, leaf, { ...leaf }]],
      [child.id, [root, { ...child, parentId: "" }]],
      [root.id, [{ ...root, level: 4 } as unknown as Category]],
    ];
    for (const [target, values] of cases) {
      expect(getCategoryPath(target, values)).toEqual([]);
      expect(getEnabledCategoryPath(target, values)).toEqual([]);
    }
  });

  it("keeps disabled structural paths for labels but denies public selection", () => {
    const disabledParent = categories.map((category) =>
      category.id === "subject-junior-math"
        ? { ...category, enabled: false }
        : category,
    );
    expect(getCategoryPath("type-junior-math-notes", disabledParent)).toHaveLength(3);
    expect(getEnabledCategoryPath("type-junior-math-notes", disabledParent)).toEqual([]);
    expect(getEnabledCategoryPath("missing", categories)).toEqual([]);
  });

  it("does not hide a valid path because an unrelated branch is invalid", () => {
    const values = [
      ...categories,
      { ...root, id: "unrelated-orphan", level: 2 as const, parentId: "missing" },
    ];
    expect(getEnabledCategoryPath("type-junior-math-notes", values)).toHaveLength(3);
  });
});
