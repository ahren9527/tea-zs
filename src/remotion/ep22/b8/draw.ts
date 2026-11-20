/**
 * 第 22 期 B8「投票预告」逐帧画布（1080×1920）
 */
import {
  TAU,
  cameraAt,
  cameraKick,
  drawBrushStroke,
  drawSeal,
  drawSteam,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  lightFloat,
  mixHex,
  progress,
  sealPress,
  steamWisps,
  type FxPalette,
  type Pt,
} from "../kit/fx";
import { SEAL_FONT, type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  beginFrame,
  brushRing,
  chars,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawGooseneckBag, drawPeBag, drawSuxueCake } from "../kit/objects";
import {
  BYE_HIT,
  BYE_SEAL,
  HEAD_AT,
  IN_MOIST_AT,
  LENGTH,
  OPT1_AT,
  OPT2_AT,
  OPT_COLS,
  OUT_DAMP_AT,
  REVEAL_STEP,
  STD_AT,
  TEASER_CAKE,
  TEASER_IN,
  TEXT,
  VOTE_IN,
  VOTE_OUT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.06,
    drift: 5,
    focus: [
      { at: OPT1_AT - 4, dur: 18, x: OPT_COLS.x[0], y: 820, zoom: 1.04, pull: 0.2 },
      { at: OPT2_AT - 4, dur: 18, x: OPT_COLS.x[1], y: 820, zoom: 1.04, pull: 0.2 },
      { at: TEASER_IN, dur: 22, x: 540, y: 920, zoom: 1.02, pull: 0.16 },
      { at: IN_MOIST_AT, dur: 22, x: 540, y: 940, zoom: 1.06, pull: 0.22 },
      { at: BYE_HIT - 8, dur: 22, x: 540, y: 980, zoom: 1.01, pull: 0.12 },
    ],
  });
  for (const [at, amp] of [
    [OPT1_AT, 3.5],
    [OPT2_AT, 3.5],
    [TEASER_IN + 8, 4.5],
    [BYE_HIT, 6],
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
    subject: (p) => {
      drawVotePhase(ctx, frame, p, params, fontScale);
      drawTeaserPhase(ctx, frame, p, params, fontScale);
    },
  });
}

