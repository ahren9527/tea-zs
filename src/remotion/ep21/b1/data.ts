import { framesOf } from "@/remotion/shared/theme";
import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 21 期 B1「新老」（约 7.6 秒，可叠在钩子后段）
 * 「新」「老」两个大字，各配一个蜜韵茶饼（字左物右，字落时茶饼带回弹向右让位），
 * 中间一道竹青色分隔线慢慢长出来，把新茶、老茶隔开，最后砸下一个「分？」。
 */
export const SCRIPT =
  "新茶老茶混着存，就像把刚切的水果和老陈皮塞进同一个密封盒，结果，你懂的。";
export const CHARS_PER_SEC = 4.5;
export const LEAD_SEC = 0.35;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b1", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  cNew: "新",
  cOld: "老",
  ask: "分？",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

export const NEW_CAKE_AT = framesOf(0.08);
export const NEW_CHAR_AT = voAt("新茶") + 10;
export const OLD_CAKE_AT = voAt("老茶") + 14;
export const OLD_CHAR_AT = OLD_CAKE_AT + 18;
export const CROWD_AT = voAt("塞进"); // 两饼向中间微挤
export const LINE_AT = voAt("密封盒") - 4; // 竹青色分隔线慢慢长出，把新老推开
export const ASK_AT = voAt("结果") + 4; // 最后落一个「分？」

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const ROW_NEW_Y = 500;
export const ROW_OLD_Y = 1040;
export const LINE_Y = 770;
export const CHAR_X = 290;
export const CAKE_CENTER_X = 540;
export const CAKE_ASIDE_DX = 195; // 字出现时茶饼带回弹弹向右侧（x = 735）
export const CAKE_R_SIZE = 168;
export const CHAR_SIZE = 280;
export const ASK_POS = { x: 540, y: 1410, size: 250 };

// ---------------- 音效（动画风为主、写实为辅，无底噪，间隔 ≥ 0.5s / 15帧） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("thump", "cakeThud", NEW_CAKE_AT + 9, { volume: 0.82 }), // 新茶饼落桌 (f=11)
    mg("dingD5", NEW_CHAR_AT, { volume: 0.46 }), // 「新」落定 + 饼回弹让位 (f=32)
    ...mgLayer("thump", "cakeThud", OLD_CAKE_AT + 9, { volume: 0.85 }), // 老茶饼落桌 (f=61)
    mg("dingFs5", OLD_CHAR_AT, { volume: 0.46 }), // 「老」落定 + 饼回弹让位 (f=70 -> 与上一下隔 18 帧)
    mg("swooshUp", LINE_AT + 4, { volume: 0.45 }), // 竹青分隔线生长
    ...mgLayer("stamp", "sealWood", ASK_AT, { volume: 0.88 }), // 「分？」重落
    mg("dingA5", ASK_AT + 2, { volume: 0.42 }),
  ];
}
