import { framesOf } from "@/remotion/shared/theme";
import { makeVoAt } from "../kit/draw-kit";

/**
 * 第 20 期 B3「工具」（成片 23–35s，约 12.2 秒）
 * 茶巾上依次落下三件工具（茶针 / 茶刀 / 茶锥），每件落定后做一下自己的动作（扎缝 / 顺纹推 / 拧），旁边写用途；
 * 「别用菜刀，也别上手掰」：菜刀、一只手先后落下，各挨一笔朱砂叉；
 * 「硬砍硬掰，叶片一碎」：一块饼落下、裂开、碎叶四散——饼就白压了。
 */
export const SCRIPT =
  "再说撬。茶针，找松散的缝下手；茶刀，顺着纹理走；茶锥，专治压得特别紧的饼。别用菜刀，也别上手掰。硬砍硬掰，叶片一碎，饼就白压了。";
/** 语速（字/秒）。52 字 ≈ 11.6 秒 */
export const CHARS_PER_SEC = 4.5;
/** 口播在本片段里的起点（秒）。配音整体偏移只改这里 */
export const VO_START_SEC = 0;
export const voAt = makeVoAt(SCRIPT, CHARS_PER_SEC, VO_START_SEC);

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  n1: "茶针",
  u1: "找缝",
  n2: "茶刀",
  u2: "顺纹",
  n3: "茶锥",
  u3: "压紧饼",
  no: "别用",
  broke: "碎",
  waste: "白压了",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
export const LENGTH = framesOf(12.2);
export const CLOTH_AT = framesOf(0.05); // 茶巾铺开
/** 三件工具：落下（名字随口播）→ 用途动作 */
export const TOOL_AT = [voAt("茶针") - 7, voAt("茶刀") - 7, voAt("茶锥") - 7] as const;
export const USE_AT = [voAt("松散"), voAt("纹理"), voAt("压得")] as const;
export const TOOLS_OUT = voAt("别用") - 4; // 三件工具退开
export const NO_AT = voAt("别用"); // 「别用」
export const CLEAVER_AT = voAt("菜刀") - 8;
export const CLEAVER_X_AT = voAt("菜刀") + 5;
export const HAND_AT = voAt("上手") - 6;
export const HAND_X_AT = voAt("掰") + 2;
export const CAKE_AT = voAt("硬掰") - 4; // 一块饼落下（手上的叉看清后再换）
export const CRACK_AT = voAt("叶片"); // 裂纹生长
export const BREAK_AT = voAt("一碎"); // 碎开、碎叶四散
export const WASTE_AT = voAt("白压"); // 「白压了」

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const CLOTH = { x: 120, y: 420, w: 860, h: 1060, rot: -0.035 };
export const TOOL_Y = [620, 920, 1220] as const;
export const TOOL_TIP_X = 160;
export const LABEL_X = 862;
export const CAKE = { x: 540, y: 980, r: 250 };

// ---------------- 音效（public/tea/sfx/） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/paper.wav", at: CLOTH_AT + 2, volume: 0.3 },
    { src: "tea/sfx/tok.wav", at: TOOL_AT[0] + 8, volume: 0.42 },
    { src: "tea/sfx/tok.wav", at: TOOL_AT[1] + 8, volume: 0.46 },
    { src: "tea/sfx/wood.wav", at: TOOL_AT[2] + 8, volume: 0.42 },
    { src: "tea/sfx/wood-stamp.wav", at: CLEAVER_AT + 9, volume: 0.48 },
    { src: "tea/sfx/stamp.wav", at: CLEAVER_X_AT, volume: 0.4 },
    { src: "tea/sfx/stamp.wav", at: HAND_X_AT, volume: 0.4 },
    { src: "tea/sfx/wood.wav", at: CAKE_AT + 10, volume: 0.4 },
    { src: "tea/sfx/tea-rustle-hiss.wav", at: CRACK_AT, volume: 0.38 },
    { src: "tea/sfx/pop3.wav", at: BREAK_AT, volume: 0.5 },
  ];
}
