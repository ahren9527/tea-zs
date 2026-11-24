import { framesOf } from "@/remotion/shared/theme";
import { brandSignature, mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 23 期 B9「金句」水墨口诀（沿用 ep22 B7 风格：宣纸留白 + 淡墨远山 + 两团墨晕 + 马善政毛笔竖排 + 一枚朱印，无卷轴）
 * 「国标管的是出厂」右列、「存茶要自己留余量」左列，末落朱印「存茶留余」配全片唯一一次 brandSignature。
 */
export const SCRIPT = "记住一句话：国标管的是出厂，存茶要自己留余量。";

export const VO = makeVoAtFromTimes("b9", { script: SCRIPT });
export const voAt = VO.voAt;
export const CHAR_FRAMES = Math.max(3, framesOf(1 / Math.max(3.6, VO.cps)));

/** 画面上的字（面板可改；同屏 ≤ 12 字/单字段） */
export const TEXT = {
  line1: "国标管的是出厂",
  line2: "存茶要自己留余量",
  seal: "存茶留余",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.7;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 0.5 秒内第一团墨晕进场，绝不空帧
export const BLOOM_AT = [4, voAt("存茶") - 10] as const;
export const BLOOM_DUR = 24;
export const L1_AT = voAt("国标") - 2;
export const L2_AT = voAt("存茶") - 2;
export const SEAL_HIT = voAt("留余量") + 18;
export const SEAL_LIFT = 8;
export const SEAL_PRESS = 4;
export const SEAL_AT = SEAL_HIT - SEAL_LIFT - SEAL_PRESS;

// 竖排双列版式（严守 x ≤ 950、y ≤ 1560）
export const COL_X = [665, 415] as const;
export const COL_Y = [815, 865] as const;
export const COL_SIZE = 114;
export const BLOOM_RX = 128;
export const BLOOM_RY = 415;
export const SEAL_POS = { x: 205, y: 1325, size: 146 };

export function sfxHits(_staggerFrames: number) {
  return [
    mg("tokLight", BLOOM_AT[0] + 4, { volume: 0.3 }),
    mg("dingD5", L1_AT, { volume: 0.38 }),
    mg("dingE5", L2_AT, { volume: 0.42 }),
    ...mgLayer("stamp", "sealWood", SEAL_HIT, { volume: 0.9 }),
    ...brandSignature(SEAL_HIT + 2),
  ];
}
