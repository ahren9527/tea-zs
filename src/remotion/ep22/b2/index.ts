import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/templates/fonts";
import { sec } from "../kit/draw-kit";
import {
  BOX_ORDER_AT,
  CHECK_AT,
  COMPARE_AT,
  DOUBLE_AT,
  FILM_NOTE,
  LENGTH,
  LINER_AT,
  PEEK_AT,
  SINGLE_ORDER_AT,
  TEXT,
  VO,
  sfxHits,
} from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: "ep22-b2",
  episode: 22,
  code: "B2",
  title: "顺序对比",
  note: "大整箱「内铝外塑」兜底防潮 · 单饼「内塑外铝」隔袋看清 · 结尾左右并排对比 · " + FILM_NOTE,
  exportName: "正上茶舍_22_B2_顺序对比.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep22.mp3", startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  markers: [
    { frame: BOX_ORDER_AT, timeSec: sec(BOX_ORDER_AT), label: "内铝外塑", tag: "大整箱", type: "stamp" },
    { frame: LINER_AT, timeSec: sec(LINER_AT), label: "内胆兜住", tag: "外塑", type: "action" },
    { frame: DOUBLE_AT, timeSec: sec(DOUBLE_AT), label: "双重防潮", tag: "整箱完", type: "action" },
    { frame: SINGLE_ORDER_AT, timeSec: sec(SINGLE_ORDER_AT), label: "内塑外铝", tag: "单饼", type: "stamp" },
    { frame: PEEK_AT, timeSec: sec(PEEK_AT), label: "拉开看清", tag: "验茶", type: "punchline" },
    { frame: CHECK_AT, timeSec: sec(CHECK_AT), label: "隔袋看清", tag: "不进潮", type: "action" },
    { frame: COMPARE_AT, timeSec: sec(COMPARE_AT), label: "左右对比", tag: "收束", type: "punchline" },
  ],
  fields: [
    { key: "boxTag", label: "场景一标题", default: TEXT.boxTag, placeholder: TEXT.boxTag },
    { key: "boxOrder", label: "场景一顺序", default: TEXT.boxOrder, placeholder: TEXT.boxOrder },
    { key: "boxResult", label: "场景一结论", default: TEXT.boxResult, placeholder: TEXT.boxResult },
    { key: "singleTag", label: "场景二标题", default: TEXT.singleTag, placeholder: TEXT.singleTag },
    { key: "singleOrder", label: "场景二顺序", default: TEXT.singleOrder, placeholder: TEXT.singleOrder },
    { key: "checkNote", label: "场景二结论", default: TEXT.checkNote, placeholder: TEXT.checkNote },
  ],
});
