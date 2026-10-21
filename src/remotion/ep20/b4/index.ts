import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import {
  ARC_AT,
  CAKE_LAND_AT,
  CHUNK_LIFT_AT,
  CRACK_AT,
  EDGE_AT,
  GRAIN_AT,
  LENGTH,
  NEEDLE_HIT_AT,
  SEAL_HIT_AT,
  TEXT,
  TURN_AT,
  WRAP_AT,
  sec,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep20-b4",
  episode: 20,
  code: "B4",
  title: "顺纹撬饼",
  note: "茶饼俯视 · 饼边下针 · 顺纹裂开成块 · 一周量 · 棉纸包好盖「快取快封」· 18秒（成片 35–53s）",
  exportName: "正上茶舍_20_B4_顺纹撬饼.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: CAKE_LAND_AT, timeSec: sec(CAKE_LAND_AT), label: "茶饼落定", tag: "入场", type: "intro" },
    { frame: GRAIN_AT, timeSec: sec(GRAIN_AT), label: "纹理显现", tag: "纹理", type: "action" },
    { frame: TURN_AT, timeSec: sec(TURN_AT), label: "正着来", tag: "转折", type: "punchline" },
    { frame: EDGE_AT, timeSec: sec(EDGE_AT), label: "饼边", tag: "饼边", type: "action" },
    { frame: NEEDLE_HIT_AT, timeSec: sec(NEEDLE_HIT_AT), label: "下针", tag: "下针", type: "action" },
    { frame: CRACK_AT, timeSec: sec(CRACK_AT), label: "顺纹裂开", tag: "顺纹", type: "action" },
    { frame: CHUNK_LIFT_AT, timeSec: sec(CHUNK_LIFT_AT), label: "成块撬起", tag: "成块", type: "action" },
    { frame: ARC_AT, timeSec: sec(ARC_AT), label: "一周量", tag: "分量", type: "punchline" },
    { frame: WRAP_AT, timeSec: sec(WRAP_AT), label: "棉纸包好", tag: "包", type: "action" },
    { frame: SEAL_HIT_AT, timeSec: sec(SEAL_HIT_AT), label: "快取快封", tag: "盖章", type: "stamp" },
  ],
  fields: [
    { key: "grain", label: "开场小字", default: TEXT.grain, placeholder: TEXT.grain },
    { key: "turn", label: "转折大字", default: TEXT.turn, placeholder: TEXT.turn },
    { key: "kw1", label: "要点一", default: TEXT.kw1, placeholder: TEXT.kw1 },
    { key: "kw2", label: "要点二", default: TEXT.kw2, placeholder: TEXT.kw2 },
    { key: "kw3", label: "要点三", default: TEXT.kw3, placeholder: TEXT.kw3 },
    { key: "portion", label: "分量（竖排）", default: TEXT.portion, placeholder: TEXT.portion },
    { key: "portionSub", label: "分量小字", default: TEXT.portionSub, placeholder: TEXT.portionSub },
    { key: "seal", label: "印章（最多 4 字）", default: TEXT.seal, placeholder: TEXT.seal, type: "stamp" },
  ],
});
