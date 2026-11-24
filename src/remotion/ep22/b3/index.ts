import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import { FILM_NOTE, K1_AT, K2_AT, LENGTH, MAT_AT, TEXT, THICK_AT, VO, sfxHits } from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep22-b3",
  episode: 22,
  code: "B3",
  title: "一层密封",
  note: "「一层 · 封住气」食品级加厚 PE 平口袋（字左物右让位）· 厚度 ≥ 12丝 · " + FILM_NOTE,
  exportName: "正上茶舍_22_B3_一层密封.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep22.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: K1_AT, timeSec: sec(K1_AT), label: "够厚", tag: "要点一", type: "stamp" },
    { frame: K2_AT, timeSec: sec(K2_AT), label: "勒死", tag: "要点二", type: "stamp" },
    { frame: MAT_AT, timeSec: sec(MAT_AT), label: "食品级PE", tag: "材质", type: "action" },
    { frame: THICK_AT, timeSec: sec(THICK_AT), label: "≥ 12丝", tag: "厚度", type: "punchline" },
  ],
  fields: [
    { key: "head", label: "顶部主标", default: TEXT.head, placeholder: TEXT.head },
    { key: "k1", label: "要点一", default: TEXT.k1, placeholder: TEXT.k1 },
    { key: "k2", label: "要点二", default: TEXT.k2, placeholder: TEXT.k2 },
    { key: "mat", label: "材质标准", default: TEXT.mat, placeholder: TEXT.mat },
    { key: "thick", label: "厚度标准", default: TEXT.thick, placeholder: TEXT.thick },
  ],
});
