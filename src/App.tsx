import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import "./index.css";
import "./Home.css";
import { BookOpen, Files, Grid2X2, Image, ScanText, Search } from "lucide-react";
import { InfoPage, type InfoPageKey } from "./InfoPages";
import { Toolbox, ToolDetail, type ToolKey } from "./Toolbox";
import { appPathFromLocation, locationPathForAppPath } from "./routing";
import { sortResourcesByUpdatedAt, type Resource } from "./resources";
import { usePublicCatalog } from "./publicCatalog";
import { categories } from "./categories";
import { getPublishedResourceCount, isPublishedPublicResource } from "./categoryCounts";
import {
  CATEGORY_FOLDER_SEARCH_RESOURCES,
  mergeAccessibleResourceEntries,
} from "./categoryFolderPilot";
import { PublicDeliveryPanel, PublicDetail } from "./PublicDetail";
import { CategoriesPage } from "./CategoriesPage";
import { categoryPathBrowseLocation } from "./categoryRouting";
import { ResourcesPage } from "./ResourcesPage";
import { HighSchoolCoursesPage } from "./HighSchoolCoursesPage";
import { JuniorHighCoursesPage } from "./JuniorHighCoursesPage";
import { PostgraduateCoursesPage } from "./PostgraduateCoursesPage";
import { getHighSchoolSearchTarget } from "./highSchoolSearch";
import { getJuniorHighSearchTarget } from "./juniorHighCourseIndex";
import { getPostgraduateSearchTarget } from "./postgraduateCourseIndex";
import { SkillGrowthPage } from "./SkillGrowthPage";
import { MyPage } from "./MyPage";
import { mySections, type MySection } from "./mySections";
import { loadMyData, recordRecent, saveMyData, toggleTimed, type MyData } from "./myData";

type Page =
  | "home"
  | "resources"
  | "detail"
  | "categories"
  | "juniorCourses"
  | "seniorCourses"
  | "postgraduateCourses"
  | "skill-growth"
  | "tools"
  | "profile"
  | ToolKey
  | InfoPageKey;
const nav = [
  { key: "home", label: "首页", art: "books" },
  { key: "resources", label: "找资料", art: "open-book" },
  { key: "categories", label: "分类", art: "graduate" },
  { key: "skill-growth", label: "技能成长", art: "sparkles" },
  { key: "tools", label: "学习工具", art: "scroll" },
  { key: "profile", label: "我的", art: "cat" },
] as const;
const paths: Record<Page, string> = {
  home: "/",
  resources: "/resources",
  detail: "/detail",
  categories: "/categories",
  juniorCourses: "/junior-high/courses",
  seniorCourses: "/high-school/courses",
  postgraduateCourses: "/postgraduate/courses",
  "skill-growth": "/skill-growth",
  tools: "/tools",
  profile: "/profile",
  nup: "/tools/pdf-nup",
  merge: "/tools/pdf-merge",
  split: "/tools/pdf-split",
  "images-to-pdf": "/tools/images-to-pdf",
  "image-compress": "/tools/image-compress",
  "print-page-adjust": "/tools/print-page-adjust",
  "image-sheet-layout": "/tools/image-sheet-layout",
  "pdf-page-organizer": "/tools/pdf-page-organizer",
  "pdf-to-images": "/tools/pdf-to-images",
  "pdf-compress": "/tools/pdf-compress",
  ocr: "/tools/ocr",
  "page-number": "/tools/page-number",
  watermark: "/tools/watermark",
  "image-format-convert": "/tools/image-format-convert",
  "image-resize": "/tools/image-resize",
  about: "/about",
  guide: "/guide",
  disclaimer: "/disclaimer",
  contact: "/contact",
};
const toolKeys: ToolKey[] = [
  "nup",
  "merge",
  "split",
  "images-to-pdf",
  "image-compress",
  "print-page-adjust",
  "image-sheet-layout",
  "pdf-page-organizer",
  "pdf-to-images",
  "pdf-compress",
  "ocr",
  "page-number",
  "watermark",
  "image-format-convert",
  "image-resize",
];
const pageFromPath = (): Page => {
  const appPath = appPathFromLocation(window.location.pathname);
  if (appPath.startsWith("/profile")) return "profile";
  return (Object.entries(paths).find(
    ([, path]) => path === appPath,
  )?.[0] as Page | undefined) ?? "home";
};
const profileSectionFromPath = (): MySection => {
  const segment = appPathFromLocation(window.location.pathname).split("/")[2];
  return mySections.includes(segment as MySection) ? segment as MySection : "overview";
};
const resourceFromLocation = () => new URLSearchParams(window.location.search).get("id");
const infoPages: InfoPageKey[] = ["about", "guide", "disclaimer", "contact"];

