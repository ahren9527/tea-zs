/**
 * fx/seal — 印章：崩边的方印（白文），盖下时略带旋转、印泥斑驳、四周洇开一圈。
 * 配合 springs.sealPress 使用：
 *   const pose = sealPress(frame - SEAL_AT);
 *   drawSeal(ctx, { text: "快取快封", x, y, size: 170, pose, color: pal.cinnabar, paper: pal.paper });
 * 形状与斑点由 seed 决定（同一 seed 每帧一样）；React 版本 <SealStamp/> 用同一组点。
 */
import { TAU, hash01, noise1, type Pt } from "./math";
import { rgba } from "./palette";
import type { SealPose } from "./springs";
import { scratchSurface } from "./surface";

/** 崩边方印外轮廓（以 0,0 为中心，边长 size）。偶有缺口 */
export function sealOutline(size: number, seed = 1, chip = 1): Pt[] {
  const h = size / 2;
  const pts: Pt[] = [];
  const per = 26;
  const corners: Pt[] = [
    { x: -h, y: -h },
    { x: h, y: -h },
    { x: h, y: h },
    { x: -h, y: h },
  ];
  for (let side = 0; side < 4; side++) {
    const a = corners[side];
    const b = corners[(side + 1) % 4];
    const nx = (b.y - a.y) / size; // 向内法线
    const ny = -(b.x - a.x) / size;
    for (let i = 0; i < per; i++) {
      const t = i / per;
      let inset = (noise1(side * 10 + t * 7, seed) * 0.5 + 0.5) * size * 0.012 * chip;
      // 崩口：少数位置深一点
      const c = hash01(seed, side, i);
      if (c > 0.9) inset += size * (0.02 + (c - 0.9) * 0.35) * chip;
      // 角上略圆钝
      const cornerSoft = Math.min(t, 1 - t) < 0.04 ? size * 0.012 : 0;
      pts.push({ x: a.x + (b.x - a.x) * t - nx * (inset + cornerSoft), y: a.y + (b.y - a.y) * t - ny * (inset + cornerSoft) });
    }
  }
  return pts;
}

/** 印泥没吃匀的白点（相对印面中心，单位 px） */
export function sealSpecks(size: number, seed = 1, count = 46) {
  const out: { x: number; y: number; r: number; a: number }[] = [];
  for (let i = 0; i < count; i++) {
    const edgeBias = hash01(seed, i, 9) > 0.5;
    let x = (hash01(seed, i, 1) - 0.5) * size;
    let y = (hash01(seed, i, 2) - 0.5) * size;
    if (edgeBias) {
      // 靠边缘多一些
      const s = Math.max(Math.abs(x), Math.abs(y)) / (size / 2) || 1;
      x /= s * 1.02;
      y /= s * 1.02;
      x *= 0.92 + hash01(seed, i, 3) * 0.08;
      y *= 0.92 + hash01(seed, i, 3) * 0.08;
    }
    out.push({ x, y, r: 0.6 + hash01(seed, i, 4) ** 2 * size * 0.018, a: 0.5 + hash01(seed, i, 5) * 0.5 });
  }
  return out;
}

/** 文字在印面里的排布：2 字一列、从右往左（传统读序）；1~4 字自适应 */
export function sealGlyphLayout(text: string, size: number) {
  const chars = Array.from(text.replace(/\s/g, "")).slice(0, 4);
  const n = chars.length;
  const inner = size * 0.8;
  if (n <= 1) return chars.map((ch) => ({ ch, x: 0, y: 0, fs: inner * 0.82 }));
  if (n === 2) return chars.map((ch, i) => ({ ch, x: 0, y: (i - 0.5) * inner * 0.5, fs: inner * 0.46 }));
  if (n === 3)
    return [
      { ch: chars[0], x: inner * 0.24, y: 0, fs: inner * 0.5, tall: true },
      { ch: chars[1], x: -inner * 0.24, y: -inner * 0.25, fs: inner * 0.44 },
      { ch: chars[2], x: -inner * 0.24, y: inner * 0.25, fs: inner * 0.44 },
    ];
  return chars.map((ch, i) => ({ ch, x: (i < 2 ? 1 : -1) * inner * 0.245, y: (i % 2 === 0 ? -1 : 1) * inner * 0.245, fs: inner * 0.46 }));
}

export type SealOpts = {
  text: string;
  x: number;
  y: number;
  size: number;
  pose: SealPose;
  color: string;
  paper: string;
  font: string;
  seed?: number;
};

