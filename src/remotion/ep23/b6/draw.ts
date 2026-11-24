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
import { anticipateMove, boilOffset, followThrough, onTwos } from "../kit/hand";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  drawBeatText,
  beginFrame,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawLooseTeaPile, drawMiyunCake, drawMoistureScale, drawWaterDrop } from "../kit/objects";
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
import { VO } from "./data";

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
  const { frame: rawF, pal, fontScale } = beginFrame(ctx, elapsed, params);
  // 一拍二：主体动作按偶数帧取整；镜头、粒子仍逐帧
  const frame = onTwos(rawF);
  const stillFrame = Math.min(frame, STILL_START);
  renderLayers(ctx, Math.min(rawF, STILL_START), pal, beatCamera(rawF), {
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
  // 演而不讲：不打叉、不画垃圾桶——让这堆受潮散茶自己「坏给你看」：
  // 发暗 → 起一层灰白霉绒 → 先往上一缩（预备）再整堆滑落出画，碎叶晚几帧跟着掉（跟随），纸上只剩一圈水渍。
  const moldP = easeOutCubic(progress(frame, PHASE2_AT, PHASE2_AT + 34));
  const throwL = frame - (THROW_AT + 22); // 预备踩在「全」，滑落踩在「扔」
  const mv = anticipateMove(throwL, { prep: 8, back: 0.06 });
  const fall = Math.max(-0.06, mv);
  const PILE_Y = 900;

  // 纸上的水渍（茶堆在时被压着，掉走后露出来，留到片尾）
  const stainP = clamp01(fall * 1.4) * pIn;
  if (stainP > 0.01) {
    ctx.save();
    ctx.globalAlpha = stainP;
    // 只留一圈淡褐水渍边（中间不填色，像茶堆压过的湿印子）
    ctx.strokeStyle = rgba("#7c5840", 0.14);
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const w = 1 + 0.05 * Math.sin(a * 3 + 1) + 0.03 * Math.sin(a * 7);
      const px = MID_X + Math.cos(a) * 230 * w;
      const py = PILE_Y + 30 + Math.sin(a) * 140 * w;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = rgba("#8a7a5c", 0.06);
    ctx.fill();
    ctx.restore();
  }

  // 受潮散茶堆
  const pileY = PILE_Y + (fall > 0 ? fall * fall * 980 : fall * 160);
  const squash = fall < 0 ? -fall * 1.2 : 0;
  const alpha = pIn * clamp01(1 - Math.max(0, fall - 0.55) / 0.35);
  if (alpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(MID_X, pileY);
    ctx.rotate(Math.max(0, fall) * 0.42);
    ctx.scale(1.35 * (1 + squash), 1.35 * (1 - squash));
    drawLooseTeaPile(ctx, pal, 185, 132, { fluff: 0.6, damp: 0.95 + moldP * 0.05, seed: 66 });
    // 灰白霉绒：一簇簇从边缘往里冒，绒边毛糙
    drawMold(ctx, moldP, frame);
    ctx.restore();
  }

  // 跟随：几片碎叶比茶堆晚 5 帧才开始掉，落得更慢
  const lag = followThrough(throwL, 5);
  if (throwL > 0 && lag > 0.01) {
    for (let i = 0; i < 6; i++) {
      const sx = MID_X - 150 + i * 60 + Math.sin(i * 2.3) * 20;
      const sy = PILE_Y - 40 + (i % 3) * 30 + lag * lag * (700 + i * 60);
      const a = clamp01(1 - lag * 0.9) * 0.8;
      if (a <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(sx, sy);
      ctx.rotate(lag * (1.5 + i * 0.4));
      ctx.fillStyle = i % 2 ? rgba("#4c5341", 0.9) : rgba("#6a5a42", 0.9);
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 顶部朱砂大字「整批扔掉」：踩着「只能全扔掉」逐字落下
  const dTxt = t(params, "discard");
  // 「整批」踩「整批茶」，「扔掉」踩「全扔掉」里的「扔掉」
  const n = Array.from(dTxt).length;
  const cf =
    n === 4
      ? [...VO.charFrames("整批", 2), ...VO.charFrames("扔掉", 2)]
      : VO.charFrames("全扔掉", n);
  drawBeatText(ctx, frame, dTxt, MID_X, 455, fitSize(dTxt, 134, 760) * fontScale, {
    charFrames: cf,
    accent: "扔掉",
    color: pal.cinnabar,
    font: SONG,
    weight: 900,
  });
}

/** 散茶堆上的灰白霉绒（确定性；p 0→1 从边缘向内长） */
function drawMold(ctx: CanvasRenderingContext2D, p: number, frame: number) {
  if (p <= 0.01) return;
  const spots = [
    [-120, -20],
    [-70, -70],
    [10, -88],
    [90, -60],
    [135, 5],
    [60, 40],
    [-30, 30],
    [-140, 40],
    [20, -20],
  ];
  spots.forEach(([x, y], i) => {
    const local = clamp01((p - i * 0.07) / 0.5);
    if (local <= 0.01) return;
    const r = (18 + (i % 4) * 7) * local;
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, `rgba(236,236,226,${0.85 * local})`);
    g.addColorStop(0.6, `rgba(214,216,204,${0.55 * local})`);
    g.addColorStop(1, "rgba(214,216,204,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // 绒毛：几根细丝（每 3 帧随 boil 轻微换位）
    const b = boilOffset(frame, 900 + i, 0, 1.2);
    ctx.strokeStyle = `rgba(240,240,232,${0.6 * local})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + i;
      ctx.moveTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5);
      ctx.lineTo(x + Math.cos(a) * r * 1.15 + b.x, y + Math.sin(a) * r * 1.15 + b.y);
    }
    ctx.stroke();
  });
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "7%8.5");
}
