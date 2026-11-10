import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  categories,
  getCategoryPath,
  SKILL_GROWTH_ROOT_IDS,
  type Category,
} from "./categories";
import {
  getPublishedResourceCount,
  getPublishedResourcesForCategory,
  isPublishedPublicResource,
} from "./categoryCounts";
import {
  getResourceAccessLabel,
  type PublicCatalogPhase,
} from "./publicCatalog";
import { categoryPathBrowseLocation, resourceFilterLocation } from "./categoryRouting";
import { parseResourceFilterState } from "./resourceFiltering";
import {
  getResourceMetadataLabel,
  matchesResourceQuery,
  sortResourcesByUpdatedAt,
  type Resource,
} from "./resources";
import { locationPathForAppPath } from "./routing";

const PAGE_SIZE = 20;
const RESOURCE_STAGE_IDS = [
  "stage-junior",
  "stage-senior",
  "stage-university",
  "purpose-certification",
] as const;

const shouldShowResults = (search: string) => {
  const params = new URLSearchParams(search);
  return params.has("q") || params.has("category") || params.get("view") === "all";
};

const navigateWithinApp = (location: string) => {
  window.history.pushState({}, "", location);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

const handleLinkClick = (
  event: MouseEvent<HTMLAnchorElement>,
  location: string,
) => {
  if (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  ) {
    event.preventDefault();
    navigateWithinApp(location);
  }
};

export function ResourcesPage({
  detail,
  categoryValues = categories,
  resourceValues = [],
  catalogPhase = "ready",
  catalogStatus = "",
  favoriteIds = [],
  onToggleFavorite,
}: {
  detail: (resource: Resource) => void;
  categoryValues?: readonly Category[];
  resourceValues?: readonly Resource[];
  catalogPhase?: PublicCatalogPhase;
  catalogStatus?: string;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}) {
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get("q") ?? "",
  );
  const [searchTerm, setSearchTerm] = useState(query);
  const [page, setPage] = useState(1);
  const [showResults, setShowResults] = useState(() =>
    shouldShowResults(window.location.search),
  );
  const [filterState, setFilterState] = useState(() =>
    parseResourceFilterState(window.location.search, categoryValues),
  );

  const syncFromLocation = useCallback(() => {
    setFilterState(parseResourceFilterState(window.location.search, categoryValues));
    const params = new URLSearchParams(window.location.search);
    const nextQuery = params.get("q") ?? "";
    setQuery(nextQuery);
    setSearchTerm(nextQuery);
    setPage(1);
    setShowResults(shouldShowResults(window.location.search));
  }, [categoryValues]);

  useEffect(() => {
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [syncFromLocation]);

  const clearFilter = () => {
    navigateWithinApp(locationPathForAppPath("/resources"));
  };

  const showAllResources = () => {
    navigateWithinApp(locationPathForAppPath("/resources?view=all"));
  };

  const submitSearch = () => {
    const params = new URLSearchParams(window.location.search);
    const value = query.trim();
    if (value) params.set("q", value);
    else params.delete("q");
    const suffix = params.toString() ? `?${params.toString()}` : "";
    navigateWithinApp(locationPathForAppPath(`/resources${suffix}`));
  };

  const publicValues = useMemo(
    () =>
      sortResourcesByUpdatedAt(
        resourceValues.filter((resource) =>
          isPublishedPublicResource(resource, categoryValues),
        ),
      ),
    [categoryValues, resourceValues],
  );

  const stageCategories = useMemo(
    () =>
      RESOURCE_STAGE_IDS.map((id) =>
        categoryValues.find((category) => category.id === id),
      ).filter((category): category is Category => Boolean(category)),
    [categoryValues],
  );

  const topicCategories = useMemo(
    () =>
      SKILL_GROWTH_ROOT_IDS.map((id) =>
        categoryValues.find((category) => category.id === id),
      ).filter((category): category is Category => Boolean(category)),
    [categoryValues],
  );

  const categoryValuesForSearch = useMemo(
    () =>
      filterState.category
        ? getPublishedResourcesForCategory(
            filterState.category.id,
            categoryValues,
            publicValues,
          )
        : filterState.hasCategoryParameter
          ? []
          : publicValues,
    [
      categoryValues,
      filterState.category,
      filterState.hasCategoryParameter,
      publicValues,
    ],
  );

  const filteredResources = useMemo(
    () =>
      categoryValuesForSearch.filter((resource) =>
        matchesResourceQuery(resource, searchTerm),
      ),
    [categoryValuesForSearch, searchTerm],
  );

  const total = filteredResources.length;
  const visibleResources = filteredResources.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const categoryPath = filterState.category
    ? getCategoryPath(filterState.category.id, categoryValues)
    : [];
  const hasDirectFilter =
    filterState.hasCategoryParameter || searchTerm.trim().length > 0;
  const showBrowseOverview = !hasDirectFilter;
  const showCatalogStatus = catalogPhase !== "ready";
  const emptyTitle = filterState.category
    ? "该分类暂无公开资料"
    : searchTerm.trim()
      ? "没有匹配的公开资料"
      : "暂无正式发布资料";
  const emptyDescription = filterState.category
    ? "当前分类没有已发布且公开可访问的资料。"
    : searchTerm.trim()
      ? "可以更换关键词，或清除筛选后重新浏览。"
      : "当前公开清单尚无正式发布记录，不代表网盘内没有资料。";

  const topicLocation = (category: Category) =>
    category.id === "skill-ai-digital-tech"
      ? locationPathForAppPath("/skill-growth")
      : categoryPathBrowseLocation([category.id], categoryValues);

  return (
    <section className="page-section resource-page">
      <div className="resource-page-head">
        <p className="kicker">LIBRARY</p>
        <h1>资料查找</h1>
        <p className="page-lead">先按学习阶段或主题浏览，也可以直接搜索公开资料。</p>
      </div>

      <div className="resource-search" aria-label="关键词搜索">
        <span aria-hidden="true">⌕</span>
        <input
          placeholder="搜索你需要的学习资料..."
          aria-label="关键词"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submitSearch();
          }}
        />
        <button type="button" onClick={submitSearch}>搜索</button>
      </div>

      {filterState.issues.length > 0 && (
        <div className="resource-filter-notice" role="status">
          分类链接无效或已停用，未展示任何筛选结果。
          <button type="button" onClick={clearFilter}>清除筛选</button>
        </div>
      )}

      {showBrowseOverview && (
        <div className="resource-overview">
          <section className="resource-overview-section" aria-labelledby="resource-stages-title">
            <div className="resource-section-heading">
              <div>
                <p className="kicker">BROWSE BY STAGE</p>
                <h2 id="resource-stages-title">按学习阶段浏览</h2>
              </div>
              <p>从熟悉的学习阶段开始</p>
            </div>
            <div className="resource-stage-grid">
              {stageCategories.map((category, index) => {
                const location = resourceFilterLocation(category.id, categoryValues);
                if (!location) return null;
                const count = getPublishedResourceCount(
                  category.id,
                  categoryValues,
                  publicValues,
                );
                return (
                  <a
                    className="resource-stage-card"
                    href={location}
                    key={category.id}
                    onClick={(event) => handleLinkClick(event, location)}
                  >
                    <span className="resource-card-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="resource-card-copy">
                      <strong>{category.name}</strong>
                      <small>{count} 份公开资料</small>
                    </span>
                    <span className="resource-card-arrow" aria-hidden="true">→</span>
                  </a>
                );
              })}
            </div>
          </section>

          <section className="resource-overview-section resource-topic-section" aria-labelledby="resource-topics-title">
            <div className="resource-section-heading">
              <div>
                <p className="kicker">RECOMMENDED TOPICS</p>
                <h2 id="resource-topics-title">推荐主题</h2>
              </div>
              <p>技能成长专区与主题分类</p>
            </div>
            <div className="resource-topic-grid">
              {topicCategories.map((category) => {
                const location = topicLocation(category);
                const isFeatured = category.id === "skill-ai-digital-tech";
                const count = getPublishedResourceCount(
                  category.id,
                  categoryValues,
                  publicValues,
                );
                return (
                  <a
                    className={`resource-topic-card ${isFeatured ? "is-featured" : ""}`}
                    href={location}
                    key={category.id}
                    onClick={(event) => handleLinkClick(event, location)}
                  >
                    <span className="resource-topic-badge">{isFeatured ? "重点推荐" : "技能主题"}</span>
                    <strong>{category.name}</strong>
                    <span className="resource-topic-description">{category.description}</span>
                    <small>{count} 份公开资料　↗</small>
                  </a>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <section
        className={`resource-all-section ${showResults ? "is-open" : "is-gated"}`}
        aria-labelledby="resource-all-title"
      >
        <div className="resource-all-section-head">
          <div>
            <p className="kicker">PUBLIC RESOURCES</p>
            <h2 id="resource-all-title">全部公开资料</h2>
          </div>
          <span>
            {showResults
              ? !filterState.category && !searchTerm.trim() && catalogPhase === "ready"
                ? `共 ${total} 条`
                : ""
              : `${publicValues.length} 条公开资料`}
          </span>
        </div>

        {!showResults ? (
          <div className="resource-all-gate">
            <p>分类与推荐入口已优先整理；打开完整清单后，可以继续搜索、筛选、收藏和分页浏览。</p>
            <button type="button" onClick={showAllResources}>查看全部公开资料　→</button>
          </div>
        ) : (
          <div className="resource-results">
            {filterState.category ? (
              <div className="filter-row resource-filter-summary">
                <span>当前分类：{categoryPath.map(({ name }) => name).join(" / ")}</span>
                <button type="button" onClick={clearFilter}>清除筛选</button>
              </div>
            ) : null}

            <div className="resource-results-head">
              <div>
                <p className="kicker">{searchTerm.trim() || filterState.category ? "SEARCH RESULTS" : "COLLECTION"}</p>
                <h3>
                  {searchTerm.trim()
                    ? `搜索结果：${searchTerm.trim()}（${total}）`
                    : filterState.category
                      ? `${categoryPath.at(-1)?.name ?? "当前分类"}（${total}）`
                      : "全部资料"}
                </h3>
              </div>
            </div>

            {showCatalogStatus && (
              <p className="resource-status" role={catalogPhase === "error" ? "alert" : "status"}>
                {catalogStatus || (catalogPhase === "loading" ? "正在加载公开资料清单…" : "公开资料清单暂不可用，请重试。")}
              </p>
            )}

            {catalogPhase === "ready" && visibleResources.length > 0 ? (
              <div className="resource-list">
                {visibleResources.map((resource, index) => {
                  const accessLabel = getResourceAccessLabel(resource);
                  const metadataLabel = getResourceMetadataLabel(resource);
                  return (
                    <article className="resource-item-shell" key={resource.id}>
                      <button className="resource-item" onClick={() => detail(resource)}>
                        <b>{String((page - 1) * PAGE_SIZE + index + 1).padStart(2, "0")}</b>
                        <span className="resource-item-copy">
                          <span className="resource-item-labels">
                            <small>{resource.tag}</small>
                            {accessLabel && <small className={`resource-access-status resource-access-status-${resource.delivery?.accessStatus}`}>{accessLabel}</small>}
                          </span>
                          <span className="resource-item-title-row">
                            <strong>{resource.title}</strong>
                            {metadataLabel && (
                              <small className="resource-metadata" aria-label={`文件信息：${metadataLabel}`}>
                                {metadataLabel}
                              </small>
                            )}
                          </span>
                          <em>{resource.description}</em>
                        </span>
                        <time className="resource-item-time">{resource.meta}　→</time>
                      </button>
                      {onToggleFavorite && (
                        <button
                          className="resource-favorite-button"
                          aria-label={`${favoriteIds.includes(resource.id) ? "取消收藏" : "收藏"}：${resource.title}`}
                          aria-pressed={favoriteIds.includes(resource.id)}
                          onClick={() => onToggleFavorite(resource.id)}
                        >
                          {favoriteIds.includes(resource.id) ? "★" : "☆"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : catalogPhase === "ready" ? (
              <div className="resource-empty" role="status">
                <strong>{emptyTitle}</strong>
                <p>{emptyDescription}</p>
                {(filterState.category || searchTerm.trim()) && (
                  <button type="button" onClick={clearFilter}>清除筛选</button>
                )}
              </div>
            ) : null}

            {catalogPhase === "ready" && total > 0 && (
              <nav className="resource-pagination" aria-label="公开资料分页">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
                <span>第 {page} 页 · 共 {total} 条</span>
                <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>下一页</button>
              </nav>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
