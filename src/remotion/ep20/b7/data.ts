import { framesOf } from "@/remotion/shared/theme";
import { makeVoAt, voSeconds } from "../kit/draw-kit";

/**
 * 第 20 期 B7「收尾」（约 20.9 秒）
 * A 缺了一角的整饼落下，棉纸四角依次折起包好，朱印「封」一压（别敞着）
 * B 金句竖排对联：撬时不伤叶 / 醒后才更香，逐字随口播晕开
 * C 评论区互动：像 B5 一样两列竖排大字「饼碎了」「扎到手」，下面各压一件物（碎饼 / 带一滴朱砂的茶针），
 *   被说到时各被毛笔圈一下
 * D 下期预告：新茶罐、老茶罐落下 → 被塞进一只木箱挤在一起、晃一晃（会出什么事？）→ 分开，中间一道竹青隔线 →
 *   「新茶老茶」「要不要分开放？」两行大字一直留着，最后正中一方朱印「下期见」
 * 版式原则（老板反馈）：不放小字；任一时刻一个焦点。
 */
export const SCRIPT =
  "整饼这边，撬完马上包好，密封放回去，别敞着。撬时不伤叶，醒后才更香。说到撬饼，你出过什么糗？饼碎了还是扎到手了？评论区说说。新茶老茶塞一个箱子，会出什么事？要分开放吗？下期见。";
/** 语速（字/秒）。74 字 ≈ 19.5 秒（客户要求放慢：原 4.5） */
export const CHARS_PER_SEC = 3.8;
/** 口播在本片段里的起点（秒）。配音整体偏移只改这里 */
export const VO_START_SEC = 0;
export const voAt = makeVoAt(SCRIPT, CHARS_PER_SEC, VO_START_SEC);
export const CHAR_FRAMES = framesOf(1 / CHARS_PER_SEC);

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  open: "别敞着",
  seal: "封",
  gold1: "撬时不伤叶",
  gold2: "醒后才更香",
  opt1: "饼碎了",
  opt2: "扎到手",
  teaser: "新茶老茶",
  teaserSub: "要不要分开放？",
  bye: "下期见",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
/** 口播结束后再停 END_HOLD_SEC 秒（含收尾动作 + 约 0.7 秒留白，方便剪映里剪/加速） */
export const END_HOLD_SEC = 1.45;
export const LENGTH = framesOf(VO_START_SEC + voSeconds(SCRIPT, CHARS_PER_SEC) + END_HOLD_SEC);
// A 包好封上
export const CAKE_AT = framesOf(0.05);
export const WRAP_AT = voAt("包好") - 8; // 四角依次折起
export const SEAL_HIT = voAt("密封") + 3; // 朱印「封」
export const SEAL_LIFT = 8;
export const SEAL_PRESS = 4;
export const OPEN_AT = voAt("别敞着") - 10; // 大字「别敞着」（朱印落定后）
export const PACKET_OUT = voAt("撬时") - 6;
// B 金句
export const GOLD1_AT = voAt("撬时");
export const GOLD2_AT = voAt("醒后");
export const GOLD_OUT = voAt("你出") - 2; // 金句多停一会儿（压在「说到撬饼」上）
// C 互动
export const PIECES_AT = voAt("你出") + 4;
export const NEEDLE_AT = voAt("什么糗");
export const OPT1_AT = voAt("饼碎了");
export const OPT2_AT = voAt("扎到手");
export const COMMENT_AT = voAt("评论区") - 2;
export const C_OUT = voAt("新茶") - 18; // 两列字在「评论区说说」时退场，给预告腾干净
// D 预告
export const JAR1_AT = voAt("新茶") - 2;
export const JAR2_AT = voAt("老茶") - 2;
export const BOX_AT = voAt("塞一个") - 4;
export const SHAKE_AT = voAt("会出");
export const SPLIT_AT = voAt("要分开") - 2;
export const BYE_HIT = voAt("下期见") + 3;

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const CAKE = { x: 540, y: 880, r: 270 };
export const NEW_JAR = { h: 300, x: 330, boxX: 455, splitX: 290 };
export const OLD_JAR = { h: 330, x: 750, boxX: 640, splitX: 790 };
export const JAR_BASE = 1390;
export const BOX = { x0: 240, x1: 850, top: 1190 };
/** C 两列竖排：x、首字中心 y、字号、字距 */
export const OPT_COLS = { x: [300, 780] as const, y: 470, size: 170, step: 180 };
/** D 两行大字 + 「下期见」印 */
export const TEASER = { y: 340, size: 180, subY: 560, subSize: 130 };
export const BYE = { x: 540, y: 1510, size: 210 };

// ---------------- 音效（public/tea/sfx/） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/wood.wav", at: CAKE_AT + 10, volume: 0.34 },
    { src: "tea/sfx/paper.wav", at: WRAP_AT, volume: 0.44 },
    { src: "tea/sfx/stamp.wav", at: SEAL_HIT, volume: 0.56 },
    { src: "tea/sfx/paper.wav", at: GOLD1_AT, volume: 0.3 },
    { src: "tea/sfx/celadon-chime.wav", at: GOLD2_AT + 10, volume: 0.32 },
    { src: "tea/sfx/pop2.wav", at: PIECES_AT + 8, volume: 0.36 },
    { src: "tea/sfx/tok.wav", at: NEEDLE_AT + 8, volume: 0.36 },
    { src: "tea/sfx/ding.wav", at: OPT1_AT + 4, volume: 0.3 },
    { src: "tea/sfx/ding.wav", at: OPT2_AT + 4, volume: 0.3 },
    { src: "tea/sfx/wood.wav", at: JAR1_AT + 9, volume: 0.34 },
    { src: "tea/sfx/wood.wav", at: JAR2_AT + 9, volume: 0.38 },
    { src: "tea/sfx/wood-lock.wav", at: BOX_AT + 10, volume: 0.4 },
    { src: "tea/sfx/slider-settle.wav", at: SPLIT_AT + 4, volume: 0.34 },
    { src: "tea/sfx/stamp.wav", at: BYE_HIT, volume: 0.5 },
  ];
}
