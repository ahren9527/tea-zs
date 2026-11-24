/**
 * 正上茶舍「蜜韵 · 寿眉-白茶」350g 棉纸茶饼（正面俯视）。
 *
 * 印刷图案不靠目测重画：从实物照片按颜色分层描出轮廓（miyun-data.ts），代码只负责上色与质感——
 * 每种颜色平涂「本色 + 暗面」两档（金色暗面落在右下，对应左上窗光），丝带用拟合出的两段圆弧画，
 * 最后撒一层纸齿、压一道右下暗面，和即梦的平涂淡彩手绘对齐。
 * 包装上的字是印刷品，不跟面板字体走。原点为饼中心。
 */
import { MIYUN_LAYERS, MIYUN_RIBBON, MIYUN_UNIT } from "./miyun-data";
import { WORDMARK_SIZE, drawBrandEmblem, drawBrandWordmark } from "./emblem";
import {
  TAU,
  alpha,
  bezierPts,
  brushLine,
  cached,
  cakeOutline,
  dropShadow,
  paperTooth,
  seq,
  tracePts,
} from "./common";

/** 绘制坐标里的饼半径（实际大小由 drawMiyunCake 的 radius 缩放） */
const R = 330;
const OUTLINE = cakeOutline(R);
const SIZE = Math.round(R * 2.3);
/** 图案坐标的半径：照片里纸边比图案多出约 7%，所以图案按 R / 1.07 缩放，四周留出纸边 */
const D = R / 1.07;

// 平涂色板：本色 + 暗面
const PAPER = "#f8f4eb";
const PAPER_FOLD = "#d9cfbd";
const GOLD = "#d6a64a";
const GOLD_SHADE = "#a9782c";
const RIBBON = "#8e3f26";
const RIBBON_STRIPE = "#6f2d1a";
const RIBBON_LINE = "#e8c98e";
const RIBBON_TEXT = "#fbf4e8";
const MOUNT = "#a9d4bd";
const MAROON = "#6e2a1e";
const INK = "#2b2723";
/** 暗面偏移（绘制坐标像素）：光从左上来，暗面落在右下 */
const SD = 1.4;

// ---- 轮廓解码（Google polyline：差分 + zigzag，每 5 bit 一个字符）----
function decode(s: string): number[] {
  const vals: number[] = [];
  let i = 0;
  while (i < s.length) {
    let res = 0;
    let sh = 0;
    let b: number;
    do {
      b = s.charCodeAt(i++) - 63;
      res |= (b & 0x1f) << sh;
      sh += 5;
    } while (b >= 0x20);
    vals.push(res & 1 ? ~(res >> 1) : res >> 1);
  }
  const out: number[] = [];
  let x = 0;
  let y = 0;
  for (let j = 0; j < vals.length; j += 2) {
    x += vals[j];
    y += vals[j + 1];
    out.push((x / MIYUN_UNIT) * D, (y / MIYUN_UNIT) * D);
  }
  return out;
}

type Layer = keyof typeof MIYUN_LAYERS;
const decoded = new Map<Layer, number[][]>();
/** 照片坐标（饼半径 = 2000）→ 绘制坐标 */
const U = (v: number) => (v / MIYUN_UNIT) * D;
/** 顶部 logo 区：照片描出的绿色层和这里的金色茶烟不用，改用官方 logo 原图描出的矢量（emblem.ts） */
function inLogoArea(r: number[]) {
  let maxY = -Infinity;
  let minX = Infinity;
  for (let i = 0; i < r.length; i += 2) {
    maxY = Math.max(maxY, r[i + 1]);
    minX = Math.min(minX, r[i]);
  }
  return maxY < U(-1750) && minX > U(-300) && minX < U(400);
}
/** logo 整块区域（壶形标 + 正上茶舍 + 拼音）：照片里 x -370..360、y -1970..-1235 */
function inLogoBlock(r: number[]) {
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < r.length; i += 2) {
    maxY = Math.max(maxY, r[i + 1]);
    minX = Math.min(minX, r[i]);
    maxX = Math.max(maxX, r[i]);
  }
  return maxY < U(-1235) && minX > U(-370) && maxX < U(360);
}
function rings(layer: Layer) {
  let r = decoded.get(layer);
  if (!r) {
    r = MIYUN_LAYERS[layer].map(decode);
    if (layer === "gold") r = r.filter((ring) => !inLogoArea(ring));
    else if (layer !== "green") r = r.filter((ring) => !inLogoBlock(ring));
    decoded.set(layer, r);
  }
  return r;
}

