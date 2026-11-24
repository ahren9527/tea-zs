import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B4「及格不等于安全」
 * 幕一：箱子套袋装蜜韵饼茶随「三年 · 五年」推移，外界水汽起伏变化，国标线隐退管不到；
 * 幕二：单焦点大字「及格线 ≠ 安全线」，干净收尾、片尾 0.5s 静止。
 */
export const SCRIPT =
  "你存上三年五年，水分在袋子、箱子里怎么变，环境潮不潮，标准没法替你盯着。说白了，及格线和安全线，是两回事。";

export const VO = makeVoAtFromTimes("b4", { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改；同屏 ≤ 12 字） */
export const TEXT = {
  years: "三年 · 五年",
  stdOut: "标准盯不住",
  passLine: "及格线",
  safeLine: "安全线",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 幕一：箱袋存茶随年份与环境水汽变化
export const BOX_AT = 0;
export const YEAR_AT = voAt("三年") - 4;
export const BAG_AT = voAt("袋子") - 4;
export const DAMP_AT = voAt("环境") - 4;
export const STD_AT = voAt("标准没法") - 4;

// 幕二：及格线 ≠ 安全线
export const PHASE2_AT = voAt("说白了") - 4;
export const PASS_AT = voAt("及格线") - 4;
export const NEQ_AT = voAt("和") - 4;
export const SAFE_AT = voAt("安全线") - 4;

export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("thumpSoft", "cakeThud", 10, { volume: 0.65 }),
    mg("flutter", DAMP_AT + 2, { volume: 0.38 }),
    mg("dingD5", PASS_AT + 2, { volume: 0.46 }),
    mg("swish", NEQ_AT + 2, { volume: 0.54 }),
    mg("dingA5", SAFE_AT + 6, { volume: 0.48 }),
  ];
}
