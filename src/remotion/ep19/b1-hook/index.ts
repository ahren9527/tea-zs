import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp, duration } from "./Comp";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep19-b1",
  episode: 19,
  code: "B1",
  title: "频繁开大袋",
  note: "频繁开大袋 ≠ 正常取茶 · 散茶头香散失 70% · 6.8秒",
  exportName: "正上茶舍_19_B1_频繁开大袋.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: 0, timeSec: 0, label: "定性入场", tag: "入场", type: "intro" },
    { frame: framesOf(1.0), timeSec: 1.0, label: "✖印撞击", tag: "盖印", type: "stamp" },
    { frame: framesOf(1.8), timeSec: 1.8, label: "大袋拉开", tag: "开袋", type: "action" },
    { frame: framesOf(2.2), timeSec: 2.2, label: "香气流失", tag: "🍃升腾", type: "action" },
    { frame: framesOf(2.9), timeSec: 2.9, label: "潮气钻入", tag: "💧入侵", type: "action" },
    { frame: framesOf(3.2), timeSec: 3.2, label: "数据骤降", tag: "跌落", type: "action" },
    { frame: framesOf(5.2), timeSec: 5.2, label: "锁死23%", tag: "警示", type: "punchline" },
    { frame: framesOf(6.8), timeSec: 6.8, label: "留白呼吸", tag: "定格", type: "intro" },
  ],
  fields: [
    { key: "title", label: "定性主词", default: "频繁开大袋", placeholder: "频繁开大袋" },
    { key: "crossMark", label: "警示印章", default: "✖", placeholder: "✖", type: "stamp" },
  ],
});
