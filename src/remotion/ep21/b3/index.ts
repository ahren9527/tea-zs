import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  CAKE_AT,
  FILM_NOTE,
  HERO_AT,
  LENGTH,
  LOOSE_AT,
  PATH_AT,
  TEXT,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep21-b3",
  episode: 21,
  code: "B3",
  title: "按形态",
  note: "左格蓬松散茶 · 右格压紧饼茶 · 各进各格 · 大字「各占各区」 · " + FILM_NOTE,
  exportName: "正上茶舍_21_B3_按形态.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: LOOSE_AT, timeSec: sec(LOOSE_AT), label: "散茶进格", tag: "散茶", type: "action" },
    { frame: CAKE_AT, timeSec: sec(CAKE_AT), label: "饼茶进格", tag: "饼茶", type: "action" },
    { frame: HERO_AT, timeSec: sec(HERO_AT), label: "各占各区", tag: "结论", type: "punchline" },
    { frame: PATH_AT, timeSec: sec(PATH_AT), label: "各走各道", tag: "隔开", type: "stamp" },
  ],
  fields: [
    { key: "loose", label: "左格单字（散）", default: TEXT.loose, placeholder: TEXT.loose },
    { key: "cake", label: "右格单字（饼）", default: TEXT.cake, placeholder: TEXT.cake },
    { key: "hero", label: "核心大字", default: TEXT.hero, placeholder: TEXT.hero },
  ],
});
