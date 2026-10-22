import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import { FILM_NOTE, LENGTH, VO, P1_AT, P2_AT, SEAL_HIT, SHEET_AT, TEXT, sfxHits } from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep20-b5",
  episode: 20,
  code: "B5",
  title: "口诀",
  note: "宣纸条幅 · 顺纹借力 / 够喝一周 逐字晕开 · 朱印「快取快封」砸下 · " + FILM_NOTE,
  exportName: "正上茶舍_20_B5_口诀.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  ambience: true, // 整拍极低的茶室底噪（-40 LUFS），sfxHits 里不再写 roomBed()
  refVo: { src: "tea/vo/ep20.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: SHEET_AT, timeSec: sec(SHEET_AT), label: "条幅落定", tag: "入场", type: "intro" },
    { frame: P1_AT, timeSec: sec(P1_AT), label: "顺纹借力", tag: "一", type: "punchline" },
    { frame: P2_AT, timeSec: sec(P2_AT), label: "够喝一周", tag: "二", type: "punchline" },
    { frame: SEAL_HIT, timeSec: sec(SEAL_HIT), label: "快取快封", tag: "盖章", type: "stamp" },
  ],
  fields: [
    { key: "p1", label: "口诀一（竖排）", default: TEXT.p1, placeholder: TEXT.p1 },
    { key: "p2", label: "口诀二（竖排）", default: TEXT.p2, placeholder: TEXT.p2 },
    {
      key: "seal",
      label: "口诀三 · 印章（最多 4 字）",
      default: TEXT.seal,
      placeholder: TEXT.seal,
      type: "stamp",
    },
  ],
});
