import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  CONVERGE_AT,
  CORE_AT,
  FILM_NOTE,
  LENGTH,
  TAG3_AT,
  TAG5_SHOW_AT,
  TEXT,
  Y3_AT,
  Y5_AT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep21-b2",
  episode: 21,
  code: "B2",
  title: "按年份",
  note:
    "横向时间轴 · 三年（福建地标）→ 五年（海交会团标）→ 收拢为「新老分开放」 · " + FILM_NOTE,
  exportName: "正上茶舍_21_B2_按年份.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: Y3_AT, timeSec: sec(Y3_AT), label: "三年", tag: "三年", type: "punchline" },
    { frame: TAG3_AT, timeSec: sec(TAG3_AT), label: "福建地标", tag: "地标", type: "action" },
    { frame: Y5_AT, timeSec: sec(Y5_AT), label: "五年", tag: "五年", type: "punchline" },
    {
      frame: TAG5_SHOW_AT,
      timeSec: sec(TAG5_SHOW_AT),
      label: "海交会团标",
      tag: "团标",
      type: "action",
    },
    { frame: CONVERGE_AT, timeSec: sec(CONVERGE_AT), label: "不管三年五年", tag: "并列", type: "action" },
    {
      frame: CORE_AT,
      timeSec: sec(CORE_AT),
      label: "新老分开放",
      tag: "结论",
      type: "stamp",
    },
  ],
  fields: [
    { key: "y3", label: "年份一（大字）", default: TEXT.y3, placeholder: TEXT.y3 },
    { key: "tag3", label: "年份一标注", default: TEXT.tag3, placeholder: TEXT.tag3 },
    { key: "y5", label: "年份二（大字）", default: TEXT.y5, placeholder: TEXT.y5 },
    { key: "tag5", label: "年份二标注", default: TEXT.tag5, placeholder: TEXT.tag5 },
    { key: "core", label: "收拢结论大字", default: TEXT.core, placeholder: TEXT.core },
  ],
});
