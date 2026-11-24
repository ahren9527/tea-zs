import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B2「国标不超过」
 * 幕一：国标文件纸页（GB/T 22291—2017）进场 → 「出厂」红章落定 → 「不超过 8.5%」显现并朱砂笔圈强调「不超过」；
 * 幕二：文件淡出，单焦点对比「合格上限 ≠ 保险线」，片尾 0.5s 静止。
 */
export const SCRIPT =
  "先把这条线说清。2017版白茶国标（GB/T 22291—2017）里写得很明白：出厂水分不能超过8.5%。记住“不超过”这三个字——这是厂家出厂的合格上限，不是给你存茶兜底的保险线。";

export const VO = makeVoAtFromTimes("b2", { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改） */
export const TEXT = {
  docTitle: "白茶国标",
  stdCode: "GB/T 22291—2017",
  factoryTag: "出厂",
  notExceed: "不超过",
  limitVal: "8.5%",
  upper: "合格上限",
  insurance: "保险线",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 幕一：国标文件与「不超过」重点强调
export const DOC_AT = 0;
export const CODE_AT = voAt("2017") - 4;
export const OUT_AT = voAt("出厂") - 4;
export const LIMIT_AT = voAt("不能超过") - 4;
export const EMPH_AT = voAt("不超过") - 4;

// 幕二：合格上限 ≠ 保险线
export const PHASE2_AT = voAt("这是") - 6;
export const PASS_AT = voAt("合格上限") - 4;
export const NEQ_AT = voAt("不是") - 2;
export const INS_AT = voAt("保险线") - 6;

export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("thumpSoft", "paperRustle", 8, { volume: 0.65 }),
    ...mgLayer("stamp", "sealWood", OUT_AT + 4, { volume: 0.68 }),
    mg("swish", EMPH_AT + 2, { volume: 0.55 }),
    mg("dingD5", PASS_AT + 2, { volume: 0.44 }),
    mg("swish", NEQ_AT + 2, { volume: 0.56 }),
    mg("dingD4", INS_AT + 2, { volume: 0.48 }),
  ];
}
