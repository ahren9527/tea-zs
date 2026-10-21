import { framesOf } from "@/remotion/shared/theme";
import { makeVoAt } from "../kit/draw-kit";

/**
 * 第 20 期 B2「存」（成片 10–23s，约 13.4 秒）
 * 棉纸饼（想撕 → 朱砂叉住 → 纸抚平）→ 铝箔袋从上滑下套住、封口一压 → 袋子侧倒成「放在架上」→
 * 屋角侧视：竹帘落下挡窗光（避光）、架子离地（标尺）、离墙（标尺）→ 镜头推近，呼吸般安稳：转化稳。
 */
export const SCRIPT =
  "饼茶自带一层棉纸，别撕，留着。外面再套密封袋或铝箔袋。放哪？就六个字：避光，离地，离墙。只要没异味、不受潮，整饼密封存着，转化稳了，风险也低了。";
/** 语速（字/秒）。58 字 ≈ 12.9 秒 */
export const CHARS_PER_SEC = 4.5;
/** 口播在本片段里的起点（秒）。配音整体偏移只改这里 */
export const VO_START_SEC = 0;
export const voAt = makeVoAt(SCRIPT, CHARS_PER_SEC, VO_START_SEC);

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  paper: "棉纸",
  noTear: "别撕",
  keep: "留着",
  bag: "铝箔袋",
  dark: "避光",
  floor: "离地",
  wall: "离墙",
  cond: "无异味 · 不受潮",
  calm: "转化稳",
  calmSub: "风险低",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
export const LENGTH = framesOf(13.4);
export const CAKE_DROP_AT = framesOf(0.1);
export const CAKE_FALL = 11;
export const PAPER_LABEL_AT = voAt("棉纸") - 6;
export const TEAR_AT = voAt("别撕") - 6; // 纸被揭起一角
export const CROSS_AT = voAt("别撕") + 1; // 朱砂叉 + 「别撕」
export const KEEP_AT = voAt("留着"); // 纸抚平 + 「留着」
export const BAG_AT = voAt("外面") - 2; // 铝箔袋从上滑下
export const BAG_DONE = voAt("密封袋") + 8;
export const SEAL_AT = voAt("铝箔袋") + 2; // 封口压合
export const TILT_AT = voAt("放哪") - 4; // 袋子侧倒、镜头拉远进屋角
export const TILT_DUR = 22;
export const DARK_AT = voAt("避光") - 3; // 竹帘落下
export const FLOOR_AT = voAt("离地") - 3; // 离地标尺
export const WALL_AT = voAt("离墙") - 3; // 离墙标尺
export const COND_AT = voAt("只要") + 2; // 「无异味·不受潮」
export const WORDS_OUT = voAt("整饼"); // 六个字退淡
export const PUSH_AT = voAt("整饼") - 6; // 镜头推近袋子
export const CALM_AT = voAt("转化稳") - 2; // 「转化稳」
export const CALM_SUB_AT = voAt("风险"); // 「风险低」

// ---------------- 版式（舞台坐标；底部 300px 留给字幕） ----------------
export const CAKE = { x: 540, y: 860, r: 290 };
export const BAG = { w: 700, h: 760 }; // 俯视的袋子
export const ROOM = { floorY: 1450, wallX: 940, winX: 70, winY: 290, winW: 360, winH: 470 };
export const SHELF = { y: 1170, w: 520, gap: 124 }; // 架面高度、宽、离墙距离
export const PACK = { w: 390, h: 64 }; // 侧视袋子

// ---------------- 音效（public/tea/sfx/） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/wood.wav", at: CAKE_DROP_AT + CAKE_FALL, volume: 0.34 },
    { src: "tea/sfx/paper.wav", at: TEAR_AT, volume: 0.44 },
    { src: "tea/sfx/stamp.wav", at: CROSS_AT, volume: 0.42 },
    { src: "tea/sfx/paper.wav", at: KEEP_AT, volume: 0.3 },
    { src: "tea/sfx/tea-rustle-hiss.wav", at: BAG_AT, volume: 0.3 },
    { src: "tea/sfx/airtight-seal.wav", at: SEAL_AT, volume: 0.5 },
    { src: "tea/sfx/ethereal-breeze.wav", at: TILT_AT, volume: 0.22 },
    { src: "tea/sfx/abacus-slide.wav", at: DARK_AT, volume: 0.36 },
    { src: "tea/sfx/wood.wav", at: FLOOR_AT + 3, volume: 0.36 },
    { src: "tea/sfx/slider-settle.wav", at: WALL_AT + 3, volume: 0.36 },
    { src: "tea/sfx/celadon-chime.wav", at: CALM_AT, volume: 0.3 },
  ];
}
