import { UNIVERSITY_LEGACY_CATEGORY_IDS } from "./categories";

/**
 * These category definitions remain valid for deep links and future imports.
 * They are omitted from the visible navigation only while their public count
 * is zero, so a later published record makes the category visible again.
 */
export const HIDDEN_EMPTY_CATEGORY_IDS: ReadonlySet<string> = new Set([
  "subject-junior-math",
  "type-junior-math-notes",
]);

/**
 * The old university entries remain addressable for compatibility, but are
 * no longer part of the current category tree shown to users.
 */
export const HIDDEN_LEGACY_CATEGORY_IDS: ReadonlySet<string> = new Set(
  UNIVERSITY_LEGACY_CATEGORY_IDS,
);

export function shouldShowCategoryInNavigation(
  categoryId: string,
  publishedCount: number,
) {
  if (HIDDEN_LEGACY_CATEGORY_IDS.has(categoryId)) return false;
  return !HIDDEN_EMPTY_CATEGORY_IDS.has(categoryId) || publishedCount > 0;
}
