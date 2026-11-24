import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B6「散茶更危险」
 * 幕一：左「蜜韵」饼茶、右蓬松散茶，水汽点同时飘来，散茶因蓬松接触面大明显吸潮更多、迅速超标；
 * 幕二：克制演示「整批扔掉」——受潮散茶打上朱砂叉并倒入竹编废茶篓，片尾 0.5s 静止。
 */
export const SCRIPT =
  "尤其是散茶，蓬松、接触面大，同样贴着上限，比饼茶吸潮危险得多。一旦超标发霉，整批茶一泡都不能留，只能全扔掉。";

export const VO = makeVoAtFromTimes("b6", { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改；同屏 ≤ 12 字） */
export const TEXT = {
  cakeLabel: "饼茶",
  looseLabel: "散茶",
  looseTrait: "蓬松 · 接触面大",
  discard: "整批扔掉",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 幕一：左饼茶 vs 右散茶吸潮对比
export const ENTER_AT = 0;
export const FLUFF_AT = voAt("蓬松") - 4;
export const ABSORB_AT = voAt("吸潮") - 14;

// 幕二：超标发霉 → 整批扔掉
export const MOLD_AT = voAt("发霉") - 4;
export const PHASE2_AT = voAt("整批茶") - 4;
export const THROW_AT = voAt("全扔掉") - 16;

export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("thumpSoft", "cakeThud", 10, { volume: 0.65 }),
    ...mgLayer("flutter", "leafScatter", FLUFF_AT + 4, { volume: 0.52 }),
    mg("swooshUp", ABSORB_AT + 8, { volume: 0.42 }),
    mg("swish", MOLD_AT + 4, { volume: 0.56 }),
    ...mgLayer("thump", "leafScatter", THROW_AT + 14, { volume: 0.78 }),
  ];
}
