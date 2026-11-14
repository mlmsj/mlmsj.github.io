import { describe, expect, it } from "vitest";

import {
  getHighSchoolCoursesByGrade,
  getPublishedResourcesForCourse,
  HIGH_SCHOOL_COURSE_INDEX,
  HIGH_SCHOOL_GRADES,
  HIGH_SCHOOL_INDEX_META,
  HIGH_SCHOOL_SUBJECTS,
  isPublicHighSchoolResource,
} from "./highSchoolCourseIndex";

describe("高中课程统一索引迁移", () => {
  it("保留 27 个唯一的 packageYear + grade + subject 核心键", () => {
    const coreKeys = HIGH_SCHOOL_COURSE_INDEX.courses.map(
      (course) => `${course.packageYear}|${course.grade}|${course.subject}`,
    );

    expect(coreKeys).toHaveLength(27);
    expect(new Set(coreKeys).size).toBe(27);
    expect(new Set(HIGH_SCHOOL_COURSE_INDEX.courses.map((course) => course.courseId)).size).toBe(27);
    expect(HIGH_SCHOOL_COURSE_INDEX.courses.every((course) => course.entityId === course.courseId)).toBe(true);
    expect(new Set(HIGH_SCHOOL_COURSE_INDEX.courses.map((course) => course.registryKey)).size).toBe(27);
  });

  it("三个年级各有九门指定学科，教师只保留为辅助 metadata", () => {
    for (const grade of HIGH_SCHOOL_GRADES) {
      const courses = getHighSchoolCoursesByGrade(grade);
      expect(courses).toHaveLength(9);
      expect(new Set(courses.map((course) => course.subject))).toEqual(new Set(HIGH_SCHOOL_SUBJECTS));
      expect(courses.every((course) => course.teacherMetadataStatus === "candidate_metadata_only")).toBe(true);
    }
  });

  it("保留正式分类、来源映射和历史 metadata", () => {
    expect(HIGH_SCHOOL_INDEX_META.formalCategoryId).toBe("domain-senior-courses");
    expect(HIGH_SCHOOL_INDEX_META.sourceBatches).toEqual([
      "PHASE-04-C1-HIGH1",
      "PHASE-04-C1-R2",
      "PHASE-04-C2-HIGH2",
      "PHASE-04-C2-R1",
      "PHASE-04-C3-HIGH3",
    ]);
    expect(HIGH_SCHOOL_COURSE_INDEX.courses.every((course) =>
      course.categoryId === HIGH_SCHOOL_INDEX_META.formalCategoryId &&
      course.sourcePath.length > 0 &&
      course.sourcePathMapping.mappingId.length > 0 &&
      course.sourcePathMapping.currentSourcePath === course.sourcePath,
    )).toBe(true);
    expect(HIGH_SCHOOL_COURSE_INDEX.formalResources.some((resource) =>
      resource.contentYear !== null || resource.rawYearToken !== null,
    )).toBe(true);
  });

  it("只投影 15 个已审核资源，候选数量保持隔离", () => {
    const resources = HIGH_SCHOOL_COURSE_INDEX.formalResources;

    expect(resources).toHaveLength(15);
    expect(HIGH_SCHOOL_INDEX_META.formalResourceCount).toBe(15);
    expect(HIGH_SCHOOL_INDEX_META.isolatedCandidateResourceCount).toBe(15231);
    expect(new Set(resources.map((resource) => resource.resourceId)).size).toBe(15);
    expect(resources.every((resource) => resource.entityId === resource.resourceId)).toBe(true);
    expect(new Set(resources.map((resource) => resource.registryKey)).size).toBe(15);
    expect(resources.every(isPublicHighSchoolResource)).toBe(true);
    expect(resources.every((resource) => getPublishedResourcesForCourse(resource.parentCourseId).some(
      (published) => published.resourceId === resource.resourceId,
    ))).toBe(true);

    const candidateLike = {
      ...resources[0],
      reviewStatus: "NEEDS_REVIEW",
      publicationStatus: "candidate",
    } as unknown as typeof resources[number];
    expect(isPublicHighSchoolResource(candidateLike)).toBe(false);
  });
});
