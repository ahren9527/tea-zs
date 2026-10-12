import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp, duration } from "./Comp";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep18-b10",
  episode: 18,
  code: "B10",
  title: "大罐存小罐醒",
  note: "大罐存 · 小罐醒 · 主仓与随喝搭配 · 12秒",
  exportName: "正上茶舍_18_B10_大罐存小罐醒.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: framesOf(0.4), timeSec: 0.4, label: "开篇总纲", tag: "标题", type: "intro" },
    { frame: framesOf(1.8), timeSec: 1.8, label: "大罐登场", tag: "主仓", type: "action" },
    { frame: framesOf(5.0), timeSec: 5.0, label: "小罐登场", tag: "随喝", type: "action" },
    { frame: framesOf(7.4), timeSec: 7.4, label: "流转过渡", tag: "取用", type: "action" },
    { frame: framesOf(9.2), timeSec: 9.2, label: "定论口诀", tag: "口诀", type: "punchline" },
  ],
  fields: [
    { key: "title", label: "核心主题", default: "大罐存 · 小罐醒", placeholder: "大罐存 · 小罐醒" },
    { key: "bigLabel", label: "大罐主标", default: "大罐长期封存", placeholder: "大罐长期封存" },
    { key: "bigSub", label: "大罐要义", default: "避光密封 · 静置陈化", placeholder: "避光密封 · 静置陈化" },
    { key: "smallLabel", label: "小罐主标", default: "小罐日常慢醒", placeholder: "小罐日常慢醒" },
    { key: "smallSub", label: "小罐要义", default: "按周取用 · 唤醒茶香", placeholder: "按周取用 · 唤醒茶香" },
    { key: "foot", label: "总结口诀", default: "分工明确 · 滋味常新", placeholder: "分工明确 · 滋味常新" },
  ],
});
