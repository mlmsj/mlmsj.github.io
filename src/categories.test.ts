import { describe, expect, it } from "vitest";
import {
  categories,
  SKILL_GROWTH_ROOT_IDS,
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

  it("adds the three skill-growth roots without changing the four established roots", () => {
    expect(getChildCategories(null).slice(0, 4).map(({ id }) => id)).toEqual([
      "stage-junior",
      "stage-senior",
      "stage-university",
      "purpose-certification",
    ]);
    expect(getChildCategories(null).slice(4).map(({ id }) => id)).toEqual([
      ...SKILL_GROWTH_ROOT_IDS,
    ]);
    expect(getCategoryPath("skill-ai-deepseek").map(({ id }) => id)).toEqual([
      "skill-ai-digital-tech",
      "skill-ai-knowledge",
      "skill-ai-deepseek",
    ]);
  });

  it("removes the withdrawn senior exam branch and sorts the current themes by name length", () => {
    expect(getChildCategories("stage-senior").map(({ id }) => id)).toEqual([
      "domain-senior-courses",
      "domain-senior-competition",
      "domain-senior-one-series",
      "domain-senior-subjects",
      "domain-senior-sprint",
      "domain-senior-textbooks",
      "domain-senior-volunteer",
      "domain-senior-workbooks",
      "domain-senior-mocks",
      "domain-senior-policies",
    ]);
    expect(getCategoryPath("missing-senior-exam")).toEqual([]);
  });

  it("exposes the certification root with the confirmed second-level order", () => {
    expect(getChildCategories("purpose-certification").map(({ id }) => id)).toEqual([
      "purpose-certification-ielts",
      "purpose-certification-computer",
      "purpose-certification-cet",
      "purpose-certification-university",
      "purpose-certification-foreign-language",
      "purpose-certification-civil-service",
      "purpose-certification-upgrade",
    ]);
    expect(getEnabledCategoryPath("purpose-certification-upgrade").map(({ id }) => id)).toEqual([
      "purpose-certification",
      "purpose-certification-upgrade",
    ]);
  });

  it("exposes the current university tree and keeps proof as a leaf", () => {
    expect(getChildCategories("stage-university").slice(0, 6).map(({ id }) => id)).toEqual([
      "domain-university-major",
      "domain-university-competition",
      "domain-university-proof",
      "domain-university-certification",
      "domain-university-postgraduate",
      "domain-university-planning",
    ]);
    expect(getChildCategories("domain-university-major").map(({ id }) => id)).toEqual([
      "domain-university-major-courses",
      "domain-university-major-politics",
      "domain-university-major-textbooks",
      "domain-university-major-math",
    ]);
    expect(getChildCategories("domain-university-proof")).toEqual([]);
    expect(getEnabledCategoryPath("domain-university-planning-resume").map(({ id }) => id)).toEqual([
      "stage-university",
      "domain-university-planning",
      "domain-university-planning-resume",
    ]);
  });

  it("rejects duplicate IDs, invalid parents, cycles, and invalid levels", () => {
    const invalid: Category[] = [
      root,
      { ...root },
      { ...root, id: "orphan", level: 2, parentId: "missing" },
      { ...root, id: "cycle-a", level: 2, parentId: "cycle-b" },
      { ...root, id: "cycle-b", level: 3, parentId: "cycle-a" },
      {
        ...root,
        id: "invalid-level",
        level: 0,
      } as unknown as Category,
    ];
    const codes = validateCategories(invalid).map(({ code }) => code);

    expect(codes).toContain("duplicate-id");
    expect(codes).toContain("invalid-parent");
    expect(codes).toContain("cycle");
    expect(codes).toContain("invalid-level");
  });

  it("accepts arbitrary parentId depth while keeping contiguous levels", () => {
    const child: Category = {
      ...root,
      id: "child",
      name: "二级",
      parentId: root.id,
      level: 2,
    };
    const leaf: Category = {
      ...root,
      id: "leaf",
      name: "三级",
      parentId: child.id,
      level: 3,
    };
    const deep: Category = {
      ...root,
      id: "deep",
      name: "四级",
      parentId: leaf.id,
      level: 4,
    };
    const values = [root, child, leaf, deep];

    expect(validateCategories(values)).toEqual([]);
    expect(getCategoryPath(deep.id, values).map(({ id }) => id)).toEqual([
      root.id,
      child.id,
      leaf.id,
      deep.id,
    ]);
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
