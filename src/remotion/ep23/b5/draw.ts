/**
 * 第 23 期 B5「贴线就翻车」逐帧画布（1080×1920）
 * 指针紧贴 8.5% 线下 → 梅雨雨丝 + 密封缝漏气轻轻一推 → 指针直接冲破朱砂线，
 * 画面泛淡红预警晕，蜜韵饼茶起克制潮斑，顶部「水分超标」。
 */
import {
  END_STILL_FRAMES,
  cameraAt,
  cameraKick,
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  progress,
  rgba,
  type FxPalette,
} from "../kit/fx";
import { anticipateMove, followThrough, onTwos } from "../kit/hand";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  KAI,
  SONG,
  allTextsOf,
  beatWord,
  beginFrame,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import {
  drawMiyunCakeWithDamp,
  drawMoistureScale,
  drawPeBag,
  drawRainStreaks,
} from "../kit/objects";
import {
  ENTER_AT,
  FLIP_AT,
  LEAK_AT,
  LENGTH,
  OVER_AT,
  RAIN_AT,
  STICK_AT,
  TEXT,
  type TextKey,
} from "./data";
import { VO } from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const STILL_START = Math.max(0, LENGTH - END_STILL_FRAMES);
const RULER_X = 300;
const BAG_X = 715;
const MID_Y = 980;

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.05,
    drift: 3.5,
    focus: [
      { at: ENTER_AT, dur: 18, x: 495, y: MID_Y, zoom: 1.01, pull: 0.12 },
      { at: STICK_AT, dur: 18, x: 340, y: 840, zoom: 1.04, pull: 0.18 },
      { at: RAIN_AT, dur: 20, x: 520, y: 920, zoom: 1.03, pull: 0.16 },
      { at: OVER_AT, dur: 18, x: 485, y: 900, zoom: 1.055, pull: 0.2 },
    ],
  });
  for (const [at, amp] of [
    [10, 3.2],
    [OVER_AT + 8, 6.2],
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
  const overP = easeOutCubic(progress(frame, OVER_AT + 4, OVER_AT + 24));

  renderLayers(ctx, Math.min(rawF, STILL_START), pal, beatCamera(rawF), {
    leaves: 2,
    subject: (p) => drawSubject(ctx, frame, stillFrame, p, params, fontScale, overP),
    over: (p) => {
      // 超标瞬间画面四周柔和朱砂预警红晕（克制通透，不遮挡文字）
      if (overP <= 0.01) return;
      ctx.save();
      const g = ctx.createRadialGradient(540, 920, 260, 540, 920, 1020);
      g.addColorStop(0, rgba(p.cinnabar, 0));
      g.addColorStop(0.62, rgba(p.cinnabar, 0.05 * overP));
      g.addColorStop(1, rgba(p.cinnabar, 0.24 * overP));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1080, 1920);
      ctx.restore();
    },
  });
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  stillFrame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
  overP: number,
) {
  const enterP = easeOutCubic(progress(frame, ENTER_AT, ENTER_AT + 14));
  const stickP = easeInOutCubic(progress(frame, STICK_AT, STICK_AT + 18));
  const rainP = easeOutCubic(progress(frame, RAIN_AT, RAIN_AT + 16));
  const leakP = easeOutCubic(progress(frame, LEAK_AT, LEAK_AT + 18));

  // 计算刻度尺实时数值：
  // 起手 8.2% → 「贴着上限」紧贴 8.42% → 梅雨 + 漏气轻轻一顶，冲破 8.5% 直上 9.35%
  const baseVal = 8.2 + stickP * 0.22 + rainP * 0.08 + leakP * 0.1;
  // 预备 + 过冲：指针先往下一沉，再一下冲过 8.5%，带一点回弹停住
  const pushOver = anticipateMove(frame - OVER_AT, { prep: 6, back: 0.12 }) * 0.78;
  // 跟随：数值牌比指针晚 4 帧跟上（竖尺向上为负，所以滞后是正向下偏）
  const tagLagPx = frame > OVER_AT ? (1 - followThrough(frame - OVER_AT, 4)) * 34 : 0;
  const microShake =
    frame >= FLIP_AT && overP < 0.95 ? Math.sin(stillFrame * 0.35) * 0.04 * (1 - overP) : 0;
  const curVal = Math.min(9.6, baseVal + pushOver + microShake);
  const valStr = `${curVal.toFixed(1)}%`;

  // 1) 顶部单焦点标题：前半段「贴着上限」，超标瞬间利落切换为朱砂「水分超标」
  const titleSwap = easeInOutCubic(progress(frame, OVER_AT + 2, OVER_AT + 14));
  if (titleSwap < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - titleSwap;
    const hTxt = t(params, "hugging");
    beatWord(ctx, frame, VO, "贴着上限", hTxt, 495, 420, fitSize(hTxt, 118, 720) * fontScale, {
      accent: "上限",
      color: pal.ink,
      font: SONG,
      weight: 900,
      wash: 0.025,
    });
    ctx.restore();
  }
  if (titleSwap > 0.01) {
    const oLand = heavyLand(frame - (OVER_AT + 2), { drop: 50, fall: 5, squash: 0.065 });
    const oTxt = t(params, "overLimit");
    ctx.save();
    ctx.globalAlpha = titleSwap * oLand.alpha;
    ctx.translate(495, 420);
    beatWord(ctx, frame, VO, "水分直接超标", oTxt, 0, 0, fitSize(oTxt, 136, 720) * fontScale, {
      accent: "超标",
      color: pal.cinnabar,
      font: SONG,
      weight: 900,
      wash: 0.04,
    });
    ctx.restore();
  }

  // 2) 左侧：全片统一竖向水分刻度尺（指针冲过 8.5% 朱砂线）
  ctx.save();
  ctx.translate(RULER_X, MID_Y);
  drawMoistureScale(ctx, pal, {
    orientation: "vertical",
    min: 5.5,
    max: 10,
    length: 660,
    thickness: 58,
    value: curVal,
    reveal: Math.max(0.25, enterP),
    show7: true,
    show85: true,
    emphasize7: 0.25,
    emphasize85: 0.65 + overP * 0.35,
    alert: overP,
    labelSide: "right",
    showLabels: true,
    valueText: valStr,
    tagLag: tagLagPx,
    fontScale,
    seed: 55,
  });
  ctx.restore();

  // 3) 右侧：装在 PE 袋里的「蜜韵」饼茶（x = 670, w = 410 → 右缘 875 < 950 安全线）
  const bagLand = heavyLand(frame - ENTER_AT + 4, { drop: 70, fall: 7, squash: 0.04 });
  ctx.save();
  ctx.globalAlpha = bagLand.alpha;
  ctx.translate(BAG_X, MID_Y + 35 + bagLand.y);
  ctx.scale(bagLand.scaleX, bagLand.scaleY);
  drawPeBag(ctx, pal, 410, 480, {
    mode: "ziplock",
    leak: leakP * 0.9,
    thickEdge: 0.35,
    frame: stillFrame,
    inside: () => {
      ctx.save();
      ctx.translate(0, 26);
      drawMiyunCakeWithDamp(ctx, pal, 168, { damp: overP * 0.92, seed: 25 });
      ctx.restore();
    },
  });
  ctx.restore();

  // 4) 梅雨斜雨丝 + 右上极简提示「梅雨季 · 漏气」
  if (rainP > 0.01) {
    drawRainStreaks(
      ctx,
      stillFrame,
      { x: 430, y: 520, w: 480, h: 660 },
      rainP * (1 - overP * 0.25),
      53,
    );
    const rTxt = t(params, "rainTag");
    const rAlpha = clamp01(rainP) * (1 - 0.35 * overP);
    ctx.save();
    ctx.globalAlpha = rAlpha;
    inkText(ctx, rTxt, BAG_X, 645, fitSize(rTxt, 48, 380) * fontScale, rainP, 33, {
      color: "#4a7488",
      font: KAI,
      weight: 700,
    });
    ctx.restore();
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "7%8.50123469.");
}
