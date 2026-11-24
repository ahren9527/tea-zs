import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B8「存还是喝」
 * 左右各半屏二选一分流：
 *   左半屏：≤7% → 「存」（蜜韵饼茶装入纸箱封盖）+「长期存」；
 *   右半屏：8%–8.5% → 「喝」（蜜韵饼茶配温热茶壶茶杯）+「趁早喝」；
 * 结尾左右完整同屏停留 ≥ 1.8 秒，片尾 0.5 秒静止。
 */
export const SCRIPT =
  "所以，买回来白茶，干度直接决定了是存还是喝：含水量要压在7%以内，够干，才值得长期存；贴着8%甚至8.5%走、趁早先喝掉。";

export const VO = makeVoAtFromTimes("b8", { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改；同屏 ≤ 12 字） */
export const TEXT = {
  head: "存还是喝",
  leftVal: "≤7%",
  leftAct: "存",
  leftSub: "长期存",
  rightVal: "8%–8.5%",
  rightAct: "喝",
  rightSub: "趁早喝",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.8;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

export const ENTER_AT = 0;
export const SPLIT_AT = voAt("是存") - 4;
export const STORE_AT = voAt("7") - 6;
export const STORE_CLOSE_AT = voAt("长期存") - 4;
export const DRINK_AT = voAt("贴着") - 4;
export const DRINK_POUR_AT = voAt("趁早") - 4;

export function sfxHits(_staggerFrames: number) {
  return [
    mg("swooshUp", 10, { volume: 0.34 }),
    mg("dingD5", STORE_AT + 4, { volume: 0.45 }),
    ...mgLayer("thumpSoft", "jarLid", STORE_CLOSE_AT + 6, { volume: 0.65 }),
    mg("dingA5", DRINK_AT + 4, { volume: 0.45 }),
    ...mgLayer("tok", "cakeThud", DRINK_POUR_AT + 6, { volume: 0.62 }),
  ];
}
