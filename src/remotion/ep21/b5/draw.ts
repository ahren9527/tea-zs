/**
 * 第 21 期 B5「分区实操」逐帧画布（1080×1920）。
 * 实木茶柜稳稳落定 → 上层蓬松散茶、下层压紧老茶饼就位 →
 * 上层贴上大标签「2025·散茶」（散茶向左回弹让位）→
 * 下层贴上大标签「2016·饼茶」（茶饼向左回弹让位）。
 */
import {
  cameraAt,
  cameraKick,
  clamp01,
  easeOutCubic,
  heavyLand,
  mixHex,
  progress,
  springValue,
  type FxPalette,
} from "../kit/fx";
import type { AnimParams } from "@/remotion/shared/theme";
import {
  allTextsOf,
  beginFrame,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import {
  drawCabinetFrame,
  drawLooseTea,
  drawMiyunCake,
  drawTeaLabel,
  tierCenterY,
} from "../kit/objects";
import {
  CAB,
  CAB_AT,
  DONE_AT,
  LENGTH,
  TAG1_AT,
  TAG2_AT,
  TEXT,
  TIER_AT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

function beatCamera(frame: number) {
  const topY = tierCenterY(CAB.y, CAB.h, CAB.tiers, 0);
  const botY = tierCenterY(CAB.y, CAB.h, CAB.tiers, 1);
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.05,
    drift: 5,
    focus: [
      { at: CAB_AT, dur: 20, x: 540, y: CAB.y, zoom: 1.02, pull: 0.16 },
      { at: TAG1_AT - 4, dur: 22, x: 580, y: topY, zoom: 1.06, pull: 0.24 },
      { at: TAG2_AT - 4, dur: 22, x: 580, y: botY, zoom: 1.06, pull: 0.24 },
      { at: DONE_AT + 8, dur: 28, x: 540, y: CAB.y, zoom: 1.01, pull: 0.12 },
    ],
  });
  for (const [at, amp] of [
    [CAB_AT + 8, 5],
    [TAG1_AT + 4, 6],
    [TAG2_AT + 4, 6],
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
    subject: (p) => drawSubject(ctx, frame, p, params, fontScale),
  });
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const cabPose = heavyLand(frame - CAB_AT, { drop: 130, fall: 9, squash: 0.035 });
  if (cabPose.alpha <= 0) return;

  const topY = tierCenterY(CAB.y, CAB.h, CAB.tiers, 0);
  const botY = tierCenterY(CAB.y, CAB.h, CAB.tiers, 1);

  ctx.save();
  ctx.globalAlpha = cabPose.alpha;
  ctx.translate(CAB.x, CAB.y + cabPose.y);
  ctx.scale(cabPose.scaleX, cabPose.scaleY);
  ctx.translate(-CAB.x, -CAB.y);

  // 1. 实木双层茶柜
  drawCabinetFrame(ctx, pal, CAB.x, CAB.y, CAB.w, CAB.h, CAB.tiers);

  // 2. 上层：蓬松散茶（贴标签时向左弹性让位）
  const tea1Pose = heavyLand(frame - (TIER_AT - 4), { drop: 80, fall: 7, squash: 0.04 });
  if (tea1Pose.alpha > 0) {
    const yield1 = springValue(frame - TAG1_AT, { stiffness: 210, damping: 14, mass: 1 });
    const x1 = CAB.x - 20 - yield1 * 185;
    const sc1 = 1 - clamp01(yield1) * 0.08;
    const breathe = Math.sin(frame * 0.06) * 0.35;
    ctx.save();
    ctx.globalAlpha *= tea1Pose.alpha;
    ctx.translate(x1, topY + 14 + tea1Pose.y);
    ctx.scale(tea1Pose.scaleX * sc1, tea1Pose.scaleY * sc1);
    drawLooseTea(ctx, pal, 168, { tone: "new", seed: 51, breathe });
    ctx.restore();
  }

  // 3. 下层：老茶茶饼（贴标签时向左弹性让位）
  const tea2Pose = heavyLand(frame - (TIER_AT + 4), { drop: 90, fall: 8, squash: 0.045 });
  if (tea2Pose.alpha > 0) {
    const yield2 = springValue(frame - TAG2_AT, { stiffness: 210, damping: 14, mass: 1 });
    const x2 = CAB.x - 20 - yield2 * 185;
    const sc2 = 1 - clamp01(yield2) * 0.08;
    ctx.save();
    ctx.globalAlpha *= tea2Pose.alpha;
    ctx.translate(x2, botY + 10 + tea2Pose.y);
    ctx.scale(tea2Pose.scaleX * sc2, tea2Pose.scaleY * sc2);
    drawMiyunCake(ctx, pal, 155, {
      tone: "old",
      peel: 0.48,
      peelAngle: -0.6,
      seed: 16,
    });
    ctx.restore();
  }

  // 4. 上层大标签：「2025·散茶」啦地贴上
  const tag1L = frame - TAG1_AT;
  if (tag1L > 0) {
    const slap1 = clamp01(springValue(tag1L, { stiffness: 280, damping: 17, mass: 0.9 }));
    const pop1 = 1 + 0.06 * Math.sin(clamp01(tag1L / 10) * Math.PI);
    ctx.save();
    ctx.translate(CAB.x + 150, topY + 10);
    ctx.scale(pop1, pop1);
    drawTeaLabel(ctx, pal, t(params, "tag1"), 420, 148, {
      slapP: easeOutCubic(progress(tag1L, 0, 8)) * 0.5 + slap1 * 0.5,
      accent: pal.bamboo,
      fontSize: 66 * fontScale,
      seed: 101,
    });
    ctx.restore();
  }

  // 5. 下层大标签：「2016·饼茶」啦地贴上
  const tag2L = frame - TAG2_AT;
  if (tag2L > 0) {
    const slap2 = clamp01(springValue(tag2L, { stiffness: 280, damping: 17, mass: 0.9 }));
    const pop2 = 1 + 0.06 * Math.sin(clamp01(tag2L / 10) * Math.PI);
    ctx.save();
    ctx.translate(CAB.x + 150, botY + 10);
    ctx.scale(pop2, pop2);
    drawTeaLabel(ctx, pal, t(params, "tag2"), 420, 148, {
      slapP: easeOutCubic(progress(tag2L, 0, 8)) * 0.5 + slap2 * 0.5,
      accent: mixHex(pal.cinnabar, pal.tea, 0.25),
      fontSize: 66 * fontScale,
      seed: 102,
    });
    ctx.restore();
  }

  ctx.restore();
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
