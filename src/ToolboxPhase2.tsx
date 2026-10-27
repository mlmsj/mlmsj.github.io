import { useToolTask, toolEditKind } from "./useToolTask";
import { usePdfCanvas } from "./usePdfCanvas";
import { useMemo, useRef, useState } from "react";
import { PDFDocument, PageSizes, degrees } from "pdf-lib";
import JSZip from "jszip";
import { createImageArchive } from "./imageArchive";
import {
  FileImage,
  FileOutput,
  Images,
  RotateCcw,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type PdfItem = { file: File; pages: number };
type ImageItem = { file: File; url: string; width: number; height: number };
type ResultImage = {
  name: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  before: number;
};

const fmt = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const save = (
  value: Uint8Array | Blob,
  name: string,
  type = "application/pdf",
) => {
  const blob =
    value instanceof Blob ? value : new Blob([value as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};
const readPdf = async (file: File) =>
  PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
const readPdfItem = async (file: File): Promise<PdfItem> => {
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  )
    throw new Error("请选择 PDF 文件");
  const doc = await readPdf(file);
  return { file, pages: doc.getPageCount() };
};
const imageTypeOk = (file: File) =>
  ["image/jpeg", "image/png", "image/webp"].includes(file.type);
const readImages = async (files: File[]) => {
  const output: ImageItem[] = [];
  try {
    for (const file of files) {
      if (!imageTypeOk(file)) throw new Error("请选择 JPG、PNG 或 WebP 图片。");
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      try { output.push({ file, url: URL.createObjectURL(file), width: bitmap.width, height: bitmap.height }); } finally { bitmap.close(); }
    }
    return output;
  } catch (error) { output.forEach(item => URL.revokeObjectURL(item.url)); throw error; }
};
const toBlob = async (
  file: File,
  options: {
    type: string;
    quality?: number;
    width?: number;
    height?: number;
    cropRatio?: number;
    background?: string;
  },
) => {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  let sx = 0,
    sy = 0,
    sw = bitmap.width,
    sh = bitmap.height;
  if (options.cropRatio) {
    const current = sw / sh;
    if (current > options.cropRatio) {
      sw = sh * options.cropRatio;
      sx = (bitmap.width - sw) / 2;
    } else {
      sh = sw / options.cropRatio;
      sy = (bitmap.height - sh) / 2;
    }
  }
  const width = Math.round(options.width ?? sw);
  const height = Math.round(options.height ?? sh);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width * height > 60_000_000) { bitmap.close(); throw new Error("输出宽高必须是正整数，且总像素不能超过 6000 万。"); }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  if (options.background || options.type === "image/jpeg") {
    ctx.fillStyle = options.background || "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  bitmap.close();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("图片处理失败"))),
      options.type,
      options.quality ?? 0.9,
    ),
  );
};

function Drop({
  accept,
  multiple,
  label,
  onFiles,
}: {
  accept: string;
  multiple?: boolean;
  label: string;
  onFiles: (files: File[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const apply = (list: FileList | null) => list && onFiles(Array.from(list));
  return (
    <div
      className="drop-zone"
      role="button"
      aria-label={label}
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          input.current?.click();
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        apply(e.dataTransfer.files);
      }}
    >
      <Upload size={27} />
      <strong>{label}</strong>
      <span>点击选择或拖拽文件到这里</span>
      <input
        ref={input}
        hidden
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => { const files = e.target.files; if (files?.length) apply(files); e.target.value = ""; }}
      />
    </div>
  );
}
function Panel({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="tool-panel">
      <h2>
        <span>{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
function Notice({ text }: { text: string }) {
  const error = /失败|错误|损坏|无法|无效|请选择|不能|超出/.test(text);
  const role = error ? "alert" : "status";
  return text ? (
    <p
      className={`tool-message ${/完成|已生成|已转换|已调整/.test(text) ? "success" : error ? "error" : "info"}`}
      role={role}
      aria-live={error ? "assertive" : "polite"}
    >
      {text}
    </p>
  ) : null;
}
function PdfFile({ item, clear }: { item?: PdfItem; clear: () => void }) {
  return item ? (
    <div className="file-row">
      <FileOutput size={21} />
      <span>
        <strong>{item.file.name}</strong>
        <small>
          {item.pages} 页 · {fmt(item.file.size)}
        </small>
      </span>
      <button onClick={clear} aria-label="移除文件">
        <X size={17} />
      </button>
    </div>
  ) : null;
}
function ImageFiles({
  items,
  remove,
  move,
}: {
  items: ImageItem[];
  remove: (i: number) => void;
  move?: (from: number, to: number) => void;
}) {
  return (
    <div className="phase2-images">
      {items.map((item, i) => (
        <article
          key={`${item.file.name}-${i}`}
          draggable={Boolean(move)}
          onDragStart={(event) =>
            event.dataTransfer.setData("text/plain", String(i))
          }
          onDragOver={(event) => move && event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const from = Number(event.dataTransfer.getData("text/plain"));
            if (move && Number.isInteger(from) && from !== i) move(from, i);
          }}
        >
          <img src={item.url} alt="" />
          <div>
            <strong>{item.file.name}</strong>
            <small>
              {item.width} × {item.height} · {fmt(item.file.size)}
            </small>
          </div>
          <button
            onClick={() => remove(i)}
            aria-label={`移除 ${item.file.name}`}
          >
            <X size={15} />
          </button>
          {move && (
            <footer>
              <button disabled={i === 0} onClick={() => move(i, i - 1)}>
                上移
              </button>
              <button
                disabled={i === items.length - 1}
                onClick={() => move(i, i + 1)}
              >
                下移
              </button>
            </footer>
          )}
        </article>
      ))}
    </div>
  );
}

function PdfCanvas({ file, page = 1, scale = 1.05, className = "" }: { file?: File; page?: number; scale?: number; className?: string }) { const { canvas, error } = usePdfCanvas(file, page, scale); return <div className={`pdf-preview ${className}`}>{file ? <>{error && <Notice text={error} />}<canvas ref={canvas} /></> : <div className="preview-empty"><FileOutput size={40} /><p>上传文件后在这里预览</p></div>}</div>; }
function PdfThumb({ file, page, rotation = 0 }: { file: File; page: number; rotation?: number }) { const { canvas } = usePdfCanvas(file, page, .22, rotation); return <canvas ref={canvas} />; }

const pageSize = (paper: "A4" | "A5" | "Letter", landscape: boolean) => {
  const base =
    paper === "A5"
      ? PageSizes.A5
      : paper === "Letter"
        ? PageSizes.Letter
        : PageSizes.A4;
  return landscape
    ? ([base[1], base[0]] as [number, number])
    : (base as [number, number]);
};

export const IMAGE_SHEET_GAP_MIN = 0;
export const IMAGE_SHEET_GAP_MAX = 40;
export const IMAGE_SHEET_GAP_ERROR = "图片间距无效：必须是 0 至 40 mm 之间的有限数字。";

export const parseImageSheetGap = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= IMAGE_SHEET_GAP_MIN && value <= IMAGE_SHEET_GAP_MAX
      ? value
      : undefined;
  }
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed >= IMAGE_SHEET_GAP_MIN && parsed <= IMAGE_SHEET_GAP_MAX
    ? parsed
    : undefined;
};

