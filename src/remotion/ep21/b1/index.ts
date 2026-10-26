import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  ASK_AT,
  FILM_NOTE,
  LENGTH,
  LINE_AT,
  NEW_CHAR_AT,
  OLD_CHAR_AT,
  TEXT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep21-b1",
  episode: 21,
  code: "B1",
  title: "新老",
  note: "「新」「老」配蜜韵茶饼（字左物右让位）· 竹青分隔线生长 · 落「分？」 · " + FILM_NOTE,
  exportName: "正上茶舍_21_B1_新老.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: NEW_CHAR_AT, timeSec: sec(NEW_CHAR_AT), label: "新", tag: "新茶", type: "stamp" },
    { frame: OLD_CHAR_AT, timeSec: sec(OLD_CHAR_AT), label: "老", tag: "老茶", type: "stamp" },
    { frame: LINE_AT, timeSec: sec(LINE_AT), label: "分隔线", tag: "隔开", type: "action" },
    { frame: ASK_AT, timeSec: sec(ASK_AT), label: "分？", tag: "提问", type: "punchline" },
  ],
  fields: [
    { key: "cNew", label: "大字一（新）", default: TEXT.cNew, placeholder: TEXT.cNew },
    { key: "cOld", label: "大字二（老）", default: TEXT.cOld, placeholder: TEXT.cOld },
    { key: "ask", label: "结尾提问大字", default: TEXT.ask, placeholder: TEXT.ask },
  ],
});
