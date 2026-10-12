import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp, duration } from "./Comp";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep18-b1",
  episode: 18,
  code: "B1",
  title: "破题",
  note: "越放越香 → 毁茶 → 你以为在陈化 · 10秒",
  exportName: "正上茶舍_18_B1_破题.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: framesOf(2.0), timeSec: 2.0, label: "破题反差", tag: "引言", type: "intro" },
    { frame: framesOf(5.2), timeSec: 5.2, label: "毁茶印章", tag: "盖印", type: "stamp" },
    { frame: framesOf(7.6), timeSec: 7.6, label: "陈化扎心", tag: "金句", type: "punchline" },
  ],
  fields: [
    { key: "myth", label: "认知误区 (大字)", default: "越放越香", placeholder: "例如: 越放越香" },
    { key: "stamp", label: "警示印章 (2-4字)", default: "毁茶", placeholder: "例如: 毁茶 / 变味", type: "stamp" },
    { key: "line", label: "扎心反问 (后段)", default: "你以为在陈化", placeholder: "例如: 你以为在陈化" },
  ],
});
