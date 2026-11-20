import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  BLOCK1_AT,
  CREASE_AT,
  FAKE_CROSS,
  FAKE_IN,
  FILM_NOTE,
  LENGTH,
  REAL_IN,
  REAL_TAG,
  TEXT,
  VO,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep22-b5",
  episode: 22,
  code: "B5",
  title: "二层纯铝",
  note: "「二层 · 挡住光」隔光水箱味 → 强光辨假镀铝透光× → 真纯铝不透光+折痕不回弹 · " + FILM_NOTE,
  exportName: "正上茶舍_22_B5_二层纯铝.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep22.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: BLOCK1_AT, timeSec: sec(BLOCK1_AT), label: "挡光水味", tag: "阻隔", type: "stamp" },
    { frame: FAKE_IN, timeSec: sec(FAKE_IN), label: "强光照", tag: "鉴真假", type: "action" },
    { frame: FAKE_CROSS, timeSec: sec(FAKE_CROSS), label: "镀铝透光×", tag: "避坑", type: "action" },
    { frame: REAL_IN, timeSec: sec(REAL_IN), label: "真纯铝", tag: "不透光", type: "stamp" },
    { frame: CREASE_AT, timeSec: sec(CREASE_AT), label: "折痕定形", tag: "不回弹", type: "action" },
    { frame: REAL_TAG, timeSec: sec(REAL_TAG), label: "真纯铝", tag: "定论", type: "punchline" },
  ],
  fields: [
    { key: "head", label: "顶部主标", default: TEXT.head, placeholder: TEXT.head },
    { key: "b1", label: "阻隔一", default: TEXT.b1, placeholder: TEXT.b1 },
    { key: "b2", label: "阻隔二", default: TEXT.b2, placeholder: TEXT.b2 },
    { key: "b3", label: "阻隔三", default: TEXT.b3, placeholder: TEXT.b3 },
    { key: "fake", label: "镀铝结论", default: TEXT.fake, placeholder: TEXT.fake },
    { key: "real", label: "纯铝结论", default: TEXT.real, placeholder: TEXT.real },
  ],
});
