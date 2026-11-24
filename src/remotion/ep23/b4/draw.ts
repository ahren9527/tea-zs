/**
 * 第 23 期 B4「及格不等于安全」逐帧画布（1080×1920）
 * 幕一：纸箱套 PE 袋装「蜜韵」饼茶，水汽随年份在环境与箱袋间起伏变化，国标线渐退；
 * 幕二：单焦点大字「及格线 ≠ 安全线」。
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
  type FxPalette,
} from "../kit/fx";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  KAI,
  SONG,
  allTextsOf,
  beginFrame,
  fillText,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawCorrugatedBoxTop, drawMiyunCake, drawPeBag, drawWaterDrop } from "../kit/objects";
import {
  BAG_AT,
  BOX_AT,
  DAMP_AT,
  LENGTH,
  NEQ_AT,
  PASS_AT,
  PHASE2_AT,
  SAFE_AT,
  STD_AT,
  TEXT,
  YEAR_AT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const STILL_START = Math.max(0, LENGTH - END_STILL_FRAMES);
const CX = 495;

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.045,
    drift: 3.5,
    focus: [
      { at: BOX_AT, dur: 18, x: CX, y: 960, zoom: 1.01, pull: 0.12 },
      { at: DAMP_AT, dur: 20, x: CX, y: 970, zoom: 1.035, pull: 0.16 },
      { at: PHASE2_AT, dur: 18, x: CX, y: 940, zoom: 1.01, pull: 0.12 },
    ],
  });
  for (const [at, amp] of [
    [10, 3.2],
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
      drawPhase1(ctx, frame, stillFrame, p, params, fontScale);
      drawPhase2(ctx, frame, p, params, fontScale);
    },
  });
}

// ================= 幕一：箱袋里的蜜韵茶饼与随年份起伏的水汽 =================
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

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 顶部年份推进标：「三年 · 五年」+ 极简年份进度条（0.5s 内即显）
  const headP = easeOutCubic(progress(frame, BOX_AT, BOX_AT + 12));
  const yearProg = easeInOutCubic(progress(frame, YEAR_AT, STD_AT + 20));
  const yTxt = t(params, "years");
  inkText(ctx, yTxt, CX, 430, fitSize(yTxt, 92, 680) * fontScale, Math.max(0.25, headP), 11, {
    color: pal.ink,
    font: SONG,
    weight: 900,
    wash: 0.025,
  });

  // 年份水平细进度线（1年 → 3年 → 5年）
  {
    const x0 = 180;
    const x1 = 810;
    const ty = 528;
    ctx.strokeStyle = rgba(pal.tea, 0.24);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x0, ty);
    ctx.lineTo(x1, ty);
    ctx.stroke();

    drawBrushStroke(
      ctx,
      [
        { x: x0, y: ty },
        { x: x1, y: ty },
      ],
      Math.max(0.08, yearProg),
      { width: 6, color: pal.tea, seed: 17, tail: 0.1 },
    );

    const nodes: [number, string][] = [
      [0, "1年"],
      [0.5, "3年"],
      [1, "5年"],
    ];
    nodes.forEach(([u, lbl]) => {
      const nx = x0 + (x1 - x0) * u;
      ctx.fillStyle = yearProg >= u - 0.04 ? pal.tea : pal.oat;
      ctx.beginPath();
      ctx.arc(nx, ty, 8, 0, Math.PI * 1.999);
      ctx.fill();
      fillText(ctx, lbl, nx, ty + 34, 30 * fontScale, {
        color: pal.inkSoft,
        font: KAI,
        weight: 700,
      });
    });
  }

  // 主体：俯视五层纸箱 → 内套透明 PE 袋 → 蜜韵茶饼（0.5s 内落位）
  const boxLand = heavyLand(frame - BOX_AT + 4, { drop: 70, fall: 7, squash: 0.04 });
  const boxCy = 985;
  ctx.save();
  ctx.globalAlpha *= boxLand.alpha;
  ctx.translate(CX, boxCy + boxLand.y - out * 40);
  ctx.scale(boxLand.scaleX, boxLand.scaleY);

  drawCorrugatedBoxTop(ctx, pal, 540, 540, {
    close: 0.08,
    inside: () => {
      drawPeBag(ctx, pal, 430, 440, {
        mode: "ziplock",
        thickEdge: 0.45,
        leak: easeOutCubic(progress(frame, DAMP_AT, DAMP_AT + 24)) * 0.25,
        frame: stillFrame,
        inside: () => {
          ctx.save();
          ctx.translate(0, 22);
          drawMiyunCake(ctx, 162);
          ctx.restore();
        },
      });
    },
  });
  ctx.restore();

  // 随年份起伏的水汽滴（箱外环绕 + 袋内缓慢呼吸变动，直观演「水分怎么变、环境潮不潮」）
  const vaporP = easeOutCubic(progress(frame, BAG_AT - 4, BAG_AT + 20));
  const dampBoost = easeOutCubic(progress(frame, DAMP_AT - 4, DAMP_AT + 20));
  if (vaporP > 0.01) {
    const wave = 0.5 + 0.5 * Math.sin(stillFrame * 0.085);
    const outerDrops = [
      { ang: -2.4, dist: 335, r: 14, ph: 0.0 },
      { ang: -1.7, dist: 348, r: 12, ph: 1.1 },
      { ang: -0.7, dist: 332, r: 15, ph: 2.2 },
      { ang: 0.15, dist: 342, r: 13, ph: 3.1 },
      { ang: 0.9, dist: 336, r: 14, ph: 4.0 },
      { ang: 2.3, dist: 338, r: 13, ph: 5.0 },
      { ang: 3.0, dist: 330, r: 12, ph: 0.7 },
    ];
    outerDrops.forEach((d) => {
      const osc = Math.sin(stillFrame * 0.09 + d.ph);
      const rad = d.dist - dampBoost * 36 + osc * 16;
      const dx = CX + Math.cos(d.ang) * rad;
      const dy = boxCy + Math.sin(d.ang) * rad;
      // 严守 x ≤ 935、y ≤ 1520
      if (dx > 925 || dy > 1510) return;
      drawWaterDrop(
        ctx,
        dx,
        dy,
        d.r * (0.85 + 0.35 * dampBoost),
        "#5b899e",
        (0.45 + 0.45 * wave) * vaporP,
      );
    });

    // 袋内随季节潮度轻浮的 4 枚淡蓝水汽点
    const innerDrops = [
      { x: -135, y: -115, ph: 0.4 },
      { x: 140, y: -90, ph: 1.9 },
      { x: -120, y: 125, ph: 3.2 },
      { x: 130, y: 118, ph: 4.5 },
    ];
    innerDrops.forEach((d) => {
      const pulse = 0.4 + 0.6 * Math.abs(Math.sin(stillFrame * 0.08 + d.ph));
      drawWaterDrop(
        ctx,
        CX + d.x,
        boxCy + d.y + Math.sin(stillFrame * 0.07 + d.ph) * 10,
        10 + dampBoost * 4,
        "#5b899e",
        0.52 * pulse * vaporP,
      );
    });
  }

  // 「标准没法替你盯着」：底部轻淡一行红灰提示随语速淡出暗示监管鞭长莫及
  const sl = frame - STD_AT;
  if (sl > 0) {
    const sp = easeOutCubic(progress(sl, 0, 14));
    const sTxt = t(params, "stdOut");
    inkText(ctx, sTxt, CX, 1385, fitSize(sTxt, 62, 620) * fontScale, sp, 31, {
      color: pal.cinnabar,
      font: KAI,
      weight: 700,
    });
  }

  ctx.restore();
}

// ================= 幕二：单焦点大字「及格线 ≠ 安全线」 =================
function drawPhase2(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < PHASE2_AT + 4) return;

  // 上：「及格线」
  const p1 = frame - (PASS_AT - 4);
  if (p1 > 0) {
    const land = heavyLand(p1, { drop: 60, fall: 6, squash: 0.05 });
    const txt = t(params, "passLine");
    ctx.save();
    ctx.globalAlpha = land.alpha;
    ctx.translate(CX, 735 + land.y);
    ctx.scale(land.scaleX, land.scaleY);
    inkText(
      ctx,
      txt,
      0,
      0,
      fitSize(txt, 148, 720) * fontScale,
      easeOutCubic(progress(p1, 0, 12)),
      41,
      {
        color: pal.ink,
        font: SONG,
        weight: 900,
        wash: 0.03,
      },
    );
    ctx.restore();
    // 底下细朱砂横线（呼应 8.5% 及格上限）
    drawBrushStroke(
      ctx,
      [
        { x: CX - 220, y: 822 },
        { x: CX + 220, y: 820 },
      ],
      easeOutCubic(progress(p1, 4, 14)),
      { width: 6, color: rgba(pal.cinnabar, 0.55), seed: 42, tail: 0.2 },
    );
  }

  // 中：朱砂毛笔「≠」
  const pn = frame - NEQ_AT;
  if (pn > 0) {
    const ny = 955;
    drawBrushStroke(
      ctx,
      [
        { x: CX - 82, y: ny - 24 },
        { x: CX + 82, y: ny - 26 },
      ],
      easeOutCubic(progress(pn, 0, 7)),
      { width: 14, color: pal.cinnabar, seed: 51, tail: 0.2 },
    );
    drawBrushStroke(
      ctx,
      [
        { x: CX - 82, y: ny + 26 },
        { x: CX + 82, y: ny + 24 },
      ],
      easeOutCubic(progress(pn, 4, 11)),
      { width: 14, color: pal.cinnabar, seed: 52, tail: 0.2 },
    );
    drawBrushStroke(
      ctx,
      [
        { x: CX + 54, y: ny - 78 },
        { x: CX - 54, y: ny + 78 },
      ],
      easeOutCubic(progress(pn, 8, 16)),
      { width: 15, color: pal.cinnabar, seed: 53, tail: 0.25 },
    );
  }

  // 下：「安全线」
  const p2 = frame - (SAFE_AT - 2);
  if (p2 > 0) {
    const land = heavyLand(p2, { drop: 60, fall: 6, squash: 0.05 });
    const txt = t(params, "safeLine");
    ctx.save();
    ctx.globalAlpha = land.alpha;
    ctx.translate(CX, 1175 + land.y);
    ctx.scale(land.scaleX, land.scaleY);
    inkText(
      ctx,
      txt,
      0,
      0,
      fitSize(txt, 148, 720) * fontScale,
      easeOutCubic(progress(p2, 0, 12)),
      61,
      {
        color: pal.bamboo,
        font: SONG,
        weight: 900,
        wash: 0.03,
      },
    );
    ctx.restore();
    drawBrushStroke(
      ctx,
      [
        { x: CX - 220, y: 1262 },
        { x: CX + 220, y: 1260 },
      ],
      easeOutCubic(progress(p2, 4, 14)),
      { width: 6, color: rgba(pal.bamboo, 0.65), seed: 62, tail: 0.2 },
    );
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "1年35");
}
