import { preloadIconList } from "@/remotion/shared/icon-cache";
import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import { FILM_NOTE, LENGTH, P1_AT, P2_AT, P3_AT, SEAL_HIT, TEXT, VO, sfxHits } from "./data";
import { Comp } from "./Comp";
import { BRUSH_FONT, MOUNT_SRC, allTexts, draw } from "./draw";

export default defineClip({
  id: "ep22-b7",
  episode: 22,
  code: "B7",
  title: "口诀金句",
  note: "水墨版：三团淡墨依次洇开，毛笔楷书「封住气 / 挡住光 / 护住形」落在墨里 + 朱印「三层护茶」+ 古筝品牌声 · " + FILM_NOTE,
  exportName: "正上茶舍_22_B7_口诀金句.mp4",
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: "tea/vo/ep22.mp3", startSec: VO.startSec },
  prepare: async (params) => {
    const text = allTexts(params);
    await ensureFonts(text);
    await preloadIconList([MOUNT_SRC]);
    // 毛笔楷书（马善政，OFL）：canvas 不会自己触发字体下载，先手动加载
    if (typeof document !== "undefined" && document.fonts) {
      await Promise.race([
        document.fonts.load(`400 64px ${BRUSH_FONT.split(",")[0]}`, text).catch(() => []),
        new Promise((r) => setTimeout(r, 6000)),
      ]);
    }
  },
  markers: [
    { frame: P1_AT, timeSec: sec(P1_AT), label: "封住气", tag: "第一层", type: "stamp" },
    { frame: P2_AT, timeSec: sec(P2_AT), label: "挡住光", tag: "第二层", type: "stamp" },
    { frame: P3_AT, timeSec: sec(P3_AT), label: "护住形", tag: "第三层", type: "stamp" },
    { frame: SEAL_HIT, timeSec: sec(SEAL_HIT), label: "三层护茶", tag: "落印", type: "punchline" },
  ],
  fields: [
    { key: "p1", label: "口诀一", default: TEXT.p1, placeholder: TEXT.p1 },
    { key: "p2", label: "口诀二", default: TEXT.p2, placeholder: TEXT.p2 },
    { key: "p3", label: "口诀三", default: TEXT.p3, placeholder: TEXT.p3 },
    { key: "seal", label: "朱砂印章", default: TEXT.seal, placeholder: TEXT.seal, type: "stamp" },
  ],
});
