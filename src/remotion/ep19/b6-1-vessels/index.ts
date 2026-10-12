import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp } from "./Comp";
import { duration } from "./data-export";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep19-b6-1",
  episode: 19,
  code: "B6-1",
  title: "昼夜双境·仓台对读",
  note: "上半屏暗仓夜境大瓮经年 · 下半屏晨曦案头小瓷罐醒茶 · 居中破空砸落印章横幅 · 4.5秒",
  exportName: "正上茶舍_19_B6-1_昼夜双境仓台对读.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: 0, timeSec: 0, label: "双境初启", tag: "起幅", type: "intro" },
    { frame: framesOf(0.4), timeSec: 0.4, label: "主标砸落", tag: "印章", type: "stamp" },
    { frame: framesOf(0.8), timeSec: 0.8, label: "经年沉淀", tag: "年份", type: "action" },
    { frame: framesOf(1.1), timeSec: 1.1, label: "晨曦苏醒", tag: "醒茶", type: "action" },
    { frame: framesOf(1.8), timeSec: 1.8, label: "仓台对照", tag: "准则", type: "stamp" },
    { frame: framesOf(3.2), timeSec: 3.2, label: "定格收束", tag: "定格", type: "punchline" },
  ],
  fields: [
    { key: "title", label: "居中主标", default: "大罐睡觉 · 小罐上班", placeholder: "大罐睡觉 · 小罐上班" },
    { key: "stamp", label: "主标印章", default: "准则", placeholder: "准则", type: "stamp" },
  ],
});
