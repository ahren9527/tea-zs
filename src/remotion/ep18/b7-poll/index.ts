import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp, duration } from "./Comp";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep18-b7",
  episode: 18,
  code: "B7",
  title: "互动",
  note: "怎么喝 → A/B 同屏 → 评论区聊聊 · 10秒",
  exportName: "正上茶舍_18_B7_互动.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: framesOf(0.4), timeSec: 0.4, label: "问题引导", tag: "发问", type: "intro" },
    { frame: framesOf(2.6), timeSec: 2.6, label: "选项 A 现喝", tag: "选项A", type: "action" },
    { frame: framesOf(4.8), timeSec: 4.8, label: "选项 B 分装", tag: "选项B", type: "action" },
    { frame: framesOf(7.6), timeSec: 7.6, label: "评论区互动", tag: "互动", type: "punchline" },
  ],
  fields: [
    { key: "question", label: "互动提问", default: "怎么喝", placeholder: "怎么喝" },
    { key: "optA", label: "选项 A", default: "现喝现撬", placeholder: "现喝现撬" },
    { key: "optB", label: "选项 B", default: "提前分装", placeholder: "提前分装" },
    { key: "cta", label: "行动号召", default: "评论区聊聊", placeholder: "评论区聊聊" },
  ],
});
