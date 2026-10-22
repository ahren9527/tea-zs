import { framesOf } from "@/remotion/shared/theme";
import { foley } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 20 期 B3「工具」（约 15.0 秒）
 * 茶巾正中一次只放一件工具（茶针 / 茶刀 / 茶锥），落定后做一下自己的动作（扎缝 / 顺纹推 / 拧），
 * 上方只写一个大字（找缝 / 顺纹 / 压紧）；下一件落下时上一件连字一起退开。
 * 「别用菜刀，也别上手掰」：大字「别用」，菜刀居中挨叉 → 退开 → 一只手居中挨叉；
 * 「硬砍硬掰，叶片一碎」：一块饼落下、裂开、碎叶四散，只有一个大字「碎」。
 * 版式原则（老板反馈）：不放小字；任一时刻只有一个焦点。
 */
export const SCRIPT =
  "再说撬。茶针，找松散的缝下手；茶刀，顺着纹理走；茶锥，专治压得特别紧的饼。别用菜刀，也别上手掰。硬砍硬掰，叶片一碎，饼就白压了。";
/** 退路语速（字/秒）：真实口播里找不到某个词时（比如改了 SCRIPT）才按它推算 */
export const CHARS_PER_SEC = 3.8;
/** 片段起点比第一个字提前多少秒（物件先落定） */
export const LEAD_SEC = 0.5;
/** 口播整体偏移（秒，正数 = 字往后挪）。听着字和画面差一点就只改这里 */
export const OFFSET_SEC = 0;
/** 按马老师真实口播（ASR 逐字时间）对齐 */
export const VO = makeVoAtFromTimes("b3", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  u1: "找缝",
  u2: "顺纹",
  u3: "压紧",
  no: "别用",
  broke: "碎",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
/** 口播结束后再停 END_HOLD_SEC 秒（含收尾动作 + 约 0.7 秒留白，方便剪映里剪/加速） */
export const END_HOLD_SEC = 1.35;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
/** 在成片里的位置（写进面板 note） */
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);
export const CLOTH_AT = framesOf(0.05); // 茶巾铺开
/** 三件工具：落下（名字随口播）→ 用途动作 */
export const TOOL_AT = [voAt("茶针") - 7, voAt("茶刀") - 7, voAt("茶锥") - 7] as const;
export const USE_AT = [voAt("松散"), voAt("纹理"), voAt("压得")] as const;
export const TOOLS_OUT = voAt("别用") - 14; // 三件工具退开（「别用菜刀」连得紧，先腾干净）
export const NO_AT = voAt("别用"); // 「别用」
export const CLEAVER_AT = voAt("菜刀") - 8;
export const CLEAVER_X_AT = voAt("菜刀") + 5;
export const HAND_AT = voAt("上手") - 6;
export const HAND_X_AT = voAt("掰") + 2;
export const CAKE_AT = voAt("硬掰") - 4; // 一块饼落下（手上的叉看清后再换）
export const CRACK_AT = voAt("叶片") - 18; // 裂纹先长（真实口播「叶片一碎」很快，裂和碎至少隔 0.6 秒）
export const BREAK_AT = voAt("一碎"); // 碎开、碎叶四散
export const WASTE_AT = voAt("白压"); // 「饼就白压了」（碎叶落定）

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const CLOTH = { x: 120, y: 420, w: 860, h: 1060, rot: -0.035 };
/** 工具居中摆放的高度、放大倍数、各自全长（尖 → 柄尾，未缩放） */
export const TOOL_Y = 1060;
export const TOOL_SCALE = 1.7;
export const TOOL_LEN = [420, 436, 340] as const;
/** 每件工具上方的大字 */
export const WORD = { x: 540, y: 700, size: 230 };
/** 「别用」「碎」所在的顶部焦点位 */
export const TOP_WORD = { x: 540, y: 330, size: 220 };
export const CAKE = { x: 540, y: 980, r: 250 };

// ---------------- 音效（新物件库 sfx-lib；高级、克制：只给主动作，≤1 下 / 0.5 秒，打在接触帧） ----------------
// 底噪在 index.ts 的 defineClip({ ambience }) 里开，这里不要再写 roomBed()。
export function sfxHits(_staggerFrames: number) {
  return [
    foley("clothUnroll", CLOTH_AT + 2, { volume: 0.7 }), // 茶巾铺开
    // 三件工具：只给用途动作配音（落下不配）
    foley("needlePierce", USE_AT[0] + 4, { volume: 0.85, variant: 0 }), // 茶针扎缝
    foley("needleScrape", USE_AT[1] + 2, { volume: 0.45 }), // 茶刀顺纹推（刮声压低）
    foley("needlePierce", USE_AT[2] + 1, { volume: 0.75, variant: 1, rate: 0.9 }), // 茶锥拧进（另一变体、略低沉）
    // 菜刀 / 徒手挨叉：朱砂标记不配音
    foley("cakeThud", CAKE_AT + 10, { volume: 0.7 }), // 一块饼落下
    foley("cakeCrack", BREAK_AT), // 硬掰：碎
    foley("leafScatter", BREAK_AT + 5, { volume: 0.5 }), // 碎叶四散（附属声，跟在后面、减半）
  ];
}
