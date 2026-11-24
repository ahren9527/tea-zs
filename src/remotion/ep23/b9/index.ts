import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import { BLOOM_AT, FILM_NOTE, L1_AT, L2_AT, LENGTH, SEAL_HIT, TEXT, VO, sfxHits } from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep23-b9",
  episode: 23,
  code: "B9",
  title: "金句",
  note: "金句 · " + FILM_NOTE,
  exportName: "正上茶舍_23_B9_金句.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep23.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    {
      frame: BLOOM_AT[0],
      timeSec: sec(BLOOM_AT[0]),
      label: "淡墨晕开",
      tag: "水墨",
      type: "intro",
    },
    { frame: L1_AT, timeSec: sec(L1_AT), label: TEXT.line1, tag: "上句", type: "punchline" },
    { frame: L2_AT, timeSec: sec(L2_AT), label: TEXT.line2, tag: "下句", type: "punchline" },
    { frame: SEAL_HIT, timeSec: sec(SEAL_HIT), label: TEXT.seal, tag: "落印", type: "stamp" },
  ],
  fields: [
    { key: "line1", label: "右列口诀", default: TEXT.line1, placeholder: TEXT.line1 },
    { key: "line2", label: "左列口诀", default: TEXT.line2, placeholder: TEXT.line2 },
    { key: "seal", label: "朱砂印章", default: TEXT.seal, placeholder: TEXT.seal },
  ],
});
