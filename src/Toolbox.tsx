import { useToolTask, toolEditKind } from "./useToolTask";
import { usePdfCanvas } from "./usePdfCanvas";
import { useMemo, useRef, useState } from "react";
import { PDFDocument, PageSizes } from "pdf-lib";
import JSZip from "jszip";
import { createImageArchive } from "./imageArchive";
import { validateImageContent } from "./imageValidation";
import {
  ArrowDownToLine,
  FileImage,
  FileOutput,
  Files,
  Image,
  Images,
  LayoutGrid,
  LockKeyhole,
  Search,
  Scissors,
  Upload,
  X,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "./Toolbox.css";
import {
  ImageFormatConvertTool,
  ImageResizeTool,
  ImageSheetLayoutTool,
  PdfPageOrganizerTool,
  PdfToImagesTool,
  PrintPageAdjustTool,
} from "./ToolboxPhase2";
import { OcrTool, PdfCompressTool } from "./ToolboxPhase3";
import { PdfPageNumberAsyncTool, PdfWatermarkAsyncTool } from "./PdfAsyncTools";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type ToolKey =
  | "nup"
  | "merge"
  | "split"
  | "images-to-pdf"
  | "image-compress"
  | "print-page-adjust"
  | "image-sheet-layout"
  | "pdf-page-organizer"
  | "pdf-to-images"
  | "image-format-convert"
  | "image-resize"
  | "pdf-compress"
  | "ocr"
  | "page-number"
  | "watermark";
type Category = "全部" | "打印排版" | "PDF 文档" | "图片处理" | "学习资料";
type Tool = {
  key: string;
  name: string;
  description: string;
  category: Exclude<Category, "全部">;
  ready: boolean;
  icon: typeof Files;
};
type GoTool = (tool?: ToolKey) => void;
type PdfItem = { file: File; pages: number };

const tools: Tool[] = [
  {
    key: "nup",
    name: "PDF 拼版打印",
    description: "多页内容拼到一张纸上",
    category: "打印排版",
    ready: true,
    icon: LayoutGrid,
  },
  {
    key: "print-page-adjust",
    name: "打印页面调整",
    description: "调整页面方向与打印范围",
    category: "打印排版",
    ready: true,
    icon: FileOutput,
  },
  {
    key: "image-sheet-layout",
    name: "图片批量排版",
    description: "多张图片整理排版",
    category: "打印排版",
    ready: true,
    icon: Images,
  },
  {
    key: "pdf-page-organizer",
    name: "PDF 页面整理",
    description: "重排、旋转或删除页面",
    category: "打印排版",
    ready: true,
    icon: Files,
  },
  {
    key: "merge",
    name: "PDF 合并",
    description: "多个 PDF 合并为一个文件",
    category: "PDF 文档",
    ready: true,
    icon: Files,
  },
  {
    key: "split",
    name: "PDF 拆分",
    description: "按页码或份数拆分文件",
    category: "PDF 文档",
    ready: true,
    icon: Scissors,
  },
  {
    key: "pdf-compress",
    name: "PDF 压缩",
    description: "尽量减小 PDF 文件体积",
    category: "PDF 文档",
    ready: true,
    icon: ArrowDownToLine,
  },
  {
    key: "images-to-pdf",
    name: "图片转 PDF",
    description: "多张图片合成为 PDF",
    category: "PDF 文档",
    ready: true,
    icon: FileImage,
  },
  {
    key: "pdf-to-images",
    name: "PDF 转图片",
    description: "将 PDF 页面导出为图片",
    category: "PDF 文档",
    ready: true,
    icon: Image,
  },
  {
    key: "image-compress",
    name: "图片压缩",
    description: "缩小图片体积并预览效果",
    category: "图片处理",
    ready: true,
    icon: Images,
  },
  {
    key: "image-format-convert",
    name: "图片格式转换",
    description: "转换 JPG、PNG、WebP",
    category: "图片处理",
    ready: true,
    icon: FileImage,
  },
  {
    key: "image-resize",
    name: "图片尺寸调整",
    description: "批量修改宽度和高度",
    category: "图片处理",
    ready: true,
    icon: Image,
  },
  {
    key: "ocr",
    name: "OCR 文字识别",
    description: "从图片和扫描件提取文字",
    category: "学习资料",
    ready: true,
    icon: Search,
  },
  {
    key: "page-number",
    name: "PDF 添加页码",
    description: "为文档批量添加页码",
    category: "学习资料",
    ready: true,
    icon: FileOutput,
  },
  {
    key: "watermark",
    name: "PDF 添加文字水印",
    description: "添加文字水印",
    category: "学习资料",
    ready: true,
    icon: LockKeyhole,
  },
];

const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const download = (
  bytes: Uint8Array | Blob,
  name: string,
  type = "application/pdf",
) => {
  const blob =
    bytes instanceof Blob ? bytes : new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const loadPdf = async (file: File) =>
  PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });

export function Toolbox({ openTool, favoriteToolIds = [], onToggleFavorite }: { openTool: GoTool; favoriteToolIds?: string[]; onToggleFavorite?: (id: ToolKey) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("全部");
  const visible = tools.filter(
    (tool) =>
      (category === "全部" || tool.category === category) &&
      `${tool.name}${tool.description}`.includes(query.trim()),
  );
  const favoriteTools = tools.filter((tool) => favoriteToolIds.includes(tool.key));
  return (
    <section className="toolbox-page">
      <header className="toolbox-hero">
        <p className="toolbox-eyebrow">STUDENT TOOLBOX</p>
        <h1>学生工具箱</h1>
        <p>文件在浏览器本地处理，不会上传到外部服务器。</p>
        <div className="privacy-chips">
          <span>无需登录</span>
          <span>基础工具免费</span>
          <span>本地处理</span>
        </div>
      </header>
      <div className="tool-search">
        <Search size={19} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索工具名称或用途…"
          aria-label="搜索工具"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="清除搜索">
            <X size={17} />
          </button>
        )}
      </div>
      {favoriteTools.length > 0 && (
        <section className="featured-tools">
          <div className="section-heading">
            <div>
              <span>01</span>
              <h2>常用工具</h2>
            </div>
            <p>你已添加的常用工具</p>
          </div>
          <div className="featured-grid">
            {favoriteTools.map((tool) => (
              <ToolCard key={tool.key} tool={tool} openTool={openTool} favorite onToggleFavorite={onToggleFavorite} />
            ))}
          </div>
        </section>
      )}
      <section>
        <div className="section-heading">
          <div>
            <span>{favoriteTools.length > 0 ? "02" : "01"}</span>
            <h2>全部工具</h2>
          </div>
          <p>共 15 个，按用途筛选</p>
        </div>
        <div className="tool-filters" role="group" aria-label="工具分类">
          {(
            [
              "全部",
              "打印排版",
              "PDF 文档",
              "图片处理",
              "学习资料",
            ] as Category[]
          ).map((item) => (
            <button
              className={category === item ? "active" : ""}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="all-tools-grid">
          {visible.map((tool) => (
            <ToolCard key={tool.key} tool={tool} openTool={openTool} compact favorite={favoriteToolIds.includes(tool.key)} onToggleFavorite={onToggleFavorite} />
          ))}
        </div>
        {visible.length === 0 && (
          <div className="tool-empty">
            没有找到匹配的工具，请换个关键词试试。
          </div>
        )}
      </section>
    </section>
  );
}

function ToolCard({
  tool,
  openTool,
  compact = false,
  favorite = false,
  onToggleFavorite,
}: {
  tool: Tool;
  openTool: GoTool;
  compact?: boolean;
  favorite?: boolean;
  onToggleFavorite?: (id: ToolKey) => void;
}) {
  const Icon = tool.icon;
  return (
    <article className={`tool-card-shell ${favorite ? "favorite" : ""}`}>
    <button className={`tool-card ${compact ? "compact" : ""} ${!tool.ready ? "disabled" : ""}`} onClick={() => tool.ready && openTool(tool.key as ToolKey)} disabled={!tool.ready}>
      <span className="tool-icon">
        <Icon size={compact ? 22 : 26} />
      </span>
      <span className="tool-card-copy">
        <strong>{tool.name}</strong>
        <small>{tool.description}</small>
      </span>
      {tool.ready ? <em>开始使用</em> : <em>即将上线</em>}
    </button>
    {onToggleFavorite && <button className="tool-favorite-button" aria-label={`${favorite ? "取消常用" : "添加常用"}：${tool.name}`} aria-pressed={favorite} onClick={() => onToggleFavorite(tool.key as ToolKey)}>{favorite ? "★" : "☆"}</button>}
    </article>
  );
}

export function ToolDetail({
  tool,
  back,
}: {
  tool: ToolKey;
  back: () => void;
}) {
  const content =
    tool === "nup" ? (
      <NupTool />
    ) : tool === "merge" ? (
      <MergeTool />
    ) : tool === "split" ? (
      <SplitTool />
    ) : tool === "images-to-pdf" ? (
      <ImagesToPdfTool />
    ) : tool === "image-compress" ? (
      <ImageCompressTool />
    ) : tool === "print-page-adjust" ? (
      <PrintPageAdjustTool />
    ) : tool === "image-sheet-layout" ? (
      <ImageSheetLayoutTool />
    ) : tool === "pdf-page-organizer" ? (
      <PdfPageOrganizerTool />
    ) : tool === "pdf-to-images" ? (
      <PdfToImagesTool />
    ) : tool === "image-format-convert" ? (
      <ImageFormatConvertTool />
    ) : tool === "pdf-compress" ? (
      <PdfCompressTool />
    ) : tool === "ocr" ? (
      <OcrTool />
    ) : tool === "page-number" ? (
      <PdfPageNumberAsyncTool />
    ) : tool === "watermark" ? (
      <PdfWatermarkAsyncTool />
    ) : (
      <ImageResizeTool />
    );
  const meta = tools.find((item) => item.key === tool)!;
  return (
    <section className="tool-detail">
      <header className="tool-detail-header">
        <button onClick={back}>← 返回工具箱</button>
        <div>
          <h1>{meta.name}</h1>
          <p>{meta.description}。处理过程仅在当前浏览器中完成。</p>
        </div>
        <span>本地处理 · 不上传文件</span>
      </header>
      {content}
    </section>
  );
}

function DropZone({
  accept,
  multiple,
  onFiles,
  label,
}: {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const pick = (list: FileList | null) => list && onFiles(Array.from(list));
  return (
    <div
      className="drop-zone"
      onClick={() => input.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        pick(e.dataTransfer.files);
      }}
      role="button"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          input.current?.click();
        }
      }}
    >
      <Upload size={27} />
      <strong>{label}</strong>
      <span>点击选择或拖拽文件到这里</span>
      <input
        ref={input}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(e) => { const files = e.target.files; if (files?.length) pick(files); e.target.value = ""; }}
      />
    </div>
  );
}
function Message({
  text,
  kind = "info",
}: {
  text: string;
  kind?: "info" | "error" | "success";
}) {
  const urgent = kind === "error" || /失败|错误|损坏|无法|无效|请选择|不能|超出/.test(text);
  const resolvedKind = urgent ? "error" : kind;
  return text ? <p className={`tool-message ${resolvedKind}`} role={urgent ? "alert" : "status"} aria-live={urgent ? "assertive" : "polite"}>{text}</p> : null;
}
function Panel({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="tool-panel">
      <h2>
        <span>{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
function FileRow({
  item,
  onRemove,
  index,
}: {
  item: PdfItem;
  onRemove: () => void;
  index?: number;
}) {
  return (
    <div className="file-row">
      {index !== undefined && <b>{index + 1}</b>}
      <FileOutput size={21} />
      <span>
        <strong>{item.file.name}</strong>
        <small>
          {item.pages} 页 · {formatBytes(item.file.size)}
        </small>
      </span>
      <button onClick={onRemove} aria-label={`移除 ${item.file.name}`}>
        <X size={17} />
      </button>
    </div>
  );
}

function PdfPreview({ file, page = 1 }: { file?: File; page?: number }) { const { canvas, error } = usePdfCanvas(file, page); return <div className="pdf-preview">{file ? <>{error && <Message text={error} kind="error" />}<canvas ref={canvas} /></> : <div className="preview-empty"><FileOutput size={40} /><p>上传文件后在这里预览</p></div>}</div>; }

async function parsePdfFiles(files: File[]) {
  const result: PdfItem[] = [];
  for (const file of files) {
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    )
      throw new Error(`${file.name} 不是 PDF 文件`);
    const doc = await loadPdf(file);
    result.push({ file, pages: doc.getPageCount() });
  }
  return result;
}

function MergeTool() {
  const tasks = useToolTask();
  const resetOutput = (force = false) => { const changed = tasks.invalidate(force); if (changed) { setBusy(false); setMessage(""); } };

  const [items, setItems] = useState<PdfItem[]>([]);
  const [name, setName] = useState("合并文件.pdf");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async (files: File[]) => {
    if (tasks.inputBusy()) { setMessage("正在读取当前批次，请稍候再添加。"); return; }
    const taskId = tasks.start("input"); if (taskId === undefined) return;
    setBusy(false);
    const setItemsCurrent: typeof setItems = value => { if (tasks.valid(taskId)) setItems(value); };
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    try {

      try {
        const parsed = await parsePdfFiles(files);
        setItemsCurrent((v) => [...v, ...parsed]);
        setMessageCurrent("");
      } catch {
        setMessageCurrent("文件可能已损坏或受密码保护，无法读取。");
      }

    } finally { tasks.finish(taskId); }
  };
  const move = (i: number, delta: number) =>
    setItems((v) => {
      const n = i + delta;
      if (n < 0 || n >= v.length) return v;
      const copy = [...v];
      [copy[i], copy[n]] = [copy[n], copy[i]];
      return copy;
    });
  const run = async () => {
    const taskId = tasks.start("run"); if (taskId === undefined) return;
    const setBusyCurrent: typeof setBusy = value => { if (tasks.valid(taskId)) setBusy(value); };
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    const downloadCurrent = (...args: Parameters<typeof download>) => { if (tasks.valid(taskId)) download(...args); };
    try {

      setBusyCurrent(true);
      setMessageCurrent("正在合并…");
      try {
        const out = await PDFDocument.create();
        if (!tasks.valid(taskId)) return;
        for (const item of items) {
          const src = await loadPdf(item.file);
          if (!tasks.valid(taskId)) return;
          const pages = await out.copyPages(src, src.getPageIndices());
          if (!tasks.valid(taskId)) return;
          pages.forEach((p) => out.addPage(p));
        }
        downloadCurrent(
          await out.save(),
          name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`,
        );
        if (!tasks.valid(taskId)) return;
        setMessageCurrent("合并完成，文件已开始下载。");
      } catch {
        setMessageCurrent("合并失败：请检查文件是否损坏或受密码保护。");
      } finally {
        setBusyCurrent(false);
      }

    } finally { tasks.finish(taskId); }
  };
  return (
    <div className="tool-workspace" onChangeCapture={event => { if ((event.target as HTMLInputElement).type !== "file") resetOutput(); }} onClickCapture={event => { const edit = toolEditKind(event.target); if (edit) resetOutput(edit === "source"); }} onDropCapture={() => resetOutput(true)}>
      <div className="tool-controls">
        <Panel step={1} title="添加 PDF">
          <DropZone
            accept="application/pdf"
            multiple
            label="选择多个 PDF 文件"
            onFiles={add}
          />
          {items.map((item, i) => (
            <div className="sortable-row" key={`${item.file.name}-${i}`}>
              <FileRow
                item={item}
                index={i}
                onRemove={() => setItems((v) => v.filter((_, n) => n !== i))}
              />
              <div>
                <button disabled={i === 0} onClick={() => move(i, -1)}>
                  上移
                </button>
                <button
                  disabled={i === items.length - 1}
                  onClick={() => move(i, 1)}
                >
                  下移
                </button>
              </div>
            </div>
          ))}
        </Panel>
        <Panel step={2} title="合并设置">
          <label>
            输出文件名
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="stat-line">
            <span>文件数量</span>
            <b>{items.length} 个</b>
          </div>
          <div className="stat-line">
            <span>合计页数</span>
            <b>{items.reduce((sum, i) => sum + i.pages, 0)} 页</b>
          </div>
          <button
            className="primary-action"
            disabled={tasks.busy || (busy || items.length < 2)}
            onClick={run}
          >
            {busy ? "处理中…" : "合并并下载 PDF"}
          </button>
          <Message
            text={message}
            kind={
              message.includes("完成")
                ? "success"
                : message.includes("失败")
                  ? "error"
                  : "info"
            }
          />
        </Panel>
      </div>
      <Panel step={3} title="文件预览">
        <PdfPreview file={items[0]?.file} />
        <p className="preview-note">
          当前预览第一个文件；合并将严格按照左侧列表顺序执行。
        </p>
      </Panel>
    </div>
  );
}

const parseRanges = (input: string, total: number) => {
  const groups: number[][] = [];
  const used = new Set<number>();
  for (const raw of input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)) {
    const match = raw.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error(`“${raw}”格式不正确`);
    const start = Number(match[1]),
      end = Number(match[2] || match[1]);
    if (start < 1 || end > total || start > end)
      throw new Error(`“${raw}”超出 1–${total} 页范围`);
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    if (pages.some((p) => used.has(p)))
      throw new Error(`“${raw}”与已有范围重叠`);
    pages.forEach((p) => used.add(p));
    groups.push(pages);
  }
  if (!groups.length) throw new Error("请至少输入一个页码范围");
  return groups;
};

const defaultSplitRange = (pages: number) => {
  if (pages <= 1) return "1";
  if (pages <= 3) return `1-${pages}`;
  if (pages < 6) return `1-3, 4-${pages}`;
  return "1-3, 4-6";
};

function SplitTool() {
  const tasks = useToolTask();
  const resetOutput = (force = false) => { const changed = tasks.invalidate(force); if (changed) setMessage(""); };

  const [item, setItem] = useState<PdfItem>();
  const [mode, setMode] = useState<"range" | "count" | "single">("range");
  const [range, setRange] = useState("1-3, 4-6");
  const [count, setCount] = useState(5);
  const [message, setMessage] = useState("");
  const groups = useMemo(() => {
    if (!item) return [];
    try {
      if (mode === "range") return parseRanges(range, item.pages);
      if (mode === "single")
        return Array.from({ length: item.pages }, (_, i) => [i + 1]);
      return Array.from(
        { length: Math.ceil(item.pages / Math.max(1, count)) },
        (_, i) =>
          Array.from(
            { length: Math.min(count, item.pages - i * count) },
            (__, j) => i * count + j + 1,
          ),
      );
    } catch {
      return [];
    }
  }, [item, mode, range, count]);
  const add = async (files: File[]) => {
    const taskId = tasks.start("input"); if (taskId === undefined) return;
    setItem(undefined);
    setMessage("正在读取 PDF…原文件已取消选择。");
    const setItemCurrent: typeof setItem = value => { if (tasks.valid(taskId)) setItem(value); };
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    try {

      try {
        const next = (await parsePdfFiles(files.slice(0, 1)))[0];
        setItemCurrent(next);
        if (tasks.valid(taskId)) setRange(defaultSplitRange(next.pages));
        setMessageCurrent("");
      } catch {
        setMessageCurrent("无法读取该 PDF，原文件已取消选择，请重新选择有效 PDF。");
      }

    } finally { tasks.finish(taskId); }
  };
  const run = async () => {
    const taskId = tasks.start("run"); if (taskId === undefined) return;
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    const downloadCurrent = (...args: Parameters<typeof download>) => { if (tasks.valid(taskId)) download(...args); };
    try {

      if (!item) return;
      try {
        let sets = groups;
        if (mode === "range") sets = parseRanges(range, item.pages);
        const src = await loadPdf(item.file);
        if (!tasks.valid(taskId)) return;
        const outputs: { name: string; bytes: Uint8Array }[] = [];
        for (let i = 0; i < sets.length; i++) {
          const out = await PDFDocument.create();
          if (!tasks.valid(taskId)) return;
          (
            await out.copyPages(
              src,
              sets[i].map((p) => p - 1),
            )
          ).forEach((p) => out.addPage(p));
          if (!tasks.valid(taskId)) return;
          outputs.push({
            name: `${item.file.name.replace(/\.pdf$/i, "")}_${i + 1}.pdf`,
            bytes: await out.save(),
          });
          if (!tasks.valid(taskId)) return;
        }
        if (outputs.length === 1) downloadCurrent(outputs[0].bytes, outputs[0].name);
        else {
          const zip = new JSZip();
          outputs.forEach((o) => zip.file(o.name, o.bytes));
          downloadCurrent(
            await zip.generateAsync({ type: "blob" }),
            `${item.file.name.replace(/\.pdf$/i, "")}_拆分.zip`,
            "application/zip",
          );
          if (!tasks.valid(taskId)) return;
        }
        setMessageCurrent(`已生成 ${outputs.length} 个真实文件并开始下载。`);
      } catch (e) {
        setMessageCurrent(e instanceof Error ? e.message : "拆分失败，请重试。");
      }

    } finally { tasks.finish(taskId); }
  };
  return (
    <div className="tool-workspace" onChangeCapture={event => { if ((event.target as HTMLInputElement).type !== "file") resetOutput(); }} onClickCapture={event => { const edit = toolEditKind(event.target); if (edit) resetOutput(edit === "source"); }} onDropCapture={() => resetOutput(true)}>
      <div className="tool-controls">
        <Panel step={1} title="选择 PDF">
          <DropZone
            accept="application/pdf"
            label="选择一个 PDF 文件"
            onFiles={add}
          />
          {item && <FileRow item={item} onRemove={() => setItem(undefined)} />}
        </Panel>
        <Panel step={2} title="拆分方式">
          <div className="choice-list">
            {[
              ["range", "指定页码范围"],
              ["count", "每 N 页一份"],
              ["single", "每页一份"],
            ].map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  checked={mode === value}
                  onChange={() => setMode(value as typeof mode)}
                />
                {label}
              </label>
            ))}
          </div>
          {mode === "range" && (
            <label>
              页码范围
              <input
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="例如 1-10, 15-20"
              />
            </label>
          )}
          {mode === "count" && (
            <label>
              每份页数
              <input
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
              />
            </label>
          )}
          <div className="result-list">
            {groups.slice(0, 8).map((g, i) => (
              <span key={i}>
                文件 {i + 1} · {g.length} 页（{g[0]}–{g.at(-1)}）
              </span>
            ))}
            {groups.length > 8 && <span>另有 {groups.length - 8} 个文件</span>}
          </div>
          <button
            className="primary-action"
            disabled={tasks.busy || (!item || !groups.length)}
            onClick={run}
          >
            {groups.length > 1 ? "生成并下载 ZIP" : "生成并下载 PDF"}
          </button>
          <Message
            text={message}
            kind={
              message.startsWith("已生成")
                ? "success"
                : message
                  ? "error"
                  : "info"
            }
          />
        </Panel>
      </div>
      <Panel step={3} title="原文件预览">
        <PdfPreview file={item?.file} />
      </Panel>
    </div>
  );
}

function NupTool() {
  const tasks = useToolTask();
  const resetOutput = (force = false) => { const changed = tasks.invalidate(force); if (changed) setMessage(""); };

  const [item, setItem] = useState<PdfItem>();
  const [perPage, setPerPage] = useState(4);
  const [landscape, setLandscape] = useState(true);
  const [preset, setPreset] = useState("课件省纸");
  const [message, setMessage] = useState("");
  const add = async (files: File[]) => {
    const taskId = tasks.start("input"); if (taskId === undefined) return;
    setItem(undefined);
    setMessage("正在读取 PDF…原文件已取消选择。");
    const setItemCurrent: typeof setItem = value => { if (tasks.valid(taskId)) setItem(value); };
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    try {

      try {
        setItemCurrent((await parsePdfFiles(files.slice(0, 1)))[0]);
        setMessageCurrent("");
      } catch {
        setMessageCurrent("无法读取该 PDF，原文件已取消选择，请重新选择有效 PDF。");
      }

    } finally { tasks.finish(taskId); }
  };
  const applyPreset = (name: string) => {
    setPreset(name);
    if (name === "课件省纸") {
      setPerPage(4);
      setLandscape(true);
    } else if (name === "清晰阅读") {
      setPerPage(2);
      setLandscape(true);
    } else {
      setPerPage(1);
      setLandscape(false);
    }
  };
  const run = async () => {
    const taskId = tasks.start("run"); if (taskId === undefined) return;
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    const downloadCurrent = (...args: Parameters<typeof download>) => { if (tasks.valid(taskId)) download(...args); };
    try {

      if (!item) return;
      setMessageCurrent("正在生成…");
      try {
        const src = await loadPdf(item.file);
        if (!tasks.valid(taskId)) return;
        const out = await PDFDocument.create();
        if (!tasks.valid(taskId)) return;
        const embedded = await out.embedPages(src.getPages());
        if (!tasks.valid(taskId)) return;
        const base = landscape
          ? [PageSizes.A4[1], PageSizes.A4[0]]
          : PageSizes.A4;
        const cols = Math.ceil(Math.sqrt(perPage * (base[0] / base[1])));
        const rows = Math.ceil(perPage / cols);
        for (let start = 0; start < embedded.length; start += perPage) {
          const page = out.addPage(base as [number, number]);
          for (let i = 0; i < perPage && start + i < embedded.length; i++) {
            const pdfPage = embedded[start + i];
            const cellW = (base[0] - 32) / cols,
              cellH = (base[1] - 32) / rows;
            const scale = Math.min(
              (cellW - 12) / pdfPage.width,
              (cellH - 12) / pdfPage.height,
            );
            const x =
              16 + (i % cols) * cellW + (cellW - pdfPage.width * scale) / 2;
            const y =
              base[1] -
              16 -
              (Math.floor(i / cols) + 1) * cellH +
              (cellH - pdfPage.height * scale) / 2;
            page.drawPage(pdfPage, { x, y, xScale: scale, yScale: scale });
          }
        }
        downloadCurrent(
          await out.save(),
          `${item.file.name.replace(/\.pdf$/i, "")}_拼版.pdf`,
        );
        if (!tasks.valid(taskId)) return;
        setMessageCurrent("拼版完成，文件已开始下载。");
      } catch {
        setMessageCurrent("生成失败，请检查文件后重试。");
      }

    } finally { tasks.finish(taskId); }
  };
  const outputPages = item ? Math.ceil(item.pages / perPage) : 0;
  return (
    <div className="tool-workspace" onChangeCapture={event => { if ((event.target as HTMLInputElement).type !== "file") resetOutput(); }} onClickCapture={event => { const edit = toolEditKind(event.target); if (edit) resetOutput(edit === "source"); }} onDropCapture={() => resetOutput(true)}>
      <div className="tool-controls">
        <Panel step={1} title="上传 PDF">
          <DropZone
            accept="application/pdf"
            label="选择一个 PDF 文件"
            onFiles={add}
          />
          {item && <FileRow item={item} onRemove={() => setItem(undefined)} />}
        </Panel>
        <Panel step={2} title="打印设置">
          <div className="preset-row">
            {["课件省纸", "清晰阅读", "普通打印"].map((p) => (
              <button
                className={preset === p ? "active" : ""}
                onClick={() => applyPreset(p)}
                key={p}
              >
                {p}
              </button>
            ))}
          </div>
          <label>
            每张纸的页面数
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPreset("自定义");
              }}
            >
              {[1, 2, 4, 6, 9].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <div className="choice-list horizontal">
            <label>
              <input
                type="radio"
                checked={!landscape}
                onChange={() => {
                  setLandscape(false);
                  setPreset("自定义");
                }}
              />
              纵向
            </label>
            <label>
              <input
                type="radio"
                checked={landscape}
                onChange={() => {
                  setLandscape(true);
                  setPreset("自定义");
                }}
              />
              横向
            </label>
          </div>
          <div className="stats-grid">
            <span>
              原始页数<b>{item?.pages || 0}</b>
            </span>
            <span>
              拼版页数<b>{outputPages}</b>
            </span>
            <span>
              预计纸张<b>{outputPages}</b>
            </span>
            <span>
              双面纸张<b>{Math.ceil(outputPages / 2)}</b>
            </span>
          </div>
          <p className="helper-text">
            双面打印需在系统打印窗口中手动选择，网页无法替你控制物理打印机。
          </p>
          <button className="primary-action" disabled={tasks.busy || (!item)} onClick={run}>
            生成可打印 PDF
          </button>
          <Message
            text={message}
            kind={
              message.includes("完成")
                ? "success"
                : message.includes("失败")
                  ? "error"
                  : "info"
            }
          />
        </Panel>
      </div>
      <Panel step={3} title="原文件预览">
        <PdfPreview file={item?.file} />
        <p className="preview-note">
          当前预览原文件第一页；下载文件会按左侧设置真实拼版。
        </p>
      </Panel>
    </div>
  );
}

type ImageItem = { file: File; url: string };
type ImageValidationResult =
  | { ok: true; file: File }
  | { ok: false; error: string };
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const validateImageItems = async (files: File[]) => {
  const checked: ImageValidationResult[] = await Promise.all(files.map(async file => {
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      return { ok: false, error: `${file.name}：请选择 JPG、PNG 或 WebP 图片` };
    }
    try {
      await validateImageContent(file);
      return { ok: true, file };
    } catch {
      return { ok: false, error: `${file.name}：无法读取，文件可能已损坏或格式不受支持` };
    }
  }));
  return {
    files: checked.flatMap(result => result.ok ? [result.file] : []),
    errors: checked.flatMap(result => result.ok ? [] : [result.error]),
  };
};
function ImageGrid({
  items,
  remove,
}: {
  items: ImageItem[];
  remove: (i: number) => void;
}) {
  return (
    <div className="image-file-grid">
      {items.map((item, i) => (
        <div key={`${item.file.name}-${i}`}>
          <img src={item.url} alt="" />
          <button
            onClick={() => remove(i)}
            aria-label={`移除 ${item.file.name}`}
          >
            <X size={15} />
          </button>
          <strong>{item.file.name}</strong>
          <small>{formatBytes(item.file.size)}</small>
        </div>
      ))}
    </div>
  );
}
async function normalizedImage(file: File, quality = 0.9, type = "image/jpeg") {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  if (type === "image/jpeg") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("图片处理失败"))),
      type,
      quality,
    ),
  );
}

function ImagesToPdfTool() {
  const tasks = useToolTask();
  const resetOutput = (force = false) => { const changed = tasks.invalidate(force); if (changed) setMessage(""); };

  const [items, setItems] = useState<ImageItem[]>([]);
  const [paper, setPaper] = useState<"A4" | "A5" | "原图尺寸">("A4");
  const [fit, setFit] = useState<"contain" | "cover">("contain");
  const [message, setMessage] = useState("");
  const add = async (files: File[]) => {
    resetOutput(true);
    const taskId = tasks.start("input"); if (taskId === undefined) return;
    setMessage("正在验证图片…");
    try {
      const checked = await validateImageItems(files);
      if (!tasks.valid(taskId)) return;
      const next = checked.files.map(file => ({ file, url: URL.createObjectURL(file) }));
      if (next.length) setItems(value => [...value, ...next]);
      setMessage(checked.errors.length ? `${checked.errors.join("；")}。已跳过无法读取的文件。` : "");
    } finally { tasks.finish(taskId); }
  };
  const run = async () => {
    const taskId = tasks.start("run"); if (taskId === undefined) return;
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    const downloadCurrent = (...args: Parameters<typeof download>) => { if (tasks.valid(taskId)) download(...args); };
    try {

      try {
        setMessageCurrent("正在生成…");
        const out = await PDFDocument.create();
        if (!tasks.valid(taskId)) return;
        for (const item of items) {
          const blob = await normalizedImage(item.file, 0.94, "image/jpeg");
          if (!tasks.valid(taskId)) return;
          const bytes = await blob.arrayBuffer();
          if (!tasks.valid(taskId)) return;
          const embedded = await out.embedJpg(bytes);
          if (!tasks.valid(taskId)) return;
          const size =
            paper === "A5"
              ? [419.53, 595.28]
              : paper === "A4"
                ? PageSizes.A4
                : [embedded.width, embedded.height];
          const page = out.addPage(size as [number, number]);
          const margin = paper === "原图尺寸" ? 0 : 28;
          const scale =
            fit === "contain"
              ? Math.min(
                (size[0] - margin * 2) / embedded.width,
                (size[1] - margin * 2) / embedded.height,
              )
              : Math.max(
                (size[0] - margin * 2) / embedded.width,
                (size[1] - margin * 2) / embedded.height,
              );
          page.drawImage(embedded, {
            x: (size[0] - embedded.width * scale) / 2,
            y: (size[1] - embedded.height * scale) / 2,
            width: embedded.width * scale,
            height: embedded.height * scale,
          });
        }
        downloadCurrent(await out.save(), "图片合集.pdf");
        if (!tasks.valid(taskId)) return;
        setMessageCurrent("PDF 已真实生成并开始下载。");
      } catch (error) {
        setMessageCurrent(error instanceof Error ? `生成失败：${error.message}` : "生成失败，请重试。");
      }

    } finally { tasks.finish(taskId); }
  };
  return (
    <div className="tool-workspace" onChangeCapture={event => { if ((event.target as HTMLInputElement).type !== "file") resetOutput(); }} onClickCapture={event => { const edit = toolEditKind(event.target); if (edit) resetOutput(edit === "source"); }} onDropCapture={() => resetOutput(true)}>
      <div className="tool-controls">
        <Panel step={1} title="添加图片">
          <DropZone
            accept="image/jpeg,image/png,image/webp"
            multiple
            label="选择 JPG、PNG 或 WebP"
            onFiles={add}
          />
          <ImageGrid
            items={items}
            remove={(i) => setItems((v) => v.filter((_, n) => n !== i))}
          />
        </Panel>
        <Panel step={2} title="页面设置">
          <label>
            纸张大小
            <select
              value={paper}
              onChange={(e) => setPaper(e.target.value as typeof paper)}
            >
              <option>A4</option>
              <option>A5</option>
              <option>原图尺寸</option>
            </select>
          </label>
          <label>
            图片适应方式
            <select
              value={fit}
              onChange={(e) => setFit(e.target.value as typeof fit)}
            >
              <option value="contain">完整显示并保留留白</option>
              <option value="cover">铺满页面并允许裁切</option>
            </select>
          </label>
          <p className="helper-text">
            默认一张图片一页；透明区域会以白色背景导出，并读取图片方向信息。
          </p>
          <button
            className="primary-action"
            disabled={tasks.busy || (!items.length)}
            onClick={run}
          >
            生成并下载 PDF
          </button>
          <Message
            text={message}
            kind={
              message.includes("已真实")
                ? "success"
                : message.includes("失败") || message.includes("无法读取") || message.includes("请选择")
                  ? "error"
                  : "info"
            }
          />
        </Panel>
      </div>
      <Panel step={3} title="页面预览">
        <div className="image-preview">
          {items[0] ? (
            <img src={items[0].url} alt="第一页预览" className={fit} />
          ) : (
            <div className="preview-empty">
              <FileImage size={40} />
              <p>添加图片后在这里预览</p>
            </div>
          )}
        </div>
        <p className="preview-note">预览第 1 页，共 {items.length} 页。</p>
      </Panel>
    </div>
  );
}

type Compressed = {
  name: string;
  before: number;
  after: number;
  url: string;
  blob: Blob;
  saved: number;
};
function ImageCompressTool() {
  const tasks = useToolTask();
  const resetOutput = (force = false) => { const changed = tasks.invalidate(force); setResults([]); if (changed) setMessage(""); };

  const [items, setItems] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<"image/jpeg" | "image/webp">(
    "image/jpeg",
  );
  const [results, setResults] = useState<Compressed[]>([]);
  const [message, setMessage] = useState("");
  const add = async (files: File[]) => {
    resetOutput(true);
    const taskId = tasks.start("input"); if (taskId === undefined) return;
    setMessage("正在验证图片…");
    try {
      const checked = await validateImageItems(files);
      if (!tasks.valid(taskId)) return;
      const next = checked.files.map(file => ({ file, url: URL.createObjectURL(file) }));
      if (next.length) setItems(value => [...value, ...next]);
      setResults([]);
      setMessage(checked.errors.length ? `${checked.errors.join("；")}。已跳过无法读取的文件。` : "");
    } finally { tasks.finish(taskId); }
  };
  const run = async () => {
    const taskId = tasks.start("run"); if (taskId === undefined) return;
    setResults([]);
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    const setResultsCurrent: typeof setResults = value => { if (tasks.valid(taskId)) setResults(value); };
    try {

      try {
        setMessageCurrent("正在压缩…");
        const output = [];
        for (const item of items) {
          const blob = await normalizedImage(item.file, quality / 100, format);
          if (!tasks.valid(taskId)) return;
          output.push({
            name: `${item.file.name.replace(/\.[^.]+$/, "")}.${format === "image/webp" ? "webp" : "jpg"}`,
            before: item.file.size,
            after: blob.size,
            url: URL.createObjectURL(blob),
            blob,
            saved: Math.round((1 - blob.size / item.file.size) * 100),
          });
        }
        setResultsCurrent(output);
        setMessageCurrent(
          output.some((r) => r.saved <= 0)
            ? "处理完成；部分文件没有变小，已如实标注。"
            : "压缩完成，可下载真实结果。",
        );
      } catch (error) {
        setMessageCurrent(error instanceof Error ? `压缩失败：${error.message}` : "压缩失败，请重试。");
      }

    } finally { tasks.finish(taskId); }
  };
  const save = async () => {
    const taskId = tasks.start("run"); if (taskId === undefined) return; const downloadCurrent = (...args: Parameters<typeof download>) => { if (tasks.valid(taskId)) download(...args); }; try {
      if (results.length === 1)
        downloadCurrent(results[0].blob, results[0].name, format);
      else {
        const zip = createImageArchive(results.map(result => ({ name: result.name, data: result.blob })));
        downloadCurrent(
          await zip.generateAsync({ type: "blob" }),
          "压缩图片.zip",
          "application/zip",
        );
      }
    } catch { if (tasks.valid(taskId)) setMessage("打包失败，请重试。"); } finally { tasks.finish(taskId); }
  };
  return (
    <div className="tool-workspace" onChangeCapture={event => { if ((event.target as HTMLInputElement).type !== "file") resetOutput(); }} onClickCapture={event => { const edit = toolEditKind(event.target); if (edit) resetOutput(edit === "source"); }} onDropCapture={() => resetOutput(true)}>
      <div className="tool-controls">
        <Panel step={1} title="添加图片">
          <DropZone
            accept="image/jpeg,image/png,image/webp"
            multiple
            label="选择需要压缩的图片"
            onFiles={add}
          />
          <ImageGrid
            items={items}
            remove={(i) => {
              setItems((v) => v.filter((_, n) => n !== i));
              setResults([]);
            }}
          />
        </Panel>
        <Panel step={2} title="压缩设置">
          <label>
            压缩质量 <b>{quality}%</b>
            <input
              type="range"
              min="35"
              max="95"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />
          </label>
          <label>
            输出格式
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as typeof format)}
            >
              <option value="image/jpeg">JPG（透明区域变白）</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>
          <button
            className="primary-action"
            disabled={tasks.busy || (!items.length)}
            onClick={run}
          >
            开始压缩图片
          </button>
          <Message
            text={message}
            kind={
              message.includes("完成")
                ? "success"
                : message.includes("失败") || message.includes("无法读取") || message.includes("请选择")
                  ? "error"
                  : "info"
            }
          />
          {results.length > 0 && (
            <button className="secondary-action" onClick={save}>
              {results.length === 1 ? "下载压缩图片" : "打包下载 ZIP"}
            </button>
          )}
        </Panel>
      </div>
      <Panel step={3} title="效果与结果">
        <div className="compress-results">
          {results.length ? (
            results.map((r) => (
              <div className="compress-row" key={r.url}>
                <img src={r.url} alt="压缩后预览" />
                <span>
                  <strong>{r.name}</strong>
                  <small>
                    {formatBytes(r.before)} → {formatBytes(r.after)}
                  </small>
                </span>
                <b className={r.saved > 0 ? "good" : "warn"}>
                  {r.saved > 0 ? `节省 ${r.saved}%` : "未变小"}
                </b>
              </div>
            ))
          ) : (
            <div className="preview-empty">
              <Images size={40} />
              <p>压缩后会显示真实大小和节省比例</p>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
