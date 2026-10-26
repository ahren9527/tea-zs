/**
 * 第 21 期共用物件：
 * 1. 蜜韵寿眉白茶饼（1:1 还原实物包装：
 *    顶部墨绿「正」字茶壶标 + 金色茶烟 + 「正上茶舍 / -zheng shang cha she-」、
 *    左右对称烫金祥云与瑞山纹样、
 *    中心烫金大字「蜜韵」（含梅花点缀与茶芽圆弧撇）+ 「mi yun」、
 *    左下「一叶倾心」手写书法、
 *    中下「寿眉-白茶」+ 青绿远山 + 「净含量:350克」、
 *    底部棕红配金燕尾弧形飘带横幅「MIYUN-SHOUMEI WHITE TEA」）
 * 2. 蓬松散茶堆（俯视/斜侧视，叶片舒展交叠，带银毫与叶梗）
 * 3. 茶柜与分区木格、大标签（「2025·散茶」「2016·饼茶」等）
 */
import {
  TAU,
  cachedSurface,
  hash01,
  mixHex,
  noise1,
  rgba,
  rng,
  traceLeaf,
  type FxPalette,
} from "@/remotion/shared/fx";
import { CAKE_R, CAKE_SIL, paintCakeTexture, type CakeTone } from "./cake";
import { KAI, SONG, fillText, softShadow, tracePoly } from "./draw-kit";

const HEI = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

export function paperColor(pal: FxPalette, aged = false) {
  if (aged) return pal.dark ? "#d2c2a4" : "#e8d8ba"; // 老茶饼：岁月米黄，比新茶明显深一档
  return pal.dark ? "#e8e3d9" : "#f7f5f0";
}

/**
 * 绘制正上茶舍「蜜韵 · 寿眉-白茶」350g 茶饼包装纸表面（缓存到离屏 Canvas，保证逐帧极速且细节锐利）
 */
