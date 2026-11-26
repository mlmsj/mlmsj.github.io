import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getCategoryFolderEntries } from "./categoryFolderPilot";
import {
  getJuniorHighSubjects,
  getJuniorHighTeachers,
  JUNIOR_HIGH_GRADES,
  JUNIOR_HIGH_INDEX_META,
  matchesJuniorHighTeacher,
  searchJuniorHighTeachers,
  type JuniorHighGrade,
  type JuniorHighSubject,
} from "./juniorHighCourseIndex";
import { locationPathForAppPath } from "./routing";

const isJuniorHighGrade = (value: string | null): value is JuniorHighGrade =>
  value !== null && (JUNIOR_HIGH_GRADES as readonly string[]).includes(value);

const isJuniorHighSubject = (
  grade: JuniorHighGrade,
  value: string | null,
): value is JuniorHighSubject =>
  value !== null && (getJuniorHighSubjects(grade) as readonly string[]).includes(value);

const readSelection = () => {
  const params = new URLSearchParams(window.location.search);
  const grade = isJuniorHighGrade(params.get("grade"))
    ? params.get("grade") as JuniorHighGrade
    : JUNIOR_HIGH_GRADES[0];
  const subject = isJuniorHighSubject(grade, params.get("subject"))
    ? params.get("subject") as JuniorHighSubject
    : getJuniorHighSubjects(grade)[0];
  return { grade, subject, query: params.get("q") ?? "" };
};

const cleanDirectoryTitle = (title: string) => title.replace(/^\d+\./, "");

