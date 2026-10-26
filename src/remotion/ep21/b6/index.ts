import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  FILM_NOTE,
  LENGTH,
  P1_AT,
  P2_AT,
  SEAL_HIT,
  SHEET_AT,
  TEXT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep21-b6",
  episode: 21,
  code: "B6",
  title: "口诀卡",
  note:
    "口诀卷轴 · 两列竖排「年份分开放 / 形态各归位」+ 朱砂印章「各归其位」（古筝+轻铃） · " +
    FILM_NOTE,
  exportName: "正上茶舍_21_B6_口诀卡.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: SHEET_AT, timeSec: sec(SHEET_AT), label: "宣纸条幅", tag: "条幅", type: "action" },
    {
      frame: P1_AT,
      timeSec: sec(P1_AT),
      label: "年份分开放",
      tag: "口诀一",
      type: "punchline",
    },
    {
      frame: P2_AT,
      timeSec: sec(P2_AT),
      label: "形态各归位",
      tag: "口诀二",
      type: "punchline",
    },
    {
      frame: SEAL_HIT,
      timeSec: sec(SEAL_HIT),
      label: "各归其位（落印）",
      tag: "朱印",
      type: "stamp",
    },
  ],
  fields: [
    { key: "p1", label: "口诀一（右列）", default: TEXT.p1, placeholder: TEXT.p1 },
    { key: "p2", label: "口诀二（中列）", default: TEXT.p2, placeholder: TEXT.p2 },
    { key: "seal", label: "朱印（四字）", default: TEXT.seal, placeholder: TEXT.seal },
  ],
});
