import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp, duration } from "./Comp";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep18-b8",
  episode: 18,
  code: "B8",
  title: "架起来放",
  note: "离墙一尺 → 离地半尺 → 架起来放 · 12秒",
  exportName: "正上茶舍_18_B8_架起来放.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: framesOf(0.2), timeSec: 0.2, label: "茶仓环境", tag: "环境", type: "intro" },
    { frame: framesOf(1.6), timeSec: 1.6, label: "离墙一尺", tag: "要点1", type: "action" },
    { frame: framesOf(5.2), timeSec: 5.2, label: "离地半尺", tag: "要点2", type: "action" },
    { frame: framesOf(8.6), timeSec: 8.6, label: "架起来放", tag: "要点3", type: "stamp" },
  ],
  fields: [
    { key: "rule1", label: "仓储口诀1", default: "离墙一尺", placeholder: "离墙一尺" },
    { key: "rule2", label: "仓储口诀2", default: "离地半尺", placeholder: "离地半尺" },
    { key: "action", label: "终极动作", default: "架起来放", placeholder: "架起来放" },
  ],
});
