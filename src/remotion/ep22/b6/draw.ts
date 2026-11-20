/**
 * 第 22 期 B6「三层防压」逐帧画布（1080×1920）
 * 升级：统一三层章节标题 + 零空帧开场 + 主体放大至 51–56% 画幅 + 安全区避让 +
 *       「别摞太高」改用 5 个瓦楞纸箱逐个往上摞，最底箱真实压扁鼓肚 + 内部茶饼开裂再打朱砂叉 +
 *       陶罐降饱和增陶瓷高光 + 尾段 0.5s 静止
 */
import {
  END_STILL_FRAMES,
  cameraAt,
  cameraKick,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
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
  drawChapterTitle,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import {
  drawCorrugatedBoxSide,
  drawCorrugatedBoxTop,
  drawOuterCanister,
  drawSuxueCake,
} from "../kit/objects";
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
const SAFE_CX = 520;
const STILL_START = Math.max(0, LENGTH - END_STILL_FRAMES);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.05,
    drift: 4.5,
    focus: [
      { at: BOX_AT, dur: 18, x: SAFE_CX, y: 1000, zoom: 1.015, pull: 0.14 },
      { at: STACK_IN, dur: 20, x: SAFE_CX, y: 1030, zoom: 1.03, pull: 0.16 },
      { at: CRUSH_AT, dur: 18, x: SAFE_CX, y: 1220, zoom: 1.05, pull: 0.2 },
      { at: HTAPE_AT, dur: 22, x: SAFE_CX, y: 1000, zoom: 1.04, pull: 0.18 },
      { at: CAN_IN, dur: 22, x: SAFE_CX, y: 1010, zoom: 1.025, pull: 0.16 },
      { at: NOT_WAKE_AT, dur: 22, x: SAFE_CX, y: 920, zoom: 1.015, pull: 0.14 },
    ],
  });
  for (const [at, amp] of [
    [CRUSH_AT + 2, 5.5],
    [HTAPE_AT + 6, 3.8],
    [CAN_IN + 8, 3.8],
    [NOT_WAKE_AT + 2, 5.2],
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
  const stillFrame = Math.min(frame, STILL_START);
  renderLayers(ctx, stillFrame, pal, cam, {
    leaves: 3,
    subject: (p) => {
      drawActBoxFlat(ctx, frame, p, params, fontScale);
      drawActTooTall(ctx, frame, p, params, fontScale);
      drawActHSeal(ctx, frame, p, params, fontScale);
      drawActCanister(ctx, frame, p, params, fontScale);
    },
  });
}

// ================= 幕一A：五层加厚瓦楞纸箱平放（零空帧开场） =================
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

  // 统一三层章节标题「三层 · 护住形」（与 B3 / B5 同字号、同位置、同淡墨晕）
  drawChapterTitle(ctx, frame, pal, t(params, "head"), fontScale, {
    at: HEAD_AT,
    color: pal.tea,
    seed: 35,
  });

  // 五层瓦楞纸箱 + 平放素雪茶饼（开场 0.5s 内稳稳落位，宽 600px ≈ 55.6% 画幅）
  const bl = frame - BOX_AT;
  const pose = heavyLand(bl + 3, { drop: 110, fall: 9, squash: 0.04 });
  if (pose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(SAFE_CX, 1020 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawCorrugatedBoxTop(ctx, pal, 600, 580, {
      close: 0,
      inside: () => {
        drawSuxueCake(ctx, pal, 215, { seed: 22 });
      },
    });
    ctx.restore();

    const subP = easeOutCubic(progress(bl, 6, 18));
    if (subP > 0) {
      const txt = t(params, "boxSub");
      inkText(ctx, txt, SAFE_CX, 1435, fitSize(txt, 102, 680) * fontScale, subP, 17, {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.025,
      });
    }
  }

  ctx.restore();
}

// ================= 幕一B：纸箱一个个往上摞 → 最底箱被压扁 + 茶饼出现裂纹 → 打朱砂叉 =================
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
  // 压扁动作：第 5 个箱子压上后，底箱在 18 帧内真实压扁鼓肚、箱内茶饼出现裂纹
  const crush = easeOutCubic(progress(frame, CRUSH_AT, CRUSH_AT + 18));

  // 顶部警示大字「别摞太高」（安全居中）
  const txt = t(params, "noStack");
  inkText(ctx, txt, SAFE_CX, 395, fitSize(txt, 128, 760) * fontScale, easeOutCubic(progress(sl, 0, 12)), 25, {
    color: pal.cinnabar,
    weight: 900,
    font: SONG,
    wash: 0.03,
  });

  // 5 个五层瓦楞纸箱逐个从地面 y=1445 向上摞起（宽 540px = 50% 画幅，安全边界 <= 824 < 960）
  const floorY = 1445;
  const boxW = 540;
  const boxH = 165;
  const pitch = 158;
  const bottomSquashPx = boxH * 0.34 * crush; // 底箱压扁高度

  for (let i = 0; i < 5; i++) {
    const dl = sl - i * 9;
    if (dl <= 0) continue;
    const lp = heavyLand(dl, { drop: 135, fall: 7, squash: 0.04 });
    // 上层 4 个箱子随底箱压扁一起整体沉降，并出现轻微危险倾斜
    const sinkY = i === 0 ? 0 : bottomSquashPx;
    const baseY = floorY - i * pitch + sinkY + lp.y;
    const leanX = i > 0 ? i * 5.5 * crush : 0;
    const tilt = i > 0 ? i * 0.013 * crush : 0;

    ctx.save();
    ctx.globalAlpha *= lp.alpha;
    ctx.translate(SAFE_CX + leanX, baseY);
    ctx.rotate(tilt);
    ctx.scale(lp.scaleX, lp.scaleY);
    drawCorrugatedBoxSide(ctx, pal, boxW, boxH, {
      crush: i === 0 ? crush : i === 1 ? crush * 0.16 : 0,
      cutaway: i === 0,
    });
    ctx.restore();
  }

  // 底箱压扁开裂后，利落打上朱砂大叉
  brushCross(ctx, SAFE_CX, 1030, 490, progress(frame, CRUSH_AT + 16, CRUSH_AT + 32), pal.cinnabar, 31, 22);

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
    ctx.translate(SAFE_CX, 1020 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawCorrugatedBoxTop(ctx, pal, 600, 580, {
      close,
      hTape,
      inside: () => drawSuxueCake(ctx, pal, 215, { seed: 22 }),
    });
    ctx.restore();
  }

  // 顶部「工字封死」大字 + 竹青圈
  const hl = frame - (HTAPE_AT - 2);
  if (hl > 0) {
    const txt = t(params, "hSeal");
    const poseT = heavyLand(hl, { drop: 58, fall: 6, squash: 0.06 });
    ctx.save();
    ctx.globalAlpha *= Math.min(1, hl / 4);
    ctx.translate(SAFE_CX, 405 + poseT.y);
    ctx.scale(poseT.scaleX, poseT.scaleY);
    inkText(ctx, txt, 0, 0, fitSize(txt, 132, 760) * fontScale, easeOutCubic(progress(hl, 0, 12)), 43, {
      color: pal.bamboo,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
    ctx.restore();
    brushRing(ctx, SAFE_CX, 405, 315, 96, progress(hl, 8, 24), pal.bamboo, 47, 7);
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
  const pose = heavyLand(cl, { drop: 115, fall: 9, squash: 0.04 });
  const cutaway = easeInOutCubic(progress(frame, CUTAWAY_AT, CUTAWAY_AT + 24));

  // 上方副标「罐只当外壳」（在「存茶 ≠ 醒茶」出来前自然淡出，不抢焦点）
  const shellOut = easeInOutCubic(progress(frame, NOT_WAKE_AT - 6, NOT_WAKE_AT + 4));
  if (shellOut < 1) {
    ctx.save();
    ctx.globalAlpha = (1 - shellOut) * easeOutCubic(progress(cl, 4, 16));
    const txt = t(params, "shell");
    inkText(ctx, txt, SAFE_CX, 395, fitSize(txt, 108, 760) * fontScale, 1, 57, {
      color: pal.tea,
      weight: 900,
      font: KAI,
    });
    ctx.restore();
  }

  // 主体茶罐（宽 550px ≈ 51% 画幅，降饱和浅陶褐 + 陶瓷高光层次，半剖透视内部纯铝 + PE + 素雪饼）
  if (pose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha = pose.alpha;
    ctx.translate(SAFE_CX, 1045 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawOuterCanister(ctx, pal, 550, 630, { cutaway, style: "clay" });
    ctx.restore();
  }

  // 收尾金句大字「存茶 ≠ 醒茶」
  const nwL = frame - (NOT_WAKE_AT - 4);
  if (nwL > 0) {
    const txt = t(params, "notWake");
    const poseT = heavyLand(nwL, { drop: 64, fall: 6, squash: 0.065 });
    ctx.save();
    ctx.globalAlpha = Math.min(1, nwL / 4);
    ctx.translate(SAFE_CX, 405 + poseT.y);
    ctx.scale(poseT.scaleX, poseT.scaleY);
    inkText(ctx, txt, 0, 0, fitSize(txt, 128, 800) * fontScale, easeOutCubic(progress(nwL, 0, 12)), 71, {
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
