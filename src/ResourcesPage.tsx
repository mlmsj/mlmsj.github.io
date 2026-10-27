import { useCallback, useEffect, useMemo, useState } from "react";
import {
  categories,
  getChildCategories,
  getEnabledCategoryPath,
  getCategoryPath,
  type Category,
} from "./categories";
import {
  getPublishedResourcesForCategory,
  isPublishedPublicResource,
} from "./categoryCounts";
import {
  getResourceAccessLabel,
  type PublicCatalogPhase,
} from "./publicCatalog";
import { parseResourceFilterState } from "./resourceFiltering";
import { resourceFilterLocation } from "./categoryRouting";
import {
  getResourceMetadataLabel,
  type Resource,
} from "./resources";
import { locationPathForAppPath } from "./routing";

const PAGE_SIZE = 20;

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
  const [mobileCategoryId, setMobileCategoryId] = useState<string | null>(null);
  const [filterState, setFilterState] = useState(() =>
    parseResourceFilterState(window.location.search, categoryValues),
  );

  const syncFromLocation = useCallback(() => {
    setFilterState(parseResourceFilterState(window.location.search, categoryValues));
    const nextQuery = new URLSearchParams(window.location.search).get("q") ?? "";
    setQuery(nextQuery);
    setSearchTerm(nextQuery);
    setPage(1);
  }, [categoryValues]);

  useEffect(() => {
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [syncFromLocation]);

  const clearFilter = () => {
    window.history.pushState({}, "", locationPathForAppPath("/resources"));
    syncFromLocation();
  };

  const submitSearch = () => {
    const params = new URLSearchParams(window.location.search);
    const value = query.trim();
    if (value) params.set("q", value);
    else params.delete("q");
    const suffix = params.toString() ? `?${params.toString()}` : "";
    window.history.pushState(
      {},
      "",
      locationPathForAppPath(`/resources${suffix}`),
    );
    syncFromLocation();
  };

  const publicValues = useMemo(
    () => resourceValues.filter((resource) =>
      isPublishedPublicResource(resource, categoryValues),
    ),
    [categoryValues, resourceValues],
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
    [categoryValues, filterState.category, filterState.hasCategoryParameter, publicValues],
  );

  const filteredResources = useMemo(() => {
    const normalized = searchTerm.trim().toLocaleLowerCase("zh-CN");
    if (!normalized) return categoryValuesForSearch;
    return categoryValuesForSearch.filter((resource) =>
      [resource.title, resource.description, resource.tag]
        .join(" ")
        .toLocaleLowerCase("zh-CN")
        .includes(normalized),
    );
  }, [categoryValuesForSearch, searchTerm]);

  const total = filteredResources.length;
  const visibleResources = filteredResources.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const categoryPath = filterState.category
    ? getCategoryPath(filterState.category.id, categoryValues)
    : [];
  const rootCategories = getChildCategories(null, categoryValues).filter(
    (category) => getEnabledCategoryPath(category.id, categoryValues).length > 0,
  );
  const mobileCategory = mobileCategoryId
    ? getEnabledCategoryPath(mobileCategoryId, categoryValues).at(-1) ?? null
    : null;
  const mobileChildren = mobileCategory
    ? getChildCategories(mobileCategory.id, categoryValues).filter(
        (category) => getEnabledCategoryPath(category.id, categoryValues).length > 0,
      )
    : rootCategories;
  const showCatalogStatus = catalogPhase !== "ready";
  const emptyTitle = filterState.category
    ? "该分类暂无公开资料"
    : searchTerm.trim()
      ? "没有匹配的公开资料"
      : "暂无正式发布资料";
  const emptyDescription = filterState.category
    ? "当前分类没有已发布且公开可访问的资料。"
    : searchTerm.trim()
      ? "可以更换关键词，或返回查看全部公开资料。"
      : "当前公开清单尚无正式发布记录，不代表网盘内没有资料。";

  const selectResourceCategory = (category: Category) => {
    const location = resourceFilterLocation(category.id, categoryValues);
    if (!location) return;
    window.history.pushState({}, "", location);
    syncFromLocation();
    setMobileCategoryId(null);
  };

  const browseMobileCategory = (category: Category) => {
    const children = getChildCategories(category.id, categoryValues).filter(
      (child) => getEnabledCategoryPath(child.id, categoryValues).length > 0,
    );
    if (children.length > 0) setMobileCategoryId(category.id);
    else selectResourceCategory(category);
  };

  const showAllOnMobile = () => {
    setMobileCategoryId(null);
    clearFilter();
  };

  return (
    <section className="page-section resource-page">
      <div className="resource-page-head">
        <p className="kicker">LIBRARY</p>
        <h1>资料查找</h1>
        <p className="page-lead">按主题探索经过整理的学习资料。</p>
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
          <button type="button" onClick={clearFilter}>查看全部公开资料</button>
        </div>
      )}

      <div className="resource-mobile-directory" aria-label="移动端资料分类">
        <div className="resource-mobile-head">
          {mobileCategory ? (
            <button type="button" onClick={() => setMobileCategoryId(mobileCategory.parentId)}>
              ← 返回上一级
            </button>
          ) : <span>分类</span>}
          <span>{mobileCategory ? `${mobileCategory.name} · 选择下一级` : "选择学习阶段或用途"}</span>
        </div>
        <button
          type="button"
          className={!filterState.category && !filterState.hasCategoryParameter ? "active" : ""}
          onClick={showAllOnMobile}
        >
          全部资料
        </button>
        {mobileCategory && (
          <button type="button" onClick={() => selectResourceCategory(mobileCategory)}>
            查看{mobileCategory.name}全部资料
          </button>
        )}
        {mobileChildren.map((category) => (
          <button
            type="button"
            key={category.id}
            className={filterState.category?.id === category.id ? "active" : ""}
            onClick={() => browseMobileCategory(category)}
          >
            <span>{category.name}</span><i aria-hidden="true">›</i>
          </button>
        ))}
      </div>

      <div className="resource-browser">
        <aside className="resource-directory" aria-label="资料分类目录">
          <p>分类目录</p>
          <button
            className={!filterState.category && !filterState.hasCategoryParameter ? "active" : ""}
            type="button"
            onClick={clearFilter}
          >
            全部资料
          </button>
          {rootCategories.map((root) => (
            <div className="resource-directory-group" key={root.id}>
              <strong>{root.name}</strong>
              <button
                type="button"
                className={filterState.category?.id === root.id ? "active" : ""}
                onClick={() => selectResourceCategory(root)}
              >
                查看{root.name}全部资料
              </button>
              {getChildCategories(root.id, categoryValues).filter(
                (child) => getEnabledCategoryPath(child.id, categoryValues).length > 0,
              ).map((child) => (
                <div key={child.id}>
                  <button
                    type="button"
                    className={filterState.category?.id === child.id ? "active" : ""}
                    onClick={() => selectResourceCategory(child)}
                  >
                    查看{child.name}全部资料
                  </button>
                {getChildCategories(child.id, categoryValues).filter(
                  (leaf) => getEnabledCategoryPath(leaf.id, categoryValues).length > 0,
                ).map((leaf) => (
                  <button
                    className={filterState.category?.id === leaf.id ? "active" : ""}
                    type="button"
                    key={leaf.id}
                    onClick={() => selectResourceCategory(leaf)}
                  >
                    {child.name} / {leaf.name}
                  </button>
                ))}
                </div>
              ))}
            </div>
          ))}
        </aside>

        <div className="resource-results">
          <div className="filter-row resource-filter-summary">
            {filterState.category ? (
              <>
                <span>当前分类：{categoryPath.map(({ name }) => name).join(" / ")}</span>
                <button type="button" onClick={clearFilter}>清除分类筛选</button>
              </>
            ) : !filterState.hasCategoryParameter ? (
              <span className="active">全部公开资料</span>
            ) : null}
          </div>

          <div className="resource-results-head">
            <div>
              <p className="kicker">{filterState.category ? "SEARCH RESULTS" : "COLLECTION"}</p>
              <h2>{filterState.category ? `“${query || "当前分类"}”` : "全部资料"}</h2>
            </div>
            <span>{catalogPhase === "ready" && total ? `共 ${total} 条` : ""}</span>
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
                      <span>
                        <small>{resource.tag}</small>
                        {accessLabel && <small className={`resource-access-status resource-access-status-${resource.delivery?.accessStatus}`}>{accessLabel}</small>}
                        <span className="resource-item-title-row">
                          <strong>{resource.title}</strong>
                          {metadataLabel && (
                            <small
                              className="resource-metadata"
                              aria-label={`文件信息：${metadataLabel}`}
                            >
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
                <button type="button" onClick={clearFilter}>查看全部公开资料</button>
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
      </div>
    </section>
  );
}
