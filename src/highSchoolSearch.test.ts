import { describe, expect, it } from "vitest";
import { searchHighSchoolIndex } from "./highSchoolSearch";

describe("高中网课关键词索引", () => {
  it("搜索已审核正式资源名称并关联到对应教师入口", () => {
    const result = searchHighSchoolIndex("电解池");

    expect(result.resourceMatches.length).toBeGreaterThan(0);
    expect(result.resourceTeacherMatches.some((teacher) =>
      teacher.displayName === "李政" && teacher.grade === "高二" && teacher.subject === "化学",
    )).toBe(true);
  });

  it("搜索正式讲次关键词时不读取隔离候选", () => {
    const result = searchHighSchoolIndex("对数概念初步");

    expect(result.resourceMatches.some((resource) => resource.displayName.includes("对数概念初步"))).toBe(true);
    expect(result.resourceMatches.every((resource) =>
      resource.reviewStatus === "VERIFIED" && resource.publicationStatus === "published",
    )).toBe(true);
  });

  it("继续支持课程、年级、学科和教师关键词", () => {
    expect(searchHighSchoolIndex("高一数学").courseMatches.length).toBeGreaterThan(0);
    expect(searchHighSchoolIndex("王子悦").teacherMatches.length).toBeGreaterThan(0);
    expect(searchHighSchoolIndex("高中英语").courseMatches.length).toBeGreaterThan(0);
  });
});
