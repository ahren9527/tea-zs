/**
 * 第 23 期 B3「绿茶白茶对比」逐帧画布（1080×1920）
 * 左右两根同款竖向水分刻度尺对比：
 *   左：绿茶 ≤7%（晒青 9% 小字标）+「几个月喝完」
 *   右：白茶 ≤8.5% +「存三五年」
 * 末尾底部一条时间轴把 7% 与 8.5% 的差距随年份「拉长放大」。
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
  type Pt,
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
import { drawMoistureScale } from "../kit/objects";
import {
  AMP_AT,
  ENTER_AT,
  GREEN7_AT,
  GREEN_AT,
  LENGTH,
  MONTHS_AT,
  SUN_AT,
  TEXT,
  TIME_AT,
  WHITE85_AT,
  WHITE_AT,
  YEARS_AT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const STILL_START = Math.max(0, LENGTH - END_STILL_FRAMES);
const LEFT_X = 250;
const RIGHT_X = 740;
const MID_X = 495;
const RULER_Y = 760;

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.045,
    drift: 3.5,
    focus: [
      { at: GREEN_AT, dur: 20, x: LEFT_X + 70, y: 780, zoom: 1.025, pull: 0.14 },
      { at: WHITE_AT, dur: 20, x: RIGHT_X - 70, y: 780, zoom: 1.025, pull: 0.14 },
      { at: AMP_AT, dur: 22, x: MID_X, y: 1120, zoom: 1.02, pull: 0.16 },
    ],
  });
  for (const [at, amp] of [
    [GREEN7_AT + 4, 3.2],
    [WHITE85_AT + 4, 4.4],
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
    subject: (p) => drawSubject(ctx, frame, p, params, fontScale),
  });
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  // 开场 0.5 秒内：双刻度尺骨架与标题同步显现
  const enterP = easeOutCubic(progress(frame, ENTER_AT, ENTER_AT + 14));
  const leftFocus = easeOutCubic(progress(frame, GREEN_AT - 4, GREEN_AT + 12));
  const rightFocus = easeOutCubic(progress(frame, WHITE_AT - 4, WHITE_AT + 12));

  // 中间极淡水墨竖隔线
  if (enterP > 0.02) {
    drawBrushStroke(
      ctx,
      [
        { x: MID_X, y: 380 },
        { x: MID_X, y: 1180 },
      ],
      enterP,
      { width: 3.5, color: rgba(pal.ink, 0.18), seed: 31, tail: 0.2 },
    );
  }

  // ── 左侧：绿茶（≤7% + 晒青 9% 小字 + 几个月喝完）──
  {
    const sunAlpha =
      easeOutCubic(progress(frame, SUN_AT, SUN_AT + 12)) *
      (1 - 0.55 * easeOutCubic(progress(frame, GREEN7_AT + 12, GREEN7_AT + 32)));
    const gValP = easeInOutCubic(progress(frame, GREEN7_AT - 8, GREEN7_AT + 16));
    // 从 8.2% 稳稳压低到 7.0%
    const gVal = gValP > 0.01 ? 8.2 - gValP * 1.2 : undefined;

    const gTitle = t(params, "greenTitle");
    inkText(
      ctx,
      gTitle,
      LEFT_X,
      400,
      fitSize(gTitle, 84, 300) * fontScale,
      Math.max(0.25, enterP),
      11,
      {
        color: pal.bamboo,
        font: SONG,
        weight: 900,
        wash: 0.02,
      },
    );

    ctx.save();
    ctx.translate(LEFT_X, RULER_Y);
    drawMoistureScale(ctx, pal, {
      orientation: "vertical",
      min: 5,
      max: 9.8,
      length: 500,
      thickness: 56,
      value: gVal,
      reveal: Math.max(0.25, enterP),
      show7: true,
      show85: true,
      emphasize7: 0.3 + gValP * 0.7,
      emphasize85: 0.2,
      labelSide: "left",
      showLabels: true,
      label7: t(params, "greenLimit"),
      label85: "8.5%",
      extraMark:
        sunAlpha > 0.01 ? { value: 9, text: t(params, "sunNote"), alpha: sunAlpha } : undefined,
      fontScale,
      seed: 101,
    });
    ctx.restore();

    // 「几个月喝完」
    const ml = frame - MONTHS_AT;
    if (ml > 0) {
      const mLand = heavyLand(ml, { drop: 32, fall: 4, squash: 0.04 });
      const mTxt = t(params, "greenTime");
      ctx.save();
      ctx.globalAlpha = mLand.alpha;
      ctx.translate(LEFT_X, 1110 + mLand.y);
      ctx.scale(mLand.scaleX, mLand.scaleY);
      inkText(
        ctx,
        mTxt,
        0,
        0,
        fitSize(mTxt, 56, 360) * fontScale,
        easeOutCubic(progress(ml, 0, 12)),
        21,
        {
          color: pal.bamboo,
          font: KAI,
          weight: 700,
        },
      );
      ctx.restore();
    }
    void leftFocus;
  }

  // ── 右侧：白茶（≤8.5% + 存三五年）──
  {
    const wValP = easeInOutCubic(progress(frame, WHITE85_AT - 8, WHITE85_AT + 16));
    // 从 7.0% 升高推至 8.5% 红线
    const wVal = wValP > 0.01 ? 7.0 + wValP * 1.5 : undefined;
    const dimRight = 0.45 + 0.55 * rightFocus;

    ctx.save();
    ctx.globalAlpha = dimRight;
    const wTitle = t(params, "whiteTitle");
    inkText(
      ctx,
      wTitle,
      RIGHT_X,
      400,
      fitSize(wTitle, 84, 300) * fontScale,
      Math.max(0.25, enterP),
      12,
      {
        color: pal.cinnabar,
        font: SONG,
        weight: 900,
        wash: 0.02,
      },
    );

    ctx.save();
    ctx.translate(RIGHT_X, RULER_Y);
    drawMoistureScale(ctx, pal, {
      orientation: "vertical",
      min: 5,
      max: 9.8,
      length: 500,
      thickness: 56,
      value: wVal,
      reveal: Math.max(0.25, enterP),
      show7: true,
      show85: true,
      emphasize7: 0.2,
      emphasize85: 0.3 + wValP * 0.7,
      alert: wValP * 0.35,
      labelSide: "right",
      showLabels: true,
      label7: "7%",
      label85: t(params, "whiteLimit"),
      fontScale,
      seed: 202,
    });
    ctx.restore();

    // 「存三五年」
    const yl = frame - YEARS_AT;
    if (yl > 0) {
      const yLand = heavyLand(yl, { drop: 32, fall: 4, squash: 0.04 });
      const yTxt = t(params, "whiteTime");
      ctx.save();
      ctx.globalAlpha *= yLand.alpha;
      ctx.translate(RIGHT_X, 1110 + yLand.y);
      ctx.scale(yLand.scaleX, yLand.scaleY);
      inkText(
        ctx,
        yTxt,
        0,
        0,
        fitSize(yTxt, 56, 360) * fontScale,
        easeOutCubic(progress(yl, 0, 12)),
        25,
        {
          color: pal.cinnabar,
          font: KAI,
          weight: 700,
        },
      );
      ctx.restore();
    }
    ctx.restore();
  }

  // ── 底部：时间轴把 7% vs 8.5% 的差距「拉长放大」（y = 1235..1515 < 1560）──
  const ampP = easeInOutCubic(progress(frame, AMP_AT, TIME_AT + 24));
  if (ampP > 0.01) {
    const x0 = 125;
    const x1 = 865;
    const baseY = 1385;
    const curX = x0 + (x1 - x0) * ampP;

    ctx.save();
    // 水平时间基轴
    const axisPts: Pt[] = [
      { x: x0, y: baseY },
      { x: x1, y: baseY },
    ];
    drawBrushStroke(ctx, axisPts, ampP, {
      width: 4,
      color: rgba(pal.ink, 0.52),
      seed: 81,
      tail: 0.12,
    });

    // 随时间张开的差距楔形（左端 7% vs 8.5% 差距小，右端随 3–5 年大幅拉宽）
    const steps = 28;
    ctx.beginPath();
    ctx.moveTo(x0, baseY - 12);
    for (let i = 1; i <= steps; i++) {
      const u = (i / steps) * ampP;
      const px = x0 + (x1 - x0) * u;
      const spread = 12 + Math.pow(u, 1.55) * 118;
      ctx.lineTo(px, baseY - spread);
    }
    ctx.lineTo(curX, baseY - 10);
    ctx.closePath();
    const wedgeG = ctx.createLinearGradient(x0, baseY, x1, baseY - 130);
    wedgeG.addColorStop(0, rgba(pal.bamboo, 0.14));
    wedgeG.addColorStop(0.45, rgba("#d29a4e", 0.2));
    wedgeG.addColorStop(1, rgba(pal.cinnabar, 0.34));
    ctx.fillStyle = wedgeG;
    ctx.fill();

    // 绿茶 7% 平稳底线 + 白茶 8.5% 随年份张开的朱砂上扬弧线
    const upperPts: Pt[] = [];
    for (let i = 0; i <= 18; i++) {
      const u = i / 18;
      upperPts.push({
        x: x0 + (x1 - x0) * u,
        y: baseY - (12 + Math.pow(u, 1.55) * 118),
      });
    }
    drawBrushStroke(ctx, upperPts, ampP, {
      width: 7,
      color: pal.cinnabar,
      seed: 83,
      tail: 0.15,
    });

    drawBrushStroke(
      ctx,
      [
        { x: x0, y: baseY - 10 },
        { x: x1, y: baseY - 10 },
      ],
      ampP,
      { width: 5, color: pal.bamboo, seed: 84, tail: 0.15 },
    );

    // 时间刻度节点（几个月 → 1年 → 3年 → 5年）
    const ticks: [number, string][] = [
      [0.14, "几个月"],
      [0.55, "3年"],
      [0.95, "5年"],
    ];
    ticks.forEach(([u, lbl]) => {
      if (ampP < u) return;
      const tx = x0 + (x1 - x0) * u;
      ctx.strokeStyle = rgba(pal.ink, 0.45);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(tx, baseY - 6);
      ctx.lineTo(tx, baseY + 10);
      ctx.stroke();
      fillText(ctx, lbl, tx, baseY + 34, 28 * fontScale, {
        color: u > 0.5 ? pal.cinnabar : pal.inkSoft,
        font: KAI,
        weight: 700,
      });
    });

    // 结论大字「时间放大差距」（y = 1495 < 1560）
    const tl = frame - (TIME_AT - 4);
    if (tl > 0) {
      const aTxt = t(params, "amplify");
      inkText(
        ctx,
        aTxt,
        MID_X,
        1495,
        fitSize(aTxt, 68, 720) * fontScale,
        easeOutCubic(progress(tl, 0, 14)),
        91,
        {
          color: pal.cinnabar,
          font: SONG,
          weight: 900,
          wash: 0.025,
        },
      );
    }

    ctx.restore();
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "几个月3年5年7%8.5");
}
