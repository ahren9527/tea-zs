import { framesOf } from "@/remotion/shared/theme";
import { brandSignature, mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 21 期 B7「收尾」（约 12.1 秒）
 * A 金句竖排对联：「年份分开放 / 香气不打架」（配 brandSignature 古筝+轻铃）
 * B 二选一投票：「混放派 / 分区派」两列大字 + 下方混放/分区茶格示意，说到时毛笔圈住
 * C 下期预告：大字「三层包装法」+ 蜜韵茶饼三层护茶结构逐层包裹 → 抽掉一层出问号 → 朱印「下期见」
 */
export const SCRIPT =
  "年份分开放，香气不打架。你家茶柜是混放派，还是分区派？下期我们聊三层包装法，到底是哪三层？少一层会如何？下期见。";
export const CHARS_PER_SEC = 4.5;
export const LEAD_SEC = 0.4;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b7", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;
export const CHAR_FRAMES = framesOf(1 / VO.cps);
/** 金句 / 投票的逐字显现间隔：比语速快一点，保证每联说完前就整列可读 */
export const REVEAL_STEP = Math.min(CHAR_FRAMES, 5);

// ---------------- 默认文案（面板可改） ----------------
export const TEXT = {
  gold1: "年份分开放",
  gold2: "香气不打架",
  opt1: "混放派",
  opt2: "分区派",
  teaser: "三层包装法",
  bye: "下期见",
};
export type TextKey = keyof typeof TEXT;

// ---------------- 时间轴（帧） ----------------
export const END_HOLD_SEC = 1.0;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// A 金句
export const GOLD1_AT = voAt("年份分开放") - 2;
export const GOLD2_AT = voAt("香气不打架") - 2;
// 金句两联要完整同屏停留一会儿：一直留到说「混放派」前，再交给投票
export const GOLD_OUT = voAt("混放派") - 16;

// B 二选一投票
export const VOTE_IN = GOLD_OUT + 8;
export const OPT1_AT = voAt("混放派") - 2;
export const OPT2_AT = voAt("分区派") - 2;
// 两个选项都圈好后再停约 1 秒，到「三层包装法」前才退场
export const VOTE_OUT = voAt("三层包装法") - 12;

// C 下期预告「三层包装法」
export const TEASER_AT = voAt("三层包装法") - 4;
export const LAYERS_AT = voAt("哪三层") - 4;
export const MISS_AT = voAt("少一层") - 2;
export const BYE_HIT = voAt("下期见") + 4;

// ---------------- 版式（底部 300px 留给字幕） ----------------
export const GOLD_X = [720, 380] as const;
export const GOLD_Y = [780, 920] as const;

export const OPT_COLS = {
  x: [320, 760] as const,
  y: 430,
  size: 162,
  step: 175,
};

export const TEASER_HEAD = { x: 540, y: 420, size: 160 };
export const TEASER_CAKE = { x: 540, y: 960, r: 140 };
export const BYE_SEAL = { x: 540, y: 1430, size: 180 };

// ---------------- 音效（动画风为主、写实为辅，无底噪，间隔 ≥ 0.5s / 15帧） ----------------
export function sfxHits(_staggerFrames: number) {
  return [
    // A 金句
    mg("dingE5", GOLD1_AT, { volume: 0.38 }), // 「年份分开放」
    ...brandSignature(GOLD2_AT + 2), // 「香气不打架」品牌签名（古筝 A4 + 轻铃 D6）

    // B 评论区投票
    ...mgLayer("thumpSoft", "cakeThud", VOTE_IN + 6, { volume: 0.62 }), // 两个投票茶盒落定
    mg("swish", OPT1_AT + 6, { volume: 0.45 }), // 毛笔圈「混放派」
    mg("swish", OPT2_AT + 6, { volume: 0.48 }), // 毛笔圈「分区派」

    // C 下期预告
    ...mgLayer("thump", "cakeThud", TEASER_AT + 6, { volume: 0.8 }), // 茶饼落定 + 「三层包装法」
    ...mgLayer("snap", "paperRustle", LAYERS_AT + 4, { volume: 0.72 }), // 三层护茶圈合拢
    ...mgLayer("crinkle", "foilCrinkle", MISS_AT + 4, { volume: 0.68 }), // 少一层抽离 + 问号
    ...mgLayer("stamp", "sealWood", BYE_HIT, { volume: 0.85 }), // 朱印「下期见」
    mg("dingD4", BYE_HIT + 2, { volume: 0.36 }),
  ];
}
