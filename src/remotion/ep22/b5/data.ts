import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 22 期 B5「二层纯铝」
 * 幕一：「二层 · 挡住光」承接 B4 尾帧的贴身 PE 素雪茶饼，纯铝箔袋立刻套上合拢，弹簧右让，依次挡住强光、水汽、纸箱纸浆味；
 * 幕二：辨真假——① 强光照镀铝袋透亮（朱砂大叉「镀铝 · 透光」）；② 真纯铝完全不透光、折角定形不回弹（「真纯铝 · 不透光」）。
 */
export const SCRIPT =
  "第二层，避光阻隔层，防的是“假铝箔”。外面套纯铝箔袋，挡光，隔绝水汽和外层纸箱的纸浆味。买的时候捏一捏、照照光：对着强光一照透亮的是镀铝袋，捏起来硬挺、折痕不回弹的，才是真纯铝。";
export const CHARS_PER_SEC = 3.8;
export const LEAD_SEC = 0.45;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b5", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

export const TEXT = {
  head: "二层 · 挡住光",
  b1: "挡光",
  b2: "隔水汽",
  b3: "隔箱味",
  fake: "镀铝 · 透光",
  real: "真纯铝 · 不透光",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 幕一：纯铝箔阻隔三害（开场 0.5 秒内主体与统一章节标题同步进场，并承接 B4 素雪茶饼位置）
export const HEAD_AT = 0;
export const FOIL_AT = 0;
export const BLOCK1_AT = voAt("挡光") - 2;
export const BLOCK2_AT = voAt("隔绝水汽") - 2;
export const BLOCK3_AT = voAt("纸浆味") - 4;
export const ACT1_OUT = voAt("对着强光") - 8;

// 幕二A：镀铝袋照光透亮 ×
export const FAKE_IN = voAt("对着强光") - 4;
export const FAKE_GLOW = voAt("透亮") - 2;
export const FAKE_CROSS = voAt("镀铝袋") - 2;
export const FAKE_OUT = voAt("捏起来") - 4;

// 幕二B：真纯铝不透光 + 硬挺折痕不回弹 ✓
export const REAL_IN = voAt("捏起来") - 2;
export const CREASE_AT = voAt("折痕") - 2;
export const REAL_TAG = voAt("真纯铝") - 2;

export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("thumpSoft", "foilCrinkle", FOIL_AT + 6, { volume: 0.72 }),
    mg("dingD5", BLOCK1_AT, { volume: 0.44 }),
    mg("dingE5", BLOCK2_AT, { volume: 0.46 }),
    mg("dingFs5", BLOCK3_AT, { volume: 0.48 }),
    ...mgLayer("crinkle", "foilCrinkle", FAKE_IN + 6, { volume: 0.65 }),
    mg("swish", FAKE_CROSS + 2, { volume: 0.75 }),
    ...mgLayer("thump", "foilCrinkle", REAL_IN + 6, { volume: 0.78 }),
    ...mgLayer("snap", "foilCrinkle", CREASE_AT + 2, { volume: 0.76, rate: 1.08 }),
    mg("dingA5", REAL_TAG + 2, { volume: 0.52 }),
  ];
}
