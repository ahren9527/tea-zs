/**
 * 第 21 期 B2「按年份」逐帧画布（1080×1920）。
 * 一条横向时间轴：
 * 1. 先出大数字「三年」（标注一行：福建地标）
 * 2. 再出「五年」（标注一行：海交会团标）
 * 3. 最后两者向中心收拢，化为一句大字「新老分开放」，时间轴两侧一新茶饼、一老茶饼稳稳分列。
 */
import {
  TAU,
  cameraAt,
  cameraKick,
  clamp01,
  drawBrushStroke,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  lerp,
  lightFloat,
  progress,
  springValue,
  type FxPalette,
} from "../kit/fx";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  KAI,
  SONG,
  allTextsOf,
  beginFrame,
  brushRing,
  fillText,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawMiyunCake } from "../kit/objects";
import {
  AXIS,
  AXIS_AT,
  CENTER_X,
  CORE_AT,
  HERO_Y,
  LENGTH,
  NODE_3_X,
  NODE_5_X,
  PAIR_SCALE,
  PAIR_X,
  TAG3_AT,
  TAG5_SHOW_AT,
  TAG_Y,
  TEXT,
  Y3_AT,
  Y5_AT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.03,
    drift: 5,
    focus: [
      { at: Y3_AT - 8, dur: 24, x: 460, y: 780, zoom: 1.05, pull: 0.25 },
      { at: Y5_AT - 8, dur: 24, x: 620, y: 780, zoom: 1.05, pull: 0.25 },
      { at: CORE_AT - 10, dur: 28, x: 540, y: 880, zoom: 1.0, pull: 0.15 },
    ],
  });
  for (const [at, amp] of [
    [Y3_AT, 4],
    [Y5_AT, 4],
    [CORE_AT + 2, 5],
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
  const axisP = easeInOutCubic(progress(frame, AXIS_AT, AXIS_AT + 32));
  // 收尾：「三年」「五年」各自原地上浮淡出（不再往中间挤，避免叠字），随后落大字「新老分开放」
  const convP = easeInOutCubic(progress(frame, CORE_AT - 16, CORE_AT - 2));
  const coreIn = easeOutCubic(progress(frame, CORE_AT, CORE_AT + 16));

  // 1. 横向时间轴主干
  if (axisP > 0) {
    drawBrushStroke(
      ctx,
      [
        { x: AXIS.x0, y: AXIS.y + 2 },
        { x: 380, y: AXIS.y - 3 },
        { x: 700, y: AXIS.y + 2 },
        { x: AXIS.x1, y: AXIS.y - 1 },
      ],
      axisP,
      {
        width: 9,
        color: pal.ink,
        seed: 12,
        tail: 0.25,
        head: 0.06,
        dry: 0.35,
        dryColor: pal.paper,
        alpha: 0.85,
      },
    );
    // 右端箭头笔触
    if (axisP > 0.85) {
      const ap = (axisP - 0.85) / 0.15;
      drawBrushStroke(
        ctx,
        [
          { x: AXIS.x1 - 32, y: AXIS.y - 22 },
          { x: AXIS.x1 + 4, y: AXIS.y - 1 },
          { x: AXIS.x1 - 30, y: AXIS.y + 22 },
        ],
        ap,
        { width: 7, color: pal.ink, seed: 15, tail: 0.2 },
      );
    }

    // 时间轴下方左右两枚茶饼（左：新茶饼；右：老茶饼）
    const cakeIn = springValue(frame - (AXIS_AT + 10), { stiffness: 120, damping: 15, mass: 1 });
    if (cakeIn > 0) {
      const splitOffset = convP * 32;
      // 左：新茶饼
      ctx.save();
      ctx.globalAlpha = clamp01((frame - (AXIS_AT + 10)) / 10);
      ctx.translate(250 - splitOffset, AXIS.y + 270 + (1 - cakeIn) * 60);
      ctx.scale(0.85 + 0.15 * cakeIn, 0.85 + 0.15 * cakeIn);
      drawMiyunCake(ctx, pal, 145, { tone: "new", peel: 0.6, peelAngle: 2.3, seed: 31 });
      ctx.restore();

      // 右：老茶饼
      ctx.save();
      ctx.globalAlpha = clamp01((frame - (AXIS_AT + 16)) / 10);
      ctx.translate(830 + splitOffset, AXIS.y + 270 + (1 - cakeIn) * 60);
      ctx.scale(0.85 + 0.15 * cakeIn, 0.85 + 0.15 * cakeIn);
      drawMiyunCake(ctx, pal, 145, { tone: "old", peel: 0.6, peelAngle: -0.7, seed: 32 });
      ctx.restore();
    }
  }

  // 节点位置：收拢阶段（convP）从各自位置滑向中心 CENTER_X
  const x3 = NODE_3_X;
  const x5 = NODE_5_X;
  const fadeNodes = 1 - convP;
  const outLift = -46 * convP;

  // 2. 「三年」节点 + 标注「福建地标」
  if (frame >= Y3_AT && fadeNodes > 0) {
    const l3 = frame - Y3_AT;
    // 当「五年」出场时，「三年」退居次位（变淡一点、微缩），然后一起收拢到中央
    const dim3 = easeInOutCubic(progress(frame, Y5_AT - 4, Y5_AT + 10));
    const heroX3 = lerp(CENTER_X, PAIR_X[0], dim3) + 50 * convP;
    const scale3 = lerp(1, PAIR_SCALE, dim3) * lerp(1, 0.9, convP);
    const land = heavyLand(l3, { drop: 70, fall: 6, squash: 0.06 });

    // 时间轴上的「三年」刻度与朱砂点
    ctx.save();
    ctx.globalAlpha = fadeNodes;
    drawBrushStroke(
      ctx,
      [
        { x: x3, y: AXIS.y - 36 },
        { x: x3, y: AXIS.y + 36 },
      ],
      easeOutCubic(progress(l3, 0, 10)),
      { width: 9, color: pal.bamboo, seed: 41 },
    );
    ctx.fillStyle = pal.bamboo;
    ctx.beginPath();
    ctx.arc(x3, AXIS.y, 13 * Math.min(1, l3 / 6), 0, TAU);
    ctx.fill();

    // 大数字「三年」
    ctx.save();
    ctx.globalAlpha = fadeNodes * (1 - 0.18 * dim3);
    ctx.translate(heroX3, HERO_Y + land.y + outLift);
    ctx.scale(scale3 * land.scaleX, scale3 * land.scaleY);
    const txt3 = t(params, "y3");
    const fs3 = fitSize(txt3, 240, 620) * fontScale;
    inkText(ctx, txt3, 0, 0, fs3, easeOutCubic(progress(l3, 0, 14)), 71, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });

    // 标注一行：「福建地标」
    const tl3 = frame - TAG3_AT;
    if (tl3 > 0) {
      const tag3 = t(params, "tag3");
      const tfs3 = fitSize(tag3, 92, 520) * fontScale;
      const tp3 = easeOutCubic(progress(tl3, 0, 14));
      ctx.globalAlpha *= tp3;
      fillText(ctx, tag3, 0, TAG_Y - HERO_Y, tfs3, {
        color: pal.bamboo,
        weight: 700,
        font: KAI,
      });
    }
    ctx.restore();
    ctx.restore();
  }

  // 3. 「五年」节点 + 标注「海交会团标」
  if (frame >= Y5_AT && fadeNodes > 0) {
    const l5 = frame - Y5_AT;
    const heroX5 = PAIR_X[1] - 50 * convP;
    const scale5 = PAIR_SCALE * lerp(1, 0.9, convP);
    const land = heavyLand(l5, { drop: 70, fall: 6, squash: 0.06 });

    ctx.save();
    ctx.globalAlpha = fadeNodes;
    drawBrushStroke(
      ctx,
      [
        { x: x5, y: AXIS.y - 36 },
        { x: x5, y: AXIS.y + 36 },
      ],
      easeOutCubic(progress(l5, 0, 10)),
      { width: 9, color: pal.cinnabar, seed: 47 },
    );
    ctx.fillStyle = pal.cinnabar;
    ctx.beginPath();
    ctx.arc(x5, AXIS.y, 13 * Math.min(1, l5 / 6), 0, TAU);
    ctx.fill();

    // 大数字「五年」
    ctx.save();
    ctx.translate(heroX5, HERO_Y + land.y + outLift);
    ctx.scale(scale5 * land.scaleX, scale5 * land.scaleY);
    const txt5 = t(params, "y5");
    const fs5 = fitSize(txt5, 240, 620) * fontScale;
    inkText(ctx, txt5, 0, 0, fs5, easeOutCubic(progress(l5, 0, 14)), 79, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });

    // 标注一行：「海交会团标」
    const tl5 = frame - TAG5_SHOW_AT;
    if (tl5 > 0) {
      const tag5 = t(params, "tag5");
      const tfs5 = fitSize(tag5, 92, 540) * fontScale;
      const tp5 = easeOutCubic(progress(tl5, 0, 14));
      ctx.globalAlpha *= tp5;
      fillText(ctx, tag5, 0, TAG_Y - HERO_Y, tfs5, {
        color: pal.cinnabar,
        weight: 700,
        font: KAI,
      });
    }
    ctx.restore();
    ctx.restore();
  }

  // 4. 收拢后：时间轴正中立起一道竹青分界柱，上方凝聚成大字「新老分开放」
  if (frame >= CORE_AT - 6) {
    const divP = easeOutCubic(progress(frame, CORE_AT - 6, CORE_AT + 20));
    drawBrushStroke(
      ctx,
      [
        { x: CENTER_X, y: AXIS.y - 160 },
        { x: CENTER_X - 3, y: AXIS.y + 120 },
        { x: CENTER_X + 2, y: AXIS.y + 390 },
      ],
      divP,
      {
        width: 12,
        color: pal.bamboo,
        seed: 88,
        tail: 0.3,
        head: 0.08,
        dry: 0.4,
        dryColor: pal.paper,
      },
    );
  }

  if (coreIn > 0) {
    const cl = frame - CORE_AT;
    const pose = heavyLand(cl + 2, { drop: 60, fall: 6, squash: 0.05 });
    const fl = lightFloat(cl, { rise: 10, sway: 1, seed: 9 });
    const coreTxt = t(params, "core");
    const cfs = fitSize(coreTxt, 170, 780) * fontScale;

    ctx.save();
    ctx.translate(CENTER_X, 580 + pose.y + fl.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    inkText(ctx, coreTxt, 0, 0, cfs, coreIn, 93, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    ctx.restore();

    // 底部一道朱砂托线
    brushRing(
      ctx,
      CENTER_X,
      580,
      440,
      132,
      progress(frame, CORE_AT + 6, CORE_AT + 28),
      pal.cinnabar,
      95,
      7,
    );
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "蜜韵正");
}
