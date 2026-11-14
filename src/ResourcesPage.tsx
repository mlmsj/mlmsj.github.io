import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
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
  canOpenPublicShare,
  getResourceAccessLabel,
  type PublicCatalogPhase,
} from "./publicCatalog";
import { categoryPathBrowseLocation, resourceFilterLocation } from "./categoryRouting";
import { HIGH_SCHOOL_INDEX_META } from "./highSchoolCourseIndex";
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
const RESOURCE_GROUP_STAGE_IDS = new Set(["stage-junior", "stage-senior", "stage-university"]);

const compareCategoryPaths = (
  left: readonly Category[],
  right: readonly Category[],
) => {
  if (left.length === 0 || right.length === 0) {
    return right.length - left.length;
  }

  const sharedLength = Math.min(left.length, right.length);
  for (let index = 0; index < sharedLength; index += 1) {
    const leftCategory = left[index];
    const rightCategory = right[index];
    if (leftCategory.id === rightCategory.id) continue;

    return (
      leftCategory.sortOrder - rightCategory.sortOrder ||
      leftCategory.name.localeCompare(rightCategory.name, "zh-CN") ||
      leftCategory.id.localeCompare(rightCategory.id)
    );
  }

  return left.length - right.length;
};

type ResourceListEntry =
  | {
      kind: "resource";
      resource: Resource;
      nested: boolean;
      order: number;
    }
  | {
      kind: "group";
      id: string;
      category: Category;
      parent: Resource;
      children: Resource[];
      order: number;
    };

type ResourceGroupToggle = {
  id: string;
  isExpanded: boolean;
  childCount: number;
  onToggle: () => void;
};

const getResourceGroupCategory = (
  resource: Resource,
  categoryValues: readonly Category[],
) => {
  if (!resource.categoryId) return null;
  return (
    getCategoryPath(resource.categoryId, categoryValues).find(
      (category) =>
        category.level === 2 &&
        category.parentId !== null &&
        RESOURCE_GROUP_STAGE_IDS.has(category.parentId) &&
        (category.id.startsWith("domain-junior-") ||
          category.id.startsWith("domain-senior-") ||
          category.id.startsWith("domain-university-")),
    ) ?? null
  );
};

