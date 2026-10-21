/**
 * fx/stroke — 手绘笔触随时间生长（path drawn over time）。
 * 不是等宽的描边动画，而是毛笔：起笔重、收笔尖，宽度有细微抖动，可带飞白。
 *
 *   const out = brushOutline(points, p, { width: 10 });   // 多边形（canvas 与 SVG 共用）
 *   drawBrushStroke(ctx, points, p, { width: 10, color })
 *   partialPolyline(points, p)                               // 只要细线（裂纹）时用
 */
import { cumulativeLengths, hash01, lerp, noise1, type Pt } from "./math";
import { rgba } from "./palette";

/** 按弧长截取折线的前 p（0..1），末端插值，保证生长是匀速沿路径的 */
export function partialPolyline(pts: Pt[], p: number): Pt[] {
  if (pts.length < 2 || p <= 0) return [];
  if (p >= 1) return pts.slice();
  const cum = cumulativeLengths(pts);
  const target = cum[cum.length - 1] * p;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (cum[i] >= target) {
      const seg = cum[i] - cum[i - 1] || 1;
      const t = (target - cum[i - 1]) / seg;
      out.push({ x: lerp(pts[i - 1].x, pts[i].x, t), y: lerp(pts[i - 1].y, pts[i].y, t) });
      return out;
    }
    out.push(pts[i]);
  }
  return out;
}

/** 平滑一条折线（Chaikin），手绘点列用 */
export function smoothPolyline(pts: Pt[], iterations = 2): Pt[] {
  let cur = pts;
  for (let k = 0; k < iterations; k++) {
    const next: Pt[] = [cur[0]];
    for (let i = 0; i < cur.length - 1; i++) {
      const a = cur[i];
      const b = cur[i + 1];
      next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
      next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    next.push(cur[cur.length - 1]);
    cur = next;
  }
  return cur;
}

export type BrushOpts = {
  width: number;
  /** 起笔段占全长比例（变粗），默认 0.12 */
  head?: number;
  /** 收笔段占比（变尖），默认 0.3 */
  tail?: number;
  /** 宽度抖动 0..1，默认 0.18 */
  jitter?: number;
  seed?: number;
  color?: string;
  alpha?: number;
  /** 飞白：几条纸色细丝穿过笔画，0 = 无，默认 0 */
  dry?: number;
  /** 飞白颜色（一般用纸色） */
  dryColor?: string;
};

/** 笔触外轮廓多边形（左边 + 反向右边）。生长中的笔头是圆钝的，长完后才收尖 */
export function brushOutline(pts: Pt[], p: number, o: BrushOpts): Pt[] {
  const part = partialPolyline(pts, p);
  if (part.length < 2) return [];
  const cum = cumulativeLengths(part);
  const total = cumulativeLengths(pts);
  const full = total[total.length - 1] || 1;
  const head = o.head ?? 0.12;
  const tail = o.tail ?? 0.3;
  const jitter = o.jitter ?? 0.18;
  const seed = o.seed ?? 1;
  const left: Pt[] = [];
  const right: Pt[] = [];
  const grownLen = cum[cum.length - 1];
  for (let i = 0; i < part.length; i++) {
    const s = cum[i] / full; // 在整笔中的位置
    const a = part[Math.max(0, i - 1)];
    const b = part[Math.min(part.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    let w = o.width;
    if (s < head) w *= 0.55 + 0.45 * Math.sin(((s / head) * Math.PI) / 2) + 0.15 * (1 - s / head);
    if (p >= 1 && s > 1 - tail) w *= Math.max(0.08, (1 - s) / tail) ** 0.8;
    // 正在生长的笔头：最后一小段收圆
    const toTip = grownLen - cum[i];
    if (p < 1 && toTip < o.width) w *= Math.sqrt(Math.max(0.05, toTip / o.width));
    w *= 1 + noise1(cum[i] / 38, seed) * jitter;
    left.push({ x: part[i].x + nx * w * 0.5, y: part[i].y + ny * w * 0.5 });
    right.push({ x: part[i].x - nx * w * 0.5, y: part[i].y - ny * w * 0.5 });
  }
  return left.concat(right.reverse());
}

/** 飞白丝：沿笔画方向、在笔画宽度内偏移的几条断续细线 */
export function brushDryLines(pts: Pt[], p: number, o: BrushOpts): Pt[][] {
  const n = Math.round((o.dry ?? 0) * 4);
  if (!n) return [];
  const part = partialPolyline(pts, p);
  const out: Pt[][] = [];
  for (let k = 0; k < n; k++) {
    const off = (hash01(o.seed ?? 1, k) - 0.5) * o.width * 0.6;
    const start = 0.35 + hash01(o.seed ?? 1, k, 2) * 0.4;
    const seg: Pt[] = [];
    for (let i = Math.floor(part.length * start); i < part.length; i++) {
      const a = part[Math.max(0, i - 1)];
      const b = part[Math.min(part.length - 1, i + 1)];
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      seg.push({ x: part[i].x + (-(b.y - a.y) / len) * off, y: part[i].y + ((b.x - a.x) / len) * off });
    }
    if (seg.length > 1) out.push(seg);
  }
  return out;
}

export function drawBrushStroke(ctx: CanvasRenderingContext2D, pts: Pt[], p: number, o: BrushOpts) {
  const poly = brushOutline(pts, p, o);
  if (poly.length < 3) return;
  ctx.save();
  ctx.fillStyle = rgba(o.color ?? "#2b251e", o.alpha ?? 1);
  ctx.beginPath();
  poly.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
  ctx.closePath();
  ctx.fill();
  const dry = brushDryLines(pts, p, o);
  if (dry.length) {
    ctx.strokeStyle = rgba(o.dryColor ?? "#f3eadb", 0.55);
    ctx.lineWidth = Math.max(0.8, o.width * 0.06);
    ctx.lineCap = "round";
    for (const seg of dry) {
      ctx.beginPath();
      seg.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** 一条有机的「细裂纹」点列：从 a 沿给定路径点前进，侧向加锯齿 */
export function jaggedPath(path: Pt[], seed: number, amp = 4, step = 9): Pt[] {
  const cum = cumulativeLengths(path);
  const total = cum[cum.length - 1];
  const out: Pt[] = [];
  const n = Math.max(2, Math.round(total / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [q] = partialPolyline(path, Math.max(1e-4, t)).slice(-1);
    const nxt = partialPolyline(path, Math.min(1, t + 0.01)).slice(-1)[0];
    const dx = nxt.x - q.x;
    const dy = nxt.y - q.y;
    const len = Math.hypot(dx, dy) || 1;
    const edge = i === 0 || i === n ? 0 : 1;
    const j = (noise1(i * 0.55, seed) * 0.7 + (hash01(seed, i) - 0.5) * 0.6) * amp * edge;
    out.push({ x: q.x + (-dy / len) * j, y: q.y + (dx / len) * j });
  }
  return out;
}
