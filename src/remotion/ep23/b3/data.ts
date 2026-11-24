import { mg } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B3「绿茶白茶对比」
 * TODO：一句话写清这一拍的画面（什么物件、字在哪、跟着哪几个词出现）。
 */
export const SCRIPT = "上限对白茶来说格外要紧——拿绿茶来说，按绿茶国标（GB/T 14456.1-2017），除了晒青放宽到9%，多数绿茶水分必须压在7%以内，买回来几个月也就喝完了；白茶一存就是三五年，上限却放到了8.5%，这点水分差距会被时间放大。";

export const VO = makeVoAtFromTimes("b3", { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改；同屏 ≤ 12 字） */
export const TEXT = {
  line: "绿茶白茶对比",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 时间点一律写成 voAt("词") ± 帧，提前 2–10 帧落定；不要写死秒数
export const LINE_AT = voAt("上限") - 4;

/** 只给主动作配音，间隔 ≥ 15 帧；品牌声 brandSignature() 只用于口诀落印和收尾金句 */
export function sfxHits(_staggerFrames: number) {
  return [mg("dingD5", LINE_AT + 2, { volume: 0.46 })];
}
