/**
 * 第 22 期 B8「投票预告」逐帧画布（1080×1920）
 * 升级：
 * - 幕一做成醒目二选一分屏：左右各占安全半屏（[40, 495] / [495, 950]），淡色底分栏 + 水墨竖分隔线 +
 *   放大后的拉链袋与双扎带鹅颈袋（均含素雪茶饼）+ 竖排大字 + 朱砂/竹青毛笔圈，完整同屏停留 ≥ 1.6s；
 * - 幕二放大素雪茶饼与三层防护环至 57% 画幅，全元素避开右侧 120px / 底部 300px，尾段 0.5s 静止。
 */
import {
  END_STILL_FRAMES,
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
  rgba,
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
  SPLIT_MID_X,
  STD_AT,
  TEASER_CAKE,
  TEASER_IN,
  TEXT,
  VOTE_IN,
  VOTE_OUT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const STILL_START = Math.max(0, LENGTH - END_STILL_FRAMES);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.045,
    drift: 4.5,
    focus: [
      { at: OPT1_AT - 4, dur: 18, x: OPT_COLS.x[0] + 60, y: 860, zoom: 1.025, pull: 0.14 },
      { at: OPT2_AT - 4, dur: 18, x: OPT_COLS.x[1] - 60, y: 860, zoom: 1.025, pull: 0.14 },
      { at: OPT2_AT + 16, dur: 16, x: SPLIT_MID_X, y: 900, zoom: 1.01, pull: 0.14 },
      { at: TEASER_IN, dur: 22, x: TEASER_CAKE.x, y: 940, zoom: 1.02, pull: 0.15 },
      { at: IN_MOIST_AT, dur: 22, x: TEASER_CAKE.x, y: 950, zoom: 1.045, pull: 0.18 },
      { at: BYE_HIT - 8, dur: 22, x: TEASER_CAKE.x, y: 980, zoom: 1.01, pull: 0.12 },
    ],
  });
  for (const [at, amp] of [
    [OPT1_AT, 3.2],
    [OPT2_AT, 3.2],
    [TEASER_IN + 8, 4.2],
    [BYE_HIT, 5.5],
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
    leaves: 4,
    subject: (p) => {
      drawVotePhase(ctx, frame, p, params, fontScale);
      drawTeaserPhase(ctx, frame, stillFrame, p, params, fontScale);
    },
  });
}

