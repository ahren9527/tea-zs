/**
 * 定制片段的字段 / 关键帧查询。数据本身写在各片段文件夹的 index.ts 里（defineClip），
 * 这里只按 id 读取，新增片段不需要改这个文件。
 */
import { findClip } from "@/remotion/catalog";
import type { ClipTextSchema, KeyframeMarker } from "@/remotion/shared/define-clip";

export type { ClipTextSchema, KeyframeMarker };

export function getMarkersForClip(clipId: string): KeyframeMarker[] {
  return findClip(clipId)?.markers ?? [];
}

export function getFieldsForClip(clipId: string): ClipTextSchema[] {
  return findClip(clipId)?.fields ?? [];
}

export function getDefaultTextsForClip(clipId: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of getFieldsForClip(clipId)) map[f.key] = f.default;
  return map;
}
