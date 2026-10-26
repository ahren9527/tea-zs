import { framesOf } from "@/remotion/shared/theme";
import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 21 期 B4「为什么分」（约 44–68s）
 * 两个原因各一屏：
 * ① 第一屏：新茶水分没稳（活跃水汽波纹）、老茶转化节奏不同（沉稳缓波），大字「节奏不同」。
 * ② 第二屏：大字「冲」对「静」：新茶飘出青绿色香气线，把旁边老茶琥珀色的陈香慢慢盖住，散茶蓬松吸味；
 *    结尾大字「分开更稳妥」。
 */
export const SCRIPT =
  "为什么要分？两个原因。首先，通常新茶水分还没完全稳定，老茶的转化节奏又不同，混着不好管理。第二个原因，新茶香“冲”，老茶香“静”，散茶蓬松，特别容易吸味；放一块，老茶的陈香迟早被新茶的青气和花香盖过去。好比想听老歌，隔壁却在大声放舞曲。分开放，成本不高，更稳妥。";
export const CHARS_PER_SEC = 4.5;
export const LEAD_SEC = 0.4;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b4", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  why: "为什么分？",
  rhythm: "节奏不同",
  chong: "冲",
  jing: "静",
  safe: "分开更稳妥",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
export const END_HOLD_SEC = 1.3;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 第一屏：水分与转化节奏
export const P1_IN = framesOf(0.2);
export const WHY_AT = Math.max(2, voAt("为什么") - 4); // 开场大字「为什么分？」
export const WHY_OUT = voAt("水分") - 8; // 说到「水分」前淡出
export const MOIST_AT = voAt("水分") - 4; // 新茶水分波动
export const SLOW_AT = voAt("老茶的") - 4; // 老茶慢转化波
export const RHYTHM_AT = voAt("节奏") - 2; // 大字「节奏不同」
export const P1_OUT = voAt("第二个") - 6; // 第一屏退场

// 第二屏：「冲」对「静」+ 香气覆盖 + 散茶吸味 + 「分开更稳妥」
export const P2_IN = voAt("第二个") + 4;
export const CHONG_AT = voAt("冲") - 2; // 大字「冲」+ 青绿香气初起
export const JING_AT = voAt("静") - 2; // 大字「静」+ 琥珀陈香
export const ABSORB_AT = voAt("吸味") - 4; // 散茶蓬松吸味
export const COVER_AT = voAt("陈香") - 4; // 青绿香气大举越界盖住琥珀陈香
export const SAFE_AT = voAt("分开放") - 2; // 结尾大字「分开更稳妥」

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const LEFT_X = 295;
export const RIGHT_X = 785;
export const CAKE_Y = 1140;
export const HERO_Y = 430;

// ---------------- 音效（无底噪，主动作配音，间隔 ≥ 0.5s） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("thump", "cakeThud", P1_IN + 9, { volume: 0.78 }), // 第一屏两茶饼落位
    mg("pop", MOIST_AT, { volume: 0.4 }), // 水分波动
    mg("dingD5", RHYTHM_AT, { volume: 0.48 }), // 「节奏不同」
    mg("swooshUp", P2_IN + 4, { volume: 0.4 }), // 切第二屏
    ...mgLayer("thump", "cakeThud", CHONG_AT, { volume: 0.8 }), // 「冲」
    mg("dingE5", CHONG_AT + 2, { volume: 0.45 }),
    mg("dingFs5", JING_AT + 2, { volume: 0.42 }), // 「静」
    ...mgLayer("flutter", "leafScatter", ABSORB_AT, { volume: 0.5, under: 0.4 }), // 散茶吸味
    mg("sparkle", COVER_AT + 4, { volume: 0.38 }), // 青绿香气盖过琥珀香
    ...mgLayer("stamp", "sealWood", SAFE_AT + 2, { volume: 0.82 }), // 「分开更稳妥」
    mg("dingA5", SAFE_AT + 4, { volume: 0.5 }),
  ];
}
