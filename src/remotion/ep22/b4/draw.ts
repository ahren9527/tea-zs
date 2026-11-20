/**
 * 第 22 期 B4「鹅颈封口」逐帧画布（1080×1920）
 */
import {
  cameraAt,
  cameraKick,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  lightFloat,
  progress,
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
  life,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawGooseneckBag, drawPeBag, drawSuxueCake } from "../kit/objects";
import {
  ACT1_OUT,
  ACT2_OUT,
  COTTON_IN,
  COTTON_SLIDE,
  CROSS_AT,
  FLAT_IN,
  FOLD_AT,
  LEAK_AT,
  LENGTH,
  SQUEEZE_AT,
  TEXT,
  TIE1_AT,
  TIE2_AT,
  TWIST_AT,
  ZIP_AT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.06,
    drift: 5,
    focus: [
      { at: ZIP_AT, dur: 20, x: 540, y: 920, zoom: 1.02, pull: 0.16 },
      { at: FLAT_IN, dur: 22, x: 540, y: 980, zoom: 1.02, pull: 0.16 },
      { at: TWIST_AT, dur: 22, x: 540, y: 830, zoom: 1.07, pull: 0.24 },
      { at: TIE1_AT, dur: 20, x: 540, y: 800, zoom: 1.08, pull: 0.26 },
      { at: COTTON_IN, dur: 24, x: 540, y: 960, zoom: 1.03, pull: 0.18 },
    ],
  });
  for (const [at, amp] of [
    [CROSS_AT + 3, 4.5],
    [TIE1_AT, 4],
    [TIE2_AT, 5],
    [COTTON_SLIDE + 2, 3.5],
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
    leaves: 3,
    subject: (p) => {
      drawActZipBad(ctx, frame, p, params, fontScale);
      drawActGooseneck(ctx, frame, p, params, fontScale);
      drawActCottonPaper(ctx, frame, p, params, fontScale);
    },
  });
}

