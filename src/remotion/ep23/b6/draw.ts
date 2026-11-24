/**
 * 第 23 期 B6「散茶更危险」逐帧画布（1080×1920）
 * 幕一：左「饼茶」（蜜韵）、右「散茶」，同量水汽同时飘来，散茶蓬松吸得明显更多、刻度冲红；
 * 幕二：受潮散茶画上朱砂叉并干净落入竹编废茶篓，「整批扔掉」克制收尾。
 */
import {
  END_STILL_FRAMES,
  cameraAt,
  cameraKick,
  clamp01,
  drawBrushStroke,
  easeInOutCubic,
  easeOutCubic,
  hash01,
  heavyLand,
  progress,
  rgba,
  type FxPalette,
} from "../kit/fx";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  beginFrame,
  brushCross,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import {
  drawLooseTeaPile,
  drawMiyunCake,
  drawMoistureScale,
  drawTrashBin,
  drawWaterDrop,
} from "../kit/objects";
import {
  ABSORB_AT,
  ENTER_AT,
  FLUFF_AT,
  LENGTH,
  MOLD_AT,
  PHASE2_AT,
  TEXT,
  THROW_AT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const STILL_START = Math.max(0, LENGTH - END_STILL_FRAMES);
const LEFT_X = 265;
const RIGHT_X = 725;
const MID_X = 495;
const OBJ_Y = 930;

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.045,
    drift: 3.5,
    focus: [
      { at: FLUFF_AT, dur: 18, x: RIGHT_X - 80, y: 890, zoom: 1.03, pull: 0.14 },
      { at: ABSORB_AT, dur: 20, x: MID_X, y: 950, zoom: 1.025, pull: 0.14 },
      { at: PHASE2_AT, dur: 18, x: MID_X, y: 960, zoom: 1.02, pull: 0.14 },
    ],
  });
  for (const [at, amp] of [
    [MOLD_AT + 4, 4.5],
    [THROW_AT + 14, 5.2],
  ] as const) {
    const k = cameraKick(frame - at, amp);
    cam.x -= k.x;
    cam.y -= k.y;
  }
  return cam;
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame, pal, fontScale } = beginFrame(ctx, elapsed, params);
  const stillFrame = Math.min(frame, STILL_START);
  renderLayers(ctx, stillFrame, pal, beatCamera(frame), {
    leaves: 3,
    subject: (p) => {
      drawPhase1(ctx, frame, stillFrame, p, params, fontScale);
      drawPhase2(ctx, frame, p, params, fontScale);
    },
  });
}

