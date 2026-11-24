import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import {
  EMPH_AT,
  FILM_NOTE,
  INS_AT,
  LENGTH,
  NEQ_AT,
  OUT_AT,
  PASS_AT,
  TEXT,
  VO,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep23-b2",
  episode: 23,
  code: "B2",
  title: "国标不超过",
  note: "国标不超过 · " + FILM_NOTE,
  exportName: "正上茶舍_23_B2_国标不超过.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep23.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: OUT_AT, timeSec: sec(OUT_AT), label: TEXT.factoryTag, tag: "出厂", type: "stamp" },
    {
      frame: EMPH_AT,
      timeSec: sec(EMPH_AT),
      label: TEXT.notExceed,
      tag: "强调",
      type: "punchline",
    },
    { frame: PASS_AT, timeSec: sec(PASS_AT), label: TEXT.upper, tag: "对比", type: "action" },
    { frame: NEQ_AT, timeSec: sec(NEQ_AT), label: "≠", tag: "反转", type: "punchline" },
    { frame: INS_AT, timeSec: sec(INS_AT), label: TEXT.insurance, tag: "收尾", type: "punchline" },
  ],
  fields: [
    { key: "docTitle", label: "文件标题", default: TEXT.docTitle, placeholder: TEXT.docTitle },
    { key: "stdCode", label: "国标编号", default: TEXT.stdCode, placeholder: TEXT.stdCode },
    { key: "factoryTag", label: "出厂标", default: TEXT.factoryTag, placeholder: TEXT.factoryTag },
    { key: "notExceed", label: "强调词", default: TEXT.notExceed, placeholder: TEXT.notExceed },
    { key: "limitVal", label: "上限值", default: TEXT.limitVal, placeholder: TEXT.limitVal },
    { key: "upper", label: "对比上行", default: TEXT.upper, placeholder: TEXT.upper },
    { key: "insurance", label: "对比下行", default: TEXT.insurance, placeholder: TEXT.insurance },
  ],
});
