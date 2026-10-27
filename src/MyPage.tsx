import { useRef, useState, type ChangeEvent } from "react";
import { Bookmark, Clock3, Download, Info, MessageSquare, Moon, Settings, Sun, Wrench } from "lucide-react";
import type { Resource } from "./resources";
import { toolCatalog } from "./toolCatalog";
import { MAX_IMPORT_BYTES, emptyMyData, mergeMyData, validateMyData, type MyData } from "./myData";
import { mySections, type MySection } from "./mySections";
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from "./publicContact";

const labels: Record<MySection, string> = { overview: "个人概览", favorites: "我的收藏", history: "最近浏览", downloads: "下载记录", tools: "我的工具", settings: "使用设置", feedback: "意见反馈", about: "关于网站" };
const icons = { overview: Info, favorites: Bookmark, history: Clock3, downloads: Download, tools: Wrench, settings: Settings, feedback: MessageSquare, about: Info };

type Props = {
  section: MySection;
  data: MyData;
  setData: (updater: (current: MyData) => MyData) => void;
  resources: readonly Resource[];
  onSection: (section: MySection) => void;
  onResource: (resource: Resource) => void;
  onTool: (id: string) => void;
  onHome: () => void;
};

const formatTime = (value: string) => new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export function MyPage(props: Props) {
  const { section, onSection } = props;
  return <section className="my-page">
    <div className="my-layout">
      <aside className="my-sidebar" aria-label="我的页面导航">
        <div className="my-sidebar-head"><div><p className="kicker">MY LIBRARY</p><h1>{section === "overview" ? "我的" : labels[section]}</h1><small>数据仅保存在当前浏览器</small></div>{section !== "overview" && <button onClick={() => onSection("overview")}>← 返回</button>}</div>
        <nav>{mySections.map(key => { const Icon = icons[key]; return <button key={key} className={section === key ? "active" : ""} onClick={() => onSection(key)}><Icon size={17}/><span>{labels[key]}</span></button> })}</nav>
      </aside>
      <div className="my-content">{renderSection(props)}</div>
    </div>
  </section>;
}

function renderSection(props: Props) {
  switch (props.section) {
    case "favorites": return <Favorites {...props}/>;
    case "history": return <History {...props}/>;
    case "downloads": return <Downloads {...props}/>;
    case "tools": return <FavoriteTools {...props}/>;
    case "settings": return <DataSettings {...props}/>;
    case "feedback": return <Feedback/>;
    case "about": return <About version={__APP_VERSION__}/>;
    default: return <Overview {...props}/>;
  }
}

function SectionHead({ title, text }: { title: string; text: string }) { return <header className="my-section-head"><h2>{title}</h2><p>{text}</p></header> }
function Empty({ text, action, onClick }: { text: string; action: string; onClick: () => void }) { return <div className="my-empty"><p>{text}</p><button onClick={onClick}>{action}　→</button></div> }
function validResource(resource: Resource | undefined) { return !!resource && resource.publicationStatus !== "withdrawn" && resource.isPubliclyAccessible !== false }

