import { useEffect, useMemo, useState, type FormEvent } from "react";
import { locationPathForAppPath } from "./routing";
import {
  POSTGRADUATE_COURSES_BY_SUBJECT,
  POSTGRADUATE_INDEX_META,
  POSTGRADUATE_SUBJECT_META,
  POSTGRADUATE_SUBJECTS,
  postgraduateCourseDisplayName,
  searchPostgraduateCourses,
  type PostgraduateSubject,
} from "./postgraduateCourseIndex";

const isPostgraduateSubject = (value: string | null): value is PostgraduateSubject =>
  value !== null && (POSTGRADUATE_SUBJECTS as readonly string[]).includes(value);

const readSelection = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    subject: isPostgraduateSubject(params.get("subject")) ? params.get("subject") : "英语",
    query: params.get("q") ?? "",
  } as { subject: PostgraduateSubject; query: string };
};

export function PostgraduateCoursesPage() {
  const initial = readSelection();
  const [subject, setSubject] = useState<PostgraduateSubject>(initial.subject);
  const [query, setQuery] = useState(initial.query);

  useEffect(() => {
    const onPopState = () => {
      const next = readSelection();
      setSubject(next.subject);
      setQuery(next.query);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const visibleCourses = useMemo(
    () => searchPostgraduateCourses(POSTGRADUATE_COURSES_BY_SUBJECT[subject], query),
    [query, subject],
  );

  const selectSubject = (next: PostgraduateSubject) => {
    const params = new URLSearchParams({ subject: next });
    const nextLocation = locationPathForAppPath(`${POSTGRADUATE_INDEX_META.canonicalRoute}?${params.toString()}`);
    window.history.pushState({}, "", nextLocation);
    setSubject(next);
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim();
    const params = new URLSearchParams({ subject });
    if (nextQuery) params.set("q", nextQuery);
    const nextLocation = locationPathForAppPath(`${POSTGRADUATE_INDEX_META.canonicalRoute}?${params.toString()}`);
    window.history.pushState({}, "", nextLocation);
    setQuery(nextQuery);
  };

  const subjectMeta = POSTGRADUATE_SUBJECT_META[subject];

  return (
    <section className="postgraduate-course-page" data-testid="postgraduate-courses-page">
      <header className="postgraduate-course-hero">
        <p className="kicker">POSTGRADUATE · ONLINE COURSES</p>
        <div className="postgraduate-course-heading">
          <div>
            <h1>考研网课</h1>
            <p>按科目进入老师与机构目录</p>
          </div>
          <span className="postgraduate-course-meta">
            {POSTGRADUATE_SUBJECT_META[subject].publishedCount} 个已整理入口 · {POSTGRADUATE_SUBJECT_META[subject].publishedItemCount} 个内容目录
          </span>
        </div>
        <form className="resource-search postgraduate-course-search" onSubmit={submitSearch}>
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="搜索考研网课老师或机构"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索老师、机构或课程关键词..."
          />
          <button type="submit">搜索</button>
        </form>
      </header>

      <div className="postgraduate-course-content">
        <section aria-labelledby="postgraduate-subject-title">
          <div className="postgraduate-section-title">
            <span>01</span>
            <div>
              <p>先选考试科目</p>
              <h2 id="postgraduate-subject-title">选择科目</h2>
            </div>
          </div>
          <div className="postgraduate-subject-tabs" role="tablist" aria-label="考研科目">
            {POSTGRADUATE_SUBJECTS.map((item) => {
              const itemMeta = POSTGRADUATE_SUBJECT_META[item];
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={subject === item}
                  className={subject === item ? "active" : ""}
                  onClick={() => selectSubject(item)}
                >
                  <strong>{item}</strong>
                  <span>{itemMeta.publishedCount > 0 ? `${itemMeta.publishedCount} 个已整理入口` : `${itemMeta.directoryCount} 个待整理目录`}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="postgraduate-resource-section" aria-labelledby="postgraduate-resource-title">
          <div className="postgraduate-resource-heading">
            <div>
              <p>02 · 网课子目录</p>
              <h2 id="postgraduate-resource-title">考研{subject}</h2>
            </div>
            <span>{subjectMeta.publishedCount > 0 ? `${visibleCourses.length} 个匹配入口` : `${subjectMeta.directoryCount} 个网盘下级目录`}</span>
          </div>

          {subjectMeta.publishedCount > 0 ? (
            <>
              <div className="postgraduate-course-note" role="status">
                <strong>{subject}目录已整理</strong>
                <span>空目录不创建入口；其余目录按网盘顺序保留，搜索可直接定位老师或机构。</span>
              </div>
              {visibleCourses.length > 0 ? (
                <div className="postgraduate-resource-grid">
                  {visibleCourses.map((course) => (
                    <a
                      className="postgraduate-resource-card"
                      key={course.id}
                      href={course.shareUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="postgraduate-resource-topline">
                        <small>{course.rawTitle.startsWith("00.") ? "资料目录" : "课程目录"}</small>
                        <em>夸克网盘 · 已整理</em>
                      </span>
                      <strong>{postgraduateCourseDisplayName(course)}</strong>
                      <span className="postgraduate-resource-keywords">
                        {(course.keywords ?? [subject, postgraduateCourseDisplayName(course)]).slice(0, 3).map((keyword) => <i key={keyword}>{keyword}</i>)}
                      </span>
                      <span className="postgraduate-resource-bottomline">
                        {course.itemCount} 个内容
                        <i aria-hidden="true">↗</i>
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="postgraduate-resource-empty" role="status">
                  <strong>没有找到匹配的老师或机构</strong>
                  <p>可以试试输入姓名、平台或课程关键词。</p>
                </div>
              )}
            </>
          ) : (
            <div className="postgraduate-resource-empty" role="status">
              <strong>{subject}目录正在整理中</strong>
              <p>网盘中已盘点 {subjectMeta.directoryCount} 个下级目录，完成审核后会沿用英语的同一层级展示方式。</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
