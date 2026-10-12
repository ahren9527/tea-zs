import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp, duration } from "./Comp";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep18-b6",
  episode: 18,
  code: "B6",
  title: "总结",
  note: "够干、封死、没味 三印 · 8秒",
  exportName: "正上茶舍_18_B6_六个字.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: framesOf(0.3), timeSec: 0.3, label: "六字法则引言", tag: "引言", type: "intro" },
    { frame: framesOf(1.6), timeSec: 1.6, label: "够干印章", tag: "印1", type: "stamp" },
    { frame: framesOf(3.0), timeSec: 3.0, label: "封死印章", tag: "印2", type: "stamp" },
    { frame: framesOf(4.4), timeSec: 4.4, label: "没味印章", tag: "印3", type: "stamp" },
  ],
  fields: [
    { key: "w1", label: "印章一", default: "够干", placeholder: "够干", type: "stamp" },
    { key: "w2", label: "印章二", default: "封死", placeholder: "封死", type: "stamp" },
    { key: "w3", label: "印章三", default: "没味", placeholder: "没味", type: "stamp" },
  ],
});
