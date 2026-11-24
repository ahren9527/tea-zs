/**
 * 正上茶舍「月影 · 贡眉-白茶」350g 棉纸茶饼（正面俯视），照片描图 + 平涂手绘画法（见 traced-cake.ts）。
 * 层次：灰色线描（楼阁 / 远山 / 栏杆）→ 冰蓝镭射烫字「月影」+ 月牙 + 星星 + 细环线 → 飘落的小绿叶 → 黄绿燕尾 →
 *       深色字（一叶倾心 / 贡眉-白茶 / 净含量:350克）→ logo（官方矢量）→ 橄榄绿丝带 YUE YING-GONGMEI WHITE TEA。
 * 原点为饼中心。
 */
import { YUEYING_LAYERS, YUEYING_LOGO, YUEYING_RIBBON, YUEYING_UNIT } from "./yueying-data";
import { makeTracedCake } from "./traced-cake";

export const drawYueyingCake = makeTracedCake({
  key: "yueying:traced",
  unit: YUEYING_UNIT,
  layers: YUEYING_LAYERS,
  ribbon: YUEYING_RIBBON,
  ribbonTextLayer: "ribbonText",
  logo: YUEYING_LOGO,
  paperMargin: 1.0,
  under: [
    { layer: "gray", color: "#c8c5be" },
    { layer: "ring", color: "#8aa0d6" },
    { layer: "blue", color: "#8cc3ee", shade: "#4a86c4", sheen: "rgba(240,250,255,0.6)" },
    { layer: "leaf", color: "#8cc63f", shade: "#5c8f25" },
    { layer: "flag", color: "#b4b83c", shade: "#7f8526" },
    { layer: "dark", color: "#2b2723" },
  ],
  ribbonStyle: { fill: "#8a983e", stripe: "#56621f", line: "#f4f6ea", text: "#fbfbf6" },
});
