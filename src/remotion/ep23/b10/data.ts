import { mg } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B10「投票预告」
 * TODO：一句话写清这一拍的画面（什么物件、字在哪、跟着哪几个词出现）。
 */
export const SCRIPT = "评论区聊聊：你判断茶干不干，靠手感，还是靠鼻子？在家没有水分仪，用手、用鼻子，三秒能判断吗？我们下期见。";

export const VO = makeVoAtFromTimes("b10", { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改；同屏 ≤ 12 字） */
export const TEXT = {
  line: "投票预告",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 时间点一律写成 voAt("词") ± 帧，提前 2–10 帧落定；不要写死秒数
export const LINE_AT = voAt("评论") - 4;

/** 只给主动作配音，间隔 ≥ 15 帧；品牌声 brandSignature() 只用于口诀落印和收尾金句 */
export function sfxHits(_staggerFrames: number) {
  return [mg("dingD5", LINE_AT + 2, { volume: 0.46 })];
}
