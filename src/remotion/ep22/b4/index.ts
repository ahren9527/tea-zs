import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  COTTON_IN,
  CROSS_AT,
  FILM_NOTE,
  FOLD_AT,
  LENGTH,
  SQUEEZE_AT,
  TEXT,
  TIE1_AT,
  TWIST_AT,
  VO,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep22-b4",
  episode: 22,
  code: "B4",
  title: "鹅颈封口",
  note: "拉链慢漏气划掉 → 平口袋挤气/拧麻花/折鹅颈/扎带两道 → 素雪带棉纸直装 · " + FILM_NOTE,
  exportName: "正上茶舍_22_B4_鹅颈封口.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep22.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: CROSS_AT, timeSec: sec(CROSS_AT), label: "拉链漏气", tag: "避坑", type: "action" },
    { frame: SQUEEZE_AT, timeSec: sec(SQUEEZE_AT), label: "挤气", tag: "步一", type: "action" },
    { frame: TWIST_AT, timeSec: sec(TWIST_AT), label: "拧麻花", tag: "步二", type: "action" },
    { frame: FOLD_AT, timeSec: sec(FOLD_AT), label: "折鹅颈", tag: "步三", type: "action" },
    { frame: TIE1_AT, timeSec: sec(TIE1_AT), label: "两道扎带", tag: "步四", type: "stamp" },
    { frame: COTTON_IN, timeSec: sec(COTTON_IN), label: "留棉纸", tag: "素雪", type: "punchline" },
  ],
  fields: [
    { key: "zipBad", label: "拉链避坑字", default: TEXT.zipBad, placeholder: TEXT.zipBad },
    { key: "flatTag", label: "平口袋标题", default: TEXT.flatTag, placeholder: TEXT.flatTag },
    { key: "step1", label: "步骤一", default: TEXT.step1, placeholder: TEXT.step1 },
    { key: "step2", label: "步骤二", default: TEXT.step2, placeholder: TEXT.step2 },
    { key: "step3", label: "步骤三", default: TEXT.step3, placeholder: TEXT.step3 },
    { key: "step4", label: "步骤四", default: TEXT.step4, placeholder: TEXT.step4 },
    { key: "cotton", label: "棉纸提示", default: TEXT.cotton, placeholder: TEXT.cotton },
  ],
});
