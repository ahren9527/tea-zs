import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import {
  DAMP_AT,
  FILM_NOTE,
  LENGTH,
  NEQ_AT,
  PASS_AT,
  SAFE_AT,
  STD_AT,
  TEXT,
  VO,
  YEAR_AT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep23-b4",
  episode: 23,
  code: "B4",
  title: "及格不等于安全",
  note: "及格不等于安全 · " + FILM_NOTE,
  exportName: "正上茶舍_23_B4_及格不等于安全.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep23.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: YEAR_AT, timeSec: sec(YEAR_AT), label: TEXT.years, tag: "存期", type: "intro" },
    { frame: DAMP_AT, timeSec: sec(DAMP_AT), label: "水汽变化", tag: "环境", type: "action" },
    { frame: STD_AT, timeSec: sec(STD_AT), label: TEXT.stdOut, tag: "脱离", type: "action" },
    { frame: PASS_AT, timeSec: sec(PASS_AT), label: TEXT.passLine, tag: "结论", type: "punchline" },
    { frame: NEQ_AT, timeSec: sec(NEQ_AT), label: "≠", tag: "对比", type: "punchline" },
    { frame: SAFE_AT, timeSec: sec(SAFE_AT), label: TEXT.safeLine, tag: "收尾", type: "punchline" },
  ],
  fields: [
    { key: "years", label: "存期标题", default: TEXT.years, placeholder: TEXT.years },
    { key: "stdOut", label: "过渡提示", default: TEXT.stdOut, placeholder: TEXT.stdOut },
    { key: "passLine", label: "对比上行", default: TEXT.passLine, placeholder: TEXT.passLine },
    { key: "safeLine", label: "对比下行", default: TEXT.safeLine, placeholder: TEXT.safeLine },
  ],
});
