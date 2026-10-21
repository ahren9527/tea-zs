/**
 * fx/motion — 恒定的微动（画面永远不完全静止），全部是帧号的纯函数。
 *   breathe       呼吸（缩放/位移的慢正弦，带随机相位）
 *   lightSpots    窗光里漂浮的光斑 / 尘埃
 *   steamWisps    上升的水汽丝
 *   leafParticles 飘动的碎叶
 * 每个都有「数据函数」（返回位置等，React 用）和 draw* 函数（canvas 用）。
 */
import { TAU, clamp01, easeInOutSine, hash01, noise1, type Pt } from "./math";
import { rgba } from "./palette";

/** 呼吸：返回 -1..1 的慢波（period 秒），以及常用的 scale / y */
export function breathe(frame: number, period = 4.2, phase = 0, amp = 1) {
  const w = Math.sin((frame / 29.97 / period) * TAU + phase);
  return { w, scale: 1 + 0.008 * amp * w, y: -3 * amp * w };
}

export type Area = { x: number; y: number; w: number; h: number };

export type LightSpot = { x: number; y: number; r: number; alpha: number };
/** 光斑：在 area 里缓慢漂移、明灭 */
export function lightSpots(frame: number, n: number, area: Area, seed = 1): LightSpot[] {
  const t = frame / 29.97;
  const out: LightSpot[] = [];
  for (let i = 0; i < n; i++) {
    const bx = hash01(seed, i, 1);
    const by = hash01(seed, i, 2);
    const sp = 0.04 + hash01(seed, i, 3) * 0.05;
    const x = area.x + ((bx + noise1(t * sp * 2 + i, seed) * 0.08 + t * sp * 0.15) % 1) * area.w;
    const y = area.y + ((by + noise1(t * sp * 1.6 + i * 3, seed + 5) * 0.06 - t * sp * 0.08 + 1) % 1) * area.h;
    const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + hash01(seed, i, 4)) + i);
    out.push({ x, y, r: 2 + hash01(seed, i, 5) ** 2 * 9, alpha: (0.25 + 0.75 * tw) * (0.3 + hash01(seed, i, 6) * 0.7) });
  }
  return out;
}

export function drawLightSpots(ctx: CanvasRenderingContext2D, spots: LightSpot[], color: string, strength = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const s of spots) {
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.4);
    g.addColorStop(0, rgba(color, 0.5 * s.alpha * strength));
    g.addColorStop(0.4, rgba(color, 0.2 * s.alpha * strength));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(s.x - s.r * 2.5, s.y - s.r * 2.5, s.r * 5, s.r * 5);
  }
  ctx.restore();
}

export type Wisp = { pts: Pt[]; width: number; alpha: number };
/** 水汽丝：从 origin 一条横线上冒出，上升、摆动、散开、消失（循环） */
export function steamWisps(frame: number, n: number, origin: { x: number; y: number; w: number }, seed = 1, height = 360): Wisp[] {
  const t = frame / 29.97;
  const out: Wisp[] = [];
  for (let i = 0; i < n; i++) {
    const life = 3.2 + hash01(seed, i, 1) * 2.2;
    const offset = hash01(seed, i, 2) * life;
    const cycle = Math.floor((t + offset) / life);
    const age = ((t + offset) % life) / life; // 0..1
    const bx = origin.x + (hash01(seed, i, cycle, 3) - 0.5) * origin.w;
    const pts: Pt[] = [];
    const segs = 14;
    const rise = height * (0.35 + 0.65 * easeInOutSine(age));
    for (let k = 0; k <= segs; k++) {
      const s = k / segs;
      const yy = origin.y - s * rise;
      const sway = noise1(s * 2.2 - t * 0.5 + i * 4.1, seed + i) * 36 * s + Math.sin(s * 5 + t * 0.9 + i) * 10 * s;
      pts.push({ x: bx + sway, y: yy });
    }
    const alpha = Math.sin(Math.PI * clamp01(age)) ** 1.5;
    out.push({ pts, width: 8 + hash01(seed, i, 4) * 12 + age * 18, alpha });
  }
  return out;
}

export function drawSteam(ctx: CanvasRenderingContext2D, wisps: Wisp[], color: string, strength = 1) {
  // 柔边的「气团」沿路径排开：越往上越大越淡（不依赖 filter，Safari 也一样）
  ctx.save();
  for (const w of wisps) {
    if (w.alpha <= 0.01) continue;
    const n = w.pts.length;
    for (let i = 0; i < n; i += 1) {
      const q = w.pts[i];
      const s = i / (n - 1);
      const r = w.width * (0.8 + 2.4 * s);
      const a = 0.07 * w.alpha * strength * Math.sin(Math.PI * Math.min(1, s * 1.15 + 0.08));
      if (a <= 0.002) continue;
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      g.addColorStop(0, rgba(color, a));
      g.addColorStop(0.55, rgba(color, a * 0.45));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(q.x - r, q.y - r, r * 2, r * 2);
    }
  }
  ctx.restore();
}

export type LeafBit = { x: number; y: number; rot: number; len: number; alpha: number; tone: number };
/** 碎叶：在 area 里慢慢飘（略向下、左右荡），循环出入 */
export function leafParticles(frame: number, n: number, area: Area, seed = 1): LeafBit[] {
  const t = frame / 29.97;
  const out: LeafBit[] = [];
  for (let i = 0; i < n; i++) {
    const speed = 0.025 + hash01(seed, i, 1) * 0.035;
    const py = (hash01(seed, i, 2) + t * speed) % 1;
    const px = hash01(seed, i, 3) + Math.sin(t * (0.5 + hash01(seed, i, 4)) + i) * 0.03;
    const edge = Math.sin(Math.PI * py);
    out.push({
      x: area.x + (((px % 1) + 1) % 1) * area.w,
      y: area.y + py * area.h,
      rot: hash01(seed, i, 5) * TAU + t * (hash01(seed, i, 6) - 0.5) * 1.4,
      len: 6 + hash01(seed, i, 7) * 12,
      alpha: edge * (0.35 + hash01(seed, i, 8) * 0.5),
      tone: hash01(seed, i, 9),
    });
  }
  return out;
}

/** 单片叶子的轮廓（叶尖朝 +x），碎叶与茶饼纹理共用 */
export function traceLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number, len: number, wid: number) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const P = (u: number, v: number) => [x + u * c - v * s, y + u * s + v * c] as const;
  const [ax, ay] = P(-len / 2, 0);
  const [bx, by] = P(len / 2, 0);
  const [c1x, c1y] = P(-len * 0.1, -wid);
  const [c2x, c2y] = P(-len * 0.1, wid);
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo(c1x, c1y, bx, by);
  ctx.quadraticCurveTo(c2x, c2y, ax, ay);
}

export function drawLeafParticles(ctx: CanvasRenderingContext2D, bits: LeafBit[], colors: string[], strength = 1) {
  ctx.save();
  for (const b of bits) {
    if (b.alpha <= 0.01) continue;
    ctx.fillStyle = rgba(colors[Math.floor(b.tone * colors.length) % colors.length], b.alpha * strength);
    ctx.beginPath();
    traceLeaf(ctx, b.x, b.y, b.rot, b.len, b.len * 0.22);
    ctx.fill();
  }
  ctx.restore();
}
