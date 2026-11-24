/**
 * 正上茶舍「素雪 · 白牡丹-白茶」300g 棉纸茶饼（正面俯视），照片描图 + 平涂手绘画法（见 traced-cake.ts）。
 * 层次：灰色线描（古塔 / 牡丹 / 远山）→ 蓝灰波浪边线 → 翠绿镭射烫字「素雪」+ 雪花 + 飘带 → 翠绿燕尾 →
 *       深色字（一叶倾心 / 白牡丹-白茶 / 净含量:300克）→ logo（官方矢量）→ 墨绿丝带 SUXUE-BAI MUDAN WHITE TEA。
 * 原点为饼中心；ep22/kit/objects.ts 里的旧版 drawSuxueCake 是 ep22 已上线的手绘版，不要和这里混用。
 */
import { SUXUE_LAYERS, SUXUE_LOGO, SUXUE_RIBBON, SUXUE_UNIT } from "./suxue-data";
import { makeTracedCake } from "./traced-cake";

export const drawSuxueCake = makeTracedCake({
  key: "suxue:traced",
  unit: SUXUE_UNIT,
  layers: SUXUE_LAYERS,
  ribbon: SUXUE_RIBBON,
  ribbonTextLayer: "ribbonText",
  logo: SUXUE_LOGO,
  paperMargin: 1.0,
  under: [
    { layer: "gray", color: "#c8c5be" },
    { layer: "frame", color: "#567f86" },
    { layer: "foil", color: "#6fd49b", shade: "#33a064", sheen: "rgba(236,255,244,0.55)" },
    { layer: "snow", color: "#6fd49b", shade: "#33a064" },
    { layer: "snowDark", color: "#1f5e3f" },
    { layer: "flag", color: "#63bd3f", shade: "#3f8a2b" },
    { layer: "dark", color: "#2b2723" },
  ],
  ribbonStyle: { fill: "#1c5236", stripe: "#0d3222", line: "#eef5ef", text: "#f7f7f1" },
});
