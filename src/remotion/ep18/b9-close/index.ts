import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp, duration } from "./Comp";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep18-b9",
  episode: 18,
  code: "B9",
  title: "先存对",
  note: "先存对，再谈老 · 飞入后放大 · 8秒",
  exportName: "正上茶舍_18_B9_先存对再谈老.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: framesOf(0.25), timeSec: 0.25, label: "飞入动作", tag: "飞入", type: "intro" },
    { frame: framesOf(2.0), timeSec: 2.0, label: "收尾大金句", tag: "定格", type: "punchline" },
  ],
  fields: [
    { key: "line", label: "收尾金句全文", default: "先存对，再谈老", placeholder: "先存对，再谈老" },
  ],
});
