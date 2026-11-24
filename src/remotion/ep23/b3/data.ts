import { mg } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B3「绿茶白茶对比」
 * 左右两根竖向水分刻度尺对比：绿茶 ≤7%（晒青 9% 小字）配「几个月喝完」，
 * 白茶 ≤8.5% 配「存三五年」；末尾横向时间轴把两者水分差距直观「拉长放大」。
 */
export const SCRIPT =
  "上限对白茶来说格外要紧——拿绿茶来说，按绿茶国标（GB/T 14456.1-2017），除了晒青放宽到9%，多数绿茶水分必须压在7%以内，买回来几个月也就喝完了；白茶一存就是三五年，上限却放到了8.5%，这点水分差距会被时间放大。";

export const VO = makeVoAtFromTimes("b3", { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改） */
export const TEXT = {
  greenTitle: "绿茶",
  greenLimit: "≤7%",
  sunNote: "晒青 9%",
  greenTime: "几个月喝完",
  whiteTitle: "白茶",
  whiteLimit: "≤8.5%",
  whiteTime: "存三五年",
  amplify: "时间放大差距",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

export const ENTER_AT = 0;
export const GREEN_AT = voAt("绿茶") - 4;
export const SUN_AT = voAt("晒青") - 2;
export const GREEN7_AT = voAt("压在7") - 6;
export const MONTHS_AT = voAt("几个月") - 4;
export const WHITE_AT = voAt("白茶", 1) - 4;
export const YEARS_AT = voAt("三五年") - 4;
export const WHITE85_AT = voAt("85") - 6;
export const AMP_AT = voAt("这点水分") - 4;
export const TIME_AT = voAt("时间") - 4;

export function sfxHits(_staggerFrames: number) {
  return [
    mg("swooshUp", 8, { volume: 0.34 }),
    mg("dingD5", GREEN7_AT + 4, { volume: 0.45 }),
    mg("tokLight", MONTHS_AT + 2, { volume: 0.38 }),
    mg("dingE5", YEARS_AT + 2, { volume: 0.44 }),
    mg("dingA5", WHITE85_AT + 4, { volume: 0.48 }),
    mg("swooshUp", TIME_AT + 2, { volume: 0.46 }),
  ];
}
