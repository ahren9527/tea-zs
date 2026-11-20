import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 22 期 B3「一层密封」
 * 统一章节标题「一层 · 封住气」+ 大幅 PE 平口袋（内含素雪茶饼）0.5 秒内同步进场 →
 * 说「够厚」「勒死」时袋子带回弹右让（字左物右、留足间距），简笔平涂手指按压袋面凹陷再弹回 →
 * 切「食品级PE」与放大厚度标尺「≥ 12丝」，朱砂毛笔圈定。
 */
export const SCRIPT =
  "第一层，贴身密封层，管的是封住气，重在“够厚、勒死”。认准食品级PE袋，厚度12丝以上的加厚款。";
export const CHARS_PER_SEC = 3.8;
export const LEAD_SEC = 0.45;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b3", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

export const TEXT = {
  head: "一层 · 封住气",
  k1: "够厚",
  k2: "勒死",
  mat: "食品级PE",
  thick: "≥ 12丝",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 开场 0.5 秒内标题与主体同步进场（无空帧）
export const HEAD_AT = 0;
export const BAG_AT = 0;
export const K1_AT = voAt("够厚") - 2;
export const PRESS_AT = K1_AT + 4;
export const K2_AT = voAt("勒死") - 2;
export const KW_OUT = voAt("认准") - 4;
export const MAT_AT = voAt("食品级") - 2;
export const THICK_AT = voAt("12丝") - 2;

export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("crinkle", "paperRustle", BAG_AT + 6, { volume: 0.68 }),
    // 手指按压袋面回弹演示音效（与 K2_AT 间隔 ≥ 15 帧）
    ...mgLayer("poke", "paperRustle", PRESS_AT, { volume: 0.76 }),
    mg("dingE5", K2_AT, { volume: 0.48 }),
    mg("dingFs5", MAT_AT + 2, { volume: 0.48 }),
    ...mgLayer("stamp", "sealWood", THICK_AT + 2, { volume: 0.8 }),
  ];
}
