import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import {
  ABSORB_AT,
  FILM_NOTE,
  FLUFF_AT,
  LENGTH,
  MOLD_AT,
  TEXT,
  THROW_AT,
  VO,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep23-b6",
  episode: 23,
  code: "B6",
  title: "散茶更危险",
  note: "散茶更危险 · " + FILM_NOTE,
  exportName: "正上茶舍_23_B6_散茶更危险.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep23.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: FLUFF_AT, timeSec: sec(FLUFF_AT), label: TEXT.looseTrait, tag: "散茶", type: "intro" },
    { frame: ABSORB_AT, timeSec: sec(ABSORB_AT), label: "吸潮对比", tag: "演示", type: "action" },
    { frame: MOLD_AT, timeSec: sec(MOLD_AT), label: "超标发霉", tag: "警示", type: "punchline" },
    {
      frame: THROW_AT,
      timeSec: sec(THROW_AT),
      label: TEXT.discard,
      tag: "收尾",
      type: "punchline",
    },
  ],
  fields: [
    { key: "cakeLabel", label: "左标", default: TEXT.cakeLabel, placeholder: TEXT.cakeLabel },
    { key: "looseLabel", label: "右标", default: TEXT.looseLabel, placeholder: TEXT.looseLabel },
    {
      key: "looseTrait",
      label: "散茶特性",
      default: TEXT.looseTrait,
      placeholder: TEXT.looseTrait,
    },
    { key: "discard", label: "结尾大字", default: TEXT.discard, placeholder: TEXT.discard },
  ],
});
