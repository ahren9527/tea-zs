import { defineClip } from "@/remotion/shared/define-clip";
import { framesOf } from "@/remotion/shared/theme";
import { Comp } from "./Comp";
import { duration } from "./data-export";
import { sfxHits } from "./data";
import { draw } from "./draw";

export default defineClip({
  id: "ep19-b5-2",
  episode: 19,
  code: "B5-2",
  title: "梅雨大开雷区",
  note: "中式湿度计飙升85% · 物理湿气水滴倾泻 · 大铝箔自封袋大敞大开 · 茶叶受潮发软 · 5秒",
  exportName: "正上茶舍_19_B5-2_梅雨大开雷区.mp4",
  Comp,
  draw,
  duration,
  sfx: sfxHits,
  markers: [
    { frame: 0, timeSec: 0, label: "标题起幅", tag: "起幅", type: "intro" },
    { frame: framesOf(0.4), timeSec: 0.4, label: "印章落印", tag: "印章", type: "stamp" },
    { frame: framesOf(0.8), timeSec: 0.8, label: "湿度飙升", tag: "警示", type: "action" },
    { frame: framesOf(1.4), timeSec: 1.4, label: "水汽直灌", tag: "受潮", type: "action" },
    { frame: framesOf(2.4), timeSec: 2.4, label: "标牌落幅", tag: "标牌", type: "stamp" },
    { frame: framesOf(3.4), timeSec: 3.4, label: "定格警示", tag: "定格", type: "punchline" },
  ],
  fields: [
    { key: "title", label: "顶部标题", default: "雷区二：梅雨大开", placeholder: "雷区二：梅雨大开" },
    { key: "stamp", label: "底部标牌", default: "梅雨忌大开补茶 ✖", placeholder: "梅雨忌大开补茶 ✖", type: "stamp" },
  ],
});