// ================= 幕一：拉链自封口老化慢漏气 × =================
function drawActZipBad(
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

  const pose = heavyLand(frame - ZIP_AT, { drop: 110, fall: 8, squash: 0.05 });
  if (pose.alpha > 0) {
    const leak = easeOutCubic(progress(frame, LEAK_AT, LEAK_AT + 18));
    ctx.save();
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(540, 1020 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawPeBag(ctx, pal, 470, 560, {
      mode: "ziplock",
      leak,
      thickEdge: 0.25,
      frame,
      inside: () => {
        ctx.save();
        ctx.translate(0, 42);
        drawSuxueCake(ctx, pal, 175, { seed: 22 });
        ctx.restore();
      },
    });
    ctx.restore();
  }

  // 顶部警示大字「拉链慢漏气」+ 朱砂叉
  const hl = frame - (LEAK_AT - 2);
  if (hl > 0) {
    const txt = t(params, "zipBad");
    const poseT = lightFloat(hl, { rise: 22, sway: 0.5, seed: 5 });
    inkText(ctx, txt, 540, 430 + poseT.y, fitSize(txt, 120, 760) * fontScale, easeOutCubic(progress(hl, 0, 12)), 21, {
      color: pal.cinnabar,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }
  brushCross(ctx, 540, 1010, 440, progress(frame, CROSS_AT, CROSS_AT + 16), pal.cinnabar, 27, 22);

  ctx.restore();
}

// ================= 幕二：平口袋鹅颈两道扎带步步演示 =================
function drawActGooseneck(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < FLAT_IN) return;
  const out = easeInOutCubic(progress(frame, ACT2_OUT, ACT2_OUT + 12));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 顶部步进大字：每步只显示当前那一句（≤5字，干净单焦点）
  const steps: [TextKey, number, number, string][] = [
    ["flatTag", FLAT_IN, SQUEEZE_AT - 4, pal.ink],
    ["step1", SQUEEZE_AT - 2, TWIST_AT - 4, pal.bamboo],
    ["step2", TWIST_AT - 2, FOLD_AT - 4, pal.ink],
    ["step3", FOLD_AT - 2, TIE1_AT - 6, pal.tea],
    ["step4", TIE1_AT - 4, ACT2_OUT + 12, pal.cinnabar],
  ];
  steps.forEach(([key, at, endAt, color], idx) => {
    const a = life(frame, at, endAt, 10, 8);
    if (a <= 0.01) return;
    const txt = t(params, key);
    ctx.save();
    ctx.globalAlpha *= a;
    inkText(ctx, txt, 540, 415, fitSize(txt, 128, 780) * fontScale, 1, 40 + idx * 7, {
      color,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
    ctx.restore();
  });

  // 核心平口袋鹅颈演示
  const pose = heavyLand(frame - FLAT_IN, { drop: 110, fall: 8, squash: 0.04 });
  if (pose.alpha > 0) {
    const squeeze = easeInOutCubic(progress(frame, SQUEEZE_AT, SQUEEZE_AT + 24));
    const twist = easeInOutCubic(progress(frame, TWIST_AT, TWIST_AT + 22));
    const fold = easeInOutCubic(progress(frame, FOLD_AT, FOLD_AT + 24));
    const tie1 = easeOutCubic(progress(frame, TIE1_AT, TIE1_AT + 12));
    const tie2 = easeOutCubic(progress(frame, TIE2_AT, TIE2_AT + 12));

    ctx.save();
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(540, 1000 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawGooseneckBag(ctx, pal, { squeeze, twist, fold, tie1, tie2, frame });
    ctx.restore();
  }

  ctx.restore();
}

// ================= 幕三：素雪带原装棉纸直接装 =================
function drawActCottonPaper(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < COTTON_IN) return;
  const cl = frame - COTTON_IN;

  // 顶部大字「原装棉纸别拆」
  const txt = t(params, "cotton");
  const poseT = lightFloat(cl, { rise: 22, sway: 0.5, seed: 13 });
  inkText(ctx, txt, 540, 420 + poseT.y, fitSize(txt, 114, 780) * fontScale, easeOutCubic(progress(cl, 0, 12)), 83, {
    color: pal.bamboo,
    weight: 900,
    font: SONG,
    wash: 0.03,
  });

  // 素雪茶饼带棉纸从上方稳稳滑进透明加厚 PE 平口袋
  const slideP = easeInOutCubic(progress(frame, COTTON_SLIDE, COTTON_SLIDE + 24));
  const bagPose = heavyLand(cl - 2, { drop: 100, fall: 8, squash: 0.04 });
  const cakeDy = -170 * (1 - slideP);

  if (bagPose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha = bagPose.alpha;
    ctx.translate(540, 1040 + bagPose.y);
    ctx.scale(bagPose.scaleX, bagPose.scaleY);
    drawPeBag(ctx, pal, 520, 540, {
      mode: "flat",
      thickEdge: 0.85,
      inside: () => {
        ctx.save();
        ctx.translate(0, 18 + cakeDy);
        drawSuxueCake(ctx, pal, 205, { seed: 22 });
        ctx.restore();
      },
    });
    // 若还在滑入袋口上方，在袋口上方也完整露出茶饼上半部，不被裁剪截断
    if (slideP < 0.85) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(-340, -520, 680, 260);
      ctx.clip();
      ctx.translate(0, 18 + cakeDy);
      drawSuxueCake(ctx, pal, 205, { seed: 22 });
      ctx.restore();
    }
    ctx.restore();
  }

  // 竹青毛笔圈住棉纸茶饼，强调「别拆」
  brushRing(ctx, 540, 1055, 248, 248, progress(frame, COTTON_SLIDE + 10, COTTON_SLIDE + 28), pal.bamboo, 91, 8);
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "素雪白牡丹茶正上茶舍一叶倾心净含量克");
}
