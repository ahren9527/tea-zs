import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import {
  DRINK_AT,
  DRINK_POUR_AT,
  FILM_NOTE,
  LENGTH,
  STORE_AT,
  STORE_CLOSE_AT,
  TEXT,
  VO,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep23-b8",
  episode: 23,
  code: "B8",
  title: "存还是喝",
  note: "存还是喝 · " + FILM_NOTE,
  exportName: "正上茶舍_23_B8_存还是喝.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep23.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    {
      frame: STORE_AT,
      timeSec: sec(STORE_AT),
      label: `${TEXT.leftVal} ${TEXT.leftAct}`,
      tag: "长期存",
      type: "punchline",
    },
    {
      frame: STORE_CLOSE_AT,
      timeSec: sec(STORE_CLOSE_AT),
      label: "封箱入存",
      tag: "封箱",
      type: "action",
    },
    {
      frame: DRINK_AT,
      timeSec: sec(DRINK_AT),
      label: `${TEXT.rightVal} ${TEXT.rightAct}`,
      tag: "趁早喝",
      type: "punchline",
    },
    {
      frame: DRINK_POUR_AT,
      timeSec: sec(DRINK_POUR_AT),
      label: TEXT.rightSub,
      tag: "泡喝",
      type: "action",
    },
  ],
  fields: [
    { key: "head", label: "顶部标题", default: TEXT.head, placeholder: TEXT.head },
    { key: "leftVal", label: "左水分值", default: TEXT.leftVal, placeholder: TEXT.leftVal },
    { key: "leftAct", label: "左大字", default: TEXT.leftAct, placeholder: TEXT.leftAct },
    { key: "leftSub", label: "左小标", default: TEXT.leftSub, placeholder: TEXT.leftSub },
    { key: "rightVal", label: "右水分值", default: TEXT.rightVal, placeholder: TEXT.rightVal },
    { key: "rightAct", label: "右大字", default: TEXT.rightAct, placeholder: TEXT.rightAct },
    { key: "rightSub", label: "右小标", default: TEXT.rightSub, placeholder: TEXT.rightSub },
  ],
});
