import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Bookmark, FileText, Flag, GraduationCap, Home, LayoutGrid, Layers, Leaf, MonitorPlay, Search, Wrench } from "lucide-react";
import { getChildCategories, type Category } from "./categories";
import { shouldShowCategoryInNavigation } from "./categoryNavigation";
import {
  CATEGORY_PATH_PARAM,
  CATEGORY_PARAM,
  categoryPathBrowseLocation,
  readCategoryRouteState,
  resourceFilterLocation,
  type CategoryRouteState,
} from "./categoryRouting";
import { canOpenPublicShare } from "./publicCatalog";
import {
  getCompatibleResourceCategoryIds,
} from "./categoryCounts";
import {
  getCategoryFolderEntries,
  getCategoryContentItemCount,
  type CategoryFolderEntry,
} from "./categoryFolderPilot";
import { getResourceMetadataLabel, type Resource } from "./resources";

const routeIssueMessages = {
  "invalid-category": "原链接中的一级分类不可用，已为你显示可用分类。",
  "invalid-subject": "原链接中的学科分类不可用，已返回当前一级分类。",
  "subject-parent-mismatch": "原链接中的分类层级不匹配，已返回当前一级分类。",
  "invalid-category-path": "原链接中的分类路径不可用，已为你显示可用分类。",
} as const;

const categoryIcon = (id: string, size = 24) => {
  if (id.includes("textbooks")) return <BookOpen size={size} strokeWidth={1.8} />;
  if (id.includes("workbooks")) return <Layers size={size} strokeWidth={1.8} />;
  if (id.includes("exam") || id.includes("mocks")) return <FileText size={size} strokeWidth={1.8} />;
  if (id.includes("courses")) return <MonitorPlay size={size} strokeWidth={1.8} />;
  if (id.includes("subjects")) return <LayoutGrid size={size} strokeWidth={1.8} />;
  if (id.includes("sprint")) return <Flag size={size} strokeWidth={1.8} />;
  if (id.startsWith("stage-")) {
    return id === "stage-junior"
      ? <GraduationCap size={size} strokeWidth={1.8} />
      : <BookOpen size={size} strokeWidth={1.8} />;
  }
  if (id.startsWith("purpose-")) return <Flag size={size} strokeWidth={1.8} />;
  return <BookOpen size={size} strokeWidth={1.8} />;
};

const CategoryCard = ({
  category,
  count = 0,
  countLabel,
  onSelect,
  href,
  onNavigate,
}: {
  category: Category;
  count?: number;
  countLabel?: string;
  onSelect?: (category: Category) => void;
  href?: string;
  onNavigate?: (location: string) => void;
}) => {
  const content = (
    <>
      <span className="category-card-icon" aria-hidden="true">{categoryIcon(category.id)}</span>
      <span className="category-card-copy">
        <strong>{category.name}</strong>
        <span>{category.description}</span>
        <small>{countLabel ?? (count > 0 ? `${count} 份资料` : "暂无资料")}</small>
      </span>
      {(onSelect || href) && (
        <span className="category-card-arrow" aria-hidden="true">→</span>
      )}
    </>
  );

  return href ? (
    <a
      className="category-browser-card"
      href={href}
      onClick={(event) => {
        if (
          onNavigate &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          onNavigate(href);
        }
      }}
    >
      {content}
    </a>
  ) : onSelect ? (
    <button
      className="category-browser-card"
      type="button"
      onClick={() => onSelect(category)}
    >
      {content}
    </button>
  ) : (
    <article className="category-browser-card category-browser-card-static">
      {content}
    </article>
  );
};

const EmptyCategoryState = ({ message }: { message: string }) => (
  <div className="category-empty" role="status">
    <span aria-hidden="true">◇</span>
    <strong>{message}</strong>
    <p>可以返回上一级浏览其他分类。</p>
  </div>
);

const providerLabels = {
  quark: "夸克网盘",
  baidu: "百度网盘",
} as const;

