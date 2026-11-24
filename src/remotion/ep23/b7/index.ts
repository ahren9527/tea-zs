import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import {
  DAMP_AT,
  DB_CODE_AT,
  FILM_NOTE,
  HIGH_AT,
  LENGTH,
  MARGIN_AT,
  SEVEN_AT,
  TEXT,
  VO,
  WATER_AT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep23-b7",
  episode: 23,
  code: "B7",
  title: "检测报告怎么看",
  note: "检测报告怎么看 · " + FILM_NOTE,
  exportName: "正上茶舍_23_B7_检测报告怎么看.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep23.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    {
      frame: WATER_AT,
      timeSec: sec(WATER_AT),
      label: TEXT.itemWater,
      tag: "查报告",
      type: "intro",
    },
    { frame: SEVEN_AT, timeSec: sec(SEVEN_AT), label: TEXT.lowVal, tag: "≤7%", type: "punchline" },
    {
      frame: MARGIN_AT,
      timeSec: sec(MARGIN_AT),
      label: TEXT.marginOk,
      tag: "余量",
      type: "action",
    },
    { frame: DB_CODE_AT, timeSec: sec(DB_CODE_AT), label: "地方标准", tag: "说明", type: "action" },
    { frame: HIGH_AT, timeSec: sec(HIGH_AT), label: TEXT.highVal, tag: "贴线", type: "action" },
    { frame: DAMP_AT, timeSec: sec(DAMP_AT), label: TEXT.dampRisk, tag: "风险", type: "punchline" },
  ],
  fields: [
    {
      key: "reportTitle",
      label: "报告标题",
      default: TEXT.reportTitle,
      placeholder: TEXT.reportTitle,
    },
    { key: "itemWater", label: "检测项名", default: TEXT.itemWater, placeholder: TEXT.itemWater },
    { key: "lowVal", label: "低水区间", default: TEXT.lowVal, placeholder: TEXT.lowVal },
    { key: "marginOk", label: "安全结论", default: TEXT.marginOk, placeholder: TEXT.marginOk },
    { key: "dbCode", label: "地标编号", default: TEXT.dbCode, placeholder: TEXT.dbCode },
    { key: "dbDesc", label: "地标说明", default: TEXT.dbDesc, placeholder: TEXT.dbDesc },
    { key: "highVal", label: "高水区间", default: TEXT.highVal, placeholder: TEXT.highVal },
    { key: "dampRisk", label: "风险结论", default: TEXT.dampRisk, placeholder: TEXT.dampRisk },
  ],
});
