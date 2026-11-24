/**
 * 第 23 期 B2「国标不超过」逐帧画布（1080×1920）
 * 幕一：国标文件纸页（GB/T 22291—2017）+ 「出厂」红印 + 「不超过」朱砂圈重强调；
 * 幕二：单焦点对比「合格上限 ≠ 保险线」。
 */
import {
  END_STILL_FRAMES,
  cameraAt,
  cameraKick,
  drawBrushStroke,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  progress,
  rgba,
  sealPress,
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
import { drawStandardDoc } from "../kit/objects";
import {
  CODE_AT,
  DOC_AT,
  EMPH_AT,
  INS_AT,
  LENGTH,
  LIMIT_AT,
  NEQ_AT,
  OUT_AT,
  PASS_AT,
  PHASE2_AT,
  TEXT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const STILL_START = Math.max(0, LENGTH - END_STILL_FRAMES);
const CX = 495;
const POP_SPRING = { stiffness: 120, damping: 12, mass: 1 };

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.05,
    drift: 3.5,
    focus: [
      { at: DOC_AT, dur: 18, x: CX, y: 920, zoom: 1.01, pull: 0.12 },
      { at: EMPH_AT, dur: 18, x: CX, y: 990, zoom: 1.06, pull: 0.2 },
      { at: PHASE2_AT, dur: 20, x: CX, y: 930, zoom: 1.01, pull: 0.14 },
      { at: NEQ_AT, dur: 18, x: CX, y: 950, zoom: 1.03, pull: 0.15 },
    ],
  });
  for (const [at, amp] of [
    [OUT_AT + 4, 3.8],
    [EMPH_AT + 2, 4.2],
    [NEQ_AT + 2, 5.2],
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
      drawPhase1(ctx, frame, p, params, fontScale);
      drawPhase2(ctx, frame, p, params, fontScale);
    },
  });
}

// ================= 幕一：国标文件与「不超过」 =================
function drawPhase1(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const out = easeInOutCubic(progress(frame, PHASE2_AT, PHASE2_AT + 14));
  if (out >= 1) return;

  const docLand = heavyLand(frame - DOC_AT + 4, { drop: 70, fall: 7, squash: 0.035 });
  const codeP = easeOutCubic(progress(frame, CODE_AT - 4, CODE_AT + 12));
  const outL = frame - OUT_AT;
  const limP = easeOutCubic(progress(frame, LIMIT_AT, LIMIT_AT + 14));
  const emphSp = springValue(frame - EMPH_AT, POP_SPRING);
  const emphP = easeOutCubic(progress(frame, EMPH_AT, EMPH_AT + 14));

  ctx.save();
  ctx.globalAlpha = docLand.alpha * (1 - out);
  ctx.translate(CX, 920 + docLand.y - out * 65);
  ctx.scale(docLand.scaleX, docLand.scaleY);

  drawStandardDoc(ctx, pal, 640, 790, {
    title: t(params, "docTitle"),
    code: codeP > 0.05 ? t(params, "stdCode") : undefined,
    fontScale,
    body: () => {
      // 极淡的国标条款占位装饰横线（纸面排布感，不放装饰小字）
      ctx.strokeStyle = rgba(pal.tea, 0.14);
      ctx.lineWidth = 3;
      for (const yLine of [-155, -112, 235, 278]) {
        ctx.beginPath();
        ctx.moveTo(-240, yLine);
        ctx.lineTo(yLine === 278 ? 80 : 240, yLine);
        ctx.stroke();
      }

      // 「出厂」红框印章标
      if (outL > 0) {
        const sp = sealPress(outL, { lift: 6, press: 4, height: 42, rot: -0.05 });
        const fTxt = t(params, "factoryTag");
        ctx.save();
        ctx.globalAlpha *= sp.alpha;
        ctx.translate(-156, -10 + sp.y);
        ctx.rotate(sp.rot);
        ctx.scale(sp.scaleX, sp.scaleY);
        ctx.strokeStyle = pal.cinnabar;
        ctx.lineWidth = 4.5;
        ctx.strokeRect(-72, -36, 144, 72);
        ctx.fillStyle = rgba(pal.cinnabar, 0.08);
        ctx.fillRect(-72, -36, 144, 72);
        fillText(ctx, fTxt, 0, 2, fitSize(fTxt, 44, 128) * fontScale, {
          color: pal.cinnabar,
          weight: 900,
          font: SONG,
        });
        ctx.restore();
      }

      // 条款焦点：「不超过」+ 「8.5%」
      if (limP > 0.01) {
        const neTxt = t(params, "notExceed");
        const valTxt = t(params, "limitVal");
        const boost = 1 + Math.max(0, emphSp) * 0.14;

        // 「不超过」朱砂高亮底 + 毛笔圈
        ctx.save();
        ctx.translate(-70, 118);
        ctx.scale(boost, boost);
        if (emphP > 0.01) {
          // 朱砂淡底笔扫
          ctx.fillStyle = rgba(pal.cinnabar, 0.16 * emphP);
          ctx.beginPath();
          ctx.roundRect(-142, -52, 284, 104, 10);
          ctx.fill();
        }
        inkText(ctx, neTxt, 0, 2, fitSize(neTxt, 86, 260) * fontScale, limP, 31, {
          color: emphP > 0.1 ? pal.cinnabar : pal.ink,
          font: SONG,
          weight: 900,
          wash: 0.03,
        });
        if (emphP > 0.01) {
          brushRing(ctx, 0, 0, 154, 68, emphP, pal.cinnabar, 37, 8.5);
        }
        ctx.restore();

        // 右侧「8.5%」
        inkText(ctx, valTxt, 210, 120, fitSize(valTxt, 74, 180, 0.72) * fontScale, limP, 41, {
          color: pal.ink,
          font: SONG,
          weight: 900,
        });
      }
    },
  });

  ctx.restore();
}