function DirectResourceCard({ resource }: { resource: Resource }) {
  const shareUrl = resource.delivery?.shareUrl;
  const canOpen = canOpenPublicShare(resource) && Boolean(shareUrl);
  const metadata = getResourceMetadataLabel(resource);
  const content = (
    <>
      <span className="category-direct-resource-copy">
        <small>{providerLabels[resource.delivery?.provider ?? "quark"]} · 已核验</small>
        <strong>{resource.title}</strong>
        <em>{resource.description}</em>
        {metadata && <small>{metadata}</small>}
      </span>
      <span className="category-direct-resource-arrow" aria-hidden="true">↗</span>
    </>
  );

  if (canOpen && shareUrl) {
    return (
      <a
        className="category-direct-resource"
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <article className="category-direct-resource is-unavailable">
      {content}
      <small>当前暂无公开入口</small>
    </article>
  );
}

function DirectResourceSection({
  category,
  resources,
}: {
  category: Category;
  resources: readonly Resource[];
}) {
  if (resources.length === 0) return null;
  return (
    <section className="category-direct-resources" aria-labelledby={`${category.id}-direct-resources-title`}>
      <div className="category-direct-resources-head">
        <div>
          <p className="kicker">DIRECT ENTRIES</p>
          <h3 id={`${category.id}-direct-resources-title`}>
            {category.name}直接资料 <span>{resources.length}</span>
          </h3>
        </div>
        <p>本级已核验的资料入口</p>
      </div>
      <div className="category-direct-resource-grid">
        {resources.map((resource) => (
          <DirectResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
}

function CategoryFolderSection({
  category,
  folders,
}: {
  category: Category;
  folders: readonly CategoryFolderEntry[];
}) {
  if (folders.length === 0) return null;
  const groupLabel = folders[0]?.groupLabel ?? "下级资料";
  const groupDescription = folders[0]?.groupDescription ?? "按夸克网盘的文件夹层级整理";
  return (
    <section
      className="category-folder-resources"
      aria-labelledby={`${category.id}-folder-resources-title`}
    >
      <div className="category-folder-resources-head">
        <div>
          <p className="kicker">QUARK FOLDERS</p>
          <h3 id={`${category.id}-folder-resources-title`}>
            {groupLabel} <span>{folders.length}</span>
          </h3>
        </div>
        <p>{groupDescription}</p>
      </div>
      <div className="category-folder-resource-grid">
        {folders.map((folder) => (
          <a
            className="category-folder-resource"
            href={folder.shareUrl}
            key={folder.id}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="category-folder-resource-index" aria-hidden="true">
              {folder.sequence}
            </span>
            <span className="category-folder-resource-copy">
              <small>夸克网盘 · 文件夹</small>
              <strong>{folder.title}</strong>
              <em>{folder.description}</em>
              <small>{folder.itemCount} 项内容</small>
            </span>
            <span className="category-folder-resource-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function CategoriesPage({
  onHome,
  counts = {},
  onOpenResources,
  onOpenJuniorHighCourses,
  onOpenHighSchoolCourses,
  onOpenPostgraduateCourses,
  onProfile,
  onTools,
  resourceValues = [],
}: {
  onHome: () => void;
  counts?: Record<string, number>;
  onOpenResources: (location: string) => void;
  onOpenJuniorHighCourses?: (location: string) => void;
  onOpenHighSchoolCourses?: (location: string) => void;
  onOpenPostgraduateCourses?: (location: string) => void;
  onProfile?: () => void;
  onTools?: () => void;
  resourceValues?: readonly Resource[];
}) {
  const [routeState, setRouteState] = useState<CategoryRouteState>(() =>
    readCategoryRouteState(),
  );
  const [search, setSearch] = useState(() => window.location.search);

  const syncFromLocation = useCallback(() => {
    setSearch(window.location.search);
    setRouteState(readCategoryRouteState());
  }, []);

  useEffect(() => {
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [syncFromLocation]);

  const navigate = (location: string) => {
    window.history.pushState({}, "", location);
    syncFromLocation();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const rootCategories = useMemo(
    () =>
      getChildCategories(null).filter((category) =>
        shouldShowCategoryInNavigation(category.id, counts[category.id] ?? 0),
      ),
    [counts],
  );
  const params = new URLSearchParams(search);
  const hasCategoryParam =
    params.has(CATEGORY_PARAM) || params.has(CATEGORY_PATH_PARAM);
  const issues = [...new Set(routeState.issues)];

  const defaultDesktopCategory = rootCategories[0] ?? null;
  const desktopPath = routeState.path.length
    ? routeState.path
    : routeState.category
      ? [routeState.category]
      : defaultDesktopCategory
        ? [defaultDesktopCategory]
        : [];
  const desktopCurrent = desktopPath[desktopPath.length - 1] ?? null;
  const visibleCategoryItems = (items: readonly Category[]) =>
    items.filter((category) =>
      shouldShowCategoryInNavigation(category.id, counts[category.id] ?? 0),
    );
  const desktopItems = desktopCurrent
    ? visibleCategoryItems(getChildCategories(desktopCurrent.id))
    : rootCategories;
  const desktopTitle = desktopCurrent && desktopCurrent.level >= 2
    ? "资料类型"
    : "学科与方向";
  const desktopEmpty = desktopCurrent && desktopCurrent.level >= 2
    ? "暂无资料类型"
    : "暂无下级分类";

  const mobilePath = routeState.path;
  const mobileCurrent = mobilePath[mobilePath.length - 1] ?? null;
  const mobileItems = mobileCurrent
    ? visibleCategoryItems(getChildCategories(mobileCurrent.id))
    : rootCategories;
  const mobileHasSelection = mobilePath.length > 0;

  const selectPath = (path: readonly Category[]) =>
    navigate(categoryPathBrowseLocation(path.map((category) => category.id)));
  const selectRoot = (category: Category) => selectPath([category]);
  const openResourceLocation = (location: string, categoryId?: string) => {
    if (categoryId === "domain-junior-courses" && onOpenJuniorHighCourses) {
      onOpenJuniorHighCourses(location);
      return;
    }
    if (categoryId === "domain-senior-courses" && onOpenHighSchoolCourses) {
      onOpenHighSchoolCourses(location);
      return;
    }
    if (categoryId === "domain-university-postgraduate-kaoyan" && onOpenPostgraduateCourses) {
      onOpenPostgraduateCourses("/postgraduate/courses?subject=%E8%8B%B1%E8%AF%AD");
      return;
    }
    onOpenResources(location);
  };
  const selectDesktopChild = (category: Category) => {
    const children = getChildCategories(category.id);
    const localFolders = getCategoryFolderEntries(category.id);
    if (category.id === "domain-junior-courses") {
      const location = resourceFilterLocation(category.id);
      if (location) openResourceLocation(location, category.id);
      return;
    }
    if (category.id === "domain-senior-courses") {
      const location = resourceFilterLocation(category.id);
      if (location) openResourceLocation(location, category.id);
      return;
    }
    if (category.id === "domain-university-postgraduate-kaoyan") {
      openResourceLocation("/postgraduate/courses?subject=%E8%8B%B1%E8%AF%AD", category.id);
      return;
    }
    if (children.length > 0 || localFolders.length > 0) {
      selectPath([...desktopPath, category]);
    } else {
      const location = resourceFilterLocation(category.id);
      if (location) openResourceLocation(location, category.id);
    }
  };
  const selectMobileChild = (category: Category) => {
    const children = getChildCategories(category.id);
    const localFolders = getCategoryFolderEntries(category.id);
    if (category.id === "domain-junior-courses") {
      const location = resourceFilterLocation(category.id);
      if (location) openResourceLocation(location, category.id);
      return;
    }
    if (category.id === "domain-senior-courses") {
      const location = resourceFilterLocation(category.id);
      if (location) openResourceLocation(location, category.id);
      return;
    }
    if (category.id === "domain-university-postgraduate-kaoyan") {
      openResourceLocation("/postgraduate/courses?subject=%E8%8B%B1%E8%AF%AD", category.id);
      return;
    }
    if (children.length > 0 || localFolders.length > 0) {
      selectPath([...mobilePath, category]);
    } else {
      const location = resourceFilterLocation(category.id);
      if (location) openResourceLocation(location, category.id);
    }
  };
  const backToRoots = () => selectPath([]);
  const backDesktop = () => selectPath(desktopPath.slice(0, -1));
  const backMobile = () => selectPath(mobilePath.slice(0, -1));

  const activeResourceCategory = desktopCurrent;
  const directResourcesFor = (category: Category | null) =>
    category
      ? resourceValues.filter(
          (resource) =>
            resource.categoryId !== null &&
            getCompatibleResourceCategoryIds(category.id).includes(resource.categoryId),
        )
      : [];
  const desktopDirectResources = directResourcesFor(desktopCurrent);
  const mobileDirectResources = directResourcesFor(mobileCurrent);
  const desktopFolderEntries = getCategoryFolderEntries(desktopCurrent?.id);
  const mobileFolderEntries = getCategoryFolderEntries(mobileCurrent?.id);
  const localFolderCountLabel = (category: Category | null) => {
    const itemCount = getCategoryContentItemCount(category?.id);
    return itemCount === undefined ? undefined : `${itemCount} 项内容`;
  };
  const shouldShowDirectResources = (category: Category | null) =>
    category?.id !== "purpose-certification";
  const activeResourceLocation = activeResourceCategory
    ? resourceFilterLocation(activeResourceCategory.id)
    : null;
  const activeResourceLink = activeResourceCategory && activeResourceLocation ? (
    <a
      className="category-resource-link"
      href={activeResourceLocation}
      onClick={(event) => {
        if (
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          openResourceLocation(activeResourceLocation, activeResourceCategory.id);
        }
      }}
    >
      查看{activeResourceCategory.name}全部资料
      <span>
        {localFolderCountLabel(activeResourceCategory) ??
          `${counts[activeResourceCategory.id] ?? 0} 份资料`}
      </span>
    </a>
  ) : null;
  const activeResourceSummary = activeResourceCategory && activeResourceCategory.level === 1 && activeResourceLocation ? (
    <a
      className="category-resource-summary"
      aria-label={`查看${activeResourceCategory.name}全部资料`}
      href={activeResourceLocation}
      onClick={(event) => {
        if (
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          openResourceLocation(activeResourceLocation, activeResourceCategory.id);
        }
      }}
    >
      <strong>全部资料 <span>{counts[activeResourceCategory.id] ?? 0}</span> 份</strong>
      <span>包含{getChildCategories(activeResourceCategory.id).slice(0, 4).map((category) => category.name).join("、")}等学习资源</span>
      <span className="category-summary-a11y" aria-hidden="true">{counts[activeResourceCategory.id] ?? 0} 份资料</span>
      <i aria-hidden="true">→</i>
    </a>
  ) : null;

  const renderDesktopCard = (category: Category) => {
    const children = getChildCategories(category.id);
    const localFolders = getCategoryFolderEntries(category.id);
    return (
      <CategoryCard
        key={category.id}
        category={category}
        count={counts[category.id] ?? 0}
        countLabel={localFolderCountLabel(category)}
        onSelect={children.length > 0 || localFolders.length > 0 ? selectDesktopChild : undefined}
        href={
          children.length === 0 && localFolders.length === 0
            ? resourceFilterLocation(category.id) ?? undefined
            : undefined
        }
        onNavigate={(location) => openResourceLocation(location, category.id)}
      />
    );
  };

  return (
    <section className="categories-page">
      <div className="categories-page-head">
        <nav className="categories-page-trail" aria-label="页面位置">
          <button type="button" onClick={onHome}>首页</button>
          <span aria-hidden="true">/</span>
          <span aria-current="page">分类</span>
        </nav>
        <p className="kicker">DIRECTORY</p>
        <h1>分类浏览</h1>
        <p>按学习阶段和学科，找到需要的学习资料。</p>
      </div>

      {issues.length > 0 && (
        <div
          className="category-route-notice"
          role="status"
          aria-label="分类链接提示"
        >
          {issues.map((issue) => routeIssueMessages[issue]).join(" ")}
        </div>
      )}

      <div className="category-desktop" data-testid="category-desktop">
        <aside className="category-sidebar" aria-label="一级分类">
          <p>学习阶段与用途</p>
          <button
            type="button"
            className={desktopPath.length === 0 ? "active" : ""}
            aria-current={desktopPath.length === 0 ? "true" : undefined}
            onClick={backToRoots}
          >
            <span className="category-sidebar-icon" aria-hidden="true"><Home size={22} strokeWidth={1.8} /></span>
            <span><strong>全部分类</strong><small>浏览全部目录</small></span>
            <i aria-hidden="true">⌂</i>
          </button>
          {rootCategories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={
                routeState.category?.id === category.id ? "active" : ""
              }
              aria-current={
                routeState.category?.id === category.id ? "true" : undefined
              }
              onClick={() => selectRoot(category)}
            >
              <span className="category-sidebar-icon" aria-hidden="true">{categoryIcon(category.id, 22)}</span>
              <span>
                <strong>{category.name}</strong>
                <small>{counts[category.id] ?? 0} 份资料</small>
              </span>
              <i aria-hidden="true">›</i>
            </button>
          ))}
          <section className="category-assistant" aria-labelledby="category-assistant-title">
            <div className="category-assistant-heading"><span aria-hidden="true"><Leaf size={22} strokeWidth={1.8} /></span><h2 id="category-assistant-title">学习助手</h2></div>
            <p>快速了解资料分布，更高效地找到所需资源。</p>
            <div className="category-assistant-links">
              <button type="button" onClick={() => defaultDesktopCategory ? selectPath([defaultDesktopCategory]) : onHome()}><Search size={17} strokeWidth={1.8} /><span>按学科查找资料</span></button>
              <button type="button" onClick={() => onProfile ? onProfile() : onHome()}><Bookmark size={17} strokeWidth={1.8} /><span>收藏常用资料</span></button>
              <button type="button" onClick={() => onTools ? onTools() : onHome()}><Wrench size={17} strokeWidth={1.8} /><span>使用学习工具</span></button>
            </div>
          </section>
        </aside>

        <div className="category-main-panel">
          <div className="category-level-head">
            <div>
              <nav aria-label="当前位置">
                <span>分类</span>
                {desktopPath.map((category) => (
                  <span key={category.id}>{category.name}</span>
                ))}
              </nav>
              <h2>
                {desktopCurrent?.name ?? desktopTitle}
                <small>{desktopTitle}</small>
              </h2>
            </div>
            {desktopPath.length > 1 && (
              <button type="button" onClick={backDesktop}>
                {desktopPath.length === 2 ? "← 返回学科" : "← 返回上一级"}
              </button>
            )}
          </div>
          {activeResourceSummary ?? activeResourceLink}
          {desktopItems.length > 0 ? (
            <div className="category-card-grid">
              {desktopItems.map(renderDesktopCard)}
            </div>
          ) : desktopFolderEntries.length === 0 ? (
            <EmptyCategoryState message={desktopEmpty} />
          ) : null}
          {desktopCurrent && desktopFolderEntries.length > 0 && (
            <CategoryFolderSection
              category={desktopCurrent}
              folders={desktopFolderEntries}
            />
          )}
          {desktopCurrent &&
            shouldShowDirectResources(desktopCurrent) &&
            desktopDirectResources.length > 0 && (
            <DirectResourceSection
              category={desktopCurrent}
              resources={desktopDirectResources}
            />
          )}
        </div>
      </div>

      <div className="category-mobile" data-testid="category-mobile">
        <div className="category-mobile-head">
          {mobileHasSelection ? (
            <button type="button" onClick={backMobile}>← 返回上一级</button>
          ) : hasCategoryParam ? (
            <button type="button" onClick={backToRoots}>← 返回上一级</button>
          ) : (
            <span>选择学习阶段或用途</span>
          )}
          <nav aria-label="当前位置">
            <span>分类</span>
            {mobilePath.map((category) => (
              <span key={category.id}>{category.name}</span>
            ))}
          </nav>
        </div>

        {mobileHasSelection && activeResourceLink}
        {!mobileHasSelection ? (
          <div className="category-card-list" aria-label="一级分类">
            {rootCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                count={counts[category.id] ?? 0}
                onSelect={selectRoot}
              />
            ))}
          </div>
        ) : mobileItems.length > 0 ? (
          <div className="category-card-list" aria-label="下级分类">
            {mobileItems.map((category) => {
              const children = getChildCategories(category.id);
              const localFolders = getCategoryFolderEntries(category.id);
              return (
                <CategoryCard
                  key={category.id}
                  category={category}
                  count={counts[category.id] ?? 0}
                  countLabel={localFolderCountLabel(category)}
                  onSelect={children.length > 0 || localFolders.length > 0 ? selectMobileChild : undefined}
                  href={
                    children.length === 0 && localFolders.length === 0
                      ? resourceFilterLocation(category.id) ?? undefined
                      : undefined
                  }
                  onNavigate={(location) => openResourceLocation(location, category.id)}
                />
              );
            })}
          </div>
        ) : (
          <EmptyCategoryState
            message={mobileCurrent && mobileCurrent.level >= 2
              ? "暂无资料类型"
              : "暂无下级分类"}
          />
        )}
        {mobileCurrent && mobileFolderEntries.length > 0 && (
          <CategoryFolderSection
            category={mobileCurrent}
            folders={mobileFolderEntries}
          />
        )}
        {mobileCurrent &&
          shouldShowDirectResources(mobileCurrent) &&
          mobileDirectResources.length > 0 && (
          <DirectResourceSection
            category={mobileCurrent}
            resources={mobileDirectResources}
          />
        )}
      </div>
    </section>
  );
}