function paintMiyunWrapper(
  c: CanvasRenderingContext2D,
  pal: FxPalette,
  tone: CakeTone,
  seed: number,
) {
  const aged = tone === "old";
  const R = CAKE_R; // 260

  c.save();
  c.translate(R * 1.15, R * 1.15);

  // 1. 白色棉纸基底（新茶净白微暖，老茶略带岁月米白）
  const basePaper = paperColor(pal, aged);
  const bgGrad = c.createRadialGradient(-R * 0.25, -R * 0.3, R * 0.1, 0, 0, R * 1.08);
  bgGrad.addColorStop(0, mixHex(basePaper, "#ffffff", aged ? 0.22 : 0.65));
  bgGrad.addColorStop(0.75, basePaper);
  bgGrad.addColorStop(1, mixHex(basePaper, aged ? "#b89c72" : "#cbbba0", aged ? 0.45 : 0.22));
  c.fillStyle = bgGrad;
  c.fillRect(-R * 1.15, -R * 1.15, R * 2.3, R * 2.3);

  // 棉纸暗纹纤维
  const rr = rng(400 + seed);
  c.strokeStyle = rgba(pal.tea, aged ? 0.065 : 0.038);
  c.lineWidth = 0.9;
  for (let i = 0; i < 150; i++) {
    const x = (rr() - 0.5) * R * 2.0;
    const y = (rr() - 0.5) * R * 2.0;
    const a = rr() * TAU;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(
      x + Math.cos(a + 0.6) * 12,
      y + Math.sin(a + 0.6) * 12,
      x + Math.cos(a) * 24,
      y + Math.sin(a) * 24,
    );
    c.stroke();
  }

  // 底层茶叶微透质感（极其克制，保持白棉纸干净度）
  c.save();
  c.globalCompositeOperation = "multiply";
  c.globalAlpha = aged ? 0.11 : 0.06;
  paintCakeTexture(c, pal, tone);
  c.restore();

  // 边缘手工包纸折痕（四周多边形折边感）
  const N = 36;
  c.lineCap = "round";
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU + (hash01(i, seed) - 0.5) * 0.08;
    const r0 = R * (0.83 + 0.07 * hash01(i, seed + 2));
    const r1 = R * 1.03;
    const bend = (hash01(i, seed + 5) - 0.5) * 0.08;
    const p0 = { x: Math.cos(a) * r0, y: Math.sin(a) * r0 };
    const pm = {
      x: Math.cos(a + bend) * (r0 + r1) * 0.5,
      y: Math.sin(a + bend) * (r0 + r1) * 0.5,
    };
    const p1 = { x: Math.cos(a) * r1, y: Math.sin(a) * r1 };
    c.strokeStyle = rgba("#6b533b", 0.07 + 0.05 * hash01(i, 9));
    c.lineWidth = 2.5 + 2.5 * hash01(i, 3);
    c.beginPath();
    c.moveTo(p0.x, p0.y);
    c.quadraticCurveTo(pm.x, pm.y, p1.x, p1.y);
    c.stroke();
  }

  // ================= 2. 左右对称外圈金色祥云与瑞山纹样（紧贴饼沿 r = 185..254，中间留白干净） =================
  const patGold = aged ? "#c99b52" : "#dab26d";
  const patGoldLight = aged ? "#dfc088" : "#ead19e";
  const patGrad = c.createLinearGradient(0, -R * 0.9, 0, R * 0.7);
  patGrad.addColorStop(0, patGoldLight);
  patGrad.addColorStop(0.5, patGold);
  patGrad.addColorStop(1, mixHex(patGold, "#b07d32", 0.3));

  for (const side of [-1, 1] as const) {
    c.save();
    c.scale(side, 1);
    c.strokeStyle = patGrad;
    c.fillStyle = patGrad;
    c.lineCap = "round";
    c.lineJoin = "round";

    // (a) 顶部外沿羽毛状茶芽卷草纹（紧贴右上/左上弧边 r = 205..252）
    for (let k = 0; k < 5; k++) {
      const a0 = -Math.PI * 0.38 + k * 0.065;
      const rIn = 188 + k * 4;
      const rOut = 246;
      c.lineWidth = 5.2 - k * 0.6;
      c.beginPath();
      c.moveTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
      c.quadraticCurveTo(
        Math.cos(a0 - 0.06) * ((rIn + rOut) * 0.5),
        Math.sin(a0 - 0.06) * ((rIn + rOut) * 0.5),
        Math.cos(a0 + 0.04) * rOut,
        Math.sin(a0 + 0.04) * rOut,
      );
      c.stroke();
    }

    // (b) 中上部如意双旋祥云（位于外圈 x: 165..248, y: -155..-15）
    c.lineWidth = 13;
    c.beginPath();
    c.moveTo(132, -182);
    c.bezierCurveTo(135, -118, 178, -96, 202, -126);
    c.bezierCurveTo(220, -150, 182, -170, 170, -142);
    c.stroke();

    c.lineWidth = 14;
    c.beginPath();
    c.moveTo(188, -102);
    c.bezierCurveTo(238, -98, 252, -38, 214, -14);
    c.bezierCurveTo(182, 4, 162, -28, 186, -46);
    c.bezierCurveTo(202, -56, 218, -40, 204, -28);
    c.stroke();

    // (c) 中下部外沿大 C 字卷云（x: 185..250, y: 4..108）
    c.lineWidth = 14;
    c.beginPath();
    c.moveTo(192, 86);
    c.bezierCurveTo(170, 38, 206, 6, 238, 24);
    c.bezierCurveTo(260, 42, 248, 98, 212, 112);
    c.stroke();

    // 云心水滴点缀
    c.beginPath();
    c.ellipse(194, 54, 6, 11, 0.3, 0, TAU);
    c.fill();

    // (d) 右下/左下外沿金色瑞山纹（x: 156..228, y: 112..154）
    c.lineWidth = 4;
    c.fillStyle = rgba(patGold, 0.22);
    c.beginPath();
    c.moveTo(152, 148);
    c.lineTo(174, 118);
    c.lineTo(188, 132);
    c.lineTo(204, 108);
    c.lineTo(232, 144);
    c.quadraticCurveTo(192, 156, 152, 148);
    c.closePath();
    c.fill();
    c.stroke();

    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(166, 144);
    c.lineTo(182, 126);
    c.lineTo(198, 138);
    c.lineTo(212, 124);
    c.stroke();

    c.restore();
  }

  // ================= 3. 顶部墨绿「正」字茶壶徽标 & 「正上茶舍」 =================
  const logoGreen = "#1f3a24";
  const steamGold = "#bf7a24";
  c.save();
  c.translate(0, -192);
  c.scale(0.92, 0.92);

  // 茶壶外框与「正」字结构
  c.strokeStyle = logoGreen;
  c.fillStyle = logoGreen;
  c.lineWidth = 5.5;
  c.lineCap = "round";
  c.lineJoin = "round";

  c.beginPath();
  c.moveTo(-26, -24);
  c.lineTo(-16, -32);
  c.lineTo(22, -32);
  c.stroke();

  c.beginPath();
  c.moveTo(-22, -16);
  c.bezierCurveTo(-26, 8, -20, 20, 0, 20);
  c.bezierCurveTo(20, 20, 26, 8, 24, -14);
  c.stroke();

  c.beginPath();
  c.moveTo(0, -30);
  c.lineTo(0, 10);
  c.moveTo(0, -10);
  c.lineTo(15, -10);
  c.moveTo(-14, -8);
  c.lineTo(-14, 10);
  c.moveTo(-18, 10);
  c.lineTo(18, 10);
  c.stroke();

  c.lineWidth = 4.2;
  c.beginPath();
  c.moveTo(-18, 26);
  c.lineTo(18, 26);
  c.stroke();

  // 右上角金色茶烟
  c.strokeStyle = steamGold;
  c.fillStyle = steamGold;
  c.lineWidth = 4.5;
  c.beginPath();
  c.moveTo(16, -18);
  c.bezierCurveTo(18, -34, 32, -38, 30, -24);
  c.bezierCurveTo(28, -14, 38, -16, 40, -28);
  c.stroke();
  c.beginPath();
  c.arc(32, -40, 3.5, 0, TAU);
  c.fill();
  c.restore();

  fillText(c, "正 上 茶 舍", 0, -142, 22, {
    color: logoGreen,
    weight: 900,
    font: HEI,
  });
  fillText(c, "-zheng shang cha she-", 0, -123, 11, {
    color: logoGreen,
    weight: 700,
    font: HEI,
  });

  // ================= 4. 中心烫金大字「蜜韵」+ 梅花 + 茶芽圆弧 =================
  const foilGrad = c.createLinearGradient(-130, -95, 130, 65);
  foilGrad.addColorStop(0, "#e2b862");
  foilGrad.addColorStop(0.28, "#f8df98");
  foilGrad.addColorStop(0.52, "#cc9b3e");
  foilGrad.addColorStop(0.76, "#fbe6a8");
  foilGrad.addColorStop(1, "#b88228");

  c.save();
  c.shadowColor = rgba("#6e4910", 0.24);
  c.shadowBlur = 3;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;

  c.font = `700 132px ${KAI}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = foilGrad;
  c.fillText("蜜", -66, -24);
  c.fillText("韵", 56, -22);

  // 「韵」字右上包绕下来的标志性烫金大圆弧 + 右上茶芽小叶 + 顶部五瓣梅花
  c.strokeStyle = foilGrad;
  c.lineWidth = 6.2;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(46, -88);
  c.bezierCurveTo(102, -92, 134, -46, 116, 20);
  c.bezierCurveTo(100, 74, 34, 84, -4, 44);
  c.stroke();

  c.beginPath();
  traceLeaf(c, 122, -74, -0.25, 28, 10.5);
  c.fillStyle = foilGrad;
  c.fill();

  const fx = 28;
  const fy = -84;
  for (let p = 0; p < 5; p++) {
    const a = (p / 5) * TAU - Math.PI / 2;
    c.beginPath();
    c.arc(fx + Math.cos(a) * 6.5, fy + Math.sin(a) * 6.5, 4.2, 0, TAU);
    c.fill();
  }
  c.fillStyle = basePaper;
  c.beginPath();
  c.arc(fx, fy, 2.8, 0, TAU);
  c.fill();

  // 左下「mi yun」烫金英文字
  c.font = `700 22px "Georgia", ${SONG}`;
  c.fillStyle = foilGrad;
  c.fillText("m i   y u n", -62, 54);
  c.restore();

  // ================= 5. 左下「一叶倾心」书法手写字 =================
  c.save();
  c.translate(-162, 78);
  c.rotate(-0.08);
  fillText(c, "一叶", -6, -13, 26, {
    color: "#3a2518",
    weight: 700,
    font: KAI,
  });
  fillText(c, "倾心", 4, 15, 26, {
    color: "#3a2518",
    weight: 700,
    font: KAI,
  });
  c.restore();

  // ================= 6. 「寿眉-白茶」 + 青绿远山 + 「净含量:350克」 =================
  fillText(c, "寿眉-白茶", 0, 92, 30, {
    color: "#4a453f",
    weight: 700,
    font: SONG,
    spacing: 1.5,
  });

  // 青绿水墨远山（连绵五峰，位于 y: 116..148）
  c.save();
  const mtGrad = c.createLinearGradient(0, 114, 0, 152);
  mtGrad.addColorStop(0, rgba("#86ad82", 0.68));
  mtGrad.addColorStop(1, rgba("#d0e4ca", 0.22));
  c.fillStyle = mtGrad;
  c.strokeStyle = rgba("#72996e", 0.7);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-114, 148);
  c.lineTo(-86, 130);
  c.lineTo(-66, 138);
  c.lineTo(-36, 118);
  c.lineTo(-8, 132);
  c.lineTo(16, 116);
  c.lineTo(46, 134);
  c.lineTo(72, 122);
  c.lineTo(112, 148);
  c.quadraticCurveTo(0, 156, -114, 148);
  c.closePath();
  c.fill();
  c.stroke();

  c.strokeStyle = rgba("#f2f7f0", 0.72);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(-36, 118);
  c.lineTo(-24, 144);
  c.moveTo(16, 116);
  c.lineTo(24, 144);
  c.moveTo(72, 122);
  c.lineTo(64, 146);
  c.stroke();
  c.restore();

  fillText(c, "净含量: 350克", 0, 166, 18, {
    color: "#2b221c",
    weight: 900,
    font: HEI,
  });

  // ================= 7. 底部棕红配金燕尾弧形飘带横幅（r = 212，紧贴饼底弧边，不压字） =================
  const arcCy = 0;
  const arcR = 212;
  const arcW = 38;
  const rustRed = "#8f3314";
  const rustLight = "#ab441f";

  c.save();
  // 左右两端金色燕尾飘带头
  for (const side of [-1, 1] as const) {
    c.save();
    c.scale(side, 1);
    const tailGrad = c.createLinearGradient(128, 155, 180, 116);
    tailGrad.addColorStop(0, "#b8791e");
    tailGrad.addColorStop(0.5, "#d89c3e");
    tailGrad.addColorStop(1, "#e8b960");
    c.fillStyle = tailGrad;
    c.beginPath();
    c.moveTo(122, 152);
    c.lineTo(162, 110);
    c.lineTo(166, 134);
    c.lineTo(186, 130);
    c.lineTo(148, 176);
    c.closePath();
    c.fill();
    c.restore();
  }

  // 主体棕红弧形横幅底带
  const aStart = Math.PI * 0.24;
  const aEnd = Math.PI * 0.76;
  const rInner = arcR - arcW / 2;
  const rOuter = arcR + arcW / 2;

  const banGrad = c.createLinearGradient(-150, 195, 150, 195);
  banGrad.addColorStop(0, rustRed);
  banGrad.addColorStop(0.5, rustLight);
  banGrad.addColorStop(1, rustRed);

  c.fillStyle = banGrad;
  c.beginPath();
  c.arc(0, arcCy, rOuter, aStart, aEnd);
  c.arc(0, arcCy, rInner, aEnd, aStart, true);
  c.closePath();
  c.fill();

  c.strokeStyle = "#d19636";
  c.lineWidth = 3;
  c.stroke();

  c.strokeStyle = rgba("#f7efe2", 0.78);
  c.lineWidth = 1.3;
  c.beginPath();
  c.arc(0, arcCy, rOuter - 4.2, aStart + 0.012, aEnd - 0.012);
  c.arc(0, arcCy, rInner + 4.2, aEnd - 0.012, aStart + 0.012, true);
  c.closePath();
  c.stroke();

  // 沿弧线排列的白色英文：「MIYUN-SHOUMEI WHITE TEA」
  const bannerText = "MIYUN-SHOUMEI WHITE TEA";
  const chars = Array.from(bannerText);
  const textRadius = arcR + 1;
  const totalSpan = Math.PI * 0.43;
  const startAng = Math.PI * 0.5 + totalSpan / 2;
  const stepAng = totalSpan / Math.max(1, chars.length - 1);

  c.fillStyle = "#f9f4ec";
  c.font = `700 15px ${HEI}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  chars.forEach((ch, idx) => {
    const theta = startAng - idx * stepAng;
    const tx = Math.cos(theta) * textRadius;
    const ty = arcCy + Math.sin(theta) * textRadius;
    c.save();
    c.translate(tx, ty);
    c.rotate(theta - Math.PI / 2);
    c.scale(0.82, 1.08);
    c.fillText(ch, 0, 0);
    c.restore();
  });

  c.restore();
  c.restore();
}

