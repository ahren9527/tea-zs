/**
 * 第 22 期共用：白牡丹白茶饼（俯视）外轮廓与叶片纹理（素雪白牡丹：银白芽毫丰润 + 青灰橄榄叶）。
 */
import {
  TAU,
  cachedSurface,
  hash01,
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
      0.012 * noise1(Math.cos(a) * 2 + 7, 3) +
      0.01 * noise1(Math.sin(a) * 2 + 3, 9) +
      0.005 * noise1(a * 9, 11))
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

const TEX_SCALE = 1.5;
const EXT = R * 1.16;

function leafColors(pal: FxPalette, tone: CakeTone) {
  if (tone === "new") {
    // 素雪白牡丹：青翠灰绿 + 丰富银白芽毫
    return {
      gap: mixHex("#4f583f", pal.bamboo, 0.35),
      olive: mixHex("#7c8f5e", pal.bamboo, 0.35),
      oliveDeep: mixHex("#5c6d45", pal.bamboo, 0.25),
      brown: mixHex("#9f8e68", pal.oat, 0.25),
      tan: mixHex("#c2b890", pal.oat, 0.4),
      bud: mixHex("#f2eee2", pal.rice, 0.45),
    };
  }
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
  const r = rng(tone === "new" ? 2201 : 2209);
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
      if (v < 0.32) return col.olive;
      if (v < 0.5) return col.oliveDeep;
      if (v < 0.64) return col.brown;
      if (v < 0.8) return col.tan;
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
    if (vein) {
      c.strokeStyle = rgba(col.gap, 0.42);
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(x - Math.cos(rot) * len * 0.42, y - Math.sin(rot) * len * 0.42);
      c.lineTo(x + Math.cos(rot) * len * 0.42, y + Math.sin(rot) * len * 0.42);
      c.stroke();
    }
  };
  const layers: [number, number, number][] = [
    [760, 30, 50],
    [1050, 18, 34],
    [1200, 10, 22],
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
        len * (isBud ? 0.14 : 0.24 + r() * 0.14),
        color,
        !isBud && len > 26,
      );
    }
  }
  const budCount = tone === "new" ? 400 : 220;
  for (let i = 0; i < budCount; i++) {
    const rr = Math.sqrt(r()) * 0.99;
    const a = r() * TAU;
    const x = Math.cos(a) * R * rr;
    const y = Math.sin(a) * R * rr;
    const rot = a + Math.PI / 2 + noise2(x / 110, y / 110, 5) * 1.4 + (r() - 0.5) * 2.4;
    const len = 10 + r() * 22;
    c.globalAlpha = 0.4 + r() * 0.35;
    c.fillStyle = col.bud;
    c.beginPath();
    traceLeaf(c, x, y, rot, len, len * 0.13);
    c.fill();
  }
  c.globalAlpha = 1;
  const lg = c.createLinearGradient(-R, -R, R, R);
  lg.addColorStop(0, rgba("#fff1d6", 0.24));
  lg.addColorStop(0.45, rgba("#fff1d6", 0.02));
  lg.addColorStop(1, rgba("#2a1a0c", 0.32));
  c.fillStyle = lg;
  c.fillRect(-EXT, -EXT, EXT * 2, EXT * 2);
  const rim = c.createRadialGradient(0, 0, R * 0.78, 0, 0, R * 1.02);
  rim.addColorStop(0, rgba("#2a1a0c", 0));
  rim.addColorStop(0.7, rgba("#2a1a0c", 0.08));
  rim.addColorStop(1, rgba("#2a1a0c", 0.28));
  c.fillStyle = rim;
  c.fillRect(-EXT, -EXT, EXT * 2, EXT * 2);
  c.restore();

  for (let i = 0; i < 220; i++) {
    const a = r() * TAU;
    const rr = 0.95 + r() * 0.07;
    const x = Math.cos(a) * rimRadius(a) * rr;
    const y = Math.sin(a) * rimRadius(a) * rr;
    const out = r() < 0.3;
    const rot = out ? a + (r() - 0.5) * 0.8 : a + Math.PI / 2 + (r() - 0.5) * 0.5;
    const len = 14 + r() * 20;
    leaf(x, y, rot, len, len * 0.2, pick(), false);
    c.fillStyle = rgba("#2a1a0c", 0.1 + 0.08 * hash01(i, 3));
    c.beginPath();
    traceLeaf(c, x, y, rot, len, len * 0.2);
    c.fill();
  }
}

export function cakeTexture(pal: FxPalette, tone: CakeTone = "new") {
  const size = EXT * 2 * TEX_SCALE;
  const s = cachedSurface(`ep22-cake:${tone}:${pal.paper}`, size, size, (c) => {
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
  tone: CakeTone = "new",
) {
  const tex = cakeTexture(pal, tone);
  ctx.drawImage(tex.canvas as CanvasImageSource, -tex.ext, -tex.ext, tex.ext * 2, tex.ext * 2);
}
