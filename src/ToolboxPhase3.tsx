// PDF.js 6's render type requires a canvas field that is supplied at runtime; keep this isolated tool permissive.
// @ts-nocheck
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { ArrowDownToLine, FileText, Upload } from "lucide-react";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { addPageNumbers, addTextWatermark } from "./pdfText";
export { OcrTool } from "./OcrTool";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
type PdfItem = { file: File; pages: number };
const bytes = (n: number) => n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
const save = (data: Uint8Array | Blob, name: string, type = "application/pdf") => { const a = document.createElement("a"); a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data as BlobPart], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1200); };
const readPdf = async (file: File) => PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
const parseRange = (value: string, max: number) => { const out = new Set<number>(); if (!value.trim()) return new Set(Array.from({ length: max }, (_, index) => index + 1)); for (const part of value.split(",")) { const [a, b] = part.trim().split("-").map(Number); if (!Number.isInteger(a) || a < 1 || a > max || (b !== undefined && (!Number.isInteger(b) || b < a || b > max))) throw new Error(`页码范围无效：${part}`); for (let i = a; i <= (b ?? a); i++) out.add(i); } return out; };
function UploadPdf({ item, onFile }: { item?: PdfItem; onFile: (f: File) => void }) { return <label className="file-drop" role="button" tabIndex={0} aria-label={item ? `替换 PDF：${item.file.name}` : "选择 PDF 文件"} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (e.currentTarget.querySelector("input[type=file]") as HTMLInputElement | null)?.click(); } }}><Upload size={22}/><b>{item ? item.file.name : "点击或拖入一个 PDF 文件"}</b><small>{item ? `${item.pages} 页 · ${bytes(item.file.size)}` : "文件仅在本机处理，不上传"}</small><input hidden type="file" accept="application/pdf" onChange={e => { const file = e.target.files?.[0]; if (file) onFile(file); e.target.value = ""; }}/></label>; }
function PdfPreview({ file }: { file?: Blob }) { const ref = useRef<HTMLCanvasElement>(null); const [page, setPage] = useState(1); const [scale, setScale] = useState(.72); const [status, setStatus] = useState(""); useEffect(() => { if (!file || !ref.current) return; let cancelled = false; let doc: any; setStatus("正在加载真实输出预览…"); const loading = file.arrayBuffer().then(data => pdfjsLib.getDocument({ data }).promise); loading.then(async loaded => { doc = loaded; if (cancelled) return; setPage(p => Math.min(p, doc.numPages)); const p = await doc.getPage(Math.min(page, doc.numPages)); const vp = p.getViewport({ scale }); const c = ref.current!; c.width = vp.width; c.height = vp.height; await (p.render as any)({ canvas: c, canvasContext: c.getContext("2d")!, viewport: vp }).promise; if (!cancelled) setStatus(`第 ${Math.min(page, doc.numPages)} / ${doc.numPages} 页`); }).catch(() => !cancelled && setStatus("预览加载失败，请重新生成 PDF。")); return () => { cancelled = true; if (doc && typeof doc.destroy === "function") void doc.destroy(); }; }, [file, page, scale]); return <><div className="preview-controls"><button disabled={!file || page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button><button disabled={!file} onClick={() => setPage(p => p + 1)}>下一页</button><button disabled={!file} onClick={() => setScale(s => Math.min(1.5, s + .1))}>放大</button><button disabled={!file} onClick={() => setScale(s => Math.max(.4, s - .1))}>缩小</button><span>{status || "处理后的 PDF 预览将在这里显示"}</span></div><div className="pdf-preview"><canvas ref={ref}/></div></>; }
function loadItem(file: File, onOk: (item: PdfItem) => void, onError: (s: string) => void) { if (!file.name.toLowerCase().endsWith(".pdf")) return onError("请选择 PDF 文件"); readPdf(file).then(doc => onOk({ file, pages: doc.getPageCount() })).catch(() => onError("PDF 无法解析，可能已加密或损坏。")); }
export function PdfPageNumberTool() { const [item, setItem] = useState<PdfItem>(); const [start, setStart] = useState(1); const [range, setRange] = useState(""); const [pos, setPos] = useState("footer-center"); const [format, setFormat] = useState("plain"); const [skip, setSkip] = useState(false); const [size, setSize] = useState(10); const [color, setColor] = useState("#16402a"); const [ox, setOx] = useState(0); const [oy, setOy] = useState(0); const [result, setResult] = useState<Blob>(); const [message, setMessage] = useState(""); const run = async () => { if (!item) return; try { setMessage("正在加载中文字体并生成 PDF…"); const selected = parseRange(range, item.pages); if (skip) selected.delete(1); const src = await readPdf(item.file); const changed = await addPageNumbers(src, { selectedPages: selected, start, position: pos, format, fontSize: size, color: hexColor(color), offsetX: ox, offsetY: oy }); const blob = new Blob([await src.save()], { type: "application/pdf" }); setResult(blob); save(blob, `${item.file.name.replace(/\.pdf$/i, "")}_已添加页码.pdf`); setMessage(`完成：已写入 ${changed} 个页面。`); } catch (e) { setMessage(e instanceof Error ? e.message : "处理失败"); } }; return <PdfToolFrame title="PDF 添加页码" lead="为讲义或论文添加清晰、可控的页码。"><UploadPdf item={item} onFile={f => { setResult(undefined); loadItem(f, setItem, setMessage); }}/><div className="tool-settings"><label>起始编号<input type="number" min="1" value={start} onChange={e => setStart(Math.max(1, Number(e.target.value)))}/></label><label>格式<select value={format} onChange={e => setFormat(e.target.value)}><option value="plain">1, 2, 3</option><option value="cn">第 1 页</option><option value="fraction">1 / N</option></select></label><label>位置<select value={pos} onChange={e => setPos(e.target.value)}><option value="footer-left">页脚左</option><option value="footer-center">页脚中</option><option value="footer-right">页脚右</option><option value="header-left">页眉左</option><option value="header-center">页眉中</option><option value="header-right">页眉右</option></select></label><label>字号<input type="number" min="6" max="72" value={size} onChange={e => setSize(Number(e.target.value))}/></label><label>颜色<input type="color" value={color} onChange={e => setColor(e.target.value)}/></label><label>水平偏移<input type="number" value={ox} onChange={e => setOx(Number(e.target.value))}/></label><label>垂直偏移<input type="number" value={oy} onChange={e => setOy(Number(e.target.value))}/></label><label>指定页面（可选）<input placeholder="例如 2-5,8" value={range} onChange={e => setRange(e.target.value)}/></label><label><input type="checkbox" checked={skip} onChange={e => setSkip(e.target.checked)}/> 跳过封面</label></div><button className="primary-action" disabled={!item} onClick={run}><FileText size={18}/>生成带页码的 PDF</button><p className="tool-status">{message}</p><PdfPreview file={result}/></PdfToolFrame>; }
const hexColor = (value: string) => { const n = Number.parseInt(value.slice(1), 16); return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 }; };
export function PdfWatermarkTool() { const [item, setItem] = useState<PdfItem>(); const [text, setText] = useState("仅供学习使用"); const [opacity, setOpacity] = useState(.2); const [angle, setAngle] = useState(-30); const [range, setRange] = useState(""); const [skip, setSkip] = useState(false); const [size, setSize] = useState(28); const [color, setColor] = useState("#d9263f"); const [position, setPosition] = useState<any>("center"); const [ox, setOx] = useState(0); const [oy, setOy] = useState(0); const [result, setResult] = useState<Blob>(); const [message, setMessage] = useState(""); const run = async () => { if (!item || !text.trim()) return setMessage("水印文字不能为空"); try { setMessage("正在加载中文字体并生成 PDF…"); const doc = await readPdf(item.file); const selected = parseRange(range, item.pages); if (skip) selected.delete(1); const changed = await addTextWatermark(doc, { text, selectedPages: selected, opacity, angle, fontSize: size, color: hexColor(color), position, offsetX: ox, offsetY: oy }); const blob = new Blob([await doc.save()], { type: "application/pdf" }); setResult(blob); save(blob, `${item.file.name.replace(/\.pdf$/i, "")}_已添加水印.pdf`); setMessage(`完成：水印已真实写入 ${changed} 个页面（叠加层）。`); } catch (e) { setMessage(e instanceof Error ? e.message : "处理失败"); } }; return <PdfToolFrame title="PDF 添加水印" lead="添加低透明度文字标识，原文件不会被覆盖。"><UploadPdf item={item} onFile={f => { setResult(undefined); loadItem(f, setItem, setMessage); }}/><div className="tool-settings"><label>水印文字<input maxLength={60} value={text} onChange={e => setText(e.target.value)}/></label><label>字号<input type="number" min="8" max="120" value={size} onChange={e => setSize(Number(e.target.value))}/></label><label>颜色<input type="color" value={color} onChange={e => setColor(e.target.value)}/></label><label>透明度<input type="range" min=".05" max=".8" step=".05" value={opacity} onChange={e => setOpacity(Number(e.target.value))}/><output>{Math.round(opacity * 100)}%</output></label><label>旋转角度<input type="number" min="-180" max="180" value={angle} onChange={e => setAngle(Number(e.target.value))}/></label><label>位置<select value={position} onChange={e => setPosition(e.target.value)}><option value="center">居中</option><option value="top-left">左上</option><option value="top-right">右上</option><option value="bottom-left">左下</option><option value="bottom-right">右下</option></select></label><label>水平偏移<input type="number" value={ox} onChange={e => setOx(Number(e.target.value))}/></label><label>垂直偏移<input type="number" value={oy} onChange={e => setOy(Number(e.target.value))}/></label><label>指定页面（可选）<input placeholder="例如 1,3-5" value={range} onChange={e => setRange(e.target.value)}/></label><label><input type="checkbox" checked={skip} onChange={e => setSkip(e.target.checked)}/> 跳过封面</label></div><button className="primary-action" disabled={!item} onClick={run}><FileText size={18}/>生成带水印的 PDF</button><p className="tool-status">{message}</p><PdfPreview file={result}/></PdfToolFrame>; }
export function PdfCompressTool() {
  const [item, setItem] = useState<PdfItem>();
  const [mode, setMode] = useState("balanced");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ data: Uint8Array; source: File; name: string }>();
  const [busy, setBusy] = useState(false);
  const phase = useRef("idle");
  const task = useRef({ alive: true, id: 0 });
  useEffect(() => {
    const lifecycle = task.current;
    lifecycle.alive = true;
    return () => { lifecycle.alive = false; lifecycle.id++; };
  }, []);
  const valid = (id: number) => task.current.alive && task.current.id === id;
  const finish = (id: number) => {
    if (valid(id)) { phase.current = "idle"; setBusy(false); }
  };
  const upload = async (file: File) => {
    const id = ++task.current.id;
    phase.current = "loading";
    setBusy(true);
    setItem(undefined);
    setResult(undefined);
    setMessage(`正在读取 ${file.name}…原文件已取消选择。`);
    try {
      const doc = await readPdf(file);
      if (!valid(id)) return;
      setItem({ file, pages: doc.getPageCount() });
      setMessage("");
    } catch {
      if (valid(id)) setMessage(`新文件 ${file.name} 加载失败，可能已加密或损坏。原文件已取消选择，请重新选择有效 PDF。`);
    } finally { finish(id); }
  };
  const changeMode = (value: string) => {
    setMode(value);
    setResult(undefined);
    if (phase.current !== "loading") {
      task.current.id++;
      phase.current = "idle";
      setBusy(false);
      setMessage("");
    }
  };
  const run = async () => {
    if (!item || phase.current !== "idle") return;
    const input = item;
    const id = ++task.current.id;
    phase.current = "compressing";
    setBusy(true);
    setResult(undefined);
    setMessage("正在检查页面文本层并重新编码图像…");
    let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | undefined;
    try {
      const data = await input.file.arrayBuffer();
      if (!valid(id)) return;
      loadingTask = pdfjsLib.getDocument({ data });
      const source = await loadingTask.promise;
      if (!valid(id)) return;
      let textPages = 0;
      for (let i = 1; i <= source.numPages; i++) {
        if ((await (await source.getPage(i)).getTextContent()).items.length) textPages++;
        if (!valid(id)) return;
      }
      if (textPages) {
        setMessage(`未实现有效压缩：检测到 ${textPages}/${input.pages} 页有文本层。为避免悄悄损失可选文字、链接和矢量内容，本次保留原文件。`);
        return;
      }
      const scale = mode === "space" ? .8 : mode === "clear" ? 1.35 : 1.05;
      const out = await PDFDocument.create();
      for (let i = 1; i <= source.numPages; i++) {
        const page = await source.getPage(i);
        if (!valid(id)) return;
        const vp = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
        if (!valid(id)) return;
        const jpg = canvas.toDataURL("image/jpeg", mode === "space" ? .55 : mode === "clear" ? .88 : .72);
        const image = await out.embedJpg(jpg);
        const outputPage = out.addPage([vp.width / scale, vp.height / scale]);
        outputPage.drawImage(image, { x: 0, y: 0, width: outputPage.getWidth(), height: outputPage.getHeight() });
      }
      const output = await out.save();
      if (!valid(id)) return;
      if (output.byteLength >= input.file.size) {
        setMessage(`未实现有效压缩：输出 ${bytes(output.byteLength)}，不小于原文件 ${bytes(input.file.size)}，已保留原文件。`);
        return;
      }
      setResult({ data: output, source: input.file, name: `${input.file.name.replace(/\.pdf$/i, "")}_压缩.pdf` });
      setMessage(`压缩完成：${bytes(input.file.size)} → ${bytes(output.byteLength)}（减少 ${Math.round((1 - output.byteLength / input.file.size) * 100)}%）。输出为图像型 PDF，原文件文本层为空时才启用。`);
    } catch {
      if (valid(id)) { setResult(undefined); setMessage("压缩失败，原文件未改变。"); }
    } finally {
      if (loadingTask) await loadingTask.destroy().catch(() => undefined);
      finish(id);
    }
  };
  return <PdfToolFrame title="PDF 压缩" lead="按实际字节数判断压缩结果；检测到文本层时保留原文件，无文本层时以 JPEG 重新编码，可能降低清晰度。">
    <UploadPdf item={item} onFile={upload} />
    <div className="tool-settings"><label>压缩模式<select value={mode} onChange={event => changeMode(event.target.value)}><option value="clear">清晰优先</option><option value="balanced">均衡（默认）</option><option value="space">省空间</option></select></label></div>
    <button className="primary-action" disabled={!item || busy} onClick={run}><ArrowDownToLine size={18} />开始压缩</button>
    {result && result.source === item?.file && <button className="secondary-action" onClick={() => { if (result.source === item?.file) save(result.data, result.name); }}>下载压缩后的 PDF</button>}
    <p className="tool-status" role={/失败|无效|不能为空|没有可处理|错误|损坏|加密/.test(message) ? "alert" : "status"} aria-live={/失败|无效|不能为空|没有可处理|错误|损坏|加密/.test(message) ? "assertive" : "polite"}>{message}</p>{item ? <PdfPreview file={item.file} /> : <p>处理后的 PDF 预览将在这里显示</p>}
  </PdfToolFrame>;
}

function PdfToolFrame({ lead, children }: { title: string; lead: string; children: ReactNode }) { return <section className="tool-detail-page phase3-tool"><header><p className="toolbox-eyebrow">STUDENT TOOLBOX · 本地处理·不上传文件</p><p>{lead}</p></header>{children}</section>; }
