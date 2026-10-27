import {
  categories,
  getEnabledCategoryPath,
  type Category,
} from "./categories";
import { CATEGORY_PARAM } from "./categoryRouting";

export type ResourceFilterIssue = "invalid-category";

export type ResourceFilterState = {
  category: Category | null;
  hasCategoryParameter: boolean;
  issues: readonly ResourceFilterIssue[];
};

export const parseResourceFilterState = (
  search: string,
  categoryValues: readonly Category[] = categories,
): ResourceFilterState => {
  const categoryId = new URLSearchParams(search).get(CATEGORY_PARAM);
  if (!categoryId) {
    return { category: null, hasCategoryParameter: false, issues: [] };
  }

  const path = getEnabledCategoryPath(categoryId, categoryValues);
  const category = path[path.length - 1];

  return category
    ? { category, hasCategoryParameter: true, issues: [] }
    : {
        category: null,
        hasCategoryParameter: true,
        issues: ["invalid-category"],
      };
};
