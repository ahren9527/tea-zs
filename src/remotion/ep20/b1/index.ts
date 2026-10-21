import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import { HITS, LEAD_AT, LENGTH, TEXT, sfxHits } from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep20-b1",
  episode: 20,
  code: "B1",
  title: "存·撬·醒",
  note: "开场尾句：棉纸饼 / 茶针 / 紫砂罐先落位，「存 撬 醒」随口播砸下竖排一列 · 4.8秒（成片约 6–10s）",
  exportName: "正上茶舍_20_B1_存撬醒.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: LEAD_AT, timeSec: sec(LEAD_AT), label: "一口气讲完", tag: "引子", type: "intro" },
    { frame: HITS[0], timeSec: sec(HITS[0]), label: "存", tag: "存", type: "stamp" },
    { frame: HITS[1], timeSec: sec(HITS[1]), label: "撬", tag: "撬", type: "stamp" },
    { frame: HITS[2], timeSec: sec(HITS[2]), label: "醒", tag: "醒", type: "stamp" },
  ],
  fields: [
    { key: "lead", label: "竖排小字", default: TEXT.lead, placeholder: TEXT.lead },
    { key: "c1", label: "大字一（存）", default: TEXT.c1, placeholder: TEXT.c1 },
    { key: "c2", label: "大字二（撬）", default: TEXT.c2, placeholder: TEXT.c2 },
    { key: "c3", label: "大字三（醒）", default: TEXT.c3, placeholder: TEXT.c3 },
  ],
});
