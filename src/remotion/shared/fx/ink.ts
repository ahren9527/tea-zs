/**
 * fx/ink — 水墨晕染显现（ink-bleed reveal）。
 * 一个元素（字、图）不是「淡入」，而是像墨滴在宣纸上洇开：几团不规则的墨晕从种子点长大，
 * 边缘带毛刺，长满后元素完整显现；同时背后留下一层很淡的墨洗（wash）。
 *
 *   canvas：drawInkReveal(ctx, p, bounds, seed, (c) => c.fillText(...))
 *   React ：<InkReveal p={p} bounds={...} seed={1}>…</InkReveal>（fx/react.tsx，同一组多边形做 SVG mask）
 */
import { TAU, clamp01, easeOutCubic, easeOutSine, hash01, noise1, type Pt } from "./math";
import { rgba } from "./palette";
import { scratchSurface } from "./surface";

export type Bounds = { x: number; y: number; w: number; h: number };

export type InkBloomOpts = {
  /** 墨晕个数（默认按面积 2~5 个） */
  blooms?: number;
  /** 边缘毛刺程度 0..1（默认 0.5） */
  rough?: number;
  /** 多边形点数（默认 72） */
  detail?: number;
};

/**
 * 墨晕多边形：p=0 什么都没有，p=1 完全覆盖 bounds（稍有富余）。
 * 返回若干个闭合多边形（舞台坐标）。
 */
export function inkBloomShapes(p: number, b: Bounds, seed = 1, opts: InkBloomOpts = {}): Pt[][] {
  if (p <= 0) return [];
  const area = b.w * b.h;
  const n = opts.blooms ?? Math.max(2, Math.min(5, Math.round(area / 40000) + 1));
  const rough = opts.rough ?? 0.5;
  const detail = opts.detail ?? 72;
  const out: Pt[][] = [];
  for (let i = 0; i < n; i++) {
    // 种子点：沿长边分布，稍有错落
    const along = n === 1 ? 0.5 : (i + 0.15 + hash01(seed, i, 1) * 0.7) / n;
    const wide = b.w >= b.h;
    const cx = b.x + (wide ? along * b.w : b.w * (0.3 + hash01(seed, i, 2) * 0.4));
    const cy = b.y + (wide ? b.h * (0.3 + hash01(seed, i, 3) * 0.4) : along * b.h);
    const delay = hash01(seed, i, 4) * 0.35;
    const local = clamp01((p - delay) / (1 - delay));
    if (local <= 0) continue;
    // 先快后慢地洇开（墨被纸吸住）
    const grow = easeOutCubic(local) * 0.75 + easeOutSine(local) * 0.25;
    // 每团墨晕要盖住自己那一段：沿长边 1/n、横向一半，再留一点富余
    const long = Math.max(b.w, b.h);
    const short = Math.min(b.w, b.h);
    const reach = Math.hypot(long / (2 * n), short / 2) * 1.3;
    const R = grow * reach;
    const pts: Pt[] = [];
    for (let k = 0; k < detail; k++) {
      const a = (k / detail) * TAU;
      const lobes = noise1(Math.cos(a) * 1.6 + 5 + i * 3, seed + i) * 0.22 + noise1(Math.sin(a) * 1.6 + 9, seed + i * 7) * 0.18;
      const fringe = (hash01(seed, i, k) - 0.5) * 0.09 * rough + noise1(k * 0.9, seed + 40 + i) * 0.07 * rough;
      // 边缘毛刺在洇开过程中更明显，干了之后收敛
      const r = R * (1 + lobes + fringe * (1.2 - local * 0.6));
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * (wide ? 0.9 : 1.05) });
    }
    out.push(pts);
  }
  return out;
}

