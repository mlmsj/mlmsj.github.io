import { useEffect, useMemo, useState, type FormEvent } from "react";
import { locationPathForAppPath } from "./routing";
import {
  getHighSchoolCourse,
  HIGH_SCHOOL_COURSE_INDEX,
  HIGH_SCHOOL_GRADES,
  HIGH_SCHOOL_INDEX_META,
  HIGH_SCHOOL_SUBJECTS,
  type HighSchoolGrade,
  type HighSchoolSubject,
} from "./highSchoolCourseIndex";
import {
  getHighSchoolTeachers,
  HIGH_SCHOOL_TEACHER_COUNT,
} from "./highSchoolTeacherIndex";
import { searchHighSchoolIndex } from "./highSchoolSearch";

const isHighSchoolGrade = (value: string | null): value is HighSchoolGrade =>
  value !== null && (HIGH_SCHOOL_GRADES as readonly string[]).includes(value);

const isHighSchoolSubject = (value: string | null): value is HighSchoolSubject =>
  value !== null && (HIGH_SCHOOL_SUBJECTS as readonly string[]).includes(value);

const readSelection = () => {
  const params = new URLSearchParams(window.location.search);
  const grade = isHighSchoolGrade(params.get("grade"))
    ? params.get("grade") as HighSchoolGrade
    : HIGH_SCHOOL_GRADES[0];
  const subject = isHighSchoolSubject(params.get("subject"))
    ? params.get("subject") as HighSchoolSubject
    : HIGH_SCHOOL_SUBJECTS[0];
  return { grade, subject };
};

const readSearchQuery = () => new URLSearchParams(window.location.search).get("q") ?? "";

