import { framesOf } from "@/remotion/shared/theme";
import { makeVoAt, voSeconds } from "../kit/draw-kit";

/**
 * 第 20 期 B6「醒」（约 17.9 秒）
 * 撬下的一周量浮在画面里，一只茶杯凑过来又被朱砂一笔拦回（先别急着喝）→ 紫砂罐落下、掀盖、茶块划弧落进罐口、
 * 盖子重重合上 → 暗影扫过（避光）→ 昼夜明暗交替，墨笔一天一划，三笔实、四笔虚（三到七天）→
 * 盖子掀开一线，香气袅袅升起 → 「干醒」竖排大字。
 */
export const SCRIPT =
  "撬下来的这一周的量，先别急着喝。正确的做法是：放进陶罐或紫砂罐，避光静置三到七天，让茶醒一醒，香气就透出来了。这叫干醒，饼茶撬开后少不了这一步。";
/** 语速（字/秒）。63 字 ≈ 16.6 秒（客户要求放慢：原 4.5） */
export const CHARS_PER_SEC = 3.8;
/** 口播在本片段里的起点（秒）。配音整体偏移只改这里 */
export const VO_START_SEC = 0;
export const voAt = makeVoAt(SCRIPT, CHARS_PER_SEC, VO_START_SEC);

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  portion: "一周量",
  wait: "先别急",
  jar: "陶罐或紫砂罐",
  dark: "避光",
  daysNum: "3–7",
  daysUnit: "天",
  key: "干醒",
  keySub: "撬后少不了",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
/** 口播结束后再停 END_HOLD_SEC 秒（含收尾动作 + 约 0.7 秒留白，方便剪映里剪/加速） */
export const END_HOLD_SEC = 1.3;
export const LENGTH = framesOf(VO_START_SEC + voSeconds(SCRIPT, CHARS_PER_SEC) + END_HOLD_SEC);
export const CHUNK_AT = framesOf(0.1); // 茶块浮入
export const PORTION_AT = voAt("一周") - 2; // 「一周量」
export const CUP_AT = voAt("先别急") - 8; // 茶杯凑过来
export const WAIT_AT = voAt("别急") - 1; // 朱砂一笔 + 「先别急」
export const CUP_OUT = voAt("正确") + 2; // 茶杯退开
export const JAR_AT = voAt("正确") - 2; // 紫砂罐落下
export const LID_UP_AT = voAt("放进") - 8; // 掀盖
export const DROP_AT = voAt("放进") + 2; // 茶块划弧飞向罐口
export const DROP_DUR = 18;
export const JAR_LABEL_AT = voAt("陶罐") - 2;
export const LID_CLOSE_AT = voAt("紫砂罐") + 8; // 盖子重落（wood-lock）
export const DARK_AT = voAt("避光") - 2; // 暗影扫过
export const DAYS_AT = voAt("静置"); // 昼夜交替 + 一天一划
export const DAY_FRAMES = 7; // 每一划间隔
export const WAKE_AT = voAt("醒一醒") - 4; // 盖子掀开一线
export const AROMA_AT = voAt("香气") - 6; // 香气升起
export const KEY_AT = voAt("干醒") - 2; // 「干醒」
export const KEY_SUB_AT = voAt("少不了") - 4;

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const JAR = { x: 650, base: 1430, h: 420 };
export const CHUNK_HOME = { x: 590, y: 760, scale: 1.1 };
export const CUP = { x: 880, y: 1000 };
export const TALLY = { x0: 340, y: 660, step: 82 };

// ---------------- 音效（public/tea/sfx/） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/tea-rustle-hiss.wav", at: CHUNK_AT + 2, volume: 0.24 },
    { src: "tea/sfx/stamp.wav", at: WAIT_AT + 4, volume: 0.36 },
    { src: "tea/sfx/wood.wav", at: JAR_AT + 9, volume: 0.42 },
    { src: "tea/sfx/pop1.wav", at: DROP_AT + DROP_DUR, volume: 0.42 },
    { src: "tea/sfx/wood-lock.wav", at: LID_CLOSE_AT + 5, volume: 0.56 },
    { src: "tea/sfx/abacus-slide.wav", at: DARK_AT, volume: 0.3 },
    { src: "tea/sfx/scale-a.wav", at: DAYS_AT + 2, volume: 0.24 },
    { src: "tea/sfx/scale-b.wav", at: DAYS_AT + DAY_FRAMES * 2 + 2, volume: 0.24 },
    { src: "tea/sfx/ethereal-breeze.wav", at: AROMA_AT, volume: 0.36 },
    { src: "tea/sfx/celadon-chime.wav", at: KEY_AT + 2, volume: 0.34 },
  ];
}
