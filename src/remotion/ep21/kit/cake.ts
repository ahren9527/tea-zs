/**
 * 第 21 期共用：白茶饼（俯视）的外轮廓与叶片纹理。
 * 支持 tone: "new"（新茶饼：青翠灰绿 + 银白芽毫多）与 tone: "old"（老茶饼：枣红棕褐 + 金黄老叶），
 * 方便在同一画面里一眼区分「新茶」与「老茶」。
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
import { tracePoly } from "./draw-kit";

export const CAKE_R = 330;
const R = CAKE_R;

export type CakeTone = "new" | "old";

export function rimRadius(a: number) {
  return (
    R *
    (1 +
      0.013 * noise1(Math.cos(a) * 2 + 7, 3) +
      0.011 * noise1(Math.sin(a) * 2 + 3, 9) +
      0.006 * noise1(a * 9, 11))
  );
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
export const CAKE_SIL = silhouette();

export function chunkPolygon(a0: number, a1: number, ring = 0.55, seed = 3): Pt[] {
  const inner: Pt[] = [];
  const n = 14;
  const side = (a: number, s: number) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 6; i++) {
      const rr = 1.08 - (1.08 - ring) * (i / 6);
      pts.push({ x: Math.cos(a) * R * rr, y: Math.sin(a) * R * rr });
    }
    return jaggedPath(pts, s, 5, 8);
  };
  const s0 = side(a0, seed);
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    const rr = ring * (1 + 0.05 * noise1(i * 0.9, seed + 5));
    inner.push({ x: Math.cos(a) * R * rr, y: Math.sin(a) * R * rr });
  }
  const s1 = side(a1, seed + 7).reverse();
  const outer: Pt[] = [];
  for (let i = 0; i <= 20; i++) {
    const a = a1 - (a1 - a0) * (i / 20);
    outer.push({ x: Math.cos(a) * R * 1.1, y: Math.sin(a) * R * 1.1 });
  }
  return [...s0, ...jaggedPath(inner, seed + 11, 4, 9), ...s1, ...outer];
}

const TEX_SCALE = 1.6;
const EXT = R * 1.16;

function leafColors(pal: FxPalette, tone: CakeTone) {
  if (tone === "new") {
    // 新白茶：竹青绿、嫩橄榄绿、浅黄褐、亮银白芽毫
    return {
      gap: mixHex("#4f583f", pal.bamboo, 0.35),
      olive: mixHex("#7c8f5e", pal.bamboo, 0.35),
      oliveDeep: mixHex("#5c6d45", pal.bamboo, 0.25),
      brown: mixHex("#9f8e68", pal.oat, 0.25),
      tan: mixHex("#c2b890", pal.oat, 0.4),
      bud: mixHex("#ece7d8", pal.rice, 0.4),
    };
  }
  // 老白茶：深茶褐、琥珀红褐、陈年乌褐、暖金芽毫
  return {
    gap: mixHex("#4a3322", pal.tea, 0.35),
    olive: mixHex("#7a5538", pal.tea, 0.25),
    oliveDeep: mixHex("#5e3e27", pal.tea, 0.3),
    brown: mixHex("#8d5b3a", pal.cinnabar, 0.14),
    tan: mixHex("#b3885c", pal.oat, 0.3),
    bud: mixHex("#dcc9a9", pal.oat, 0.35),
  };
}

function paintCake(c: CanvasRenderingContext2D, pal: FxPalette, tone: CakeTone) {
  const col = leafColors(pal, tone);
  const r = rng(tone === "new" ? 2025 : 2016);
  const sil = silhouette();
  c.save();
  c.beginPath();
  tracePoly(c, sil);
  c.fillStyle = col.gap;
  c.fill();
  c.clip();
  const pick = () => {
    const v = r();
    if (tone === "new") {
      if (v < 0.34) return col.olive;
      if (v < 0.52) return col.oliveDeep;
      if (v < 0.68) return col.brown;
      if (v < 0.84) return col.tan;
      return col.bud;
    }
    if (v < 0.24) return col.olive;
    if (v < 0.48) return col.oliveDeep;
    if (v < 0.74) return col.brown;
    if (v < 0.9) return col.tan;
    return col.bud;
  };
  const leaf = (
    x: number,
    y: number,
    rot: number,
    len: number,
    wid: number,
    color: string,
    vein: boolean,
  ) => {
    c.fillStyle = color;
    c.beginPath();
    traceLeaf(c, x, y, rot, len, wid);
    c.fill();
    c.fillStyle = rgba("#fff6e4", 0.1);
    c.beginPath();
    traceLeaf(
      c,
      x - Math.sin(rot) * wid * 0.25,
      y + Math.cos(rot) * wid * -0.25,
      rot,
      len * 0.8,
      wid * 0.4,
    );
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
  const layers: [number, number, number][] = [
    [850, 30, 52],
    [1200, 18, 36],
    [1400, 10, 24],
  ];
  for (const [count, lmin, lmax] of layers) {
    for (let i = 0; i < count; i++) {
      const rr = Math.sqrt(r()) * 1.02;
      const a = r() * TAU;
      const x = Math.cos(a) * R * rr;
      const y = Math.sin(a) * R * rr;
      const swirl = noise2(x / 110, y / 110, 5) * 1.4;
      const rot = a + Math.PI / 2 + swirl + (r() - 0.5) * 2.2;
      const len = lmin + r() * (lmax - lmin);
      const color = pick();
      const isBud = color === col.bud;
      c.globalAlpha = 0.78 + r() * 0.22;
      leaf(
        x,
        y,
        rot,
        isBud ? len * 0.8 : len,
        len * (isBud ? 0.15 : 0.24 + r() * 0.14),
        color,
        !isBud && len > 26,
      );
    }
  }
  const budCount = tone === "new" ? 340 : 220;
  for (let i = 0; i < budCount; i++) {
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
  }
  c.globalAlpha = 1;
  const lg = c.createLinearGradient(-R, -R, R, R);
  lg.addColorStop(0, rgba("#fff1d6", 0.24));
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
  c.restore();

  for (let i = 0; i < 280; i++) {
    const a = r() * TAU;
    const rr = 0.95 + r() * 0.07;
    const x = Math.cos(a) * rimRadius(a) * rr;
    const y = Math.sin(a) * rimRadius(a) * rr;
    const out = r() < 0.3;
    const rot = out ? a + (r() - 0.5) * 0.8 : a + Math.PI / 2 + (r() - 0.5) * 0.5;
    const len = 14 + r() * 20;
    leaf(x, y, rot, len, len * 0.2, pick(), false);
    c.fillStyle = rgba("#2a1a0c", 0.12 + 0.08 * hash01(i, 3));
    c.beginPath();
    traceLeaf(c, x, y, rot, len, len * 0.2);
    c.fill();
  }
}

export function cakeTexture(pal: FxPalette, tone: CakeTone = "old") {
  const size = EXT * 2 * TEX_SCALE;
  const s = cachedSurface(`ep21-cake:${tone}:${pal.paper}`, size, size, (c) => {
    c.save();
    c.translate(size / 2, size / 2);
    c.scale(TEX_SCALE, TEX_SCALE);
    paintCake(c, pal, tone);
    c.restore();
  });
  return { canvas: s.canvas, ext: EXT };
}

export function paintCakeTexture(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  tone: CakeTone = "old",
) {
  const tex = cakeTexture(pal, tone);
  ctx.drawImage(tex.canvas as CanvasImageSource, -tex.ext, -tex.ext, tex.ext * 2, tex.ext * 2);
}
