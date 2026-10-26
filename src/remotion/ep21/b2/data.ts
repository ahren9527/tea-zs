import { framesOf } from "@/remotion/shared/theme";
import { mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 21 期 B2「按年份」（约 18–34s）
 * 一条横向时间轴：
 * 1. 先出大数字「三年」（标注一行：福建地标）
 * 2. 再出大数字「五年」（标注一行：海交会团标）
 * 3. 最后两者都收拢成一句大字「新老分开放」，时间轴分界处立起竹青隔断，新饼居左、老饼居右。
 */
export const SCRIPT =
  "比较常见的做法是分区，按两个维度。首先按年份：先按常见分法，三年内当新茶，三年以上当老茶，这其实是福建地方标准的口径；如果按海交会2021年的团体标准，得存满五年才算老白茶。不管按三年还是五年，核心就一个：新老分开放。";
export const CHARS_PER_SEC = 4.5;
export const LEAD_SEC = 0.4;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b2", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  y3: "三年",
  tag3: "福建地标",
  y5: "五年",
  tag5: "海交会团标",
  core: "新老分开放",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
export const END_HOLD_SEC = 1.3;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

export const AXIS_AT = framesOf(0.2); // 横向时间轴生长
export const Y3_AT = voAt("三年内") - 4; // 「三年」
export const TAG3_AT = voAt("福建") - 4; // 「福建地标」
export const Y5_AT = voAt("五年") - 6; // 「五年」
export const TAG5_AT = Math.min(voAt("团体标准"), Y5_AT - 18); // 海交会团标随「五年」一起或紧随出现
export const TAG5_SHOW_AT = Y5_AT + 14;
export const CONVERGE_AT = voAt("不管按") + 4; // 三年与五年往中心收拢
export const CORE_AT = voAt("新老分开放") - 4; // 收拢成大字「新老分开放」

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const AXIS = { x0: 120, x1: 960, y: 1020 };
export const NODE_3_X = 410;
export const NODE_5_X = 690;
export const CENTER_X = 540;
/** 「五年」出现后两个大字并排：左「三年」右「五年」，同样大小，互不重叠 */
export const PAIR_X = [290, 790] as const;
export const PAIR_SCALE = 0.78;
export const HERO_Y = 520;
export const TAG_Y = 735;

// ---------------- 音效（无底噪，主动作配音，间隔 ≥ 0.5s） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    mg("swooshUp", AXIS_AT + 4, { volume: 0.42 }), // 横向时间轴生长
    ...mgLayer("thumpSoft", "paperweight", Y3_AT, { volume: 0.72 }), // 「三年」落定
    mg("dingD5", Y3_AT + 2, { volume: 0.45 }),
    mg("pop", TAG3_AT, { volume: 0.38 }), // 「福建地标」
    ...mgLayer("thumpSoft", "paperweight", Y5_AT, { volume: 0.75 }), // 「五年」落定
    mg("dingFs5", Y5_AT + 2, { volume: 0.45 }),
    mg("swooshDown", CORE_AT - 14, { volume: 0.42 }), // 「三年」「五年」上浮淡出
    ...mgLayer("stamp", "sealWood", CORE_AT + 2, { volume: 0.82 }), // 「新老分开放」落定
    mg("dingA5", CORE_AT + 4, { volume: 0.5 }),
  ];
}
