import { framesOf } from "@/remotion/shared/theme";
import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 22 期 B4「鹅颈封口」
 * 幕一：拉链自封口老化慢漏气 → 朱砂大叉划掉；
 * 幕二：改用平口袋 → 顺着茶叶挤气八九成（不抽真空）→ 拧成麻花 → 对折成鹅颈 → 扎带死死勒两道；
 * 幕三：素雪茶饼带着原装白棉纸直接装入平口袋，大字「原装棉纸别拆」。
 */
export const SCRIPT =
  "注意，普通拉链自封口用久了，胶条老化会慢漏气，长期存要用平口袋：顺着茶叶把空气挤出八九成，别抽真空；然后袋口拧成麻花、对折成鹅颈状，用扎带死死勒住两道。要是存茶饼，原装棉纸别拆，带着棉纸直接装。";
export const CHARS_PER_SEC = 3.8;
export const LEAD_SEC = 0.45;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b4", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

export const TEXT = {
  zipBad: "拉链慢漏气",
  flatTag: "用平口袋",
  step1: "挤气八九成",
  step2: "拧成麻花",
  step3: "折成鹅颈",
  step4: "扎带勒两道",
  cotton: "原装棉纸别拆",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 幕一：拉链自封口慢漏气
export const ZIP_AT = framesOf(0.06);
export const LEAK_AT = voAt("胶条老化") - 2;
export const CROSS_AT = voAt("慢漏气") - 2;
export const ACT1_OUT = voAt("长期存") - 6;

// 幕二：鹅颈两道扎带步步演进
export const FLAT_IN = voAt("长期存") - 2;
export const SQUEEZE_AT = voAt("挤出") - 2;
export const TWIST_AT = voAt("拧成麻花") - 2;
export const FOLD_AT = voAt("对折") - 2;
export const TIE1_AT = voAt("用扎带") + 4;
export const TIE2_AT = voAt("两道") - 2;
export const ACT2_OUT = voAt("要是存茶饼") - 6;

// 幕三：带原装棉纸直接装
export const COTTON_IN = voAt("要是存茶饼") - 2;
export const COTTON_SLIDE = voAt("带着棉纸") - 2;

export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("crinkle", "paperRustle", ZIP_AT + 8, { volume: 0.62 }),
    mg("swish", CROSS_AT + 2, { volume: 0.75 }),
    ...mgLayer("thumpSoft", "paperRustle", FLAT_IN + 8, { volume: 0.68 }),
    mg("swooshDown", SQUEEZE_AT + 2, { volume: 0.55 }),
    ...mgLayer("crinkle", "paperRustle", TWIST_AT + 2, { volume: 0.68 }),
    mg("flutter", FOLD_AT + 2, { volume: 0.58 }),
    ...mgLayer("snap", "foilSeal", TIE1_AT, { volume: 0.8 }),
    ...mgLayer("snap", "foilSeal", TIE2_AT, { volume: 0.85 }),
    ...mgLayer("thump", "cakeThud", COTTON_IN + 8, { volume: 0.76 }),
    mg("dingA5", COTTON_SLIDE + 4, { volume: 0.48 }),
  ];
}
