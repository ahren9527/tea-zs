import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B10「投票预告」
 * 幕一：左右各半屏二选一投票「靠手感 / 靠鼻子」+ 简笔手捏茶与侧脸闻香示意，完整同屏停留 ≥ 2.8 秒；
 * 幕二：下期预告「三秒能判断吗？」配蜜韵饼茶；
 * 幕三：「下期见」居中收尾（不用 brandSignature），片尾 0.5 秒静止。
 */
export const SCRIPT =
  "评论区聊聊：你判断茶干不干，靠手感，还是靠鼻子？在家没有水分仪，用手、用鼻子，三秒能判断吗？我们下期见。";

export const VO = makeVoAtFromTimes("b10", { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改；同屏 ≤ 12 字） */
export const TEXT = {
  opt1: "靠手感",
  opt2: "靠鼻子",
  teaser: "三秒能判断吗？",
  bye: "下期见",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.4;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 幕一：二选一投票（完整同屏停留 ~3.0s >> 1.5s）
export const VOTE_IN = 0;
export const OPT1_AT = voAt("靠手感") - 4;
export const OPT2_AT = voAt("靠鼻子") - 4;
export const HAND_PULSE_AT = voAt("用手") - 2;
export const NOSE_PULSE_AT = voAt("用鼻子") - 2;
export const VOTE_OUT = voAt("三秒") - 16;

// 幕二：下期预告「三秒能判断吗？」
export const TEASER_IN = VOTE_OUT + 6;
export const TEASER_AT = voAt("三秒") - 6;

// 幕三：「下期见」居中收尾
export const BYE_AT = voAt("下期见") - 2;

export const SPLIT_MID_X = 495;
export const OPT_COLS = { x: [268, 722] as const, size: 128, step: 132 };
export const REVEAL_STEP = 3;

export function sfxHits(_staggerFrames: number) {
  return [
    mg("dingD5", OPT1_AT + 2, { volume: 0.45 }),
    mg("dingFs5", OPT2_AT + 2, { volume: 0.46 }),
    ...mgLayer("thumpSoft", "cakeThud", TEASER_IN + 6, { volume: 0.72 }),
    ...mgLayer("stamp", "sealWood", BYE_AT + 4, { volume: 0.85 }),
  ];
}
