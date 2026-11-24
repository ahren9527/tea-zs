import { mg } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B7「检测报告怎么看」
 * TODO：一句话写清这一拍的画面（什么物件、字在哪、跟着哪几个词出现）。
 */
export const SCRIPT = "含水量在哪看？看这份茶随附的检测报告。找到“水分”这一项：实测值如果能压在7%以内，离8.5%的上限还远，长期存的余量就足——先说明，7%不是国标，是福建地方标准（DB35/T 1076—2010）的更严限值，也是部分严格茶企给自己定的内控线；要是贴着8%甚至8.5%走，哪怕出厂算合格，存的时候也容易受潮跑味。";

export const VO = makeVoAtFromTimes("b7", { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改；同屏 ≤ 12 字） */
export const TEXT = {
  line: "检测报告怎么看",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 时间点一律写成 voAt("词") ± 帧，提前 2–10 帧落定；不要写死秒数
export const LINE_AT = voAt("含水") - 4;

/** 只给主动作配音，间隔 ≥ 15 帧；品牌声 brandSignature() 只用于口诀落印和收尾金句 */
export function sfxHits(_staggerFrames: number) {
  return [mg("dingD5", LINE_AT + 2, { volume: 0.46 })];
}
