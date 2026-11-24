import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import {
  AMP_AT,
  FILM_NOTE,
  GREEN7_AT,
  LENGTH,
  MONTHS_AT,
  SUN_AT,
  TEXT,
  TIME_AT,
  VO,
  WHITE85_AT,
  YEARS_AT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep23-b3",
  episode: 23,
  code: "B3",
  title: "绿茶白茶对比",
  note: "绿茶白茶对比 · " + FILM_NOTE,
  exportName: "正上茶舍_23_B3_绿茶白茶对比.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep23.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: SUN_AT, timeSec: sec(SUN_AT), label: TEXT.sunNote, tag: "例外", type: "intro" },
    {
      frame: GREEN7_AT,
      timeSec: sec(GREEN7_AT),
      label: TEXT.greenLimit,
      tag: "绿茶",
      type: "action",
    },
    {
      frame: MONTHS_AT,
      timeSec: sec(MONTHS_AT),
      label: TEXT.greenTime,
      tag: "喝完",
      type: "action",
    },
    { frame: YEARS_AT, timeSec: sec(YEARS_AT), label: TEXT.whiteTime, tag: "白茶", type: "action" },
    {
      frame: WHITE85_AT,
      timeSec: sec(WHITE85_AT),
      label: TEXT.whiteLimit,
      tag: "上限",
      type: "punchline",
    },
    {
      frame: AMP_AT,
      timeSec: sec(AMP_AT),
      label: TEXT.amplify,
      tag: "时间放大",
      type: "punchline",
    },
    { frame: TIME_AT, timeSec: sec(TIME_AT), label: "时间轴", tag: "放大", type: "action" },
  ],
  fields: [
    { key: "greenTitle", label: "左标题", default: TEXT.greenTitle, placeholder: TEXT.greenTitle },
    {
      key: "greenLimit",
      label: "绿茶限值",
      default: TEXT.greenLimit,
      placeholder: TEXT.greenLimit,
    },
    { key: "sunNote", label: "晒青小标", default: TEXT.sunNote, placeholder: TEXT.sunNote },
    { key: "greenTime", label: "绿茶饮期", default: TEXT.greenTime, placeholder: TEXT.greenTime },
    { key: "whiteTitle", label: "右标题", default: TEXT.whiteTitle, placeholder: TEXT.whiteTitle },
    {
      key: "whiteLimit",
      label: "白茶上限",
      default: TEXT.whiteLimit,
      placeholder: TEXT.whiteLimit,
    },
    { key: "whiteTime", label: "白茶存期", default: TEXT.whiteTime, placeholder: TEXT.whiteTime },
    { key: "amplify", label: "结尾结论", default: TEXT.amplify, placeholder: TEXT.amplify },
  ],
});
