import { useEffect, useRef, useState } from "react";
import type { PaperThemeKey } from "@/remotion/shared/theme";
import { WIDTH, HEIGHT } from "@/remotion/shared/theme";
import { getTemplate } from "@/templates/registry";
import { renderTemplateFrame } from "@/templates/render";
import { DEFAULT_TIMING, type TemplateContent } from "@/templates/schema";
import { computePlan } from "@/templates/types";
import { collectText, ensureFonts } from "@/templates/fonts";

type Props = {
  templateId: string;
  content?: TemplateContent;
  theme?: PaperThemeKey;
  /** 0..1，取动画进行到哪里的一帧；默认模板自己的 thumbAt */
  at?: number;
  width?: number;
  className?: string;
};


/** 模板缩略图：直接调用模板 draw 画一帧（与成片同源，不需要预渲染图片） */
export function TemplateThumb({ templateId, content, theme = "classic", at, width = 120, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);
  const height = Math.round((width * HEIGHT) / WIDTH);

  useEffect(() => {
    let alive = true;
    const def = getTemplate(templateId);
    if (!def) return;
    void ensureFonts(collectText(content ?? def.defaults)).then(() => alive && setTick((n) => n + 1));
    return () => {
      alive = false;
    };
  }, [templateId, content]);

  useEffect(() => {
    const canvas = ref.current;
    const def = getTemplate(templateId);
    if (!canvas || !def) return;
    const dpr = typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const c = content ?? def.defaults;
    const plan = computePlan(def, c, DEFAULT_TIMING);
    // 画到 1080×1920 的离屏画布再缩小，避免文字在小画布上测量失真
    const off = document.createElement("canvas");
    off.width = WIDTH;
    off.height = HEIGHT;
    const octx = off.getContext("2d");
    if (!octx) return;
    renderTemplateFrame(octx, def, c, plan, plan.activeSec * (at ?? def.thumbAt ?? 0.97), theme, 1);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
  }, [templateId, content, theme, at, width, height, tick]);

  return <canvas ref={ref} style={{ width, height }} className={className} aria-label={`模板缩略图 ${templateId}`} />;
}
