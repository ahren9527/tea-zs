import { framesOf } from "@/remotion/shared/theme";
import { foley } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 20 期 B2「存」（约 16.5 秒）
 * 棉纸饼（想撕 → 朱砂叉住 → 纸抚平）→ 铝箔袋从上滑下套住、封口一压 → 袋子侧倒成「放在架上」→
 * 屋角侧视：竹帘落下挡窗光（避光）、架子离地（标尺）、离墙（标尺）→ 镜头推近，呼吸般安稳：转化稳。
 * 版式原则（老板反馈）：不放小字；任一时刻只有一个焦点大字，前一个退掉下一个才来。
 */
export const SCRIPT =
  "饼茶自带一层棉纸，别撕，留着。外面再套密封袋或铝箔袋。放哪？就六个字：避光，离地，离墙。只要没异味、不受潮，整饼密封存着，转化稳了，风险也低了。";
/** 退路语速（字/秒）：真实口播里找不到某个词时（比如改了 SCRIPT）才按它推算 */
export const CHARS_PER_SEC = 3.8;
/** 片段起点比第一个字提前多少秒（物件先落定） */
export const LEAD_SEC = 0.5;
/** 口播整体偏移（秒，正数 = 字往后挪）。听着字和画面差一点就只改这里 */
export const OFFSET_SEC = 0;
/** 按马老师真实口播（ASR 逐字时间）对齐 */
export const VO = makeVoAtFromTimes("b2", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  paper: "棉纸",
  noTear: "别撕",
  bag: "铝箔袋",
  dark: "避光",
  floor: "离地",
  wall: "离墙",
  calm: "转化稳",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
/** 口播结束后再停 END_HOLD_SEC 秒（含收尾动作 + 约 0.7 秒留白，方便剪映里剪/加速） */
export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
/** 在成片里的位置（写进面板 note） */
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);
export const CAKE_DROP_AT = framesOf(0.1);
export const CAKE_FALL = 11;
export const PAPER_LABEL_AT = voAt("棉纸") - 8; // 大字「棉纸」（「别撕」落下时退掉）
export const TEAR_AT = voAt("别撕") - 6; // 纸被揭起一角
export const CROSS_AT = voAt("别撕") + 1; // 朱砂叉 + 「别撕」
/** 纸抚平（口播里「别撕，留着」连得很紧：至少让叉先停 0.6 秒） */
export const KEEP_AT = Math.max(voAt("留着"), CROSS_AT + 18);
export const BAG_AT = voAt("外面") - 2; // 铝箔袋从上滑下
export const BAG_DONE = voAt("密封袋") + 8;
export const SEAL_AT = voAt("铝箔袋") + 2; // 封口压合
export const TILT_AT = voAt("放哪") - 4; // 袋子侧倒、镜头拉远进屋角
export const TILT_DUR = 22;
export const DARK_AT = voAt("避光") - 3; // 竹帘落下
export const FLOOR_AT = voAt("离地") - 3; // 离地标尺
export const WALL_AT = voAt("离墙") - 3; // 离墙标尺
export const WORDS_OUT = voAt("整饼"); // 六个字退淡
export const PUSH_AT = voAt("整饼") - 6; // 镜头推近袋子
export const CALM_AT = voAt("转化稳") - 2; // 「转化稳」

// ---------------- 版式（舞台坐标；底部 300px 留给字幕） ----------------
export const CAKE = { x: 540, y: 860, r: 290 };
export const BAG = { w: 700, h: 760 }; // 俯视的袋子
export const ROOM = { floorY: 1450, wallX: 940, winX: 70, winY: 290, winW: 360, winH: 470 };
export const SHELF = { y: 1170, w: 520, gap: 124 }; // 架面高度、宽、离墙距离
export const PACK = { w: 390, h: 64 }; // 侧视袋子
/** 俯视段的焦点大字（棉纸 → 别撕 → 铝箔袋 依次占同一个位置） */
export const HERO = { x: 540, y: 330, size: 200 };
/** 屋角段：避光 / 离地 / 离墙 三行大字，在窗右侧逐行落下 */
export const ROOM_WORDS = { x: 690, y: 450, size: 170, step: 196 };

// ---------------- 音效（新物件库 sfx-lib；高级、克制：只给主动作，≤1 下 / 0.5 秒，打在接触帧） ----------------
// 底噪在 index.ts 的 defineClip({ ambience }) 里开，这里不要再写 roomBed()。
export function sfxHits(_staggerFrames: number) {
  return [
    foley("cakeThud", CAKE_DROP_AT + CAKE_FALL, { volume: 0.85 }), // 棉纸饼落桌
    foley("paperTear", TEAR_AT + 2, { volume: 0.7 }), // 想撕：纸被揭起一角（朱砂叉不配音）
    foley("paperRustle", KEEP_AT, { volume: 0.55 }), // 纸抚平
    foley("foilCrinkle", BAG_AT + 4, { volume: 0.7 }), // 铝箔袋滑下套住
    foley("foilSeal", SEAL_AT, { volume: 0.9 }), // 封口一压
    foley("whoosh", TILT_AT, { volume: 0.3 }), // 唯一一次大镜头：侧倒拉远进屋角
    foley("scrollUnroll", DARK_AT, { volume: 0.45 }), // 竹帘落下（避光）；离地 / 离墙标尺与大字不配音
  ];
}
