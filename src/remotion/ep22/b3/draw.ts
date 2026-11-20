/**
 * 第 22 期 B3「一层密封」逐帧画布（1080×1920）
 */
import {
  cameraAt,
  cameraKick,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  lightFloat,
  progress,
  springValue,
  type FxPalette,
} from "../kit/fx";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  beginFrame,
  brushRing,
  fitSize,
  gapMarker,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawPeBag, drawSuxueCake } from "../kit/objects";
import {
  BAG_AT,
  HEAD_AT,
  K1_AT,
  K2_AT,
  KW_OUT,
  LENGTH,
  MAT_AT,
  TEXT,
  THICK_AT,
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
      { at: BAG_AT, dur: 20, x: 540, y: 950, zoom: 1.02, pull: 0.16 },
      { at: K1_AT, dur: 20, x: 520, y: 920, zoom: 1.04, pull: 0.18 },
      { at: THICK_AT, dur: 24, x: 540, y: 980, zoom: 1.06, pull: 0.22 },
    ],
  });
  for (const [at, amp] of [
    [K1_AT, 3.5],
    [K2_AT, 4],
    [THICK_AT + 2, 5.5],
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
  // 顶部主标「一层 · 封住气」
  {
    const hl = frame - HEAD_AT;
    if (hl > 0) {
      const txt = t(params, "head");
      const pose = lightFloat(hl, { rise: 24, sway: 0.5, seed: 3 });
      inkText(ctx, txt, 540, 390 + pose.y, fitSize(txt, 114, 780) * fontScale, easeOutCubic(progress(hl, 0, 14)), 15, {
        color: pal.bamboo,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
    }
  }

  // 主体：食品级加厚 PE 平口袋（字出现时带回弹向右让位）
  const bl = frame - BAG_AT;
  const aside = 175 * springValue(frame - (K1_AT - 2), ASIDE_SPRING);
  const thickBoost = easeInOutCubic(progress(frame, THICK_AT - 4, THICK_AT + 16));
  const bagCx = 540 + aside;
  const bagCy = 970;

  if (bl > 0) {
    const pose = heavyLand(bl, { drop: 120, fall: 9, squash: 0.05 });
    ctx.save();
    ctx.globalAlpha = pose.alpha;
    ctx.translate(bagCx, bagCy + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawPeBag(ctx, pal, 430, 520, {
      mode: "flat",
      thickEdge: 0.35 + thickBoost * 0.65,
      inside: () => {
        ctx.save();
        ctx.translate(0, 26);
        drawSuxueCake(ctx, pal, 165, { seed: 22 });
        ctx.restore();
      },
    });
    ctx.restore();
  }

  // 阶段 1 左侧关键词：「够厚」「勒死」
  const kwOut = easeInOutCubic(progress(frame, KW_OUT, KW_OUT + 12));
  if (kwOut < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - kwOut;
    const items: [TextKey, number, number, string][] = [
      ["k1", K1_AT, 790, pal.ink],
      ["k2", K2_AT, 1080, pal.cinnabar],
    ];
    items.forEach(([key, at, y, color], idx) => {
      const l = frame - (at - 4);
      if (l <= 0) return;
      const txt = t(params, key);
      const pose = heavyLand(l, { drop: 68, fall: 6, squash: 0.07 });
      ctx.save();
      ctx.globalAlpha *= Math.min(1, l / 4);
      ctx.translate(275, y + pose.y);
      ctx.scale(pose.scaleX, pose.scaleY);
      inkText(ctx, txt, 0, 0, fitSize(txt, 148, 360) * fontScale, easeOutCubic(progress(l, 0, 11)), 31 + idx * 7, {
        color,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    });
    ctx.restore();
  }

  // 阶段 2 左侧规格：「食品级PE」 + 「≥ 12丝」+ 袋壁厚度标尺
  const matL = frame - (MAT_AT - 2);
  if (matL > 0) {
    const txt = t(params, "mat");
    const pose = lightFloat(matL, { rise: 24, sway: 0.5, seed: 12 });
    inkText(ctx, txt, 275, 790 + pose.y, fitSize(txt, 96, 390) * fontScale, easeOutCubic(progress(matL, 0, 12)), 51, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.025,
    });
  }

  const thL = frame - (THICK_AT - 4);
  if (thL > 0) {
    const txt = t(params, "thick");
    const pose = heavyLand(thL, { drop: 80, fall: 6, squash: 0.07 });
    ctx.save();
    ctx.globalAlpha = Math.min(1, thL / 4);
    ctx.translate(275, 1065 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    inkText(ctx, txt, 0, 0, fitSize(txt, 128, 390) * fontScale, easeOutCubic(progress(thL, 0, 12)), 61, {
      color: pal.cinnabar,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    ctx.restore();

    brushRing(ctx, 275, 1065, 205, 100, progress(thL, 6, 22), pal.cinnabar, 67, 7);

    // 指向袋子厚封边的厚度标尺
    const edgeX = bagCx - 215;
    gapMarker(
      ctx,
      { x: edgeX - 18, y: bagCy + 170 },
      { x: edgeX + 26, y: bagCy + 170 },
      progress(thL, 4, 22),
      pal.bamboo,
      71,
      28,
    );
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "素雪白牡丹茶正上茶舍一叶倾心净含量克");
}
