/**
 * 第 23 期 B1「8.5%这条线」逐帧画布（1080×1920）
 * 一条朱砂线横穿画面，大字「8.5%」落在线上；「安全线？」带问号收尾。
 * 复用全片统一的水分刻度尺语言，关键元素严守 x ≤ 950、y ≤ 1560。
 */
import {
  END_STILL_FRAMES,
  cameraAt,
  cameraKick,
  clamp01,
  drawBrushStroke,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  progress,
  rgba,
  type FxPalette,
  type Pt,
} from "../kit/fx";
import { onTwos } from "../kit/hand";
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
import { drawMoistureScale } from "../kit/objects";
import { LENGTH, LINE_AT, NUM_AT, SAFE_AT, SCALE_AT, TEXT, type TextKey } from "./data";
import { VO } from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const STILL_START = Math.max(0, LENGTH - END_STILL_FRAMES);
const CX = 495;
const LINE_Y = 980;

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.045,
    drift: 3.5,
    focus: [
      { at: LINE_AT, dur: 18, x: CX, y: LINE_Y, zoom: 1.02, pull: 0.14 },
      { at: NUM_AT, dur: 20, x: CX, y: 880, zoom: 1.04, pull: 0.18 },
      { at: SAFE_AT, dur: 22, x: CX, y: 1020, zoom: 1.02, pull: 0.14 },
    ],
  });
  const k = cameraKick(frame - (NUM_AT + 4), 5.5);
  cam.x -= k.x;
  cam.y -= k.y;
  return cam;
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame: rawF, pal, fontScale } = beginFrame(ctx, elapsed, params);
  // 一拍二：主体动作按偶数帧取整；镜头、粒子仍逐帧
  const frame = onTwos(rawF);
  const stillFrame = Math.min(frame, STILL_START);
  renderLayers(ctx, Math.min(rawF, STILL_START), pal, beatCamera(rawF), {
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
  // 1) 开场 0.5 秒内：顶部主题字「白茶含水量」+ 淡雅横向水分刻度尺底出现
  const headP = easeOutCubic(progress(frame, SCALE_AT, SCALE_AT + 12));
  const labelTxt = t(params, "label");
  inkText(
    ctx,
    labelTxt,
    CX,
    465,
    fitSize(labelTxt, 76, 700) * fontScale,
    Math.max(0.2, headP),
    11,
    {
      color: pal.inkSoft,
      font: KAI,
      weight: 700,
      wash: 0.02,
    },
  );

  // 底部统一横向水分刻度尺（7% 竹青、8.5% 朱砂，提前建立全片视觉符号）
  const scaleIn = easeOutCubic(progress(frame, SCALE_AT, SCALE_AT + 14));
  const lineP = easeInOutCubic(progress(frame, LINE_AT, LINE_AT + 16));
  const valTrack = 6.2 + easeOutCubic(progress(frame, LINE_AT, NUM_AT + 8)) * 2.3;

  ctx.save();
  ctx.translate(CX, LINE_Y);
  drawMoistureScale(ctx, pal, {
    orientation: "horizontal",
    min: 5,
    max: 10,
    length: 780,
    thickness: 44,
    value: lineP > 0.05 ? valTrack : undefined,
    reveal: Math.max(0.25, scaleIn),
    show7: true,
    show85: true,
    emphasize85: 0.4 + lineP * 0.6,
    emphasize7: 0.35,
    labelSide: "bottom",
    showLabels: true,
    fontScale,
    seed: 19,
  });
  ctx.restore();

  // 2) 「划了一条线」：一道饱满的朱砂红毛笔线横穿安全区（x = 64..936），压在刻度尺上沿形成强烈视觉线
  if (lineP > 0.01) {
    const pts: Pt[] = [
      { x: 64, y: LINE_Y - 34 },
      { x: 340, y: LINE_Y - 37 },
      { x: 660, y: LINE_Y - 32 },
      { x: 936, y: LINE_Y - 35 },
    ];
    drawBrushStroke(ctx, pts, lineP, {
      width: 14,
      color: pal.cinnabar,
      seed: 29,
      tail: 0.14,
      jitter: 0.18,
    });
  }

  // 3) 「8.5%」：重重落在朱砂线上，带物理压缩回弹；后半段微上移为「安全线？」腾出从容留白
  const nl = frame - NUM_AT;
  if (nl > -2) {
    const land = heavyLand(nl + 2, { drop: 130, fall: 7, squash: 0.065 });
    const shiftUp = easeInOutCubic(progress(frame, SAFE_AT - 4, SAFE_AT + 14)) * 32;
    const numTxt = t(params, "num");
    const numFs = fitSize(numTxt, 218, 760, 0.72) * fontScale;
    ctx.save();
    ctx.globalAlpha = land.alpha;
    ctx.translate(CX, LINE_Y - 172 - shiftUp);
    beatWord(ctx, frame, VO, "8.5%", numTxt, 0, 0, numFs, {
      accent: true,
      color: pal.cinnabar,
      font: SONG,
      weight: 900,
      wash: 0.035,
    });
    ctx.restore();

    // 落线瞬间沿朱砂线向两侧散开的极轻红晕波纹
    const impact = clamp01((nl - 4) / 14);
    if (impact > 0 && impact < 1) {
      const a = Math.sin(impact * Math.PI) * 0.36;
      const spread = 120 + impact * 280;
      ctx.save();
      ctx.strokeStyle = rgba(pal.cinnabar, a);
      ctx.lineWidth = 4 * (1 - impact);
      ctx.beginPath();
      ctx.moveTo(CX - spread, LINE_Y - 34);
      ctx.lineTo(CX + spread, LINE_Y - 34);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 4) 「安全线？」：带问号收尾，落在朱砂线下方，最后 0.5s 静止
  const ql = frame - SAFE_AT;
  if (ql > 0) {
    const qp = easeOutCubic(progress(ql, 0, 14));
    const qLand = heavyLand(ql, { drop: 42, fall: 5, squash: 0.045 });
    const qTxt = t(params, "question");
    const qFs = fitSize(qTxt, 134, 760) * fontScale;
    const subtleFloat = Math.sin(stillFrame * 0.05) * 2.5 * qp;
    ctx.save();
    ctx.globalAlpha = qLand.alpha;
    ctx.translate(CX, 1235 + subtleFloat);
    beatWord(ctx, frame, VO, "安全线", qTxt, 0, 0, qFs, {
      accent: "安全线",
      color: pal.ink,
      font: SONG,
      weight: 900,
      wash: 0.03,
    });
    ctx.restore();

    // 问号下极克制的一短笔朱砂强调横笔
    const uP = easeInOutCubic(progress(ql, 8, 18));
    if (uP > 0.01) {
      drawBrushStroke(
        ctx,
        [
          { x: CX - 190, y: 1325 },
          { x: CX + 190, y: 1322 },
        ],
        uP,
        { width: 7, color: rgba(pal.cinnabar, 0.72), seed: 73, tail: 0.25, jitter: 0.2 },
      );
    }
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "7%8.5");
}