// ================= 幕一：左饼茶 vs 右散茶，水汽同时飘来吸潮对比 =================
function drawPhase1(
  ctx: CanvasRenderingContext2D,
  frame: number,
  stillFrame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const out = easeInOutCubic(progress(frame, PHASE2_AT, PHASE2_AT + 14));
  if (out >= 1) return;

  const enterP = easeOutCubic(progress(frame, ENTER_AT, ENTER_AT + 14));
  const fluffP = easeOutCubic(progress(frame, FLUFF_AT, FLUFF_AT + 18));
  const absorbP = easeInOutCubic(progress(frame, ABSORB_AT, MOLD_AT + 12));

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 顶部特性说明：「蓬松 · 接触面大」
  const fl = frame - FLUFF_AT;
  if (fl > 0) {
    const trTxt = t(params, "looseTrait");
    inkText(
      ctx,
      trTxt,
      MID_X,
      415,
      fitSize(trTxt, 84, 760) * fontScale,
      easeOutCubic(progress(fl, 0, 14)),
      15,
      {
        color: pal.cinnabar,
        font: SONG,
        weight: 900,
        wash: 0.025,
      },
    );
  }

  // 中央极淡水墨竖线
  drawBrushStroke(
    ctx,
    [
      { x: MID_X, y: 560 },
      { x: MID_X, y: 1360 },
    ],
    Math.max(0.2, enterP),
    { width: 3.5, color: rgba(pal.ink, 0.2), seed: 21, tail: 0.2 },
  );

  // ── 左侧：紧压「蜜韵」饼茶（水汽大多弹开，刻度微升 8.3% → 8.48%）──
  {
    const cTxt = t(params, "cakeLabel");
    inkText(
      ctx,
      cTxt,
      LEFT_X,
      625,
      fitSize(cTxt, 74, 280) * fontScale,
      Math.max(0.25, enterP),
      11,
      {
        color: pal.ink,
        font: SONG,
        weight: 900,
      },
    );

    const cLand = heavyLand(frame - ENTER_AT + 4, { drop: 60, fall: 6, squash: 0.04 });
    ctx.save();
    ctx.globalAlpha *= cLand.alpha;
    ctx.translate(LEFT_X - out * 80, OBJ_Y + cLand.y);
    ctx.scale(cLand.scaleX, cLand.scaleY);
    drawMiyunCake(ctx, 152);
    ctx.restore();

    // 饼茶下方小号横向水分刻度尺（保持同一套尺子语言）
    const cakeVal = 8.3 + absorbP * 0.18;
    ctx.save();
    ctx.translate(LEFT_X, 1235);
    drawMoistureScale(ctx, pal, {
      orientation: "horizontal",
      min: 6,
      max: 10,
      length: 340,
      thickness: 34,
      value: cakeVal,
      reveal: Math.max(0.25, enterP),
      show7: true,
      show85: true,
      emphasize85: 0.5,
      emphasize7: 0.2,
      labelSide: "bottom",
      showLabels: true,
      fontScale: fontScale * 0.85,
      seed: 61,
    });
    ctx.restore();
  }

  // ── 右侧：蓬松「散茶」（水汽钻入空隙大量吸附，刻度飙破 8.5% → 9.6%）──
  {
    const lTxt = t(params, "looseLabel");
    inkText(
      ctx,
      lTxt,
      RIGHT_X,
      625,
      fitSize(lTxt, 74, 280) * fontScale,
      Math.max(0.25, enterP),
      12,
      {
        color: pal.cinnabar,
        font: SONG,
        weight: 900,
      },
    );

    const lLand = heavyLand(frame - ENTER_AT + 2, { drop: 60, fall: 6, squash: 0.04 });
    ctx.save();
    ctx.globalAlpha *= lLand.alpha;
    ctx.translate(RIGHT_X, OBJ_Y + lLand.y);
    ctx.scale(lLand.scaleX, lLand.scaleY);
    drawLooseTeaPile(ctx, pal, 170, 128, {
      fluff: 0.25 + fluffP * 0.75,
      damp: absorbP * 0.9,
      seed: 66,
    });
    ctx.restore();

    // 散茶下方横向水分刻度尺：迅速冲过 8.5% 警红
    const looseVal = 8.3 + absorbP * 1.35;
    ctx.save();
    ctx.translate(RIGHT_X, 1235);
    drawMoistureScale(ctx, pal, {
      orientation: "horizontal",
      min: 6,
      max: 10,
      length: 340,
      thickness: 34,
      value: looseVal,
      reveal: Math.max(0.25, enterP),
      show7: true,
      show85: true,
      emphasize85: 0.6 + absorbP * 0.4,
      emphasize7: 0.2,
      alert: clamp01((looseVal - 8.5) * 1.4),
      labelSide: "bottom",
      showLabels: true,
      fontScale: fontScale * 0.85,
      seed: 62,
    });
    ctx.restore();
  }

  // ── 对称飘来的水汽滴：左侧只沾表层/弹开，右侧密密钻进蓬松散茶里 ──
  const dropFade = easeOutCubic(progress(frame, ABSORB_AT - 6, ABSORB_AT + 12));
  if (dropFade > 0.01) {
    // 左侧饼茶：6 枚水滴飘近表缘后轻柔弹开消散
    for (let i = 0; i < 6; i++) {
      const ph = (((stillFrame * 0.036 + hash01(i, 71)) % 1) + 1) % 1;
      const ang = -Math.PI * 0.82 + (i / 5) * Math.PI * 0.64;
      const dist = ph < 0.55 ? 240 - (ph / 0.55) * 76 : 164 + ((ph - 0.55) / 0.45) * 48;
      const dx = LEFT_X + Math.cos(ang) * dist;
      const dy = OBJ_Y + Math.sin(ang) * dist;
      const a = Math.sin(ph * Math.PI) * 0.68 * dropFade;
      drawWaterDrop(ctx, dx, dy, 10, "#5b899e", a);
    }

    // 右侧散茶：14 枚水滴直直钻入叶片间隙（明显多得多）
    for (let i = 0; i < 14; i++) {
      const ph = (((stillFrame * 0.044 + hash01(i, 83)) % 1) + 1) % 1;
      const ang = -Math.PI * 0.92 + (i / 13) * Math.PI * 1.2;
      const dist = 235 * (1 - ph * 0.86);
      const dx = RIGHT_X + Math.cos(ang) * dist;
      const dy = OBJ_Y + Math.sin(ang) * dist * 0.82;
      if (dx > 940) continue;
      const a = Math.sin(Math.min(1, ph * 1.15) * Math.PI) * 0.88 * dropFade;
      drawWaterDrop(ctx, dx, dy, 12.5, "#4c7f98", a);
    }
  }

  ctx.restore();
}

