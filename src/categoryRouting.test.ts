import { describe, expect, it } from "vitest";
import {
  categoryBrowseLocation,
  parseCategoryRouteState,
  readCategoryRouteState,
  resourceFilterLocation,
} from "./categoryRouting";
import { categories, type Category } from "./categories";
import { appPathFromLocation, locationPathForAppPath } from "./routing";
import { parseResourceFilterState } from "./resourceFiltering";

describe("category URL state", () => {
  it("uses the first enabled root for /categories without parameters", () => {
    const state = parseCategoryRouteState("");

    expect(state.category?.id).toBe("stage-junior");
    expect(state.subject).toBeNull();
    expect(state.issues).toEqual([]);
  });

  it("restores a valid first- and second-level selection", () => {
    const state = parseCategoryRouteState(
      "?category=stage-junior&subject=subject-junior-math",
    );

    expect(state.category?.id).toBe("stage-junior");
    expect(state.subject?.id).toBe("subject-junior-math");
  });

  it("falls back safely for invalid, disabled, or mismatched parameters", () => {
    const disabled = categories.map((category) =>
      category.id === "stage-senior"
        ? { ...category, enabled: false }
        : category,
    );
    const invalid = parseCategoryRouteState(
      "?category=missing&subject=type-junior-math-notes",
    );
    const disabledState = parseCategoryRouteState(
      "?category=stage-senior",
      disabled,
    );
    const mismatchedValues: Category[] = [
      ...categories,
      {
        id: "subject-senior-example",
        parentId: "stage-senior",
        name: "示例学科",
        description: "",
        level: 2,
        sortOrder: 10,
        enabled: true,
      },
    ];
    const mismatched = parseCategoryRouteState(
      "?category=stage-junior&subject=subject-senior-example",
      mismatchedValues,
    );

    expect(invalid.category?.id).toBe("stage-junior");
    expect(invalid.subject).toBeNull();
    expect(invalid.issues).toEqual(["invalid-category", "invalid-subject"]);
    expect(disabledState.category?.id).toBe("stage-junior");
    expect(disabledState.issues).toEqual(["invalid-category"]);
    expect(mismatched.subject).toBeNull();
    expect(mismatched.issues).toEqual(["subject-parent-mismatch"]);
  });

  it("re-reads URL state after browser history navigation", () => {
    window.history.replaceState({}, "", "/categories?category=stage-junior");
    expect(readCategoryRouteState().category?.id).toBe("stage-junior");

    window.history.pushState({}, "", "/categories?category=stage-senior");
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(readCategoryRouteState().category?.id).toBe("stage-senior");
  });

  it("builds stable browse and resource filter URLs for all category levels", () => {
    expect(
      appPathFromLocation(
        new URL(
          categoryBrowseLocation("stage-junior", "subject-junior-math"),
          window.location.origin,
        ).pathname,
      ),
    ).toBe("/categories");
    expect(categoryBrowseLocation("stage-junior", "subject-junior-math")).toContain(
      "category=stage-junior&subject=subject-junior-math",
    );
    expect(resourceFilterLocation("type-junior-math-notes")).toContain(
      "/resources?category=type-junior-math-notes",
    );
    for (const id of ["stage-university", "subject-junior-math", "type-junior-math-notes"]) {
      const location = resourceFilterLocation(id);
      expect(location).not.toBeNull();
      const url = new URL(location!, window.location.origin);
      expect(parseResourceFilterState(url.search).category?.id).toBe(id);
      window.history.replaceState({}, "", url);
      expect(parseResourceFilterState(window.location.search).category?.id).toBe(id);
    }
    expect(resourceFilterLocation("missing")).toBeNull();
  });

  it("generates restorable filter and browse routes for a supplied category tree", () => {
    const values: Category[] = [
      { ...categories[0], id: "custom-root" },
      { ...categories[4], id: "custom-subject", parentId: "custom-root" },
      { ...categories[5], id: "custom-leaf", parentId: "custom-subject" },
    ];
    for (const category of values) {
      const url = new URL(resourceFilterLocation(category.id, values)!, window.location.origin);
      expect(parseResourceFilterState(url.search, values).category?.id).toBe(category.id);
    }
    const browse = new URL(categoryBrowseLocation("custom-root", "custom-subject", values), window.location.origin);
    const state = parseCategoryRouteState(browse.search, values);
    expect(state.category?.id).toBe("custom-root");
    expect(state.subject?.id).toBe("custom-subject");
    expect(state.issues).toEqual([]);
  });

  it("denies invalid or disabled ancestor paths in route parsing and generation", () => {
    const cases: readonly Category[][] = [
      categories.map((category) => category.id === "stage-junior"
        ? { ...category, enabled: false }
        : category),
      categories.filter(({ id }) => id !== "stage-junior"),
      categories.map((category) => category.id === "stage-junior"
        ? { ...category, parentId: "type-junior-math-notes" }
        : category),
      [...categories, { ...categories[0] }],
    ];
    for (const values of cases) {
      expect(resourceFilterLocation("type-junior-math-notes", values)).toBeNull();
      const state = parseCategoryRouteState("?category=stage-junior&subject=subject-junior-math", values);
      expect(state.category?.id).not.toBe("stage-junior");
      expect(state.subject).toBeNull();
      expect(state.issues).toEqual(["invalid-category", "invalid-subject"]);
      const generated = new URL(categoryBrowseLocation("stage-junior", "subject-junior-math", values), window.location.origin);
      expect(generated.search).toBe("");
    }
  });

  it("preserves existing route normalization behavior", () => {
    expect(appPathFromLocation(locationPathForAppPath("/tools/ocr/"))).toBe(
      "/tools/ocr",
    );
    expect(locationPathForAppPath("/resources?category=example#results")).toContain(
      "/resources?category=example#results",
    );
  });
});
