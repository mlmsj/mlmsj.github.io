import { describe, expect, it } from "vitest";
import {
  getHighSchoolTeachers,
  HIGH_SCHOOL_TEACHERS,
  isPublicHighSchoolTeacher,
} from "./highSchoolTeacherIndex";

describe("高中网课教师入口索引", () => {
  it("合并夸克和百度教师入口，并保留百度独有教师", () => {
    expect(HIGH_SCHOOL_TEACHERS).toHaveLength(183);
    expect(new Set(HIGH_SCHOOL_TEACHERS.map((teacher) => teacher.teacherKey)).size).toBe(183);
    expect(new Set(HIGH_SCHOOL_TEACHERS.map((teacher) => teacher.shareUrl)).size).toBe(183);

    for (const teacher of HIGH_SCHOOL_TEACHERS) {
      expect(isPublicHighSchoolTeacher(teacher)).toBe(true);
      expect(teacher.deliveries.length).toBeGreaterThan(0);
      expect(teacher.shareUrl).toBe(teacher.deliveries[0]?.shareUrl);
      expect(teacher.sourcePath).toContain(teacher.rawDirectoryName);
      expect(teacher.courseSourcePathMapping.currentSourcePath).toContain(teacher.subject);
    }

    expect(HIGH_SCHOOL_TEACHERS.filter((teacher) => teacher.deliveries.length === 2)).toHaveLength(169);
    expect(HIGH_SCHOOL_TEACHERS.filter((teacher) => teacher.deliveries[0]?.provider === "baidu")).toHaveLength(5);
    expect(HIGH_SCHOOL_TEACHERS.some((teacher) => teacher.displayName === "数心引力")).toBe(true);
    expect(HIGH_SCHOOL_TEACHERS.some((teacher) => teacher.displayName === "KO大魔王")).toBe(true);
  });

  it("三个年级都覆盖九门学科，并保留原始同名标签", () => {
    for (const grade of ["高一", "高二", "高三"] as const) {
      for (const subject of ["语文", "数学", "英语", "物理", "化学", "生物", "政治", "历史", "地理"] as const) {
        expect(getHighSchoolTeachers(grade, subject).length).toBeGreaterThan(0);
      }
    }

    expect(getHighSchoolTeachers("高一", "数学")).toHaveLength(8);
    expect(getHighSchoolTeachers("高三", "语文").some((teacher) => teacher.displayName === "金语文亦珊")).toBe(true);
    expect(getHighSchoolTeachers("高一", "物理").some((teacher) => teacher.displayName === "莫荒年")).toBe(true);
    expect(getHighSchoolTeachers("高三", "物理").some((teacher) => teacher.displayName === "莫慌年")).toBe(true);
  });
});
