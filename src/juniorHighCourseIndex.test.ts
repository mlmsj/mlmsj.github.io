import { describe, expect, it } from "vitest";
import {
  getJuniorHighSearchTarget,
  getJuniorHighSubjects,
  getJuniorHighTeachers,
  JUNIOR_HIGH_GRADES,
  JUNIOR_HIGH_TEACHERS,
  searchJuniorHighTeachers,
} from "./juniorHighCourseIndex";

describe("junior-high teacher index", () => {
  it("keeps all 31 public teacher entries unique and directly accessible", () => {
    expect(JUNIOR_HIGH_TEACHERS).toHaveLength(31);
    expect(new Set(JUNIOR_HIGH_TEACHERS.map((entry) => entry.id)).size).toBe(31);
    expect(new Set(JUNIOR_HIGH_TEACHERS.map((entry) => entry.shareUrl)).size).toBe(31);
    expect(JUNIOR_HIGH_TEACHERS.every((entry) =>
      entry.provider === "quark" &&
      entry.shareUrl.startsWith("https://pan.quark.cn/s/") &&
      entry.itemCount > 0,
    )).toBe(true);
  });

  it("exposes only the subjects that have teacher entries for each grade", () => {
    expect(JUNIOR_HIGH_GRADES).toEqual(["初一", "初二", "初三"]);
    expect(getJuniorHighSubjects("初一")).toEqual(["语文", "数学", "英语"]);
    expect(getJuniorHighSubjects("初二")).toEqual(["语文", "数学", "英语", "科学"]);
    expect(getJuniorHighSubjects("初三")).toEqual(["语文", "数学", "英语", "物理", "化学", "道法"]);
    expect(getJuniorHighTeachers("初三", "物理").map(({ teacher }) => teacher)).toEqual([
      "刘怡",
      "谭清军",
      "王磊",
    ]);
  });

  it("finds a teacher globally and resolves the matching grade and subject", () => {
    expect(searchJuniorHighTeachers("张笑")).toHaveLength(1);
    expect(getJuniorHighSearchTarget("张笑")).toMatchObject({
      grade: "初三",
      subject: "语文",
    });
    expect(searchJuniorHighTeachers("初一数学").length).toBeGreaterThan(0);
    expect(getJuniorHighSearchTarget("初一数学")).toMatchObject({
      grade: "初一",
      subject: "数学",
    });
    expect(getJuniorHighSearchTarget("不存在的老师")).toBeNull();
  });
});
