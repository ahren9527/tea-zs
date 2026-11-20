/**
 * 第 22 期 B1「三道关」逐帧画布（1080×1920）
 */
import {
  TAU,
  cameraAt,
  cameraKick,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  lightFloat,
  mixHex,
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
import { drawPeBag, drawSuxueCake } from "../kit/objects";
import {
  BAGS_AT,
  CAKE_ASIDE_DX,
  CAKE_AT,
  CAKE_CENTER_X,
  CAKE_Y,
  CROSS_AT,
  G1_AT,
  G2_AT,
  G3_AT,
  LENGTH,
  SUM_AT,
  TEXT,
  WORD_X,
  WORD_Y,
  WRONG_OUT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const ASIDE_SPRING = { stiffness: 92, damping: 11, mass: 1 };

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.06,
    drift: 5,
    focus: [
      { at: BAGS_AT, dur: 20, x: 540, y: 880, zoom: 1.02, pull: 0.16 },
      { at: CAKE_AT, dur: 22, x: 540, y: CAKE_Y, zoom: 1.03, pull: 0.2 },
      { at: G1_AT, dur: 18, x: 510, y: 860, zoom: 1.04, pull: 0.18 },
      { at: SUM_AT, dur: 24, x: 540, y: 880, zoom: 1.01, pull: 0.14 },
    ],
  });
  for (const [at, amp] of [
    [CROSS_AT + 4, 4],
    [G1_AT, 3.5],
    [G2_AT, 3.5],
    [G3_AT, 4],
    [SUM_AT + 2, 5.5],
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
  renderLayers(ctx, frame, pal, cam, {
    leaves: 4,
    subject: (p) => {
      drawWrongPhase(ctx, frame, p, params, fontScale);
      drawThreeGatesPhase(ctx, frame, p, params, fontScale);
    },
  });
}

function drawWrongPhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const out = easeInOutCubic(progress(frame, WRONG_OUT, WRONG_OUT + 14));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 三个歪斜套一起的杂乱袋子
  const bags = [
    { dx: -68, dy: 28, rot: -0.14, w: 320, h: 390, delay: 0 },
    { dx: 54, dy: -16, rot: 0.11, w: 330, h: 400, delay: 5 },
    { dx: -10, dy: 4, rot: -0.04, w: 350, h: 420, delay: 10 },
  ];
  bags.forEach((b, i) => {
    const pose = heavyLand(frame - (BAGS_AT + b.delay), { drop: 110, fall: 8, squash: 0.05 });
    if (pose.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(540 + b.dx, 900 + b.dy + pose.y);
    ctx.rotate(b.rot);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawPeBag(ctx, pal, b.w, b.h, {
      mode: i === 2 ? "ziplock" : "flat",
      thickEdge: 0.15,
      leak: 0.4,
      frame,
    });
    ctx.restore();
  });

  // 上方文案「随便套三层」
  const titleP = easeOutCubic(progress(frame, BAGS_AT + 6, BAGS_AT + 20));
  if (titleP > 0) {
    const txt = t(params, "wrong");
    const fs = fitSize(txt, 118, 760) * fontScale;
    inkText(ctx, txt, 540, 500, fs, titleP, 11, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }

  // 朱砂毛笔大叉划掉
  const cp = progress(frame, CROSS_AT, CROSS_AT + 16);
  brushCross(ctx, 540, 880, 460, cp, pal.cinnabar, 17, 22);

  ctx.restore();
}

function drawThreeGatesPhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const cl = frame - CAKE_AT;
  if (cl <= 0) return;

  // 素雪茶饼居中落定 → 「封气」出现时带回弹向右让位（字左物右）
  const land = heavyLand(cl, { drop: 140, fall: 9, squash: 0.05 });
  const aside = CAKE_ASIDE_DX * springValue(frame - (G1_AT - 2), ASIDE_SPRING);
  const cx = CAKE_CENTER_X + aside;
  const cy = CAKE_Y;

  ctx.save();
  ctx.globalAlpha = land.alpha;
  ctx.translate(cx, cy + land.y);
  ctx.scale(land.scaleX, land.scaleY);
  drawSuxueCake(ctx, pal, 156, { lift: Math.min(1, -land.y / 140), seed: 22 });
  ctx.restore();

  // 三道防护层由内向外随口播依次画满
  const layers = [
    { at: G1_AT, r: 182, color: pal.bamboo, w: 9, dash: [14, 10] as number[], rot: -0.4 },
    { at: G2_AT, r: 212, color: mixHex(pal.ink, "#8d8a82", 0.55), w: 12, dash: [] as number[], rot: 0.8 },
    { at: G3_AT, r: 242, color: pal.tea, w: 10, dash: [] as number[], rot: -1.1 },
  ];
  layers.forEach((rg) => {
    const rl = frame - rg.at;
    if (rl <= 0) return;
    const p = easeOutCubic(progress(rl, 0, 16));
    ctx.save();
    ctx.globalAlpha = Math.min(1, rl / 5);
    ctx.translate(cx, cy);
    ctx.strokeStyle = rg.color;
    ctx.lineWidth = rg.w;
    ctx.lineCap = "round";
    if (rg.dash.length) ctx.setLineDash(rg.dash);
    ctx.beginPath();
    ctx.arc(0, 0, rg.r, rg.rot, rg.rot + TAU * Math.min(p, 0.9995));
    ctx.stroke();
    ctx.restore();
  });

  // 左侧三道关大字（随口播依次压落）
  const gates: [TextKey, number, string][] = [
    ["g1", G1_AT, pal.bamboo],
    ["g2", G2_AT, pal.ink],
    ["g3", G3_AT, pal.tea],
  ];
  gates.forEach(([key, at, color], i) => {
    const wl = frame - (at - 4);
    if (wl <= 0) return;
    const txt = t(params, key);
    const pose = heavyLand(wl, { drop: 70, fall: 6, squash: 0.07 });
    const fs = fitSize(txt, 146, 360) * fontScale;
    ctx.save();
    ctx.globalAlpha = Math.min(1, wl / 4);
    ctx.translate(WORD_X, WORD_Y[i] + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    inkText(ctx, txt, 0, 0, fs, easeOutCubic(progress(wl, 0, 12)), 40 + i * 7, {
      color,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
    ctx.restore();
  });

  // 顶部「三道关」收束大字 + 朱砂笔圈
  const sl = frame - (SUM_AT - 4);
  if (sl > 0) {
    const txt = t(params, "sum");
    const pose = lightFloat(sl, { rise: 24, sway: 0.6, seed: 3 });
    const fs = fitSize(txt, 134, 620) * fontScale;
    inkText(ctx, txt, 540, 410 + pose.y, fs, easeOutCubic(progress(sl, 0, 12)), 88, {
      color: pal.cinnabar,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    brushRing(ctx, 540, 410, 260, 108, progress(sl, 6, 22), rgba(pal.cinnabar, 0.85), 91, 7);
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "素雪白牡丹茶正上茶舍一叶倾心净含量克");
}
