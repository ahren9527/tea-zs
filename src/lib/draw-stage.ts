import { getClip } from "@/remotion/catalog";
import type { AnimParams } from "@/remotion/shared/theme";
import type { ClipDef } from "@/remotion/shared/types";

/** 片段可以传 id（经典片段）或直接传 ClipDef（模板分镜） */
export type ClipRef = string | ClipDef;

export function resolveClip(ref: ClipRef): ClipDef {
  return typeof ref === "string" ? getClip(ref) : ref;
}

export type { AnimParams };

export async function preloadIcons(): Promise<void> {
  if (typeof document !== "undefined" && document.fonts) {
    await document.fonts.load('500 64px "LXGW WenKai"');
    await document.fonts.load('600 80px "LXGW WenKai"');
    await document.fonts.load('900 72px "Noto Serif SC"');
    await Promise.all([
      document.fonts.load('700 72px "LXGW WenKai"'),
      document.fonts.load('800 72px "Noto Serif SC"'),
      document.fonts.load('700 72px "Noto Serif SC"'),
    ]).catch(() => undefined);
  }
}

export function totalDuration(params: AnimParams, clipId: ClipRef = "ep18-b1") {
  const clip = resolveClip(clipId);
  const staggerFrames = Math.max(6, Math.round((params.staggerMs / 1000) * 29.97));
  return (clip.duration(staggerFrames) / 29.97) * 1000;
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  params: AnimParams,
  clipId: ClipRef = "ep18-b1",
) {
  resolveClip(clipId).draw(ctx, elapsed, params);
}
