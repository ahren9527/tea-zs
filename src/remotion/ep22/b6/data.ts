import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 22 期 B6「三层防压」
 * 幕一：五层瓦楞纸箱平放素雪茶饼 → 纸箱逐个往上摞高、底层纸箱真的被压扁且箱内茶饼出现裂纹，再打朱砂叉（「别摞太高」）；
 * 幕二：纸箱合盖，胶带按「工」字形三道封死（「工字封死」）；
 * 幕三：铁罐/陶罐当外壳（降饱和增高光，半剖可见内部仍套好前两层袋子的素雪茶饼），落大字「存茶 ≠ 醒茶」。
 */
export const SCRIPT =
  "第三层，防压保护层。茶饼平放着装进五层加厚瓦楞纸箱，别一摞摞太高，底层压碎变形就亏了；箱盖和箱底的缝用胶带按“工”字形全部封死，护住形。要是装进铁罐或陶罐，罐子只当外壳用，本身既挡光又防压，里面套好前两层袋子就行——记住，这是存茶，不是醒茶。";
export const CHARS_PER_SEC = 3.8;
export const LEAD_SEC = 0.45;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b6", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

export const TEXT = {
  head: "三层 · 护住形",
  boxSub: "五层瓦楞箱",
  noStack: "别摞太高",
  hSeal: "工字封死",
  shell: "罐只当外壳",
  notWake: "存茶 ≠ 醒茶",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 幕一A：五层瓦楞纸箱平放（开场 0.5 秒内主体与统一章节标题同步进场，零空帧）
export const HEAD_AT = 0;
export const BOX_AT = 0;
export const BOX_OUT = voAt("别一摞") - 6;

// 幕一B：纸箱逐个摞高 → 最底下那箱被压扁 + 茶饼开裂 → 打朱砂叉
export const STACK_IN = voAt("别一摞") - 2;
export const CRUSH_AT = voAt("压碎") - 2;
export const STACK_OUT = voAt("箱盖") - 6;

// 幕二：「工」字形胶带封死
export const SEAL_BOX_IN = voAt("箱盖") - 2;
export const CLOSE_AT = voAt("用胶带") - 8;
export const HTAPE_AT = voAt("工字形") - 4;
export const SEAL_OUT = voAt("要是装进") - 6;

// 幕三：铁罐/陶罐当外壳 + 内套前两层 + 存茶≠醒茶
export const CAN_IN = voAt("要是装进") - 2;
export const CUTAWAY_AT = voAt("套好前两层") - 4;
export const NOT_WAKE_AT = voAt("这是存茶") - 2;

export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("thump", "cakeThud", BOX_AT + 6, { volume: 0.78 }),
    mg("thumpSoft", STACK_IN + 4, { volume: 0.62 }),
    mg("thumpSoft", STACK_IN + 24, { volume: 0.68, rate: 0.94 }),
    ...mgLayer("crunch", "cakeCrack", CRUSH_AT + 2, { volume: 0.82 }),
    mg("swish", CRUSH_AT + 18, { volume: 0.74 }),
    ...mgLayer("thumpSoft", "paperweight", CLOSE_AT + 6, { volume: 0.7 }),
    ...mgLayer("scrape", "foilSeal", HTAPE_AT + 2, { volume: 0.76 }),
    ...mgLayer("tok", "jarLid", CAN_IN + 8, { volume: 0.78 }),
    mg("swooshUp", CUTAWAY_AT + 2, { volume: 0.5 }),
    ...mgLayer("stamp", "sealWood", NOT_WAKE_AT + 2, { volume: 0.85 }),
  ];
}