// ================= 幕二：单焦点对比「合格上限 ≠ 保险线」 =================
function drawPhase2(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < PHASE2_AT + 4) return;

  // 1) 上行：「合格上限」（旁附极简「出厂」小标）
  const p1 = frame - (PASS_AT - 4);
  if (p1 > 0) {
    const land = heavyLand(p1, { drop: 55, fall: 6, squash: 0.05 });
    const txt = t(params, "upper");
    const fs = fitSize(txt, 134, 720) * fontScale;
    ctx.save();
    ctx.globalAlpha = land.alpha;
    ctx.translate(CX, 720 + land.y);
    ctx.scale(land.scaleX, land.scaleY);
    inkText(ctx, txt, 0, 0, fs, easeOutCubic(progress(p1, 0, 12)), 51, {
      color: pal.ink,
      font: SONG,
      weight: 900,
      wash: 0.03,
    });
    // 上方小字「出厂」清晰交代归属
    const tag = t(params, "factoryTag");
    fillText(ctx, tag, 0, -102, 42 * fontScale, {
      color: pal.tea,
      font: KAI,
      weight: 700,
    });
    ctx.restore();
  }

  // 2) 中央：朱砂毛笔「≠」
  const pn = frame - NEQ_AT;
  if (pn > 0) {
    const pBar1 = easeOutCubic(progress(pn, 0, 7));
    const pBar2 = easeOutCubic(progress(pn, 4, 11));
    const pSlash = easeOutCubic(progress(pn, 8, 16));
    const ny = 940;
    drawBrushStroke(
      ctx,
      [
        { x: CX - 78, y: ny - 24 },
        { x: CX + 78, y: ny - 26 },
      ],
      pBar1,
      { width: 13, color: pal.cinnabar, seed: 61, tail: 0.2 },
    );
    drawBrushStroke(
      ctx,
      [
        { x: CX - 78, y: ny + 26 },
        { x: CX + 78, y: ny + 24 },
      ],
      pBar2,
      { width: 13, color: pal.cinnabar, seed: 62, tail: 0.2 },
    );
    drawBrushStroke(
      ctx,
      [
        { x: CX + 52, y: ny - 76 },
        { x: CX - 52, y: ny + 76 },
      ],
      pSlash,
      { width: 14, color: pal.cinnabar, seed: 63, tail: 0.25 },
    );
  }

  // 3) 下行：「保险线」
  const p2 = frame - INS_AT;
  if (p2 > 0) {
    const land = heavyLand(p2, { drop: 55, fall: 6, squash: 0.05 });
    const txt = t(params, "insurance");
    const fs = fitSize(txt, 134, 720) * fontScale;
    ctx.save();
    ctx.globalAlpha = land.alpha;
    ctx.translate(CX, 1155 + land.y);
    ctx.scale(land.scaleX, land.scaleY);
    inkText(ctx, txt, 0, 0, fs, easeOutCubic(progress(p2, 0, 12)), 71, {
      color: pal.bamboo,
      font: SONG,
      weight: 900,
      wash: 0.03,
    });
    ctx.restore();
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "国标");
}
