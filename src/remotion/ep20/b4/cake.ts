/**
 * 白茶饼（俯视）的几何与纹理：外轮廓、压制纹理环、裂纹、撬下来的那一块。
 * 纹理是静态的，画一次缓存；动画只做变换和裁切。所有形状以饼心为原点（局部坐标）。
 */
import {
  TAU,
  cachedSurface,
  hash01,
  jaggedPath,
  mixHex,
  noise1,
  noise2,
  rgba,
  rng,
  traceLeaf,
  type FxPalette,
  type Pt,
} from "@/remotion/shared/fx";
import { CAKE, CHUNK } from "./data";

const R = CAKE.r;

/** 饼边半径（略不规整） */
export function rimRadius(a: number) {
  return R * (1 + 0.013 * noise1(Math.cos(a) * 2 + 7, 3) + 0.011 * noise1(Math.sin(a) * 2 + 3, 9) + 0.006 * noise1(a * 9, 11));
}

export function silhouette(n = 180): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const r = rimRadius(a);
    out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return out;
}

/** 第 k 条压制纹理环（rr 是相对半径） */
export function ringPoint(rr: number, a: number, k = 0): Pt {
  const r = R * rr * (1 + 0.024 * noise1(Math.cos(a) * 2.3 + k * 1.7, 21) + 0.012 * noise1(a * 6 + k, 23));
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}
export const GRAIN_RINGS = [0.2, 0.31, 0.42, 0.52, 0.62, 0.72, 0.81, 0.89, 0.95];
export const CHUNK_RING_INDEX = 4; // 0.62
export function ringPath(k: number, start = -Math.PI / 2, n = 140): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push(ringPoint(GRAIN_RINGS[k], start + (i / n) * TAU, k));
  return pts;
}

/** 顺纹裂纹：从针尖（环上 0°）沿纹理环分两路，到端点后折向饼边 */
function crackBranch(dir: 1 | -1): Pt[] {
  const end = dir > 0 ? CHUNK.a1 : CHUNK.a0;
  const turn = end - dir * 0.07;
  const pts: Pt[] = [];
  const n = 26;
  for (let i = 0; i <= n; i++) pts.push(ringPoint(CHUNK.ring, (i / n) * turn, CHUNK_RING_INDEX));
  // 折向饼边：略带弧度
  const m = 8;
  const from = pts[pts.length - 1];
  for (let i = 1; i <= m; i++) {
    const t = i / m;
    const a = turn + (end - turn) * t;
    const rr = CHUNK.ring + (1.04 - CHUNK.ring) * t;
    const p = { x: Math.cos(a) * R * rr, y: Math.sin(a) * R * rr };
    pts.push({ x: from.x + (p.x - from.x) * 1, y: p.y });
  }
  return jaggedPath(pts, dir > 0 ? 41 : 43, 4.2, 7);
}
export const CRACK_UP = crackBranch(-1); // 往 a0（上）
export const CRACK_DOWN = crackBranch(1); // 往 a1（下）

/** 引导线（顺纹那条环在这一块里的一段） */
export function guidePath(): Pt[] {
  const pts: Pt[] = [];
  const n = 40;
  for (let i = 0; i <= n; i++) pts.push(ringPoint(CHUNK.ring, CHUNK.a0 + (CHUNK.a1 - CHUNK.a0) * (i / n), CHUNK_RING_INDEX));
  return pts;
}

/** 撬下的那一块的外轮廓（含饼边外散叶的余量） */
export function chunkPolygon(): Pt[] {
  const up = CRACK_UP.slice().reverse(); // 饼边(a0) → 针尖
  const down = CRACK_DOWN; // 针尖 → 饼边(a1)
  const outer: Pt[] = [];
  const n = 30;
  for (let i = 0; i <= n; i++) {
    const a = CHUNK.a1 + 0.02 - (i / n) * (CHUNK.a1 - CHUNK.a0 + 0.04);
    outer.push({ x: Math.cos(a) * R * 1.13, y: Math.sin(a) * R * 1.13 });
  }
  return [...up, ...down, ...outer];
}
export const CHUNK_POLY = chunkPolygon();
export const CHUNK_CENTER: Pt = (() => {
  const a = (CHUNK.a0 + CHUNK.a1) / 2;
  return { x: Math.cos(a) * R * 0.84, y: Math.sin(a) * R * 0.84 };
})();

export function tracePoly(ctx: CanvasRenderingContext2D, pts: Pt[], close = true) {
  pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
  if (close) ctx.closePath();
}

