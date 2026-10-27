import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

export function usePdfCanvas(file?: Blob, page = 1, scale = 1.05, rotation?: number) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failure, setFailure] = useState<{file:Blob;page:number;scale:number;rotation?:number;message:string}>();
  const error = failure && failure.file === file && failure.page === page && failure.scale === scale && failure.rotation === rotation ? failure.message : "";
  useEffect(() => {
    const target = canvas.current;
    if (target) { target.width = 0; target.height = 0; }
    if (!file || !target) return;
    let cancelled = false;
    let loading: ReturnType<typeof pdfjsLib.getDocument> | undefined;
    let rendering: ReturnType<Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]>["getPage"]>;
    let renderTask: { cancel?: () => void; promise: Promise<unknown> } | undefined;
    let disposed = false;
    const dispose = () => {
      if (!loading || disposed) return;
      disposed = true;
      void loading.destroy?.().catch(() => undefined);
    };
    void (async () => {
      try {
        const data = await file.arrayBuffer();
        if (cancelled) return;
        loading = pdfjsLib.getDocument({ data });
        const document = await loading.promise;
        if (cancelled) return;
        rendering = document.getPage(Math.max(1, Math.min(page, document.numPages)));
        const pdfPage = await rendering;
        if (cancelled) return;
        const viewport = pdfPage.getViewport({ scale, ...(rotation === undefined ? {} : { rotation }) });
        target.width = Math.ceil(viewport.width);
        target.height = Math.ceil(viewport.height);
        renderTask = pdfPage.render({ canvas: target, canvasContext: target.getContext("2d")!, viewport });
        await renderTask.promise;
        if (!cancelled) setFailure(undefined);
      } catch {
        if (!cancelled) { target.width = 0; target.height = 0; setFailure({file,page,scale,rotation,message:"PDF 预览失败，请重新选择文件。"}); }
      } finally { dispose(); }
    })();
    return () => { cancelled = true; renderTask?.cancel?.(); dispose(); };
  }, [file, page, scale, rotation]);
  return { canvas, error };
}
