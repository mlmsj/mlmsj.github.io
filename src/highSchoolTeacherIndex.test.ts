import { describe, expect, it } from "vitest";
import {
  getHighSchoolTeachers,
  HIGH_SCHOOL_TEACHERS,
  isPublicHighSchoolTeacher,
} from "./highSchoolTeacherIndex";

describe("高中网课教师入口索引", () => {
  it("保留178个原始教师目录入口，并按课程键分组", () => {
    expect(HIGH_SCHOOL_TEACHERS).toHaveLength(178);
    expect(new Set(HIGH_SCHOOL_TEACHERS.map((teacher) => teacher.teacherKey)).size).toBe(178);
    expect(new Set(HIGH_SCHOOL_TEACHERS.map((teacher) => teacher.shareUrl)).size).toBe(178);

    for (const teacher of HIGH_SCHOOL_TEACHERS) {
      expect(isPublicHighSchoolTeacher(teacher)).toBe(true);
      expect(teacher.shareUrl).toMatch(/^https:\/\/pan\.quark\.cn\/s\/[A-Za-z0-9]+$/);
      expect(teacher.sourcePath).toContain(teacher.rawDirectoryName);
      expect(teacher.courseSourcePathMapping.currentSourcePath).toContain(teacher.subject);
    }
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
