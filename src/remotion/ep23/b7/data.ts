import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B7「检测报告怎么看」（约 32 秒，分三幕推进，每幕单一焦点）
 * 幕一：检测报告单进场 → 放大镜滑到「水分」一行并圈定；
 * 幕二：水分刻度尺（横向）实测值落入 ≤7% 竹青区「余量足」+ 标注缓冲余量 + 一次性关键小字说明 DB35/T 1076—2010 地方标准/企业内控；
 * 幕三：同一把刻度尺指针推到 8%–8.5% 贴红线，转为朱砂「易受潮跑味」。
 */
export const SCRIPT =
  "含水量在哪看？看这份茶随附的检测报告。找到“水分”这一项：实测值如果能压在7%以内，离8.5%的上限还远，长期存的余量就足——先说明，7%不是国标，是福建地方标准（DB35/T 1076—2010）的更严限值，也是部分严格茶企给自己定的内控线；要是贴着8%甚至8.5%走，哪怕出厂算合格，存的时候也容易受潮跑味。";

export const VO = makeVoAtFromTimes("b7", { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改） */
export const TEXT = {
  reportTitle: "检测报告",
  itemWater: "水分",
  lowVal: "≤7%",
  marginOk: "余量足",
  dbCode: "DB35/T 1076—2010",
  dbDesc: "地方标准 · 企业内控",
  highVal: "8%–8.5%",
  dampRisk: "易受潮跑味",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 幕一：检测报告 + 放大镜锁定「水分」
export const REPORT_AT = 0;
export const FIND_AT = voAt("找到") - 4;
export const WATER_AT = voAt("水分") - 4;

// 幕二：实测值 ≤7% 余量足 + DB35 关键小字说明
export const ACT2_AT = voAt("实测值") - 8;
export const SEVEN_AT = voAt("7") - 6;
export const GAP_AT = voAt("离") - 2;
export const MARGIN_AT = voAt("余量") - 4;
export const DB_AT = voAt("先说明") - 2;
export const DB_CODE_AT = voAt("福建") - 4;
export const CTRL_AT = voAt("内控线") - 6;

// 幕三：8%–8.5% 贴线易受潮跑味
export const ACT3_AT = voAt("要是") - 8;
export const HIGH_AT = voAt("贴着") - 4;
export const DAMP_AT = voAt("受潮") - 6;

export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("flutter", "paperRustle", 10, { volume: 0.65 }),
    mg("tokLight", WATER_AT + 2, { volume: 0.45 }),
    mg("dingD5", SEVEN_AT + 4, { volume: 0.46 }),
    mg("dingFs5", MARGIN_AT + 2, { volume: 0.44 }),
    mg("tokLight", DB_CODE_AT + 4, { volume: 0.36 }),
    mg("swooshUp", HIGH_AT + 4, { volume: 0.44 }),
    mg("dingD4", DAMP_AT + 4, { volume: 0.48 }),
  ];
}