/**
 * 顶部品牌 logo：图形用官方 logo 原图描出的矢量（emblem.ts），位置和大小对齐照片。
 * 包装上「正上茶舍」是同一套字，排得比 logo 原图更紧（照片里字组宽高比约 3.4，原图约 5.4），
 * 所以字组按照片的宽、高分别缩放；壶形标保持原比例，按照片高度缩放。
 */
function brandLogo(c: CanvasRenderingContext2D) {
  // 壶形标：照片里中心 (29, -1761)、高 395（含茶烟）
  drawBrandEmblem(c, U(29), U(-1761), U(395));
  // 字组（汉字 + 拼音）：照片里 x -349..338、y -1503..-1272
  c.save();
  const sy = U(-1272) - U(-1503);
  const sx = U(338) - U(-349);
  c.translate(U(-5.5), U(-1387.5));
  c.scale(sx / (WORDMARK_SIZE.width * (sy / WORDMARK_SIZE.height)), 1);
  drawBrandWordmark(c, 0, 0, (sy / WORDMARK_SIZE.height) * 100);
  c.restore();
}

/** 把一层所有轮廓合成一条路径，evenodd 填色（洞自然留空） */
function fillLayer(c: CanvasRenderingContext2D, layer: Layer, color: string, dx = 0, dy = 0) {
  c.beginPath();
  for (const r of rings(layer)) {
    c.moveTo(r[0] + dx, r[1] + dy);
    for (let i = 2; i < r.length; i += 2) c.lineTo(r[i] + dx, r[i + 1] + dy);
    c.closePath();
  }
  c.fillStyle = color;
  c.fill("evenodd");
}