// ================= 幕一：二选一投票「拉链口 / 扎带勒口」 =================
function drawVotePhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < VOTE_IN) return;
  const out = easeInOutCubic(progress(frame, VOTE_OUT, VOTE_OUT + 14));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 下方左右两个对应袋口实物简图
  {
    const lPose = heavyLand(frame - (VOTE_IN + 4), { drop: 100, fall: 8, squash: 0.05 });
    if (lPose.alpha > 0) {
      ctx.save();
      ctx.globalAlpha *= lPose.alpha;
      ctx.translate(OPT_COLS.x[0], 1245 + lPose.y);
      ctx.scale(lPose.scaleX, lPose.scaleY);
      drawPeBag(ctx, pal, 290, 320, { mode: "ziplock", leak: 0.65, thickEdge: 0.3, frame });
      ctx.restore();
    }
    const rPose = heavyLand(frame - (VOTE_IN + 9), { drop: 100, fall: 8, squash: 0.05 });
    if (rPose.alpha > 0) {
      ctx.save();
      ctx.globalAlpha *= rPose.alpha;
      ctx.translate(OPT_COLS.x[1], 1245 + rPose.y);
      ctx.scale(0.54 * rPose.scaleX, 0.54 * rPose.scaleY);
      drawGooseneckBag(ctx, pal, { squeeze: 1, twist: 1, fold: 1, tie1: 1, tie2: 1, frame });
      ctx.restore();
    }
  }

  // 两列竖排大字：「拉链口」「扎带勒口」，说到时各自毛笔圈住
  const opts: [TextKey, number, string][] = [
    ["opt1", OPT1_AT, pal.cinnabar],
    ["opt2", OPT2_AT, pal.bamboo],
  ];
  opts.forEach(([key, at, ringColor], ci) => {
    const l = frame - (at - 2);
    if (l <= 0) return;
    const txt = t(params, key);
    const cs = chars(txt);
    const fs = fitSize(txt, OPT_COLS.size, 520, 1.06) * fontScale;
    const step = Math.min(OPT_COLS.step, fs * 1.06);
    const x = OPT_COLS.x[ci];
    cs.forEach((ch, k) => {
      const cl = l - k * REVEAL_STEP;
      if (cl <= -2) return;
      const land = heavyLand(cl + 2, { drop: 24, fall: 3, squash: 0.08 });
      ctx.save();
      ctx.translate(x, OPT_COLS.y + k * step + land.y);
      ctx.scale(land.scaleX, land.scaleY);
      inkText(ctx, ch, 0, 0, fs, easeOutCubic(progress(cl, 0, 10)), 220 + ci * 10 + k, {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    });
    const cy = OPT_COLS.y + ((cs.length - 1) * step) / 2;
    const ry = ((cs.length - 1) * step) / 2 + fs * 0.7;
    brushRing(
      ctx,
      x,
      cy,
      fs * 0.85,
      ry,
      progress(l, 6 + cs.length * REVEAL_STEP, 24 + cs.length * REVEAL_STEP),
      ringColor,
      235 + ci,
      8,
    );
  });

  ctx.restore();
}

// ================= 幕二：下期预告「含水量多少？」+ 「下期见」 =================
function drawTeaserPhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < TEASER_IN) return;
  const tl = frame - TEASER_IN;

  const cx = TEASER_CAKE.x;
  const cy = TEASER_CAKE.y;

  // 中心素雪茶饼 + 外围三层防护环
  const cakePose = heavyLand(tl, { drop: 130, fall: 9, squash: 0.045 });
  if (cakePose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha = cakePose.alpha;
    ctx.translate(cx, cy + cakePose.y);
    ctx.scale(cakePose.scaleX, cakePose.scaleY);
    drawSuxueCake(ctx, pal, TEASER_CAKE.r, { seed: 22 });
    ctx.restore();

    const rings = [
      { r: 215, color: pal.bamboo, w: 7, delay: 4 },
      { r: 255, color: mixHex(pal.ink, "#8d8a82", 0.55), w: 9, delay: 9 },
      { r: 295, color: pal.tea, w: 7, delay: 14 },
    ];
    rings.forEach((rg, idx) => {
      const rl = tl - rg.delay;
      if (rl <= 0) return;
      const drawP = easeOutCubic(progress(rl, 0, 16));
      ctx.save();
      ctx.globalAlpha = Math.min(1, rl / 6);
      ctx.translate(cx, cy);
      ctx.strokeStyle = rg.color;
      ctx.lineWidth = rg.w;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, rg.r, -Math.PI * 0.5 + idx * 0.4, -Math.PI * 0.5 + idx * 0.4 + TAU * Math.min(drawP, 0.9995));
      ctx.stroke();
      ctx.restore();
    });

    // 外部潮气被三层挡在外侧弹开
    const dampP = easeOutCubic(progress(frame, OUT_DAMP_AT, OUT_DAMP_AT + 14));
    if (dampP > 0) {
      ctx.save();
      ctx.globalAlpha = dampP * 0.78;
      const angles = [-2.5, -1.9, -0.5, 0.2, 2.7];
      angles.forEach((a, i) => {
        const bounce = 345 + Math.abs(Math.sin(frame * 0.12 + i * 1.1)) * 32;
        const dx = cx + Math.cos(a) * bounce;
        const dy = cy + Math.sin(a) * bounce;
        ctx.fillStyle = "#5a889c";
        ctx.beginPath();
        ctx.moveTo(dx, dy - 14);
        ctx.quadraticCurveTo(dx + 11, dy + 4, dx, dy + 12);
        ctx.quadraticCurveTo(dx - 11, dy + 4, dx, dy - 14);
        ctx.fill();
      });
      ctx.restore();
    }

    // 「挡不住茶自己带的水分」：水汽直接从茶饼内部升腾出来
    const inP = easeOutCubic(progress(frame, IN_MOIST_AT, IN_MOIST_AT + 18));
    if (inP > 0) {
      drawSteam(
        ctx,
        steamWisps(frame, 6, { x: cx, y: cy + 50, w: 190 }, 37, 360),
        "#5b8ea6",
        1.45 * inP,
      );
    }
  }

  // 顶部下期悬念大字「含水量多少？」
  const hl = frame - (HEAD_AT - 4);
  if (hl > 0) {
    const txt = t(params, "teaser");
    const pose = lightFloat(hl, { rise: 22, sway: 0.6, seed: 9 });
    inkText(ctx, txt, 540, 420 + pose.y, fitSize(txt, 118, 820) * fontScale, easeOutCubic(progress(hl, 0, 14)), 301, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }

  // 「国标合格就稳了吗？」：右上角一笔醒目朱砂问号（落印时退场）
  const ql = frame - STD_AT;
  const byeFade = easeInOutCubic(progress(frame, BYE_HIT - 12, BYE_HIT + 4));
  if (ql > 0 && byeFade < 1) {
    const qp = easeOutCubic(progress(ql, 0, 14));
    const qx = cx + 295;
    const qy = cy - 235;
    ctx.save();
    ctx.globalAlpha = 1 - byeFade;
    const qPts: Pt[] = [
      { x: qx - 30, y: qy - 52 },
      { x: qx - 4, y: qy - 84 },
      { x: qx + 40, y: qy - 80 },
      { x: qx + 58, y: qy - 44 },
      { x: qx + 42, y: qy - 6 },
      { x: qx + 8, y: qy + 20 },
      { x: qx + 4, y: qy + 58 },
    ];
    drawBrushStroke(ctx, qPts, qp, { width: 14, color: pal.cinnabar, seed: 311, tail: 0.3 });
    const dp = easeOutCubic(progress(ql, 9, 15));
    if (dp > 0) {
      ctx.fillStyle = pal.cinnabar;
      ctx.beginPath();
      ctx.arc(qx + 4, qy + 92, 10 * dp, 0, TAU * 0.9995);
      ctx.fill();
    }
    ctx.restore();
  }

  // 茶饼正下方朱砂印「下期见」
  const bl = frame - (BYE_HIT - 12);
  if (bl > 0) {
    drawSeal(ctx, {
      text: t(params, "bye"),
      x: BYE_SEAL.x,
      y: BYE_SEAL.y,
      size: BYE_SEAL.size * fontScale ** 0.5,
      pose: sealPress(bl, { lift: 8, press: 4, height: 75, rot: 0.05 }),
      color: pal.cinnabar,
      paper: pal.paper,
      font: SEAL_FONT,
      seed: 37,
    });
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "素雪白牡丹茶正上茶舍一叶倾心净含量克");
}
