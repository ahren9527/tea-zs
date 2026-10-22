import { framesOf } from "@/remotion/shared/theme";
import { makeVoAt, voSeconds } from "../kit/draw-kit";

/**
 * 第 20 期 B1「存·撬·醒」（约 6.2 秒）
 * 前面两句（好茶饼怕撬坏、撬一块塞回去香照样跑）交给 AI 场景视频；这一拍只接
 * 「今天一口气讲完：茶饼怎么存、怎么撬、怎么醒」：三件小物先落位，存 / 撬 / 醒 三个大字随口播砸下，竖排成一列。
 */
export const SCRIPT = "今天一口气讲完：茶饼怎么存、怎么撬、怎么醒。";
/** 语速（字/秒）。18 字 ≈ 4.7 秒（客户要求放慢：原 4.5） */
export const CHARS_PER_SEC = 3.8;
/** 口播在本片段里的起点（秒）。配音整体偏移只改这里 */
export const VO_START_SEC = 0.1;
export const voAt = makeVoAt(SCRIPT, CHARS_PER_SEC, VO_START_SEC);

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  c1: "存",
  c2: "撬",
  c3: "醒",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
/** 口播结束后再停 END_HOLD_SEC 秒（含收尾动作 + 约 0.7 秒留白，方便剪映里剪/加速） */
export const END_HOLD_SEC = 1.4;
export const LENGTH = framesOf(VO_START_SEC + voSeconds(SCRIPT, CHARS_PER_SEC) + END_HOLD_SEC);
export const SPINE_AT = framesOf(0.05); // 竹青竖线生长
/** 三个字：物先到（提前 OBJ_LEAD 帧），字随口播砸下 */
export const OBJ_LEAD = 11;
export const HITS = [voAt("存"), voAt("撬"), voAt("醒")] as const;
export const DROP = 7; // 大字下落帧数（落在口播那一帧）

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const SPINE_X = 236;
export const CHAR_X = 470;
export const ROW_Y = [470, 860, 1250] as const;
export const OBJ_X = 818;
export const CHAR_SIZE = 300;

// ---------------- 音效（public/tea/sfx/） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/wood.wav", at: HITS[0] - OBJ_LEAD + 9, volume: 0.3 },
    { src: "tea/sfx/wood-stamp.wav", at: HITS[0], volume: 0.5 },
    { src: "tea/sfx/tok.wav", at: HITS[1] - OBJ_LEAD + 8, volume: 0.36 },
    { src: "tea/sfx/wood-stamp.wav", at: HITS[1], volume: 0.52 },
    { src: "tea/sfx/wood-lock.wav", at: HITS[2] - OBJ_LEAD + 9, volume: 0.34 },
    { src: "tea/sfx/stamp.wav", at: HITS[2], volume: 0.58 },
  ];
}
