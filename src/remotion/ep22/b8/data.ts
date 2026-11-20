import { brandSignature, mg, mgLayer } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 22 期 B8「投票预告」
 * 幕一（评论区二选一投票，左右各占半屏，完整同屏停留 ≥ 1.6 秒）：「拉链口」vs「扎带勒口」竖排大字 + 毛笔圈 + 放大示意袋图；
 * 幕二（下期预告）：三层圈挡住外部潮气，但素雪茶饼内部泛起自身水汽 → 「含水量多少？」+ 朱砂问号 → 落印「下期见」+ 品牌声。
 */
export const SCRIPT =
  "评论区聊聊：你存茶的袋子，是拉链口，还是扎带勒口的？不过包装再严实，也只挡得住外面的潮气，挡不住茶自己带的水分。茶本身含水量压到多少才敢封箱？国标合格就稳了吗？我们下期见。";
export const CHARS_PER_SEC = 3.8;
export const LEAD_SEC = 0.4;
export const OFFSET_SEC = 0;

export const VO = makeVoAtFromTimes("b8", {
  script: SCRIPT,
  leadSec: LEAD_SEC,
  offsetSec: OFFSET_SEC,
  fallbackCps: CHARS_PER_SEC,
});
export const voAt = VO.voAt;

export const TEXT = {
  opt1: "拉链口",
  opt2: "扎带勒口",
  teaser: "含水量多少？",
  bye: "下期见",
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.4;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 幕一：左右半屏二选一投票（零空帧开场；两项完整同屏停留 ≥ 1.6s）
export const VOTE_IN = 0;
export const OPT1_AT = voAt("拉链口") - 2;
export const OPT2_AT = voAt("扎带勒口") - 2;
export const VOTE_OUT = voAt("包装再严实") + 17;

// 幕二：下期预告（外潮挡住 · 内水难防 → 含水量多少？ → 下期见）
export const TEASER_IN = VOTE_OUT + 6;
export const OUT_DAMP_AT = voAt("外面的潮气") - 2;
export const IN_MOIST_AT = voAt("自己带的水分") - 2;
export const HEAD_AT = voAt("含水量") - 2;
export const STD_AT = voAt("国标") - 2;
export const BYE_HIT = voAt("下期见") + 2;

// 避开右侧 120px 按钮区与底部 300px 字幕区：安全区 [40, 950]，中缝 x = 495
export const SPLIT_MID_X = 495;
export const OPT_COLS = { x: [268, 722] as const, y: 415, size: 128, step: 126 };
export const REVEAL_STEP = 3;
export const TEASER_CAKE = { x: 520, y: 960, r: 200 };
export const BYE_SEAL = { x: 520, y: 1445, size: 184 };

export function sfxHits(_staggerFrames: number) {
  return [
    mg("dingD5", OPT1_AT, { volume: 0.45 }),
    mg("dingFs5", OPT2_AT, { volume: 0.48 }),
    ...mgLayer("thump", "cakeThud", TEASER_IN + 8, { volume: 0.78 }),
    mg("swooshUp", IN_MOIST_AT + 2, { volume: 0.45 }),
    mg("dingE5", HEAD_AT, { volume: 0.48 }),
    mg("dingA5", STD_AT, { volume: 0.44 }),
    ...mgLayer("stamp", "sealWood", BYE_HIT, { volume: 0.88 }),
    ...brandSignature(BYE_HIT),
  ];
}
