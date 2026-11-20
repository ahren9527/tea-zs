/**
 * 第 22 期 B7「口诀金句」水墨版
 * 宣纸留白 + 底部淡墨远山薄雾 →
 * 说到「三层 / 各管 / 一件事」：三团淡墨依次在纸上洇开（每一层各占一列）→
 * 「封住气」「挡住光」「护住形」毛笔楷书逐字落在各自那团墨里 → 左下朱印「三层护茶」。
 */
import { getIconImage } from "@/remotion/shared/icon-cache";
import {
  TAU,
  cameraAt,
  cameraKick,
  drawSeal,
  easeOutCubic,
  fbm1,
  heavyLand,
  mixHex,
  noise1,
  noise2,
  progress,
  rgba,
  rng,
  sealPress,
  type FxPalette,
} from "../kit/fx";
import { SEAL_FONT, type AnimParams } from "@/remotion/shared/theme";
import { allTextsOf, beginFrame, chars, inkText, renderLayers, textOf } from "../kit/draw-kit";
import {
  BLOOM_AT,
  BLOOM_DUR,
  BLOOM_RX,
  BLOOM_RY,
  CHAR_FRAMES,
  COL_SIZE,
  COL_X,
  COL_Y,
  LENGTH,
  P1_AT,
  P2_AT,
  P3_AT,
  SEAL_AT,
  SEAL_HIT,
  SEAL_LIFT,
  SEAL_POS,
  SEAL_PRESS,
  TEXT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

export const BRUSH_FONT = '"Ma Shan Zheng", "ZS WenKai", "LXGW WenKai", serif';

const COLS = [
  { x: COL_X[0], y: COL_Y[0], at: P1_AT, key: "p1" as TextKey },
  { x: COL_X[1], y: COL_Y[1], at: P2_AT, key: "p2" as TextKey },
  { x: COL_X[2], y: COL_Y[2], at: P3_AT, key: "p3" as TextKey },
];
const MOUNT_AT = 0;

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.06,
    drift: 4,
    focus: [
      { at: P1_AT - 8, dur: 18, x: COLS[0].x, y: COLS[0].y, zoom: 1.03, pull: 0.14 },
      { at: P2_AT - 8, dur: 18, x: COLS[1].x, y: COLS[1].y, zoom: 1.04, pull: 0.14 },
      { at: P3_AT - 8, dur: 18, x: COLS[2].x, y: COLS[2].y, zoom: 1.05, pull: 0.16 },
      { at: SEAL_HIT + 12, dur: 28, x: 540, y: 900, zoom: 1.01, pull: 0.1 },
    ],
  });
  const k = cameraKick(frame - SEAL_HIT, 6);
  cam.x -= k.x;
  cam.y -= k.y;
  return cam;
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame, pal, fontScale } = beginFrame(ctx, elapsed, params);
  renderLayers(ctx, frame, pal, beatCamera(frame), {
    leaves: 0,
    light: 0.6,
    back: (p) => drawMountains(ctx, frame, p),
    subject: (p) => drawSubject(ctx, frame, p, params, fontScale),
  });
}

/* ───────── 远山薄雾（背景层，随镜头慢视差） ───────── */
/** 远山：用户给的水墨远山图（透明底），未加载时退回程序画的山脊。 */
export const MOUNT_SRC = "tea/ep22/b7-mountains.png";
export const NODE_IMAGES = [MOUNT_SRC];

function drawMountains(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette) {
  const a = easeOutCubic(progress(frame, MOUNT_AT, MOUNT_AT + 40));
  if (a <= 0) return;
  const img = getIconImage(MOUNT_SRC);
  if (img && img.complete && img.naturalWidth > 0) {
    // 从下方淡入并缓缓上浮；整段极慢地横向漂移，像薄雾里看山
    const w = 1080 * 1.03;
    const h = (img.naturalHeight / img.naturalWidth) * w;
    const drift = -14 * (frame / 260);
    const rise = (1 - a) * 40;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.drawImage(img, (1080 - w) / 2 + 8 + drift, 1920 - h + 20 + rise, w, h);
    ctx.restore();
    return;
  }
  const ink = mixHex(pal.ink, "#5d5a55", 0.4);
  const ridges = [
    { base: 1500, amp: 120, freq: 0.0032, seed: 11, alpha: 0.08, x0: -80 },
    { base: 1580, amp: 90, freq: 0.0045, seed: 23, alpha: 0.12, x0: 0 },
    { base: 1660, amp: 70, freq: 0.006, seed: 37, alpha: 0.18, x0: 0 },
  ];
  ridges.forEach((r, i) => {
    const rise = (1 - a) * (30 + i * 16);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.moveTo(-100, 2000);
    for (let x = -100; x <= 1180; x += 8) {
      const h = fbm1((x + r.x0) * r.freq, r.seed, 4) * 0.5 + 0.5;
      const peak = Math.pow(h, 1.6);
      ctx.lineTo(x, r.base + rise - peak * r.amp * 1.6 + 40);
    }
    ctx.lineTo(1180, 2000);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, r.base - r.amp, 0, r.base + 220);
    g.addColorStop(0, rgba(ink, r.alpha));
    g.addColorStop(0.45, rgba(ink, r.alpha * 0.55));
    g.addColorStop(1, rgba(ink, 0));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  });
  // 近处一排树点（极淡），在最近的山脊上
  const rr = rng(71);
  ctx.save();
  ctx.globalAlpha = a * 0.5;
  ctx.fillStyle = rgba(ink, 0.35);
  for (let i = 0; i < 26; i++) {
    const x = 620 + rr() * 460;
    const h = fbm1(x * 0.006, 37, 4) * 0.5 + 0.5;
    const y = 1660 - Math.pow(h, 1.6) * 70 * 1.6 + 40;
    const s = 6 + rr() * 10;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.arc(x + (rr() - 0.5) * s, y - s * (0.6 + rr()), s * (0.35 + rr() * 0.3), 0, TAU * 0.9995);
      ctx.fill();
    }
  }
  ctx.restore();
}

