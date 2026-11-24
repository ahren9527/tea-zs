/**
 * 把「某期的一个节拍 + 面板里改过的文案」解析成预览 / 导出要用的参数。
 * 动画本身永远以代码为准（src/remotion/epNN/bX/），面板只覆盖文案。
 */
import type { ClipModule } from "@/remotion/shared/define-clip";
import { DEFAULT_FONTS, type FontChoice } from "@/remotion/shared/fonts";
import { FPS, type AnimParams } from "@/remotion/shared/theme";
import { staggerFramesOf } from "./draw-stage";

/** 旧版逐行动画用的错峰参数；现在的 draw.ts 不读它，保留只是为了 duration(stagger) 的签名 */
export const STAGGER_MS = 320;

export type ResolvedBeat = {
  clip: ClipModule;
  /** 只含非空的覆盖文案 */
  texts: Record<string, string>;
  params: AnimParams;
  totalFrames: number;
  durationSec: number;
  fontScale: number;
  fonts: FontChoice;
};

export function cleanTexts(texts: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(texts ?? {})) if (typeof v === "string" && v.trim() !== "") out[k] = v;
  return out;
}

export function resolveBeat(
  clip: ClipModule,
  overrides?: Record<string, string>,
  opts: { fontScale?: number; fonts?: FontChoice } = {},
): ResolvedBeat {
  const texts = cleanTexts(overrides);
  const totalFrames = Math.max(1, Math.round(clip.duration(staggerFramesOf(STAGGER_MS))));
  return {
    clip,
    texts,
    params: {
      startMs: 280,
      staggerMs: STAGGER_MS,
      durationMs: 420,
      customTexts: texts,
      paperTheme: "classic",
      fontScale: opts.fontScale ?? 1,
      fonts: opts.fonts ?? DEFAULT_FONTS,
    },
    totalFrames,
    durationSec: totalFrames / FPS,
    fontScale: opts.fontScale ?? 1,
    fonts: opts.fonts ?? DEFAULT_FONTS,
  };
}
