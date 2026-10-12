import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp, duration } from "./Comp";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep18-b2",
  episode: 18,
  code: "B2",
  title: "三法则",
  note: "干 / 封 / 净 三张卡 · 8秒",
  exportName: "正上茶舍_18_B2_三法则.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: framesOf(0.4), timeSec: 0.4, label: "法则一: 干", tag: "法则", type: "action" },
    { frame: framesOf(2.6), timeSec: 2.6, label: "法则二: 封", tag: "法则", type: "action" },
    { frame: framesOf(4.9), timeSec: 4.9, label: "法则三: 净", tag: "法则", type: "action" },
  ],
  fields: [
    { key: "card1", label: "法则一 (干)", default: "干不干", placeholder: "干不干" },
    { key: "card2", label: "法则二 (封)", default: "封没封严", placeholder: "封没封严" },
    { key: "card3", label: "法则三 (净)", default: "有没有怪味", placeholder: "有没有怪味" },
  ],
});
