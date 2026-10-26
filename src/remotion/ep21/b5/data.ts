import { framesOf } from "@/remotion/shared/theme";
import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 21 期 B5「分区实操」（约 6.0 秒）
 * 实木双层茶柜稳稳落定 → 上层蓬松散茶、下层压紧老茶饼就位 →
 * 上层贴上大标签「2025·散茶」，下层贴上大标签「2016·饼茶」，标签依次啦地贴上。
 */
export const SCRIPT =
  "同一个柜子，分层或分箱都行。每层每箱贴标签，写清年份和形态。";
export const CHARS_PER_SEC = 4.5;
export const LEAD_SEC = 0.4;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b5", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  tag1: "2025·散茶",
  tag2: "2016·饼茶",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
export const END_HOLD_SEC = 1.0;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

export const CAB_AT = framesOf(0.08);
export const TIER_AT = voAt("分层或分箱");
export const TAG1_AT = voAt("贴标签");
export const TAG2_AT = voAt("写清年份") + 4;
export const DONE_AT = voAt("形态");

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const CAB = {
  x: 540,
  y: 860,
  w: 840,
  h: 980,
  tiers: 2,
};

// ---------------- 音效（动画风为主、写实为辅，无底噪，间隔 ≥ 0.5s / 15帧） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    ...mgLayer("thump", "cakeThud", CAB_AT + 8, { volume: 0.78 }), // 茶柜落定
    ...mgLayer("thumpSoft", "leafScatter", TIER_AT + 5, { volume: 0.68 }), // 上下两层茶物落定
    ...mgLayer("snap", "paperRustle", TAG1_AT + 4, { volume: 0.85 }), // 上层标签「2025·散茶」啦地贴上
    mg("dingE5", TAG1_AT + 6, { volume: 0.36 }),
    ...mgLayer("snap", "paperRustle", TAG2_AT + 4, { volume: 0.88 }), // 下层标签「2016·饼茶」啦地贴上
    mg("dingA5", TAG2_AT + 6, { volume: 0.4 }),
  ];
}
