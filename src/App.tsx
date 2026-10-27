import { useEffect, useState } from "react";
import "./index.css";
import heroWatercolor from "./assets/zhaowenguan-hero-watercolor.png";
import categoryStrip from "./assets/zhaowenguan-category-strip.png";
import assistantCat from "./assets/zhaowenguan-assistant-cat.png";
import { InfoPage, type InfoPageKey } from "./InfoPages";
import { Toolbox, ToolDetail, type ToolKey } from "./Toolbox";
import { appPathFromLocation, locationPathForAppPath } from "./routing";
import type { Resource } from "./resources";
import { usePublicCatalog } from "./publicCatalog";
import { isPublishedPublicResource } from "./categoryCounts";
import { PublicDeliveryPanel, PublicDetail } from "./PublicDetail";
import { getChildCategories } from "./categories";
import { CategoriesPage } from "./CategoriesPage";
import { categoryBrowseLocation } from "./categoryRouting";
import { ResourcesPage } from "./ResourcesPage";
import { MyPage } from "./MyPage";
import { mySections, type MySection } from "./mySections";
import { loadMyData, recordRecent, saveMyData, toggleTimed, type MyData } from "./myData";

type Page =
  | "home"
  | "resources"
  | "detail"
  | "categories"
  | "tools"
  | "profile"
  | ToolKey
  | InfoPageKey;
const nav = [
  { key: "home", label: "首页", art: "books" },
  { key: "resources", label: "找资料", art: "open-book" },
  { key: "categories", label: "分类", art: "graduate" },
  { key: "tools", label: "学习工具", art: "scroll" },
  { key: "profile", label: "我的", art: "cat" },
] as const;
const topLevelCategories = getChildCategories(null);
const paths: Record<Page, string> = {
  home: "/",
  resources: "/resources",
  detail: "/detail",
  categories: "/categories",
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
  const publicResources = resources.filter((resource) => isPublishedPublicResource(resource));
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
  const detail = (resource: Resource) => {
    setSelected(resource.id);
    updateMyData(data => ({ ...data, recentViews: recordRecent(data.recentViews, resource.id) }));
    openLocation("detail", locationPathForAppPath(`/detail?id=${encodeURIComponent(resource.id)}`));
  };
  const toggleFavorite = (id: string) => updateMyData(data => ({ ...data, favorites: toggleTimed(data.favorites, id) }));
  const toggleTool = (id: string) => updateMyData(data => ({ ...data, favoriteTools: toggleTimed(data.favoriteTools, id) }));
  const openProfile = (section: MySection) => { setProfileSection(section); openLocation("profile", locationPathForAppPath(`/profile/${section}`)) };
  const isInfoPage = infoPages.includes(page as InfoPageKey);
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
        {catalog.status && ["home","categories","profile"].includes(page) && <p role="status">{catalog.status}</p>}
        {page === "home" && (
          <Home
            go={go}
            resources={publicResources}
            detail={detail}
            openCategory={(categoryId) =>
              openLocation("categories", categoryBrowseLocation(categoryId))
            }
          />
        )}
        {page === "resources" && <ResourcesPage resourceValues={resources} catalogPhase={catalog.phase} catalogStatus={catalog.status} detail={detail} favoriteIds={myData.favorites.map(item => item.id)} onToggleFavorite={toggleFavorite} />}
        {page === "categories" && (
          <CategoriesPage
            counts={catalog.counts}
            onHome={() => go("home")}
            onOpenResources={(location) => openLocation("resources", location)}
          />
        )}
        {page === "detail" && <PublicDetail id={selected} resourceValues={resources} catalogPhase={catalog.phase} catalogStatus={catalog.status} render={resource => <Detail resource={resource} go={go} favorite={myData.favorites.some(item => item.id === resource.id)} onToggleFavorite={() => toggleFavorite(resource.id)} />} />}
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
          page !== "categories" &&
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
  setMobileOpen: (v: boolean) => void;
  go: (p: Page) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}) {
  const activePage = page === "detail" ? "resources" : [
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
  ].includes(page)
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
            className="menu-button"
            aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            ☰
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav id="mobile-navigation" className="mobile-menu" aria-label="移动主导航">
          {nav.map((item) => (
            <button
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
  openCategory,
  resources,
}: {
  go: (p: Page) => void;
  detail: (r: Resource) => void;
  openCategory: (categoryId: string) => void;
  resources: readonly Resource[];
}) {
  const [query, setQuery] = useState("");
  const search = (q = query) => { window.history.pushState({}, "", locationPathForAppPath(`/resources?q=${encodeURIComponent(q)}`)); window.dispatchEvent(new PopStateEvent("popstate")); };
  return (
    <>
      <section
        className="home-hero"
        style={
          { "--hero-image": `url(${heroWatercolor})` } as React.CSSProperties
        }
      >
        <div className="hero-content">
          <h1>昭文馆</h1>
          <p className="motto">钻石不过是一块坚持到底的煤炭</p>
          <div className="search-wrap">
            <span>⌕</span>
            <input aria-label="搜索学习资料" placeholder="搜索你需要的学习资料..." value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key === "Enter") search();}} />
            <button onClick={()=>search()}>搜索</button>
          </div>
          <div className="hot-search">
            <b>热门搜索：</b>
            {[
              "中考真题",
              "高考真题",
              "大学课程",
              "四级真题",
              "计算机二级",
              "考研资料",
            ].map((s) => (
              <button key={s} onClick={()=>search(s)}>{s}</button>
            ))}
          </div>
        </div>
      </section>
      <section className="content-section">
        <div className="entrance-grid">
          {topLevelCategories.map((category, index) => (
            <button
              className="entrance"
              key={category.id}
              onClick={() => openCategory(category.id)}
            >
              <span
                className={`category-art category-art-${index}`}
                style={
                  {
                    "--category-image": `url(${categoryStrip})`,
                  } as React.CSSProperties
                }
                aria-hidden="true"
              />
              <strong>{category.name}</strong>
              <i>›</i>
            </button>
          ))}
        </div>
        <section className="updates-panel">
          <div className="panel-title">
            <h2>
              <span className="leaf-mark" />
              最近更新
            </h2>
            <button onClick={() => go("resources")}>查看全部更新　→</button>
          </div>
          <div className="updates-grid">
            {resources.map((resource,index) => (
              <button
                className="update-row"
                key={resource.id}
                onClick={() => detail(resource)}
              >
                <b>{String(index+1).padStart(2,"0")}</b>
                <span>{resource.title}</span>
                <time>{resource.meta}</time>
                <i>→</i>
              </button>
            ))}
          </div>
        </section>
        <section className="assistant-card">
          <div className="assistant-icon" aria-hidden="true" />
          <div>
            <h2>学习助手</h2>
            <p id="learning-assistant-status">学习助手暂未开放，敬请期待。</p>
          </div>
          <button disabled aria-describedby="learning-assistant-status">学习助手 · 暂未开放</button>
          <img className="assistant-cat" src={assistantCat} alt="水彩小白猫" />
        </section>
      </section>
    </>
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
  const activePage = page === "detail" ? "resources" : [
    "nup",
    "merge",
    "split",
    "images-to-pdf",
    "image-compress",
    "print-page-adjust",
    "image-sheet-layout",
    "pdf-page-organizer",
    "pdf-to-images",
    "image-format-convert",
    "image-resize",
  ].includes(page)
    ? "tools"
    : page;
  return (
    <nav className="mobile-bottom-nav" aria-label="移动底部导航">
      {nav.map((item) => (
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
