import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import { FILM_NOTE, LENGTH, LINE_AT, NUM_AT, SAFE_AT, TEXT, VO, sfxHits } from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep23-b1",
  episode: 23,
  code: "B1",
  title: "8.5%这条线",
  note: "8.5%这条线 · " + FILM_NOTE,
  exportName: "正上茶舍_23_B1_8.5%这条线.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep23.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: LINE_AT, timeSec: sec(LINE_AT), label: "划朱砂线", tag: "刻度", type: "intro" },
    { frame: NUM_AT, timeSec: sec(NUM_AT), label: TEXT.num, tag: "上限", type: "punchline" },
    { frame: SAFE_AT, timeSec: sec(SAFE_AT), label: TEXT.question, tag: "悬念", type: "punchline" },
  ],
  fields: [
    { key: "label", label: "主题小标", default: TEXT.label, placeholder: TEXT.label },
    { key: "num", label: "核心数字", default: TEXT.num, placeholder: TEXT.num },
    { key: "question", label: "结尾设问", default: TEXT.question, placeholder: TEXT.question },
  ],
});
