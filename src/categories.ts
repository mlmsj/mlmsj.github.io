export type CategoryLevel = number;

export type Category = {
  id: string;
  parentId: string | null;
  name: string;
  description: string;
  level: CategoryLevel;
  sortOrder: number;
  enabled: boolean;
};

export const UNIVERSITY_DOMAIN_IDS = [
  "domain-university-major",
  "domain-university-major-courses",
  "domain-university-major-politics",
  "domain-university-major-textbooks",
  "domain-university-major-math",
  "domain-university-competition",
  "domain-university-competition-english",
  "domain-university-proof",
  "domain-university-certification",
  "domain-university-certification-ielts",
  "domain-university-certification-computer",
  "domain-university-certification-cet",
  "domain-university-postgraduate",
  "domain-university-postgraduate-kaoyan",
  "domain-university-planning",
  "domain-university-planning-materials",
  "domain-university-planning-ppt",
  "domain-university-planning-resume",
] as const;

export const UNIVERSITY_LEGACY_CATEGORY_IDS = [
  "domain-university-politics",
  "domain-university-english-exam",
  "domain-university-computer-exam",
  "domain-university-review",
  "domain-university-certification",
  "domain-university-certification-ielts",
  "domain-university-certification-computer",
  "domain-university-certification-cet",
] as const;

export type UniversityDomainId = (typeof UNIVERSITY_DOMAIN_IDS)[number];

export const JUNIOR_DOMAIN_IDS = [
  "domain-junior-textbooks",
  "domain-junior-workbooks",
  "domain-junior-exams",
  "domain-junior-courses",
  "domain-junior-subjects",
  "domain-junior-sprint",
] as const;

export type JuniorDomainId = (typeof JUNIOR_DOMAIN_IDS)[number];

export const SENIOR_DOMAIN_IDS = [
  "domain-senior-textbooks",
  "domain-senior-workbooks",
  "domain-senior-mocks",
  "domain-senior-courses",
  "domain-senior-sprint",
  "domain-senior-subjects",
  "domain-senior-competition",
  "domain-senior-one-series",
  "domain-senior-volunteer",
  "domain-senior-policies",
] as const;

export type SeniorDomainId = (typeof SENIOR_DOMAIN_IDS)[number];

export const CERTIFICATION_DOMAIN_IDS = [
  "purpose-certification-ielts",
  "purpose-certification-computer",
  "purpose-certification-cet",
  "purpose-certification-university",
  "purpose-certification-foreign-language",
  "purpose-certification-civil-service",
  "purpose-certification-upgrade",
] as const;

