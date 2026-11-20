import { framesOf } from "@/remotion/shared/theme";
import { brandSignature, mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 22 期 B7「口诀金句」（对标 ep20 B5 标杆：宣纸条幅 + 三列竖排大字 + 朱印「三层护茶」）
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
  title: "各管一件事",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.6;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

export const SHEET_AT = framesOf(0.05);
export const RULE_AT = framesOf(0.45);
export const TITLE_AT = voAt("三层各管") - 3;
export const P1_AT = voAt("封住气") - 2;
export const P2_AT = voAt("挡住光") - 2;
export const P3_AT = voAt("护住形") - 2;
export const SEAL_HIT = P3_AT + 18;
export const SEAL_LIFT = 8;
export const SEAL_PRESS = 4;
export const SEAL_AT = SEAL_HIT - SEAL_LIFT - SEAL_PRESS;

// 版式（底部 300px 留给字幕）
export const SHEET = { x: 140, y: 290, w: 800, h: 1250 };
export const COL_X = [805, 615, 425] as const;
export const COL_Y = [745, 825, 905] as const;
export const TITLE_Y = 430;
export const COL_SIZE = 132;
export const SEAL_POS = { x: 300, y: 1295, size: 216 };

export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("swooshDown", "scrollUnroll", SHEET_AT + 1, { volume: 0.5 }),
    ...mgLayer("thumpSoft", "paperweight", SHEET_AT + 17, { volume: 0.6 }),
    mg("pop", TITLE_AT, { volume: 0.32 }),
    mg("dingD5", P1_AT, { volume: 0.38 }),
    mg("dingE5", P2_AT, { volume: 0.4 }),
    mg("dingFs5", P3_AT, { volume: 0.42 }),
    ...mgLayer("stamp", "sealWood", SEAL_HIT, { volume: 0.9 }),
    ...brandSignature(SEAL_HIT + 2),
  ];
}
