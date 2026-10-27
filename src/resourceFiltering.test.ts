import { describe, expect, it } from "vitest";
import { categories, type Category } from "./categories";
import { parseResourceFilterState } from "./resourceFiltering";

describe("resource category URL parsing", () => {
  it("accepts enabled first-, second-, and third-level categories", () => {
    for (const id of ["stage-university", "subject-junior-math", "type-junior-math-notes"]) {
      const state = parseResourceFilterState(`?category=${id}`);
      expect(state.category?.id).toBe(id);
      expect(state.hasCategoryParameter).toBe(true);
      expect(state.issues).toEqual([]);
    }
  });

  it("keeps the unfiltered state distinct from an invalid category", () => {
    expect(parseResourceFilterState("?q=示例")).toEqual({
      category: null,
      hasCategoryParameter: false,
      issues: [],
    });
  });

  it("rejects missing, disabled, and disabled-ancestor categories", () => {
    const disabledLeaf = categories.map((category) =>
      category.id === "type-junior-math-notes"
        ? { ...category, enabled: false }
        : category,
    );
    const disabledParent = categories.map((category) =>
      category.id === "subject-junior-math"
        ? { ...category, enabled: false }
        : category,
    );

    expect(parseResourceFilterState("?category=missing").issues).toEqual([
      "invalid-category",
    ]);
    expect(
      parseResourceFilterState(
        "?category=type-junior-math-notes",
        disabledLeaf,
      ).issues,
    ).toEqual(["invalid-category"]);
    expect(
      parseResourceFilterState(
        "?category=type-junior-math-notes",
        disabledParent,
      ).issues,
    ).toEqual(["invalid-category"]);
  });

  it("rejects wrong levels, missing parents, cycles, and duplicate ancestors", () => {
    const cases: readonly Category[][] = [
      categories.filter(({ id }) => id !== "subject-junior-math"),
      categories.map((category) => category.id === "subject-junior-math"
        ? { ...category, level: 1 as const, parentId: null }
        : category),
      categories.map((category) => category.id === "stage-junior"
        ? { ...category, parentId: "type-junior-math-notes" }
        : category),
      [...categories, { ...categories[0] }],
    ];
    for (const values of cases) {
      expect(parseResourceFilterState("?category=type-junior-math-notes", values)).toEqual({
        category: null,
        hasCategoryParameter: true,
        issues: ["invalid-category"],
      });
    }
  });
});
