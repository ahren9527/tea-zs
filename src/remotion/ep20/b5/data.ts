import { framesOf } from "@/remotion/shared/theme";
import { makeVoAt, voSeconds } from "../kit/draw-kit";

/**
 * 第 20 期 B5「口诀」（约 6.6 秒）
 * 「记不住？就记这一句」时一张宣纸条幅轻轻落定；三句口诀按右→左竖排，逐字随口播晕开，
 * 最后一句「快取快封」是一方朱印，提起 → 砸下 → 印泥洇开。
 */
export const SCRIPT = "记不住？就记这一句：顺纹借力，够喝一周，快取快封。";
/** 语速（字/秒）。20 字 ≈ 5.3 秒（客户要求放慢：原 4.5） */
export const CHARS_PER_SEC = 3.8;
/** 口播在本片段里的起点（秒）。配音整体偏移只改这里 */
export const VO_START_SEC = 0;
export const voAt = makeVoAt(SCRIPT, CHARS_PER_SEC, VO_START_SEC);
/** 每个字说出来要多少帧（逐字晕开用） */
export const CHAR_FRAMES = framesOf(1 / CHARS_PER_SEC);

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  p1: "顺纹借力",
  p2: "够喝一周",
  seal: "快取快封",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
/** 口播结束后再停 END_HOLD_SEC 秒（含收尾动作 + 约 0.7 秒留白，方便剪映里剪/加速） */
export const END_HOLD_SEC = 1.3;
export const LENGTH = framesOf(VO_START_SEC + voSeconds(SCRIPT, CHARS_PER_SEC) + END_HOLD_SEC);
export const SHEET_AT = framesOf(0.05); // 条幅落定
export const RULE_AT = framesOf(0.5); // 竖格线生长
export const P1_AT = voAt("顺纹") - 2;
export const P2_AT = voAt("够喝") - 2;
export const SEAL_HIT = voAt("快取") + 3; // 印面接触纸面（stamp）
export const SEAL_LIFT = 8;
export const SEAL_PRESS = 4;
export const SEAL_AT = SEAL_HIT - SEAL_LIFT - SEAL_PRESS;

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const SHEET = { x: 150, y: 300, w: 780, h: 1240 };
export const COL_X = [790, 560] as const;
export const COL_Y = [700, 860] as const;
export const COL_SIZE = 138;
export const SEAL_POS = { x: 336, y: 1210, size: 290 };

// ---------------- 音效（public/tea/sfx/） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/paper.wav", at: SHEET_AT + 4, volume: 0.34 },
    { src: "tea/sfx/wood-stamp.wav", at: P1_AT + 2, volume: 0.4 },
    { src: "tea/sfx/wood-stamp.wav", at: P2_AT + 2, volume: 0.42 },
    { src: "tea/sfx/stamp.wav", at: SEAL_HIT, volume: 0.66 },
  ];
}
