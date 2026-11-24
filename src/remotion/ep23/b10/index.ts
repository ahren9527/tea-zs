import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import { FILM_NOTE, LENGTH, LINE_AT, TEXT, VO, sfxHits } from "./data";
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
  // 时间轴上的关键帧标记
  markers: [{ frame: LINE_AT, timeSec: sec(LINE_AT), label: TEXT.line, tag: "大字", type: "punchline" }],
  // 面板右侧可改的文案：key 与 TEXT 一一对应
  fields: [{ key: "line", label: "大字", default: TEXT.line, placeholder: TEXT.line }],
});