export function JuniorHighCoursesPage() {
  const initial = readSelection();
  const [grade, setGrade] = useState<JuniorHighGrade>(initial.grade);
  const [subject, setSubject] = useState<JuniorHighSubject>(initial.subject);
  const [query, setQuery] = useState(initial.query);

  useEffect(() => {
    const onPopState = () => {
      const next = readSelection();
      setGrade(next.grade);
      setSubject(next.subject);
      setQuery(next.query);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const subjects = getJuniorHighSubjects(grade);
  const allTeachers = useMemo(
    () => getJuniorHighTeachers(grade, subject),
    [grade, subject],
  );
  const visibleTeachers = useMemo(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return allTeachers;
    return allTeachers.filter((entry) =>
      matchesJuniorHighTeacher(entry, normalizedQuery),
    );
  }, [allTeachers, query]);

  const navigateSelection = (
    nextGrade: JuniorHighGrade,
    nextSubject: JuniorHighSubject,
    preserveQuery = false,
  ) => {
    const params = new URLSearchParams({ grade: nextGrade, subject: nextSubject });
    if (preserveQuery && query.trim()) params.set("q", query.trim());
    window.history.pushState(
      {},
      "",
      locationPathForAppPath(`${JUNIOR_HIGH_INDEX_META.canonicalRoute}?${params.toString()}`),
    );
    setGrade(nextGrade);
    setSubject(nextSubject);
    if (!preserveQuery) setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectGrade = (nextGrade: JuniorHighGrade) =>
    navigateSelection(nextGrade, getJuniorHighSubjects(nextGrade)[0]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      const params = new URLSearchParams({ grade, subject });
      window.history.pushState(
        {},
        "",
        locationPathForAppPath(`${JUNIOR_HIGH_INDEX_META.canonicalRoute}?${params.toString()}`),
      );
      setQuery("");
      return;
    }
    const match = searchJuniorHighTeachers(normalizedQuery)[0];
    if (match) {
      navigateSelection(match.grade, match.subject, true);
      return;
    }
    const params = new URLSearchParams({ grade, subject, q: normalizedQuery });
    window.history.pushState(
      {},
      "",
      locationPathForAppPath(`${JUNIOR_HIGH_INDEX_META.canonicalRoute}?${params.toString()}`),
    );
    setQuery(normalizedQuery);
  };

  const organizationDirectories = getCategoryFolderEntries("type-junior-courses-by-org");
  const gradeDirectories = getCategoryFolderEntries("type-junior-courses-by-grade");

  return (
    <section className="postgraduate-course-page junior-high-course-page" data-testid="junior-high-courses-page">
      <header className="postgraduate-course-hero">
        <p className="kicker">JUNIOR HIGH · ONLINE COURSES</p>
        <div className="postgraduate-course-heading">
          <div>
            <h1>初中网课</h1>
            <p>按年级、学科与老师快速查找</p>
          </div>
          <span className="postgraduate-course-meta">
            {JUNIOR_HIGH_INDEX_META.teacherCount} 位老师 · {JUNIOR_HIGH_INDEX_META.directoryCount} 个机构与年级总目录
          </span>
        </div>
        <form className="resource-search postgraduate-course-search" onSubmit={submitSearch}>
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="搜索初中网课老师"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索老师、年级或学科"
          />
          <button type="submit">搜索</button>
        </form>
      </header>

      <div className="postgraduate-course-content">
        <section aria-labelledby="junior-grade-title">
          <div className="postgraduate-section-title">
            <span>01</span>
            <div>
              <p>先选学习阶段</p>
              <h2 id="junior-grade-title">选择年级</h2>
            </div>
          </div>
          <div className="postgraduate-subject-tabs" role="tablist" aria-label="初中年级">
            {JUNIOR_HIGH_GRADES.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={grade === item}
                className={grade === item ? "active" : ""}
                onClick={() => selectGrade(item)}
              >
                <strong>{item}</strong>
                <span>{getJuniorHighSubjects(item).length} 门已整理学科</span>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="junior-subject-title">
          <div className="postgraduate-section-title">
            <span>02</span>
            <div>
              <p>{grade} · 课程入口</p>
              <h2 id="junior-subject-title">选择学科</h2>
            </div>
          </div>
          <div className="postgraduate-subject-tabs" role="tablist" aria-label="初中学科">
            {subjects.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={subject === item}
                className={subject === item ? "active" : ""}
                onClick={() => navigateSelection(grade, item)}
              >
                <strong>{item}</strong>
                <span>{getJuniorHighTeachers(grade, item).length} 位老师</span>
              </button>
            ))}
          </div>
        </section>

        <section className="postgraduate-resource-section" aria-labelledby="junior-resource-title">
          <div className="postgraduate-resource-heading">
            <div>
              <p>03 · 老师直达</p>
              <h2 id="junior-resource-title">{grade}{subject}</h2>
            </div>
            <span>{visibleTeachers.length} 个匹配入口</span>
          </div>
          {visibleTeachers.length > 0 ? (
            <div className="postgraduate-resource-grid">
              {visibleTeachers.map((entry) => (
                <a
                  className="postgraduate-resource-card"
                  key={entry.id}
                  href={entry.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${entry.teacher}，${entry.grade}${entry.subject}，打开夸克网盘资料`}
                >
                  <span className="postgraduate-resource-topline">
                    <small>{entry.grade} · {entry.subject}</small>
                    <em>夸克网盘 · 已整理</em>
                  </span>
                  <strong>{entry.teacher}</strong>
                  <span className="postgraduate-resource-keywords">
                    <i>{entry.grade}</i><i>{entry.subject}</i><i>老师课程</i>
                  </span>
                  <span className="postgraduate-resource-bottomline">
                    {entry.itemCount} 个内容目录
                    <i aria-hidden="true">↗</i>
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="postgraduate-resource-empty" role="status">
              <strong>没有找到匹配的老师</strong>
              <p>可以换一个姓名，或切换年级、学科继续查找。</p>
            </div>
          )}
          <p className="postgraduate-course-note">
            老师名称按网盘原始目录标签整理；同名标签按年级和学科分别保留，不代表教师身份核验。
          </p>
        </section>

        <section className="postgraduate-resource-section" aria-labelledby="junior-directory-title">
          <div className="postgraduate-resource-heading">
            <div>
              <p>04 · 总目录</p>
              <h2 id="junior-directory-title">按机构与年级浏览</h2>
            </div>
            <span>{organizationDirectories.length + gradeDirectories.length} 个入口</span>
          </div>
          <div className="postgraduate-resource-grid">
            {[...organizationDirectories, ...gradeDirectories].map((entry) => (
              <a
                className="postgraduate-resource-card"
                key={entry.id}
                href={entry.shareUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span className="postgraduate-resource-topline">
                  <small>{entry.categoryId.endsWith("by-org") ? "机构目录" : "年级目录"}</small>
                  <em>夸克网盘</em>
                </span>
                <strong>{cleanDirectoryTitle(entry.title)}</strong>
                <span className="postgraduate-resource-bottomline">
                  {entry.itemCount} 个内容目录
                  <i aria-hidden="true">↗</i>
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
