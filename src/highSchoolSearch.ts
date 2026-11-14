import {
  HIGH_SCHOOL_COURSE_INDEX,
  isPublicHighSchoolResource,
  type HighSchoolCourse,
  type HighSchoolFormalResource,
} from "./highSchoolCourseIndex";
import {
  HIGH_SCHOOL_TEACHERS,
  type HighSchoolTeacher,
} from "./highSchoolTeacherIndex";

export type HighSchoolSearchResult = {
  courseMatches: readonly HighSchoolCourse[];
  teacherMatches: readonly HighSchoolTeacher[];
  resourceMatches: readonly HighSchoolFormalResource[];
  resourceTeacherMatches: readonly HighSchoolTeacher[];
};

export type HighSchoolSearchTarget = Pick<HighSchoolTeacher, "grade" | "subject">;

const normalize = (value: string) =>
  value.trim().toLocaleLowerCase("zh-CN").replace(/\s+/g, " ");

const compact = (value: string) =>
  value.replace(/[\s|｜·/\\_()[\]【】（）《》「」“”‘’.,，。:：;；!?！？-]/g, "");

const matchesText = (query: string, fields: readonly string[]) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return false;
  const text = normalize(fields.join(" "));
  return text.includes(normalizedQuery) || compact(text).includes(compact(normalizedQuery));
};

const courseSearchFields = (course: HighSchoolCourse) => [
  course.displayTitle,
  course.title,
  course.rawTitle,
  course.packageYear,
  course.grade,
  course.subject,
  `高中${course.subject}`,
  `高中${course.grade}${course.subject}`,
  course.sourcePath,
];

const teacherSearchFields = (teacher: HighSchoolTeacher) => [
  teacher.displayName,
  teacher.rawDirectoryName,
  teacher.grade,
  teacher.subject,
  teacher.courseKey,
  teacher.sourcePath,
];

const resourceSearchFields = (resource: HighSchoolFormalResource) => [
  resource.displayName,
  resource.rawName,
  resource.resourceKind,
  resource.contentYear ?? "",
  resource.rawYearToken ?? "",
  resource.sourcePath,
  resource.rawPath,
];

const resourceBelongsToTeacher = (
  resource: HighSchoolFormalResource,
  teacher: HighSchoolTeacher,
) =>
  resource.parentCourseId === teacher.courseId &&
  (resource.sourcePath === teacher.sourcePath ||
    resource.sourcePath.startsWith(`${teacher.sourcePath}/`) ||
    resource.rawPath === teacher.sourcePath ||
    resource.rawPath.startsWith(`${teacher.sourcePath}/`));

export const emptyHighSchoolSearchResult = (): HighSchoolSearchResult => ({
  courseMatches: [],
  teacherMatches: [],
  resourceMatches: [],
  resourceTeacherMatches: [],
});

export const searchHighSchoolIndex = (query: string): HighSchoolSearchResult => {
  if (!normalize(query)) return emptyHighSchoolSearchResult();

  const courseMatches = HIGH_SCHOOL_COURSE_INDEX.courses.filter((course) =>
    matchesText(query, courseSearchFields(course)),
  );
  const teacherMatches = HIGH_SCHOOL_TEACHERS.filter((teacher) =>
    matchesText(query, teacherSearchFields(teacher)),
  );
  const resourceMatches = HIGH_SCHOOL_COURSE_INDEX.formalResources.filter(
    (resource) =>
      isPublicHighSchoolResource(resource) &&
      matchesText(query, resourceSearchFields(resource)),
  );
  const resourceTeacherMatches = HIGH_SCHOOL_TEACHERS.filter((teacher) =>
    resourceMatches.some((resource) => resourceBelongsToTeacher(resource, teacher)),
  );

  return {
    courseMatches,
    teacherMatches,
    resourceMatches,
    resourceTeacherMatches,
  };
};

export const getHighSchoolSearchTarget = (
  query: string,
): HighSchoolSearchTarget | null => {
  const result = searchHighSchoolIndex(query);
  const normalizedQuery = normalize(query);
  const exactTeacherMatch = [
    ...result.teacherMatches,
    ...result.resourceTeacherMatches,
  ].find((teacher) =>
    [teacher.displayName, teacher.rawDirectoryName].some(
      (value) => normalize(value) === normalizedQuery,
    ),
  );
  if (exactTeacherMatch) {
    return { grade: exactTeacherMatch.grade, subject: exactTeacherMatch.subject };
  }

  const courseMatch = result.courseMatches[0];
  if (courseMatch) return { grade: courseMatch.grade, subject: courseMatch.subject };

  const teacherMatch = result.teacherMatches[0] ?? result.resourceTeacherMatches[0];
  if (teacherMatch) return { grade: teacherMatch.grade, subject: teacherMatch.subject };

  const resourceCourse = result.resourceMatches
    .map((resource) => HIGH_SCHOOL_COURSE_INDEX.courses.find(
      (course) => course.courseId === resource.parentCourseId,
    ))
    .find((course): course is HighSchoolCourse => Boolean(course));
  return resourceCourse
    ? { grade: resourceCourse.grade, subject: resourceCourse.subject }
    : null;
};