/** 画一枚白文印（字是纸色「刻空」的）。pose 来自 springs.sealPress */
export function drawSeal(ctx: CanvasRenderingContext2D, o: SealOpts) {
  const { pose } = o;
  if (pose.alpha <= 0) return;
  const seed = o.seed ?? 7;
  const size = o.size;
  ctx.save();
  // 落下前：纸面上的影子（越接近越实）
  if (!pose.contact) {
    const near = 1 - Math.min(1, Math.abs(pose.y) / (size * 0.6));
    ctx.save();
    ctx.translate(o.x + 6, o.y + 10);
    const g = ctx.createRadialGradient(0, 0, size * 0.1, 0, 0, size * (0.75 - 0.15 * near));
    g.addColorStop(0, rgba("#3a2a1e", 0.22 * near * pose.alpha));
    g.addColorStop(1, rgba("#3a2a1e", 0));
    ctx.fillStyle = g;
    ctx.fillRect(-size, -size, size * 2, size * 2);
    ctx.restore();
  }
  // 印泥洇开的晕圈
  if (pose.contact && pose.ink > 0) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(pose.rot);
    const ring = sealOutline(size * (1 + 0.07 * pose.ink), seed + 3, 2.2);
    ctx.fillStyle = rgba(o.color, 0.12 * (1 - pose.ink * 0.55));
    ctx.beginPath();
    ring.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
    ctx.closePath();
    ctx.fill();
    // 几滴向外渗的小点
    for (let i = 0; i < 10; i++) {
      const a = hash01(seed, i, 21) * TAU;
      const d = size * (0.52 + 0.1 * pose.ink * hash01(seed, i, 22));
      ctx.globalAlpha = 0.35 * (1 - pose.ink * 0.5);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 1 + hash01(seed, i, 23) * 2.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  // 印面：离屏画好再合成（字和斑点用 destination-out 刻空）
  const m = ctx.getTransform();
  const sx = Math.hypot(m.a, m.b) || 1;
  const pad = size * 0.2;
  const L = (size + pad * 2) * sx;
  const s = scratchSurface("seal-face", L, L);
  const c = s.ctx;
  c.setTransform(sx, 0, 0, sx, (size / 2 + pad) * sx, (size / 2 + pad) * sx);
  const outline = sealOutline(size, seed);
  c.fillStyle = o.color;
  c.beginPath();
  outline.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)));
  c.closePath();
  c.fill();
  // 印泥浓淡
  c.globalCompositeOperation = "source-atop";
  for (let i = 0; i < 7; i++) {
    const gx = (hash01(seed, i, 31) - 0.5) * size;
    const gy = (hash01(seed, i, 32) - 0.5) * size;
    const gr = size * (0.2 + hash01(seed, i, 33) * 0.3);
    const g = c.createRadialGradient(gx, gy, 0, gx, gy, gr);
    const deep = hash01(seed, i, 34) > 0.5;
    g.addColorStop(0, deep ? "rgba(70,10,8,0.18)" : "rgba(255,240,220,0.14)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(-size, -size, size * 2, size * 2);
  }
  // 刻空：边栏 + 字 + 斑点
  c.globalCompositeOperation = "destination-out";
  c.strokeStyle = "#000";
  c.lineWidth = size * 0.028;
  const inset = size * 0.085;
  c.strokeRect(-size / 2 + inset, -size / 2 + inset, size - inset * 2, size - inset * 2);
  c.fillStyle = "#000";
  c.textAlign = "center";
  c.textBaseline = "middle";
  for (const g of sealGlyphLayout(o.text, size)) {
    c.font = `900 ${Math.round(g.fs)}px ${o.font}`;
    c.save();
    c.translate(g.x, g.y);
    if ("tall" in g && g.tall) c.scale(0.9, 1.7);
    c.fillText(g.ch, 0, g.fs * 0.04);
    c.restore();
  }
  for (const sp of sealSpecks(size, seed)) {
    c.globalAlpha = sp.a;
    c.beginPath();
    c.arc(sp.x, sp.y, sp.r, 0, TAU);
    c.fill();
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = "source-over";
  // 合成到主画布
  ctx.translate(o.x, o.y + pose.y);
  ctx.rotate(pose.rot);
  ctx.scale(pose.scaleX, pose.scaleY);
  ctx.globalAlpha = pose.alpha * (pose.contact ? 0.94 : 0.55 + 0.35 * pose.p);
  ctx.drawImage(s.canvas, -(size / 2 + pad), -(size / 2 + pad), size + pad * 2, size + pad * 2);
  ctx.restore();
}
