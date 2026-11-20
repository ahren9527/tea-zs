/**
 * 第 22 期 B4「鹅颈封口」逐帧画布（1080×1920）
 * 升级：主体放大至 52–54% 画幅宽 + 避开右侧 120px / 底部 300px 遮挡 +
 *       幕三茶饼从「要是存茶饼」起缓缓滑入平口袋，到「带着棉纸」刚好稳稳落定（衔接 B5 素雪位置）。
 */
import {
  END_STILL_FRAMES,
  cameraAt,
  cameraKick,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  lightFloat,
  progress,
  progressRaw,
  rgba,
  type Camera,
  type FxPalette,
} from "../kit/fx";
import { STAGE, type AnimParams } from "@/remotion/shared/theme";
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

type CamRig = {
  cam: Camera;
  yaw: number;
  pitch: number;
  roll: number;
};

function beatCameraRig(frame: number): CamRig {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.06,
    drift: 4.5,
    focus: [
      { at: ZIP_AT, dur: 18, x: 520, y: 940, zoom: 1.02, pull: 0.14 },
      { at: LEAK_AT, dur: 18, x: 520, y: 820, zoom: 1.05, pull: 0.2 },
      { at: FLAT_IN, dur: 20, x: 520, y: 980, zoom: 1.02, pull: 0.14 },
      { at: SQUEEZE_AT, dur: 20, x: 520, y: 990, zoom: 1.04, pull: 0.18 },
      { at: TWIST_AT, dur: 20, x: 520, y: 830, zoom: 1.07, pull: 0.22 },
      { at: FOLD_AT, dur: 20, x: 515, y: 810, zoom: 1.08, pull: 0.24 },
      { at: TIE1_AT, dur: 20, x: 520, y: 820, zoom: 1.09, pull: 0.26 },
      { at: COTTON_IN, dur: 22, x: 520, y: 970, zoom: 1.02, pull: 0.16 },
    ],
  });
  for (const [at, amp] of [
    [CROSS_AT + 3, 4.2],
    [TIE1_AT, 4.0],
    [TIE2_AT, 5.0],
    [COTTON_SLIDE, 3.2],
  ] as const) {
    const k = cameraKick(frame - at, amp);
    cam.x -= k.x;
    cam.y -= k.y;
  }

  // 片尾最后 0.5 秒（15 帧）收住透视摇摆，保持完全静止
  const stillF = Math.min(frame, LENGTH - 15);
  const normX = cam.x / 120;
  const normY = cam.y / 160;
  const stepSway =
    Math.sin(stillF * 0.024) * 0.16 +
    easeInOutCubic(progress(stillF, FOLD_AT, FOLD_AT + 24)) *
      (1 - easeInOutCubic(progress(stillF, ACT2_OUT, ACT2_OUT + 12))) *
      0.22;
  const yaw = Math.max(-1, Math.min(1, normX * 0.8 + stepSway));
  const pitch = Math.max(-1, Math.min(1, normY * 0.8 - 0.07 * Math.cos(stillF * 0.02)));
  const roll = -yaw * 0.007 + Math.sin(stillF * 0.017) * 0.002;

  return { cam, yaw, pitch, roll };
}

function applyPerspective(
  ctx: CanvasRenderingContext2D,
  rig: CamRig,
  strength = 1,
  pivotX = 520,
  pivotY = STAGE.height / 2,
) {
  ctx.translate(pivotX, pivotY);
  ctx.rotate(rig.roll * strength);
  const sx = 1 - Math.abs(rig.yaw) * 0.016 * strength;
  const sy = 1 - Math.abs(rig.pitch) * 0.014 * strength;
  const skewX = -rig.yaw * 0.013 * strength;
  const skewY = (rig.pitch * 0.009 + rig.yaw * 0.008) * strength;
  ctx.transform(sx, skewY, skewX, sy, 0, 0);
  ctx.translate(-pivotX, -pivotY);
}

function applyDeltaParallax(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  deltaDepth: number,
  pivotX = 520,
  pivotY = STAGE.height / 2,
) {
  const dx = -cam.x * deltaDepth;
  const dy = -cam.y * deltaDepth;
  const dz = 1 + (cam.scale - 1) * deltaDepth;
  ctx.translate(pivotX + dx, pivotY + dy);
  ctx.scale(dz, dz);
  ctx.translate(-pivotX, -pivotY);
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame, pal, fontScale } = beginFrame(ctx, elapsed, params);
  const rig = beatCameraRig(frame);
  const stillFrame = Math.min(frame, Math.max(0, LENGTH - END_STILL_FRAMES));
  renderLayers(ctx, stillFrame, pal, rig.cam, {
    leaves: 3,
    back: (p) => drawBackdropAura(ctx, frame, p, rig),
    subject: (p) => {
      drawActZipBad(ctx, frame, p, params, fontScale, rig);
      drawActGooseneck(ctx, frame, p, params, fontScale, rig);
      drawActCottonPaper(ctx, frame, p, params, fontScale, rig);
    },
  });
}