export type CertificationDomainId = (typeof CERTIFICATION_DOMAIN_IDS)[number];

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
    id: "domain-senior-textbooks",
    parentId: "stage-senior",
    name: "课本教材",
    description: "高中各学科电子课本与教材资料",
    level: 2,
    sortOrder: 60,
    enabled: true,
  },
  {
    id: "domain-senior-workbooks",
    parentId: "stage-senior",
    name: "教辅与刷题",
    description: "高中各学科教辅、复习与刷题资料",
    level: 2,
    sortOrder: 80,
    enabled: true,
  },
  {
    id: "domain-senior-mocks",
    parentId: "stage-senior",
    name: "模拟题与真题",
    description: "高中阶段模拟题与真题资料",
    level: 2,
    sortOrder: 90,
    enabled: true,
  },
  {
    id: "domain-senior-courses",
    parentId: "stage-senior",
    name: "网课",
    description: "高中网课资料，浏览时以年级为主要维度",
    level: 2,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "domain-senior-sprint",
    parentId: "stage-senior",
    name: "考前冲刺",
    description: "高中考前冲刺、押题与答题规范资料",
    level: 2,
    sortOrder: 50,
    enabled: true,
  },
  {
    id: "domain-senior-subjects",
    parentId: "stage-senior",
    name: "学科分类",
    description: "高中各学科资料分类入口",
    level: 2,
    sortOrder: 40,
    enabled: true,
  },
  {
    id: "domain-senior-competition",
    parentId: "stage-senior",
    name: "竞赛",
    description: "高中竞赛资料入口",
    level: 2,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "domain-senior-one-series",
    parentId: "stage-senior",
    name: "一系列",
    description: "高中一系列公益资料入口",
    level: 2,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "domain-senior-volunteer",
    parentId: "stage-senior",
    name: "志愿填报",
    description: "高中升学志愿填报资料",
    level: 2,
    sortOrder: 70,
    enabled: true,
  },
  {
    id: "domain-senior-policies",
    parentId: "stage-senior",
    name: "高考相关政策",
    description: "高考相关政策与公开说明资料",
    level: 2,
    sortOrder: 100,
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
    id: "purpose-certification-ielts",
    parentId: "purpose-certification",
    name: "雅思",
    description: "雅思考试资料",
    level: 2,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "purpose-certification-computer",
    parentId: "purpose-certification",
    name: "计算机",
    description: "计算机等级考试资料",
    level: 2,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "purpose-certification-cet",
    parentId: "purpose-certification",
    name: "四六级",
    description: "大学英语四、六级资料",
    level: 2,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "purpose-certification-university",
    parentId: "purpose-certification",
    name: "大学考证",
    description: "大学考证资料总入口",
    level: 2,
    sortOrder: 40,
    enabled: true,
  },
  {
    id: "purpose-certification-foreign-language",
    parentId: "purpose-certification",
    name: "外语系列",
    description: "外语系列考试资料",
    level: 2,
    sortOrder: 50,
    enabled: true,
  },
  {
    id: "purpose-certification-civil-service",
    parentId: "purpose-certification",
    name: "考公系列",
    description: "公务员考试资料",
    level: 2,
    sortOrder: 60,
    enabled: true,
  },
  {
    id: "purpose-certification-upgrade",
    parentId: "purpose-certification",
    name: "专升本系列",
    description: "专升本考试资料",
    level: 2,
    sortOrder: 70,
    enabled: true,
  },
  {
    id: "domain-junior-textbooks",
    parentId: "stage-junior",
    name: "课本教材",
    description: "初中各学科课本与教材资料",
    level: 2,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "domain-junior-workbooks",
    parentId: "stage-junior",
    name: "教辅与刷题",
    description: "初中各学科教辅、练习与刷题资料",
    level: 2,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "domain-junior-exams",
    parentId: "stage-junior",
    name: "模拟题与真题",
    description: "初中各学科模拟题与历年真题资料",
    level: 2,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "domain-junior-courses",
    parentId: "stage-junior",
    name: "网课",
    description: "初中网课资料，浏览时以年级为主要维度",
    level: 2,
    sortOrder: 40,
    enabled: true,
  },
  {
    id: "domain-junior-subjects",
    parentId: "stage-junior",
    name: "学科分类",
    description: "初中各学科资料分类入口",
    level: 2,
    sortOrder: 50,
    enabled: true,
  },
  {
    id: "domain-junior-sprint",
    parentId: "stage-junior",
    name: "考前冲刺",
    description: "初中考试前冲刺与重点复习资料",
    level: 2,
    sortOrder: 60,
    enabled: true,
  },
  {
    id: "subject-junior-math",
    parentId: "stage-junior",
    name: "数学",
    description: "旧版初中数学兼容入口",
    level: 2,
    sortOrder: 70,
    enabled: true,
  },
  {
    id: "type-junior-math-notes",
    parentId: "subject-junior-math",
    name: "知识点整理",
    description: "旧版数学知识点梳理类资料",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "domain-university-major",
    parentId: "stage-university",
    name: "大学专业",
    description: "大学专业、数学、教材与思政资料",
    level: 2,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "domain-university-major-courses",
    parentId: "domain-university-major",
    name: "大学专业课",
    description: "大学专业课教材与课程资料",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "domain-university-major-politics",
    parentId: "domain-university-major",
    name: "思政系列",
    description: "大学思政系列资料",
    level: 3,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "domain-university-major-textbooks",
    parentId: "domain-university-major",
    name: "大学教材",
    description: "大学教材资料",
    level: 3,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "domain-university-major-math",
    parentId: "domain-university-major",
    name: "大学数学",
    description: "大学数学及相关数学课程资料",
    level: 3,
    sortOrder: 40,
    enabled: true,
  },
  {
    id: "domain-university-competition",
    parentId: "stage-university",
    name: "大学竞赛",
    description: "大学竞赛资料",
    level: 2,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "domain-university-competition-english",
    parentId: "domain-university-competition",
    name: "大英赛",
    description: "大学生英语竞赛资料",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "domain-university-proof",
    parentId: "stage-university",
    name: "大学证明",
    description: "证明模板资料；本级不再拆分二级分类",
    level: 2,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "domain-university-certification",
    parentId: "stage-university",
    name: "大学考证",
    description: "大学英语、计算机及相关考试资料",
    level: 2,
    sortOrder: 40,
    enabled: true,
  },
  {
    id: "domain-university-certification-ielts",
    parentId: "domain-university-certification",
    name: "雅思系列",
    description: "雅思考试资料",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "domain-university-certification-computer",
    parentId: "domain-university-certification",
    name: "计算机",
    description: "计算机等级考试资料",
    level: 3,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "domain-university-certification-cet",
    parentId: "domain-university-certification",
    name: "四六级",
    description: "大学英语四、六级资料",
    level: 3,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "domain-university-postgraduate",
    parentId: "stage-university",
    name: "大学升学",
    description: "大学升学与考研资料",
    level: 2,
    sortOrder: 50,
    enabled: true,
  },
  {
    id: "domain-university-postgraduate-kaoyan",
    parentId: "domain-university-postgraduate",
    name: "考研",
    description: "考研教辅与网课资料",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "domain-university-planning",
    parentId: "stage-university",
    name: "大学规划",
    description: "大学生职业规划与求职资料",
    level: 2,
    sortOrder: 60,
    enabled: true,
  },
  {
    id: "domain-university-planning-materials",
    parentId: "domain-university-planning",
    name: "职业规划资料",
    description: "大学生职业规划资料",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "domain-university-planning-ppt",
    parentId: "domain-university-planning",
    name: "职业规划大赛PPT",
    description: "职业规划大赛演示文稿资料",
    level: 3,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "domain-university-planning-resume",
    parentId: "domain-university-planning",
    name: "简历模板",
    description: "简历模板资料",
    level: 3,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "domain-university-politics",
    parentId: "stage-university",
    name: "思政",
    description: "旧版大学思政兼容入口",
    level: 2,
    sortOrder: 910,
    enabled: true,
  },
  {
    id: "domain-university-english-exam",
    parentId: "stage-university",
    name: "英语考试",
    description: "旧版大学英语考试兼容入口",
    level: 2,
    sortOrder: 920,
    enabled: true,
  },
  {
    id: "domain-university-computer-exam",
    parentId: "stage-university",
    name: "计算机考试",
    description: "旧版大学计算机考试兼容入口",
    level: 2,
    sortOrder: 930,
    enabled: true,
  },
  {
    id: "domain-university-review",
    parentId: "stage-university",
    name: "复习资料",
    description: "旧版大学复习资料兼容入口",
    level: 2,
    sortOrder: 940,
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
    if (!Number.isInteger(category.level) || category.level < 1) {
      issues.push({
        code: "invalid-level",
        categoryId: category.id,
        message: `分类层级必须为正整数：${category.id}`,
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
      !Number.isInteger(current.level) ||
      current.level < 1
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
