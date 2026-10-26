import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  BYE_HIT,
  FILM_NOTE,
  GOLD1_AT,
  GOLD2_AT,
  LENGTH,
  MISS_AT,
  OPT1_AT,
  OPT2_AT,
  TEASER_AT,
  TEXT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep21-b7",
  episode: 21,
  code: "B7",
  title: "收尾",
  note:
    "金句「年份分开放，香气不打架」（古筝+轻铃）→ 投票「混放派 / 分区派」→ 下期预告「三层包装法」+ 印「下期见」 · " +
    FILM_NOTE,
  exportName: "正上茶舍_21_B7_收尾.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    {
      frame: GOLD1_AT,
      timeSec: sec(GOLD1_AT),
      label: "年份分开放",
      tag: "金句上",
      type: "punchline",
    },
    {
      frame: GOLD2_AT,
      timeSec: sec(GOLD2_AT),
      label: "香气不打架",
      tag: "金句下",
      type: "punchline",
    },
    { frame: OPT1_AT, timeSec: sec(OPT1_AT), label: "混放派", tag: "投票一", type: "action" },
    { frame: OPT2_AT, timeSec: sec(OPT2_AT), label: "分区派", tag: "投票二", type: "action" },
    {
      frame: TEASER_AT,
      timeSec: sec(TEASER_AT),
      label: "三层包装法",
      tag: "下期预告",
      type: "punchline",
    },
    { frame: MISS_AT, timeSec: sec(MISS_AT), label: "少一层会如何", tag: "悬念", type: "action" },
    { frame: BYE_HIT, timeSec: sec(BYE_HIT), label: "下期见", tag: "落印", type: "stamp" },
  ],
  fields: [
    { key: "gold1", label: "金句（右联）", default: TEXT.gold1, placeholder: TEXT.gold1 },
    { key: "gold2", label: "金句（左联）", default: TEXT.gold2, placeholder: TEXT.gold2 },
    { key: "opt1", label: "投票选项一", default: TEXT.opt1, placeholder: TEXT.opt1 },
    { key: "opt2", label: "投票选项二", default: TEXT.opt2, placeholder: TEXT.opt2 },
    { key: "teaser", label: "下期预告大字", default: TEXT.teaser, placeholder: TEXT.teaser },
    { key: "bye", label: "结尾印章", default: TEXT.bye, placeholder: TEXT.bye },
  ],
});