function drawBackdropAura(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  rig: CamRig,
) {
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, -0.14);

  const act1A = 1 - easeInOutCubic(progress(frame, ACT1_OUT, ACT1_OUT + 12));
  const act2A =
    easeOutCubic(progress(frame, FLAT_IN, FLAT_IN + 14)) *
    (1 - easeInOutCubic(progress(frame, ACT2_OUT, ACT2_OUT + 12)));
  const act3A = easeOutCubic(progress(frame, COTTON_IN, COTTON_IN + 14));

  const cx = 520;
  const cy = 1000;
  if (act1A > 0.02) {
    const g = ctx.createRadialGradient(cx, cy, 40, cx, cy, 520);
    g.addColorStop(0, rgba(pal.cinnabar, 0.055 * act1A));
    g.addColorStop(0.55, rgba(pal.ink, 0.028 * act1A));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 320, STAGE.width, 1260);
  }
  if (act2A > 0.02) {
    const g2 = ctx.createRadialGradient(cx, cy - 30, 50, cx, cy, 540);
    g2.addColorStop(0, rgba(pal.bamboo, 0.062 * act2A));
    g2.addColorStop(0.55, rgba(pal.tea, 0.032 * act2A));
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 320, STAGE.width, 1260);
  }
  if (act3A > 0.02) {
    const g3 = ctx.createRadialGradient(cx, cy + 20, 50, cx, cy, 520);
    g3.addColorStop(0, rgba(pal.bamboo, 0.07 * act3A));
    g3.addColorStop(0.55, rgba(pal.ink, 0.025 * act3A));
    g3.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g3;
    ctx.fillRect(0, 320, STAGE.width, 1260);
  }
  ctx.restore();
}

