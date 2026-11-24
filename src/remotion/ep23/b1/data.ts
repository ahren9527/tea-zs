import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B1「8.5%这条线」
 * 0.5 秒内水分刻度尺与「白茶含水量」进场 → 「划了一条线」朱砂红线横穿画面 →
 * 「8.5%」重落在线上并微震 → 「安全线？」水墨大字带问号收尾，片尾 0.5s 静止。
 */
export const SCRIPT = "国标给白茶含水量划了一条线：8.5%。可这条线，真的是存茶的安全线吗？";

export const VO = makeVoAtFromTimes("b1", { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改；同屏 ≤ 12 字） */
export const TEXT = {
  label: "白茶含水量",
  num: "8.5%",
  question: "安全线？",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 时间点一律由口播推算
export const SCALE_AT = 0;
export const LINE_AT = voAt("划") - 4;
export const NUM_AT = voAt("8") - 4;
export const SAFE_AT = voAt("安全线") - 4;

export function sfxHits(_staggerFrames: number) {
  return [
    mg("swish", LINE_AT + 2, { volume: 0.55 }),
    ...mgLayer("thump", "paperweight", NUM_AT + 4, { volume: 0.82 }),
    mg("dingE5", SAFE_AT + 2, { volume: 0.48 }),
  ];
}
