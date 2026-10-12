import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp } from "./Comp";
import { duration } from "./data-export";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep19-b4-2",
  episode: 19,
  code: "B4-2",
  title: "材质红黑对决",
  note: "瓷铁 vs 砂玻 · 避光折射与枯萎灰褐 · 密封光罩与跑香逸散 · 5秒",
  exportName: "正上茶舍_19_B4-2_材质红黑对决.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: 0, timeSec: 0, label: "双罐对立", tag: "对决", type: "intro" },
    { frame: framesOf(0.5), timeSec: 0.5, label: "斜射金光", tag: "光束", type: "action" },
    { frame: framesOf(0.8), timeSec: 0.8, label: "光气双测", tag: "测试", type: "action" },
    { frame: framesOf(0.9), timeSec: 0.9, label: "右罐焦枯", tag: "变色", type: "action" },
    { frame: framesOf(0.85), timeSec: 0.85, label: "左罐聚香", tag: "锁香", type: "punchline" },
    { frame: framesOf(2.0), timeSec: 2.0, label: "引线标牌", tag: "引线", type: "action" },
    { frame: framesOf(2.4), timeSec: 2.4, label: "双印落地", tag: "标牌", type: "stamp" },
    { frame: framesOf(3.2), timeSec: 3.2, label: "锁香定格", tag: "定格", type: "punchline" },
  ],
  fields: [
    { key: "leftStamp", label: "左罐标牌", default: "瓷·铁 锁香 ✔", placeholder: "瓷·铁 锁香 ✔", type: "stamp" },
    { key: "rightStamp", label: "右罐标牌", default: "砂·玻 见光死 ✖", placeholder: "砂·玻 见光死 ✖", type: "stamp" },
  ],
});
