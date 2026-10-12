import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp, duration } from "./Comp";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep18-b4",
  episode: 18,
  code: "B4",
  title: "封",
  note: "紫砂不能用 → 三层法叠上 → 挡潮避光 · 18秒",
  exportName: "正上茶舍_18_B4_封.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: framesOf(0.3), timeSec: 0.3, label: "核心大字: 封", tag: "开门", type: "intro" },
    { frame: framesOf(4.6), timeSec: 4.6, label: "紫砂误区", tag: "警示", type: "stamp" },
    { frame: framesOf(8.8), timeSec: 8.8, label: "铝箔袋层", tag: "步骤1", type: "action" },
    { frame: framesOf(10.6), timeSec: 10.6, label: "塑料袋层", tag: "步骤2", type: "action" },
    { frame: framesOf(12.4), timeSec: 12.4, label: "原包装箱", tag: "步骤3", type: "action" },
  ],
  fields: [
    { key: "title", label: "主题字", default: "封", placeholder: "封" },
    { key: "taboo", label: "避坑容器", default: "紫砂不能用", placeholder: "紫砂不能用" },
    { key: "layer1", label: "密封第一层", default: "铝箔袋", placeholder: "铝箔袋" },
    { key: "layer2", label: "密封第二层", default: "塑料袋", placeholder: "塑料袋" },
    { key: "layer3", label: "密封第三层", default: "纸箱密封", placeholder: "纸箱密封" },
  ],
});
