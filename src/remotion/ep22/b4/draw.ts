/**
 * 第 22 期 B4「鹅颈封口」逐帧画布（1080×1920）
 * 升级：2.5D 微透视特写镜头 + 多层纵深视差 + 右侧极简四步封口印标（挤/拧/折/勒）
 *       + 幕三平口袋口弹性张合高光
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

// ---------------------------------------------------------------------------
// 2.5D 微透视机位 + 分层视差
// ---------------------------------------------------------------------------

type CamRig = {
  cam: Camera;
  yaw: number;
  pitch: number;
  roll: number;
};

function beatCameraRig(frame: number): CamRig {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.07,
    drift: 5.5,
    focus: [
      { at: ZIP_AT, dur: 20, x: 540, y: 920, zoom: 1.02, pull: 0.16 },
      { at: LEAK_AT, dur: 18, x: 540, y: 810, zoom: 1.06, pull: 0.22 },
      { at: FLAT_IN, dur: 22, x: 540, y: 980, zoom: 1.02, pull: 0.16 },
      { at: SQUEEZE_AT, dur: 22, x: 540, y: 990, zoom: 1.05, pull: 0.2 },
      { at: TWIST_AT, dur: 22, x: 540, y: 825, zoom: 1.085, pull: 0.26 },
      { at: FOLD_AT, dur: 22, x: 525, y: 805, zoom: 1.095, pull: 0.28 },
      { at: TIE1_AT, dur: 20, x: 535, y: 815, zoom: 1.11, pull: 0.3 },
      { at: COTTON_IN, dur: 24, x: 540, y: 960, zoom: 1.03, pull: 0.18 },
    ],
  });
  for (const [at, amp] of [
    [CROSS_AT + 3, 4.5],
    [TIE1_AT, 4.2],
    [TIE2_AT, 5.4],
    [COTTON_SLIDE + 2, 3.5],
  ] as const) {
    const k = cameraKick(frame - at, amp);
    cam.x -= k.x;
    cam.y -= k.y;
  }

  const normX = cam.x / 120;
  const normY = cam.y / 160;
  // 拧折阶段微侧摆，让袋体透视更有实操临场感
  const stepSway =
    Math.sin(frame * 0.024) * 0.18 +
    easeInOutCubic(progress(frame, FOLD_AT, FOLD_AT + 24)) *
      (1 - easeInOutCubic(progress(frame, ACT2_OUT, ACT2_OUT + 12))) *
      0.24;
  const yaw = Math.max(-1, Math.min(1, normX * 0.85 + stepSway));
  const pitch = Math.max(-1, Math.min(1, normY * 0.85 - 0.08 * Math.cos(frame * 0.02)));
  const roll = -yaw * 0.0075 + Math.sin(frame * 0.017) * 0.0022;

  return { cam, yaw, pitch, roll };
}

function applyPerspective(
  ctx: CanvasRenderingContext2D,
  rig: CamRig,
  strength = 1,
  pivotX = STAGE.width / 2,
  pivotY = STAGE.height / 2,
) {
  ctx.translate(pivotX, pivotY);
  ctx.rotate(rig.roll * strength);
  const sx = 1 - Math.abs(rig.yaw) * 0.018 * strength;
  const sy = 1 - Math.abs(rig.pitch) * 0.016 * strength;
  const skewX = -rig.yaw * 0.014 * strength;
  const skewY = (rig.pitch * 0.01 + rig.yaw * 0.009) * strength;
  ctx.transform(sx, skewY, skewX, sy, 0, 0);
  ctx.translate(-pivotX, -pivotY);
}

function applyDeltaParallax(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  deltaDepth: number,
  pivotX = STAGE.width / 2,
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
  renderLayers(ctx, frame, pal, rig.cam, {
    leaves: 3,
    back: (p) => drawBackdropAura(ctx, frame, p, rig),
    subject: (p) => {
      drawActZipBad(ctx, frame, p, params, fontScale, rig);
      drawActGooseneck(ctx, frame, p, params, fontScale, rig);
      drawActCottonPaper(ctx, frame, p, params, fontScale, rig);
    },
  });
}

// 远景柔和墨晕背景气场（低视差层，拉出袋体前后景层次）
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

  const cx = 540;
  const cy = 980;
  const g = ctx.createRadialGradient(cx, cy, 40, cx, cy, 520);
  if (act1A > 0.02) {
    g.addColorStop(0, rgba(pal.cinnabar, 0.055 * act1A));
    g.addColorStop(0.55, rgba(pal.ink, 0.03 * act1A));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 320, STAGE.width, 1260);
  }
  if (act2A > 0.02) {
    const g2 = ctx.createRadialGradient(cx, cy - 30, 50, cx, cy, 540);
    g2.addColorStop(0, rgba(pal.bamboo, 0.065 * act2A));
    g2.addColorStop(0.55, rgba(pal.tea, 0.035 * act2A));
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 320, STAGE.width, 1260);
  }
  if (act3A > 0.02) {
    const g3 = ctx.createRadialGradient(cx, cy + 20, 50, cx, cy, 520);
    g3.addColorStop(0, rgba(pal.bamboo, 0.075 * act3A));
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

  // 主体袋层（微透视）
  const pose = heavyLand(frame - ZIP_AT, { drop: 110, fall: 8, squash: 0.05 });
  if (pose.alpha > 0) {
    const leak = easeOutCubic(progress(frame, LEAK_AT, LEAK_AT + 18));
    ctx.save();
    applyPerspective(ctx, rig, 0.72, 540, 1020);
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

  // 前景警示大字 + 朱砂叉（轻微正视差）
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, 0.055);
  applyPerspective(ctx, rig, 0.4, 540, 760);
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

  // 核心平口袋鹅颈演示（主体层带 2.5D 微透视）
  const pose = heavyLand(frame - FLAT_IN, { drop: 110, fall: 8, squash: 0.04 });
  if (pose.alpha > 0) {
    const squeeze = easeInOutCubic(progress(frame, SQUEEZE_AT, SQUEEZE_AT + 24));
    const twist = easeInOutCubic(progress(frame, TWIST_AT, TWIST_AT + 22));
    const fold = easeInOutCubic(progress(frame, FOLD_AT, FOLD_AT + 24));
    const tie1 = easeOutCubic(progress(frame, TIE1_AT, TIE1_AT + 12));
    const tie2 = easeOutCubic(progress(frame, TIE2_AT, TIE2_AT + 12));

    // 勒两道扎带时袋体极轻微受力紧缩，增强物理反馈
    const lockPunch =
      Math.sin(progress(frame, TIE1_AT, TIE1_AT + 12) * Math.PI) * 0.016 +
      Math.sin(progress(frame, TIE2_AT, TIE2_AT + 12) * Math.PI) * 0.022;

    ctx.save();
    applyPerspective(ctx, rig, 0.78, 540, 960);
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(540, 1000 + pose.y);
    ctx.scale(pose.scaleX * (1 - lockPunch), pose.scaleY * (1 + lockPunch * 0.65));
    drawGooseneckBag(ctx, pal, { squeeze, twist, fold, tie1, tie2, frame });
    ctx.restore();
  }

  // 前景层：顶部步进大字（≤5字）+ 右侧四步印标（挤/拧/折/勒，同屏总字数 ≤ 9 字）
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, 0.055);
  applyPerspective(ctx, rig, 0.36, 540, 680);

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

  ctx.restore();

  ctx.restore();
}

// ================= 幕三：素雪带原装棉纸直接装 =================
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

  // 素雪茶饼带棉纸从上方稳稳滑进透明加厚 PE 平口袋
  const slideP = easeInOutCubic(progress(frame, COTTON_SLIDE, COTTON_SLIDE + 24));
  const bagPose = heavyLand(cl - 2, { drop: 100, fall: 8, squash: 0.04 });
  const cakeDy = -170 * (1 - slideP);
  // 茶饼入袋瞬间袋口轻微横向撑开再回弹
  const mouthStretch = Math.sin(slideP * Math.PI) * 0.032;

  if (bagPose.alpha > 0) {
    ctx.save();
    applyPerspective(ctx, rig, 0.72, 540, 1040);
    ctx.globalAlpha = bagPose.alpha;
    ctx.translate(540, 1040 + bagPose.y);
    ctx.scale(bagPose.scaleX * (1 + mouthStretch), bagPose.scaleY * (1 - mouthStretch * 0.45));
    drawPeBag(ctx, pal, 520, 540, {
      mode: "flat",
      thickEdge: 0.85,
      frame,
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
    // 袋口撑开高光扫过，强化透明薄膜质感
    if (slideP > 0.05 && slideP < 0.96) {
      const shimmerA = Math.sin(slideP * Math.PI) * 0.65;
      const gLip = ctx.createLinearGradient(-240, -270, 240, -270);
      gLip.addColorStop(0, "rgba(255,255,255,0)");
      gLip.addColorStop(0.5, `rgba(255,255,255,${shimmerA.toFixed(3)})`);
      gLip.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = gLip;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-235, -267);
      ctx.quadraticCurveTo(0, -258 - mouthStretch * 140, 235, -267);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 前景大字「原装棉纸别拆」+ 竹青毛笔圈
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, 0.055);
  applyPerspective(ctx, rig, 0.36, 540, 740);
  const txt = t(params, "cotton");
  const poseT = lightFloat(cl, { rise: 22, sway: 0.5, seed: 13 });
  inkText(ctx, txt, 540, 420 + poseT.y, fitSize(txt, 114, 780) * fontScale, easeOutCubic(progress(cl, 0, 12)), 83, {
    color: pal.bamboo,
    weight: 900,
    font: SONG,
    wash: 0.03,
  });
  brushRing(ctx, 540, 1055, 248, 248, progress(frame, COTTON_SLIDE + 10, COTTON_SLIDE + 28), pal.bamboo, 91, 8);
  ctx.restore();
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "素雪白牡丹茶正上茶舍一叶倾心净含量克挤拧折勒");
}
