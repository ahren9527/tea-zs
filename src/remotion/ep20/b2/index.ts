import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  BAG_AT,
  CALM_AT,
  CROSS_AT,
  DARK_AT,
  FLOOR_AT,
  KEEP_AT,
  LENGTH,
  SEAL_AT,
  TEXT,
  TILT_AT,
  WALL_AT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep20-b2",
  episode: 20,
  code: "B2",
  title: "存",
  note: "棉纸别撕 · 铝箔袋套上封口 · 屋角侧视：避光 / 离地 / 离墙 · 转化稳 · 13.4秒（成片 10–23s）",
  exportName: "正上茶舍_20_B2_存.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: CROSS_AT, timeSec: sec(CROSS_AT), label: "别撕", tag: "棉纸", type: "punchline" },
    { frame: KEEP_AT, timeSec: sec(KEEP_AT), label: "留着", tag: "抚平", type: "action" },
    { frame: BAG_AT, timeSec: sec(BAG_AT), label: "套袋", tag: "铝箔袋", type: "action" },
    { frame: SEAL_AT, timeSec: sec(SEAL_AT), label: "封口", tag: "封口", type: "stamp" },
    { frame: TILT_AT, timeSec: sec(TILT_AT), label: "放哪", tag: "转场", type: "intro" },
    { frame: DARK_AT, timeSec: sec(DARK_AT), label: "避光", tag: "避光", type: "action" },
    { frame: FLOOR_AT, timeSec: sec(FLOOR_AT), label: "离地", tag: "离地", type: "action" },
    { frame: WALL_AT, timeSec: sec(WALL_AT), label: "离墙", tag: "离墙", type: "action" },
    { frame: CALM_AT, timeSec: sec(CALM_AT), label: "转化稳", tag: "收", type: "punchline" },
  ],
  fields: [
    { key: "paper", label: "标注：棉纸", default: TEXT.paper, placeholder: TEXT.paper },
    { key: "noTear", label: "大字：别撕", default: TEXT.noTear, placeholder: TEXT.noTear },
    { key: "keep", label: "小字：留着", default: TEXT.keep, placeholder: TEXT.keep },
    { key: "bag", label: "标注：袋子", default: TEXT.bag, placeholder: TEXT.bag },
    { key: "dark", label: "六字一", default: TEXT.dark, placeholder: TEXT.dark },
    { key: "floor", label: "六字二", default: TEXT.floor, placeholder: TEXT.floor },
    { key: "wall", label: "六字三（竖排）", default: TEXT.wall, placeholder: TEXT.wall },
    { key: "cond", label: "条件小字", default: TEXT.cond, placeholder: TEXT.cond },
    { key: "calm", label: "收尾大字", default: TEXT.calm, placeholder: TEXT.calm },
    { key: "calmSub", label: "收尾小字", default: TEXT.calmSub, placeholder: TEXT.calmSub },
  ],
});
