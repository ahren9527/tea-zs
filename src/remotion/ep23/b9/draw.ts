/**
 * 第 23 期 B9「金句」水墨口诀逐帧画布（1080×1920）
 * 沿用 ep22 B7 水墨口诀风格：宣纸留白 + 底部远山薄雾（复用 public/tea/ep23/b9-mountains.png，无图时退回程序画山脊）+
 * 两团淡墨依次洇开 + 马善政毛笔楷书两列竖排（「国标管的是出厂」/「存茶要自己留余量」）+ 左下朱印「存茶留余」。不要卷轴。
 */
import { getIconImage, registerImages } from "@/remotion/shared/icon-cache";
import {
  END_STILL_FRAMES,
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
import { anticipateMove, onTwos } from "../kit/hand";
import { drawMoistureScale } from "../kit/objects";
import { SEAL_FONT, type AnimParams } from "@/remotion/shared/theme";
import {
  allTextsOf,
  beginFrame,
  chars,
  gapMarker,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import {
  BLOOM_AT,
  BLOOM_DUR,
  BLOOM_RX,
  BLOOM_RY,
  CHAR_FRAMES,
  COL_SIZE,
  COL_X,
  COL_Y,
  L1_AT,
  L2_AT,
  LENGTH,
  SEAL_AT,
  SEAL_HIT,
  SEAL_LIFT,
  SEAL_POS,
  SEAL_PRESS,
  TEXT,
  type TextKey,
} from "./data";
import { VO } from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const STILL_START = Math.max(0, LENGTH - END_STILL_FRAMES);

export const BRUSH_FONT = '"Ma Shan Zheng", "ZS WenKai", "LXGW WenKai", serif';

/** 复用 ep22 B7 水墨远山透明底图，未加载时退回程序山脊 */
export const MOUNT_SRC = "tea/ep23/b9-mountains.png";
export const NODE_IMAGES = registerImages([MOUNT_SRC]);

const COLS = [
  { x: COL_X[0], y: COL_Y[0], at: L1_AT, key: "line1" as TextKey },
  { x: COL_X[1], y: COL_Y[1], at: L2_AT, key: "line2" as TextKey },
];

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.05,
    drift: 3.5,
    focus: [
      { at: L1_AT - 8, dur: 18, x: COLS[0].x, y: COLS[0].y, zoom: 1.025, pull: 0.14 },
      { at: L2_AT - 8, dur: 18, x: COLS[1].x, y: COLS[1].y, zoom: 1.035, pull: 0.15 },
      { at: SEAL_HIT + 10, dur: 24, x: 500, y: 900, zoom: 1.01, pull: 0.12 },
    ],
  });
  const k = cameraKick(frame - SEAL_HIT, 6);
  cam.x -= k.x;
  cam.y -= k.y;
  return cam;
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame: rawF, pal, fontScale } = beginFrame(ctx, elapsed, params);
  // 一拍二：主体动作按偶数帧取整；镜头、粒子仍逐帧
  const frame = onTwos(rawF);
  const stillFrame = Math.min(frame, STILL_START);
  renderLayers(ctx, Math.min(rawF, STILL_START), pal, beatCamera(rawF), {
    leaves: 0,
    light: 0.6,
    back: (p) => drawMountains(ctx, stillFrame, p),
    subject: (p) => drawSubject(ctx, frame, stillFrame, p, params, fontScale),
  });
}