// ================= 幕一：左右半屏醒目二选一投票「拉链口 vs 扎带勒口」 =================
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

  const panelIn = easeOutCubic(progress(frame, VOTE_IN, VOTE_IN + 12));

  // 1) 左右各占安全半屏的极淡底色分区（[40, 495] 朱砂暖淡底 vs [495, 950] 竹青清淡底，避开右侧 120px 与底部 300px）
  if (panelIn > 0.01) {
    ctx.save();
    ctx.globalAlpha *= panelIn;
    const topY = 285;
    const panelH = 1235; // 285..1520 < 1620
    const leftHighlight = easeOutCubic(progress(frame, OPT1_AT - 2, OPT1_AT + 12));
    const rightHighlight = easeOutCubic(progress(frame, OPT2_AT - 2, OPT2_AT + 12));

    ctx.fillStyle = rgba(pal.cinnabar, 0.032 + leftHighlight * 0.032);
    ctx.beginPath();
    ctx.roundRect(42, topY, SPLIT_MID_X - 50, panelH, 22);
    ctx.fill();

    ctx.fillStyle = rgba(pal.bamboo, 0.032 + rightHighlight * 0.038);
    ctx.beginPath();
    ctx.roundRect(SPLIT_MID_X + 8, topY, 950 - (SPLIT_MID_X + 8), panelH, 22);
    ctx.fill();

    // 淡墨竖向分隔笔触
    const divPts: Pt[] = [
      { x: SPLIT_MID_X, y: 315 },
      { x: SPLIT_MID_X - 2, y: 690 },
      { x: SPLIT_MID_X + 2, y: 1120 },
      { x: SPLIT_MID_X, y: 1495 },
    ];
    drawBrushStroke(ctx, divPts, panelIn, {
      width: 5,
      color: rgba(pal.ink, 0.24),
      seed: 211,
      tail: 0.2,
    });
    ctx.restore();
  }

  // 2) 下半区放大后的两只实物袋子示意（开场 0.5 秒内即同步落位，均含素雪茶饼，共占画幅 74%）
  {
    const lPose = heavyLand(frame - VOTE_IN + 3, { drop: 90, fall: 8, squash: 0.045 });
    if (lPose.alpha > 0) {
      ctx.save();
      ctx.globalAlpha *= lPose.alpha;
      ctx.translate(OPT_COLS.x[0], 1260 + lPose.y);
      ctx.scale(lPose.scaleX, lPose.scaleY);
      drawPeBag(ctx, pal, 370, 420, {
        mode: "ziplock",
        leak: 0.65,
        thickEdge: 0.35,
        inside: () => drawSuxueCake(ctx, pal, 130, { seed: 22 }),
        frame,
      });
      ctx.restore();
    }

    const rPose = heavyLand(frame - VOTE_IN + 1, { drop: 90, fall: 8, squash: 0.045 });
    if (rPose.alpha > 0) {
      ctx.save();
      ctx.globalAlpha *= rPose.alpha;
      ctx.translate(OPT_COLS.x[1] - 7, 1225 + rPose.y);
      ctx.scale(0.78 * rPose.scaleX, 0.78 * rPose.scaleY);
      drawGooseneckBag(ctx, pal, { squeeze: 1, twist: 1, fold: 1, tie1: 1, tie2: 1, frame });
      ctx.restore();
    }
  }

  // 3) 上半区两列醒目竖排大字：「拉链口」「扎带勒口」，说到时各自毛笔圈住
  const opts: [TextKey, number, string, number][] = [
    ["opt1", OPT1_AT, pal.cinnabar, 445],
    ["opt2", OPT2_AT, pal.bamboo, 415],
  ];
  opts.forEach(([key, at, ringColor, startY], ci) => {
    const l = frame - (at - 2);
    if (l <= 0) return;
    const txt = t(params, key);
    const cs = chars(txt);
    const fs = fitSize(txt, OPT_COLS.size, 470, 1.04) * fontScale;
    const step = Math.min(OPT_COLS.step, fs * 1.04);
    const x = OPT_COLS.x[ci];
    cs.forEach((ch, k) => {
      const cl = l - k * REVEAL_STEP;
      if (cl <= -2) return;
      const land = heavyLand(cl + 2, { drop: 24, fall: 3, squash: 0.075 });
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

// ================= 幕二：下期预告「含水量多少？」+ 「下期见」 =================
function drawTeaserPhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  stillFrame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < TEASER_IN) return;
  const tl = frame - TEASER_IN;

  const cx = TEASER_CAKE.x;
  const cy = TEASER_CAKE.y;

  // 中心素雪茶饼（r=200）+ 外围三层防护环（最外圈直径 620px ≈ 57.4% 画幅）
  const cakePose = heavyLand(tl, { drop: 120, fall: 9, squash: 0.045 });
  if (cakePose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha = cakePose.alpha;
    ctx.translate(cx, cy + cakePose.y);
    ctx.scale(cakePose.scaleX, cakePose.scaleY);
    drawSuxueCake(ctx, pal, TEASER_CAKE.r, { seed: 22 });
    ctx.restore();

    const rings = [
      { r: 240, color: pal.bamboo, w: 7.5, delay: 4 },
      { r: 275, color: mixHex(pal.ink, "#8d8a82", 0.55), w: 9.5, delay: 9 },
      { r: 310, color: pal.tea, w: 7.5, delay: 14 },
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

    // 外部潮气被三层挡在外侧弹开（最右侧 <= 886 < 960；尾段 0.5s 用 stillFrame 静止）
    const dampP = easeOutCubic(progress(frame, OUT_DAMP_AT, OUT_DAMP_AT + 14));
    if (dampP > 0) {
      ctx.save();
      ctx.globalAlpha = dampP * 0.78;
      const angles = [-2.5, -1.9, -0.45, 0.25, 2.7];
      angles.forEach((a, i) => {
        const bounce = 342 + Math.abs(Math.sin(stillFrame * 0.12 + i * 1.1)) * 24;
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

    // 「挡不住茶自己带的水分」：水汽直接从茶饼内部升腾出来（尾段 0.5s 平滑静止）
    const inP = easeOutCubic(progress(frame, IN_MOIST_AT, IN_MOIST_AT + 18));
    if (inP > 0) {
      drawSteam(
        ctx,
        steamWisps(stillFrame, 6, { x: cx, y: cy + 50, w: 210 }, 37, 360),
        "#5b8ea6",
        1.45 * inP,
      );
    }
  }

  // 顶部下期悬念大字「含水量多少？」（安全居中 x=520）
  const hl = frame - (HEAD_AT - 4);
  if (hl > 0) {
    const txt = t(params, "teaser");
    const pose = lightFloat(Math.min(hl, STILL_START - (HEAD_AT - 4)), { rise: 20, sway: 0.45, seed: 9 });
    inkText(ctx, txt, cx, 395 + pose.y, fitSize(txt, 120, 800) * fontScale, easeOutCubic(progress(hl, 0, 14)), 301, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }

  // 「国标合格就稳了吗？」：右上角一笔醒目朱砂问号（最右侧 853 < 960；落印时退场）
  const ql = frame - STD_AT;
  const byeFade = easeInOutCubic(progress(frame, BYE_HIT - 12, BYE_HIT + 4));
  if (ql > 0 && byeFade < 1) {
    const qp = easeOutCubic(progress(ql, 0, 14));
    const qx = cx + 275;
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

  // 茶饼正下方朱砂印「下期见」（y=1445, size=184 → 下缘 1537 < 1620）
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
