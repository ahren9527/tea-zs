import { framesOf } from "@/remotion/shared/theme";
import { brandSignature, mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 21 期 B6「口诀卡」（约 6.8 秒，放慢到约 7s）
 * 完全照第 20 期 B5 的卷轴做法：
 * 宣纸条幅落定 + 乌木镇纸压住 → 淡朱砂竖格线生长 →
 * 两列右起竖排大字「年份分开放」「形态各归位」逐字随口播压下晕开 →
 * 朱砂印章「各归其位」提起、砸下、印泥洇开，配 brandSignature（古筝 + 轻铃）。
 */
export const SCRIPT = "一句话记住：年份分开放，形态各归位。";
export const CHARS_PER_SEC = 3.8;
export const LEAD_SEC = 0.55;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b6", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;
export const CHAR_FRAMES = framesOf(1 / VO.cps);

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  p1: "年份分开放",
  p2: "形态各归位",
  seal: "各归其位",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
export const END_HOLD_SEC = 2.1;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

export const SHEET_AT = framesOf(0.05); // 宣纸条幅浮落
export const RULE_AT = framesOf(0.5); // 竖格线生长
export const P1_AT = voAt("年份") - 2; // 右列「年份分开放」
export const P2_AT = voAt("形态") - 2; // 中列「形态各归位」
export const SEAL_HIT = voAt("归位") + 12; // 印面接触纸面（stamp + brandSignature）
export const SEAL_LIFT = 8;
export const SEAL_PRESS = 4;
export const SEAL_AT = SEAL_HIT - SEAL_LIFT - SEAL_PRESS;

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const SHEET = { x: 150, y: 290, w: 780, h: 1250 };
export const COL_X = [790, 560] as const;
export const COL_Y = [730, 860] as const;
export const COL_SIZE = 128;
export const SEAL_POS = { x: 332, y: 1210, size: 285 };

// ---------------- 音效（动画风为主、写实为辅，无底噪，印章落下配 brandSignature） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("swooshDown", "scrollUnroll", SHEET_AT + 1, { volume: 0.52 }), // 条幅落定
    ...mgLayer("thumpSoft", "paperweight", SHEET_AT + 17, { volume: 0.62 }), // 乌木镇纸压住
    mg("dingD5", P1_AT, { volume: 0.38 }), // 口诀一「年份分开放」晕开
    mg("dingFs5", P2_AT, { volume: 0.38 }), // 口诀二「形态各归位」晕开
    ...mgLayer("stamp", "sealWood", SEAL_HIT, { volume: 0.9 }), // 朱印「各归其位」砸下
    ...brandSignature(SEAL_HIT + 2), // 品牌签名（古筝 A4 + 轻铃 D6）
  ];
}
