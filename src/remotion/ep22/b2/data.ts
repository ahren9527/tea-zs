import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 22 期 B2「顺序对比」（内铝外塑 vs 内塑外铝）
 * 分两幕单焦点：
 * 幕一「大整箱 · 内铝外塑」：多包纯铝箔袋码放进纸箱，大塑料内胆袋向上把每一包全兜住（双重防潮）。
 * 幕二「单饼 · 内塑外铝」：素雪茶饼先套透明贴身袋，再套外层纯铝箔袋；说到「拉开外层铝箔袋就能看清」，
 * 外层铝箔袋拉下，隔着完整透明袋清晰看见素雪茶饼，水汽被贴身袋稳稳弹开。
 */
export const SCRIPT =
  "先把顺序说透：大整箱封存，用内铝外塑——每包先用铝箔袋封好，再用大塑料袋当箱内内胆，把每一包全兜在里边，双重防潮；单饼或者零散存茶，更推荐内塑外铝——贴身用透明袋，外面套铝箔袋，以后想检查茶叶受没受潮，拉开外层铝箔袋就能看清，不用拆开贴身袋放进潮气。";
export const CHARS_PER_SEC = 3.8;
export const LEAD_SEC = 0.45;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b2", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

export const TEXT = {
  boxTag: "大整箱",
  boxOrder: "内铝外塑",
  boxResult: "双重防潮",
  singleTag: "单饼 · 零散",
  singleOrder: "内塑外铝",
  checkNote: "隔袋看清",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 2.5;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 幕一：大整箱 · 内铝外塑（开场 0.5 秒内主体与标题同步进场，不留空帧）
export const BOX_IN = 0;
export const BOX_ORDER_AT = voAt("内铝外塑") - 2;
export const POUCH_AT = voAt("铝箔袋封好") - 6;
export const LINER_AT = voAt("大塑料袋") - 2;
export const WRAP_ALL_AT = voAt("全兜在里边") - 2;
export const DOUBLE_AT = voAt("双重防潮") - 2;
export const ACT1_OUT = voAt("单饼") - 6;

// 幕二：单饼 · 内塑外铝
export const ACT2_IN = voAt("单饼") - 2;
export const SINGLE_ORDER_AT = voAt("内塑") - 2;
export const PE_IN_AT = voAt("透明袋") - 4;
export const FOIL_OUT_AT = voAt("套铝箔袋") - 2;
export const PEEK_AT = voAt("拉开外层") - 2;
export const CHECK_AT = voAt("就能看清") - 2;
export const MOISTURE_AT = voAt("不用拆开");

// 幕三：结尾左右并排对比（内铝外塑 vs 内塑外铝，完整同屏停留约 2.0 秒 ≥ 1.5s）
export const COMPARE_AT = voAt("潮气") - 2;

export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("thumpSoft", "paperweight", BOX_IN + 6, { volume: 0.62 }),
    mg("dingD5", BOX_ORDER_AT, { volume: 0.46 }),
    ...mgLayer("thumpSoft", "foilCrinkle", POUCH_AT + 6, { volume: 0.7 }),
    ...mgLayer("flutter", "paperRustle", LINER_AT + 4, { volume: 0.6 }),
    ...mgLayer("snap", "foilSeal", DOUBLE_AT + 2, { volume: 0.72 }),
    mg("dingE5", SINGLE_ORDER_AT, { volume: 0.48 }),
    ...mgLayer("crinkle", "paperRustle", PE_IN_AT + 6, { volume: 0.65 }),
    ...mgLayer("swooshDown", "foilCrinkle", FOIL_OUT_AT + 4, { volume: 0.72 }),
    ...mgLayer("swooshUp", "foilCrinkle", PEEK_AT + 2, { volume: 0.75 }),
    mg("dingA5", CHECK_AT + 2, { volume: 0.48 }),
    mg("swooshUp", COMPARE_AT + 2, { volume: 0.46 }),
  ];
}

