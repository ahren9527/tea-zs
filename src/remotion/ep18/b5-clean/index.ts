import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp, duration } from "./Comp";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep18-b5",
  episode: 18,
  code: "B5",
  title: "净",
  note: "油烟 · 潮气 · 樟脑丸 · 10秒",
  exportName: "正上茶舍_18_B5_净.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: framesOf(0.3), timeSec: 0.3, label: "核心大字: 净", tag: "开门", type: "intro" },
    { frame: framesOf(2.6), timeSec: 2.6, label: "油烟入侵", tag: "污染", type: "action" },
    { frame: framesOf(4.2), timeSec: 4.2, label: "潮气吸附", tag: "污染", type: "action" },
    { frame: framesOf(5.8), timeSec: 5.8, label: "樟脑丸吸味", tag: "死敌", type: "punchline" },
  ],
  fields: [
    { key: "title", label: "主题字", default: "净", placeholder: "净" },
    { key: "bad1", label: "异味敌源1", default: "油烟", placeholder: "油烟" },
    { key: "bad2", label: "异味敌源2", default: "潮气", placeholder: "潮气" },
    { key: "bad3", label: "异味敌源3", default: "樟脑丸", placeholder: "樟脑丸" },
  ],
});
