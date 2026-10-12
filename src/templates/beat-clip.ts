/**
 * 把「一期里的一个分镜」解析成播放器 / 导出能直接用的东西：
 * ClipDef（Comp + draw + duration + sfx）、关键帧标记、表单字段。
 * 模板分镜与定制分镜（bespoke，src/remotion/epNN）走同一个出口，面板不用区分。
 */
import type { KeyframeMarker } from "@/lib/clip-data";
import { getFieldsForClip, getMarkersForClip } from "@/lib/clip-data";
import { CLIPS, findClip } from "@/remotion/catalog";
import type { ClipDef } from "@/remotion/shared/types";
import { FPS, type AnimParams, type PaperThemeKey } from "@/remotion/shared/theme";
import { exportNameFor, type Beat, type Episode, type FieldDef, type TemplateContent } from "./schema";
import { getTemplate } from "./registry";
import { renderTemplateFrame, sfxFromPlan } from "./render";
import { computePlan, type ComputedPlan } from "./types";
import { TemplateComp } from "./TemplateComp";
import { collectText, ensureFonts } from "./fonts";

export const BESPOKE_STAGGER_MS = 320;

export type ResolvedBeat = {
  kind: "template" | "bespoke";
  clip: ClipDef;
  /** 交给 RemotionStage 的额外 inputProps */
  extraProps: Record<string, unknown>;
  /** bespoke 片段的自定义文案（走原有 CustomTextContext） */
  customTexts?: Record<string, string>;
  markers: KeyframeMarker[];
  fields: FieldDef[];
  totalFrames: number;
  durationSec: number;
  theme: PaperThemeKey;
  fontScale: number;
  exportName: string;
  plan?: ComputedPlan;
  /** 导出参数 */
  params: AnimParams;
  error?: string;
};

function staggerFramesOf(ms: number) {
  return Math.max(6, Math.round((ms / 1000) * FPS));
}

export function bespokeTexts(content: TemplateContent): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(content)) if (k !== "clipId" && typeof v === "string") out[k] = v;
  return out;
}

export function bespokeFields(clipId: string): FieldDef[] {
  return getFieldsForClip(clipId).map((f) => ({
    key: f.key,
    label: f.label,
    placeholder: f.placeholder,
    type: f.type === "stamp" ? "stamp" : f.multiline ? "textarea" : "text",
  }));
}

export function resolveBeat(beat: Beat, ep: Pick<Episode, "number" | "theme" | "fontScale">): ResolvedBeat {
  const theme = (beat.theme ?? ep.theme ?? "classic") as PaperThemeKey;
  const fontScale = ep.fontScale || 1;
  const exportName = exportNameFor(ep, beat);

  if (beat.template === "bespoke") {
    const clipId = String(beat.content.clipId ?? "");
    const found = findClip(clipId);
    const base = found ?? CLIPS[0];
    const texts = bespokeTexts(beat.content);
    const sf = staggerFramesOf(BESPOKE_STAGGER_MS);
    const totalFrames = Math.max(1, Math.round(base.duration(sf)));
    const clip: ClipDef = { ...base, exportName };
    return {
      kind: "bespoke",
      clip,
      extraProps: {},
      customTexts: texts,
      markers: getMarkersForClip(base.id),
      fields: bespokeFields(base.id),
      totalFrames,
      durationSec: totalFrames / FPS,
      theme,
      fontScale,
      exportName,
      params: { startMs: 280, staggerMs: BESPOKE_STAGGER_MS, durationMs: 420, customTexts: texts, paperTheme: theme, fontScale },
      error: found ? undefined : `定制片段 ${clipId} 不存在（文件夹被删了？）`,
    };
  }

  const def = getTemplate(beat.template);
  if (!def) {
    const fallback = CLIPS[0];
    return {
      kind: "template",
      clip: fallback,
      extraProps: {},
      markers: [],
      fields: [],
      totalFrames: 30,
      durationSec: 1,
      theme,
      fontScale,
      exportName,
      params: { startMs: 0, staggerMs: BESPOKE_STAGGER_MS, durationMs: 420, paperTheme: theme, fontScale },
      error: `模板 ${beat.template} 不存在`,
    };
  }
  const plan = computePlan(def, beat.content, beat.timing);
  const totalFrames = Math.max(1, Math.ceil(plan.duration * FPS));
  const content = beat.content;
  const clip: ClipDef = {
    id: `tpl:${beat.id}`,
    episode: ep.number,
    code: beat.code,
    title: beat.title,
    note: def.name,
    folder: `src/templates/library/${def.id}.ts`,
    exportName,
    Comp: TemplateComp,
    duration: () => totalFrames,
    draw: (ctx, elapsed, params) =>
      renderTemplateFrame(ctx, def, content, plan, elapsed / 1000, params.paperTheme ?? theme, params.fontScale ?? fontScale),
    sfx: () => sfxFromPlan(plan),
    prepare: () => ensureFonts(collectText(content)),
  };
  return {
    kind: "template",
    clip,
    extraProps: { templateId: def.id, content, timing: beat.timing },
    markers: plan.markers.map((m) => ({
      frame: Math.round(m.at * FPS),
      timeSec: Math.round(m.at * 100) / 100,
      label: m.label,
      tag: m.tag,
      type: m.type,
    })),
    fields: def.fields,
    totalFrames,
    durationSec: plan.duration,
    theme,
    fontScale,
    exportName,
    plan,
    params: { startMs: 0, staggerMs: BESPOKE_STAGGER_MS, durationMs: 420, paperTheme: theme, fontScale },
  };
}
