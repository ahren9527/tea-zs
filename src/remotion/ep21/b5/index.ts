import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  CAB_AT,
  DONE_AT,
  FILM_NOTE,
  LENGTH,
  TAG1_AT,
  TAG2_AT,
  TEXT,
  TIER_AT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep21-b5",
  episode: 21,
  code: "B5",
  title: "分区实操",
  note:
    "双层实木茶柜 · 上层散茶贴「2025·散茶」· 下层饼茶贴「2016·饼茶」（茶物向左回弹让位） · " +
    FILM_NOTE,
  exportName: "正上茶舍_21_B5_分区实操.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: CAB_AT, timeSec: sec(CAB_AT), label: "茶柜落定", tag: "茶柜", type: "action" },
    { frame: TIER_AT, timeSec: sec(TIER_AT), label: "分层入位", tag: "分层", type: "action" },
    {
      frame: TAG1_AT,
      timeSec: sec(TAG1_AT),
      label: "2025·散茶",
      tag: "贴签一",
      type: "punchline",
    },
    {
      frame: TAG2_AT,
      timeSec: sec(TAG2_AT),
      label: "2016·饼茶",
      tag: "贴签二",
      type: "stamp",
    },
    { frame: DONE_AT, timeSec: sec(DONE_AT), label: "年份和形态", tag: "完成", type: "action" },
  ],
  fields: [
    { key: "tag1", label: "上层大标签", default: TEXT.tag1, placeholder: TEXT.tag1 },
    { key: "tag2", label: "下层大标签", default: TEXT.tag2, placeholder: TEXT.tag2 },
  ],
});
