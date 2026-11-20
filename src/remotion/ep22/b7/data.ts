import { framesOf } from "@/remotion/shared/theme";
import { brandSignature, mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 22 期 B7「口诀金句」水墨版：宣纸留白 + 淡墨远山；
 * 念「三层 / 各管 / 一件事」时三团淡墨依次洇开（一层一团），
 * 毛笔楷书「封住气 / 挡住光 / 护住形」逐字落在各自那团墨里，最后朱印「三层护茶」。
 */
export const SCRIPT = "包装不是“包起来”，是“三层各管一件事”：封住气、挡住光、护住形。";
export const CHARS_PER_SEC = 3.8;
export const LEAD_SEC = 0.45;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b7", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;
export const CHAR_FRAMES = Math.max(3, framesOf(1 / VO.cps));

export const TEXT = {
  p1: "封住气",
  p2: "挡住光",
  p3: "护住形",
  seal: "三层护茶",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.6;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

/** 三团墨依次洇开：三层 / 各管 / 一件事 */
export const BLOOM_AT = [voAt("三层") - 3, voAt("各管") - 3, voAt("一件事") - 3] as const;
export const BLOOM_DUR = 26;
export const P1_AT = voAt("封住气") - 2;
export const P2_AT = voAt("挡住光") - 2;
export const P3_AT = voAt("护住形") - 2;
export const SEAL_HIT = P3_AT + 20;
export const SEAL_LIFT = 8;
export const SEAL_PRESS = 4;
export const SEAL_AT = SEAL_HIT - SEAL_LIFT - SEAL_PRESS;

// 版式（底部 300px 留给字幕；远山只做淡背景）
export const COL_X = [790, 560, 330] as const;
export const COL_Y = [800, 880, 960] as const;
export const COL_SIZE = 186;
export const BLOOM_RX = 125;
export const BLOOM_RY = 280;
export const SEAL_POS = { x: 280, y: 1385, size: 150 };

export function sfxHits(_staggerFrames: number) {
  return [
    mg("tokLight", BLOOM_AT[0], { volume: 0.3 }),
    mg("tokLight", BLOOM_AT[1], { volume: 0.32 }),
    mg("tokLight", BLOOM_AT[2], { volume: 0.34 }),
    mg("dingD5", P1_AT, { volume: 0.38 }),
    mg("dingE5", P2_AT, { volume: 0.4 }),
    mg("dingFs5", P3_AT, { volume: 0.42 }),
    ...mgLayer("stamp", "sealWood", SEAL_HIT, { volume: 0.9 }),
    ...brandSignature(SEAL_HIT + 2),
  ];
}