function Overview(props: Props) {
  const favorites = props.data.favorites.map(item => ({ ...item, resource: props.resources.find(r => r.id === item.id) })).slice(0, 3);
  const tools = props.data.favoriteTools.map(item => ({ ...item, tool: toolCatalog.find(t => t.id === item.id) })).slice(0, 4);
  return <><SectionHead title="个人概览" text="收藏、浏览与常用工具都只保存在这台设备的当前浏览器中。"/>
    <div className="my-stats">{[["收藏", props.data.favorites.length], ["最近浏览", props.data.recentViews.length], ["常用工具", props.data.favoriteTools.length]].map(([label, value]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}</div>
    <div className="my-overview-grid"><section className="my-panel"><div className="my-panel-title"><h3>最近收藏</h3><button onClick={() => props.onSection("favorites")}>查看全部</button></div>{favorites.length ? favorites.map(({ id, at, resource }) => <button className="my-row" key={id} disabled={!validResource(resource)} onClick={() => resource && props.onResource(resource)}><span><b>{resource?.title ?? `已失效资料（${id}）`}</b><small>{validResource(resource) ? formatTime(at) : "资料已下架或不可访问"}</small></span><i>→</i></button>) : <Empty text="还没有收藏资料。" action="去找资料" onClick={props.onHome}/>}</section>
    <section className="my-panel"><div className="my-panel-title"><h3>常用工具</h3><button onClick={() => props.onSection("tools")}>查看全部</button></div>{tools.length ? tools.map(({ id, tool }) => <button className="my-row" key={id} disabled={!tool?.available} onClick={() => tool && props.onTool(tool.id)}><span><b>{tool?.name ?? `已失效工具（${id}）`}</b><small>{tool?.available ? "本地处理工具" : "工具暂不可用"}</small></span><i>→</i></button>) : <Empty text="还没有常用工具。" action="去工具箱" onClick={() => props.onTool("")}/>}</section></div>
    <div className="my-mobile-functions"><h3>我的内容</h3>{(["favorites", "history", "downloads", "tools"] as MySection[]).map(key => <button key={key} onClick={() => props.onSection(key)}>{labels[key]}<span>›</span></button>)}<h3>更多服务</h3>{(["settings", "feedback", "about"] as MySection[]).map(key => <button key={key} onClick={() => props.onSection(key)}>{labels[key]}<span>›</span></button>)}</div>
  </>;
}

function Favorites(props: Props) { return <><SectionHead title="我的收藏" text="按收藏时间倒序排列；失效资料会保留记录，方便识别。"/>{props.data.favorites.length ? <div className="my-list">{props.data.favorites.map(item => { const resource = props.resources.find(r => r.id === item.id); const valid = validResource(resource); return <article className="my-list-item" key={item.id}><div><h3>{resource?.title ?? `已失效资料（${item.id}）`}</h3><p>{valid ? `收藏于 ${formatTime(item.at)}` : "资料已下架、删除或不可访问"}</p></div><div><button disabled={!valid} onClick={() => resource && props.onResource(resource)}>查看</button><button onClick={() => props.setData(data => ({ ...data, favorites: data.favorites.filter(x => x.id !== item.id) }))}>取消收藏</button></div></article> })}</div> : <Empty text="收藏夹还是空的。" action="去找资料" onClick={props.onHome}/>}</> }

function History(props: Props) { const clear = () => { if (confirm("清空全部最近浏览记录？此操作无法撤销。")) props.setData(data => ({ ...data, recentViews: [] })) }; return <><SectionHead title="最近浏览" text="仅记录实际打开过的资料详情，同一资料再次访问会更新时间，最多保留 50 条。"/>{props.data.recentViews.length > 0 && <button className="my-danger-link" onClick={clear}>清空全部</button>}<RecordList items={props.data.recentViews} resources={props.resources} onOpen={props.onResource} onRemove={id => props.setData(data => ({ ...data, recentViews: data.recentViews.filter(x => x.id !== id) }))} empty={<Empty text="还没有浏览记录。" action="去找资料" onClick={props.onHome}/>}/></> }

function RecordList({ items, resources, onOpen, onRemove, empty }: { items: { id: string; at: string }[]; resources: readonly Resource[]; onOpen: (r: Resource) => void; onRemove: (id: string) => void; empty: React.ReactNode }) { if (!items.length) return empty; return <div className="my-list">{items.map(item => { const resource = resources.find(r => r.id === item.id); const valid = validResource(resource); return <article className="my-list-item" key={item.id}><div><h3>{resource?.title ?? `已失效资料（${item.id}）`}</h3><p>{valid ? formatTime(item.at) : "资料已下架、删除或不可访问"}</p></div><div><button disabled={!valid} onClick={() => resource && onOpen(resource)}>查看</button><button onClick={() => onRemove(item.id)}>删除</button></div></article>})}</div> }

function Downloads(props: Props) { const clear = () => { if (confirm("清空全部下载发起记录？此操作无法撤销。")) props.setData(data => ({ ...data, downloads: [] })) }; return <><SectionHead title="下载记录" text="这里只记录资料目录发起下载的动作，不包含学生工具生成的文件，也不代表浏览器一定已成功保存文件。"/>{props.data.downloads.length ? <><button className="my-danger-link" onClick={clear}>清空全部</button><div className="my-list">{props.data.downloads.map(item => { const resource = props.resources.find(r => r.id === item.id); return <article className="my-list-item" key={item.recordId}><div><h3>{item.title}</h3><p>{formatTime(item.at)} · 已发起 · {item.source}</p></div><div><button disabled={!validResource(resource)} onClick={() => resource && props.onResource(resource)}>访问原资料</button><button onClick={() => props.setData(data => ({ ...data, downloads: data.downloads.filter(x => x.recordId !== item.recordId) }))}>删除</button></div></article> })}</div></> : <Empty text="尚无资料下载发起记录。" action="去找资料" onClick={props.onHome}/>}</> }

function FavoriteTools(props: Props) { return <><SectionHead title="我的工具" text="将常用工具固定在这里，顺序按添加时间排列。"/>{props.data.favoriteTools.length ? <div className="my-tool-grid">{props.data.favoriteTools.map(item => { const tool = toolCatalog.find(t => t.id === item.id); return <article key={item.id}><Wrench size={20}/><h3>{tool?.name ?? `已失效工具（${item.id}）`}</h3><p>{tool?.available ? "可用" : "工具暂不可用"}</p><div><button disabled={!tool?.available} onClick={() => tool && props.onTool(tool.id)}>进入</button><button onClick={() => props.setData(data => ({ ...data, favoriteTools: data.favoriteTools.filter(x => x.id !== item.id) }))}>移除</button></div></article> })}</div> : <Empty text="还没有添加常用工具。" action="去工具箱" onClick={() => props.onTool("")}/>}</> }

function DataSettings(props: Props) {
  const input = useRef<HTMLInputElement>(null); const [message, setMessage] = useState("");
  const exportData = () => { const blob = new Blob([JSON.stringify(props.data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `zhaowenguan-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); setMessage("备份文件已发起下载。") };
  const importData = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; try { if (file.size > MAX_IMPORT_BYTES) throw new Error("文件超过 1 MB 限制"); const incoming = validateMyData(JSON.parse(await file.text())); const merge = confirm("选择“确定”合并数据；选择“取消”将进入覆盖确认。"); if (merge) props.setData(current => mergeMyData(current, incoming)); else if (confirm("确定覆盖当前所有“我的”本地数据？此操作无法撤销。")) props.setData(() => incoming); else return; setMessage("导入完成。"); } catch (error) { setMessage(error instanceof Error ? error.message : "导入失败") } };
  const clearCategory = (key: "favorites" | "recentViews" | "downloads" | "favoriteTools", label: string) => { if (confirm(`确定清空${label}？此操作无法撤销。`)) props.setData(data => ({ ...data, [key]: [] })) };
  return <><SectionHead title="使用设置" text="主题和个人数据保存在浏览器中；清理站点数据可能导致它们丢失。"/><section className="my-settings-card"><h3>外观</h3><div className="theme-choice"><button className={props.data.theme === "light" ? "active" : ""} onClick={() => props.setData(data => ({ ...data, theme: "light" }))}><Sun size={18}/>浅色</button><button className={props.data.theme === "dark" ? "active" : ""} onClick={() => props.setData(data => ({ ...data, theme: "dark" }))}><Moon size={18}/>深色</button></div></section>
  <section className="my-settings-card"><h3>备份与恢复</h3><p>JSON 备份只包含本模块数据，不包含文件内容或反馈联系方式。</p><div className="my-actions"><button onClick={exportData}>导出 JSON</button><button onClick={() => input.current?.click()}>导入 JSON</button><input ref={input} hidden type="file" accept="application/json,.json" onChange={importData}/></div><p role="status">{message}</p></section>
  <section className="my-settings-card"><h3>清理数据</h3><div className="my-clear-grid"><button onClick={() => clearCategory("favorites", "收藏")}>清空收藏</button><button onClick={() => clearCategory("recentViews", "最近浏览")}>清空浏览</button><button onClick={() => clearCategory("downloads", "下载记录")}>清空下载</button><button onClick={() => clearCategory("favoriteTools", "常用工具")}>清空工具</button><button className="danger" onClick={() => { if (confirm("确定清空全部“我的”数据和主题偏好？此操作无法撤销。")) props.setData(() => emptyMyData()) }}>清空全部</button></div></section></>;
}

function Feedback() { return <><SectionHead title="意见反馈" text="当前项目未接入真实反馈接收服务，因此表单提交暂不可用。"/><div className="my-notice"><h3>在线提交尚未配置</h3><p>为避免让你的反馈悄悄丢失，本站不会伪装提交成功。启用在线表单仍需配置服务端接口、存储、节流与隐私说明。</p></div><form className="my-feedback" onSubmit={event => event.preventDefault()}><label>问题类型<select disabled><option>功能建议</option><option>资料问题</option><option>使用故障</option></select></label><label>反馈内容<textarea disabled rows={6} placeholder="在线反馈服务配置后开放"/></label><label>联系方式（可选）<input disabled/></label><label><input type="checkbox" disabled/> 附上当前页面链接</label><button disabled>暂未配置提交服务</button></form><p className="my-email">也可发送邮件至 <a href={PUBLIC_CONTACT_MAILTO} aria-label={`发送邮件至项目联系邮箱 ${PUBLIC_CONTACT_EMAIL}`}>{PUBLIC_CONTACT_EMAIL}</a>。请勿提供密码、身份证号等敏感信息。</p></> }
function About({ version }: { version: string }) { return <><SectionHead title="关于网站" text="昭文馆希望把实用学习资源和本地处理工具安静地放在一起。"/><div className="my-about"><h3>使用说明</h3><p>无需登录即可浏览资料、使用工具和保存个人偏好。收藏、浏览、下载发起记录及常用工具仅保存在当前浏览器，不会自动跨设备同步。</p><h3>本地数据与隐私</h3><p>导出备份不包含上传文件的内容，也不包含反馈联系方式。清理浏览器站点数据会删除本地记录。</p><h3>版本</h3><p>{version === "0.0.0" ? "项目尚未发布正式版本（package.json：0.0.0）" : `v${version}`}</p></div></> }

declare const __APP_VERSION__: string;
