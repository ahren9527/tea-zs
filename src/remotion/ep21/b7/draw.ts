/**
 * 第 21 期 B7「收尾」逐帧画布（1080×1920）。
 * A 金句竖排对联「年份分开放 / 香气不打架」逐字晕开，旁配完整白茶芽叶与柔润茶香
 * B 二选一投票「混放派 / 分区派」两列竖排大字 + 下方混放茶格 vs 分区茶格，说到时毛笔圈住
 * C 下期预告：大字「三层包装法」+ 中心蜜韵茶饼外围三层包装环依次合拢 → 抽掉一层冒出朱砂问号 → 落印「下期见」
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
  rgba,
  sealPress,
  steamWisps,
  traceLeaf,
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
  softShadow,
  textOf,
} from "../kit/draw-kit";
import { drawLooseTea, drawMiyunCake } from "../kit/objects";
import {
  BYE_HIT,
  BYE_SEAL,
  REVEAL_STEP,
  GOLD1_AT,
  GOLD2_AT,
  GOLD_OUT,
  GOLD_X,
  GOLD_Y,
  LAYERS_AT,
  LENGTH,
  MISS_AT,
  OPT1_AT,
  OPT2_AT,
  OPT_COLS,
  TEASER_AT,
  TEASER_CAKE,
  TEASER_HEAD,
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
      { at: GOLD1_AT, dur: 22, x: 540, y: 860, zoom: 1.03, pull: 0.18 },
      { at: OPT1_AT - 4, dur: 20, x: OPT_COLS.x[0], y: 820, zoom: 1.05, pull: 0.22 },
      { at: OPT2_AT - 4, dur: 20, x: OPT_COLS.x[1], y: 820, zoom: 1.05, pull: 0.22 },
      { at: TEASER_AT, dur: 24, x: 540, y: 920, zoom: 1.03, pull: 0.2 },
      { at: MISS_AT, dur: 20, x: 540, y: 980, zoom: 1.07, pull: 0.26 },
    ],
  });
  for (const [at, amp] of [
    [GOLD2_AT + 4, 4],
    [TEASER_AT + 8, 5],
    [BYE_HIT, 5],
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
      drawGoldPhase(ctx, frame, p, params, fontScale);
      drawVotePhase(ctx, frame, p, params, fontScale);
      drawTeaserPhase(ctx, frame, p, params, fontScale);
    },
  });
}

// ================= A：金句「年份分开放，香气不打架」 =================
function drawGoldPhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < GOLD1_AT - 2) return;
  const out = easeInOutCubic(progress(frame, GOLD_OUT, GOLD_OUT + 14));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  const cols: [TextKey, number][] = [
    ["gold1", GOLD1_AT],
    ["gold2", GOLD2_AT],
  ];
  cols.forEach(([key, at], ci) => {
    const txt = t(params, key);
    const cs = chars(txt);
    const fs = fitSize(txt, 168, 920, 1.06) * fontScale;
    const step = fs * 1.06;
    const top = GOLD_Y[ci] - ((cs.length - 1) * step) / 2;
    cs.forEach((ch, k) => {
      const l = frame - (at + k * REVEAL_STEP);
      if (l <= -2) return;
      const pose = lightFloat(l + 2, { rise: 18, sway: 1, seed: k + ci * 5 });
      inkText(
        ctx,
        ch,
        GOLD_X[ci],
        top + k * step + pose.y,
        fs,
        easeOutCubic(progress(l, 0, 12)),
        200 + ci * 10 + k,
        {
          color: pal.ink,
          weight: 900,
          font: SONG,
          wash: 0.025,
        },
      );
    });

    // 右联旁一片舒展白茶叶，左联旁一缕温润陈香
    const deco = frame - (at + cs.length * REVEAL_STEP - 4);
    if (deco > 0) {
      const a = easeOutCubic(progress(deco, 0, 16));
      if (ci === 0) {
        const f = lightFloat(deco, { rise: 26, sway: 6, seed: 3 });
        drawWholeLeaf(ctx, pal, GOLD_X[0] + 150, top + step * 3.7 + f.y, -0.85 + f.rot * 3, a);
      } else {
        drawSteam(
          ctx,
          steamWisps(frame, 3, { x: GOLD_X[1] - 150, y: top + step * 4.5, w: 50 }, 23, 350),
          mixHex(pal.oat, pal.tea, 0.35),
          1.2 * a,
        );
      }
    }
  });

  // 两联之间一道竹青竖线（「年份分开放」呼应分界）
  const lp = easeInOutCubic(progress(frame, GOLD1_AT + 6, GOLD2_AT + 18));
  drawBrushStroke(
    ctx,
    [
      { x: 550, y: 450 },
      { x: 548, y: 1280 },
    ],
    lp,
    { width: 3.2, color: pal.bamboo, seed: 221, tail: 0.3, head: 0.05, alpha: 0.42 },
  );

  ctx.restore();
}

function drawWholeLeaf(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  x: number,
  y: number,
  rot: number,
  a: number,
) {
  const len = 128;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = rgba("#2a1a0c", 0.16);
  ctx.beginPath();
  traceLeaf(ctx, x + 12, y + 18, rot, len, len * 0.36);
  ctx.fill();
  const g = ctx.createLinearGradient(x - 60, y - 60, x + 60, y + 60);
  g.addColorStop(0, mixHex(pal.bamboo, "#d9d2a8", 0.35));
  g.addColorStop(1, mixHex(pal.bamboo, "#2f3a1f", 0.25));
  ctx.fillStyle = g;
  ctx.beginPath();
  traceLeaf(ctx, x, y, rot, len, len * 0.36);
  ctx.fill();
  ctx.strokeStyle = rgba("#2f3a1f", 0.5);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - Math.cos(rot) * len * 0.45, y - Math.sin(rot) * len * 0.45);
  ctx.lineTo(x + Math.cos(rot) * len * 0.45, y + Math.sin(rot) * len * 0.45);
  ctx.stroke();
  ctx.restore();
}

// ================= B：二选一投票「混放派 / 分区派」 =================
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

  // 下方左右两个示意木格：左格混放（散茶+老茶饼挤一起），右格分区（竹青隔板分开）
  const boxY = 1230;
  const boxW = 360;
  const boxH = 310;

  // 左：混放盒
  {
    const pose = heavyLand(frame - (VOTE_IN + 2), { drop: 110, fall: 8, squash: 0.05 });
    if (pose.alpha > 0) {
      const cx = OPT_COLS.x[0];
      ctx.save();
      ctx.globalAlpha *= pose.alpha;
      ctx.translate(cx, boxY + pose.y);
      ctx.scale(pose.scaleX, pose.scaleY);
      drawMiniTray(ctx, pal, boxW, boxH, false);
      ctx.save();
      ctx.translate(-55, 8);
      drawLooseTea(ctx, pal, 98, { tone: "new", seed: 61 });
      ctx.restore();
      ctx.save();
      ctx.translate(52, 12);
      drawMiyunCake(ctx, pal, 90, { tone: "old", peel: 0.45, showLabel: false });
      ctx.restore();
      ctx.restore();
    }
  }

  // 右：分区盒
  {
    const pose = heavyLand(frame - (VOTE_IN + 6), { drop: 110, fall: 8, squash: 0.05 });
    if (pose.alpha > 0) {
      const cx = OPT_COLS.x[1];
      ctx.save();
      ctx.globalAlpha *= pose.alpha;
      ctx.translate(cx, boxY + pose.y);
      ctx.scale(pose.scaleX, pose.scaleY);
      drawMiniTray(ctx, pal, boxW, boxH, true);
      ctx.save();
      ctx.translate(-82, 8);
      drawLooseTea(ctx, pal, 78, { tone: "new", seed: 62 });
      ctx.restore();
      ctx.save();
      ctx.translate(82, 8);
      drawMiyunCake(ctx, pal, 76, { tone: "old", peel: 0.45, showLabel: false });
      ctx.restore();
      ctx.restore();
    }
  }

  // 两列竖排大字：「混放派」「分区派」，说到时各被毛笔圈住
  const opts: [TextKey, number, string][] = [
    ["opt1", OPT1_AT, pal.cinnabar],
    ["opt2", OPT2_AT, pal.bamboo],
  ];
  opts.forEach(([key, at, ringColor], ci) => {
    const l = frame - (at - 2);
    if (l <= 0) return;
    const txt = t(params, key);
    const cs = chars(txt);
    const fs = fitSize(txt, OPT_COLS.size, 560, 1.06) * fontScale;
    const step = Math.min(OPT_COLS.step, fs * 1.06);
    const x = OPT_COLS.x[ci];
    cs.forEach((ch, k) => {
      const cl = l - k * REVEAL_STEP;
      if (cl <= -2) return;
      const land = heavyLand(cl + 2, { drop: 24, fall: 3, squash: 0.08 });
      ctx.save();
      ctx.translate(x, OPT_COLS.y + k * step + land.y);
      ctx.scale(land.scaleX, land.scaleY);
      inkText(ctx, ch, 0, 0, fs, easeOutCubic(progress(cl, 0, 10)), 240 + ci * 10 + k, {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    });
    const cy = OPT_COLS.y + ((cs.length - 1) * step) / 2;
    const ry = ((cs.length - 1) * step) / 2 + fs * 0.72;
    brushRing(
      ctx,
      x,
      cy,
      fs * 0.85,
      ry,
      progress(l, 6 + cs.length * REVEAL_STEP, 24 + cs.length * REVEAL_STEP),
      ringColor,
      250 + ci,
      8,
    );
  });

  ctx.restore();
}

function drawMiniTray(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  divided: boolean,
) {
  const wood = mixHex(pal.tea, "#4a2c18", 0.35);
  softShadow(
    ctx,
    () => {
      ctx.roundRect(-w / 2, -h / 2, w, h, 14);
    },
    { blur: 24, dx: 10, dy: 16, alpha: 0.26 },
  );
  ctx.fillStyle = mixHex(pal.paper, pal.oat, 0.35);
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 14);
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = wood;
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 10);
  ctx.stroke();

  if (divided) {
    ctx.fillStyle = pal.bamboo;
    ctx.fillRect(-5, -h / 2 + 14, 10, h - 28);
  }
}

// ================= C：下期预告「三层包装法」 =================
function drawTeaserPhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < TEASER_AT) return;
  const tl = frame - TEASER_AT;

  // 顶部预告大字「三层包装法」
  {
    const txt = t(params, "teaser");
    const fs = fitSize(txt, TEASER_HEAD.size, 760) * fontScale;
    const pose = lightFloat(tl, { rise: 18, sway: 1, seed: 9 });
    inkText(ctx, txt, TEASER_HEAD.x, TEASER_HEAD.y + pose.y, fs, easeOutCubic(progress(tl, 0, 14)), 301, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }

  // 中心蜜韵茶饼 + 外围三层护茶圈（内层棉纸、中层自封袋、外层铝箔袋/纸箱）
  const cakePose = heavyLand(tl - 2, { drop: 140, fall: 9, squash: 0.045 });
  if (cakePose.alpha > 0) {
    const cx = TEASER_CAKE.x;
    const cy = TEASER_CAKE.y;

    // 三层护茶圈：说「哪三层」时由内到外依次画满（不加小字编号）；「少一层」时中间一层向右滑出、完全消失
    const missP = easeInOutCubic(progress(frame, MISS_AT, MISS_AT + 18));
    const byeP = easeInOutCubic(progress(frame, BYE_HIT - 12, BYE_HIT + 4));
    const rings = [
      { r: 238, color: mixHex(pal.tea, "#d8c4a0", 0.3), w: 7, delay: 0, peel: false },
      { r: 288, color: pal.bamboo, w: 9, delay: 6, peel: true },
      { r: 338, color: mixHex(pal.tea, pal.ink, 0.4), w: 7, delay: 12, peel: false },
    ];
    // 中心蜜韵茶饼
    ctx.save();
    ctx.globalAlpha = cakePose.alpha;
    ctx.translate(cx, cy + cakePose.y);
    ctx.scale(cakePose.scaleX, cakePose.scaleY);
    drawMiyunCake(ctx, pal, TEASER_CAKE.r, {
      tone: "old",
      peel: 0.42,
      peelAngle: -0.6,
      seed: 21,
    });
    ctx.restore();

    rings.forEach((rg, idx) => {
      const rl = frame - (LAYERS_AT + rg.delay);
      if (rl <= 0) return;
      const drawP = easeOutCubic(progress(rl, 0, 16));
      const out = rg.peel ? missP : 0;
      ctx.save();
      ctx.globalAlpha *= Math.min(1, rl / 6) * (1 - out);
      ctx.translate(cx + out * 200, cy - out * 40);
      ctx.strokeStyle = rg.color;
      ctx.lineWidth = rg.w;
      ctx.lineCap = "round";
      ctx.beginPath();
      // 扫角封顶 0.9995 圈：整 2π 时 Skia 偶尔整圈不画
      ctx.arc(0, 0, rg.r, -Math.PI * 0.5 + idx * 0.4, -Math.PI * 0.5 + idx * 0.4 + TAU * Math.min(drawP, 0.9995));
      ctx.stroke();
      ctx.restore();
    });


    // 「少一层会如何？」：抽离处一笔醒目朱砂问号
    const ml = frame - (MISS_AT + 4);
    if (ml > 0) {
      const qp = easeOutCubic(progress(ml, 0, 12));
      const qx = cx + 285;
      const qy = cy - 250;
      ctx.save();
      ctx.globalAlpha *= 1 - byeP; // 落印时问号退场，结尾只留「三层包装法」+ 印
      const qPts: Pt[] = [
        { x: qx - 32, y: qy - 54 },
        { x: qx - 6, y: qy - 88 },
        { x: qx + 42, y: qy - 84 },
        { x: qx + 62, y: qy - 46 },
        { x: qx + 44, y: qy - 6 },
        { x: qx + 8, y: qy + 22 },
        { x: qx + 4, y: qy + 62 },
      ];
      drawBrushStroke(ctx, qPts, qp, {
        width: 14,
        color: pal.cinnabar,
        seed: 291,
        tail: 0.3,
      });
      const dp = easeOutCubic(progress(ml, 9, 15));
      if (dp > 0) {
        ctx.fillStyle = pal.cinnabar;
        ctx.beginPath();
        ctx.arc(qx + 4, qy + 98, 10 * dp, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // 茶饼正下方朱印「下期见」（居中，不贴边）
  const bl = frame - (BYE_HIT - 12);
  if (bl > 0) {
    drawSeal(ctx, {
      text: t(params, "bye"),
      x: BYE_SEAL.x,
      y: BYE_SEAL.y,
      size: BYE_SEAL.size * fontScale ** 0.5,
      pose: sealPress(bl, { lift: 8, press: 4, height: 75, rot: 0.06 }),
      color: pal.cinnabar,
      paper: pal.paper,
      font: SEAL_FONT,
      seed: 31,
    });
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
