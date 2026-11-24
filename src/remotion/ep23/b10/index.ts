import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import { BYE_AT, FILM_NOTE, LENGTH, OPT1_AT, OPT2_AT, TEASER_AT, TEXT, VO, sfxHits } from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep23-b10",
  episode: 23,
  code: "B10",
  title: "投票预告",
  note: "投票预告 · " + FILM_NOTE,
  exportName: "正上茶舍_23_B10_投票预告.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep23.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: OPT1_AT, timeSec: sec(OPT1_AT), label: TEXT.opt1, tag: "投票1", type: "intro" },
    { frame: OPT2_AT, timeSec: sec(OPT2_AT), label: TEXT.opt2, tag: "投票2", type: "action" },
    {
      frame: TEASER_AT,
      timeSec: sec(TEASER_AT),
      label: TEXT.teaser,
      tag: "预告",
      type: "punchline",
    },
    { frame: BYE_AT, timeSec: sec(BYE_AT), label: TEXT.bye, tag: "收尾", type: "punchline" },
  ],
  fields: [
    { key: "opt1", label: "投票左项", default: TEXT.opt1, placeholder: TEXT.opt1 },
    { key: "opt2", label: "投票右项", default: TEXT.opt2, placeholder: TEXT.opt2 },
    { key: "teaser", label: "下期预告", default: TEXT.teaser, placeholder: TEXT.teaser },
    { key: "bye", label: "结尾字", default: TEXT.bye, placeholder: TEXT.bye },
  ],
});
