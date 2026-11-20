import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import { CROSS_AT, FILM_NOTE, G1_AT, G2_AT, G3_AT, LENGTH, SUM_AT, TEXT, VO, sfxHits } from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep22-b1",
  episode: 22,
  code: "B1",
  title: "三道关",
  note: "杂袋划掉 → 素雪白茶饼逐层包覆三道防护（字左物右让位）· " + FILM_NOTE,
  exportName: "正上茶舍_22_B1_三道关.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep22.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: CROSS_AT, timeSec: sec(CROSS_AT), label: "划掉杂袋", tag: "破误区", type: "action" },
    { frame: G1_AT, timeSec: sec(G1_AT), label: "封气", tag: "一关", type: "stamp" },
    { frame: G2_AT, timeSec: sec(G2_AT), label: "阻隔", tag: "二关", type: "stamp" },
    { frame: G3_AT, timeSec: sec(G3_AT), label: "防压", tag: "三关", type: "stamp" },
    { frame: SUM_AT, timeSec: sec(SUM_AT), label: "三道关", tag: "收束", type: "punchline" },
  ],
  fields: [
    { key: "wrong", label: "开场误区字", default: TEXT.wrong, placeholder: TEXT.wrong },
    { key: "g1", label: "第一关", default: TEXT.g1, placeholder: TEXT.g1 },
    { key: "g2", label: "第二关", default: TEXT.g2, placeholder: TEXT.g2 },
    { key: "g3", label: "第三关", default: TEXT.g3, placeholder: TEXT.g3 },
    { key: "sum", label: "总结大字", default: TEXT.sum, placeholder: TEXT.sum },
  ],
});
