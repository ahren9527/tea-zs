/**
 * 第 22 期共用物件（全部按小正色板 + 宣纸窗光统一质感，确定性纯函数渲染）：
 * 1. 素雪 · 白牡丹-白茶（300g）棉纸茶饼（1:1 还原实物包装：白棉纸、淡灰古塔/远山/牡丹纹、
 *    顶「正上茶舍」绿金标、中烫翠绿「素雪」与雪花、左「一叶倾心」、底墨绿燕尾弧带）
 * 2. 加厚食品级 PE 袋（平口袋 / 拉链自封袋 + 老化漏气）
 * 3. 鹅颈封口动画袋（挤气八九成 → 拧麻花 → 折鹅颈 → 两道扎带死死勒紧）
 * 4. 纯铝箔袋 vs 镀铝袋（强光照射透亮对比 + 硬挺折痕不回弹 + 拉开外袋验茶）
 * 5. 五层加厚瓦楞纸箱（五层波浪瓦楞截面 + 箱盖合拢 + 「工」字形胶带封箱）
 * 6. 铁罐 / 紫砂陶罐外壳（半剖透视：内套前两层袋子的素雪茶饼）
 */
import {
  TAU,
  cachedSurface,
  clamp01,
  hash01,
  mixHex,
  rgba,
  rng,
  type FxPalette,
} from "@/remotion/shared/fx";
import { CAKE_R, CAKE_SIL, paintCakeTexture } from "./cake";
import { KAI, SONG, fillText, softShadow, tracePoly } from "./draw-kit";

const HEI = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

// ============================================================================
// 1. 正上茶舍「素雪 · 白牡丹-白茶」300g 实物还原茶饼
// ============================================================================

function drawZhengEmblem(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = "#1f5a3e";
  c.lineWidth = 4.2;
  c.lineCap = "round";
  c.lineJoin = "round";
  // 茶杯/壶廓「正」字意象
  c.beginPath();
  c.moveTo(-26, -18);
  c.lineTo(18, -18);
  c.moveTo(-22, -18);
  c.quadraticCurveTo(-24, 18, 0, 20);
  c.quadraticCurveTo(22, 18, 22, -8);
  c.stroke();
  // 「正」内部横竖笔
  c.beginPath();
  c.moveTo(-12, -18);
  c.lineTo(-12, 10);
  c.moveTo(-12, -4);
  c.lineTo(10, -4);
  c.moveTo(0, -18);
  c.lineTo(0, 12);
  c.moveTo(-16, 12);
  c.lineTo(14, 12);
  c.stroke();
  // 右上暖金茶烟一缕
  c.strokeStyle = "#b5853a";
  c.lineWidth = 3.2;
  c.beginPath();
  c.moveTo(16, -12);
  c.bezierCurveTo(28, -20, 20, -30, 28, -34);
  c.stroke();
  c.restore();
}

function drawSnowflake(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.save();
  c.translate(x, y);
  c.strokeStyle = "#1f7a4d";
  c.lineWidth = 2.4;
  c.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(ca * r, sa * r);
    // 小分叉
    const mx = ca * r * 0.58;
    const my = sa * r * 0.58;
    c.moveTo(mx, my);
    c.lineTo(mx + Math.cos(a + 0.65) * r * 0.34, my + Math.sin(a + 0.65) * r * 0.34);
    c.moveTo(mx, my);
    c.lineTo(mx + Math.cos(a - 0.65) * r * 0.34, my + Math.sin(a - 0.65) * r * 0.34);
    c.stroke();
  }
  c.restore();
}

