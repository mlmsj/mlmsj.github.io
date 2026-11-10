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

/**
 * Skill-growth categories are kept in the same three-level Category model as
 * the existing catalog, but are opened through their own product entry point.
 * The roots are intentionally separate from the four established catalog
 * roots so existing navigation and resource category IDs remain unchanged.
 */
export const SKILL_GROWTH_ROOT_IDS = [
  "skill-ai-digital-tech",
  "skill-digital-creation-media",
  "skill-life-interests",
] as const;

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
  {
    id: "skill-ai-digital-tech",
    parentId: null,
    name: "AI 与数字科技",
    description: "AI 认知、编程与数字技能学习资料",
    level: 1,
    sortOrder: 50,
    enabled: true,
  },
  {
    id: "skill-ai-knowledge",
    parentId: "skill-ai-digital-tech",
    name: "AI 与人工智能",
    description: "AI 学习、认知与常用工具教程",
    level: 2,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "skill-ai-learning-cognition",
    parentId: "skill-ai-knowledge",
    name: "AI 学习与认知",
    description: "AI 基础认知、学习方法与应用思路",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "skill-ai-chatgpt",
    parentId: "skill-ai-knowledge",
    name: "ChatGPT 教程",
    description: "ChatGPT 使用与学习教程",
    level: 3,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "skill-ai-deepseek",
    parentId: "skill-ai-knowledge",
    name: "DeepSeek 教程",
    description: "DeepSeek 使用与学习教程",
    level: 3,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "skill-coding-development",
    parentId: "skill-ai-digital-tech",
    name: "编程与开发",
    description: "少儿编程、语言学习与软硬件实践",
    level: 2,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "skill-scratch-kids",
    parentId: "skill-coding-development",
    name: "Scratch 与少儿编程",
    description: "Scratch 与少儿编程入门资料",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "skill-python",
    parentId: "skill-coding-development",
    name: "Python 编程",
    description: "Python 编程学习资料",
    level: 3,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "skill-cpp",
    parentId: "skill-coding-development",
    name: "C++ 编程",
    description: "C++ 编程学习资料",
    level: 3,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "skill-robotics-hardware",
    parentId: "skill-coding-development",
    name: "机器人与硬件编程",
    description: "机器人、硬件与编程实践资料",
    level: 3,
    sortOrder: 40,
    enabled: true,
  },
  {
    id: "skill-coding-extension",
    parentId: "skill-coding-development",
    name: "拓展与综合实践",
    description: "编程拓展与综合实践资料",
    level: 3,
    sortOrder: 50,
    enabled: true,
  },
  {
    id: "skill-digital-creation-media",
    parentId: null,
    name: "数字创作与自媒体",
    description: "平面设计、视频创作与自媒体运营资料",
    level: 1,
    sortOrder: 60,
    enabled: true,
  },
  {
    id: "skill-photoshop-design",
    parentId: "skill-digital-creation-media",
    name: "Photoshop 与平面设计",
    description: "Photoshop 课程与平面设计资料",
    level: 2,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "skill-ps-video-courses",
    parentId: "skill-photoshop-design",
    name: "PS 视频课件",
    description: "Photoshop 视频与课件资料",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "skill-ps-online-courses",
    parentId: "skill-photoshop-design",
    name: "PS 网课",
    description: "Photoshop 网课资料",
    level: 3,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "skill-video-editing",
    parentId: "skill-digital-creation-media",
    name: "视频剪辑",
    description: "剪辑系统、软件教程与创作素材",
    level: 2,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "skill-editing-system",
    parentId: "skill-video-editing",
    name: "剪辑系统教程",
    description: "剪辑思维、流程与综合课程",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "skill-jianying",
    parentId: "skill-video-editing",
    name: "剪映",
    description: "剪映软件与手机剪辑教程",
    level: 3,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "skill-premiere",
    parentId: "skill-video-editing",
    name: "Premiere（PR）剪辑",
    description: "Premiere 与 PR 剪辑教程",
    level: 3,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "skill-video-assets",
    parentId: "skill-video-editing",
    name: "视频素材",
    description: "视频创作素材与辅助资源",
    level: 3,
    sortOrder: 40,
    enabled: true,
  },
  {
    id: "skill-music-sfx",
    parentId: "skill-video-editing",
    name: "配乐与音效",
    description: "视频配乐、音效与声音素材",
    level: 3,
    sortOrder: 50,
    enabled: true,
  },
  {
    id: "skill-social-media",
    parentId: "skill-digital-creation-media",
    name: "自媒体运营",
    description: "短视频、公众号与小红书运营资料",
    level: 2,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "skill-short-video-ops",
    parentId: "skill-social-media",
    name: "短视频运营",
    description: "短视频运营、账号增长与变现资料",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "skill-wechat-official-ops",
    parentId: "skill-social-media",
    name: "公众号运营",
    description: "公众号运营资料",
    level: 3,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "skill-xiaohongshu-ops",
    parentId: "skill-social-media",
    name: "小红书运营",
    description: "小红书运营资料",
    level: 3,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "skill-life-interests",
    parentId: null,
    name: "生活技能与兴趣",
    description: "驾考、生活攻略与书法艺术资料",
    level: 1,
    sortOrder: 70,
    enabled: true,
  },
  {
    id: "skill-driving",
    parentId: "skill-life-interests",
    name: "驾驶与驾考",
    description: "驾考科目、题库与综合练习资料",
    level: 2,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "skill-driving-subject-1",
    parentId: "skill-driving",
    name: "科目一",
    description: "科目一学习与练习资料",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "skill-driving-subject-2",
    parentId: "skill-driving",
    name: "科目二",
    description: "科目二学习与练习资料",
    level: 3,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "skill-driving-subject-3",
    parentId: "skill-driving",
    name: "科目三",
    description: "科目三学习与练习资料",
    level: 3,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "skill-driving-subject-4",
    parentId: "skill-driving",
    name: "科目四",
    description: "科目四学习与练习资料",
    level: 3,
    sortOrder: 40,
    enabled: true,
  },
  {
    id: "skill-driving-question-bank",
    parentId: "skill-driving",
    name: "题库与综合练习",
    description: "驾考题库与综合练习资料",
    level: 3,
    sortOrder: 50,
    enabled: true,
  },
  {
    id: "skill-life-guides",
    parentId: "skill-life-interests",
    name: "生活实用攻略",
    description: "抢票、出行工具与生活实用攻略",
    level: 2,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "skill-travel-ticketing",
    parentId: "skill-life-guides",
    name: "抢票与出行工具",
    description: "抢票、浏览器与出行工具使用资料",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "skill-calligraphy-art",
    parentId: "skill-life-interests",
    name: "书法与艺术",
    description: "书法课程、碑帖临摹与艺术资料",
    level: 2,
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "skill-calligraphy-online",
    parentId: "skill-calligraphy-art",
    name: "书法网课",
    description: "书法网课与系统学习资料",
    level: 3,
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "skill-calligraphy-rubbings",
    parentId: "skill-calligraphy-art",
    name: "碑帖临摹",
    description: "碑帖、字帖与临摹资料",
    level: 3,
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "skill-calligraphy-mixed",
    parentId: "skill-calligraphy-art",
    name: "混合资料待整理",
    description: "待人工拆分判断的书法与艺术混合资料",
    level: 3,
    sortOrder: 30,
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
