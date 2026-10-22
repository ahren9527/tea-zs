import { framesOf } from "@/remotion/shared/theme";
import { foley } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 20 期 B1「存·撬·醒」（约 6.2 秒）
 * 前面两句（好茶饼怕撬坏、撬一块塞回去香照样跑）交给 AI 场景视频；这一拍只接
 * 「今天一口气讲完：茶饼怎么存、怎么撬、怎么醒」：三件小物先落位，存 / 撬 / 醒 三个大字随口播砸下，竖排成一列。
 */
export const SCRIPT = "今天一口气讲完：茶饼怎么存、怎么撬、怎么醒。";
/** 退路语速（字/秒）：真实口播里找不到某个词时（比如改了 SCRIPT）才按它推算 */
export const CHARS_PER_SEC = 3.8;
/** 片段起点比第一个字提前多少秒（物件先落定） */
export const LEAD_SEC = 0.3;
/** 口播整体偏移（秒，正数 = 字往后挪）。听着字和画面差一点就只改这里 */
export const OFFSET_SEC = 0;
/** 按马老师真实口播（ASR 逐字时间）对齐 */
export const VO = makeVoAtFromTimes("b1", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  c1: "存",
  c2: "撬",
  c3: "醒",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
/** 口播结束后再停 END_HOLD_SEC 秒（含收尾动作 + 约 0.7 秒留白，方便剪映里剪/加速） */
export const END_HOLD_SEC = 1.4;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
/** 在成片里的位置（写进面板 note） */
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);
export const SPINE_AT = framesOf(0.05); // 竹青竖线生长
/** 三个字：物先到（提前 OBJ_LEAD 帧），字随口播砸下 */
export const OBJ_LEAD = 11;
export const HITS = [voAt("存"), voAt("撬"), voAt("醒")] as const;
export const DROP = 7; // 大字下落帧数（落在口播那一帧）

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const SPINE_X = 236;
export const CHAR_X = 470;
export const ROW_Y = [470, 860, 1250] as const;
export const OBJ_X = 818;
export const CHAR_SIZE = 300;

// ---------------- 音效（新物件库 sfx-lib；高级、克制：只给主动作，≤1 下 / 0.5 秒，打在接触帧） ----------------
// 底噪在 index.ts 的 defineClip({ ambience }) 里开，这里不要再写 roomBed()。
export function sfxHits(_staggerFrames: number) {
  return [
    // 一字一物：棉纸饼落桌 / 茶针扎下 / 紫砂罐落定（物先到 OBJ_LEAD 帧，落定在大字砸下前 2–3 帧）
    foley("cakeThud", HITS[0] - OBJ_LEAD + 9, { volume: 0.9 }),
    foley("needlePierce", HITS[1] - OBJ_LEAD + 8, { volume: 0.75 }),
    foley("jarLid", HITS[2] - OBJ_LEAD + 9, { volume: 0.8 }),
  ];
}
