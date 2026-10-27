import { useEffect, useRef, useState } from "react";

export function useToolTask() {
  const current = useRef({ alive: true, id: 0, phase: "idle" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const lifecycle = current.current;
    lifecycle.alive = true;
    return () => { lifecycle.alive = false; lifecycle.id++; };
  }, []);
  const valid = (id: number) => current.current.alive && current.current.id === id;
  const start = (phase: "input" | "run") => {
    if (!current.current.alive || phase === "run" && current.current.phase !== "idle") return undefined;
    const id = ++current.current.id;
    current.current.phase = phase;
    setBusy(true);
    return id;
  };
  const finish = (id: number) => {
    if (valid(id)) { current.current.phase = "idle"; setBusy(false); }
  };
  const invalidate = (includingInput = false) => {
    if (!includingInput && current.current.phase === "input") return false;
    current.current.id++;
    current.current.phase = "idle";
    if (current.current.alive) setBusy(false);
    return true;
  };
  return { busy, valid, start, finish, invalidate, inputBusy: () => current.current.phase === "input" };
}

export function toolEditKind(target: EventTarget | null): "source" | "settings" | undefined {
  if (!(target instanceof Element)) return;
  const button=target.closest("button"); if (!button) return;
  if(button.getAttribute("aria-label")?.startsWith("移除") || button.closest(".sortable-row, .image-file-grid, .phase2-images, .organizer-actions, .page-thumb-grid footer")) return "source";
  if(button.closest(".preset-row, .page-pick-grid") || button.textContent?.trim() === "重置设置") return "settings";
}
