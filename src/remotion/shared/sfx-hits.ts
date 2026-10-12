import { findClip } from "@/remotion/catalog";
import type { SfxHit } from "./sfx";

/** 按片段 id 取音效（音效写在各片段 index.ts 的 sfx 里） */
export function hitsFor(clipId: string, staggerFrames: number): SfxHit[] {
  return findClip(clipId)?.sfx?.(staggerFrames) ?? [];
}
