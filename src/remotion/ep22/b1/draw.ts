/**
 * 第 22 期 B1「三道关」逐帧画布（1080×1920）
 */
import {
  END_STILL_FRAMES,
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
    to: 1.05,
    drift: 4,
    focus: [
      { at: BAGS_AT, dur: 18, x: 520, y: 940, zoom: 1.02, pull: 0.14 },
      { at: CAKE_AT, dur: 20, x: 520, y: CAKE_Y, zoom: 1.03, pull: 0.18 },
      { at: G1_AT, dur: 18, x: 500, y: 920, zoom: 1.03, pull: 0.16 },
      { at: SUM_AT, dur: 20, x: 520, y: 900, zoom: 1.01, pull: 0.12 },
    ],
  });
  for (const [at, amp] of [
    [CROSS_AT + 4, 4],
    [G1_AT, 3.2],
    [G2_AT, 3.2],
    [G3_AT, 3.6],
    [SUM_AT + 2, 5],
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
  const stillFrame = Math.min(frame, Math.max(0, LENGTH - END_STILL_FRAMES));
  renderLayers(ctx, stillFrame, pal, cam, {
    leaves: 3,
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
  const out = easeInOutCubic(progress(frame, WRONG_OUT, WRONG_OUT + 12));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 三个歪斜套一起的杂乱袋子（整体约占画幅宽度 56%，开场 0.5 秒内即完整呈现）
  const bags = [
    { dx: -92, dy: 34, rot: -0.14, w: 430, h: 510, delay: 0 },
    { dx: 78, dy: -22, rot: 0.11, w: 445, h: 525, delay: 3 },
    { dx: -8, dy: 6, rot: -0.04, w: 470, h: 555, delay: 6 },
  ];
  bags.forEach((b, i) => {
    const local = frame - (BAGS_AT + b.delay);
    const pose = heavyLand(local + 3, { drop: 90, fall: 7, squash: 0.05 });
    if (pose.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(520 + b.dx, 990 + b.dy + pose.y);
    ctx.rotate(b.rot);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawPeBag(ctx, pal, b.w, b.h, {
      mode: i === 2 ? "ziplock" : "flat",
      thickEdge: 0.15,
      leak: 0.45,
      frame,
    });
    ctx.restore();
  });

  // 上方文案「随便套三层」（与袋子在 0.5 秒内同步进场，安全居中）
  const titleP = easeOutCubic(progress(frame + 2, BAGS_AT, BAGS_AT + 12));
  if (titleP > 0) {
    const txt = t(params, "wrong");
    const fs = fitSize(txt, 124, 780) * fontScale;
    inkText(ctx, txt, 520, 420, fs, Math.max(0.2, titleP), 11, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }

  // 朱砂毛笔大叉划掉
  const cp = progress(frame, CROSS_AT, CROSS_AT + 15);
  brushCross(ctx, 520, 980, 520, cp, pal.cinnabar, 17, 24);

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

  // 素雪茶饼居中大气落定 → 「封气」出现时带回弹向右让位并微缩至安全右边界内（字左物右）
  const land = heavyLand(cl, { drop: 130, fall: 8, squash: 0.05 });
  const asideSp = springValue(frame - (G1_AT - 2), ASIDE_SPRING);
  const aside = CAKE_ASIDE_DX * asideSp;
  const cx = CAKE_CENTER_X + aside;
  const cy = CAKE_Y;
  // 居中时直径约 440px，让位后茶饼+三圈总宽约 480px，右缘 680+240=920 < 960 安全线
  const cakeScale = 1 - 0.18 * Math.min(1.08, Math.max(0, asideSp));

  ctx.save();
  ctx.globalAlpha = land.alpha;
  ctx.translate(cx, cy + land.y);
  ctx.scale(land.scaleX * cakeScale, land.scaleY * cakeScale);
  drawSuxueCake(ctx, pal, 212, { lift: Math.min(1, -land.y / 130), seed: 22 });
  ctx.restore();

  // 三道防护层由内向外随口播依次画满（右缘最大 680 + 238 = 918 < 960）
  const layers = [
    { at: G1_AT, r: 184, color: pal.bamboo, w: 9, dash: [14, 10] as number[], rot: -0.4 },
    { at: G2_AT, r: 211, color: mixHex(pal.ink, "#6c7b88", 0.55), w: 11, dash: [] as number[], rot: 0.8 },
    { at: G3_AT, r: 238, color: pal.tea, w: 10, dash: [] as number[], rot: -1.1 },
  ];
  layers.forEach((rg) => {
    const rl = frame - rg.at;
    if (rl <= 0) return;
    const p = easeOutCubic(progress(rl, 0, 14));
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

  // 左侧三道关大字（与右侧三圈拉开充裕间距，互不挤压）
  const gates: [TextKey, number, string][] = [
    ["g1", G1_AT, pal.bamboo],
    ["g2", G2_AT, pal.ink],
    ["g3", G3_AT, pal.tea],
  ];
  gates.forEach(([key, at, color], i) => {
    const wl = frame - (at - 4);
    if (wl <= 0) return;
    const txt = t(params, key);
    const pose = heavyLand(wl, { drop: 64, fall: 6, squash: 0.07 });
    const fs = fitSize(txt, 144, 330) * fontScale;
    ctx.save();
    ctx.globalAlpha = Math.min(1, wl / 4);
    ctx.translate(WORD_X, WORD_Y[i] + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    inkText(ctx, txt, 0, 0, fs, easeOutCubic(progress(wl, 0, 11)), 40 + i * 7, {
      color,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
    ctx.restore();
  });

  // 顶部「三道关」收束大字 + 朱砂笔圈（在片尾 0.5 秒前落定静止）
  const sl = frame - (SUM_AT - 4);
  if (sl > 0) {
    const txt = t(params, "sum");
    const pose = lightFloat(Math.min(sl, LENGTH - 15 - (SUM_AT - 4)), { rise: 22, sway: 0.4, seed: 3 });
    const fs = fitSize(txt, 136, 620) * fontScale;
    inkText(ctx, txt, 520, 415 + pose.y, fs, easeOutCubic(progress(sl, 0, 11)), 88, {
      color: pal.cinnabar,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    brushRing(ctx, 520, 415, 260, 108, progress(sl, 5, 19), rgba(pal.cinnabar, 0.85), 91, 7);
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "素雪白牡丹茶正上茶舍一叶倾心净含量克");
}

