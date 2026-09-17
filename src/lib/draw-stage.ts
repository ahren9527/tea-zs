import { getClip } from "@/remotion/catalog";
import type { AnimParams } from "@/remotion/shared/theme";

export type { AnimParams };

export async function preloadIcons(): Promise<void> {
  if (typeof document !== "undefined" && document.fonts) {
    await document.fonts.load('500 64px "LXGW WenKai"');
    await document.fonts.load('600 80px "LXGW WenKai"');
    await document.fonts.load('900 72px "Noto Serif SC"');
  }
}

export function totalDuration(params: AnimParams, clipId = "ep18-b1") {
  const clip = getClip(clipId);
  const staggerFrames = Math.max(6, Math.round((params.staggerMs / 1000) * 29.97));
  return (clip.duration(staggerFrames) / 29.97) * 1000;
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  params: AnimParams,
  clipId = "ep18-b1",
) {
  getClip(clipId).draw(ctx, elapsed, params);
}
