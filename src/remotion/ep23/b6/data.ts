import { mg } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B6「散茶更危险」
 * TODO：一句话写清这一拍的画面（什么物件、字在哪、跟着哪几个词出现）。
 */
export const SCRIPT = "尤其是散茶，蓬松、接触面大，同样贴着上限，比饼茶吸潮危险得多。一旦超标发霉，整批茶一泡都不能留，只能全扔掉。";

export const VO = makeVoAtFromTimes("b6", { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改；同屏 ≤ 12 字） */
export const TEXT = {
  line: "散茶更危险",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 时间点一律写成 voAt("词") ± 帧，提前 2–10 帧落定；不要写死秒数
export const LINE_AT = voAt("尤其") - 4;

/** 只给主动作配音，间隔 ≥ 15 帧；品牌声 brandSignature() 只用于口诀落印和收尾金句 */
export function sfxHits(_staggerFrames: number) {
  return [mg("dingD5", LINE_AT + 2, { volume: 0.46 })];
}
