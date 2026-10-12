/**
 * 用模板当起手式：把一个模板定义（通常是 `npm run new:clip -- … --from-template <id>`
 * 复制进片段文件夹的 template.ts）包装成定制片段需要的 Comp / draw / duration / sfx / fields / markers。
 * 复制过来的 template.ts 归这个片段所有，随便改，不影响模板库。
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { collectText, ensureFonts } from "@/templates/fonts";
import { renderTemplateFrame, sfxFromPlan } from "@/templates/render";
import { DEFAULT_TIMING, cloneContent, type BeatTiming, type TemplateContent } from "@/templates/schema";
import { computePlan, type ComputedPlan, type TemplateDef } from "@/templates/types";
import type { ClipTextSchema, KeyframeMarker } from "./define-clip";
import { SfxTrack } from "./sfx";
import { FPS, HEIGHT, WIDTH, type AnimParams } from "./theme";
import { useCustomTexts, useFontSizeScale, usePaperTheme } from "./theme-context";

export function clipFromTemplate(def: TemplateDef, opts: { content?: TemplateContent; timing?: BeatTiming } = {}) {
  const base: TemplateContent = { ...cloneContent(def.defaults ?? {}), ...(opts.content ?? {}) };
  const timing = opts.timing ?? DEFAULT_TIMING;
  // 只把单行/多行文字和印章暴露成面板字段（列表、图标等请直接改 template.ts 里的 defaults）
  const textKeys = def.fields
    .filter((f) => (f.type === "text" || f.type === "textarea" || f.type === "stamp") && typeof base[f.key] === "string")
    .map((f) => f.key);

  const contentFor = (texts?: Record<string, string>): TemplateContent => {
    if (!texts) return base;
    const c = { ...base };
    for (const k of textKeys) if (typeof texts[k] === "string" && texts[k].trim() !== "") c[k] = texts[k];
    return c;
  };
  const cache = new Map<string, ComputedPlan>();
  const planFor = (c: TemplateContent) => {
    const key = JSON.stringify(c);
    let p = cache.get(key);
    if (!p) {
      p = computePlan(def, c, timing);
      if (cache.size > 50) cache.clear();
      cache.set(key, p);
    }
    return p;
  };
  const basePlan = planFor(base);
  const totalFrames = Math.max(1, Math.ceil(basePlan.duration * FPS));

  const fields: ClipTextSchema[] = def.fields
    .filter((f) => textKeys.includes(f.key))
    .map((f) => ({
      key: f.key,
      label: f.label,
      default: String(base[f.key] ?? ""),
      placeholder: f.placeholder ?? String(base[f.key] ?? ""),
      multiline: f.type === "textarea",
      type: f.type === "stamp" ? "stamp" : "text",
    }));
  const markers: KeyframeMarker[] = basePlan.markers.map((m) => ({
    frame: Math.round(m.at * FPS),
    timeSec: Math.round(m.at * 100) / 100,
    label: m.label,
    tag: m.tag,
    type: m.type,
  }));

  function Comp() {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const theme = usePaperTheme();
    const fontScale = useFontSizeScale();
    const texts = useCustomTexts();
    const key = JSON.stringify(texts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const content = useMemo(() => contentFor(texts), [key]);
    const plan = planFor(content);
    const hits = useMemo(() => sfxFromPlan(basePlan), []);
    const ref = useRef<HTMLCanvasElement>(null);
    const [fontTick, setFontTick] = useState(0);
    useEffect(() => {
      let alive = true;
      void ensureFonts(collectText(content)).then(() => alive && setFontTick((n) => n + 1));
      return () => {
        alive = false;
      };
    }, [content]);
    useLayoutEffect(() => {
      const ctx = ref.current?.getContext("2d");
      if (ctx) renderTemplateFrame(ctx, def, content, plan, frame / fps, theme, fontScale);
    }, [frame, fps, content, plan, theme, fontScale, fontTick]);
    return (
      <AbsoluteFill>
        <canvas ref={ref} width={WIDTH} height={HEIGHT} style={{ width: "100%", height: "100%", display: "block" }} />
        <SfxTrack hits={hits} />
      </AbsoluteFill>
    );
  }

  return {
    Comp,
    draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
      const c = contentFor(params.customTexts);
      renderTemplateFrame(ctx, def, c, planFor(c), elapsed / 1000, params.paperTheme ?? "classic", params.fontScale ?? 1);
    },
    duration: () => totalFrames,
    sfx: () => sfxFromPlan(basePlan),
    prepare: (params?: AnimParams) => ensureFonts(collectText(contentFor(params?.customTexts))),
    fields,
    markers,
  };
}