function getWrapperSurface(pal: FxPalette, tone: CakeTone, seed: number) {
  const size = Math.ceil(CAKE_R * 2.3);
  return cachedSurface(
    `ep21-miyun-wrapper-v4:${pal.paper}:${tone}:${seed}:${pal.dark ? 1 : 0}`,
    size,
    size,
    (c) => paintMiyunWrapper(c, pal, tone, seed),
  );
}

/**
 * 蜜韵寿眉白茶饼（俯视，1:1 还原实物棉纸包装）：
 * - 顶部墨绿「正」字茶壶徽标 + 「正上茶舍」
 * - 左右对称金色祥云与瑞山纹样
 * - 中心烫金大字「蜜韵」+「mi yun」
 * - 左下「一叶倾心」，中下「寿眉-白茶」+ 青绿远山 +「净含量:350克」
 * - 底部棕红配金燕尾弧形飘带「MIYUN-SHOUMEI WHITE TEA」
 * - peel：可选在侧边微揭一角露出内部新茶（青绿银毫）或老茶（琥珀茶褐）饼面，绝不遮挡主视觉
 */
export function drawMiyunCake(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  r: number,
  o: {
    tone?: CakeTone;
    lift?: number;
    peel?: number;
    peelAngle?: number;
    seed?: number;
    shadow?: number;
    showLabel?: boolean;
  } = {},
) {
  const tone = o.tone ?? "new";
  const aged = tone === "old";
  const s = r / CAKE_R;
  const lift = o.lift ?? 0;
  const seed = o.seed ?? (aged ? 16 : 25);
  const sh = o.shadow ?? 1;

  ctx.save();
  ctx.scale(s, s);
  const sil = CAKE_SIL.map((q) => ({ x: q.x * 1.03, y: q.y * 1.03 }));

  softShadow(ctx, () => tracePoly(ctx, sil), {
    blur: 26 + 40 * lift,
    dx: 14 + 28 * lift,
    dy: 22 + 40 * lift,
    alpha: (0.34 - 0.12 * lift) * sh,
  });
  softShadow(ctx, () => tracePoly(ctx, sil), {
    blur: 6,
    dx: 3,
    dy: 5,
    alpha: 0.24 * (1 - lift) * sh,
  });

  ctx.save();
  ctx.beginPath();
  tracePoly(ctx, sil);
  ctx.clip();

  // 完整呈现正上茶舍「蜜韵 · 寿眉-白茶」棉纸包装表面（与实物照片一致，不裁切版面图案）
  const surf = getWrapperSurface(pal, tone, seed);
  ctx.drawImage(
    surf.canvas as CanvasImageSource,
    -CAKE_R * 1.15,
    -CAKE_R * 1.15,
    CAKE_R * 2.3,
    CAKE_R * 2.3,
  );

  // 整体立体球面受光（左上柔光，右下微暗，模拟茶饼饱满弧面）
  const lg = ctx.createLinearGradient(-CAKE_R, -CAKE_R, CAKE_R, CAKE_R);
  lg.addColorStop(0, rgba("#fff9ec", 0.18));
  lg.addColorStop(0.5, rgba("#fff9ec", 0));
  lg.addColorStop(1, rgba("#2a1a0c", 0.18));
  ctx.fillStyle = lg;
  ctx.fillRect(-CAKE_R * 1.2, -CAKE_R * 1.2, CAKE_R * 2.4, CAKE_R * 2.4);

  ctx.restore();

  // 外轮廓棉纸折边细线
  ctx.strokeStyle = rgba("#7a6248", 0.28);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  tracePoly(ctx, sil);
  ctx.stroke();
  ctx.restore();
}

