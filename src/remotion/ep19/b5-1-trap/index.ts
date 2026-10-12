import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp } from "./Comp";
import { duration } from "./data-export";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep19-b5-1",
  episode: 19,
  code: "B5-1",
  title: "吸异味雷区",
  note: "后景厨房铁锅油烟升腾 · 前景墨绿瓷罐两叶一芽茶变质 · 避开厨房油烟 · 4.5秒",
  exportName: "正上茶舍_19_B5-1_吸异味雷区.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: 0, timeSec: 0, label: "标题起幅", tag: "起幅", type: "intro" },
    { frame: framesOf(0.4), timeSec: 0.4, label: "印章落墨", tag: "印章", type: "stamp" },
    { frame: framesOf(0.7), timeSec: 0.7, label: "烟气扩散", tag: "对流", type: "action" },
    { frame: framesOf(1.4), timeSec: 1.4, label: "茶叶变质", tag: "受污", type: "action" },
    { frame: framesOf(2.2), timeSec: 2.2, label: "引线向下", tag: "引线", type: "action" },
    { frame: framesOf(2.4), timeSec: 2.4, label: "标牌落幅", tag: "标牌", type: "stamp" },
    { frame: framesOf(3.6), timeSec: 3.6, label: "警示定格", tag: "定格", type: "punchline" },
  ],
  fields: [
    { key: "title", label: "顶部标题", default: "雷区一：极易吸味", placeholder: "雷区一：极易吸味", type: "heading" },
    { key: "stamp", label: "底部标牌", default: "避开厨房油烟", placeholder: "避开厨房油烟", type: "stamp" },
  ],
});
