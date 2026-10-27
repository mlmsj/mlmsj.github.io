import {
  categories,
  getChildCategories,
  getEnabledCategoryPath,
  type Category,
} from "./categories";
import { locationPathForAppPath } from "./routing";

export const CATEGORY_PARAM = "category";
export const SUBJECT_PARAM = "subject";

export type CategoryRouteIssue =
  | "invalid-category"
  | "invalid-subject"
  | "subject-parent-mismatch";

export type CategoryRouteState = {
  category: Category | null;
  subject: Category | null;
  issues: readonly CategoryRouteIssue[];
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

  return { category, subject, issues };
};

export const readCategoryRouteState = (
  values: readonly Category[] = categories,
) => parseCategoryRouteState(window.location.search, values);

export const categoryBrowseLocation = (
  categoryId?: string,
  subjectId?: string,
  values: readonly Category[] = categories,
) => {
  const params = new URLSearchParams();
  const categoryPath = categoryId ? getEnabledCategoryPath(categoryId, values) : [];
  const subjectPath = subjectId ? getEnabledCategoryPath(subjectId, values) : [];
  if (categoryPath.length === 1) {
    params.set(CATEGORY_PARAM, categoryId!);
    if (subjectPath.length === 2 && subjectPath[0].id === categoryId) {
      params.set(SUBJECT_PARAM, subjectId!);
    }
  }
  const search = params.toString();
  return locationPathForAppPath(`/categories${search ? `?${search}` : ""}`);
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
