import { framesOf } from "@/remotion/shared/theme";
import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 22 期 B3「一层密封」
 * 顶部「一层 · 封住气」→ 加厚透明 PE 平口袋居中落定 → 说「够厚」「勒死」时袋子弹簧右让（字左物右）→
 * 切「食品级PE」与放大厚度标尺「≥ 12丝」，竹青毛笔圈定。
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

export const HEAD_AT = framesOf(0.06);
export const BAG_AT = voAt("贴身密封层") - 2;
export const K1_AT = voAt("够厚") - 2;
export const K2_AT = voAt("勒死") - 2;
export const KW_OUT = voAt("认准") - 4;
export const MAT_AT = voAt("食品级") - 2;
export const THICK_AT = voAt("12丝") - 2;

export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("crinkle", "paperRustle", BAG_AT + 6, { volume: 0.68 }),
    mg("dingD5", K1_AT, { volume: 0.46 }),
    mg("dingE5", K2_AT, { volume: 0.48 }),
    mg("dingFs5", MAT_AT + 2, { volume: 0.48 }),
    ...mgLayer("stamp", "sealWood", THICK_AT + 2, { volume: 0.8 }),
  ];
}