export function PrintPageAdjustTool() {
  const tasks = useToolTask();
  const resetOutput = (force = false) => { const changed = tasks.invalidate(force); if (changed) setMessage(""); };

  const [item, setItem] = useState<PdfItem>();
  const [paper, setPaper] = useState<"A4" | "A5" | "Letter">("A4");
  const [landscape, setLandscape] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [margins, setMargins] = useState({
    top: 15,
    right: 15,
    bottom: 15,
    left: 15,
  });
  const [center, setCenter] = useState(true);
  const [fit, setFit] = useState(true);
  const [mode, setMode] = useState<"original" | "adjusted">("original");
  const [message, setMessage] = useState("");
  const load = async (files: File[]) => {
    const taskId = tasks.start("input"); if (taskId === undefined) return;
    setItem(undefined);
    setMessage("正在读取 PDF…原文件已取消选择。");
    const setItemCurrent: typeof setItem = value => { if (tasks.valid(taskId)) setItem(value); };
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    try {

      try {
        setItemCurrent(await readPdfItem(files[0]));
        setMessageCurrent("");
      } catch {
        setMessageCurrent("无法读取该 PDF，文件可能损坏或受密码保护。原文件已取消选择，请重新选择有效 PDF。");
      }

    } finally { tasks.finish(taskId); }
  };
  const reset = () => {
    setPaper("A4");
    setLandscape(false);
    setZoom(100);
    setMargins({ top: 15, right: 15, bottom: 15, left: 15 });
    setCenter(true);
    setFit(true);
  };
  const run = async () => {
    const taskId = tasks.start("run"); if (taskId === undefined) return;
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    const saveCurrent = (...args: Parameters<typeof save>) => { if (tasks.valid(taskId)) save(...args); };
    try {

      if (!item) return;
      try {
        setMessageCurrent("正在生成调整后的 PDF…");
        const src = await readPdf(item.file);
        if (!tasks.valid(taskId)) return;
        const out = await PDFDocument.create();
        if (!tasks.valid(taskId)) return;
        const embedded = await out.embedPages(src.getPages());
        if (!tasks.valid(taskId)) return;
        const size = pageSize(paper, landscape);
        for (const p of embedded) {
          const page = out.addPage(size);
          const top = margins.top * 2.8346,
            right = margins.right * 2.8346;
          const bottom = margins.bottom * 2.8346,
            left = margins.left * 2.8346;
          const availableWidth = Math.max(10, size[0] - left - right);
          const availableHeight = Math.max(10, size[1] - top - bottom);
          const base = fit
            ? Math.min(availableWidth / p.width, availableHeight / p.height)
            : 1;
          const scale = Math.max(0.1, (base * zoom) / 100);
          const x = center ? left + (availableWidth - p.width * scale) / 2 : left;
          const y = center
            ? bottom + (availableHeight - p.height * scale) / 2
            : size[1] - top - p.height * scale;
          page.drawPage(p, { x, y, xScale: scale, yScale: scale });
        }
        saveCurrent(
          await out.save(),
          `${item.file.name.replace(/\.pdf$/i, "")}_页面调整.pdf`,
        );
        if (!tasks.valid(taskId)) return;
        setMessageCurrent("调整完成，PDF 已开始下载。");
      } catch {
        setMessageCurrent("生成失败，请检查参数或文件后重试。");
      }

    } finally { tasks.finish(taskId); }
  };
  return (
    <div className="tool-workspace" onChangeCapture={event => { if ((event.target as HTMLInputElement).type !== "file") resetOutput(); }} onClickCapture={event => { const edit = toolEditKind(event.target); if (edit) resetOutput(edit === "source"); }} onDropCapture={() => resetOutput(true)}>
      <div className="tool-controls">
        <Panel n={1} title="选择 PDF">
          <Drop
            accept="application/pdf"
            label="选择一个 PDF 文件"
            onFiles={load}
          />
          <PdfFile item={item} clear={() => setItem(undefined)} />
        </Panel>
        <Panel n={2} title="页面设置">
          <div className="phase2-grid">
            <label>
              纸张
              <select
                value={paper}
                onChange={(e) => setPaper(e.target.value as typeof paper)}
              >
                <option>A4</option>
                <option>A5</option>
                <option>Letter</option>
              </select>
            </label>
            <label>
              方向
              <select
                value={landscape ? "横向" : "纵向"}
                onChange={(e) => setLandscape(e.target.value === "横向")}
              >
                <option>纵向</option>
                <option>横向</option>
              </select>
            </label>
          </div>
          <label>
            缩放比例 <b>{zoom}%</b>
            <input
              type="range"
              min="30"
              max="160"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </label>
          <div className="margin-grid" aria-label="四边页边距（毫米）">
            {(
              [
                ["top", "上"],
                ["right", "右"],
                ["bottom", "下"],
                ["left", "左"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}边距（mm）
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={margins[key]}
                  onChange={(e) =>
                    setMargins((value) => ({
                      ...value,
                      [key]: Math.max(0, Number(e.target.value)),
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <div className="switch-row">
            <label>
              <input
                type="checkbox"
                checked={center}
                onChange={(e) => setCenter(e.target.checked)}
              />
              内容居中
            </label>
            <label>
              <input
                type="checkbox"
                checked={fit}
                onChange={(e) => setFit(e.target.checked)}
              />
              自动适配页面
            </label>
          </div>
          <div className="action-pair">
            <button className="secondary-action" onClick={reset}>
              重置设置
            </button>
            <button className="primary-action" disabled={tasks.busy || (!item)} onClick={run}>
              生成新的 PDF
            </button>
          </div>
          <p className="helper-text">
            仅调整页面画布与内容位置，不会自动裁除扫描图内部空白，也不改变文字语义。
          </p>
          <Notice text={message} />
        </Panel>
      </div>
      <Panel n={3} title="预览对比">
        <div className="preset-row">
          <button
            className={mode === "original" ? "active" : ""}
            onClick={() => setMode("original")}
          >
            原始页面
          </button>
          <button
            className={mode === "adjusted" ? "active" : ""}
            onClick={() => setMode("adjusted")}
          >
            调整后示意
          </button>
        </div>
        <PdfCanvas
          file={item?.file}
          className={mode === "adjusted" ? "adjusted-preview" : ""}
        />
        <p className="preview-note">
          调整后示意会反映方向、边距和缩放；最终下载由真实 PDF 页面重新生成。
        </p>
      </Panel>
    </div>
  );
}

export function ImageSheetLayoutTool() {
  const tasks = useToolTask();
  const resetOutput = (force = false) => { const changed = tasks.invalidate(force); if (changed) setMessage(""); };

  const [items, setItems] = useState<ImageItem[]>([]);
  const [perPage, setPerPage] = useState(4);
  const [paper, setPaper] = useState<"A4" | "A5">("A4");
  const [landscape, setLandscape] = useState(false);
  const [gapInput, setGapInput] = useState("10");
  const [margin, setMargin] = useState(15);
  const [message, setMessage] = useState("");
  const gap = parseImageSheetGap(gapInput);
  const add = async (files: File[]) => {
    if (tasks.inputBusy()) { setMessage("正在读取当前批次，请稍候再添加。"); return; }
    const taskId = tasks.start("input"); if (taskId === undefined) return;
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    const setItemsCurrent: typeof setItems = value => { if (tasks.valid(taskId)) setItems(value); };
    try {
      try {

        const next = await readImages(files);
        if (!tasks.valid(taskId)) { next.forEach(item => URL.revokeObjectURL(item.url)); return; }
        if (!next.length) setMessageCurrent("请选择 JPG、PNG 或 WebP 图片。");
        else {
          setItemsCurrent((v) => [...v, ...next]);
          setMessageCurrent("");
        }

      } catch { if (tasks.valid(taskId)) setMessage("图片加载失败，文件可能损坏，本批未添加。请选择 JPG、PNG 或 WebP 图片。"); }
    } finally { tasks.finish(taskId); }
  };
  const move = (from: number, to: number) =>
    setItems((v) => {
      if (to < 0 || to >= v.length) return v;
      const copy = [...v];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  const run = async () => {
    const gapValue = parseImageSheetGap(gapInput);
    if (gapValue === undefined) {
      setMessage(IMAGE_SHEET_GAP_ERROR);
      return;
    }
    const taskId = tasks.start("run"); if (taskId === undefined) return;
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    const saveCurrent = (...args: Parameters<typeof save>) => { if (tasks.valid(taskId)) save(...args); };
    try {

      try {
        setMessageCurrent("正在排版…");
        const out = await PDFDocument.create();
        if (!tasks.valid(taskId)) return;
        const size = pageSize(paper, landscape);
        const m = margin * 2.8346,
          g = gapValue * 2.8346;
        const cols = Math.ceil(Math.sqrt(perPage * (size[0] / size[1]))),
          rows = Math.ceil(perPage / cols);
        const cw = (size[0] - m * 2 - g * (cols - 1)) / cols,
          ch = (size[1] - m * 2 - g * (rows - 1)) / rows;
        for (let start = 0; start < items.length; start += perPage) {
          const page = out.addPage(size);
          for (let i = 0; i < perPage && start + i < items.length; i++) {
            const blob = await toBlob(items[start + i].file, {
              type: "image/jpeg",
              quality: 0.94,
              background: "#fff",
            });
            if (!tasks.valid(taskId)) return;
            const image = await out.embedJpg(await blob.arrayBuffer());
            if (!tasks.valid(taskId)) return;
            const scale = Math.min(cw / image.width, ch / image.height);
            const col = i % cols,
              row = Math.floor(i / cols);
            page.drawImage(image, {
              x: m + col * (cw + g) + (cw - image.width * scale) / 2,
              y:
                size[1] -
                m -
                (row + 1) * ch -
                row * g +
                (ch - image.height * scale) / 2,
              width: image.width * scale,
              height: image.height * scale,
            });
          }
        }
        saveCurrent(await out.save(), "图片批量排版.pdf");
        if (!tasks.valid(taskId)) return;
        setMessageCurrent("排版完成，PDF 已开始下载。");
      } catch {
        setMessageCurrent("排版失败，可能是图片过大导致内存不足。");
      }

    } finally { tasks.finish(taskId); }
  };
  return (
    <div className="tool-workspace" onChangeCapture={event => { if ((event.target as HTMLInputElement).type !== "file") resetOutput(); }} onClickCapture={event => { const edit = toolEditKind(event.target); if (edit) resetOutput(edit === "source"); }} onDropCapture={() => resetOutput(true)}>
      <div className="tool-controls">
        <Panel n={1} title="添加图片">
          <Drop
            accept="image/jpeg,image/png,image/webp"
            multiple
            label="选择多张图片"
            onFiles={add}
          />
          <ImageFiles
            items={items}
            remove={(i) => setItems((v) => v.filter((_, n) => n !== i))}
            move={move}
          />
        </Panel>
        <Panel n={2} title="排版设置">
          <label>
            每面图片数量
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              {[1, 2, 4, 6, 9].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <div className="phase2-grid">
            <label>
              纸张
              <select
                value={paper}
                onChange={(e) => setPaper(e.target.value as typeof paper)}
              >
                <option>A4</option>
                <option>A5</option>
              </select>
            </label>
            <label>
              方向
              <select
                value={landscape ? "横向" : "纵向"}
                onChange={(e) => setLandscape(e.target.value === "横向")}
              >
                <option>纵向</option>
                <option>横向</option>
              </select>
            </label>
            <label>
              图片间距（mm）
              <input
                type="number"
                min="0"
                max="40"
                value={gapInput}
                onChange={(e) => setGapInput(e.target.value)}
              />
            </label>
            <label>
              页边距（mm）
              <input
                type="number"
                min="0"
                max="50"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="stats-grid">
            <span>
              图片总数<b>{items.length}</b>
            </span>
            <span>
              输出 PDF 页数<b>{Math.ceil(items.length / perPage)}</b>
            </span>
          </div>
          <button
            className="primary-action"
            disabled={tasks.busy || (!items.length) || gap === undefined}
            onClick={run}
          >
            生成可打印 PDF
          </button>
          <Notice text={gap === undefined ? IMAGE_SHEET_GAP_ERROR : message} />
        </Panel>
      </div>
      <Panel n={3} title="排版预览">
        <div
          className={`sheet-preview ${landscape ? "landscape" : ""}`}
          style={{
            gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(perPage * (landscape ? 1.414 : 0.707)))},1fr)`,
            gap: `${Math.min(gap ?? IMAGE_SHEET_GAP_MIN, 20)}px`,
            padding: `${Math.min(margin, 30)}px`,
          }}
        >
          {items.slice(0, perPage).map((i) => (
            <img key={i.url} src={i.url} alt="" />
          ))}
          {!items.length && (
            <div className="preview-empty">
              <Images size={40} />
              <p>添加图片后显示第一页排版效果</p>
            </div>
          )}
        </div>
        <p className="preview-note">
          按顺序展示第一页，共预计 {Math.ceil(items.length / perPage)}{" "}
          页；触屏可使用上移/下移排序。
        </p>
      </Panel>
    </div>
  );
}

type PageEdit = { source: number; rotation: number; selected: boolean };
export function PdfPageOrganizerTool() {
  const tasks = useToolTask();
  const resetOutput = (force = false) => { const changed = tasks.invalidate(force); if (changed) setMessage(""); };

  const [item, setItem] = useState<PdfItem>();
  const [pages, setPages] = useState<PageEdit[]>([]);
  const [history, setHistory] = useState<PageEdit[][]>([]);
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState("");
  const remember = (next: PageEdit[]) => {
    setHistory((h) => [...h.slice(-9), pages]);
    setPages(next);
  };
  const load = async (files: File[]) => {
    const taskId = tasks.start("input"); if (taskId === undefined) return;
    setItem(undefined);
    setMessage("正在读取 PDF…原文件已取消选择。");
    setPages([]); setHistory([]);
    const setItemCurrent: typeof setItem = value => { if (tasks.valid(taskId)) setItem(value); };
    const setPagesCurrent: typeof setPages = value => { if (tasks.valid(taskId)) setPages(value); };
    const setHistoryCurrent: typeof setHistory = value => { if (tasks.valid(taskId)) setHistory(value); };
    const setActiveCurrent: typeof setActive = value => { if (tasks.valid(taskId)) setActive(value); };
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    try {

      try {
        const next = await readPdfItem(files[0]);
        setItemCurrent(next);
        setPagesCurrent(
          Array.from({ length: next.pages }, (_, i) => ({
            source: i,
            rotation: 0,
            selected: false,
          })),
        );
        setHistoryCurrent([]);
        setActiveCurrent(0);
        setMessageCurrent("");
      } catch {
        setMessageCurrent("无法读取该 PDF，文件可能损坏或受密码保护。原文件已取消选择，请重新选择有效 PDF。");
      }

    } finally { tasks.finish(taskId); }
  };
  const selected = pages
    .map((p, i) => (p.selected ? i : -1))
    .filter((i) => i >= 0);
  const targets = () => (selected.length ? selected : [active]);
  const rotate = () => {
    const ids = targets();
    remember(
      pages.map((p, i) =>
        ids.includes(i) ? { ...p, rotation: (p.rotation + 90) % 360 } : p,
      ),
    );
  };
  const remove = () => {
    const ids = targets();
    if (pages.length - ids.length < 1) {
      setMessage("至少需要保留一页，不能删除全部页面。");
      return;
    }
    remember(pages.filter((_, i) => !ids.includes(i)));
    setActive(0);
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= pages.length) return;
    const next = [...pages];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    remember(next);
    setActive(to);
  };
  const undo = () => {
    const prev = history.at(-1);
    if (!prev) return;
    setPages(prev);
    setHistory((h) => h.slice(0, -1));
    setActive(0);
  };
  const run = async () => {
    const taskId = tasks.start("run"); if (taskId === undefined) return;
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    const saveCurrent = (...args: Parameters<typeof save>) => { if (tasks.valid(taskId)) save(...args); };
    try {

      if (!item) return;
      try {
        const src = await readPdf(item.file);
        if (!tasks.valid(taskId)) return;
        const out = await PDFDocument.create();
        if (!tasks.valid(taskId)) return;
        for (const edit of pages) {
          const [p] = await out.copyPages(src, [edit.source]);
          if (!tasks.valid(taskId)) return;
          p.setRotation(degrees((p.getRotation().angle + edit.rotation) % 360));
          out.addPage(p);
        }
        saveCurrent(
          await out.save(),
          `${item.file.name.replace(/\.pdf$/i, "")}_已整理.pdf`,
        );
        if (!tasks.valid(taskId)) return;
        setMessageCurrent("整理完成，PDF 已开始下载。");
      } catch {
        setMessageCurrent("导出失败，请重试。");
      }

    } finally { tasks.finish(taskId); }
  };
  return (
    <div className="tool-workspace organizer-workspace" onChangeCapture={event => { if ((event.target as HTMLInputElement).type !== "file") resetOutput(); }} onClickCapture={event => { const edit = toolEditKind(event.target); if (edit) resetOutput(edit === "source"); }} onDropCapture={() => resetOutput(true)}>
      <div className="tool-controls">
        <Panel n={1} title="选择 PDF">
          <Drop
            accept="application/pdf"
            label="选择一个 PDF 文件"
            onFiles={load}
          />
          <PdfFile
            item={item}
            clear={() => {
              setItem(undefined);
              setPages([]);
            }}
          />
        </Panel>
        <Panel n={2} title="页面操作">
          <div className="organizer-actions">
            <button onClick={rotate} disabled={!pages.length}>
              <RotateCcw size={16} />
              旋转
            </button>
            <button onClick={remove} disabled={!pages.length}>
              <Trash2 size={16} />
              删除
            </button>
            <button onClick={undo} disabled={!history.length}>
              <Undo2 size={16} />
              撤销
            </button>
          </div>
          <p className="helper-text">
            点击缩略图切换预览；勾选后可批量旋转或删除。移动端使用上移/下移排序。
          </p>
          <button
            className="primary-action"
            disabled={tasks.busy || (!pages.length)}
            onClick={run}
          >
            导出整理后的 PDF
          </button>
          <Notice text={message} />
        </Panel>
      </div>
      <div className="organizer-main">
        <Panel n={3} title="页面列表">
          <div className="page-thumb-grid">
            {item &&
              pages.map((p, i) => (
                <article
                  className={active === i ? "active" : ""}
                  key={`${p.source}-${i}`}
                  draggable
                  onDragStart={(event) =>
                    event.dataTransfer.setData("text/plain", String(i))
                  }
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const from = Number(
                      event.dataTransfer.getData("text/plain"),
                    );
                    if (Number.isInteger(from) && from !== i) move(from, i);
                  }}
                >
                  <button className="thumb-main" onClick={() => setActive(i)}>
                    <PdfThumb
                      file={item.file}
                      page={p.source + 1}
                      rotation={p.rotation}
                    />
                    <span>{i + 1}</span>
                  </button>
                  <label>
                    <input
                      type="checkbox"
                      checked={p.selected}
                      onChange={(e) =>
                        setPages((v) =>
                          v.map((x, n) =>
                            n === i ? { ...x, selected: e.target.checked } : x,
                          ),
                        )
                      }
                    />
                    选择
                  </label>
                  <footer>
                    <button disabled={i === 0} onClick={() => move(i, i - 1)}>
                      上移
                    </button>
                    <button
                      disabled={i === pages.length - 1}
                      onClick={() => move(i, i + 1)}
                    >
                      下移
                    </button>
                  </footer>
                </article>
              ))}
          </div>
        </Panel>
        <Panel n={4} title="页面预览">
          <PdfCanvas
            file={item?.file}
            page={(pages[active]?.source ?? 0) + 1}
          />
          <p className="preview-note">
            当前第 {active + 1} 页，旋转 {pages[active]?.rotation || 0}°。
          </p>
        </Panel>
      </div>
    </div>
  );
}

const parsePageInput = (value: string, total: number) => {
  const result: number[] = [];
  for (const token of value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)) {
    const m = token.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) throw new Error(`页码“${token}”格式错误`);
    const a = Number(m[1]),
      b = Number(m[2] || m[1]);
    if (a < 1 || b > total || a > b)
      throw new Error(`页码“${token}”超出 1–${total}`);
    for (let i = a; i <= b; i++) {
      if (result.includes(i)) throw new Error(`页码 ${i} 重复`);
      result.push(i);
    }
  }
  if (!result.length) throw new Error("请选择至少一页");
  return result;
};
async function renderPdfPage(
  file: File,
  pageNo: number,
  scale: number,
  type: string,
  quality: number,
) {
  const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() })
    .promise;
  const page = await doc.getPage(pageNo);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d")!;
  if (type === "image/jpeg") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("页面转换失败"))),
      type,
      quality,
    ),
  );
  return { blob, width: canvas.width, height: canvas.height };
}
export function PdfToImagesTool() {
  const tasks = useToolTask();
  const resetOutput = (force = false) => { const changed = tasks.invalidate(force); setResults([]); if (changed) setMessage(""); };

  const [item, setItem] = useState<PdfItem>();
  const [selection, setSelection] = useState<"all" | "range" | "thumb">("all");
  const [range, setRange] = useState("1");
  const [thumbSelected, setThumbSelected] = useState<number[]>([1]);
  const [type, setType] = useState<"image/png" | "image/jpeg">("image/png");
  const [scale, setScale] = useState(1);
  const [results, setResults] = useState<ResultImage[]>([]);
  const [message, setMessage] = useState("");
  const rangeError = useMemo(() => {
    if (!item || selection !== "range") return "";
    try {
      parsePageInput(range, item.pages);
      return "";
    } catch (error) {
      return error instanceof Error ? error.message : "页码范围无效";
    }
  }, [item, selection, range]);
  const selected = useMemo(() => {
    if (!item) return [];
    try {
      if (selection === "all")
        return Array.from({ length: item.pages }, (_, i) => i + 1);
      if (selection === "thumb") return thumbSelected;
      return parsePageInput(range, item.pages);
    } catch {
      return [];
    }
  }, [item, selection, range, thumbSelected]);
  const load = async (files: File[]) => {
    const taskId = tasks.start("input"); if (taskId === undefined) return;
    setItem(undefined);
    setMessage("正在读取 PDF…原文件已取消选择。");
    setResults([]);
    const setItemCurrent: typeof setItem = value => { if (tasks.valid(taskId)) setItem(value); };
    const setRangeCurrent: typeof setRange = value => { if (tasks.valid(taskId)) setRange(value); };
    const setThumbSelectedCurrent: typeof setThumbSelected = value => { if (tasks.valid(taskId)) setThumbSelected(value); };
    const setResultsCurrent: typeof setResults = value => { if (tasks.valid(taskId)) setResults(value); };
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    try {

      try {
        const next = await readPdfItem(files[0]);
        setItemCurrent(next);
        setRangeCurrent(`1-${next.pages}`);
        setThumbSelectedCurrent([1]);
        setResultsCurrent([]);
        setMessageCurrent("");
      } catch {
        setMessageCurrent("无法读取该 PDF，文件可能损坏或受密码保护。原文件已取消选择，请重新选择有效 PDF。");
      }

    } finally { tasks.finish(taskId); }
  };
  const run = async () => {
    const taskId = tasks.start("run"); if (taskId === undefined) return;
    setResults([]);
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    const setResultsCurrent: typeof setResults = value => { if (tasks.valid(taskId)) setResults(value); };
    try {

      if (!item) return;
      try {
        const pages =
          selection === "all"
            ? Array.from({ length: item.pages }, (_, i) => i + 1)
            : selection === "thumb"
              ? thumbSelected
              : parsePageInput(range, item.pages);
        if (!pages.length) throw new Error("请至少选择一页");
        if (scale > 3) setMessageCurrent("正在以较高分辨率转换，请耐心等待…");
        const out: ResultImage[] = [];
        for (let i = 0; i < pages.length; i++) {
          setMessageCurrent(`正在转换 ${i + 1}/${pages.length} 页…`);
          const rendered = await renderPdfPage(
            item.file,
            pages[i],
            scale,
            type,
            0.92,
          );
          if (!tasks.valid(taskId)) return;
          out.push({
            name: `${item.file.name.replace(/\.pdf$/i, "")}_${pages[i]}.${type === "image/png" ? "png" : "jpg"}`,
            blob: rendered.blob,
            url: URL.createObjectURL(rendered.blob),
            width: rendered.width,
            height: rendered.height,
            before: item.file.size,
          });
        }
        setResultsCurrent(out);
        setMessageCurrent(`已转换 ${out.length} 页，可下载真实图片结果。`);
      } catch (e) {
        setMessageCurrent(e instanceof Error ? e.message : "转换失败，请重试。");
      }

    } finally { tasks.finish(taskId); }
  };
  const downloadAll = async () => {
    const taskId = tasks.start("run"); if (taskId === undefined) return; const saveCurrent = (...args: Parameters<typeof save>) => { if (tasks.valid(taskId)) save(...args); }; try {
      if (results.length === 1) saveCurrent(results[0].blob, results[0].name, type);
      else {
        const zip = new JSZip();
        results.forEach((r) => zip.file(r.name, r.blob));
        saveCurrent(
          await zip.generateAsync({ type: "blob" }),
          "PDF页面图片.zip",
          "application/zip",
        );
      }
    } catch { if (tasks.valid(taskId)) setMessage("打包失败，请重试。"); } finally { tasks.finish(taskId); }
  };
  return (
    <div className="tool-workspace" onChangeCapture={event => { if ((event.target as HTMLInputElement).type !== "file") resetOutput(); }} onClickCapture={event => { const edit = toolEditKind(event.target); if (edit) resetOutput(edit === "source"); }} onDropCapture={() => resetOutput(true)}>
      <div className="tool-controls">
        <Panel n={1} title="选择 PDF">
          <Drop
            accept="application/pdf"
            label="选择一个 PDF 文件"
            onFiles={load}
          />
          <PdfFile item={item} clear={() => setItem(undefined)} />
        </Panel>
        <Panel n={2} title="页面与输出">
          <div className="choice-list horizontal">
            <label>
              <input
                type="radio"
                checked={selection === "all"}
                onChange={() => setSelection("all")}
              />
              全部页面
            </label>
            <label>
              <input
                type="radio"
                checked={selection === "range"}
                onChange={() => setSelection("range")}
              />
              指定范围
            </label>
            <label>
              <input
                type="radio"
                checked={selection === "thumb"}
                onChange={() => setSelection("thumb")}
              />
              缩略图选择
            </label>
          </div>
          {selection === "range" && (
            <>
              <label>
                页码范围
                <input
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  placeholder="例如 1-3, 5"
                />
              </label>
              {rangeError && <p className="tool-message error">{rangeError}</p>}
            </>
          )}
          {selection === "thumb" && item && (
            <div className="page-pick-grid">
              {Array.from({ length: item.pages }, (_, index) => index + 1).map(
                (pageNo) => (
                  <button
                    className={thumbSelected.includes(pageNo) ? "active" : ""}
                    key={pageNo}
                    onClick={() =>
                      setThumbSelected((value) =>
                        value.includes(pageNo)
                          ? value.filter((page) => page !== pageNo)
                          : [...value, pageNo].sort((a, b) => a - b),
                      )
                    }
                  >
                    <PdfThumb file={item.file} page={pageNo} />
                    <span>第 {pageNo} 页</span>
                  </button>
                ),
              )}
            </div>
          )}
          <div className="phase2-grid">
            <label>
              格式
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
              >
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPG</option>
              </select>
            </label>
            <label>
              清晰度
              <select
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
              >
                <option value="1">标准 1×</option>
                <option value="2">高清 2×</option>
                <option value="3">超清 3×</option>
                <option value="4">自定义 4×</option>
              </select>
            </label>
          </div>
          {scale >= 3 && (
            <p className="tool-message info">
              高分辨率会明显增加内存占用和输出体积。
            </p>
          )}
          <button
            className="primary-action"
            disabled={tasks.busy || (!selected.length)}
            onClick={run}
          >
            开始转换
          </button>
          {results.length > 0 && (
            <button className="secondary-action" onClick={downloadAll}>
              {results.length === 1 ? "下载图片" : "打包下载 ZIP"}
            </button>
          )}
          <Notice text={message} />
        </Panel>
      </div>
      <Panel n={3} title="预览与结果">
        <PdfCanvas file={item?.file} />
        {results.length > 0 && (
          <div className="conversion-results">
            {results.map((r) => (
              <article key={r.name}>
                <img src={r.url} alt="转换结果" />
                <span>
                  <strong>{r.name}</strong>
                  <small>
                    {r.width} × {r.height} · {fmt(r.blob.size)}
                  </small>
                </span>
                <button onClick={() => save(r.blob, r.name, type)}>下载</button>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function ImageResultList({
  results,
  type,
}: {
  results: ResultImage[];
  type: string;
}) {
  return (
    <div className="conversion-results">
      {results.map((r) => (
        <article key={r.url}>
          <img src={r.url} alt="处理结果" />
          <span>
            <strong>{r.name}</strong>
            <small>
              {r.width} × {r.height} · {fmt(r.blob.size)}
            </small>
          </span>
          <button onClick={() => save(r.blob, r.name, type)}>下载</button>
        </article>
      ))}
    </div>
  );
}
async function zipResults(results: ResultImage[], name: string, isCurrent: () => boolean) {
  const zip = createImageArchive(results.map(result => ({ name: result.name, data: result.blob })));
  const blob = await zip.generateAsync({ type: "blob" });
  if (isCurrent()) save(blob, name, "application/zip");
}
export function ImageFormatConvertTool() {
  const tasks = useToolTask();
  const resetOutput = (force = false) => { const changed = tasks.invalidate(force); setResults([]); if (changed) setMessage(""); };

  const [items, setItems] = useState<ImageItem[]>([]);
  const [type, setType] = useState<"image/jpeg" | "image/png" | "image/webp">(
    "image/jpeg",
  );
  const [quality, setQuality] = useState(85);
  const [background, setBackground] = useState("#ffffff");
  const [results, setResults] = useState<ResultImage[]>([]);
  const [message, setMessage] = useState("");
  const add = async (files: File[]) => {
    if (tasks.inputBusy()) { setMessage("正在读取当前批次，请稍候再添加。"); return; }
    const taskId = tasks.start("input"); if (taskId === undefined) return;
    setResults([]);
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    const setItemsCurrent: typeof setItems = value => { if (tasks.valid(taskId)) setItems(value); };
    const setResultsCurrent: typeof setResults = value => { if (tasks.valid(taskId)) setResults(value); };
    try {
      try {

        const next = await readImages(files);
        if (!tasks.valid(taskId)) { next.forEach(item => URL.revokeObjectURL(item.url)); return; }
        if (!next.length) setMessageCurrent("请选择 JPG、PNG 或 WebP 图片。");
        else {
          setItemsCurrent((v) => [...v, ...next]);
          setResultsCurrent([]);
          setMessageCurrent("");
        }

      } catch { if (tasks.valid(taskId)) setMessage("图片加载失败，文件可能损坏，本批未添加。请选择 JPG、PNG 或 WebP 图片。"); }
    } finally { tasks.finish(taskId); }
  };
  const run = async () => {
    const taskId = tasks.start("run"); if (taskId === undefined) return;
    setResults([]);
    const setResultsCurrent: typeof setResults = value => { if (tasks.valid(taskId)) setResults(value); };
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    try {

      try {
        const out: ResultImage[] = [];
        for (const item of items) {
          const blob = await toBlob(item.file, {
            type,
            quality: quality / 100,
            background: type === "image/jpeg" ? background : undefined,
          });
          if (!tasks.valid(taskId)) return;
          const ext = type === "image/jpeg" ? "jpg" : type.split("/")[1];
          out.push({
            name: `${item.file.name.replace(/\.[^.]+$/, "")}.${ext}`,
            blob,
            url: URL.createObjectURL(blob),
            width: item.width,
            height: item.height,
            before: item.file.size,
          });
        }
        setResultsCurrent(out);
        setMessageCurrent(`已转换 ${out.length} 张图片；大小为真实处理结果。`);
      } catch {
        setMessageCurrent("转换失败，可能是图片过大导致内存不足。");
      }

    } finally { tasks.finish(taskId); }
  };
  return (
    <div className="tool-workspace" onChangeCapture={event => { if ((event.target as HTMLInputElement).type !== "file") resetOutput(); }} onClickCapture={event => { const edit = toolEditKind(event.target); if (edit) resetOutput(edit === "source"); }} onDropCapture={() => resetOutput(true)}>
      <div className="tool-controls">
        <Panel n={1} title="添加图片">
          <Drop
            accept="image/jpeg,image/png,image/webp"
            multiple
            label="选择需要转换的图片"
            onFiles={add}
          />
          <ImageFiles
            items={items}
            remove={(i) => {
              setItems((v) => v.filter((_, n) => n !== i));
              setResults([]);
            }}
          />
        </Panel>
        <Panel n={2} title="转换设置">
          <label>
            输出格式
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>
          {type !== "image/png" && (
            <label>
              输出质量 <b>{quality}%</b>
              <input
                type="range"
                min="35"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
            </label>
          )}
          {type === "image/jpeg" && (
            <label>
              透明区域填充色
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
              />
            </label>
          )}
          <p className="helper-text">
            JPG
            不支持透明度，透明区域会使用选择的颜色填充；转换后不保证体积一定更小。
          </p>
          <button
            className="primary-action"
            disabled={tasks.busy || (!items.length)}
            onClick={run}
          >
            开始转换
          </button>
          {results.length > 0 && (
            <button
              className="secondary-action"
              onClick={async () => {
const taskId = tasks.start("run"); if (taskId === undefined) return; try {
                  await (results.length === 1
                    ? save(results[0].blob, results[0].name, type)
                    : zipResults(results, "格式转换图片.zip", () => tasks.valid(taskId)));
                } catch { if (tasks.valid(taskId)) setMessage("打包失败，请重试。"); } finally { tasks.finish(taskId); }
              }
              }
            >
              {results.length === 1 ? "下载转换结果" : "打包下载 ZIP"}
            </button>
          )}
          <Notice text={message} />
        </Panel>
      </div>
      <Panel n={3} title="效果对比">
        <div className="compare-preview">
          {items[0] ? (
            <>
              <figure>
                <img src={items[0].url} alt="原图" />
                <figcaption>
                  原图 · {items[0].file.type.split("/")[1].toUpperCase()} ·{" "}
                  {fmt(items[0].file.size)}
                </figcaption>
              </figure>
              {results[0] && (
                <figure>
                  <img src={results[0].url} alt="转换后" />
                  <figcaption>
                    转换后 · {type.split("/")[1].toUpperCase()} ·{" "}
                    {fmt(results[0].blob.size)}
                  </figcaption>
                </figure>
              )}
            </>
          ) : (
            <div className="preview-empty">
              <FileImage size={40} />
              <p>添加图片后进行真实格式转换</p>
            </div>
          )}
        </div>
        <ImageResultList results={results} type={type} />
      </Panel>
    </div>
  );
}

export function ImageResizeTool() {
  const tasks = useToolTask();
  const resetOutput = (force = false) => { const changed = tasks.invalidate(force); setResults([]); if (changed) setMessage(""); };

  const [items, setItems] = useState<ImageItem[]>([]);
  const [mode, setMode] = useState<"pixel" | "percent">("pixel");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(768);
  const [percent, setPercent] = useState(50);
  const [locked, setLocked] = useState(true);
  const [crop, setCrop] = useState<"none" | "1:1" | "4:3" | "16:9">("none");
  const [results, setResults] = useState<ResultImage[]>([]);
  const [message, setMessage] = useState("");
  const add = async (files: File[]) => {
    if (tasks.inputBusy()) { setMessage("正在读取当前批次，请稍候再添加。"); return; }
    const taskId = tasks.start("input"); if (taskId === undefined) return;
    setResults([]);
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    const setItemsCurrent: typeof setItems = value => { if (tasks.valid(taskId)) setItems(value); };
    const setWidthCurrent: typeof setWidth = value => { if (tasks.valid(taskId)) setWidth(value); };
    const setHeightCurrent: typeof setHeight = value => { if (tasks.valid(taskId)) setHeight(value); };
    const setResultsCurrent: typeof setResults = value => { if (tasks.valid(taskId)) setResults(value); };
    try {
      try {

        const next = await readImages(files);
        if (!tasks.valid(taskId)) { next.forEach(item => URL.revokeObjectURL(item.url)); return; }
        if (!next.length) setMessageCurrent("请选择 JPG、PNG 或 WebP 图片。");
        else {
          setItemsCurrent((v) => [...v, ...next]);
          if (!items.length && next[0]) {
            setWidthCurrent(next[0].width);
            setHeightCurrent(next[0].height);
          }
          setResultsCurrent([]);
          setMessageCurrent("");
        }

      } catch { if (tasks.valid(taskId)) setMessage("图片加载失败，文件可能损坏，本批未添加。请选择 JPG、PNG 或 WebP 图片。"); }
    } finally { tasks.finish(taskId); }
  };
  const changeWidth = (n: number) => {
    setWidth(n);
    if (locked && items[0])
      setHeight(
        Math.max(1, Math.round((n * items[0].height) / items[0].width)),
      );
  };
  const changeHeight = (n: number) => {
    setHeight(n);
    if (locked && items[0])
      setWidth(Math.max(1, Math.round((n * items[0].width) / items[0].height)));
  };
  const run = async () => {
    const taskId = tasks.start("run"); if (taskId === undefined) return;
    setResults([]);
    const setResultsCurrent: typeof setResults = value => { if (tasks.valid(taskId)) setResults(value); };
    const setMessageCurrent: typeof setMessage = value => { if (tasks.valid(taskId)) setMessage(value); };
    try {

      try {
        const ratio =
          crop === "1:1"
            ? 1
            : crop === "4:3"
              ? 4 / 3
              : crop === "16:9"
                ? 16 / 9
                : undefined;
        const out: ResultImage[] = [];
        for (const item of items) {
          const w =
            mode === "percent" ? Math.round((item.width * percent) / 100) : width;
          const h =
            mode === "percent"
              ? Math.round((item.height * percent) / 100)
              : height;
          if (!Number.isSafeInteger(w) || !Number.isSafeInteger(h) || w < 1 || h < 1) throw new Error("输出宽高必须是正整数，请调整尺寸后重试。");
          if (w * h > 60_000_000)
            throw new Error("输出尺寸过大，可能超出浏览器内存限制。");
          const blob = await toBlob(item.file, {
            type: item.file.type,
            quality: 0.92,
            width: w,
            height: h,
            cropRatio: ratio,
            background: item.file.type === "image/jpeg" ? "#fff" : undefined,
          });
          if (!tasks.valid(taskId)) return;
          out.push({
            name: `${item.file.name.replace(/\.[^.]+$/, "")}_${w}x${h}.${item.file.name.split(".").pop()}`,
            blob,
            url: URL.createObjectURL(blob),
            width: w,
            height: h,
            before: item.file.size,
          });
        }
        setResultsCurrent(out);
        setMessageCurrent(`已调整 ${out.length} 张图片，输出尺寸为真实结果。`);
      } catch (e) {
        setMessageCurrent(e instanceof Error ? e.message : "尺寸调整失败，请重试。");
      }

    } finally { tasks.finish(taskId); }
  };
  const previewWidth =
    mode === "percent" && items[0]
      ? Math.round((items[0].width * percent) / 100)
      : width,
    previewHeight =
      mode === "percent" && items[0]
        ? Math.round((items[0].height * percent) / 100)
        : height;
  return (
    <div className="tool-workspace" onChangeCapture={event => { if ((event.target as HTMLInputElement).type !== "file") resetOutput(); }} onClickCapture={event => { const edit = toolEditKind(event.target); if (edit) resetOutput(edit === "source"); }} onDropCapture={() => resetOutput(true)}>
      <div className="tool-controls">
        <Panel n={1} title="添加图片">
          <Drop
            accept="image/jpeg,image/png,image/webp"
            multiple
            label="选择需要调整尺寸的图片"
            onFiles={add}
          />
          <ImageFiles
            items={items}
            remove={(i) => {
              setItems((v) => v.filter((_, n) => n !== i));
              setResults([]);
            }}
          />
        </Panel>
        <Panel n={2} title="尺寸与裁剪">
          <div className="preset-row">
            <button
              className={mode === "pixel" ? "active" : ""}
              onClick={() => setMode("pixel")}
            >
              按像素
            </button>
            <button
              className={mode === "percent" ? "active" : ""}
              onClick={() => setMode("percent")}
            >
              按比例
            </button>
          </div>
          {mode === "pixel" ? (
            <div className="phase2-grid">
              <label>
                宽度（px）
                <input
                  type="number"
                  min="1"
                  value={width}
                  onChange={(e) => changeWidth(Number(e.target.value))}
                />
              </label>
              <label>
                高度（px）
                <input
                  type="number"
                  min="1"
                  value={height}
                  onChange={(e) => changeHeight(Number(e.target.value))}
                />
              </label>
            </div>
          ) : (
            <label>
              缩放百分比 <b>{percent}%</b>
              <input
                type="range"
                min="10"
                max="200"
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
              />
            </label>
          )}
          <div className="switch-row">
            <label>
              <input
                type="checkbox"
                checked={locked}
                onChange={(e) => setLocked(e.target.checked)}
              />
              锁定宽高比
            </label>
          </div>
          <label>
            裁剪比例
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value as typeof crop)}
            >
              <option value="none">不裁剪</option>
              <option value="1:1">1:1 正方形</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
            </select>
          </label>
          {items[0] &&
            (previewWidth > items[0].width ||
              previewHeight > items[0].height) && (
              <p className="tool-message info">放大图片可能造成清晰度下降。</p>
            )}
          <button
            className="primary-action"
            disabled={tasks.busy || (!items.length)}
            onClick={run}
          >
            批量调整尺寸
          </button>
          {results.length > 0 && (
            <button
              className="secondary-action"
              onClick={async () => {
const taskId = tasks.start("run"); if (taskId === undefined) return; try {
                  await (results.length === 1
                    ? save(results[0].blob, results[0].name, results[0].blob.type)
                    : zipResults(results, "尺寸调整图片.zip", () => tasks.valid(taskId)));
                } catch { if (tasks.valid(taskId)) setMessage("打包失败，请重试。"); } finally { tasks.finish(taskId); }
              }
              }
            >
              {results.length === 1 ? "下载调整结果" : "打包下载 ZIP"}
            </button>
          )}
          <Notice text={message} />
        </Panel>
      </div>
      <Panel n={3} title="预览与裁剪">
        <div className="resize-preview">
          {items[0] ? (
            <>
              <div className={`crop-frame crop-${crop.replace(":", "")}`}>
                <img src={items[0].url} alt="尺寸调整预览" />
              </div>
              <p>
                预计输出：{previewWidth} × {previewHeight} px
              </p>
            </>
          ) : (
            <div className="preview-empty">
              <Images size={40} />
              <p>添加图片后显示尺寸与裁剪预览</p>
            </div>
          )}
        </div>
        <ImageResultList
          results={results}
          type={results[0]?.blob.type || "image/png"}
        />
      </Panel>
    </div>
  );
}
