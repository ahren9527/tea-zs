import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  BREAK_AT,
  CLEAVER_X_AT,
  HAND_X_AT,
  FILM_NOTE,
  VO,
  LENGTH,
  NO_AT,
  TEXT,
  TOOL_AT,
  WASTE_AT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep20-b3",
  episode: 20,
  code: "B3",
  title: "工具",
  note:
    "茶巾正中一次一件：茶针找缝 / 茶刀顺纹 / 茶锥压紧 · 别用：菜刀、徒手依次挨朱砂叉 · 饼碎叶散「碎」 · " +
    FILM_NOTE,
  exportName: "正上茶舍_20_B3_工具.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep20.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: TOOL_AT[0], timeSec: sec(TOOL_AT[0]), label: "茶针", tag: "茶针", type: "action" },
    { frame: TOOL_AT[1], timeSec: sec(TOOL_AT[1]), label: "茶刀", tag: "茶刀", type: "action" },
    { frame: TOOL_AT[2], timeSec: sec(TOOL_AT[2]), label: "茶锥", tag: "茶锥", type: "action" },
    { frame: NO_AT, timeSec: sec(NO_AT), label: "别用", tag: "转折", type: "punchline" },
    {
      frame: CLEAVER_X_AT,
      timeSec: sec(CLEAVER_X_AT),
      label: "菜刀叉",
      tag: "菜刀",
      type: "stamp",
    },
    { frame: HAND_X_AT, timeSec: sec(HAND_X_AT), label: "徒手叉", tag: "徒手", type: "stamp" },
    { frame: BREAK_AT, timeSec: sec(BREAK_AT), label: "叶片一碎", tag: "碎", type: "action" },
    { frame: WASTE_AT, timeSec: sec(WASTE_AT), label: "白压了", tag: "收", type: "action" },
  ],
  fields: [
    { key: "u1", label: "茶针 · 大字", default: TEXT.u1, placeholder: TEXT.u1 },
    { key: "u2", label: "茶刀 · 大字", default: TEXT.u2, placeholder: TEXT.u2 },
    { key: "u3", label: "茶锥 · 大字", default: TEXT.u3, placeholder: TEXT.u3 },
    { key: "no", label: "禁止大字", default: TEXT.no, placeholder: TEXT.no },
    { key: "broke", label: "碎（单字）", default: TEXT.broke, placeholder: TEXT.broke },
  ],
});