// ================= 幕一：拉链自封口老化慢漏气 × =================
function drawActZipBad(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
  rig: CamRig,
) {
  const out = easeInOutCubic(progress(frame, ACT1_OUT, ACT1_OUT + 12));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 主体袋放大至 560×640（52% 画幅宽），开场即现，安全居中于 x = 520
  const pose = heavyLand(frame - ZIP_AT + 4, { drop: 90, fall: 8, squash: 0.05 });
  if (pose.alpha > 0) {
    const leak = easeOutCubic(progress(frame, LEAK_AT, LEAK_AT + 16));
    ctx.save();
    applyPerspective(ctx, rig, 0.72, 520, 1020);
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(520, 1020 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawPeBag(ctx, pal, 560, 640, {
      mode: "ziplock",
      leak,
      thickEdge: 0.25,
      frame,
      inside: () => {
        ctx.save();
        ctx.translate(0, 44);
        drawSuxueCake(ctx, pal, 205, { seed: 22 });
        ctx.restore();
      },
    });
    ctx.restore();
  }

  // 前景警示大字 + 朱砂叉
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, 0.05);
  applyPerspective(ctx, rig, 0.36, 520, 760);
  const hl = frame - (LEAK_AT - 2);
  if (hl > 0) {
    const txt = t(params, "zipBad");
    const poseT = lightFloat(hl, { rise: 20, sway: 0.45, seed: 5 });
    inkText(ctx, txt, 520, 415 + poseT.y, fitSize(txt, 124, 780) * fontScale, easeOutCubic(progress(hl, 0, 12)), 21, {
      color: pal.cinnabar,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }
  brushCross(ctx, 520, 1015, 500, progress(frame, CROSS_AT, CROSS_AT + 16), pal.cinnabar, 27, 23);
  ctx.restore();

  ctx.restore();
}

// ================= 幕二：平口袋鹅颈两道扎带步步演示 =================
function drawActGooseneck(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
  rig: CamRig,
) {
  if (frame < FLAT_IN) return;
  const out = easeInOutCubic(progress(frame, ACT2_OUT, ACT2_OUT + 12));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 鹅颈袋放大 1.14×（袋宽 550px ≈ 画幅 51%），安全居中于 x = 520
  const pose = heavyLand(frame - FLAT_IN, { drop: 100, fall: 8, squash: 0.04 });
  if (pose.alpha > 0) {
    const squeeze = easeInOutCubic(progress(frame, SQUEEZE_AT, SQUEEZE_AT + 24));
    const twist = easeInOutCubic(progress(frame, TWIST_AT, TWIST_AT + 22));
    const fold = easeInOutCubic(progress(frame, FOLD_AT, FOLD_AT + 24));
    const tie1 = easeOutCubic(progress(frame, TIE1_AT, TIE1_AT + 12));
    const tie2 = easeOutCubic(progress(frame, TIE2_AT, TIE2_AT + 12));

    const lockPunch =
      Math.sin(progress(frame, TIE1_AT, TIE1_AT + 12) * Math.PI) * 0.016 +
      Math.sin(progress(frame, TIE2_AT, TIE2_AT + 12) * Math.PI) * 0.022;

    ctx.save();
    applyPerspective(ctx, rig, 0.76, 520, 990);
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(520, 1020 + pose.y);
    ctx.scale(1.14 * pose.scaleX * (1 - lockPunch), 1.14 * pose.scaleY * (1 + lockPunch * 0.65));
    drawGooseneckBag(ctx, pal, { squeeze, twist, fold, tie1, tie2, frame });
    ctx.restore();
  }

  // 顶部步进大字
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, 0.05);
  applyPerspective(ctx, rig, 0.34, 520, 680);

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
    inkText(ctx, txt, 520, 405, fitSize(txt, 130, 780) * fontScale, 1, 40 + idx * 7, {
      color,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
    ctx.restore();
  });

  ctx.restore();
  ctx.restore();
}

// ================= 幕三：素雪带原装棉纸慢慢入袋，到「带着棉纸」刚好落定 =================
function drawActCottonPaper(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
  rig: CamRig,
) {
  if (frame < COTTON_IN) return;
  const cl = frame - COTTON_IN;
  const stillF = Math.min(frame, LENGTH - 15);

  // 从「要是存茶饼」（COTTON_IN + 8）起就匀速柔和滑入，到「带着棉纸」（COTTON_SLIDE）刚好稳稳落底
  const slideP = easeInOutCubic(progressRaw(frame, COTTON_IN + 8, COTTON_SLIDE));
  const bagPose = heavyLand(cl, { drop: 90, fall: 8, squash: 0.04 });
  const cakeDy = -225 * (1 - slideP);
  const mouthStretch = Math.sin(slideP * Math.PI) * 0.03;

  // 袋宽 580×600（54% 画幅宽），位置 (520, 1030) 与下一镜 B5 素雪开场同位衔接
  if (bagPose.alpha > 0) {
    ctx.save();
    applyPerspective(ctx, rig, 0.72, 520, 1030);
    ctx.globalAlpha = bagPose.alpha;
    ctx.translate(520, 1030 + bagPose.y);
    ctx.scale(bagPose.scaleX * (1 + mouthStretch), bagPose.scaleY * (1 - mouthStretch * 0.45));
    drawPeBag(ctx, pal, 580, 600, {
      mode: "flat",
      thickEdge: 0.85,
      frame: stillF,
      inside: () => {
        ctx.save();
        ctx.translate(0, 18 + cakeDy);
        drawSuxueCake(ctx, pal, 215, { seed: 22 });
        ctx.restore();
      },
    });
    // 滑入袋口上方时不被袋身裁剪截断
    if (slideP < 0.92) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(-360, -560, 720, 268);
      ctx.clip();
      ctx.translate(0, 18 + cakeDy);
      drawSuxueCake(ctx, pal, 215, { seed: 22 });
      ctx.restore();
    }
    // 袋口撑开高光扫过
    if (slideP > 0.04 && slideP < 0.96) {
      const shimmerA = Math.sin(slideP * Math.PI) * 0.62;
      const gLip = ctx.createLinearGradient(-265, -296, 265, -296);
      gLip.addColorStop(0, "rgba(255,255,255,0)");
      gLip.addColorStop(0.5, `rgba(255,255,255,${shimmerA.toFixed(3)})`);
      gLip.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = gLip;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-260, -294);
      ctx.quadraticCurveTo(0, -284 - mouthStretch * 140, 260, -294);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 前景大字「原装棉纸别拆」+ 落定后竹青毛笔圈（片尾 0.5 秒前完全静止）
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, 0.05);
  applyPerspective(ctx, rig, 0.34, 520, 740);
  const txt = t(params, "cotton");
  const poseT = lightFloat(Math.min(cl, LENGTH - 15 - COTTON_IN), { rise: 20, sway: 0.4, seed: 13 });
  inkText(ctx, txt, 520, 405 + poseT.y, fitSize(txt, 118, 780) * fontScale, easeOutCubic(progress(cl, 0, 12)), 83, {
    color: pal.bamboo,
    weight: 900,
    font: SONG,
    wash: 0.03,
  });
  brushRing(ctx, 520, 1048, 262, 262, progress(frame, COTTON_SLIDE + 2, COTTON_SLIDE + 20), pal.bamboo, 91, 8);
  ctx.restore();
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "素雪白牡丹茶正上茶舍一叶倾心净含量克");
}
