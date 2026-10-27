export type CategoryLevel = 1 | 2 | 3;

export type Category = {
  id: string;
  parentId: string | null;
  name: string;
  description: string;
  level: CategoryLevel;
  sortOrder: number;
  enabled: boolean;
};

export const categories: readonly Category[] = [
  {
    id: "stage-junior",
    parentId: null,
    name: "初中",
    description: "初中阶段各学科资料",
    level: 1,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "stage-senior",
    parentId: null,
    name: "高中",
    description: "高中阶段各学科资料",
    level: 1,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "stage-university",
    parentId: null,
    name: "大学",
    description: "大学课程与考试资料",
    level: 1,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "purpose-certification",
    parentId: null,
    name: "考证",
    description: "职业资格与能力考试资料",
    level: 1,
    sortOrder: 40,
    enabled: true,
  },
  {
    id: "subject-junior-math",
    parentId: "stage-junior",
    name: "数学",
    description: "初中数学示例分类",
    level: 2,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "type-junior-math-notes",
    parentId: "subject-junior-math",
    name: "知识点整理",
    description: "知识点梳理类资料",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
];

export type CategoryValidationIssue = {
  code:
    | "duplicate-id"
    | "invalid-parent"
    | "invalid-level"
    | "cycle"
    | "duplicate-sibling-name";
  categoryId: string;
  message: string;
};

export const validateCategories = (
  values: readonly Category[],
): readonly CategoryValidationIssue[] => {
  const issues: CategoryValidationIssue[] = [];
  const byId = new Map<string, Category>();

  for (const category of values) {
    if (byId.has(category.id)) {
      issues.push({
        code: "duplicate-id",
        categoryId: category.id,
        message: `分类 ID 重复：${category.id}`,
      });
    } else {
      byId.set(category.id, category);
    }
  }

  for (const category of values) {
    if (![1, 2, 3].includes(category.level)) {
      issues.push({
        code: "invalid-level",
        categoryId: category.id,
        message: `分类层级必须为 1、2 或 3：${category.id}`,
      });
      continue;
    }

    if (category.level === 1) {
      if (category.parentId !== null) {
        issues.push({
          code: "invalid-level",
          categoryId: category.id,
          message: `一级分类不能有父分类：${category.id}`,
        });
      }
    } else {
      const parent = category.parentId
        ? byId.get(category.parentId)
        : undefined;
      if (!parent) {
        issues.push({
          code: "invalid-parent",
          categoryId: category.id,
          message: `分类缺少有效父级：${category.id}`,
        });
      } else if (parent.level !== category.level - 1) {
        issues.push({
          code: "invalid-level",
          categoryId: category.id,
          message: `分类层级与父级不匹配：${category.id}`,
        });
      }
    }

    const visited = new Set<string>([category.id]);
    let parentId = category.parentId;
    while (parentId) {
      if (visited.has(parentId)) {
        issues.push({
          code: "cycle",
          categoryId: category.id,
          message: `分类关系存在循环：${category.id}`,
        });
        break;
      }
      visited.add(parentId);
      parentId = byId.get(parentId)?.parentId ?? null;
    }
  }

  const siblingNames = new Map<string, string>();
  for (const category of values) {
    const key = `${category.parentId ?? "root"}\u0000${category.name.trim()}`;
    const existingId = siblingNames.get(key);
    if (existingId && existingId !== category.id) {
      issues.push({
        code: "duplicate-sibling-name",
        categoryId: category.id,
        message: `同一父级下分类名称重复：${category.name}`,
      });
    } else {
      siblingNames.set(key, category.id);
    }
  }

  return issues;
};

export const isCategoryDataValid = (values: readonly Category[]) =>
  validateCategories(values).length === 0;

export const getCategoryById = (
  id: string,
  values: readonly Category[] = categories,
) => values.find((category) => category.id === id);

export const sortCategories = (values: readonly Category[]) =>
  [...values].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder ||
      left.name.localeCompare(right.name, "zh-CN") ||
      left.id.localeCompare(right.id),
  );

export const getChildCategories = (
  parentId: string | null,
  values: readonly Category[] = categories,
  includeDisabled = false,
) =>
  sortCategories(
    values.filter(
      (category) =>
        category.parentId === parentId &&
        (includeDisabled || category.enabled),
    ),
  );

export const getCategoryPath = (
  id: string,
  values: readonly Category[] = categories,
): readonly Category[] => {
  const byId = new Map<string, Category>();
  const duplicateIds = new Set<string>();
  for (const category of values) {
    if (byId.has(category.id)) duplicateIds.add(category.id);
    else byId.set(category.id, category);
  }
  const path: Category[] = [];
  const visited = new Set<string>();
  let current = byId.get(id);

  while (current) {
    if (
      visited.has(current.id) ||
      duplicateIds.has(current.id) ||
      ![1, 2, 3].includes(current.level)
    ) return [];
    visited.add(current.id);
    path.unshift(current);
    if (current.parentId === null) {
      return current.level === 1 && path.length === path[path.length - 1].level
        ? path
        : [];
    }
    const parent = byId.get(current.parentId);
    if (!parent || parent.level !== current.level - 1) return [];
    current = parent;
  }

  return [];
};

export const getEnabledCategoryPath = (
  id: string,
  values: readonly Category[] = categories,
): readonly Category[] => {
  const path = getCategoryPath(id, values);
  return path.every((category) => category.enabled) ? path : [];
};

if (!isCategoryDataValid(categories)) {
  throw new Error("内置分类数据无效");
}
