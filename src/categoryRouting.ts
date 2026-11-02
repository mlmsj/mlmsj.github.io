import {
  categories,
  getChildCategories,
  getEnabledCategoryPath,
  type Category,
} from "./categories";
import { locationPathForAppPath } from "./routing";

export const CATEGORY_PARAM = "category";
export const SUBJECT_PARAM = "subject";
export const CATEGORY_PATH_PARAM = "categoryPath";

export type CategoryRouteIssue =
  | "invalid-category"
  | "invalid-subject"
  | "subject-parent-mismatch"
  | "invalid-category-path";

export type CategoryRouteState = {
  category: Category | null;
  subject: Category | null;
  path: readonly Category[];
  selected: Category | null;
  issues: readonly CategoryRouteIssue[];
};

const hasExactCategoryPath = (
  ids: readonly string[],
  values: readonly Category[],
) => {
  if (ids.length === 0) return null;
  const path = getEnabledCategoryPath(ids[ids.length - 1], values);
  return path.length === ids.length && path.every((entry, index) => entry.id === ids[index])
    ? path
    : null;
};

export const parseCategoryRouteState = (
  search: string,
  values: readonly Category[] = categories,
): CategoryRouteState => {
  const params = new URLSearchParams(search);
  const issues: CategoryRouteIssue[] = [];
  const firstAvailable = getChildCategories(null, values).find(
    (entry) => getEnabledCategoryPath(entry.id, values).length === 1,
  ) ?? null;
  const hasCategoryPath = params.has(CATEGORY_PATH_PARAM);
  if (hasCategoryPath) {
    const rawPath = params.get(CATEGORY_PATH_PARAM) ?? "";
    const ids = rawPath.split(",").map((id) => id.trim()).filter(Boolean);
    const path = hasExactCategoryPath(ids, values);
    if (!path) {
      return {
        category: firstAvailable,
        subject: null,
        path: [],
        selected: null,
        issues: ["invalid-category-path"],
      };
    }
    return {
      category: path[0] ?? null,
      subject: path[1] ?? null,
      path,
      selected: path[path.length - 1] ?? null,
      issues: [],
    };
  }

  const categoryId = params.get(CATEGORY_PARAM);
  const categoryPath = categoryId ? getEnabledCategoryPath(categoryId, values) : [];
  const requestedCategory = categoryPath[categoryPath.length - 1];
  const category =
    requestedCategory?.level === 1
      ? requestedCategory
      : firstAvailable;

  if (categoryId && category?.id !== categoryId) {
    issues.push("invalid-category");
  }

  const subjectId = params.get(SUBJECT_PARAM);
  const subjectPath = subjectId ? getEnabledCategoryPath(subjectId, values) : [];
  const requestedSubject = subjectPath[subjectPath.length - 1];
  let subject: Category | null = null;
  if (subjectId) {
    if (requestedSubject?.level !== 2) {
      issues.push("invalid-subject");
    } else if (!category || requestedSubject.parentId !== category.id) {
      issues.push("subject-parent-mismatch");
    } else {
      subject = requestedSubject;
    }
  }

  const path = category
    ? subject
      ? [category, subject]
      : categoryId === category.id
        ? [category]
        : []
    : [];
  return {
    category,
    subject,
    path,
    selected: path[path.length - 1] ?? null,
    issues,
  };
};

export const readCategoryRouteState = (
  values: readonly Category[] = categories,
) => parseCategoryRouteState(window.location.search, values);

export const categoryBrowseLocation = (
  categoryId?: string,
  subjectId?: string,
  values: readonly Category[] = categories,
) => {
  return categoryPathBrowseLocation(
    [categoryId, subjectId].filter((id): id is string => Boolean(id)),
    values,
  );
};

export const categoryPathBrowseLocation = (
  categoryIds: readonly string[] = [],
  values: readonly Category[] = categories,
) => {
  const path = hasExactCategoryPath(categoryIds, values);
  if (!path) return locationPathForAppPath("/categories");

  const params = new URLSearchParams();
  if (path.length === 1) {
    params.set(CATEGORY_PARAM, path[0].id);
  } else if (path.length === 2) {
    params.set(CATEGORY_PARAM, path[0].id);
    params.set(SUBJECT_PARAM, path[1].id);
  } else {
    params.set(CATEGORY_PATH_PARAM, path.map((category) => category.id).join(","));
  }
  return locationPathForAppPath(`/categories?${params.toString()}`);
};

export const resourceFilterLocation = (
  categoryId: string,
  values: readonly Category[] = categories,
) => {
  if (getEnabledCategoryPath(categoryId, values).length === 0) {
    return null;
  }
  const params = new URLSearchParams({
    [CATEGORY_PARAM]: categoryId,
  });
  return locationPathForAppPath(`/resources?${params.toString()}`);
};
