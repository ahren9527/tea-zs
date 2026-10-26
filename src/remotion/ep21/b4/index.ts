import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  ABSORB_AT,
  CHONG_AT,
  COVER_AT,
  FILM_NOTE,
  JING_AT,
  LENGTH,
  RHYTHM_AT,
  SAFE_AT,
  TEXT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep21-b4",
  episode: 21,
  code: "B4",
  title: "为什么分",
  note:
    "原因① 新老节奏不同 · 原因② 「冲」对「静」青绿香盖过琥珀香、散茶吸味 · 「分开更稳妥」 · " +
    FILM_NOTE,
  exportName: "正上茶舍_21_B4_为什么分.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: RHYTHM_AT, timeSec: sec(RHYTHM_AT), label: "节奏不同", tag: "原因一", type: "punchline" },
    { frame: CHONG_AT, timeSec: sec(CHONG_AT), label: "新茶香冲", tag: "冲", type: "stamp" },
    { frame: JING_AT, timeSec: sec(JING_AT), label: "老茶香静", tag: "静", type: "action" },
    { frame: ABSORB_AT, timeSec: sec(ABSORB_AT), label: "散茶吸味", tag: "吸味", type: "action" },
    { frame: COVER_AT, timeSec: sec(COVER_AT), label: "香气盖过", tag: "窜味", type: "action" },
    { frame: SAFE_AT, timeSec: sec(SAFE_AT), label: "分开更稳妥", tag: "结论", type: "punchline" },
  ],
  fields: [
    { key: "why", label: "开场提问大字", default: TEXT.why, placeholder: TEXT.why },
    { key: "rhythm", label: "原因一大字", default: TEXT.rhythm, placeholder: TEXT.rhythm },
    { key: "chong", label: "新茶特征字（冲）", default: TEXT.chong, placeholder: TEXT.chong },
    { key: "jing", label: "老茶特征字（静）", default: TEXT.jing, placeholder: TEXT.jing },
    { key: "safe", label: "收尾结论大字", default: TEXT.safe, placeholder: TEXT.safe },
  ],
});
