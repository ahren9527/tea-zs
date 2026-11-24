/**
 * 第 23 期 B10「投票预告」逐帧画布（1080×1920）
 * 幕一：二选一投票「靠手感 / 靠鼻子」，左右各占半屏，简笔手捏茶与侧脸闻香示意，完整同屏停留 ≥ 2.8 秒；
 * 幕二：下期预告「三秒能判断吗？」+ 蜜韵饼茶 + 朱砂问号；
 * 幕三：「下期见」居中朱砂方印 + 雅致墨晕干净收尾，末 0.5 秒静止。
 */
import {
  END_STILL_FRAMES,
  TAU,
  cameraAt,
  cameraKick,
  drawBrushStroke,
  drawSeal,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  progress,
  rgba,
  sealPress,
  type FxPalette,
  type Pt,
} from "../kit/fx";
import { onTwos } from "../kit/hand";
import { SEAL_FONT, type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  beatWord,
  beginFrame,
  brushRing,
  chars,
  drawTitleInkHalo,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawHandGesture, drawMiyunCake, drawNoseProfile } from "../kit/objects";
import {
  BYE_AT,
  HAND_PULSE_AT,
  LENGTH,
  NOSE_PULSE_AT,
  OPT1_AT,
  OPT2_AT,
  OPT_COLS,
  REVEAL_STEP,
  SPLIT_MID_X,
  TEASER_AT,
  TEASER_IN,
  TEXT,
  VOTE_IN,
  VOTE_OUT,
  type TextKey,
} from "./data";
import { VO } from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const STILL_START = Math.max(0, LENGTH - END_STILL_FRAMES);
const CX = 495;

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.04,
    drift: 3.5,
    focus: [
      { at: OPT1_AT - 4, dur: 18, x: OPT_COLS.x[0] + 65, y: 880, zoom: 1.025, pull: 0.14 },
      { at: OPT2_AT - 4, dur: 18, x: OPT_COLS.x[1] - 65, y: 880, zoom: 1.025, pull: 0.14 },
      { at: OPT2_AT + 16, dur: 18, x: SPLIT_MID_X, y: 920, zoom: 1.01, pull: 0.14 },
      { at: TEASER_IN, dur: 18, x: CX, y: 860, zoom: 1.025, pull: 0.14 },
      { at: BYE_AT - 4, dur: 18, x: CX, y: 900, zoom: 1.01, pull: 0.12 },
    ],
  });
  for (const [at, amp] of [
    [OPT1_AT + 2, 3.0],
    [OPT2_AT + 2, 3.0],
    [TEASER_IN + 6, 3.8],
    [BYE_AT + 4, 5.2],
  ] as const) {
    const k = cameraKick(frame - at, amp);
    cam.x -= k.x;
    cam.y -= k.y;
  }
  return cam;
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame: rawF, pal, fontScale } = beginFrame(ctx, elapsed, params);
  // 一拍二：主体动作按偶数帧取整；镜头、粒子仍逐帧
  const frame = onTwos(rawF);
  const stillFrame = Math.min(frame, STILL_START);
  renderLayers(ctx, Math.min(rawF, STILL_START), pal, beatCamera(rawF), {
    leaves: 3,
    subject: (p) => {
      drawVotePhase(ctx, frame, stillFrame, p, params, fontScale);
      drawTeaserPhase(ctx, frame, p, params, fontScale);
      drawByePhase(ctx, frame, p, params, fontScale);
    },
  });
}

