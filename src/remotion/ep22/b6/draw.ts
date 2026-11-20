/**
 * 第 22 期 B6「三层防压」逐帧画布（1080×1920）
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
  KAI,
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
import { drawCakeSide, drawCorrugatedBoxTop, drawOuterCanister, drawSuxueCake } from "../kit/objects";
import {
  BOX_AT,
  BOX_OUT,
  CAN_IN,
  CLOSE_AT,
  CRUSH_AT,
  CUTAWAY_AT,
  HEAD_AT,
  HTAPE_AT,
  LENGTH,
  NOT_WAKE_AT,
  SEAL_BOX_IN,
  SEAL_OUT,
  STACK_IN,
  STACK_OUT,
  TEXT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.06,
    drift: 5,
    focus: [
      { at: BOX_AT, dur: 20, x: 540, y: 980, zoom: 1.02, pull: 0.16 },
      { at: STACK_IN, dur: 20, x: 540, y: 980, zoom: 1.04, pull: 0.18 },
      { at: HTAPE_AT, dur: 22, x: 540, y: 980, zoom: 1.05, pull: 0.2 },
      { at: CAN_IN, dur: 22, x: 540, y: 960, zoom: 1.03, pull: 0.18 },
      { at: NOT_WAKE_AT, dur: 22, x: 540, y: 900, zoom: 1.02, pull: 0.16 },
    ],
  });
  for (const [at, amp] of [
    [CRUSH_AT + 2, 5.5],
    [HTAPE_AT + 6, 4],
    [CAN_IN + 8, 4],
    [NOT_WAKE_AT + 2, 5.5],
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
      drawActBoxFlat(ctx, frame, p, params, fontScale);
      drawActTooTall(ctx, frame, p, params, fontScale);
      drawActHSeal(ctx, frame, p, params, fontScale);
      drawActCanister(ctx, frame, p, params, fontScale);
    },
  });
}

// ================= 幕一A：五层加厚瓦楞纸箱平放 =================
function drawActBoxFlat(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const out = easeInOutCubic(progress(frame, BOX_OUT, BOX_OUT + 10));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  const hl = frame - HEAD_AT;
  if (hl > 0) {
    const txt = t(params, "head");
    const pose = lightFloat(hl, { rise: 22, sway: 0.5, seed: 3 });
    inkText(ctx, txt, 540, 385 + pose.y, fitSize(txt, 114, 780) * fontScale, easeOutCubic(progress(hl, 0, 14)), 11, {
      color: pal.tea,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }

  const bl = frame - BOX_AT;
  if (bl > 0) {
    const pose = heavyLand(bl, { drop: 120, fall: 9, squash: 0.04 });
    ctx.save();
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(540, 995 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawCorrugatedBoxTop(ctx, pal, 580, 560, {
      close: 0,
      inside: () => {
        drawSuxueCake(ctx, pal, 210, { seed: 22 });
      },
    });
    ctx.restore();

    const subP = easeOutCubic(progress(bl, 10, 22));
    if (subP > 0) {
      const txt = t(params, "boxSub");
      inkText(ctx, txt, 540, 1420, fitSize(txt, 100, 680) * fontScale, subP, 17, {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.025,
      });
    }
  }

  ctx.restore();
}

// ================= 幕一B：别一摞摞太高，底层压碎 × =================
function drawActTooTall(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < STACK_IN) return;
  const out = easeInOutCubic(progress(frame, STACK_OUT, STACK_OUT + 10));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  const sl = frame - STACK_IN;
  const crush = easeOutCubic(progress(frame, CRUSH_AT, CRUSH_AT + 16));

  // 顶部警示大字「别摞太高」
  const txt = t(params, "noStack");
  inkText(ctx, txt, 540, 410, fitSize(txt, 128, 760) * fontScale, easeOutCubic(progress(sl, 0, 12)), 25, {
    color: pal.cinnabar,
    weight: 900,
    font: SONG,
    wash: 0.03,
  });

  // 7 饼叠成危险高塔，最底层受重压变形开裂
  const baseY = 1320;
  const cakeH = 82;
  for (let i = 0; i < 7; i++) {
    const dl = sl - i * 3;
    if (dl <= 0) continue;
    const lp = heavyLand(dl, { drop: 110, fall: 6, squash: 0.04 });
    const squashDrop = i === 0 ? 0 : crush * 28;
    const yy = baseY - i * (cakeH - 6) + squashDrop + lp.y;
    const tilt = i > 3 ? (i - 3) * 0.028 * (1 + crush) : 0;
    ctx.save();
    ctx.globalAlpha *= lp.alpha;
    ctx.translate(540 + (i > 3 ? (i - 3) * 8 * crush : 0), yy);
    ctx.rotate(tilt);
    ctx.scale(lp.scaleX, lp.scaleY);
    drawCakeSide(ctx, pal, 410, cakeH, {
      crush: i === 0 ? crush : i === 1 ? crush * 0.4 : 0,
      wrapped: true,
    });
    ctx.restore();
  }

  // 朱砂叉划掉高摞
  brushCross(ctx, 540, 1010, 480, progress(frame, CRUSH_AT + 6, CRUSH_AT + 20), pal.cinnabar, 31, 22);

  ctx.restore();
}

// ================= 幕二：「工」字形封箱胶带 =================
function drawActHSeal(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < SEAL_BOX_IN) return;
  const out = easeInOutCubic(progress(frame, SEAL_OUT, SEAL_OUT + 10));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  const bl = frame - SEAL_BOX_IN;
  const pose = heavyLand(bl, { drop: 90, fall: 8, squash: 0.04 });
  const close = easeInOutCubic(progress(frame, CLOSE_AT, CLOSE_AT + 18));
  const hTape = easeInOutCubic(progress(frame, HTAPE_AT, HTAPE_AT + 34));

  if (pose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(540, 1005 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawCorrugatedBoxTop(ctx, pal, 580, 560, {
      close,
      hTape,
      inside: () => drawSuxueCake(ctx, pal, 200, { seed: 22 }),
    });
    ctx.restore();
  }

  // 顶部「工字封死」大字 + 竹青圈
  const hl = frame - (HTAPE_AT - 2);
  if (hl > 0) {
    const txt = t(params, "hSeal");
    const poseT = heavyLand(hl, { drop: 60, fall: 6, squash: 0.06 });
    ctx.save();
    ctx.globalAlpha *= Math.min(1, hl / 4);
    ctx.translate(540, 420 + poseT.y);
    ctx.scale(poseT.scaleX, poseT.scaleY);
    inkText(ctx, txt, 0, 0, fitSize(txt, 132, 760) * fontScale, easeOutCubic(progress(hl, 0, 12)), 43, {
      color: pal.bamboo,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
    ctx.restore();
    brushRing(ctx, 540, 420, 315, 96, progress(hl, 8, 24), pal.bamboo, 47, 7);
  }

  ctx.restore();
}

// ================= 幕三：铁罐/陶罐当外壳 · 存茶 ≠ 醒茶 =================
function drawActCanister(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < CAN_IN) return;
  const cl = frame - CAN_IN;
  const pose = heavyLand(cl, { drop: 120, fall: 9, squash: 0.04 });
  const cutaway = easeInOutCubic(progress(frame, CUTAWAY_AT, CUTAWAY_AT + 24));

  // 上方副标「罐只当外壳」（在「存茶 ≠ 醒茶」出来前自然淡出，不抢焦点）
  const shellOut = easeInOutCubic(progress(frame, NOT_WAKE_AT - 6, NOT_WAKE_AT + 4));
  if (shellOut < 1) {
    ctx.save();
    ctx.globalAlpha = (1 - shellOut) * easeOutCubic(progress(cl, 4, 16));
    const txt = t(params, "shell");
    inkText(ctx, txt, 540, 395, fitSize(txt, 108, 760) * fontScale, 1, 57, {
      color: pal.tea,
      weight: 900,
      font: KAI,
    });
    ctx.restore();
  }

  // 主体茶罐（半剖透视可见内部纯铝 + 透明 PE + 素雪饼）
  if (pose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha = pose.alpha;
    ctx.translate(540, 1030 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawOuterCanister(ctx, pal, 520, 620, { cutaway, style: "clay" });
    ctx.restore();
  }

  // 收尾金句大字「存茶 ≠ 醒茶」
  const nwL = frame - (NOT_WAKE_AT - 4);
  if (nwL > 0) {
    const txt = t(params, "notWake");
    const poseT = heavyLand(nwL, { drop: 70, fall: 6, squash: 0.07 });
    ctx.save();
    ctx.globalAlpha = Math.min(1, nwL / 4);
    ctx.translate(540, 415 + poseT.y);
    ctx.scale(poseT.scaleX, poseT.scaleY);
    inkText(ctx, txt, 0, 0, fitSize(txt, 128, 820) * fontScale, easeOutCubic(progress(nwL, 0, 12)), 71, {
      color: pal.cinnabar,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    ctx.restore();
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "素雪白牡丹茶正上茶舍一叶倾心净含量克");
}
