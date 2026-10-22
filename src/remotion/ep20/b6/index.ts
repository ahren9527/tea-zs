import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  AROMA_AT,
  DARK_AT,
  DAYS_AT,
  DROP_AT,
  JAR_AT,
  KEY_AT,
  FILM_NOTE,
  VO,
  LENGTH,
  LID_CLOSE_AT,
  TEXT,
  WAIT_AT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep20-b6",
  episode: 20,
  code: "B6",
  title: "醒",
  note:
    "一周量茶块 · 先别急喝 · 落进紫砂罐盖好 · 避光 · 一天一划 3–7 天 · 香气升起 · 干醒 · " +
    FILM_NOTE,
  exportName: "正上茶舍_20_B6_醒.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep20.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: WAIT_AT, timeSec: sec(WAIT_AT), label: "先别急", tag: "拦", type: "punchline" },
    { frame: JAR_AT, timeSec: sec(JAR_AT), label: "罐子落下", tag: "罐", type: "intro" },
    { frame: DROP_AT, timeSec: sec(DROP_AT), label: "放进罐里", tag: "放", type: "action" },
    { frame: LID_CLOSE_AT, timeSec: sec(LID_CLOSE_AT), label: "合盖", tag: "盖", type: "stamp" },
    { frame: DARK_AT, timeSec: sec(DARK_AT), label: "避光", tag: "避光", type: "action" },
    { frame: DAYS_AT, timeSec: sec(DAYS_AT), label: "三到七天", tag: "天数", type: "action" },
    { frame: AROMA_AT, timeSec: sec(AROMA_AT), label: "香气透出", tag: "香", type: "action" },
    { frame: KEY_AT, timeSec: sec(KEY_AT), label: "干醒", tag: "干醒", type: "punchline" },
  ],
  fields: [
    { key: "portion", label: "分量（顶部大字）", default: TEXT.portion, placeholder: TEXT.portion },
    { key: "wait", label: "拦一句", default: TEXT.wait, placeholder: TEXT.wait },
    { key: "dark", label: "避光", default: TEXT.dark, placeholder: TEXT.dark },
    { key: "daysNum", label: "天数（数字）", default: TEXT.daysNum, placeholder: TEXT.daysNum },
    { key: "daysUnit", label: "天数单位", default: TEXT.daysUnit, placeholder: TEXT.daysUnit },
    { key: "key", label: "关键词（竖排大字）", default: TEXT.key, placeholder: TEXT.key },
  ],
});