export function HighSchoolCoursesPage({
  onSearch,
}: {
  onSearch: (query: string) => void;
}) {
  const [selection, setSelection] = useState(readSelection);
  const [query, setQuery] = useState(readSearchQuery);

  const selectedCourse = getHighSchoolCourse(selection.grade, selection.subject);
  const searchMatches = useMemo(
    () => searchHighSchoolIndex(query),
    [query],
  );
  const allSelectedTeachers = useMemo(
    () => getHighSchoolTeachers(selection.grade, selection.subject),
    [selection.grade, selection.subject],
  );
  const selectedTeachers = useMemo(() => {
    if (!query.trim()) return allSelectedTeachers;
    const teacherMatches = new Set([
      ...searchMatches.teacherMatches.map((teacher) => teacher.teacherKey),
      ...searchMatches.resourceTeacherMatches.map((teacher) => teacher.teacherKey),
    ]);
    const courseMatches = new Set([
      ...searchMatches.courseMatches.map((course) => course.courseId),
    ]);
    const resourceCourseMatches = new Set(
      searchMatches.resourceMatches.map((resource) => resource.parentCourseId),
    );
    const resourceTeacherCourseMatches = new Set(
      searchMatches.resourceTeacherMatches.map((teacher) => teacher.courseId),
    );
    return allSelectedTeachers.filter(
      (teacher) =>
        teacherMatches.has(teacher.teacherKey) ||
        courseMatches.has(teacher.courseId) ||
        (resourceCourseMatches.has(teacher.courseId) &&
          !resourceTeacherCourseMatches.has(teacher.courseId)),
    );
  }, [allSelectedTeachers, query, searchMatches]);

  useEffect(() => {
    const onPopState = () => {
      setSelection(readSelection());
      setQuery(readSearchQuery());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const selectCourse = (
    grade: HighSchoolGrade,
    subject: HighSchoolSubject,
    preserveQuery = false,
  ) => {
    const params = new URLSearchParams({ grade, subject });
    if (preserveQuery && query.trim()) params.set("q", query.trim());
    const nextLocation = locationPathForAppPath(
      `${HIGH_SCHOOL_INDEX_META.canonicalRoute}?${params.toString()}`,
    );
    window.history.pushState({}, "", nextLocation);
    setSelection({ grade, subject });
    if (!preserveQuery) setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    const currentTeacherMatch = searchMatches.teacherMatches.find((teacher) =>
      teacher.grade === selection.grade && teacher.subject === selection.subject,
    );
    const teacherMatch = currentTeacherMatch ?? searchMatches.teacherMatches[0] ??
      searchMatches.resourceTeacherMatches[0];
    if (teacherMatch) {
      selectCourse(teacherMatch.grade, teacherMatch.subject, true);
      return;
    }

    const match = searchMatches.courseMatches[0] ??
      HIGH_SCHOOL_COURSE_INDEX.courses.find((course) =>
        searchMatches.resourceMatches.some((resource) => resource.parentCourseId === course.courseId),
      );
    if (match) {
      selectCourse(match.grade, match.subject, true);
      return;
    }
    onSearch(normalizedQuery);
  };

  return (
    <section className="senior-course-page" data-testid="high-school-courses-page">
      <header className="senior-course-hero">
        <p className="kicker">HIGH SCHOOL · ONLINE COURSES</p>
        <div className="senior-course-heading">
          <div>
            <h1>高中网课</h1>
            <p>2027年课程资料</p>
          </div>
          <span className="senior-course-meta">
            {HIGH_SCHOOL_INDEX_META.formalCourseCount} 个课程入口 · {HIGH_SCHOOL_TEACHER_COUNT} 个教师资料入口
          </span>
        </div>
        <form className="resource-search senior-course-search" onSubmit={submitSearch}>
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="搜索高中课程或资料"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索课程、学科或教师..."
          />
          <button type="submit">搜索</button>
        </form>
      </header>

      <div className="senior-course-content">
        <section aria-labelledby="senior-grade-title">
          <div className="senior-course-section-title">
            <span>01</span>
            <div>
              <p>先选学习阶段</p>
              <h2 id="senior-grade-title">选择年级</h2>
            </div>
          </div>
          <div className="senior-grade-tabs" role="tablist" aria-label="高中年级">
            {HIGH_SCHOOL_GRADES.map((grade) => (
              <button
                key={grade}
                type="button"
                role="tab"
                aria-selected={selection.grade === grade}
                className={selection.grade === grade ? "active" : ""}
                onClick={() => selectCourse(grade, selection.subject)}
              >
                <strong>{grade}</strong>
                <span>9 门学科</span>
              </button>
            ))}
          </div>
        </section>

        <section className="senior-subject-section" aria-labelledby="senior-subject-title">
          <div className="senior-course-section-title">
            <span>02</span>
            <div>
              <p>{selection.grade} · 课程入口</p>
              <h2 id="senior-subject-title">选择学科</h2>
            </div>
          </div>
          <div className="senior-subject-grid">
            {HIGH_SCHOOL_SUBJECTS.map((subject, index) => {
              const course = getHighSchoolCourse(selection.grade, subject);
              const teacherCount = course
                ? getHighSchoolTeachers(selection.grade, subject).length
                : 0;
              return (
                <button
                  key={subject}
                  type="button"
                  className={`senior-subject-card${selection.subject === subject ? " active" : ""}`}
                  aria-pressed={selection.subject === subject}
                  onClick={() => selectCourse(selection.grade, subject)}
                >
                  <span className="senior-subject-index">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{subject}</strong>
                  <small>{teacherCount > 0 ? `${teacherCount} 个教师资料入口` : "暂无已发布教师入口"}</small>
                  <i aria-hidden="true">→</i>
                </button>
              );
            })}
          </div>
        </section>

        <section className="senior-resource-section" aria-labelledby="senior-resource-title">
          <div className="senior-resource-heading">
            <div>
              <p>03 · 资料入口</p>
              <h2 id="senior-resource-title">
                {selectedCourse?.displayTitle ?? `${selection.grade}｜${selection.subject}`}
              </h2>
            </div>
            <span>
              {query.trim() && selectedTeachers.length !== allSelectedTeachers.length
                ? `匹配 ${selectedTeachers.length} / ${allSelectedTeachers.length} 个教师入口`
                : `${allSelectedTeachers.length} 个教师入口`}
            </span>
          </div>
          {selectedTeachers.length > 0 ? (
            <div className="senior-teacher-grid">
              {selectedTeachers.map((teacher) => (
                <a
                  className="senior-teacher-card"
                  href={teacher.shareUrl}
                  key={teacher.teacherKey}
                  rel="noreferrer"
                  target="_blank"
                  aria-label={`${teacher.displayName}，${teacher.grade}${teacher.subject}，打开网盘资料`}
                >
                  <span className="senior-teacher-avatar" aria-hidden="true">
                    {teacher.displayName.slice(0, 1)}
                  </span>
                  <span className="senior-teacher-copy">
                    <span className="senior-teacher-course">{teacher.grade} · {teacher.subject}</span>
                    <strong>{teacher.displayName}</strong>
                    <span className="senior-teacher-action">打开网盘资料 ↗</span>
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="senior-resource-empty" role="status">
              <strong>{query.trim() ? "没有匹配的教师入口" : "当前学科暂无已发布教师入口"}</strong>
              <p>
                {query.trim()
                  ? "可以清空搜索词，或改用其他年级、学科继续查找。"
                  : "候选资料仍处于隔离审核状态，不会出现在公开列表中。"}
              </p>
            </div>
          )}
          <p className="senior-course-note">
            教师名称按夸克网盘原始目录标签展示；同名标签按年级和学科分别保留，不代表教师身份核验。教师入口来自已创建的公开分享链接，未审核候选资源不会出现在公开列表中。
          </p>
        </section>
      </div>
    </section>
  );
}
