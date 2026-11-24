/**
 * 正上茶舍产品物件库（固定资产，各期共用）：
 * - 蜜韵 · 寿眉-白茶 350g 茶饼      drawMiyunCake(ctx, radius, { lift })
 * - 素雪 · 白牡丹-白茶 300g 茶饼    drawSuxueCake(ctx, radius, { lift })
 * - 月影 · 贡眉-白茶 350g 茶饼      drawYueyingCake(ctx, radius, { lift })
 * - 礼盒（胡桃木翻盖）              drawGiftBox(ctx, width)
 * - 手提袋                          drawGiftBag(ctx, width)
 * - 品牌 logo（官方原图矢量）        drawBrandLogo / drawBrandEmblem / drawBrandWordmark（mono 给颜色即单色）
 *
 * 所有函数都是确定性纯绘制：原点为物件中心，尺寸参数为像素。包装上的字不跟面板字体走。
 * 三款茶饼的印刷图案都是从实物照片描出的矢量轮廓（xxx-data.ts，由 scripts/products/trace-*.py 生成），
 * 不依赖任何字体；顶部 logo 一律用官方 logo 原图矢量。素雪、月影共用 traced-cake.ts 的画法，蜜韵在 miyun.ts 单独写，规则相同。
 * 礼盒、手提袋目前还是手写几何，之后照同样方法描。
 * ep22/kit/objects.ts 里的 drawSuxueCake 是 ep22 已上线的旧手绘版，不要和这里的混用。
 */
export { drawMiyunCake, type CakeDrawOpts } from "./miyun";
export { drawSuxueCake } from "./suxue";
export { drawYueyingCake } from "./yueying";
export { makeTracedCake, type TracedCakeSpec } from "./traced-cake";
export { drawGiftBag, drawGiftBox, GIFT_BAG_ASPECT, GIFT_BOX_ASPECT } from "./gift-box";
export { drawBrandEmblem, drawBrandLogo, drawBrandWordmark, EMBLEM_GOLD, EMBLEM_GREEN } from "./emblem";
export { setProductCanvasFactory } from "./common";
