/**
 * fx/math — 纯函数：缓动、确定性随机、噪声。Comp.tsx 与 draw.ts 共用，保证预览 = 导出。
 * 约定：所有动效都是「帧号 → 数值」的纯函数，没有内部状态，也不用 Math.random()。
 * 缓动一律非线性（不提供 linear）。
 */

export const TAU = Math.PI * 2;

export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
export const clamp01 = (x: number) => clamp(x, 0, 1);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** x 在 [a,b] 中的位置，夹到 0..1 */
export const progress = (x: number, a: number, b: number) => (b === a ? (x >= b ? 1 : 0) : clamp01((x - a) / (b - a)));

// ---------- 缓动（全部非线性） ----------
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;
export const easeOutSine = (t: number) => Math.sin((clamp01(t) * Math.PI) / 2);
export const easeInSine = (t: number) => 1 - Math.cos((clamp01(t) * Math.PI) / 2);
export const easeOutCubic = (t: number) => 1 - (1 - clamp01(t)) ** 3;
export const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
export const easeOutExpo = (t: number) => {
  const x = clamp01(t);
  return x >= 1 ? 1 : 1 - 2 ** (-10 * x);
};
export const easeInOutQuint = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2;
};
/** 「慢进慢出」再加一点点尾巴 —— 镜头、光线这类大面积运动用 */
export const easeCinematic = (t: number) => easeInOutCubic(easeOutSine(clamp01(t)) * 0.35 + clamp01(t) * 0.65);

/** 帧窗口里的缓动进度：from..to 帧 → 0..1（带缓动） */
export function window01(frame: number, from: number, to: number, ease: (t: number) => number = easeInOutSine) {
  return ease(progress(frame, from, to));
}

// ---------- 确定性随机 ----------
/** 整数哈希（同输入永远同输出） */
export function hashInt(n: number) {
  let x = n | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return x >>> 0;
}
/** 0..1 的确定性随机（可传多个整数作 key） */
export function hash01(...keys: number[]) {
  let h = 0x9e3779b9;
  for (const k of keys) h = hashInt(h ^ Math.imul(Math.round(k * 1000) | 0, 0x27d4eb2d));
  return h / 4294967296;
}
/** 可连续取数的种子随机数发生器（mulberry32） */
export function rng(seed: number) {
  let a = hashInt(seed) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 噪声 ----------
const smooth = (t: number) => t * t * (3 - 2 * t);
/** 1D 值噪声 → -1..1 */
export function noise1(x: number, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash01(i, seed) * 2 - 1;
  const b = hash01(i + 1, seed) * 2 - 1;
  return lerp(a, b, smooth(f));
}
/** 2D 值噪声 → -1..1 */
export function noise2(x: number, y: number, seed = 0) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const v = (i: number, j: number) => hash01(i, j, seed) * 2 - 1;
  return lerp(lerp(v(ix, iy), v(ix + 1, iy), fx), lerp(v(ix, iy + 1), v(ix + 1, iy + 1), fx), fy);
}
/** 分形噪声（几层叠加）→ 约 -1..1 */
export function fbm1(x: number, seed = 0, octaves = 3) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise1(x * freq, seed + o * 17);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

export type Pt = { x: number; y: number };

/** 极坐标 → 点 */
export const polar = (cx: number, cy: number, r: number, a: number): Pt => ({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });

/** 折线的累计长度表 */
export function cumulativeLengths(pts: Pt[]) {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return out;
}

/** 把多边形点列转成 SVG path d（React 包装用，和 canvas 用同一组点） */
export function pointsToPath(pts: Pt[], close = true) {
  if (!pts.length) return "";
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("");
  return close ? `${d}Z` : d;
}