function paintSuxueWrapper(c: CanvasRenderingContext2D, pal: FxPalette, seed: number) {
  const R = CAKE_R;
  c.save();
  c.translate(R * 1.15, R * 1.15);

  // 白色手工棉纸基底
  const basePaper = pal.dark ? "#e9e5dc" : "#f8f6f0";
  const bgGrad = c.createRadialGradient(-R * 0.25, -R * 0.32, R * 0.08, 0, 0, R * 1.08);
  bgGrad.addColorStop(0, "#ffffff");
  bgGrad.addColorStop(0.74, basePaper);
  bgGrad.addColorStop(1, mixHex(basePaper, "#c9bfa9", 0.3));
  c.fillStyle = bgGrad;
  c.fillRect(-R * 1.15, -R * 1.15, R * 2.3, R * 2.3);

  // 棉纸自然纤维
  const rr = rng(220 + seed);
  c.strokeStyle = rgba(pal.tea, 0.036);
  c.lineWidth = 0.9;
  for (let i = 0; i < 150; i++) {
    const x = (rr() - 0.5) * R * 2;
    const y = (rr() - 0.5) * R * 2;
    const a = rr() * TAU;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(
      x + Math.cos(a + 0.5) * 12,
      y + Math.sin(a + 0.5) * 12,
      x + Math.cos(a) * 24,
      y + Math.sin(a) * 24,
    );
    c.stroke();
  }

  // 极淡的底层茶叶透影
  c.save();
  c.globalCompositeOperation = "multiply";
  c.globalAlpha = 0.045;
  paintCakeTexture(c, pal, "new");
  c.restore();

  // 手工包饼四周折边纹
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * TAU + (hash01(i, seed) - 0.5) * 0.08;
    const r0 = R * (0.84 + 0.06 * hash01(i, seed + 2));
    const r1 = R * 1.03;
    c.strokeStyle = rgba("#726451", 0.065 + 0.04 * hash01(i, 9));
    c.lineWidth = 2.4 + 2.2 * hash01(i, 3);
    c.beginPath();
    c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    c.lineTo(Math.cos(a + 0.02) * r1, Math.sin(a + 0.02) * r1);
    c.stroke();
  }

  // 外圈细淡金绿波折边饰（还原实拍纸面曲线框）
  c.save();
  c.strokeStyle = rgba("#2f684e", 0.34);
  c.lineWidth = 2.2;
  c.beginPath();
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * TAU;
    const rr2 = R * (0.88 + 0.024 * Math.sin(i * 2.5));
    const px = Math.cos(a) * rr2;
    const py = Math.sin(a) * rr2;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.stroke();
  c.restore();

  // 左上淡灰线描古塔剪影
  c.save();
  c.strokeStyle = rgba("#8c8b85", 0.24);
  c.lineWidth = 1.6;
  const tx = -R * 0.42;
  const ty = -R * 0.26;
  for (let lvl = 0; lvl < 4; lvl++) {
    const w = 52 - lvl * 9;
    const y = ty - lvl * 24;
    c.beginPath();
    c.moveTo(tx - w, y);
    c.quadraticCurveTo(tx, y - 10, tx + w, y);
    c.lineTo(tx + w * 0.72, y - 18);
    c.lineTo(tx - w * 0.72, y - 18);
    c.closePath();
    c.stroke();
  }
  c.beginPath();
  c.moveTo(tx, ty - 96);
  c.lineTo(tx, ty - 118);
  c.stroke();
  c.restore();

  // 右下淡灰牡丹花瓣暗纹
  c.save();
  c.strokeStyle = rgba("#8c8b85", 0.22);
  c.lineWidth = 1.5;
  for (let p = 0; p < 7; p++) {
    const a = -0.3 + p * 0.42;
    c.beginPath();
    c.ellipse(
      R * 0.48 + Math.cos(a) * 34,
      R * 0.22 + Math.sin(a) * 34,
      36,
      19,
      a,
      0,
      TAU * 0.9995,
    );
    c.stroke();
  }
  c.restore();

  // 底部淡灰远山剪影
  c.save();
  c.fillStyle = rgba("#90938c", 0.22);
  c.beginPath();
  c.moveTo(-R * 0.56, R * 0.62);
  c.lineTo(-R * 0.3, R * 0.47);
  c.lineTo(-R * 0.1, R * 0.56);
  c.lineTo(R * 0.08, R * 0.43);
  c.lineTo(R * 0.28, R * 0.54);
  c.lineTo(R * 0.52, R * 0.62);
  c.closePath();
  c.fill();
  c.restore();

  // 顶部「正上茶舍」Logo + 品牌字
  drawZhengEmblem(c, 0, -R * 0.76, 0.92);
  fillText(c, "正上茶舍", 0, -R * 0.57, 27, { color: "#2b4638", weight: 700, font: SONG, spacing: 1.08 });

  // 环绕翠绿飘逸曲线 + 右上绿雪花
  c.save();
  c.strokeStyle = rgba("#2ea365", 0.62);
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(-R * 0.68, R * 0.06);
  c.bezierCurveTo(-R * 0.42, -R * 0.42, R * 0.48, -R * 0.46, R * 0.56, -R * 0.1);
  c.bezierCurveTo(R * 0.62, R * 0.16, -R * 0.12, R * 0.22, -R * 0.46, R * 0.12);
  c.stroke();
  c.restore();
  drawSnowflake(c, R * 0.42, -R * 0.34, 21);

  // 中心烫翠绿大字「素雪」
  const jadeGrad = c.createLinearGradient(-R * 0.45, -R * 0.2, R * 0.45, R * 0.12);
  jadeGrad.addColorStop(0, "#1c7a49");
  jadeGrad.addColorStop(0.35, "#5ce096");
  jadeGrad.addColorStop(0.55, "#15683d");
  jadeGrad.addColorStop(0.82, "#4ed086");
  jadeGrad.addColorStop(1, "#18643c");
  c.save();
  c.shadowColor = rgba("#144c2e", 0.22);
  c.shadowBlur = 4;
  c.shadowOffsetY = 2;
  c.fillStyle = jadeGrad;
  c.font = `700 132px ${SONG}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("素雪", 2, -R * 0.06);
  c.restore();

  // 左侧「一叶倾心」
  fillText(c, "一叶", -R * 0.58, R * 0.22, 26, { color: "#1d6c44", weight: 700, font: KAI });
  fillText(c, "倾心", -R * 0.54, R * 0.32, 26, { color: "#1d6c44", weight: 700, font: KAI });

  // 中下「白牡丹-白茶」与净含量
  fillText(c, "白牡丹-白茶", 0, R * 0.32, 34, { color: "#2b2a26", weight: 700, font: SONG, spacing: 1.05 });
  fillText(c, "净含量:300克", 0, R * 0.62, 21, { color: "#3d3b36", weight: 600, font: HEI });

  // 底部墨绿弧形丝带（两端翠绿燕尾）
  c.save();
  c.strokeStyle = "#3ba953";
  c.lineWidth = 34;
  c.lineCap = "butt";
  c.beginPath();
  c.arc(0, -R * 0.02, R * 0.78, Math.PI * 0.24, Math.PI * 0.76);
  c.stroke();

  c.strokeStyle = "#164d36";
  c.lineWidth = 30;
  c.beginPath();
  c.arc(0, -R * 0.02, R * 0.78, Math.PI * 0.28, Math.PI * 0.72);
  c.stroke();

  c.strokeStyle = rgba("#e4cf9b", 0.72);
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, -R * 0.02, R * 0.78 - 14, Math.PI * 0.28, Math.PI * 0.72);
  c.stroke();
  c.beginPath();
  c.arc(0, -R * 0.02, R * 0.78 + 14, Math.PI * 0.28, Math.PI * 0.72);
  c.stroke();

  fillText(c, "SUXUE · WHITE TEA", 0, R * 0.76, 17, { color: "#f4efe4", weight: 700, font: HEI });
  c.restore();

  // 左上窗光微明暗体积感
  const vol = c.createRadialGradient(-R * 0.35, -R * 0.38, R * 0.05, 0, 0, R * 1.02);
  vol.addColorStop(0, rgba("#ffffff", 0.16));
  vol.addColorStop(0.62, rgba("#ffffff", 0));
  vol.addColorStop(1, rgba("#3a2a1c", 0.18));
  c.fillStyle = vol;
  c.fillRect(-R * 1.15, -R * 1.15, R * 2.3, R * 2.3);

  c.restore();
}

function suxueSurface(pal: FxPalette, seed: number) {
  const size = Math.round(CAKE_R * 2.3);
  return cachedSurface(`ep22-suxue:${pal.paper}:${seed}`, size, size, (c) => {
    paintSuxueWrapper(c, pal, seed);
  });
}

export type SuxueCakeOpts = {
  lift?: number;
  seed?: number;
  bare?: boolean;
};

/** 绘制「素雪 · 白牡丹」茶饼（原点为中心，半径 radius） */
export function drawSuxueCake(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  radius: number,
  opts: SuxueCakeOpts = {},
) {
  const { lift = 0, seed = 22, bare = false } = opts;
  const sc = radius / CAKE_R;
  ctx.save();
  ctx.scale(sc, sc);

  softShadow(ctx, () => tracePoly(ctx, CAKE_SIL), {
    blur: 22 + 24 * lift,
    dx: 10 + 18 * lift,
    dy: 14 + 26 * lift,
    alpha: Math.max(0.08, 0.26 - 0.12 * lift),
  });

  ctx.save();
  ctx.beginPath();
  tracePoly(ctx, CAKE_SIL);
  ctx.clip();
  if (bare) {
    paintCakeTexture(ctx, pal, "new");
  } else {
    const surf = suxueSurface(pal, seed);
    ctx.drawImage(
      surf.canvas as CanvasImageSource,
      -CAKE_R * 1.15,
      -CAKE_R * 1.15,
      CAKE_R * 2.3,
      CAKE_R * 2.3,
    );
  }
  ctx.restore();

  // 外缘细描边（纸边压感）
  ctx.strokeStyle = rgba(pal.tea, bare ? 0.35 : 0.24);
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  tracePoly(ctx, CAKE_SIL);
  ctx.stroke();

  ctx.restore();
}

/** 侧视茶饼（平放装纸箱 / 摞叠防压用） */
export function drawCakeSide(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: { crush?: number; wrapped?: boolean } = {},
) {
  const { crush = 0, wrapped = true } = opts;
  const hh = h * (1 - crush * 0.36);
  const ww = w * (1 + crush * 0.08);
  ctx.save();
  softShadow(ctx, () => ctx.roundRect(-ww / 2, -hh / 2, ww, hh, hh * 0.42), {
    blur: 14,
    dx: 4,
    dy: 8,
    alpha: 0.2,
  });
  const g = ctx.createLinearGradient(-ww / 2, -hh / 2, ww / 2, hh / 2);
  if (wrapped) {
    g.addColorStop(0, "#fdfbf6");
    g.addColorStop(0.55, "#eee9dc");
    g.addColorStop(1, "#d5cbb8");
  } else {
    g.addColorStop(0, "#8f986e");
    g.addColorStop(0.5, "#6b734e");
    g.addColorStop(1, "#4e5236");
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(-ww / 2, -hh / 2, ww, hh, hh * 0.42);
  ctx.fill();
  ctx.strokeStyle = rgba(pal.tea, 0.32);
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // 素雪绿带侧标（呼应实物底部墨绿丝带）
  if (wrapped) {
    ctx.fillStyle = "#1b593f";
    ctx.fillRect(-ww * 0.22, -hh * 0.16, ww * 0.44, hh * 0.32);
    ctx.fillStyle = "#52c47e";
    ctx.fillRect(-ww * 0.26, -hh * 0.12, ww * 0.04, hh * 0.24);
    ctx.fillRect(ww * 0.22, -hh * 0.12, ww * 0.04, hh * 0.24);
  }
  // 压碎裂痕
  if (crush > 0.2) {
    ctx.strokeStyle = rgba(pal.cinnabar, clamp01((crush - 0.2) * 1.4));
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-ww * 0.16, -hh * 0.42);
    ctx.lineTo(-ww * 0.08, 0);
    ctx.lineTo(-ww * 0.14, hh * 0.44);
    ctx.moveTo(ww * 0.18, -hh * 0.4);
    ctx.lineTo(ww * 0.11, hh * 0.06);
    ctx.lineTo(ww * 0.22, hh * 0.42);
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================================
// 2. 加厚食品级 PE 袋（平口袋 / 拉链自封袋）
// ============================================================================

export type PeBagOpts = {
  mode?: "flat" | "ziplock";
  /** 拉链老化漏气 0..1 */
  leak?: number;
  /** 强调加厚壁 0..1 */
  thickEdge?: number;
  /** 袋内内容回调（会自然透在半透明 PE 膜后面） */
  inside?: () => void;
  /** 帧号（用于漏气微动） */
  frame?: number;
};

export function drawPeBag(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: PeBagOpts = {},
) {
  const { mode = "flat", leak = 0, thickEdge = 0.5, inside, frame = 0 } = opts;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const r = 16;

  ctx.save();
  softShadow(ctx, () => ctx.roundRect(x0, y0, w, h, r), {
    blur: 20,
    dx: 8,
    dy: 14,
    alpha: 0.14,
  });

  // 底层半透明 PE 袋背膜
  ctx.fillStyle = rgba("#ffffff", pal.dark ? 0.14 : 0.34);
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, r);
  ctx.fill();

  // 袋内茶饼 / 茶叶
  if (inside) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x0 + 8, y0 + 8, w - 16, h - 16, r - 4);
    ctx.clip();
    inside();
    ctx.restore();
  }

  // 前层半透明 PE 光泽膜 + 斜向高光带
  const sheen = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
  sheen.addColorStop(0, rgba("#ffffff", 0.42));
  sheen.addColorStop(0.28, rgba("#f4f9f6", 0.12));
  sheen.addColorStop(0.54, rgba("#ffffff", 0.3));
  sheen.addColorStop(0.76, rgba("#e6efe9", 0.08));
  sheen.addColorStop(1, rgba("#ffffff", 0.22));
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, r);
  ctx.fill();

  // 斜向高光条
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, r);
  ctx.clip();
  ctx.fillStyle = rgba("#ffffff", 0.24);
  ctx.beginPath();
  ctx.moveTo(x0 + w * 0.12, y0);
  ctx.lineTo(x0 + w * 0.26, y0);
  ctx.lineTo(x0 + w * 0.04, y0 + h);
  ctx.lineTo(x0 - w * 0.08, y0 + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 热封加厚侧边（12丝以上厚重双线质感）
  const edgeW = 10 + thickEdge * 8;
  ctx.fillStyle = rgba("#dbe5dd", 0.45);
  ctx.fillRect(x0 + 2, y0 + r, edgeW, h - r * 2);
  ctx.fillRect(x0 + w - edgeW - 2, y0 + r, edgeW, h - r * 2);
  ctx.fillRect(x0 + r, y0 + h - edgeW - 2, w - r * 2, edgeW);

  ctx.strokeStyle = rgba(pal.bamboo, 0.55 + thickEdge * 0.25);
  ctx.lineWidth = 2.6 + thickEdge * 2;
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, r);
  ctx.stroke();

  // 内侧压合细线
  ctx.strokeStyle = rgba(pal.bamboo, 0.28);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x0 + edgeW, y0 + 18);
  ctx.lineTo(x0 + edgeW, y0 + h - edgeW);
  ctx.lineTo(x0 + w - edgeW, y0 + h - edgeW);
  ctx.lineTo(x0 + w - edgeW, y0 + 18);
  ctx.stroke();

  if (mode === "ziplock") {
    // 拉链自封条（老化时中间裂开缝隙并冒出慢漏气丝）
    const zy = y0 + 54;
    const gap = leak * 12;
    ctx.strokeStyle = leak > 0.1 ? pal.cinnabar : mixHex(pal.tea, "#7b8c98", 0.5);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x0 + 14, zy - gap * 0.4);
    ctx.quadraticCurveTo(0, zy - gap * 1.4, x0 + w - 14, zy - gap * 0.4);
    ctx.stroke();

    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x0 + 14, zy + 9 + gap * 0.4);
    ctx.quadraticCurveTo(0, zy + 9 + gap * 1.2, x0 + w - 14, zy + 9 + gap * 0.4);
    ctx.stroke();

    // 慢漏气波纹向上逸出
    if (leak > 0.05) {
      ctx.save();
      ctx.strokeStyle = rgba(pal.cinnabar, 0.58 * leak);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      for (let i = -1; i <= 1; i++) {
        const bx = i * (w * 0.18);
        const phase = ((frame * 0.045 + i * 0.37) % 1 + 1) % 1;
        const rise = phase * 90;
        const a = Math.sin(phase * Math.PI) * leak;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.moveTo(bx, zy - 6 - rise);
        ctx.quadraticCurveTo(bx + 14, zy - 26 - rise, bx - 4, zy - 48 - rise);
        ctx.stroke();
      }
      ctx.restore();
    }
  } else {
    // 平口袋顶口双层微张弧线
    ctx.strokeStyle = rgba(pal.bamboo, 0.42);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x0 + 10, y0 + 8);
    ctx.quadraticCurveTo(0, y0 + 18, x0 + w - 10, y0 + 8);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================================
// 3. 鹅颈封口动画袋（挤气 → 拧麻花 → 折鹅颈 → 两道扎带）
// ============================================================================

export type GooseneckOpts = {
  /** 挤出空气 0..1 */
  squeeze: number;
  /** 袋口拧成麻花 0..1 */
  twist: number;
  /** 对折成鹅颈状 0..1 */
  fold: number;
  /** 第一道扎带 0..1 */
  tie1: number;
  /** 第二道扎带 0..1 */
  tie2: number;
  /** 帧号 */
  frame: number;
};

export function drawGooseneckBag(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  opts: GooseneckOpts,
) {
  const { squeeze, twist, fold, tie1, tie2, frame } = opts;
  // 袋身随挤气略收紧贴合茶饼（保留自然余量，绝不抽成真空死褶）
  const bodyW = 470 - squeeze * 42;
  const bodyH = 440 - squeeze * 22;
  const bodyCy = 120;
  const neckBaseY = bodyCy - bodyH / 2 + 12;

  ctx.save();

  // 1) 袋身主体（含素雪棉纸茶饼）
  const bagPath = () => {
    const hw = bodyW / 2;
    const topPinch = hw * (1 - twist * 0.78);
    ctx.moveTo(-topPinch, neckBaseY);
    ctx.bezierCurveTo(-hw * 0.92, neckBaseY + 56, -hw, bodyCy - 40, -hw, bodyCy + bodyH * 0.34);
    ctx.quadraticCurveTo(-hw, bodyCy + bodyH / 2, -hw + 26, bodyCy + bodyH / 2);
    ctx.lineTo(hw - 26, bodyCy + bodyH / 2);
    ctx.quadraticCurveTo(hw, bodyCy + bodyH / 2, hw, bodyCy + bodyH * 0.34);
    ctx.bezierCurveTo(hw, bodyCy - 40, hw * 0.92, neckBaseY + 56, topPinch, neckBaseY);
    ctx.closePath();
  };

  softShadow(ctx, bagPath, { blur: 24, dx: 10, dy: 16, alpha: 0.16 });
  ctx.fillStyle = rgba("#ffffff", pal.dark ? 0.14 : 0.32);
  ctx.beginPath();
  bagPath();
  ctx.fill();

  // 袋内的素雪茶饼（带着原装棉纸）
  ctx.save();
  ctx.beginPath();
  bagPath();
  ctx.clip();
  ctx.translate(0, bodyCy + 16);
  drawSuxueCake(ctx, pal, 178, { seed: 22 });
  ctx.restore();

  // 前层 PE 高光罩
  const sheen = ctx.createLinearGradient(-bodyW / 2, neckBaseY, bodyW / 2, bodyCy + bodyH / 2);
  sheen.addColorStop(0, rgba("#ffffff", 0.38));
  sheen.addColorStop(0.45, rgba("#eef5f0", 0.08));
  sheen.addColorStop(0.7, rgba("#ffffff", 0.25));
  sheen.addColorStop(1, rgba("#ffffff", 0.12));
  ctx.fillStyle = sheen;
  ctx.beginPath();
  bagPath();
  ctx.fill();

  ctx.strokeStyle = rgba(pal.bamboo, 0.72);
  ctx.lineWidth = 3.8;
  ctx.beginPath();
  bagPath();
  ctx.stroke();

  // 挤气时的柔和空气逸出线（挤出八九成）
  if (squeeze > 0.05 && twist < 0.7) {
    const airAlpha = Math.sin(clamp01(squeeze) * Math.PI) * (1 - twist);
    ctx.save();
    ctx.strokeStyle = rgba(pal.bamboo, 0.65 * airAlpha);
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (let i = -1; i <= 1; i++) {
      const ph = ((frame * 0.06 + (i + 1) * 0.28) % 1 + 1) % 1;
      const sx = i * 68;
      const sy = neckBaseY - 24 - ph * 110;
      ctx.globalAlpha = Math.sin(ph * Math.PI) * airAlpha;
      ctx.beginPath();
      ctx.moveTo(sx, sy + 42);
      ctx.quadraticCurveTo(sx + i * 18, sy + 18, sx + i * 10, sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2) 袋口颈部：未拧时是宽口 → 拧成麻花 → 对折成鹅颈 U 形
  const neckW = (bodyW * 0.92) * (1 - twist * 0.84) + 36 * twist;
  const neckH = 210;

  if (fold < 0.02) {
    // 向上展开 / 拧成麻花
    ctx.save();
    const topW = neckW * (1 + (1 - twist) * 0.06);
    const gNeck = ctx.createLinearGradient(-neckW, neckBaseY, neckW, neckBaseY - neckH);
    gNeck.addColorStop(0, rgba("#ffffff", 0.44));
    gNeck.addColorStop(0.5, rgba("#dfebe3", 0.56));
    gNeck.addColorStop(1, rgba("#ffffff", 0.34));
    ctx.fillStyle = gNeck;
    ctx.beginPath();
    ctx.moveTo(-neckW / 2, neckBaseY + 4);
    ctx.bezierCurveTo(-neckW * 0.4, neckBaseY - neckH * 0.45, -topW * 0.52, neckBaseY - neckH * 0.78, -topW * 0.55, neckBaseY - neckH);
    ctx.lineTo(topW * 0.55, neckBaseY - neckH);
    ctx.bezierCurveTo(topW * 0.52, neckBaseY - neckH * 0.78, neckW * 0.4, neckBaseY - neckH * 0.45, neckW / 2, neckBaseY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(pal.bamboo, 0.72);
    ctx.lineWidth = 3.2;
    ctx.stroke();

    // 麻花螺旋纹
    if (twist > 0.08) {
      ctx.strokeStyle = rgba(pal.bamboo, 0.7 * twist);
      ctx.lineWidth = 3.2;
      for (let k = 0; k < 5; k++) {
        const yy = neckBaseY - 26 - k * 34;
        const hw = Math.max(16, neckW * 0.48);
        ctx.beginPath();
        ctx.moveTo(-hw, yy + 10);
        ctx.quadraticCurveTo(0, yy - 6, hw, yy - 12);
        ctx.stroke();
      }
    }
    ctx.restore();
  } else {
    // 对折成鹅颈 U 形（左半向上、顶弯成鹅颈弧、右半向下贴合！）
    const bendH = 128;
    const archR = 46 * fold;
    const rightDrop = fold * 135;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 下段拧紧的鹅颈管
    const drawGoosePath = () => {
      ctx.moveTo(-18 * fold, neckBaseY + 4);
      ctx.lineTo(-18 * fold, neckBaseY - bendH);
      ctx.bezierCurveTo(
        -18 * fold,
        neckBaseY - bendH - archR * 1.45,
        archR * 1.5,
        neckBaseY - bendH - archR * 1.45,
        archR * 1.15,
        neckBaseY - bendH + 14,
      );
      ctx.lineTo(archR * 0.85, neckBaseY - bendH + rightDrop);
    };

    // 厚管底层阴影与实体
    ctx.strokeStyle = rgba(pal.bamboo, 0.76);
    ctx.lineWidth = 42;
    ctx.beginPath();
    drawGoosePath();
    ctx.stroke();

    ctx.strokeStyle = rgba("#eef5f0", 0.9);
    ctx.lineWidth = 34;
    ctx.beginPath();
    drawGoosePath();
    ctx.stroke();

    // 鹅颈上的麻花斜纹
    ctx.strokeStyle = rgba(pal.bamboo, 0.5);
    ctx.lineWidth = 2.8;
    for (let k = 0; k < 4; k++) {
      const yy = neckBaseY - 20 - k * 28;
      ctx.beginPath();
      ctx.moveTo(-34 * fold, yy + 6);
      ctx.lineTo(-2 * fold, yy - 8);
      ctx.stroke();
    }
    for (let k = 0; k < 3; k++) {
      const yy = neckBaseY - bendH + 34 + k * 28;
      ctx.beginPath();
      ctx.moveTo(archR * 0.65, yy - 6);
      ctx.lineTo(archR * 1.25, yy + 6);
      ctx.stroke();
    }

    // 鹅颈尾部散开的小伞口
    const tx = archR * 0.85;
    const ty = neckBaseY - bendH + rightDrop;
    ctx.fillStyle = rgba("#eef5f0", 0.82);
    ctx.strokeStyle = rgba(pal.bamboo, 0.72);
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(tx - 16, ty - 6);
    ctx.lineTo(tx - 34, ty + 32);
    ctx.lineTo(tx + 34, ty + 28);
    ctx.lineTo(tx + 16, ty - 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 两道扎带（死死勒住鹅颈双管！）
    const drawTie = (yy: number, p: number) => {
      if (p <= 0.01) return;
      const cinch = 1 - 0.14 * p;
      const lx = -48 * cinch;
      const rx = archR * 1.48 * cinch;
      ctx.save();
      ctx.globalAlpha = clamp01(p * 1.5);
      // 扎带主体（深朱砂/茶褐醒目锁扣）
      ctx.fillStyle = pal.cinnabar;
      ctx.beginPath();
      ctx.roundRect(lx, yy - 8, rx - lx, 16, 7);
      ctx.fill();
      // 锁扣方块
      ctx.fillStyle = mixHex(pal.cinnabar, "#2b120e", 0.35);
      ctx.beginPath();
      ctx.roundRect(rx - 18, yy - 11, 22, 22, 4);
      ctx.fill();
      // 向右探出的扎带尾条
      ctx.strokeStyle = pal.cinnabar;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(rx + 2, yy);
      ctx.lineTo(rx + 42 * p, yy - 4);
      ctx.stroke();
      ctx.restore();
    };

    drawTie(neckBaseY - 46, tie1);
    drawTie(neckBaseY - 82, tie2);

    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 4. 纯铝箔袋 vs 镀铝袋（支持强光照射透亮对比 + 硬折痕 + 拉开外袋）
// ============================================================================

export type FoilBagOpts = {
  /** true = 真纯铝箔袋（不透光、硬挺）；false = 镀铝袋（强光一照透亮） */
  pure?: boolean;
  /** 背后强光强度 0..1 */
  backlight?: number;
  /** 右上角折痕程度 0..1（真纯铝折痕硬挺不回弹） */
  foldCrease?: number;
  /** 拉开顶部袋口看清内部 0..1 */
  openFlap?: number;
  /** 内部回调（openFlap > 0 时显露） */
  inside?: () => void;
};

export function drawFoilBag(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: FoilBagOpts = {},
) {
  const { pure = true, backlight = 0, foldCrease = 0, openFlap = 0, inside } = opts;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const r = 10;

  ctx.save();

  // 强光光晕（在袋子背后）
  if (backlight > 0.02) {
    const bgGlow = ctx.createRadialGradient(0, -10, 12, 0, -10, w * 0.78);
    bgGlow.addColorStop(0, rgba("#fff5cc", 0.9 * backlight));
    bgGlow.addColorStop(0.45, rgba("#ffdc85", 0.42 * backlight));
    bgGlow.addColorStop(1, rgba("#ffdc85", 0));
    ctx.fillStyle = bgGlow;
    ctx.beginPath();
    ctx.arc(0, -10, w * 0.78, 0, TAU * 0.9995);
    ctx.fill();
  }

  softShadow(ctx, () => ctx.roundRect(x0, y0, w, h, r), {
    blur: 24,
    dx: 12,
    dy: 18,
    alpha: 0.24,
  });

  // 如果顶部拉开，先画内腔 + 内部物体（例如透明 PE 袋裹着的素雪茶饼）
  const cutY = y0 + openFlap * h * 0.56;
  if (openFlap > 0.02) {
    // 后袋片（完整高度）
    const backG = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
    backG.addColorStop(0, "#8f8a81");
    backG.addColorStop(0.5, "#747068");
    backG.addColorStop(1, "#9a958b");
    ctx.fillStyle = backG;
    ctx.beginPath();
    ctx.roundRect(x0, y0, w, h, r);
    ctx.fill();

    // 露出内部的透明袋 + 茶饼
    if (inside) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x0 + 14, y0 + 12, w - 28, h - 24, r);
      ctx.clip();
      inside();
      ctx.restore();
    }
  }

  // 前袋主体路径（带折角或拉开）
  const foldSz = foldCrease * Math.min(w, h) * 0.34;
  const frontPath = () => {
    const topY = openFlap > 0.02 ? cutY : y0;
    ctx.moveTo(x0 + r, topY);
    if (foldSz > 2 && openFlap < 0.02) {
      ctx.lineTo(x0 + w - foldSz, topY);
      ctx.lineTo(x0 + w, topY + foldSz);
    } else {
      ctx.lineTo(x0 + w - r, topY);
      ctx.quadraticCurveTo(x0 + w, topY, x0 + w, topY + r);
    }
    ctx.lineTo(x0 + w, y0 + h - r);
    ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    ctx.lineTo(x0 + r, y0 + h);
    ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    ctx.lineTo(x0, topY + r);
    ctx.quadraticCurveTo(x0, topY, x0 + r, topY);
    ctx.closePath();
  };

  // 材质渐变：纯铝厚重哑光金属；镀铝偏轻薄冷亮
  const fg = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
  if (pure) {
    fg.addColorStop(0, "#d6d1c8");
    fg.addColorStop(0.28, "#b7b1a6");
    fg.addColorStop(0.55, "#ded9d0");
    fg.addColorStop(0.82, "#a39d92");
    fg.addColorStop(1, "#c7c1b6");
  } else {
    fg.addColorStop(0, "#e6e9ec");
    fg.addColorStop(0.42, "#c6ccd2");
    fg.addColorStop(0.65, "#eef1f4");
    fg.addColorStop(1, "#b4bcc4");
  }
  ctx.fillStyle = fg;
  ctx.beginPath();
  frontPath();
  ctx.fill();

  // 镀铝袋被强光穿透的刺眼透亮光斑（真纯铝完全不透！）
  if (!pure && backlight > 0.02) {
    ctx.save();
    ctx.beginPath();
    frontPath();
    ctx.clip();
    const bleed = ctx.createRadialGradient(0, -12, 8, 0, -12, w * 0.44);
    bleed.addColorStop(0, rgba("#ffffff", 0.96 * backlight));
    bleed.addColorStop(0.38, rgba("#ffe49a", 0.82 * backlight));
    bleed.addColorStop(0.76, rgba("#ffb84d", 0.34 * backlight));
    bleed.addColorStop(1, rgba("#ffb84d", 0));
    ctx.fillStyle = bleed;
    ctx.fillRect(x0, y0, w, h);
    ctx.restore();
  }

  // 真纯铝在强光下呈现厚实背影与金属锐边，丝毫不透
  if (pure && backlight > 0.02) {
    ctx.save();
    ctx.beginPath();
    frontPath();
    ctx.clip();
    ctx.fillStyle = rgba("#3d372e", 0.22 * backlight);
    ctx.fillRect(x0, y0, w, h);
    ctx.restore();
  }

  // 压边热封纹路（四边微压条）
  ctx.strokeStyle = rgba(pal.ink, pure ? 0.32 : 0.22);
  ctx.lineWidth = pure ? 3 : 2;
  ctx.beginPath();
  frontPath();
  ctx.stroke();

  if (openFlap < 0.02) {
    // 顶部易撕口小三角缺口
    ctx.fillStyle = pal.paper;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + 36);
    ctx.lineTo(x0 + 11, y0 + 41);
    ctx.lineTo(x0, y0 + 46);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x0 + w, y0 + 36);
    ctx.lineTo(x0 + w - 11, y0 + 41);
    ctx.lineTo(x0 + w, y0 + 46);
    ctx.closePath();
    ctx.fill();
  }

  // 真纯铝右上角硬挺折痕（折下后定形不回弹，带清晰折棱）
  if (foldSz > 2 && openFlap < 0.02) {
    ctx.save();
    // 折下三角的柔和投影
    ctx.fillStyle = rgba("#2a2219", 0.22);
    ctx.beginPath();
    ctx.moveTo(x0 + w - foldSz, y0);
    ctx.lineTo(x0 + w, y0 + foldSz);
    ctx.lineTo(x0 + w - foldSz + 10, y0 + foldSz + 12);
    ctx.closePath();
    ctx.fill();

    // 折翻过来的内面铝箔三角
    const fgFold = ctx.createLinearGradient(x0 + w - foldSz, y0 + foldSz, x0 + w, y0);
    fgFold.addColorStop(0, "#ece9e2");
    fgFold.addColorStop(1, "#a7a095");
    ctx.fillStyle = fgFold;
    ctx.beginPath();
    ctx.moveTo(x0 + w - foldSz, y0);
    ctx.lineTo(x0 + w - foldSz, y0 + foldSz);
    ctx.lineTo(x0 + w, y0 + foldSz);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(pal.ink, 0.42);
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // 清晰锐利折痕高光
    ctx.strokeStyle = rgba("#ffffff", 0.72);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0 + w - foldSz, y0);
    ctx.lineTo(x0 + w, y0 + foldSz);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 5. 五层加厚瓦楞纸箱 + 「工」字形封箱胶带
// ============================================================================

export type BoxOpts = {
  /** 顶盖合拢程度 0..1 */
  close?: number;
  /** 「工」字封箱胶带进度 0..1 */
  hTape?: number;
  /** 内部回调（开箱时可见平放茶饼） */
  inside?: () => void;
};

/** 俯视/高角度五层瓦楞纸箱（原点为中心），清晰呈现平放茶饼与「工」字胶带 */
export function drawCorrugatedBoxTop(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: BoxOpts = {},
) {
  const { close = 0, hTape = 0, inside } = opts;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const wall = 22;

  ctx.save();
  softShadow(ctx, () => ctx.roundRect(x0, y0, w, h, 8), {
    blur: 28,
    dx: 14,
    dy: 20,
    alpha: 0.25,
  });

  // 纸箱内腔底色（深牛皮纸褐）
  ctx.fillStyle = "#8a6744";
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, 8);
  ctx.fill();

  // 箱内平放茶饼
  if (inside && close < 0.99) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 + wall, y0 + wall, w - wall * 2, h - wall * 2);
    ctx.clip();
    inside();
    ctx.restore();
  }

  // 四壁厚纸板边框（体现五层加厚质感）
  ctx.strokeStyle = "#b99264";
  ctx.lineWidth = wall;
  ctx.strokeRect(x0 + wall / 2, y0 + wall / 2, w - wall, h - wall);

  // 五层瓦楞波浪切面暗示（顶边与底边细波纹）
  ctx.strokeStyle = rgba("#5e4024", 0.55);
  ctx.lineWidth = 1.8;
  for (const edgeY of [y0 + wall * 0.35, y0 + wall * 0.65, y0 + h - wall * 0.35, y0 + h - wall * 0.65]) {
    ctx.beginPath();
    for (let px = x0 + wall; px <= x0 + w - wall; px += 12) {
      const py = edgeY + ((Math.round(px / 12) % 2 === 0 ? -2.2 : 2.2));
      if (px === x0 + wall) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // 左右折翼箱盖：close = 0 时向外张开；close = 1 时在正中严丝合缝合拢
  const flapW = (w / 2) * (0.28 + 0.72 * close);
  const paintFlap = (side: -1 | 1) => {
    const fx = side === -1 ? x0 : x0 + w - flapW;
    const g = ctx.createLinearGradient(fx, y0, fx + flapW, y0 + h);
    g.addColorStop(0, side === -1 ? "#d3b286" : "#c7a374");
    g.addColorStop(1, side === -1 ? "#bd9768" : "#b08859");
    ctx.fillStyle = g;
    ctx.fillRect(fx, y0, flapW, h);
    ctx.strokeStyle = rgba("#5e4024", 0.45);
    ctx.lineWidth = 2.6;
    ctx.strokeRect(fx, y0, flapW, h);
  };
  if (close > 0.01) {
    paintFlap(-1);
    paintFlap(1);
    // 正中合缝线
    if (close > 0.92) {
      ctx.strokeStyle = rgba("#472f19", 0.52);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(0, y0 + h);
      ctx.stroke();
    }
  }

  // 「工」字形封箱胶带（三道：1 竖封中缝 → 2 顶横封边 → 3 底横封边）
  if (hTape > 0.01) {
    const tapeColor = rgba("#e4be78", 0.82);
    const tapeEdge = rgba("#9c7233", 0.55);
    const tw = 56;
    const pMid = clamp01(hTape * 3);
    const pTop = clamp01((hTape - 0.34) * 3);
    const pBot = clamp01((hTape - 0.67) * 3);

    const drawTapeStrip = (rx: number, ry: number, rw: number, rh: number) => {
      ctx.fillStyle = tapeColor;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = tapeEdge;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(rx, ry, rw, rh);
    };

    if (pMid > 0) drawTapeStrip(-tw / 2, y0 - 8, tw, (h + 16) * pMid);
    if (pTop > 0) drawTapeStrip(x0 - 8, y0 - 6, (w + 16) * pTop, tw * 0.86);
    if (pBot > 0) drawTapeStrip(x0 - 8, y0 + h - tw * 0.86 + 6, (w + 16) * pBot, tw * 0.86);
  }

  // 箱体外框描边
  ctx.strokeStyle = rgba(pal.ink, 0.38);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, 8);
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// 6. 铁罐 / 紫砂陶罐外壳（半透剖视：内套前两层袋子的素雪茶饼）
// ============================================================================

export function drawOuterCanister(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: { cutaway?: number; style?: "iron" | "clay" } = {},
) {
  const { cutaway = 0, style = "clay" } = opts;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const lidH = h * 0.22;

  ctx.save();
  softShadow(ctx, () => ctx.roundRect(x0, y0 + 18, w, h - 18, 34), {
    blur: 28,
    dx: 12,
    dy: 20,
    alpha: 0.26,
  });

  // 罐身主体
  const bodyG = ctx.createLinearGradient(x0, 0, x0 + w, 0);
  if (style === "clay") {
    bodyG.addColorStop(0, "#754c36");
    bodyG.addColorStop(0.28, "#9c6b4e");
    bodyG.addColorStop(0.62, "#6c432e");
    bodyG.addColorStop(1, "#4e2f1f");
  } else {
    bodyG.addColorStop(0, "#4c5652");
    bodyG.addColorStop(0.3, "#78857f");
    bodyG.addColorStop(0.65, "#3f4945");
    bodyG.addColorStop(1, "#2d3532");
  }
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.roundRect(x0, y0 + lidH * 0.65, w, h - lidH * 0.65, 36);
  ctx.fill();

  // 罐盖
  const lidG = ctx.createLinearGradient(x0 - 8, 0, x0 + w + 8, 0);
  if (style === "clay") {
    lidG.addColorStop(0, "#83553d");
    lidG.addColorStop(0.32, "#ad795a");
    lidG.addColorStop(0.7, "#6c432e");
    lidG.addColorStop(1, "#4f3020");
  } else {
    lidG.addColorStop(0, "#5a6661");
    lidG.addColorStop(0.32, "#87948e");
    lidG.addColorStop(0.7, "#45504c");
    lidG.addColorStop(1, "#2f3835");
  }
  ctx.fillStyle = lidG;
  ctx.beginPath();
  ctx.roundRect(x0 - 10, y0 + 16, w + 20, lidH, 24);
  ctx.fill();

  // 顶钮
  ctx.fillStyle = style === "clay" ? "#8c5c42" : "#67736e";
  ctx.beginPath();
  ctx.ellipse(0, y0 + 16, 48, 22, 0, Math.PI, TAU);
  ctx.fill();

  // 罐盖腰线高光
  ctx.strokeStyle = rgba("#fff4e0", 0.25);
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x0 + 14, y0 + lidH + 14);
  ctx.lineTo(x0 + w - 14, y0 + lidH + 14);
  ctx.stroke();

  // 半透剖视窗：清晰展示里面仍套好前两层袋子（外铝 + 内透明PE + 素雪饼）
  if (cutaway > 0.02) {
    const cw = w * 0.74;
    const ch = (h - lidH) * 0.78;
    const cy = y0 + lidH + (h - lidH) * 0.48;
    ctx.save();
    ctx.globalAlpha *= cutaway;
    ctx.fillStyle = mixHex(pal.paper, "#3a291d", 0.14);
    ctx.beginPath();
    ctx.roundRect(-cw / 2, cy - ch / 2, cw, ch, 24);
    ctx.fill();
    ctx.strokeStyle = rgba("#e4cf9b", 0.65);
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(-cw / 2 + 4, cy - ch / 2 + 4, cw - 8, ch - 8, 20);
    ctx.clip();

    // 外层纯铝箔袋拉开半截，露出内层透明PE袋 + 素雪茶饼
    ctx.translate(0, cy + 8);
    drawFoilBag(ctx, pal, cw * 0.84, ch * 0.84, {
      pure: true,
      openFlap: 0.48,
      inside: () => {
        drawPeBag(ctx, pal, cw * 0.72, ch * 0.72, {
          mode: "flat",
          thickEdge: 0.8,
          inside: () => {
            drawSuxueCake(ctx, pal, cw * 0.3, { seed: 22 });
          },
        });
      },
    });
    ctx.restore();
  }

  ctx.restore();
}
