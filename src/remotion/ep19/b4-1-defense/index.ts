import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp } from "./Comp";
import { duration } from "./data-export";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep19-b4-1",
  episode: 19,
  code: "B4-1",
  title: "避光与密封物理防御",
  note: "小瓷罐纵剖面 · 避光折射散射 · 硅胶密封挤压 · 5秒",
  exportName: "正上茶舍_19_B4-1_避光与密封物理防御.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: 0, timeSec: 0, label: "剖面底境", tag: "基底", type: "intro" },
    { frame: framesOf(0.75), timeSec: 0.75, label: "金光直射", tag: "光束", type: "action" },
    { frame: framesOf(1.05), timeSec: 1.05, label: "釉面散射", tag: "折射", type: "action" },
    { frame: framesOf(1.25), timeSec: 1.25, label: "避光印章", tag: "盖印", type: "stamp" },
    { frame: framesOf(1.8), timeSec: 1.8, label: "木盖压下", tag: "下压", type: "action" },
    { frame: framesOf(2.2), timeSec: 2.2, label: "硅胶挤压", tag: "形变", type: "action" },
    { frame: framesOf(2.65), timeSec: 2.65, label: "合盖锁紧", tag: "气密", type: "action" },
    { frame: framesOf(2.7), timeSec: 2.7, label: "聚香光球", tag: "锁香", type: "punchline" },
    { frame: framesOf(2.8), timeSec: 2.8, label: "密封印章", tag: "盖印", type: "stamp" },
  ],
  fields: [
    { key: "lightStamp", label: "避光印章", default: "避光 ✔", placeholder: "避光 ✔", type: "stamp" },
    { key: "sealStamp", label: "密封印章", default: "密封 ✔", placeholder: "密封 ✔", type: "stamp" },
  ],
});
