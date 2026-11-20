import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  BOX_AT,
  CAN_IN,
  CRUSH_AT,
  CUTAWAY_AT,
  FILM_NOTE,
  HTAPE_AT,
  LENGTH,
  NOT_WAKE_AT,
  STACK_IN,
  TEXT,
  VO,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep22-b6",
  episode: 22,
  code: "B6",
  title: "三层防压",
  note: "五层瓦楞箱平放素雪饼 → 逐箱摞高底箱压扁裂纹× → 工字封死 → 罐当外壳内套两层·存茶≠醒茶 · " + FILM_NOTE,
  exportName: "正上茶舍_22_B6_三层防压.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep22.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: BOX_AT, timeSec: sec(BOX_AT), label: "五层瓦楞箱", tag: "平放", type: "action" },
    { frame: STACK_IN, timeSec: sec(STACK_IN), label: "逐箱摞高", tag: "演示", type: "action" },
    { frame: CRUSH_AT, timeSec: sec(CRUSH_AT), label: "底箱压扁×", tag: "防压碎", type: "action" },
    { frame: HTAPE_AT, timeSec: sec(HTAPE_AT), label: "工字封死", tag: "胶带", type: "stamp" },
    { frame: CAN_IN, timeSec: sec(CAN_IN), label: "罐当外壳", tag: "铁/陶罐", type: "action" },
    { frame: CUTAWAY_AT, timeSec: sec(CUTAWAY_AT), label: "内套两层", tag: "剖视", type: "action" },
    { frame: NOT_WAKE_AT, timeSec: sec(NOT_WAKE_AT), label: "存茶≠醒茶", tag: "重点", type: "punchline" },
  ],
  fields: [
    { key: "head", label: "顶部主标", default: TEXT.head, placeholder: TEXT.head },
    { key: "boxSub", label: "纸箱规格", default: TEXT.boxSub, placeholder: TEXT.boxSub },
    { key: "noStack", label: "防压警示", default: TEXT.noStack, placeholder: TEXT.noStack },
    { key: "hSeal", label: "封箱提示", default: TEXT.hSeal, placeholder: TEXT.hSeal },
    { key: "shell", label: "茶罐定位", default: TEXT.shell, placeholder: TEXT.shell },
    { key: "notWake", label: "收尾强调", default: TEXT.notWake, placeholder: TEXT.notWake },
  ],
});
