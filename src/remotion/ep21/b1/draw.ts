/**
 * 第 21 期 B1「新老」逐帧画布（1080×1920）。
 * 「新」「老」两个大字，各配一个蜜韵寿眉白茶饼（字出现时茶饼带弹簧回弹向右让位，字左物右），
 * 中间一道竹青色分隔线慢慢长出来，最后落一个朱砂大字「分？」。
 */
import {
  cameraAt,
  cameraKick,
  drawBrushStroke,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  progress,
  springValue,
  type FxPalette,
} from "../kit/fx";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  beginFrame,
  brushRing,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawMiyunCake } from "../kit/objects";
import {
  ASK_AT,
  ASK_POS,
  CAKE_ASIDE_DX,
  CAKE_CENTER_X,
  CAKE_R_SIZE,
  CHAR_SIZE,
  CHAR_X,
  CROWD_AT,
  LENGTH,
  LINE_AT,
  LINE_Y,
  NEW_CAKE_AT,
  NEW_CHAR_AT,
  OLD_CAKE_AT,
  OLD_CHAR_AT,
  ROW_NEW_Y,
  ROW_OLD_Y,
  TEXT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

const ASIDE_SPRING = { stiffness: 95, damping: 11, mass: 1 };

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.06,
    drift: 5,
    focus: [
      { at: NEW_CAKE_AT, dur: 22, x: 540, y: ROW_NEW_Y + 40, zoom: 1.04, pull: 0.22 },
      { at: OLD_CAKE_AT - 4, dur: 24, x: 540, y: ROW_OLD_Y - 40, zoom: 1.04, pull: 0.22 },
      { at: LINE_AT - 6, dur: 26, x: 540, y: LINE_Y, zoom: 1.02, pull: 0.16 },
      { at: ASK_AT - 4, dur: 24, x: 540, y: 980, zoom: 1.0, pull: 0.12 },
    ],
  });
  for (const [at, amp] of [
    [NEW_CHAR_AT, 4],
    [OLD_CHAR_AT, 4],
    [ASK_AT, 6],
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
  // 混放挤压 → 竹青分隔线长出后上下归位拉开
  const crowdIn = easeInOutCubic(progress(frame, CROWD_AT, CROWD_AT + 24));
  const sepOut = easeInOutCubic(progress(frame, LINE_AT, LINE_AT + 32));
  const squeeze = crowdIn * (1 - sepOut) * 58;
  const partPush = sepOut * 22;

  const yNew = ROW_NEW_Y + squeeze - partPush;
  const yOld = ROW_OLD_Y - squeeze + partPush;

  // 1. 新茶饼 + 「新」大字（字出现时茶饼弹向右侧让位）
  {
    const cl = frame - NEW_CAKE_AT;
    if (cl > 0) {
      const land = heavyLand(cl, { drop: 130, fall: 9, squash: 0.05 });
      const aside = CAKE_ASIDE_DX * springValue(frame - (NEW_CHAR_AT - 2), ASIDE_SPRING);
      const cx = CAKE_CENTER_X + aside;
      ctx.save();
      ctx.globalAlpha = land.alpha;
      ctx.translate(cx, yNew + land.y);
      ctx.rotate(-0.06 + (aside / CAKE_ASIDE_DX) * 0.14);
      ctx.scale(land.scaleX, land.scaleY);
      drawMiyunCake(ctx, pal, CAKE_R_SIZE, {
        tone: "new",
        lift: Math.min(1, -land.y / 130),
        peel: 0.58,
        peelAngle: 2.35,
        seed: 21,
      });
      ctx.restore();
    }
    const tl = frame - (NEW_CHAR_AT - 6);
    if (tl > 0) {
      const txt = t(params, "cNew");
      const pose = heavyLand(tl, { drop: 95, fall: 6, squash: 0.06 });
      const fs = fitSize(txt, CHAR_SIZE, 380) * fontScale;
      const p = easeOutCubic(progress(frame, NEW_CHAR_AT - 3, NEW_CHAR_AT + 12));
      ctx.save();
      ctx.globalAlpha = Math.min(1, tl / 3);
      ctx.translate(CHAR_X, yNew + pose.y);
      ctx.scale(pose.scaleX, pose.scaleY);
      inkText(ctx, txt, 0, 0, fs, Math.max(0.35, p), 51, {
        color: pal.bamboo,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    }
  }

  // 2. 老茶饼 + 「老」大字（字出现时茶饼弹向右侧让位）
  {
    const cl = frame - OLD_CAKE_AT;
    if (cl > 0) {
      const land = heavyLand(cl, { drop: 130, fall: 9, squash: 0.05 });
      const aside = CAKE_ASIDE_DX * springValue(frame - (OLD_CHAR_AT - 2), ASIDE_SPRING);
      const cx = CAKE_CENTER_X + aside;
      ctx.save();
      ctx.globalAlpha = land.alpha;
      ctx.translate(cx, yOld + land.y);
      ctx.rotate(0.08 + (aside / CAKE_ASIDE_DX) * -0.14);
      ctx.scale(land.scaleX, land.scaleY);
      drawMiyunCake(ctx, pal, CAKE_R_SIZE, {
        tone: "old",
        lift: Math.min(1, -land.y / 130),
        peel: 0.58,
        peelAngle: -0.75,
        seed: 22,
      });
      ctx.restore();
    }
    const tl = frame - (OLD_CHAR_AT - 6);
    if (tl > 0) {
      const txt = t(params, "cOld");
      const pose = heavyLand(tl, { drop: 95, fall: 6, squash: 0.06 });
      const fs = fitSize(txt, CHAR_SIZE, 380) * fontScale;
      const p = easeOutCubic(progress(frame, OLD_CHAR_AT - 3, OLD_CHAR_AT + 12));
      ctx.save();
      ctx.globalAlpha = Math.min(1, tl / 3);
      ctx.translate(CHAR_X, yOld + pose.y);
      ctx.scale(pose.scaleX, pose.scaleY);
      inkText(ctx, txt, 0, 0, fs, Math.max(0.35, p), 57, {
        color: pal.tea,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    }
  }

  // 3. 中间一道竹青色分隔线慢慢长出来
  const lp = easeInOutCubic(progress(frame, LINE_AT, LINE_AT + 38));
  if (lp > 0) {
    drawBrushStroke(
      ctx,
      [
        { x: 130, y: LINE_Y + 4 },
        { x: 410, y: LINE_Y - 5 },
        { x: 690, y: LINE_Y + 3 },
        { x: 950, y: LINE_Y - 2 },
      ],
      lp,
      {
        width: 12,
        color: pal.bamboo,
        seed: 31,
        tail: 0.35,
        head: 0.06,
        dry: 0.45,
        dryColor: pal.paper,
        alpha: 0.9,
      },
    );
  }

  // 4. 最后落一个「分？」（朱砂大字 + 淡淡毛笔圈强调焦点）
  const al = frame - (ASK_AT - 6);
  if (al > 0) {
    const txt = t(params, "ask");
    const pose = heavyLand(al, { drop: 110, fall: 6, squash: 0.07 });
    const fs = fitSize(txt, ASK_POS.size, 520) * fontScale;
    const p = easeOutCubic(progress(frame, ASK_AT - 2, ASK_AT + 12));
    ctx.save();
    ctx.globalAlpha = Math.min(1, al / 3);
    ctx.translate(ASK_POS.x, ASK_POS.y + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    inkText(ctx, txt, 0, 0, fs, Math.max(0.4, p), 63, {
      color: pal.cinnabar,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    ctx.restore();

    const rp = progress(frame, ASK_AT + 4, ASK_AT + 24);
    brushRing(ctx, ASK_POS.x - 16, ASK_POS.y + 4, 210, 142, rp, pal.cinnabar, 69, 7);
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "蜜韵正");
}
