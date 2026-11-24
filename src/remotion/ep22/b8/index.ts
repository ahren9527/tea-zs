import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import {
  BYE_HIT,
  FILM_NOTE,
  HEAD_AT,
  IN_MOIST_AT,
  LENGTH,
  OPT1_AT,
  OPT2_AT,
  TEXT,
  VO,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep22-b8",
  episode: 22,
  code: "B8",
  title: "投票预告",
  note: "二选一投票「拉链口 / 扎带勒口」→ 下期预告「含水量多少？」内水升腾 + 落印「下期见」· " + FILM_NOTE,
  exportName: "正上茶舍_22_B8_投票预告.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep22.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: OPT1_AT, timeSec: sec(OPT1_AT), label: "拉链口", tag: "投票一", type: "stamp" },
    { frame: OPT2_AT, timeSec: sec(OPT2_AT), label: "扎带勒口", tag: "投票二", type: "stamp" },
    { frame: IN_MOIST_AT, timeSec: sec(IN_MOIST_AT), label: "茶内水分", tag: "反转", type: "action" },
    { frame: HEAD_AT, timeSec: sec(HEAD_AT), label: "含水量多少？", tag: "下期", type: "stamp" },
    { frame: BYE_HIT, timeSec: sec(BYE_HIT), label: "下期见", tag: "落印", type: "punchline" },
  ],
  fields: [
    { key: "opt1", label: "投票选项一", default: TEXT.opt1, placeholder: TEXT.opt1 },
    { key: "opt2", label: "投票选项二", default: TEXT.opt2, placeholder: TEXT.opt2 },
    { key: "teaser", label: "下期预告大字", default: TEXT.teaser, placeholder: TEXT.teaser },
    { key: "bye", label: "收尾朱印", default: TEXT.bye, placeholder: TEXT.bye, type: "stamp" },
  ],
});