function tracePolys(ctx: CanvasRenderingContext2D, polys: Pt[][], scale = 1, ox = 0, oy = 0) {
  ctx.beginPath();
  for (const poly of polys) {
    let cx = 0;
    let cy = 0;
    for (const q of poly) {
      cx += q.x;
      cy += q.y;
    }
    cx /= poly.length;
    cy /= poly.length;
    poly.forEach((q, i) => {
      const x = cx + (q.x - cx) * scale - ox;
      const y = cy + (q.y - cy) * scale - oy;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
  }
}

export type InkRevealOpts = InkBloomOpts & {
  /** 背后的淡墨洗颜色（不传则不画） */
  wash?: string;
  /** 墨洗最大不透明度（默认 0.07） */
  washAlpha?: number;
  /** 边缘羽化 px（默认 10） */
  feather?: number;
  /** 湿墨阶段内容略微发深、发虚（默认 true） */
  wet?: boolean;
};

/**
 * 用墨晕遮罩画出一个元素。paint 在舞台坐标里画（和平时一样），这里负责遮罩与合成。
 * bounds 是元素的大致范围（舞台坐标）。
 */
export function drawInkReveal(
  ctx: CanvasRenderingContext2D,
  p: number,
  b: Bounds,
  seed: number,
  paint: (c: CanvasRenderingContext2D) => void,
  opts: InkRevealOpts = {},
) {
  if (p <= 0) return;
  const feather = opts.feather ?? 10;
  const pad = feather * 3 + 40;
  if (opts.wash) {
    const polys = inkBloomShapes(Math.min(1, p * 1.15), { x: b.x - 26, y: b.y - 20, w: b.w + 52, h: b.h + 40 }, seed + 99, { ...opts, rough: 0.9 });
    const fade = 1 - clamp01((p - 0.7) / 0.3) * 0.45;
    ctx.save();
    ctx.fillStyle = rgba(opts.wash, (opts.washAlpha ?? 0.07) * fade);
    tracePolys(ctx, polys);
    ctx.fill();
    ctx.fillStyle = rgba(opts.wash, (opts.washAlpha ?? 0.07) * 0.6 * fade);
    tracePolys(ctx, polys, 0.82);
    ctx.fill();
    ctx.restore();
  }
  if (p >= 1) {
    paint(ctx);
    return;
  }
  // 当前变换下 bounds 的设备像素范围：用 getTransform 粗算缩放
  const m = ctx.getTransform();
  const sx = Math.hypot(m.a, m.b) || 1;
  const lw = (b.w + pad * 2) * sx;
  const lh = (b.h + pad * 2) * sx;
  const layer = scratchSurface("ink-layer", lw, lh);
  const mask = scratchSurface("ink-mask", lw, lh);
  const ox = b.x - pad;
  const oy = b.y - pad;
  // 内容
  layer.ctx.setTransform(sx, 0, 0, sx, -ox * sx, -oy * sx);
  paint(layer.ctx);
  // 遮罩（多层叠出羽化边）
  const polys = inkBloomShapes(p, b, seed, opts);
  mask.ctx.setTransform(sx, 0, 0, sx, -ox * sx, -oy * sx);
  mask.ctx.fillStyle = "#000";
  const rings = [1.0 + feather / 120, 1.0 + feather / 240, 1, 0.97];
  const alphas = [0.25, 0.35, 0.6, 1];
  rings.forEach((sc, i) => {
    mask.ctx.globalAlpha = alphas[i];
    tracePolys(mask.ctx, polys, sc);
    mask.ctx.fill();
  });
  mask.ctx.globalAlpha = 1;
  layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
  layer.ctx.globalCompositeOperation = "destination-in";
  layer.ctx.drawImage(mask.canvas, 0, 0);
  layer.ctx.globalCompositeOperation = "source-over";
  // 画回去
  ctx.save();
  const baseAlpha = ctx.globalAlpha;
  ctx.translate(ox, oy);
  ctx.scale(1 / sx, 1 / sx);
  if (opts.wet !== false && p < 0.9) {
    // 湿墨：先垫一层轻微外扩的影子，像墨还没干时的洇边
    ctx.globalAlpha = baseAlpha * 0.18 * (1 - p / 0.9);
    ctx.drawImage(layer.canvas, -1.5 * sx, 1 * sx);
    ctx.drawImage(layer.canvas, 1.5 * sx, -1 * sx);
    ctx.globalAlpha = baseAlpha;
  }
  ctx.drawImage(layer.canvas, 0, 0);
  ctx.restore();
}
