import type { PaperThemeKey } from "@/remotion/shared/theme";
import type { SfxHit } from "@/remotion/shared/sfx";
import { FPS } from "@/remotion/shared/theme";
import type { TemplateContent } from "./schema";
import type { ComputedPlan, TemplateDef } from "./types";
import { palette, paper, type Env } from "./kit/paint";

/** 画一帧：纸底 + 模板内容。预览与导出共用。 */
export function renderTemplateFrame(
  ctx: CanvasRenderingContext2D,
  def: TemplateDef,
  content: TemplateContent,
  plan: ComputedPlan,
  tSec: number,
  theme: PaperThemeKey = "classic",
  fontScale = 1,
) {
  const env: Env = { ctx, pal: palette(theme), fs: fontScale || 1, t: Math.max(0, tSec) };
  paper(env);
  ctx.save();
  try {
    def.draw(env, content, plan.P);
  } finally {
    ctx.restore();
  }
}

const DEFAULT_SFX: Record<string, string> = {
  intro: "tea/sfx/paper.wav",
  action: "tea/sfx/pop1.wav",
  stamp: "tea/sfx/stamp.wav",
  punchline: "tea/sfx/scale-a.wav",
};

/** 由关键帧标记自动生成音效（模板可在 mark 时指定，否则按类型取默认） */
export function sfxFromPlan(plan: ComputedPlan): SfxHit[] {
  return plan.markers.map((m) => ({
    src: m.sfx ?? DEFAULT_SFX[m.type],
    at: Math.round(m.at * FPS),
    volume: m.type === "stamp" ? 0.5 : 0.4,
  }));
}
