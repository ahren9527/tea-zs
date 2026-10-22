/**
 * 定制片段模块的约定：每个手写节拍是一个文件夹
 *   src/remotion/epNN/<节拍>/index.ts   ← export default defineClip({...})
 * catalog.ts 用 import.meta.glob 自动发现，不需要在任何地方登记。
 */
import { createElement, type ComponentType } from "react";
import { AbsoluteFill } from "remotion";
import { SfxTrack } from "./sfx";
import { roomBed, type AmbienceBed } from "./sfx-lib";
import type { ClipDef } from "./types";

export type KeyframeMarker = {
  frame: number;
  timeSec: number;
  label: string;
  tag: string;
  type: "intro" | "action" | "stamp" | "punchline";
};

export type ClipTextSchema = {
  key: string;
  label: string;
  default: string;
  placeholder?: string;
  multiline?: boolean;
  /** heading 与 text 一样渲染成单行输入 */
  type?: "text" | "stamp" | "heading";
};

/** 一个定制片段的全部信息：动画（Comp / draw / duration）+ 面板要用的字段与关键帧 */
export type ClipModule = ClipDef & {
  fields: ClipTextSchema[];
  markers: KeyframeMarker[];
  /** 可选：同一期里的排序（默认按 code 自然排序：B1 < B2 < B4-1 < B10） */
  order?: number;
};

export type ClipInput = Omit<ClipModule, "folder" | "fields" | "markers"> & {
  /** 默认由 catalog 按文件夹路径自动填 */
  folder?: string;
  fields?: ClipTextSchema[];
  markers?: KeyframeMarker[];
  /**
   * 可选：整拍的茶室底噪（循环、淡入淡出，-40 LUFS）。
   * true = 默认（room-tone.wav，-40 LUFS，淡入 20 帧 / 淡出 24 帧）；也可给 { volume, fadeIn, fadeOut, at, until, src }。
   * 预览与导出都会自动加上，不需要再写进 sfxHits（别重复）。
   */
  ambience?: boolean | AmbienceBed;
};

export function defineClip(def: ClipInput): ClipModule {
  const { ambience, ...rest } = def;
  const clip: ClipModule = { folder: "", fields: [], markers: [], ...rest };
  if (!ambience) return clip;
  const bed = roomBed(ambience === true ? {} : ambience);
  const baseSfx = clip.sfx;
  const BaseComp = clip.Comp as ComponentType<Record<string, unknown>>;
  const WithBed = (props: Record<string, unknown>) =>
    createElement(
      AbsoluteFill,
      null,
      createElement(BaseComp, props),
      createElement(SfxTrack, { hits: [bed] }),
    );
  WithBed.displayName = `WithRoomBed(${clip.id})`;
  return {
    ...clip,
    Comp: WithBed,
    sfx: (staggerFrames: number) => [...(baseSfx?.(staggerFrames) ?? []), bed],
  };
}

/** 可选的期元信息：src/remotion/epNN/episode.ts ← export default defineEpisode({...}) */
export type EpisodeMeta = {
  /** 期数；省略时取文件夹名 epNN 的数字 */
  number?: number;
  /** 本期标题（下拉框里显示） */
  title: string;
  /** 默认纸色 */
  theme?: string;
};

export function defineEpisode(meta: EpisodeMeta): EpisodeMeta {
  return meta;
}