const buildResourceListEntries = (
  resources: readonly Resource[],
  categoryValues: readonly Category[],
  enableGrouping: boolean,
): ResourceListEntry[] => {
  if (!enableGrouping) {
    return resources.map((resource, order) => ({
      kind: "resource",
      resource,
      nested: false,
      order,
    }));
  }

  const directEntries: ResourceListEntry[] = [];
  const groups = new Map<
    string,
    {
      category: Category;
      parent: { resource: Resource; order: number } | null;
      children: { resource: Resource; order: number }[];
      order: number;
    }
  >();

  resources.forEach((resource, order) => {
    const category = getResourceGroupCategory(resource, categoryValues);
    if (!category) {
      directEntries.push({ kind: "resource", resource, nested: false, order });
      return;
    }

    const existing = groups.get(category.id) ?? {
      category,
      parent: null,
      children: [],
      order,
    };
    if (resource.categoryId === category.id) {
      existing.parent = { resource, order };
    } else {
      existing.children.push({ resource, order });
    }
    groups.set(category.id, existing);
  });

  const groupedEntries: ResourceListEntry[] = [...directEntries];
  for (const [id, group] of groups) {
    if (group.parent && group.children.length > 0) {
      groupedEntries.push({
        kind: "group",
        id,
        category: group.category,
        parent: group.parent.resource,
        children: group.children
          .sort((left, right) => left.order - right.order)
          .map(({ resource }) => resource),
        order: group.order,
      });
      continue;
    }

    if (group.parent) {
      groupedEntries.push({
        kind: "resource",
        resource: group.parent.resource,
        nested: false,
        order: group.parent.order,
      });
    }
    for (const child of group.children) {
      groupedEntries.push({
        kind: "resource",
        resource: child.resource,
        nested: false,
        order: child.order,
      });
    }
  }

  return groupedEntries.sort((left, right) => left.order - right.order);
};

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
  const [resourceGroupExpansion, setResourceGroupExpansion] = useState<{
    key: string;
    ids: ReadonlySet<string>;
  }>(() => ({ key: "", ids: new Set() }));
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

  const categoryPath = filterState.category
    ? getCategoryPath(filterState.category.id, categoryValues)
    : [];
  const orderedResources = useMemo(() => {
    if (!filterState.category) return filteredResources;

    return filteredResources
      .map((resource, index) => ({
        resource,
        index,
        path: resource.categoryId
          ? getCategoryPath(resource.categoryId, categoryValues)
          : [],
      }))
      .sort(
        (left, right) =>
          compareCategoryPaths(left.path, right.path) || left.index - right.index,
      )
      .map(({ resource }) => resource);
  }, [categoryValues, filterState.category, filteredResources]);
  const total = orderedResources.length;
  const resourceListEntries = useMemo(
    () =>
      buildResourceListEntries(
        orderedResources,
        categoryValues,
        true,
      ),
    [categoryValues, orderedResources],
  );
  const listTotal = resourceListEntries.length;
  const visibleResourceEntries = useMemo(
    () => resourceListEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, resourceListEntries],
  );
  const expandableResourceGroupIds = useMemo(
    () =>
      visibleResourceEntries.flatMap((entry) =>
        entry.kind === "group" ? [entry.id] : [],
      ),
    [visibleResourceEntries],
  );
  const selectedCategoryId = filterState.category?.id;
  const defaultExpandedResourceGroupKey = useMemo(() => {
    const defaultExpanded = new Set<string>();
    if (searchTerm.trim()) {
      expandableResourceGroupIds.forEach((id) => defaultExpanded.add(id));
    }
    if (selectedCategoryId && expandableResourceGroupIds.includes(selectedCategoryId)) {
      defaultExpanded.add(selectedCategoryId);
    }
    return [...defaultExpanded].sort().join("|");
  }, [expandableResourceGroupIds, searchTerm, selectedCategoryId]);
  const resourceGroupContextKey = `${selectedCategoryId ?? ""}::${searchTerm.trim()}::${expandableResourceGroupIds.join("|")}`;
  const defaultExpandedResourceGroups = useMemo(
    () =>
      new Set(
        defaultExpandedResourceGroupKey
          ? defaultExpandedResourceGroupKey.split("|")
          : [],
      ),
    [defaultExpandedResourceGroupKey],
  );
  const expandedResourceGroups =
    resourceGroupExpansion.key === resourceGroupContextKey
      ? resourceGroupExpansion.ids
      : defaultExpandedResourceGroups;
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

  const highSchoolCourseLocation = resourceFilterLocation(
    HIGH_SCHOOL_INDEX_META.formalCategoryId,
    categoryValues,
  );

  const toggleResourceGroup = (groupId: string) => {
    setResourceGroupExpansion((current) => {
      const base =
        current.key === resourceGroupContextKey
          ? current.ids
          : defaultExpandedResourceGroups;
      const next = new Set(base);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return { key: resourceGroupContextKey, ids: next };
    });
  };

  const renderResourceItem = (
    resource: Resource,
    displayIndex: string,
    nested: boolean,
    groupToggle?: ResourceGroupToggle,
  ) => {
    const accessLabel = getResourceAccessLabel(resource);
    const metadataLabel = getResourceMetadataLabel(resource);
    const resourcePath = resource.categoryId
      ? getCategoryPath(resource.categoryId, categoryValues)
      : [];
    const isNestedResource =
      nested ||
      (Boolean(filterState.category) &&
        resourcePath.length > categoryPath.length + 1);
    const groupShareUrl =
      groupToggle &&
      canOpenPublicShare(resource) &&
      resource.delivery?.shareUrl
        ? resource.delivery.shareUrl
        : null;

    const resourceCopy = (
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
    );
    const resourceTime = groupToggle ? (
      <time className="resource-item-time resource-item-time--group-parent">
        {groupShareUrl && (
          <a
            className="resource-group-open-link"
            href={groupShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`打开总资料：${resource.title}`}
          >
            打开总资料 ↗
          </a>
        )}
        <span>{resource.meta}</span>
      </time>
    ) : (
      <time className="resource-item-time">{resource.meta}　→</time>
    );
    const resourceBody = groupToggle ? (
      <div className="resource-item resource-item--group-parent-body">
        <b>{displayIndex}</b>
        {resourceCopy}
        {resourceTime}
      </div>
    ) : (
      <button className="resource-item" onClick={() => detail(resource)}>
        <b>{displayIndex}</b>
        {resourceCopy}
        {resourceTime}
      </button>
    );

    return (
      <article
        className={`resource-item-shell${isNestedResource ? " resource-item-shell--nested" : ""}${groupToggle ? " resource-item-shell--group-parent" : ""}${onToggleFavorite ? " resource-item-shell--with-favorite" : ""}`}
        key={resource.id}
      >
        {resourceBody}
        {groupToggle && (
          <button
            type="button"
            className="resource-group-toggle"
            aria-label={`${groupToggle.isExpanded ? "收起" : "展开"}下级资料（${groupToggle.childCount}项）`}
            aria-expanded={groupToggle.isExpanded}
            aria-controls={groupToggle.isExpanded ? `resource-group-${groupToggle.id}` : undefined}
            title={`${groupToggle.isExpanded ? "收起" : "展开"} ${groupToggle.childCount} 个下级资料`}
            onClick={groupToggle.onToggle}
          >
            <span
              className={`resource-group-toggle-icon${groupToggle.isExpanded ? " is-expanded" : ""}`}
              aria-hidden="true"
            />
            <span aria-hidden="true">{groupToggle.childCount}项</span>
          </button>
        )}
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
  };

  const renderedResourceItems = visibleResourceEntries.reduce<{
    items: ReactNode[];
    nextIndex: number;
  }>((accumulator, entry) => {
    if (entry.kind === "resource") {
      const displayIndex = String((page - 1) * PAGE_SIZE + accumulator.nextIndex + 1).padStart(2, "0");
      return {
        items: [
          ...accumulator.items,
          renderResourceItem(entry.resource, displayIndex, entry.nested),
        ],
        nextIndex: accumulator.nextIndex + 1,
      };
    }

    const isExpanded = expandedResourceGroups.has(entry.id);
    const parentPosition = accumulator.nextIndex + 1;
    const parentIndex = String((page - 1) * PAGE_SIZE + parentPosition).padStart(2, "0");
    const children = isExpanded
      ? entry.children.map((resource, childIndex) =>
          renderResourceItem(
            resource,
            `${parentIndex}-${String(childIndex + 1).padStart(2, "0")}`,
            true,
          ),
        )
      : [];
    const group = (
      <div className="resource-group-shell" key={`group-${entry.id}`}>
        {renderResourceItem(entry.parent, parentIndex, false, {
          id: entry.id,
          isExpanded,
          childCount: entry.children.length,
          onToggle: () => toggleResourceGroup(entry.id),
        })}
        {isExpanded && (
          <div
            className="resource-group-children"
            id={`resource-group-${entry.id}`}
            role="group"
            aria-label={`${entry.category.name}下级资料`}
          >
            {children}
          </div>
        )}
      </div>
    );
    return {
      items: [...accumulator.items, group],
      nextIndex: parentPosition,
    };
  }, { items: [], nextIndex: 0 }).items;

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

      {filterState.category?.id === "stage-senior" && highSchoolCourseLocation && (
        <div className="resource-category-entry" aria-label="高中网课课程索引入口">
          <span>高中 → 网课</span>
          <a
            href={highSchoolCourseLocation}
            onClick={(event) => handleLinkClick(event, highSchoolCourseLocation)}
          >
            打开 2027 课程索引
          </a>
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

            {catalogPhase === "ready" && visibleResourceEntries.length > 0 ? (
              <div className="resource-list">
                {renderedResourceItems}
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

            {catalogPhase === "ready" && listTotal > 0 && (
              <nav className="resource-pagination" aria-label="公开资料分页">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
                <span>第 {page} 页 · 共 {listTotal} 个入口</span>
                <button disabled={page * PAGE_SIZE >= listTotal} onClick={() => setPage(page + 1)}>下一页</button>
              </nav>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
