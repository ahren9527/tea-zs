import { framesOf } from "@/remotion/shared/theme";
import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 21 期 B3「按形态」（约 34–44s）
 * 左边蓬松散茶、右边压紧的饼茶，各进各的格子，顶部落大字「各占各区」。
 */
export const SCRIPT = "再就是按形态：散茶和饼茶，各占各的区，各走各的道。";
export const CHARS_PER_SEC = 4.5;
export const LEAD_SEC = 0.45;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b3", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  loose: "散",
  cake: "饼",
  hero: "各占各区",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
export const END_HOLD_SEC = 1.6;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

export const GRID_AT = framesOf(0.15); // 双格木匣落定
export const LOOSE_AT = voAt("散茶") - 4; // 左边蓬松散茶落入左格
export const CAKE_AT = voAt("饼茶") - 2; // 右边压紧的饼茶落入右格
export const HERO_AT = voAt("各占") - 2; // 大字「各占各区」
export const PATH_AT = voAt("各走") - 2; // 中间隔板竹青一笔加固

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const BOX = { x: 540, y: 1020, w: 860, h: 480 };
export const LEFT_X = 325;
export const RIGHT_X = 755;
export const HERO_POS = { x: 540, y: 450, size: 215 };

// ---------------- 音效（无底噪，主动作配音，间隔 ≥ 0.5s） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("thumpSoft", "paperweight", GRID_AT + 8, { volume: 0.65 }), // 木格落定
    ...mgLayer("flutter", "leafScatter", LOOSE_AT + 4, { volume: 0.6, under: 0.45 }), // 散茶轻落左格
    mg("dingD5", LOOSE_AT + 6, { volume: 0.38 }),
    ...mgLayer("thump", "cakeThud", CAKE_AT + 9, { volume: 0.85 }), // 饼茶重落右格
    mg("dingFs5", CAKE_AT + 11, { volume: 0.42 }),
    mg("dingA5", HERO_AT + 2, { volume: 0.5 }), // 「各占各区」
    mg("swish", PATH_AT + 4, { volume: 0.4 }), // 中间分界加固
  ];
}