/**
 * 蓬松散茶（原点为中心）：
 * 一簇自然舒展、层叠交错的白茶散叶（竹青、浅褐、银白毫芽），带蓬松呼吸感。
 */
export function drawLooseTea(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  radius: number,
  o: { tone?: CakeTone; seed?: number; breathe?: number; absorbTint?: number } = {},
) {
  const tone = o.tone ?? "new";
  const seed = o.seed ?? 77;
  const br = o.breathe ?? 0;
  const tint = o.absorbTint ?? 0; // 0..1 吸味染色程度
  const r = rng(seed);

  const cOlive = mixHex(
    tone === "new" ? mixHex("#748856", pal.bamboo, 0.4) : mixHex("#7b583a", pal.tea, 0.35),
    "#5d7844",
    tint * 0.5,
  );
  const cDeep = mixHex("#53643d", pal.bamboo, 0.3);
  const cTan = mixHex("#bfa87e", pal.oat, 0.35);
  const cBud = mixHex("#ede6d5", pal.rice, 0.45);
  const cStem = mixHex("#6e5239", pal.tea, 0.4);

  ctx.save();
  // 底部柔和落影
  softShadow(
    ctx,
    () => {
      ctx.ellipse(0, radius * 0.08, radius * 0.92, radius * 0.76, 0, 0, TAU);
    },
    { blur: 32, dx: 12, dy: 20, alpha: 0.22 },
  );

  // 散茶叶片（从下层到上层，带蓬松间距）
  const count = 52;
  for (let i = 0; i < count; i++) {
    const layer = i / count;
    const dist = Math.sqrt(r()) * radius * (0.95 - layer * 0.25);
    const ang = r() * TAU;
    const spread = 1 + br * (0.04 + 0.04 * layer);
    const x = Math.cos(ang) * dist * spread;
    const y = Math.sin(ang) * dist * 0.85 * spread;
    const rot = r() * TAU + br * 0.06 * (i % 2 ? 1 : -1);
    const len = radius * (0.28 + r() * 0.24);
    const wid = len * (0.22 + r() * 0.14);

    const pick = r();
    const col =
      pick < 0.38 ? cOlive : pick < 0.58 ? cDeep : pick < 0.8 ? cTan : cBud;
    const isBud = col === cBud;

    // 单片叶子的微影
    ctx.fillStyle = rgba("#2a1a0c", 0.12);
    ctx.beginPath();
    traceLeaf(ctx, x + 5, y + 8, rot, isBud ? len * 0.85 : len, isBud ? wid * 0.6 : wid);
    ctx.fill();

    // 叶梗
    if (!isBud && i % 3 === 0) {
      ctx.strokeStyle = cStem;
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(rot) * len * 0.55, y - Math.sin(rot) * len * 0.55);
      ctx.quadraticCurveTo(x, y + 3, x + Math.cos(rot) * len * 0.3, y + Math.sin(rot) * len * 0.3);
      ctx.stroke();
    }

    // 叶片本体
    ctx.fillStyle = col;
    ctx.beginPath();
    traceLeaf(ctx, x, y, rot, isBud ? len * 0.85 : len, isBud ? wid * 0.55 : wid);
    ctx.fill();

    // 受光亮边与叶脉
    ctx.fillStyle = rgba("#fff8e8", isBud ? 0.28 : 0.12);
    ctx.beginPath();
    traceLeaf(
      ctx,
      x - Math.sin(rot) * wid * 0.2,
      y - Math.cos(rot) * wid * 0.2,
      rot,
      len * 0.72,
      wid * 0.36,
    );
    ctx.fill();

    if (!isBud) {
      ctx.strokeStyle = rgba("#2d2419", 0.32);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(rot) * len * 0.4, y - Math.sin(rot) * len * 0.4);
      ctx.lineTo(x + Math.cos(rot) * len * 0.4, y + Math.sin(rot) * len * 0.4);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * 贴在茶柜/茶箱上的纸质大标签（原点为标签中心）
 * slapP: 0..1 从掀起贴合到平整落定
 */
export function drawTeaLabel(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  text: string,
  w: number,
  h: number,
  o: {
    slapP?: number;
    accent?: string;
    fontSize?: number;
    seed?: number;
  } = {},
) {
  const p = Math.max(0, Math.min(1, o.slapP ?? 1));
  if (p <= 0) return;
  const lift = 1 - p;
  const accent = o.accent ?? pal.cinnabar;
  const seed = o.seed ?? 11;

  ctx.save();
  // 贴上去时从右端卷起压平的微透视
  ctx.translate(0, -lift * 28);
  ctx.rotate(lift * -0.06);
  ctx.scale(1 + lift * 0.08, 1 + lift * 0.08);

  const r = 8;
  const boxPath = () => {
    ctx.roundRect(-w / 2, -h / 2, w, h, r);
  };

  softShadow(ctx, boxPath, {
    blur: 10 + 26 * lift,
    dx: 6 + 18 * lift,
    dy: 8 + 24 * lift,
    alpha: 0.28 - 0.1 * lift,
  });

  // 宣纸签底色
  const bg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  bg.addColorStop(0, mixHex(pal.rice, "#ffffff", 0.55));
  bg.addColorStop(1, mixHex(pal.paper, pal.oat, 0.35));
  ctx.fillStyle = bg;
  ctx.beginPath();
  boxPath();
  ctx.fill();

  // 内框细线（传统洒金笺/古籍签条风格）
  const pad = 10;
  ctx.strokeStyle = rgba(accent, 0.65);
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.roundRect(-w / 2 + pad, -h / 2 + pad, w - pad * 2, h - pad * 2, 4);
  ctx.stroke();

  // 左侧一道醒目色带（区分年份/品类）
  ctx.fillStyle = rgba(accent, 0.85);
  ctx.fillRect(-w / 2 + pad + 6, -h / 2 + pad + 6, 10, h - (pad + 6) * 2);

  // 标签大字
  const fs = o.fontSize ?? Math.min(h * 0.52, (w - 60) / Math.max(1, Array.from(text).length * 0.92));
  fillText(ctx, text, 8, 2, fs, {
    color: pal.ink,
    weight: 900,
    font: SONG,
  });

  void seed;
  ctx.restore();
}

/**
 * 实木茶柜（正视分层，原点为柜子中心）
 */
export function drawCabinetFrame(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  x: number,
  y: number,
  w: number,
  h: number,
  tiers: number,
) {
  const frameW = 26;
  const shelfH = 22;
  const woodBase = mixHex(pal.tea, "#4a2c18", 0.35);
  const woodLight = mixHex(pal.tea, "#d6ae7c", 0.35);
  const woodDark = mixHex(pal.tea, "#1c1008", 0.55);

  ctx.save();
  // 柜体大投影
  softShadow(
    ctx,
    () => {
      ctx.roundRect(x - w / 2, y - h / 2, w, h, 10);
    },
    { blur: 36, dx: 18, dy: 26, alpha: 0.32 },
  );

  // 柜背板（深暖木纹色）
  const backG = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
  backG.addColorStop(0, mixHex(pal.paper, pal.tea, 0.22));
  backG.addColorStop(1, mixHex(pal.paper, pal.tea, 0.36));
  ctx.fillStyle = backG;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 10);
  ctx.fill();

  // 每层内部顶面暗影
  const innerH = h - frameW * 2;
  const tierH = innerH / tiers;
  for (let i = 0; i < tiers; i++) {
    const ty = y - h / 2 + frameW + i * tierH;
    const sg = ctx.createLinearGradient(0, ty, 0, ty + 48);
    sg.addColorStop(0, rgba("#1a0e06", 0.22));
    sg.addColorStop(1, rgba("#1a0e06", 0));
    ctx.fillStyle = sg;
    ctx.fillRect(x - w / 2 + frameW, ty, w - frameW * 2, 48);
  }

  // 层板
  for (let i = 1; i < tiers; i++) {
    const sy = y - h / 2 + frameW + i * tierH - shelfH / 2;
    const pg = ctx.createLinearGradient(0, sy, 0, sy + shelfH);
    pg.addColorStop(0, woodLight);
    pg.addColorStop(0.35, woodBase);
    pg.addColorStop(1, woodDark);
    ctx.fillStyle = pg;
    ctx.fillRect(x - w / 2 + frameW - 4, sy, w - frameW * 2 + 8, shelfH);
    // 木纹线
    ctx.strokeStyle = rgba("#1a0e06", 0.22);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + frameW + 10, sy + shelfH * 0.5);
    ctx.bezierCurveTo(
      x - w * 0.15,
      sy + shelfH * 0.3 + noise1(i, 3) * 4,
      x + w * 0.15,
      sy + shelfH * 0.7 - noise1(i, 7) * 4,
      x + w / 2 - frameW - 10,
      sy + shelfH * 0.5,
    );
    ctx.stroke();
    // 层板受光亮线
    ctx.fillStyle = rgba("#fff3dc", 0.32);
    ctx.fillRect(x - w / 2 + frameW, sy, w - frameW * 2, 2.5);
  }

  // 外框四边
  ctx.lineWidth = frameW;
  ctx.strokeStyle = woodBase;
  ctx.lineJoin = "round";
  ctx.strokeRect(x - w / 2 + frameW / 2, y - h / 2 + frameW / 2, w - frameW, h - frameW);

  // 外框内侧高光边
  ctx.strokeStyle = rgba(woodLight, 0.55);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x - w / 2 + frameW, y - h / 2 + frameW, w - frameW * 2, h - frameW * 2);

  // 柜脚（左右短木足）
  for (const lx of [x - w / 2 + 46, x + w / 2 - 78]) {
    ctx.fillStyle = woodDark;
    ctx.fillRect(lx, y + h / 2 - 2, 32, 34);
  }

  ctx.restore();
}

export function tierCenterY(cabY: number, cabH: number, tiers: number, index: number) {
  const frameW = 26;
  const innerH = cabH - frameW * 2;
  const tierH = innerH / tiers;
  return cabY - cabH / 2 + frameW + (index + 0.5) * tierH;
}

export function tierFloorY(cabY: number, cabH: number, tiers: number, index: number) {
  const frameW = 26;
  const shelfH = 22;
  const innerH = cabH - frameW * 2;
  const tierH = innerH / tiers;
  return cabY - cabH / 2 + frameW + (index + 1) * tierH - (index < tiers - 1 ? shelfH / 2 : 0);
}
