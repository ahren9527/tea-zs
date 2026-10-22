/**
 * 定制片段模块的约定：每个手写节拍是一个文件夹
 *   src/remotion/epNN/<节拍>/index.ts   ← export default defineClip({...})
 * catalog.ts 用 import.meta.glob 自动发现，不需要在任何地方登记。
 */
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
  /**
   * 可选：参考口播（只在面板预览里同步播放，永远不进导出）。
   * src 相对 public/，startSec = 本片段第 0 帧对应整条口播的秒数。
   */
  refVo?: RefVo;
};

export type RefVo = { src: string; startSec: number };

/** 取片段的参考口播（模板片段 / 旧片段没有就是 undefined） */
export function refVoOf(clip: ClipDef | undefined | null): RefVo | undefined {
  return (clip as (ClipDef & { refVo?: RefVo }) | undefined | null)?.refVo;
}

export type ClipInput = Omit<ClipModule, "folder" | "fields" | "markers"> & {
  /** 默认由 catalog 按文件夹路径自动填 */
  folder?: string;
  fields?: ClipTextSchema[];
  markers?: KeyframeMarker[];
};

export function defineClip(def: ClipInput): ClipModule {
  return { folder: "", fields: [], markers: [], ...def };
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
