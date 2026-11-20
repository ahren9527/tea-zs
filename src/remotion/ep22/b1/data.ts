import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 22 期 B1「三道关」
 * 三个杂乱塑料袋先落 → 「不是随便」朱砂划掉 → 素雪白牡丹茶饼居中落定 →
 * 随口播「封气」「阻隔」「防压」，三层防护圈逐层包覆，茶饼弹簧右让，左列依次落大字；
 * 尾句「三道关」顶部竹青大字收束。
 */
export const SCRIPT = "三层包装不是随便找三个袋子套一起，而是“封气、阻隔、防压”三道关。";
export const CHARS_PER_SEC = 3.8;
export const LEAD_SEC = 0.45;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b1", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

export const TEXT = {
  wrong: "随便套三层",
  g1: "封气",
  g2: "阻隔",
  g3: "防压",
  sum: "三道关",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

export const BAGS_AT = 0;
export const CROSS_AT = voAt("不是随便") + 4;
export const WRONG_OUT = voAt("而是") - 6;

export const CAKE_AT = voAt("而是") - 4;
export const G1_AT = voAt("封气") - 2;
export const G2_AT = voAt("阻隔") - 2;
export const G3_AT = voAt("防压") - 2;
export const SUM_AT = voAt("三道关") - 2;

// 避开右侧 120px 视频号按钮区与底部 300px 字幕区：安全区 [60, 940] × [240, 1580]
export const CAKE_CENTER_X = 520;
export const CAKE_ASIDE_DX = 160;
export const CAKE_Y = 970;
export const WORD_X = 228;
export const WORD_Y = [720, 970, 1220] as const;

export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("crinkle", "paperRustle", BAGS_AT + 6, { volume: 0.65 }),
    mg("swish", CROSS_AT + 2, { volume: 0.72 }),
    ...mgLayer("thump", "cakeThud", CAKE_AT + 6, { volume: 0.8 }),
    mg("dingD5", G1_AT, { volume: 0.45 }),
    mg("dingE5", G2_AT, { volume: 0.48 }),
    mg("dingFs5", G3_AT, { volume: 0.52 }),
    ...mgLayer("stamp", "sealWood", SUM_AT + 2, { volume: 0.8 }),
  ];
}

