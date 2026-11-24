/**
 * 第 23 期 B8「存还是喝」逐帧画布（1080×1920）
 * 左右各半屏分流（安全区 [42, 495] / [495, 950]，底部严守 y ≤ 1560）：
 *   左：≤7% → 「存」（蜜韵饼茶入箱封存 · 长期存）
 *   右：8%–8.5% → 「喝」（蜜韵饼茶配茶壶茶杯 · 趁早喝）
 * 结尾完整同屏停留 ≥ 1.8 秒，末 0.5 秒干净静止。
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
  brushRing,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawCorrugatedBoxTop, drawMiyunCake, drawTeapotAndCup } from "../kit/objects";
import {
  DRINK_AT,
  DRINK_POUR_AT,
  ENTER_AT,
  LENGTH,
  SPLIT_AT,
  STORE_AT,
  STORE_CLOSE_AT,
  TEXT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const STILL_START = Math.max(0, LENGTH - END_STILL_FRAMES);
const MID_X = 495;
const LEFT_X = 268;
const RIGHT_X = 722;

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.04,
    drift: 3.2,
    focus: [
      { at: STORE_AT, dur: 18, x: LEFT_X + 65, y: 920, zoom: 1.025, pull: 0.14 },
      { at: DRINK_AT, dur: 18, x: RIGHT_X - 65, y: 920, zoom: 1.025, pull: 0.14 },
      { at: DRINK_POUR_AT + 12, dur: 20, x: MID_X, y: 940, zoom: 1.01, pull: 0.14 },
    ],
  });
  for (const [at, amp] of [
    [STORE_AT + 4, 3.6],
    [DRINK_AT + 4, 3.6],
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
    subject: (p) => drawSubject(ctx, frame, stillFrame, p, params, fontScale),
  });
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  stillFrame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const enterP = easeOutCubic(progress(frame, ENTER_AT, ENTER_AT + 14));
  const splitP = easeOutCubic(progress(frame, SPLIT_AT - 4, SPLIT_AT + 12));
  const leftP = easeOutCubic(progress(frame, STORE_AT, STORE_AT + 14));
  const closeP = easeInOutCubic(progress(frame, STORE_CLOSE_AT, STORE_CLOSE_AT + 24));
  const rightP = easeOutCubic(progress(frame, DRINK_AT, DRINK_AT + 14));
  const pourP = easeOutCubic(progress(frame, DRINK_POUR_AT, DRINK_POUR_AT + 18));

  // 1) 顶部主题字「存还是喝」（0.5 秒内落定）
  const headTxt = t(params, "head");
  inkText(
    ctx,
    headTxt,
    MID_X,
    345,
    fitSize(headTxt, 96, 680) * fontScale,
    Math.max(0.25, enterP),
    11,
    {
      color: pal.ink,
      font: SONG,
      weight: 900,
      wash: 0.025,
    },
  );

  // 2) 左右半屏极淡宣纸色区 + 中央水墨竖隔线（y = 435..1530 < 1560）
  {
    const topY = 435;
    const panelH = 1095;
    ctx.save();
    ctx.globalAlpha = Math.max(0.25, enterP);
    ctx.fillStyle = rgba(pal.bamboo, 0.032 + leftP * 0.038);
    ctx.beginPath();
    ctx.roundRect(42, topY, MID_X - 50, panelH, 18);
    ctx.fill();

    ctx.fillStyle = rgba(pal.cinnabar, 0.03 + rightP * 0.036);
    ctx.beginPath();
    ctx.roundRect(MID_X + 8, topY, 950 - (MID_X + 8), panelH, 18);
    ctx.fill();

    const divPts: Pt[] = [
      { x: MID_X, y: topY + 24 },
      { x: MID_X - 2, y: 960 },
      { x: MID_X, y: topY + panelH - 24 },
    ];
    drawBrushStroke(ctx, divPts, Math.max(0.3, Math.max(enterP, splitP)), {
      width: 4.5,
      color: rgba(pal.ink, 0.24),
      seed: 81,
      tail: 0.2,
    });
    ctx.restore();
  }

  // 3) 左半屏：≤7% → 「存」（蜜韵饼茶入纸箱封盖）
  {
    const vis = 0.28 + 0.72 * leftP;
    ctx.save();
    ctx.globalAlpha = Math.max(0.25, enterP) * vis;

    // 数值「≤7%」
    const lvTxt = t(params, "leftVal");
    inkText(
      ctx,
      lvTxt,
      LEFT_X,
      525,
      fitSize(lvTxt, 68, 340, 0.78) * fontScale,
      Math.max(0.3, leftP),
      21,
      {
        color: pal.bamboo,
        font: SONG,
        weight: 900,
      },
    );

    // 大字「存」+ 竹青毛笔圈
    const laLand = heavyLand(frame - STORE_AT + 2, { drop: 44, fall: 5, squash: 0.06 });
    const laTxt = t(params, "leftAct");
    ctx.save();
    ctx.translate(LEFT_X, 710 + (leftP > 0 ? laLand.y : 0));
    if (leftP > 0) ctx.scale(laLand.scaleX, laLand.scaleY);
    inkText(ctx, laTxt, 0, 0, fitSize(laTxt, 162, 320) * fontScale, Math.max(0.25, leftP), 23, {
      color: pal.bamboo,
      font: SONG,
      weight: 900,
      wash: 0.03,
    });
    if (leftP > 0.05) {
      brushRing(ctx, 0, 0, 118, 114, leftP, pal.bamboo, 25, 8);
    }
    ctx.restore();

    // 物件演示：蜜韵饼茶平放入存茶箱并合盖封存
    const boxY = 1145;
    ctx.save();
    ctx.translate(LEFT_X, boxY);
    drawCorrugatedBoxTop(ctx, pal, 330, 320, {
      close: closeP * 0.72,
      hTape: Math.max(0, (closeP - 0.55) / 0.45),
      inside: () => {
        const dropY = (1 - Math.min(1, leftP * 1.2)) * -70;
        ctx.save();
        ctx.translate(0, dropY);
        drawMiyunCake(ctx, 118);
        ctx.restore();
      },
    });
    ctx.restore();

    // 底部结论小字「长期存」
    if (closeP > 0.05) {
      const lsTxt = t(params, "leftSub");
      inkText(
        ctx,
        lsTxt,
        LEFT_X,
        1435,
        fitSize(lsTxt, 58, 340) * fontScale,
        Math.min(1, closeP * 1.6),
        27,
        {
          color: pal.bamboo,
          font: KAI,
          weight: 700,
        },
      );
    }
    ctx.restore();
  }

  // 4) 右半屏：8%–8.5% → 「喝」（蜜韵饼茶配温热茶壶茶杯）
  {
    const vis = 0.28 + 0.72 * rightP;
    ctx.save();
    ctx.globalAlpha = Math.max(0.25, enterP) * vis;

    // 数值「8%–8.5%」
    const rvTxt = t(params, "rightVal");
    inkText(
      ctx,
      rvTxt,
      RIGHT_X,
      525,
      fitSize(rvTxt, 64, 370, 0.72) * fontScale,
      Math.max(0.3, rightP),
      31,
      {
        color: pal.cinnabar,
        font: SONG,
        weight: 900,
      },
    );

    // 大字「喝」+ 朱砂毛笔圈
    const raLand = heavyLand(frame - DRINK_AT + 2, { drop: 44, fall: 5, squash: 0.06 });
    const raTxt = t(params, "rightAct");
    ctx.save();
    ctx.translate(RIGHT_X, 710 + (rightP > 0 ? raLand.y : 0));
    if (rightP > 0) ctx.scale(raLand.scaleX, raLand.scaleY);
    inkText(ctx, raTxt, 0, 0, fitSize(raTxt, 162, 320) * fontScale, Math.max(0.25, rightP), 33, {
      color: pal.cinnabar,
      font: SONG,
      weight: 900,
      wash: 0.03,
    });
    if (rightP > 0.05) {
      brushRing(ctx, 0, 0, 118, 114, rightP, pal.cinnabar, 35, 8);
    }
    ctx.restore();

    // 物件演示：蜜韵饼茶（左上陪衬）+ 温热陶壶白瓷杯（右下主角，冒茶烟）
    ctx.save();
    ctx.translate(RIGHT_X - 78, 1045);
    drawMiyunCake(ctx, 90);
    ctx.restore();

    ctx.save();
    ctx.translate(RIGHT_X + 18, 1195);
    drawTeapotAndCup(ctx, pal, 1.02, { frame: stillFrame, steam: 0.35 + pourP * 0.65 });
    ctx.restore();

    // 底部结论小字「趁早喝」
    if (pourP > 0.05) {
      const rsTxt = t(params, "rightSub");
      inkText(ctx, rsTxt, RIGHT_X, 1435, fitSize(rsTxt, 58, 340) * fontScale, pourP, 37, {
        color: pal.cinnabar,
        font: KAI,
        weight: 700,
      });
    }
    ctx.restore();
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
