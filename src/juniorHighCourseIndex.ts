export const JUNIOR_HIGH_GRADES = ["初一", "初二", "初三"] as const;
export type JuniorHighGrade = typeof JUNIOR_HIGH_GRADES[number];

export const JUNIOR_HIGH_SUBJECTS_BY_GRADE = {
  初一: ["语文", "数学", "英语"],
  初二: ["语文", "数学", "英语", "科学"],
  初三: ["语文", "数学", "英语", "物理", "化学", "道法"],
} as const;

export type JuniorHighSubject =
  typeof JUNIOR_HIGH_SUBJECTS_BY_GRADE[JuniorHighGrade][number];

export type JuniorHighTeacherEntry = {
  id: string;
  grade: JuniorHighGrade;
  subject: JuniorHighSubject;
  teacher: string;
  courseTitle: string;
  itemCount: number;
  provider: "quark";
  shareUrl: string;
};

export const JUNIOR_HIGH_INDEX_META = {
  canonicalRoute: "/junior-high/courses",
  formalCategoryId: "domain-junior-courses",
  teacherCount: 31,
  directoryCount: 10,
  checkedOn: "2026-11-25",
} as const;

export const JUNIOR_HIGH_TEACHERS: readonly JuniorHighTeacherEntry[] = [
  {
    id: "junior-teacher-001",
    grade: "初一",
    subject: "语文",
    teacher: "金鸽",
    courseTitle: "金鸽",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/28d4665772d5",
  },
  {
    id: "junior-teacher-002",
    grade: "初一",
    subject: "语文",
    teacher: "刘璐",
    courseTitle: "刘璐",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/12e4e0ff4a2e",
  },
  {
    id: "junior-teacher-003",
    grade: "初一",
    subject: "数学",
    teacher: "李爽",
    courseTitle: "李爽",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/0265659284fa",
  },
  {
    id: "junior-teacher-004",
    grade: "初一",
    subject: "数学",
    teacher: "张永辉",
    courseTitle: "张永辉",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/29e0223bcf24",
  },
  {
    id: "junior-teacher-005",
    grade: "初一",
    subject: "英语",
    teacher: "陈浩",
    courseTitle: "陈浩",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/64176e51e96b",
  },
  {
    id: "junior-teacher-006",
    grade: "初一",
    subject: "英语",
    teacher: "崔晓凡",
    courseTitle: "崔晓凡",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/9b1dd1136cf5",
  },
  {
    id: "junior-teacher-007",
    grade: "初二",
    subject: "语文",
    teacher: "贾慧芳",
    courseTitle: "贾慧芳",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/ea3356dbd417",
  },
  {
    id: "junior-teacher-008",
    grade: "初二",
    subject: "语文",
    teacher: "吴梦菲",
    courseTitle: "吴梦菲",
    itemCount: 2,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/07a40da69cc5",
  },
  {
    id: "junior-teacher-009",
    grade: "初二",
    subject: "语文",
    teacher: "杨荷",
    courseTitle: "杨荷",
    itemCount: 2,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/d77d72df318d",
  },
  {
    id: "junior-teacher-010",
    grade: "初二",
    subject: "数学",
    teacher: "梁勇",
    courseTitle: "梁勇",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/ea09d1a958d8",
  },
  {
    id: "junior-teacher-011",
    grade: "初二",
    subject: "数学",
    teacher: "王丁玉",
    courseTitle: "王丁玉",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/a5273da18248",
  },
  {
    id: "junior-teacher-012",
    grade: "初二",
    subject: "数学",
    teacher: "王杭州",
    courseTitle: "王杭州",
    itemCount: 2,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/db9a28a356b9",
  },
  {
    id: "junior-teacher-013",
    grade: "初二",
    subject: "数学",
    teacher: "赵岩",
    courseTitle: "赵岩",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/cedf1d30f7e0",
  },
  {
    id: "junior-teacher-014",
    grade: "初二",
    subject: "英语",
    teacher: "林淼",
    courseTitle: "林淼",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/c44625d8e90e",
  },
  {
    id: "junior-teacher-015",
    grade: "初二",
    subject: "英语",
    teacher: "张玮珂",
    courseTitle: "张玮珂",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/3dbe3d07367b",
  },
  {
    id: "junior-teacher-016",
    grade: "初二",
    subject: "科学",
    teacher: "何勇",
    courseTitle: "何勇",
    itemCount: 2,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/78f7b169e695",
  },
  {
    id: "junior-teacher-017",
    grade: "初三",
    subject: "语文",
    teacher: "宋北平",
    courseTitle: "宋北平",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/a1f90e90bef3",
  },
  {
    id: "junior-teacher-018",
    grade: "初三",
    subject: "语文",
    teacher: "张笑",
    courseTitle: "【2025初三秋上】人文创作自主学习TY·A+-张笑",
    itemCount: 3,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/6846b27067d0",
  },
  {
    id: "junior-teacher-019",
    grade: "初三",
    subject: "语文",
    teacher: "周立昕",
    courseTitle: "周立昕",
    itemCount: 2,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/38f8bb8336bc",
  },
  {
    id: "junior-teacher-020",
    grade: "初三",
    subject: "数学",
    teacher: "陈丽",
    courseTitle: "陈丽",
    itemCount: 2,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/9fd4c0cee25e",
  },
  {
    id: "junior-teacher-021",
    grade: "初三",
    subject: "数学",
    teacher: "杜艺波",
    courseTitle: "杜艺波",
    itemCount: 2,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/3de9668529b2",
  },
  {
    id: "junior-teacher-022",
    grade: "初三",
    subject: "数学",
    teacher: "李珊珊",
    courseTitle: "李珊珊",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/4cfdffdf0994",
  },
  {
    id: "junior-teacher-023",
    grade: "初三",
    subject: "英语",
    teacher: "曹雪梅",
    courseTitle: "曹雪梅",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/1481780286f1",
  },
  {
    id: "junior-teacher-024",
    grade: "初三",
    subject: "英语",
    teacher: "林爽",
    courseTitle: "林爽",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/ae6c469a8f68",
  },
  {
    id: "junior-teacher-025",
    grade: "初三",
    subject: "英语",
    teacher: "万雨露",
    courseTitle: "万雨露",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/af0496662a5a",
  },
  {
    id: "junior-teacher-026",
    grade: "初三",
    subject: "物理",
    teacher: "刘怡",
    courseTitle: "刘怡",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/624fdf8ec4e4",
  },
  {
    id: "junior-teacher-027",
    grade: "初三",
    subject: "物理",
    teacher: "谭清军",
    courseTitle: "谭清军",
    itemCount: 2,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/db558afa108b",
  },
  {
    id: "junior-teacher-028",
    grade: "初三",
    subject: "物理",
    teacher: "王磊",
    courseTitle: "王磊",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/16577bb0f02e",
  },
  {
    id: "junior-teacher-029",
    grade: "初三",
    subject: "化学",
    teacher: "陈耀泉",
    courseTitle: "【2025初三秋上】实验科学自主学习·TY·A+（4期）-陈耀泉",
    itemCount: 9,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/75fd03569d18",
  },
  {
    id: "junior-teacher-030",
    grade: "初三",
    subject: "化学",
    teacher: "杨雯智",
    courseTitle: "杨雯智",
    itemCount: 2,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/d8e2cddd8040",
  },
  {
    id: "junior-teacher-031",
    grade: "初三",
    subject: "道法",
    teacher: "林阳",
    courseTitle: "林阳",
    itemCount: 1,
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/997b1a4c9ba9",
  },
];

export const getJuniorHighSubjects = (grade: JuniorHighGrade) =>
  JUNIOR_HIGH_SUBJECTS_BY_GRADE[grade] as readonly JuniorHighSubject[];

export const getJuniorHighTeachers = (
  grade: JuniorHighGrade,
  subject: JuniorHighSubject,
) => JUNIOR_HIGH_TEACHERS.filter(
  (entry) => entry.grade === grade && entry.subject === subject,
);

export const searchJuniorHighTeachers = (query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [...JUNIOR_HIGH_TEACHERS];
  return JUNIOR_HIGH_TEACHERS.filter((entry) =>
    [entry.teacher, entry.courseTitle, entry.grade, entry.subject, "初中网课"]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
};

export type JuniorHighSearchTarget = {
  grade: JuniorHighGrade;
  subject: JuniorHighSubject;
  matches: readonly JuniorHighTeacherEntry[];
};

export const getJuniorHighSearchTarget = (
  query: string,
): JuniorHighSearchTarget | null => {
  const matches = searchJuniorHighTeachers(query);
  if (!query.trim() || matches.length === 0) return null;
  return {
    grade: matches[0].grade,
    subject: matches[0].subject,
    matches,
  };
};