// ================= 幕一：左右半屏二选一投票「靠手感 / 靠鼻子」 =================
function drawVotePhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  stillFrame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < VOTE_IN) return;
  const out = easeInOutCubic(progress(frame, VOTE_OUT, VOTE_OUT + 12));
  if (out >= 1) return;

  const panelIn = easeOutCubic(progress(frame, VOTE_IN, VOTE_IN + 12));
  const leftHi = easeOutCubic(progress(frame, OPT1_AT - 2, OPT1_AT + 12));
  const rightHi = easeOutCubic(progress(frame, OPT2_AT - 2, OPT2_AT + 12));

  // 「用手」「用鼻子」说到时简笔图轻盈呼吸呼应
  const handPulse =
    Math.sin(Math.min(1, Math.max(0, (frame - HAND_PULSE_AT) / 18)) * Math.PI) * 0.08;
  const nosePulse =
    Math.sin(Math.min(1, Math.max(0, (frame - NOSE_PULSE_AT) / 18)) * Math.PI) * 0.08;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 左右半屏极淡宣纸色区 + 中央水墨竖隔线（严守 x ≤ 950, y ≤ 1560）
  {
    const topY = 300;
    const panelH = 1220; // 300..1520 < 1560
    ctx.save();
    ctx.globalAlpha *= Math.max(0.25, panelIn);
    ctx.fillStyle = rgba(pal.bamboo, 0.032 + leftHi * 0.036);
    ctx.beginPath();
    ctx.roundRect(42, topY, SPLIT_MID_X - 50, panelH, 20);
    ctx.fill();

    ctx.fillStyle = rgba(pal.cinnabar, 0.03 + rightHi * 0.034);
    ctx.beginPath();
    ctx.roundRect(SPLIT_MID_X + 8, topY, 950 - (SPLIT_MID_X + 8), panelH, 20);
    ctx.fill();

    const divPts: Pt[] = [
      { x: SPLIT_MID_X, y: topY + 26 },
      { x: SPLIT_MID_X - 2, y: 920 },
      { x: SPLIT_MID_X, y: topY + panelH - 26 },
    ];
    drawBrushStroke(ctx, divPts, Math.max(0.25, panelIn), {
      width: 4.8,
      color: rgba(pal.ink, 0.24),
      seed: 211,
      tail: 0.2,
    });
    ctx.restore();
  }

  // 下半区：简笔手捏茶（左）与简笔闻香鼻（右），0.5 秒内即同框落位
  {
    const lPose = heavyLand(frame - VOTE_IN + 4, { drop: 70, fall: 7, squash: 0.045 });
    const pinch = 0.35 + 0.35 * Math.sin(stillFrame * 0.09) + handPulse * 4;
    ctx.save();
    ctx.globalAlpha *= lPose.alpha;
    ctx.translate(OPT_COLS.x[0], 1220 + lPose.y);
    ctx.scale(lPose.scaleX * (1 + handPulse), lPose.scaleY * (1 + handPulse));
    drawHandGesture(ctx, pal, 1.12, { pinch });
    ctx.restore();

    const rPose = heavyLand(frame - VOTE_IN + 2, { drop: 70, fall: 7, squash: 0.045 });
    const sniff = 0.25 + 0.25 * Math.sin(stillFrame * 0.09 + 1.2) + nosePulse * 4;
    ctx.save();
    ctx.globalAlpha *= rPose.alpha;
    ctx.translate(OPT_COLS.x[1], 1220 + rPose.y);
    ctx.scale(rPose.scaleX * (1 + nosePulse), rPose.scaleY * (1 + nosePulse));
    drawNoseProfile(ctx, pal, 1.12, { frame: stillFrame, sniff });
    ctx.restore();
  }

  // 上半区：两列醒目竖排大字「靠手感」「靠鼻子」+ 毛笔圈
  const opts: [TextKey, number, string][] = [
    ["opt1", OPT1_AT, pal.bamboo],
    ["opt2", OPT2_AT, pal.cinnabar],
  ];
  opts.forEach(([key, at, ringColor], ci) => {
    const l = frame - (at - 2);
    if (l <= 0) return;
    const txt = t(params, key);
    const cs = chars(txt);
    const fs = fitSize(txt, OPT_COLS.size, 450, 1.04) * fontScale;
    const step = Math.min(OPT_COLS.step, fs * 1.06);
    const x = OPT_COLS.x[ci];
    const startY = 475;

    cs.forEach((ch, k) => {
      const cl = l - k * REVEAL_STEP;
      if (cl <= -2) return;
      const land = heavyLand(cl + 2, { drop: 24, fall: 3, squash: 0.07 });
      ctx.save();
      ctx.translate(x, startY + k * step + land.y);
      ctx.scale(land.scaleX, land.scaleY);
      inkText(ctx, ch, 0, 0, fs, easeOutCubic(progress(cl, 0, 9)), 220 + ci * 10 + k, {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    });

    const cy = startY + ((cs.length - 1) * step) / 2;
    const ry = ((cs.length - 1) * step) / 2 + fs * 0.68;
    brushRing(
      ctx,
      x,
      cy,
      fs * 0.86,
      ry,
      progress(l, 4 + cs.length * 2, 18 + cs.length * 2),
      ringColor,
      235 + ci,
      8.5,
    );
  });

  ctx.restore();
}

// ================= 幕二：下期预告「三秒能判断吗？」 =================
function drawTeaserPhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < TEASER_IN) return;
  const out = easeInOutCubic(progress(frame, BYE_AT - 10, BYE_AT + 2));
  if (out >= 1) return;

  const tl = frame - TEASER_IN;
  const cakePose = heavyLand(tl, { drop: 90, fall: 7, squash: 0.045 });

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 居中大字「三秒能判断吗？」
  const hl = frame - TEASER_AT;
  if (hl > -2) {
    const txt = t(params, "teaser");
    inkText(
      ctx,
      txt,
      CX,
      520,
      fitSize(txt, 114, 820) * fontScale,
      easeOutCubic(progress(hl, -2, 12)),
      301,
      {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.03,
      },
    );
  }

  // 主体：蜜韵饼茶 + 右上一笔朱砂问号
  if (cakePose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha *= cakePose.alpha;
    ctx.translate(CX, 985 + cakePose.y);
    ctx.scale(cakePose.scaleX, cakePose.scaleY);
    drawMiyunCake(ctx, 188);
    ctx.restore();

    const qp = easeOutCubic(progress(tl, 6, 20));
    if (qp > 0.01) {
      const qx = CX + 225;
      const qy = 815;
      const qPts: Pt[] = [
        { x: qx - 26, y: qy - 46 },
        { x: qx - 2, y: qy - 74 },
        { x: qx + 36, y: qy - 70 },
        { x: qx + 50, y: qy - 38 },
        { x: qx + 34, y: qy - 4 },
        { x: qx + 6, y: qy + 18 },
        { x: qx + 2, y: qy + 50 },
      ];
      drawBrushStroke(ctx, qPts, qp, { width: 13, color: pal.cinnabar, seed: 311, tail: 0.3 });
      const dp = easeOutCubic(progress(tl, 14, 20));
      if (dp > 0) {
        ctx.fillStyle = pal.cinnabar;
        ctx.beginPath();
        ctx.arc(qx + 2, qy + 82, 9.5 * dp, 0, TAU * 0.9995);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

// ================= 幕三：「下期见」居中干净收尾 =================
function drawByePhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const bl = frame - (BYE_AT - 6);
  if (bl <= 0) return;

  const byeTxt = t(params, "bye");

  // 居中极淡墨晕衬底
  drawTitleInkHalo(ctx, CX, 910, 260, 120, bl, pal.ink, 331, 0.85);

  // 居中大字「下期见」
  beatWord(ctx, frame, VO, "下期见", byeTxt, CX, 865, fitSize(byeTxt, 144, 680) * fontScale, {
    accent: "见",
    color: pal.ink,
    font: SONG,
    weight: 900,
    wash: 0.03,
  });

  // 正下方居中一枚温润朱砂小印「下期见」
  const sealL = frame - (BYE_AT - 8);
  if (sealL > 0) {
    drawSeal(ctx, {
      text: byeTxt,
      x: CX,
      y: 1110,
      size: 158 * fontScale ** 0.5,
      pose: sealPress(sealL, { lift: 8, press: 4, height: 75, rot: 0.04 }),
      color: pal.cinnabar,
      paper: pal.paper,
      font: SEAL_FONT,
      seed: 37,
    });
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