/* ───────── 墨晕：一滴墨落在湿宣纸上慢慢洇开，中心深、边缘有水渍线 ───────── */
function blobPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, seed: number, rough: number) {
  ctx.beginPath();
  const n = 140;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const m =
      1 +
      0.26 * noise2(c * 1.1 + seed, sn * 1.1, seed) +
      0.08 * noise2(c * 3.2, sn * 3.2 + seed, seed + 5) +
      rough * noise2(c * 9, sn * 9, seed + 9);
    const x = cx + c * rx * m;
    const y = cy + sn * ry * m;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

function inkBloom(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  local: number,
  dur: number,
  color: string,
  seed: number,
) {
  if (local <= 0) return;
  const p = Math.min(1, local / dur);
  // 先快后慢地洇开，之后还在极慢地往外渗
  const g = 0.18 + 0.82 * easeOutCubic(p) + Math.max(0, local - dur) * 0.0012;
  const fade = Math.min(1, local / 4);
  ctx.save();
  ctx.globalAlpha = fade;
  // 层层叠加：外层淡、内层深，边缘自然虚
  const L = 16;
  for (let j = 0; j < L; j++) {
    const k = j / (L - 1);
    const s = g * (1 - k * 0.62);
    blobPath(ctx, cx + noise1(k * 2, seed) * 10, cy + noise1(k * 2, seed + 3) * 18, rx * s, ry * s, seed + k * 0.6, 0.03 + (1 - k) * 0.03);
    ctx.fillStyle = rgba(color, 0.03 + k * 0.012);
    ctx.fill();
  }
  // 水渍边：最外圈一道略深的细线
  blobPath(ctx, cx, cy, rx * g, ry * g, seed, 0.06);
  ctx.strokeStyle = rgba(color, 0.055);
  ctx.lineWidth = 3;
  ctx.stroke();
  blobPath(ctx, cx, cy, rx * g * 1.015, ry * g * 1.012, seed + 0.2, 0.07);
  ctx.strokeStyle = rgba(color, 0.035);
  ctx.lineWidth = 6;
  ctx.stroke();
  // 旁边洇出来的几点小墨
  const r = rng(seed * 31);
  for (let i = 0; i < 2; i++) {
    const a = r() * TAU;
    const d = 1.05 + r() * 0.25;
    const sl = local - 6 - i * 3;
    if (sl <= 0) continue;
    const sg = 0.2 + 0.8 * easeOutCubic(Math.min(1, sl / dur));
    const sr = (14 + r() * 26) * sg;
    const sx = cx + Math.cos(a) * rx * d * g;
    const sy = cy + Math.sin(a) * ry * d * g;
    for (let j = 0; j < 5; j++) {
      blobPath(ctx, sx, sy, sr * (1 - j * 0.15), sr * (1 - j * 0.15), seed + i * 7 + j, 0.08);
      ctx.fillStyle = rgba(color, 0.025);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const brushInk = mixHex(pal.ink, "#6e6a62", 0.35);

  // 三团墨：每一层一团
  COLS.forEach((c, i) => {
    inkBloom(ctx, c.x, c.y, BLOOM_RX, BLOOM_RY, frame - BLOOM_AT[i], BLOOM_DUR, brushInk, 3 + i * 4.7);
  });

  // 毛笔楷书口诀，逐字随口播落下、晕开
  COLS.forEach((c, ci) => {
    const txt = t(params, c.key);
    const cs = chars(txt);
    const fs = COL_SIZE * fontScale;
    const step = fs * 1.08;
    const top = c.y - ((cs.length - 1) * step) / 2;
    cs.forEach((ch, k) => {
      const l = frame - (c.at + k * CHAR_FRAMES);
      if (l <= -2) return;
      const land = heavyLand(l + 2, { drop: 22, fall: 3, squash: 0.06 });
      ctx.save();
      ctx.translate(c.x, top + k * step + land.y);
      ctx.scale(land.scaleX, land.scaleY);
      inkText(ctx, ch, 0, 0, fs, easeOutCubic(progress(l, 0, 10)), 140 + ci * 10 + k, {
        color: mixHex(pal.ink, "#14110e", 0.6),
        weight: 400,
        font: BRUSH_FONT,
        wash: 0,
      });
      ctx.restore();
    });
  });

  // 朱印
  const pl = frame - SEAL_AT;
  if (pl > 0) {
    drawSeal(ctx, {
      text: t(params, "seal"),
      x: SEAL_POS.x,
      y: SEAL_POS.y,
      size: SEAL_POS.size * fontScale ** 0.5,
      pose: sealPress(pl, { lift: SEAL_LIFT, press: SEAL_PRESS, height: 100, rot: -0.06 }),
      color: pal.cinnabar,
      paper: pal.paper,
      font: SEAL_FONT,
      seed: 42,
    });
  }
}
