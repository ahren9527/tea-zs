import { FPS, framesOf } from "@/remotion/shared/theme";

/**
 * 第 20 期 B4「顺纹撬饼」（成片 35–53s，共 18 秒）
 * 错误示范（茶锥扎饼心碎成渣）由 AI 视频完成；这一拍用「物」讲正确方法：
 * 茶饼 → 看纹理 → 饼边下针 → 顺纹裂开 → 成块撬起 → 一周量 → 包好盖章「快取快封」。
 */

/** 这一段口播（时间点全部由它推出来，改口播 / 语速后时间轴自动跟着走） */
export const SCRIPT =
  "我看有人不看纹理，茶锥对准饼心，一使劲，碎成一桌渣。撬完还摊着不封，潮气就进去了。心疼不心疼？应该要正着来：从饼边松散处下针，借着缝隙使巧劲，顺纹轻撬成块。一次只撬一周左右的量，取完快取快封。";
/** 语速：83 个字 / 18 秒 ≈ 4.6 字/秒（按 4.5 算会超出 18 秒） */
export const CHARS_PER_SEC = 4.6;
/** 口播在本片段里的起点（秒）。配音若整体偏移，只改这里 */
export const VO_START_SEC = 0;

const SPOKEN = Array.from(SCRIPT.replace(/[，。：？！、\s]/g, ""));
/** 口播里某个词开始说的时刻（帧）。找不到就报错，避免悄悄错位 */
export function voAt(phrase: string, nth = 0): number {
  const s = SPOKEN.join("");
  let idx = -1;
  for (let i = 0; i <= nth; i++) idx = s.indexOf(phrase, idx + 1);
  if (idx < 0) throw new Error(`口播里找不到「${phrase}」`);
  return framesOf(VO_START_SEC + idx / CHARS_PER_SEC);
}
export const sec = (f: number) => Math.round((f / FPS) * 100) / 100;

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  grain: "看纹理",
  turn: "正着来",
  kw1: "饼边",
  kw2: "借缝",
  kw3: "顺纹",
  portion: "一周量",
  portionSub: "≈1/8",
  seal: "快取快封",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
export const LENGTH = framesOf(18);

export const CAKE_DROP_AT = framesOf(0.15);
export const CAKE_LAND_AT = CAKE_DROP_AT + 11;
export const GRAIN_AT = voAt("纹理") - 4; // 纹理线生长 + 「看纹理」
export const GRAIN_TEXT_OUT = voAt("撬完");
export const CENTER_RING_AT = voAt("饼心") - 2; // 饼心：红色虚圈（只做提示，错误示范交给 AI 视频）
export const CENTER_X_AT = voAt("一使劲");
export const CENTER_OUT = voAt("撬完") + 6;
export const TURN_AT = voAt("应该") + 3; // 「正着来」（随「应该要正着来」出现）
export const TURN_OUT = voAt("饼边") + 2;

export const EDGE_AT = voAt("饼边") - 3; // 关键词 1 + 饼边高亮
export const NEEDLE_IN_AT = voAt("下针") - 8; // 茶针滑入
export const NEEDLE_HIT_AT = voAt("下针") + 4; // 针尖碰到饼边（needle tick）
export const GAP_AT = voAt("缝隙") - 3; // 关键词 2 + 缝隙
export const LEVER_AT = voAt("巧劲") - 2; // 茶针轻轻一别
export const GRAIN_GUIDE_AT = voAt("顺纹") - 8; // 关键词 3 + 顺纹引导线
export const CRACK_AT = voAt("顺纹") + 6; // 裂纹沿纹生长
export const CRACK_DONE = voAt("成块") + 3;
export const CHUNK_LIFT_AT = voAt("成块") + 5; // 茶块撬起（chunk pop）
export const NEEDLE_OUT_AT = voAt("一次") - 2;
export const KW_OUT_AT = voAt("一周") - 6;
export const ARC_AT = voAt("一周") - 4; // 一周量弧线
export const PORTION_TEXT_AT = voAt("左右");
export const MOVE_AT = voAt("的量") + 2; // 茶块移到棉纸上
export const WRAP_AT = voAt("取完") + 3; // 棉纸四角折起
export const SEAL_AT = voAt("快取"); // 印章提起
export const SEAL_LIFT = 8;
export const SEAL_PRESS = 4;
export const SEAL_HIT_AT = SEAL_AT + SEAL_LIFT + SEAL_PRESS; // 盖下（seal thud）

// ---------------- 版式（舞台坐标 1080×1920；底部 300px 留给字幕） ----------------
export const CAKE = { x: 540, y: 800, r: 330 };
/** 撬下来的那一块：饼边 -22.5°…+22.5°（约 1/8 饼），沿 0.62R 的纹理环裂开 */
export const CHUNK = { a0: (-22.5 * Math.PI) / 180, a1: (22.5 * Math.PI) / 180, ring: 0.62 };
export const PACKET = { x: 540, y: 1405, size: 300 };
export const TEXT_BAND_Y = 262;

// ---------------- 音效（public/tea/sfx/） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/wood.wav", at: CAKE_LAND_AT, volume: 0.32 },
    { src: "tea/sfx/paper.wav", at: GRAIN_AT, volume: 0.28 },
    { src: "tea/sfx/paper.wav", at: TURN_AT, volume: 0.34 },
    { src: "tea/sfx/tok.wav", at: NEEDLE_HIT_AT, volume: 0.5 },
    { src: "tea/sfx/tea-rustle-hiss.wav", at: CRACK_AT, volume: 0.36 },
    { src: "tea/sfx/pop2.wav", at: CHUNK_LIFT_AT, volume: 0.48 },
    { src: "tea/sfx/paper.wav", at: WRAP_AT, volume: 0.42 },
    { src: "tea/sfx/stamp.wav", at: SEAL_HIT_AT, volume: 0.62 },
  ];
}