function drawMountains(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette) {
  const a = easeOutCubic(progress(frame, 0, 32));
  if (a <= 0) return;
  const img = getIconImage(MOUNT_SRC);
  if (img && img.complete && img.naturalWidth > 0) {
    const w = 1080 * 1.03;
    const h = (img.naturalHeight / img.naturalWidth) * w;
    const drift = -14 * (frame / 240);
    const rise = (1 - a) * 36;
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
    const rise = (1 - a) * (28 + i * 14);
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
}

function blobPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
  rough: number,
) {
  ctx.beginPath();
  const n = 136;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const m =
      1 +
      0.24 * noise2(c * 1.1 + seed, sn * 1.1, seed) +
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
  const g = 0.2 + 0.8 * easeOutCubic(p) + Math.max(0, local - dur) * 0.0009;
  const fade = Math.min(1, local / 4);
  ctx.save();
  ctx.globalAlpha = fade;
  const L = 15;
  for (let j = 0; j < L; j++) {
    const k = j / (L - 1);
    const s = g * (1 - k * 0.62);
    blobPath(
      ctx,
      cx + noise1(k * 2, seed) * 10,
      cy + noise1(k * 2, seed + 3) * 18,
      rx * s,
      ry * s,
      seed + k * 0.6,
      0.03 + (1 - k) * 0.03,
    );
    ctx.fillStyle = rgba(color, 0.028 + k * 0.011);
    ctx.fill();
  }
  blobPath(ctx, cx, cy, rx * g, ry * g, seed, 0.06);
  ctx.strokeStyle = rgba(color, 0.052);
  ctx.lineWidth = 3;
  ctx.stroke();

  const r = rng(seed * 31);
  for (let i = 0; i < 2; i++) {
    const a = r() * TAU;
    const d = 1.05 + r() * 0.22;
    const sl = local - 6 - i * 3;
    if (sl <= 0) continue;
    const sg = 0.2 + 0.8 * easeOutCubic(Math.min(1, sl / dur));
    const sr = (14 + r() * 24) * sg;
    const sx = cx + Math.cos(a) * rx * d * g;
    const sy = cy + Math.sin(a) * ry * d * g;
    for (let j = 0; j < 5; j++) {
      blobPath(ctx, sx, sy, sr * (1 - j * 0.15), sr * (1 - j * 0.15), seed + i * 7 + j, 0.08);
      ctx.fillStyle = rgba(color, 0.024);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  stillFrame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const brushInk = mixHex(pal.ink, "#6e6a62", 0.35);

  // 两团淡墨：每列一团，末 0.5s 用 stillFrame 静止
  COLS.forEach((c, i) => {
    inkBloom(
      ctx,
      c.x,
      c.y,
      BLOOM_RX,
      BLOOM_RY,
      stillFrame - BLOOM_AT[i],
      BLOOM_DUR,
      brushInk,
      5 + i * 5.3,
    );
  });

  // 马善政毛笔楷书两列竖排，逐字随口播落墨
  COLS.forEach((c, ci) => {
    const txt = t(params, c.key);
    const cs = chars(txt);
    const fs = fitSize(txt, COL_SIZE, 940, 1.04) * fontScale;
    const step = fs * 1.06;
    const top = c.y - ((cs.length - 1) * step) / 2;
    // 逐字踩口播：每个字按 vo-times 里马老师的真实开口帧落墨（面板改字时按首尾插值）
    const cf = VO.charFrames(TEXT[c.key], cs.length);
    cs.forEach((ch, k) => {
      const l = frame - ((cf[k] ?? c.at + k * CHAR_FRAMES) - 2);
      if (l <= -2) return;
      const land = heavyLand(l + 2, { drop: 20, fall: 3, squash: 0.055 });
      ctx.save();
      ctx.translate(c.x, top + k * step + land.y);
      ctx.scale(land.scaleX, land.scaleY);
      inkText(ctx, ch, 0, 0, fs, easeOutCubic(progress(l, 0, 10)), 140 + ci * 16 + k, {
        color: mixHex(pal.ink, "#14110e", 0.6),
        weight: 400,
        font: BRUSH_FONT,
        wash: 0,
      });
      ctx.restore();
    });
  });

  // 收束到全片母题：一把淡墨水分刻度尺，指针停在 7%，7%→8.5% 那段就是「余量」
  const rl = frame - (SEAL_HIT + 4);
  if (rl > 0) {
    const rIn = easeOutCubic(progress(rl, 0, 16));
    const RX = 560;
    const RY = 1425;
    const LEN = 560;
    const pos = (v: number) => -LEN / 2 + ((v - 5) / 5) * LEN;
    const val = 5 + 2 * anticipateMove(rl - 4, { prep: 4, back: 0.08 });
    ctx.save();
    ctx.translate(RX, RY);
    drawMoistureScale(ctx, pal, {
      orientation: "horizontal",
      min: 5,
      max: 10,
      length: LEN,
      thickness: 40,
      value: val,
      reveal: rIn,
      show7: true,
      show85: true,
      emphasize7: 0.6,
      emphasize85: 0.6,
      labelSide: "bottom",
      showLabels: true,
      fontScale,
      seed: 91,
      frame,
      inkMotif: true,
    });
    const gp = easeOutCubic(progress(rl, 14, 30));
    if (gp > 0.01) {
      gapMarker(
        ctx,
        { x: pos(7), y: -46 },
        { x: pos(8.5), y: -46 },
        gp,
        pal.cinnabar,
        93,
        22,
        frame,
      );
    }
    ctx.restore();
  }

  // 左下朱印「存茶留余」
  const pl = frame - SEAL_AT;
  if (pl > 0) {
    drawSeal(ctx, {
      text: t(params, "seal"),
      x: SEAL_POS.x,
      y: SEAL_POS.y,
      size: SEAL_POS.size * fontScale ** 0.5,
      pose: sealPress(pl, { lift: SEAL_LIFT, press: SEAL_PRESS, height: 95, rot: -0.06 }),
      color: pal.cinnabar,
      paper: pal.paper,
      font: SEAL_FONT,
      seed: 42,
    });
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
