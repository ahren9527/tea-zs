import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp, duration } from "./Comp";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep18-b3",
  episode: 18,
  code: "B3",
  title: "干",
  note: "吸潮≠变醇／发酸发霉 → 梅雨除湿机 → 别塞冰箱 · 20秒",
  exportName: "正上茶舍_18_B3_干.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: framesOf(0.3), timeSec: 0.3, label: "核心大字: 干", tag: "开门", type: "intro" },
    { frame: framesOf(2.8), timeSec: 2.8, label: "吸潮辨析", tag: "辨析", type: "action" },
    { frame: framesOf(5.0), timeSec: 5.0, label: "发霉警示", tag: "盖印", type: "stamp" },
    { frame: framesOf(10.0), timeSec: 10.0, label: "除湿机建议", tag: "行动", type: "action" },
    { frame: framesOf(13.2), timeSec: 13.2, label: "切忌冰箱", tag: "禁忌", type: "punchline" },
  ],
  fields: [
    { key: "title", label: "主题字", default: "干", placeholder: "干" },
    { key: "myth", label: "辨析点", default: "吸潮≠变醇", placeholder: "吸潮≠变醇" },
    { key: "warning", label: "变质后果", default: "发酸发霉", placeholder: "发酸发霉" },
    { key: "solution", label: "实操方案", default: "梅雨季节除湿机", placeholder: "梅雨季节除湿机" },
    { key: "taboo", label: "绝对禁忌", default: "别塞冰箱", placeholder: "别塞冰箱" },
  ],
});
