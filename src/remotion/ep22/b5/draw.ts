/**
 * 第 22 期 B5「二层纯铝」逐帧画布（1080×1920）
 */
import {
  cameraAt,
  cameraKick,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  lightFloat,
  progress,
  rgba,
  springValue,
  type FxPalette,
} from "../kit/fx";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  beginFrame,
  brushCross,
  brushRing,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawFoilBag } from "../kit/objects";
import {
  ACT1_OUT,
  BLOCK1_AT,
  BLOCK2_AT,
  BLOCK3_AT,
  CREASE_AT,
  FAKE_CROSS,
  FAKE_GLOW,
  FAKE_IN,
  FAKE_OUT,
  FOIL_AT,
  HEAD_AT,
  LENGTH,
  REAL_IN,
  REAL_TAG,
  TEXT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const ASIDE_SPRING = { stiffness: 90, damping: 11, mass: 1 };

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.06,
    drift: 5,
    focus: [
      { at: FOIL_AT, dur: 20, x: 540, y: 940, zoom: 1.02, pull: 0.16 },
      { at: FAKE_IN, dur: 22, x: 540, y: 960, zoom: 1.04, pull: 0.2 },
      { at: REAL_IN, dur: 22, x: 540, y: 960, zoom: 1.04, pull: 0.2 },
      { at: CREASE_AT, dur: 20, x: 640, y: 800, zoom: 1.08, pull: 0.24 },
    ],
  });
  for (const [at, amp] of [
    [FAKE_CROSS + 2, 4.5],
    [CREASE_AT + 4, 4],
    [REAL_TAG + 2, 5],
  ] as const) {
    const k = cameraKick(frame - at, amp);
    cam.x -= k.x;
    cam.y -= k.y;
  }
  return cam;
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame, pal, fontScale } = beginFrame(ctx, elapsed, params);
  const cam = beatCamera(frame);
  // 强光测试时略压暗环境窗光，让透光 / 挡光对比更鲜明
  const testDim = easeInOutCubic(progress(frame, FAKE_IN, FAKE_IN + 18));
  renderLayers(ctx, frame, pal, cam, {
    leaves: 3,
    light: 1 - testDim * 0.48,
    subject: (p) => {
      drawActShield(ctx, frame, p, params, fontScale);
      drawActFakeFoil(ctx, frame, p, params, fontScale);
      drawActRealFoil(ctx, frame, p, params, fontScale);
    },
  });
}

// ================= 幕一：纯铝箔袋阻隔三害 =================
function drawActShield(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const out = easeInOutCubic(progress(frame, ACT1_OUT, ACT1_OUT + 12));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 顶部「二层 · 挡住光」
  const hl = frame - HEAD_AT;
  if (hl > 0) {
    const txt = t(params, "head");
    const pose = lightFloat(hl, { rise: 22, sway: 0.5, seed: 3 });
    inkText(ctx, txt, 540, 390 + pose.y, fitSize(txt, 114, 780) * fontScale, easeOutCubic(progress(hl, 0, 14)), 13, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }

  // 纯铝箔袋落位并随左侧字出现弹簧右让
  const fl = frame - FOIL_AT;
  const aside = 170 * springValue(frame - (BLOCK1_AT - 2), ASIDE_SPRING);
  const fx = 540 + aside;
  const fy = 975;

  if (fl > 0) {
    const pose = heavyLand(fl, { drop: 120, fall: 9, squash: 0.05 });
    ctx.save();
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(fx, fy + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawFoilBag(ctx, pal, 410, 520, { pure: true });
    ctx.restore();
  }

  // 左侧三行大字「挡光 / 隔水汽 / 隔箱味」
  const rows: [TextKey, number, number, string][] = [
    ["b1", BLOCK1_AT, 710, pal.tea],
    ["b2", BLOCK2_AT, 975, pal.bamboo],
    ["b3", BLOCK3_AT, 1240, pal.ink],
  ];
  rows.forEach(([key, at, y, color], i) => {
    const l = frame - (at - 4);
    if (l <= 0) return;
    const txt = t(params, key);
    const pose = heavyLand(l, { drop: 64, fall: 6, squash: 0.07 });
    ctx.save();
    ctx.globalAlpha *= Math.min(1, l / 4);
    ctx.translate(265, y + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    inkText(ctx, txt, 0, 0, fitSize(txt, 118, 360) * fontScale, easeOutCubic(progress(l, 0, 12)), 29 + i * 7, {
      color,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
    ctx.restore();
  });

  ctx.restore();
}

// ================= 幕二A：镀铝袋照强光透亮 × =================
function drawActFakeFoil(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < FAKE_IN) return;
  const out = easeInOutCubic(progress(frame, FAKE_OUT, FAKE_OUT + 12));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  const glow = easeOutCubic(progress(frame, FAKE_GLOW - 6, FAKE_GLOW + 14));
  const pose = heavyLand(frame - FAKE_IN, { drop: 110, fall: 8, squash: 0.04 });
  if (pose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(540, 1000 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawFoilBag(ctx, pal, 460, 560, { pure: false, backlight: glow });
    ctx.restore();
  }

  // 顶部「镀铝 · 透光」+ 朱砂叉
  const tl = frame - (FAKE_GLOW - 2);
  if (tl > 0) {
    const txt = t(params, "fake");
    const poseT = lightFloat(tl, { rise: 22, sway: 0.5, seed: 8 });
    inkText(ctx, txt, 540, 420 + poseT.y, fitSize(txt, 116, 780) * fontScale, easeOutCubic(progress(tl, 0, 12)), 53, {
      color: pal.cinnabar,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }
  brushCross(ctx, 540, 990, 440, progress(frame, FAKE_CROSS, FAKE_CROSS + 16), pal.cinnabar, 59, 22);

  ctx.restore();
}

// ================= 幕二B：真纯铝不透光 + 硬折痕不回弹 ✓ =================
function drawActRealFoil(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < REAL_IN) return;
  const rl = frame - REAL_IN;
  const pose = heavyLand(rl, { drop: 110, fall: 8, squash: 0.04 });
  const crease = easeOutCubic(progress(frame, CREASE_AT, CREASE_AT + 18));

  if (pose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha = pose.alpha;
    ctx.translate(540, 1000 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawFoilBag(ctx, pal, 460, 560, {
      pure: true,
      backlight: 0.92,
      foldCrease: crease,
    });
    ctx.restore();
  }

  // 顶部「真纯铝 · 不透光」+ 竹青笔圈
  const tl = frame - (REAL_TAG - 6);
  if (tl > 0) {
    const txt = t(params, "real");
    const poseT = heavyLand(tl, { drop: 60, fall: 6, squash: 0.06 });
    ctx.save();
    ctx.globalAlpha = Math.min(1, tl / 4);
    ctx.translate(540, 420 + poseT.y);
    ctx.scale(poseT.scaleX, poseT.scaleY);
    inkText(ctx, txt, 0, 0, fitSize(txt, 110, 820) * fontScale, easeOutCubic(progress(tl, 0, 12)), 71, {
      color: pal.bamboo,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    ctx.restore();
    brushRing(ctx, 540, 420, 410, 96, progress(tl, 6, 22), rgba(pal.bamboo, 0.85), 77, 7);
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