/** 白棉纸：平涂底色 + 收向中心的包裹褶（手绘细笔） + 纤维 */
function paper(c: CanvasRenderingContext2D) {
  c.fillStyle = PAPER;
  c.fillRect(-R * 1.15, -R * 1.15, R * 2.3, R * 2.3);
  const r = seq(301);
  for (let i = 0; i < 22; i++) {
    const a = r() * TAU;
    const r0 = R * (0.6 + r() * 0.3);
    const pts = bezierPts(
      { x: Math.cos(a) * R * 1.03, y: Math.sin(a) * R * 1.03 },
      { x: Math.cos(a + 0.05) * R * 0.95, y: Math.sin(a + 0.05) * R * 0.95 },
      { x: Math.cos(a + 0.08) * (r0 + R * 0.08), y: Math.sin(a + 0.08) * (r0 + R * 0.08) },
      { x: Math.cos(a + 0.03) * r0, y: Math.sin(a + 0.03) * r0 },
      16,
    );
    brushLine(c, pts, 4 + r() * 4, alpha(PAPER_FOLD, 0.16 + r() * 0.14), { seed: 40 + i, taperIn: 0.2, taperOut: 0.7, wobble: 0.3 });
  }
  for (let i = 0; i < 220; i++) {
    const x = (r() - 0.5) * R * 2;
    const y = (r() - 0.5) * R * 2;
    const a = r() * TAU;
    const l = 5 + r() * 12;
    c.strokeStyle = alpha("#b7ab95", 0.1 + r() * 0.1);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
}

/** 丝带：两段拟合圆弧围成的弧形带 + 两端斜切 + 细竖纹 + 上下奶金细线 */
function ribbon(c: CanvasRenderingContext2D) {
  const { top, bottom, endTopX, endBottomX } = MIYUN_RIBBON;
  const yTop = (x: number) => (top.cy + Math.sqrt(Math.max(0, top.r * top.r - x * x))) * D;
  const yBot = (x: number) => (bottom.cy + Math.sqrt(Math.max(0, bottom.r * bottom.r - x * x))) * D;
  const N = 60;
  const band = () => {
    c.beginPath();
    for (let i = 0; i <= N; i++) {
      const x = -endTopX + (2 * endTopX * i) / N;
      i ? c.lineTo(x * D, yTop(x)) : c.moveTo(x * D, yTop(x));
    }
    for (let i = 0; i <= N; i++) {
      const x = endBottomX - (2 * endBottomX * i) / N;
      c.lineTo(x * D, yBot(x));
    }
    c.closePath();
  };
  c.save();
  band();
  c.fillStyle = RIBBON;
  c.fill();
  band();
  c.clip();
  // 细竖纹
  c.strokeStyle = alpha(RIBBON_STRIPE, 0.55);
  c.lineWidth = D * 0.0045;
  for (let x = -endBottomX; x <= endBottomX; x += 0.013) {
    c.beginPath();
    c.moveTo(x * D, yTop(x) - 4);
    c.lineTo(x * D, yBot(x) + 4);
    c.stroke();
  }
  c.restore();
  // 上下奶金细线（贴着边往里一点）
  for (const [f, inset, s] of [
    [yTop, 0.017, 1],
    [yBot, -0.017, 2],
  ] as const) {
    const pts: { x: number; y: number }[] = [];
    const lim = (f === yTop ? endTopX : endBottomX) - 0.03;
    for (let i = 0; i <= N; i++) {
      const x = -lim + (2 * lim * i) / N;
      pts.push({ x: x * D, y: f(x) + inset * D });
    }
    brushLine(c, pts, D * 0.008, RIBBON_LINE, { seed: 90 + s, taperIn: 0.03, taperOut: 0.03, wobble: 0.15 });
  }
}

function paintWrapper(c: CanvasRenderingContext2D) {
  c.save();
  c.translate(SIZE / 2, SIZE / 2);
  paper(c);

  fillLayer(c, "mint", MOUNT);
  // 烫金：暗面错开一层，再盖本色
  fillLayer(c, "gold", GOLD_SHADE, SD, SD);
  fillLayer(c, "gold", GOLD);
  brandLogo(c);
  fillLayer(c, "maroon", MAROON);
  fillLayer(c, "dark", INK);
  ribbon(c);
  fillLayer(c, "ribbonText", RIBBON_TEXT);

  // 纸齿：印刷落在棉纸上，色块不死平
  paperTooth(c, R * 1.02, PAPER, 401, 120);

  // 右下暗面（三层很淡的月牙叠出一点柔）
  for (let k = 0; k < 3; k++) {
    c.fillStyle = alpha("#7b6548", 0.028);
    c.beginPath();
    c.arc(0, 0, R * 1.12, 0, TAU * 0.9995);
    c.arc(-R * (0.1 + k * 0.025), -R * (0.12 + k * 0.03), R * (0.97 + k * 0.01), 0, TAU * 0.9995, true);
    c.fill("evenodd");
  }
  c.restore();
}

export type CakeDrawOpts = {
  /** 0–1：抬起高度，影子变大变淡 */
  lift?: number;
};

/** 绘制「蜜韵 · 寿眉」茶饼（原点为中心，radius 为像素半径） */
export function drawMiyunCake(ctx: CanvasRenderingContext2D, radius: number, opts: CakeDrawOpts = {}) {
  const { lift = 0 } = opts;
  const sc = radius / R;
  ctx.save();
  ctx.scale(sc, sc);
  dropShadow(ctx, () => tracePts(ctx, OUTLINE), 22 + 24 * lift, 10 + 18 * lift, 14 + 26 * lift, Math.max(0.08, 0.26 - 0.12 * lift));
  ctx.save();
  tracePts(ctx, OUTLINE);
  ctx.clip();
  const surf = cached("product:miyun:traced", SIZE, SIZE, paintWrapper);
  if (surf) ctx.drawImage(surf, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
  ctx.restore();
  // 手绘外缘：纸边毛一点 + 两遍茶褐细笔（起止处留一点断口，像一笔画圆）
  const loop = [...OUTLINE, OUTLINE[0]];
  brushLine(ctx, loop, 5, alpha(PAPER, 0.6), { seed: 501, taperIn: 0, taperOut: 0, wobble: 0.12 });
  brushLine(ctx, loop.slice(4), 3.6, alpha("#7a4e33", 0.26), { seed: 502, taperIn: 0.05, taperOut: 0.08, wobble: 0.1 });
  brushLine(ctx, [...loop.slice(90), ...loop.slice(1, 70)], 2.6, alpha("#7a4e33", 0.14), { seed: 503, taperIn: 0.1, taperOut: 0.15, wobble: 0.2 });
  ctx.restore();
}
