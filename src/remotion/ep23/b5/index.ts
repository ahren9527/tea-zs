import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import { FILM_NOTE, LEAK_AT, LENGTH, OVER_AT, RAIN_AT, STICK_AT, TEXT, VO, sfxHits } from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep23-b5",
  episode: 23,
  code: "B5",
  title: "贴线就翻车",
  note: "贴线就翻车 · " + FILM_NOTE,
  exportName: "正上茶舍_23_B5_贴线就翻车.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep23.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: STICK_AT, timeSec: sec(STICK_AT), label: TEXT.hugging, tag: "贴线", type: "intro" },
    { frame: RAIN_AT, timeSec: sec(RAIN_AT), label: "梅雨一潮", tag: "外潮", type: "action" },
    { frame: LEAK_AT, timeSec: sec(LEAK_AT), label: "密封漏气", tag: "缝隙", type: "action" },
    {
      frame: OVER_AT,
      timeSec: sec(OVER_AT),
      label: TEXT.overLimit,
      tag: "超标",
      type: "punchline",
    },
  ],
  fields: [
    { key: "hugging", label: "开场标题", default: TEXT.hugging, placeholder: TEXT.hugging },
    { key: "rainTag", label: "诱因标注", default: TEXT.rainTag, placeholder: TEXT.rainTag },
    { key: "overLimit", label: "超标大字", default: TEXT.overLimit, placeholder: TEXT.overLimit },
  ],
});
