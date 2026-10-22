import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  BOX_AT,
  BYE_HIT,
  COMMENT_AT,
  GOLD1_AT,
  JAR1_AT,
  FILM_NOTE,
  VO,
  LENGTH,
  OPT1_AT,
  OPT2_AT,
  SEAL_HIT,
  SPLIT_AT,
  TEXT,
  WRAP_AT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep20-b7",
  episode: 20,
  code: "B7",
  title: "收尾",
  note:
    "整饼包好盖「封」· 金句竖排「撬时不伤叶 / 醒后才更香」· 两列竖排「饼碎了 / 扎到手」· 下期：新茶老茶 / 要不要分开放？· 朱印下期见 · " +
    FILM_NOTE,
  exportName: "正上茶舍_20_B7_收尾.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  ambience: true, // 整拍极低的茶室底噪（-40 LUFS），sfxHits 里不再写 roomBed()
  refVo: { src: "tea/vo/ep20.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: WRAP_AT, timeSec: sec(WRAP_AT), label: "包好", tag: "包", type: "action" },
    { frame: SEAL_HIT, timeSec: sec(SEAL_HIT), label: "封", tag: "封", type: "stamp" },
    { frame: GOLD1_AT, timeSec: sec(GOLD1_AT), label: "金句", tag: "金句", type: "punchline" },
    { frame: OPT1_AT, timeSec: sec(OPT1_AT), label: "饼碎了", tag: "选项一", type: "action" },
    { frame: OPT2_AT, timeSec: sec(OPT2_AT), label: "扎到手", tag: "选项二", type: "action" },
    {
      frame: COMMENT_AT,
      timeSec: sec(COMMENT_AT),
      label: "评论区说说",
      tag: "互动",
      type: "action",
    },
    { frame: JAR1_AT, timeSec: sec(JAR1_AT), label: "下期预告", tag: "预告", type: "intro" },
    { frame: BOX_AT, timeSec: sec(BOX_AT), label: "塞进一个箱子", tag: "箱", type: "action" },
    { frame: SPLIT_AT, timeSec: sec(SPLIT_AT), label: "分开放", tag: "分开", type: "action" },
    { frame: BYE_HIT, timeSec: sec(BYE_HIT), label: "下期见", tag: "印", type: "stamp" },
  ],
  fields: [
    { key: "open", label: "包好后大字", default: TEXT.open, placeholder: TEXT.open },
    {
      key: "seal",
      label: "封条印（1 字）",
      default: TEXT.seal,
      placeholder: TEXT.seal,
      type: "stamp",
    },
    { key: "gold1", label: "金句上联（竖排）", default: TEXT.gold1, placeholder: TEXT.gold1 },
    { key: "gold2", label: "金句下联（竖排）", default: TEXT.gold2, placeholder: TEXT.gold2 },
    { key: "opt1", label: "糗事一（竖排）", default: TEXT.opt1, placeholder: TEXT.opt1 },
    { key: "opt2", label: "糗事二（竖排）", default: TEXT.opt2, placeholder: TEXT.opt2 },
    { key: "teaser", label: "下期标题（大字）", default: TEXT.teaser, placeholder: TEXT.teaser },
    {
      key: "teaserSub",
      label: "下期问句（大字）",
      default: TEXT.teaserSub,
      placeholder: TEXT.teaserSub,
    },
    {
      key: "bye",
      label: "下期见（印章）",
      default: TEXT.bye,
      placeholder: TEXT.bye,
      type: "stamp",
    },
  ],
});