// ---------------- 纹理（缓存） ----------------
export const TEX_SCALE = 1.6;
const EXT = R * 1.16;

function leafColors(pal: FxPalette) {
  // 白茶饼：灰绿、褐、银白芽毫；与小正配色调和
  return {
    gap: mixHex("#6a5c47", pal.tea, 0.25),
    olive: mixHex("#9a9474", pal.bamboo, 0.18),
    oliveDeep: mixHex("#7d7558", pal.bamboo, 0.12),
    brown: mixHex("#94765a", pal.tea, 0.25),
    tan: mixHex("#b9a684", pal.oat, 0.35),
    bud: mixHex("#e4ddcb", pal.rice, 0.3),
  };
}

/** 局部坐标的饼纹理画到 ctx（已平移到饼心） */
function paintCake(c: CanvasRenderingContext2D, pal: FxPalette) {
  const col = leafColors(pal);
  const r = rng(2020);
  const sil = silhouette();
  // 底色（叶间的深缝）
  c.save();
  c.beginPath();
  tracePoly(c, sil);
  c.fillStyle = col.gap;
  c.fill();
  c.clip();
  const pick = () => {
    const v = r();
    if (v < 0.28) return col.olive;
    if (v < 0.42) return col.oliveDeep;
    if (v < 0.62) return col.brown;
    if (v < 0.86) return col.tan;
    return col.bud;
  };
  const leaf = (x: number, y: number, rot: number, len: number, wid: number, color: string, vein: boolean) => {
    c.fillStyle = color;
    c.beginPath();
    traceLeaf(c, x, y, rot, len, wid);
    c.fill();
    // 叶面一侧受光
    c.fillStyle = rgba("#fff6e4", 0.1);
    c.beginPath();
    traceLeaf(c, x - Math.sin(rot) * wid * 0.25, y + Math.cos(rot) * wid * -0.25, rot, len * 0.8, wid * 0.4);
    c.fill();
    if (vein) {
      c.strokeStyle = rgba(col.gap, 0.45);
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(x - Math.cos(rot) * len * 0.42, y - Math.sin(rot) * len * 0.42);
      c.lineTo(x + Math.cos(rot) * len * 0.42, y + Math.sin(rot) * len * 0.42);
      c.stroke();
    }
  };
  // 三层叶片：大 → 中 → 小，方向大体沿压制的环向（略有旋涡）
  const layers: [number, number, number][] = [
    [900, 30, 52],
    [1300, 18, 36],
    [1500, 10, 24],
  ];
  for (const [count, lmin, lmax] of layers) {
    for (let i = 0; i < count; i++) {
      const rr = Math.sqrt(r()) * 1.02;
      const a = r() * TAU;
      const x = Math.cos(a) * R * rr;
      const y = Math.sin(a) * R * rr;
      const swirl = noise2(x / 110, y / 110, 5) * 1.4;
      // 方向：略偏环向（压制），但大量随机 —— 不能像漩涡
      const rot = a + Math.PI / 2 + swirl + (r() - 0.5) * 2.2;
      const len = lmin + r() * (lmax - lmin);
      const color = pick();
      const isBud = color === col.bud;
      c.globalAlpha = 0.78 + r() * 0.22;
      leaf(x, y, rot, isBud ? len * 0.8 : len, len * (isBud ? 0.15 : 0.24 + r() * 0.14), color, !isBud && len > 26);
    }
  }
  // 芽毫：细长、发白、毛茸茸
  for (let i = 0; i < 300; i++) {
    const rr = Math.sqrt(r()) * 0.99;
    const a = r() * TAU;
    const x = Math.cos(a) * R * rr;
    const y = Math.sin(a) * R * rr;
    const rot = a + Math.PI / 2 + noise2(x / 110, y / 110, 5) * 1.4 + (r() - 0.5) * 2.4;
    const len = 10 + r() * 22;
    c.globalAlpha = 0.35 + r() * 0.35;
    c.fillStyle = col.bud;
    c.beginPath();
    traceLeaf(c, x, y, rot, len, len * 0.13);
    c.fill();
    c.globalAlpha = 0.1;
    c.strokeStyle = "#ffffff";
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(x - Math.cos(rot) * len * 0.4, y - Math.sin(rot) * len * 0.4);
    c.lineTo(x + Math.cos(rot) * len * 0.4, y + Math.sin(rot) * len * 0.4);
    c.stroke();
  }
  c.globalAlpha = 1;
  // 大块的深浅（压饼时厚薄、新老叶不均）
  for (let i = 0; i < 46; i++) {
    const a = r() * TAU;
    const rr = Math.sqrt(r()) * R;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    const rad = 40 + r() * 120;
    const g = c.createRadialGradient(x, y, 0, x, y, rad);
    const dark = r() > 0.45;
    g.addColorStop(0, dark ? rgba("#3b2a18", 0.16) : rgba("#f4e6c8", 0.12));
    g.addColorStop(1, dark ? rgba("#3b2a18", 0) : rgba("#f4e6c8", 0));
    c.fillStyle = g;
    c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // 光影：左上受光、右下背光；饼边略暗（厚度）；饼心微凹
  const lg = c.createLinearGradient(-R, -R, R, R);
  lg.addColorStop(0, rgba("#fff1d6", 0.26));
  lg.addColorStop(0.45, rgba("#fff1d6", 0.02));
  lg.addColorStop(1, rgba("#2a1a0c", 0.34));
  c.fillStyle = lg;
  c.fillRect(-EXT, -EXT, EXT * 2, EXT * 2);
  const rim = c.createRadialGradient(0, 0, R * 0.78, 0, 0, R * 1.02);
  rim.addColorStop(0, rgba("#2a1a0c", 0));
  rim.addColorStop(0.7, rgba("#2a1a0c", 0.08));
  rim.addColorStop(1, rgba("#2a1a0c", 0.3));
  c.fillStyle = rim;
  c.fillRect(-EXT, -EXT, EXT * 2, EXT * 2);
  const dimple = c.createRadialGradient(-6, -8, 0, 0, 0, R * 0.2);
  dimple.addColorStop(0, rgba("#2a1a0c", 0.16));
  dimple.addColorStop(1, rgba("#2a1a0c", 0));
  c.fillStyle = dimple;
  c.fillRect(-R * 0.3, -R * 0.3, R * 0.6, R * 0.6);
  // 饼面隆起：左上一道受光的边
  const bevel = c.createLinearGradient(-R, -R, R * 0.4, R * 0.4);
  bevel.addColorStop(0, rgba("#fff4dc", 0.35));
  bevel.addColorStop(1, rgba("#fff4dc", 0));
  c.strokeStyle = bevel;
  c.lineWidth = 14;
  c.beginPath();
  tracePoly(c, silhouette().map((q) => ({ x: q.x * 0.975, y: q.y * 0.975 })));
  c.stroke();
  c.restore();

  // 饼边散叶（不裁切，伸出轮廓）。0° 附近（下针的那段边）更松
  for (let i = 0; i < 360; i++) {
    const a = r() * TAU;
    const loose = Math.exp(-((Math.atan2(Math.sin(a), Math.cos(a)) / 0.5) ** 2));
    const rr = 0.95 + r() * (0.07 + 0.05 * loose);
    const x = Math.cos(a) * rimRadius(a) * rr;
    const y = Math.sin(a) * rimRadius(a) * rr;
    const out = r() < 0.25 + 0.35 * loose;
    const rot = out ? a + (r() - 0.5) * 0.8 : a + Math.PI / 2 + (r() - 0.5) * 0.5;
    const len = 14 + r() * (18 + 14 * loose);
    leaf(x, y, rot, len, len * 0.2, pick(), false);
    // 外侧的叶子背光一点
    c.fillStyle = rgba("#2a1a0c", 0.12 + 0.08 * hash01(i, 3));
    c.beginPath();
    traceLeaf(c, x, y, rot, len, len * 0.2);
    c.fill();
  }
}

/** 缓存好的饼纹理（按主题），返回画布与它在局部坐标里的范围 */
export function cakeTexture(pal: FxPalette) {
  const size = EXT * 2 * TEX_SCALE;
  const s = cachedSurface(`ep20b4-cake:${pal.paper}`, size, size, (c) => {
    c.save();
    c.translate(size / 2, size / 2);
    c.scale(TEX_SCALE, TEX_SCALE);
    paintCake(c, pal);
    c.restore();
    // 柔化一次：自身错位叠几层，去掉「矢量感」的硬边（不依赖 ctx.filter）
    const soft = cachedSurface(`ep20b4-cake-soft:${pal.paper}`, size, size, (sc) => sc.drawImage(c.canvas as CanvasImageSource, 0, 0));
    c.globalAlpha = 0.22;
    for (const [dx, dy] of [
      [1.2, 0],
      [-1.2, 0],
      [0, 1.2],
      [0, -1.2],
    ])
      c.drawImage(soft.canvas as CanvasImageSource, dx, dy);
    c.globalAlpha = 1;
  });
  return { canvas: s.canvas, ext: EXT };
}
