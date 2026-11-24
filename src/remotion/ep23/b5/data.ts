import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B5「贴线就翻车」
 * 左：统一竖向水分刻度尺（指针一开始就贴在 8.3% 紧挨朱砂红线），右：PE 袋里的蜜韵饼茶；
 * 「梅雨季一潮」斜雨落下 → 「密封稍差一点」袋口开缝漏气 → 一推把指针顶过 8.5% 红线，
 * 画面边缘泛警红、蜜韵饼茶起克制潮斑，顶部亮出「水分超标」。
 */
export const SCRIPT =
  "存茶还会直接翻车：明明存法没错，茶还是坏了——就是因为买来时水分已经贴着上限，梅雨季一潮、密封稍差一点，水分直接超标。";

export const VO = makeVoAtFromTimes("b5", { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改；同屏 ≤ 12 字） */
export const TEXT = {
  hugging: "贴着上限",
  rainTag: "梅雨季 · 漏气",
  overLimit: "水分超标",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

export const ENTER_AT = 0;
export const FLIP_AT = voAt("翻车") - 4;
export const STICK_AT = voAt("贴着上限") - 6;
export const RAIN_AT = voAt("梅雨季") - 4;
export const LEAK_AT = voAt("密封") - 4;
export const OVER_AT = voAt("超标") - 12;

export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("thumpSoft", "cakeThud", 10, { volume: 0.65 }),
    mg("tokLight", STICK_AT + 2, { volume: 0.42 }),
    mg("flutter", RAIN_AT + 2, { volume: 0.44 }),
    ...mgLayer("crinkle", "foilCrinkle", LEAK_AT + 4, { volume: 0.56 }),
    ...mgLayer("stamp", "paperweight", OVER_AT + 8, { volume: 0.88 }),
  ];
}