// ================= 幕二：克制演示「整批扔掉」（朱砂叉 + 倒入废茶篓） =================
function drawPhase2(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < PHASE2_AT + 2) return;
  const pIn = easeOutCubic(progress(frame, PHASE2_AT + 2, PHASE2_AT + 16));
  const throwP = easeInOutCubic(progress(frame, THROW_AT, THROW_AT + 22));

  // 顶部醒目朱砂大字「整批扔掉」
  const dTxt = t(params, "discard");
  inkText(ctx, dTxt, MID_X, 455, fitSize(dTxt, 134, 760) * fontScale, pIn, 91, {
    color: pal.cinnabar,
    font: SONG,
    weight: 900,
    wash: 0.035,
  });

  // 竹编废茶篓（居中偏下 y = 1230，底部 1380 < 1560）
  const binLand = heavyLand(frame - (PHASE2_AT + 4), { drop: 50, fall: 6, squash: 0.04 });
  ctx.save();
  ctx.globalAlpha = binLand.alpha;
  ctx.translate(MID_X, 1235 + binLand.y);
  ctx.scale(binLand.scaleX, binLand.scaleY);
  drawTrashBin(ctx, pal, 270, 260);
  ctx.restore();

  // 受潮散茶堆：先悬于篓上方被打朱砂叉，再顺势缩入篓口落尽（克制干净）
  const teaY = 835 + throwP * 340;
  const teaScale = (1 - throwP * 0.56) * pIn;
  const teaAlpha = clamp01(1 - Math.max(0, (throwP - 0.72) / 0.28)) * pIn;
  if (teaAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = teaAlpha;
    ctx.translate(MID_X, teaY);
    ctx.rotate(throwP * 0.24);
    ctx.scale(teaScale, teaScale);
    drawLooseTeaPile(ctx, pal, 185, 132, { fluff: 0.65, damp: 0.95, seed: 66 });
    ctx.restore();
  }

  // 朱砂毛笔大叉：干脆划掉这批受潮散茶
  const crossP = easeOutCubic(progress(frame, MOLD_AT + 2, MOLD_AT + 20));
  if (crossP > 0.01) {
    ctx.save();
    ctx.globalAlpha = 1 - throwP * 0.25;
    brushCross(ctx, MID_X, 835 + throwP * 65, 290, crossP, pal.cinnabar, 97, 18);
    ctx.restore();
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "7%8.5");
}