function App() {
  const [page, setPage] = useState<Page>(pageFromPath);
  const catalog = usePublicCatalog();
  const resources = catalog.items;
  const accessibleResources = useMemo(
    () => mergeAccessibleResourceEntries(resources),
    [resources],
  );
  const accessibleCounts = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [
          category.id,
          getPublishedResourceCount(
            category.id,
            categories,
            accessibleResources,
          ),
        ]),
      ),
    [accessibleResources],
  );
  const publicResources = sortResourcesByUpdatedAt(
    resources.filter((resource) => isPublishedPublicResource(resource)),
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selected, setSelected] = useState(resourceFromLocation);
  const [myData, setMyData] = useState<MyData>(loadMyData);
  const [profileSection, setProfileSection] = useState<MySection>(profileSectionFromPath);
  const [storageError, setStorageError] = useState(false);
  const updateMyData = (updater: (current: MyData) => MyData) => setMyData(current => {
    const next = updater(current);
    try { saveMyData(next); setStorageError(false) } catch { setStorageError(true) }
    return next;
  });
  useEffect(() => {
    const onPopState = () => { setPage(pageFromPath()); setSelected(resourceFromLocation()); setProfileSection(profileSectionFromPath()) };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = myData.theme;
  }, [myData]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === "zhaowenguan.my.v1") setMyData(loadMyData()) };
    window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, []);
  const go = (next: Page) => {
    openLocation(next, locationPathForAppPath(paths[next]));
  };
  const openLocation = (next: Page, nextLocation: string) => {
    setPage(next);
    setMobileOpen(false);
    const currentLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentLocation !== nextLocation)
      window.history.pushState({}, "", nextLocation);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openPostgraduateSearch = (value: string) => {
    const query = value.trim();
    if (!query) return false;

    const target = getPostgraduateSearchTarget(query);
    if (!target) return false;

    const searchParams = new URLSearchParams({
      subject: target.subject,
      q: query,
    });
    openLocation(
      "postgraduateCourses",
      locationPathForAppPath(`/postgraduate/courses?${searchParams.toString()}`),
    );
    return true;
  };
  const openJuniorHighSearch = (value: string) => {
    const query = value.trim();
    if (!query) return false;

    const target = getJuniorHighSearchTarget(query);
    if (!target) return false;

    const searchParams = new URLSearchParams({
      grade: target.grade,
      subject: target.subject,
      q: query,
    });
    openLocation(
      "juniorCourses",
      locationPathForAppPath(`/junior-high/courses?${searchParams.toString()}`),
    );
    return true;
  };
  const search = (value: string) => {
    const query = value.trim();
    if (!query) return;
    const highSchoolTarget = getHighSchoolSearchTarget(query);
    if (highSchoolTarget) {
      const searchParams = new URLSearchParams({
        grade: highSchoolTarget.grade,
        subject: highSchoolTarget.subject,
        q: query,
      });
      openLocation(
        "seniorCourses",
        locationPathForAppPath(`/high-school/courses?${searchParams.toString()}`),
      );
      return;
    }
    if (openJuniorHighSearch(query)) return;
    if (openPostgraduateSearch(query)) return;
    openLocation("resources", locationPathForAppPath(`/resources?q=${encodeURIComponent(query)}`));
  };
  const detail = (resource: Resource) => {
    setSelected(resource.id);
    updateMyData(data => ({ ...data, recentViews: recordRecent(data.recentViews, resource.id) }));
    openLocation("detail", locationPathForAppPath(`/detail?id=${encodeURIComponent(resource.id)}`));
  };
  const toggleFavorite = (id: string) => updateMyData(data => ({ ...data, favorites: toggleTimed(data.favorites, id) }));
  const toggleTool = (id: string) => updateMyData(data => ({ ...data, favoriteTools: toggleTimed(data.favoriteTools, id) }));
  const openProfile = (section: MySection) => { setProfileSection(section); openLocation("profile", locationPathForAppPath(`/profile/${section}`)) };
  const isInfoPage = infoPages.includes(page as InfoPageKey);
  const isToolDetail = toolKeys.includes(page as ToolKey);
  return (
    <div className="app-shell">
      <Header
        page={page}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        go={go}
        theme={myData.theme}
        toggleTheme={() => updateMyData(data => ({ ...data, theme: data.theme === "light" ? "dark" : "light" }))}
      />
      <main id="main-content">
        {catalog.status && ["home","categories","skill-growth","profile"].includes(page) && <p className="catalog-status-global" role="status">{catalog.status}</p>}
        {page === "home" && (
          <Home
            go={go}
            resources={publicResources}
            detail={detail}
            onSearch={search}
            openCategoryPath={(categoryIds) =>
              openLocation("categories", categoryPathBrowseLocation(categoryIds))
            }
          />
        )}
        {page === "resources" && <ResourcesPage resourceValues={resources} folderResourceValues={CATEGORY_FOLDER_SEARCH_RESOURCES} catalogPhase={catalog.phase} catalogStatus={catalog.status} detail={detail} favoriteIds={myData.favorites.map(item => item.id)} onToggleFavorite={toggleFavorite} onOpenJuniorHighSearch={openJuniorHighSearch} onOpenPostgraduateSearch={openPostgraduateSearch} />}
        {page === "juniorCourses" && <JuniorHighCoursesPage />}
        {page === "seniorCourses" && (
          <HighSchoolCoursesPage
            onSearch={search}
          />
        )}
        {page === "postgraduateCourses" && <PostgraduateCoursesPage />}
        {page === "categories" && (
          <CategoriesPage
            counts={accessibleCounts}
            resourceValues={resources}
            onHome={() => go("home")}
            onOpenResources={(location) => openLocation("resources", location)}
            onOpenJuniorHighCourses={(location) => openLocation("juniorCourses", location)}
            onOpenHighSchoolCourses={(location) => openLocation("seniorCourses", location)}
            onOpenPostgraduateCourses={(location) => openLocation("postgraduateCourses", locationPathForAppPath(location))}
            onProfile={() => go("profile")}
            onTools={() => go("tools")}
          />
        )}
        {page === "skill-growth" && (
          <SkillGrowthPage
            counts={accessibleCounts}
            resourceValues={resources}
            onHome={() => go("home")}
            onOpenCategories={(location) => openLocation("categories", location)}
            onOpenResources={(location) => openLocation("resources", location)}
          />
        )}
        {page === "detail" && <PublicDetail id={selected} resourceValues={resources} catalogPhase={catalog.phase} catalogStatus={catalog.status} onBack={() => go("resources")} render={resource => <Detail resource={resource} go={go} favorite={myData.favorites.some(item => item.id === resource.id)} onToggleFavorite={() => toggleFavorite(resource.id)} />} />}
        {page === "tools" && (
          <Toolbox openTool={(tool) => go(tool ?? "tools")} favoriteToolIds={myData.favoriteTools.map(item => item.id)} onToggleFavorite={toggleTool} />
        )}
        {isToolDetail && (
          <ToolDetail tool={page as ToolKey} back={() => go("tools")} />
        )}
        {isInfoPage && <InfoPage page={page as InfoPageKey} go={go} />}
        {page === "profile" && <><MyPage section={profileSection} data={myData} setData={updateMyData} resources={resources} onSection={openProfile} onResource={detail} onTool={(id) => id ? go(id as ToolKey) : go("tools")} onHome={() => go("resources")}/>{storageError && <p className="storage-warning" role="alert">浏览器存储不可用或空间不足，本次更改可能无法在刷新后保留。</p>}</>}
        {!isInfoPage &&
          !isToolDetail &&
          page !== "home" &&
          page !== "resources" &&
          page !== "juniorCourses" &&
          page !== "seniorCourses" &&
          page !== "postgraduateCourses" &&
          page !== "categories" &&
          page !== "skill-growth" &&
          page !== "detail" &&
          page !== "tools" &&
          page !== "profile" && <Placeholder page={page} />}
      </main>
      {(page === "home" || isInfoPage) && <Footer go={go} />}
      <MobileBottomNav page={page} go={go} />
    </div>
  );
}
function Header({
  page,
  mobileOpen,
  setMobileOpen,
  go,
  theme,
  toggleTheme,
}: {
  page: Page;
  mobileOpen: boolean;
  setMobileOpen: Dispatch<SetStateAction<boolean>>;
  go: (p: Page) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}) {
  const activePage = page === "detail" || page === "juniorCourses" || page === "seniorCourses"
    ? "resources"
    : toolKeys.includes(page as ToolKey)
    ? "tools"
    : page;
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand" onClick={() => go("home")}>
          <span className="brand-leaf">⌁</span>
          <b>昭文馆</b>
        </button>
        <nav className="desktop-nav" aria-label="主导航">
          {nav.map((item) => (
            <button
              className={activePage === item.key ? "active" : ""}
              aria-current={activePage === item.key ? "page" : undefined}
              key={item.key}
              onClick={() => go(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button className="round-button" aria-label="搜索" onClick={()=>go("resources")}>
            <span />
          </button>
          <button className="theme-button" aria-label={`切换为${theme === "light" ? "深色" : "浅色"}主题`} aria-pressed={theme === "dark"} onClick={toggleTheme}>
            <span />
          </button>
          <button
            type="button"
            className="menu-button"
            aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen(open => !open)}
          >
            ☰
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav id="mobile-navigation" className="mobile-menu" aria-label="移动主导航">
          {nav.map((item) => (
            <button
              type="button"
              key={item.key}
              className={activePage === item.key ? "active" : ""}
              aria-current={activePage === item.key ? "page" : undefined}
              onClick={() => go(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
function Home({
  go,
  detail,
  onSearch,
  openCategoryPath,
  resources,
}: {
  go: (p: Page) => void;
  detail: (r: Resource) => void;
  onSearch: (query: string) => void;
  openCategoryPath: (categoryIds: readonly string[]) => void;
  resources: readonly Resource[];
}) {
  const [query, setQuery] = useState("");
  const shortcuts = [
    { key: "ocr", title: "OCR 文字识别", description: "从图片和扫描件提取文字", Icon: ScanText },
    { key: "merge", title: "PDF 合并", description: "把零散资料整理成一份", Icon: Files },
    { key: "image-resize", title: "图片尺寸调整", description: "批量修改宽度和高度", Icon: Image },
  ] as const;
  const submitSearch = (q = query) => onSearch(q);
  return (
    <div className="home-page">
      <section className="home-intro" aria-labelledby="home-title">
        <p className="home-eyebrow">LEARNING STARTS HERE</p>
        <h1 id="home-title">让学习，从这里开始</h1>
        <div className="home-search">
            <Search size={22} aria-hidden="true" />
            <input aria-label="搜索学习资料" placeholder="搜索课程、学科或资料" value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key === "Enter") submitSearch();}} />
            <button onClick={()=>submitSearch()}>搜索</button>
          </div>
        <div className="home-hot-search" aria-label="热门搜索">
          <span>热门搜索</span>
          <button type="button" onClick={() => go("seniorCourses")}>高中课程</button>
          <button type="button" onClick={() => openCategoryPath(["stage-university"])}>大学教材</button>
          <button type="button" onClick={() => openCategoryPath(["purpose-certification"])}>考试资料</button>
        </div>
      </section>

      <section className="home-primary" aria-label="首页主要入口">
        <button className="home-primary-card" type="button" onClick={() => go("resources")}>
          <span className="home-icon"><BookOpen size={30} aria-hidden="true" /></span>
          <div className="home-primary-copy">
            <h2>找学习资料</h2>
            <p>课程、教材与学习材料</p>
            <div className="home-tags"><span>初中</span><span>高中</span><span>大学</span></div>
            <span className="home-cta">去找资料 <span aria-hidden="true">→</span></span>
          </div>
        </button>
        <button className="home-primary-card" type="button" onClick={() => go("tools")}>
          <span className="home-icon"><Grid2X2 size={30} aria-hidden="true" /></span>
          <div className="home-primary-copy">
            <h2>使用学习工具</h2>
            <p>识别文字、整理文件、打印分享</p>
            <div className="home-tags"><span>文字识别</span><span>PDF 处理</span><span>图片工具</span></div>
            <span className="home-cta">打开工具箱 <span aria-hidden="true">→</span></span>
          </div>
        </button>
      </section>

        <section className="home-updates" aria-labelledby="home-updates-title">
          <div className="home-section-heading">
            <h2 id="home-updates-title">最近更新</h2>
            <button type="button" onClick={() => go("resources")}>查看全部 <span aria-hidden="true">→</span></button>
          </div>
          <div className="home-update-list">
            {resources.slice(0, 5).map((resource,index) => (
              <button
                className="home-update-row"
                key={resource.id}
                onClick={() => detail(resource)}
              >
                <span className="home-update-number" aria-hidden="true">{String(index+1).padStart(2,"0")}</span>
                <span className="home-update-title">{resource.title}</span>
                <time dateTime={resource.meta}>{resource.meta}</time>
                <span className="home-update-arrow" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
        <section className="home-tools" aria-labelledby="home-tools-title">
          <div className="home-section-heading">
            <h2 id="home-tools-title">顺手的学习工具</h2>
            <button type="button" onClick={() => go("tools")}>查看全部工具 <span aria-hidden="true">→</span></button>
          </div>
          <div className="home-tool-grid">
            {shortcuts.map(({ key, title, description, Icon }) => (
              <button className="home-tool-card" type="button" key={key} onClick={() => go(key)}>
                <span className="home-icon"><Icon size={25} aria-hidden="true" /></span>
                <span><strong>{title}</strong><small>{description}</small></span>
              </button>
            ))}
          </div>
        </section>
    </div>
  );
}
function Detail({
  resource,
  go,
  favorite,
  onToggleFavorite,
}: {
  resource: Resource;
  go: (p: Page) => void;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <section className="page-section detail-page">
      <button className="back-button" onClick={() => go("resources")}>
        ← 返回资料
      </button>
      <span className="tag">{resource.tag}</span>
      <h1>{resource.title}</h1>
      <p className="detail-date">{resource.meta}</p>
      <button className="detail-favorite" aria-pressed={favorite} onClick={onToggleFavorite}>{favorite ? "★ 已收藏" : "☆ 收藏资料"}</button>
      <article>
        <p>{resource.description || "暂无公开描述。"}</p>
        <PublicDeliveryPanel resource={resource} />
      </article>
    </section>
  );
}
function Placeholder({ page }: { page: Page }) {
  const item = nav.find((n) => n.key === page);
  return (
    <section className="placeholder page-section">
      <span
        className={`placeholder-icon nav-art nav-art-${item?.art}`}
        aria-hidden="true"
      />
      <p className="kicker">COMING SOON</p>
      <h1>{item?.label}</h1>
      <p className="page-lead">这个空间正在整理中，后续会逐步开放。</p>
    </section>
  );
}
function Footer({ go }: { go: (p: Page) => void }) {
  return (
    <footer>
      <div className="footer-brand">
        <span className="brand-leaf">⌁</span>
        <b>昭文馆</b>
        <span>整理知识，让学习更简单。</span>
      </div>
      <nav>
        <button onClick={() => go("about")}>关于本站</button>
        <button onClick={() => go("guide")}>使用说明</button>
        <button onClick={() => go("disclaimer")}>免责声明</button>
        <button onClick={() => go("contact")}>联系我们</button>
      </nav>
    </footer>
  );
}
function MobileBottomNav({ page, go }: { page: Page; go: (p: Page) => void }) {
  const activePage = page === "detail" || page === "juniorCourses" || page === "seniorCourses"
    ? "resources"
    : toolKeys.includes(page as ToolKey)
    ? "tools"
    : page;
  return (
    <nav className="mobile-bottom-nav" aria-label="移动底部导航">
      {nav.filter((item) => item.key !== "skill-growth").map((item) => (
        <button
          key={item.key}
          className={activePage === item.key ? "active" : ""}
          aria-current={activePage === item.key ? "page" : undefined}
          onClick={() => go(item.key)}
        >
          <span>{item.key === "tools" ? "工具" : item.label}</span>
        </button>
      ))}
    </nav>
  );
}
export default App;
