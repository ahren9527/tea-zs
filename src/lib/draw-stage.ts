import { getClip } from "@/remotion/catalog";
import { FPS, type AnimParams } from "@/remotion/shared/theme";
import type { ClipDef } from "@/remotion/shared/types";

/** 片段可以传 id，也可以直接传 ClipDef */
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

export function staggerFramesOf(staggerMs: number) {
  return Math.max(6, Math.round((staggerMs / 1000) * FPS));
}

/** 片段总时长（毫秒） */
export function totalDuration(params: AnimParams, clipId: ClipRef) {
  const clip = resolveClip(clipId);
  return (clip.duration(staggerFramesOf(params.staggerMs)) / FPS) * 1000;
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  params: AnimParams,
  clipId: ClipRef,
) {
  resolveClip(clipId).draw(ctx, elapsed, params);
}
