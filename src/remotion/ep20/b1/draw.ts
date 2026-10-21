/**
 * 第 20 期 B1「存·撬·醒」逐帧画布（1080×1920）。导出走这里；Comp.tsx 的预览也直接调用它。
 * 一条竹青竖线从上往下长出来当「目录」，三件小物（棉纸饼 / 茶针 / 紫砂罐）依次落位，
 * 存 / 撬 / 醒 随口播重重砸下（加速下落 + 压扁回弹 + 墨晕），镜头跟着往下走。
 */
import {
  cameraAt,
  cameraKick,
  drawBrushStroke,
  drawSteam,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  lightFloat,
  progress,
  springValue,
  steamWisps,
  type FxPalette,
} from "@/remotion/shared/fx";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  KAI,
  SONG,
  allTextsOf,
  beginFrame,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawJar, drawTeaNeedle, drawWrappedCake } from "../kit/objects";
import {
  CHAR_SIZE,
  CHAR_X,
  DROP,
  HITS,
  LEAD_AT,
  LENGTH,
  OBJ_LEAD,
  OBJ_X,
  ROW_Y,
  SPINE_AT,
  SPINE_X,
  TEXT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.07,
    drift: 6,
    focus: [
      { at: HITS[0] - 22, dur: 22, x: 600, y: ROW_Y[0] + 80, zoom: 1.03, pull: 0.22 },
      { at: HITS[1] - 14, dur: 18, x: 600, y: ROW_Y[1], zoom: 1.04, pull: 0.22 },
      { at: HITS[2] - 14, dur: 18, x: 600, y: ROW_Y[2] - 60, zoom: 1.05, pull: 0.22 },
      { at: HITS[2] + 10, dur: 26, x: 560, y: 860, zoom: 1.0, pull: 0.12 },
    ],
  });
  for (const h of HITS) {
    const k = cameraKick(frame - h, 5);
    cam.x -= k.x;
    cam.y -= k.y;
  }
  return cam;
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame, pal, fontScale } = beginFrame(ctx, elapsed, params);
  const cam = beatCamera(frame);
  renderLayers(ctx, frame, pal, cam, {
    leaves: 5,
    subject: (p) => drawSubject(ctx, frame, p, params, fontScale),
    text: (p) => drawLead(ctx, frame, p, params, fontScale),
  });
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  // 竹青竖线（目录的「脊」）
  const sp = easeInOutCubic(progress(frame, SPINE_AT, SPINE_AT + 46));
  drawBrushStroke(
    ctx,
    [
      { x: SPINE_X + 4, y: 300 },
      { x: SPINE_X - 3, y: 760 },
      { x: SPINE_X + 2, y: 1180 },
      { x: SPINE_X - 2, y: 1480 },
    ],
    sp,
    {
      width: 7,
      color: pal.bamboo,
      seed: 2,
      tail: 0.4,
      head: 0.05,
      dry: 0.5,
      dryColor: pal.paper,
      alpha: 0.85,
    },
  );

  // 三件小物：在大字之前一点点落位
  const objAt = (i: number) => HITS[i] - OBJ_LEAD;
  // 1 棉纸饼：重落
  {
    const l = frame - objAt(0);
    if (l > 0) {
      const pose = heavyLand(l, { drop: 120, fall: 9, squash: 0.05 });
      ctx.save();
      ctx.globalAlpha = pose.alpha;
      ctx.translate(OBJ_X, ROW_Y[0] + pose.y);
      ctx.rotate(0.12);
      ctx.scale(pose.scaleX, pose.scaleY);
      drawWrappedCake(ctx, pal, 118, { lift: Math.min(1, -pose.y / 120), seed: 3 });
      ctx.restore();
    }
  }
  // 2 茶针：从右侧滑进来，斜放
  {
    const l = frame - objAt(1);
    if (l > 0) {
      const s = springValue(l, { stiffness: 170, damping: 18, mass: 1 });
      ctx.save();
      ctx.globalAlpha = Math.min(1, l / 4);
      ctx.translate(OBJ_X - 150 + (1 - s) * 260, ROW_Y[1] + 120 - (1 - s) * 40);
      ctx.rotate(-0.66);
      ctx.scale(0.86, 0.86);
      drawTeaNeedle(ctx, pal, Math.max(0, 1 - s) * 0.6);
      ctx.restore();
    }
  }
  // 3 紫砂罐：罐先落，盖子在「醒」上合上；之后罐口飘出一缕香
  {
    const l = frame - objAt(2);
    if (l > 0) {
      const pose = heavyLand(l, { drop: 90, fall: 8, squash: 0.04 });
      const lidL = frame - (HITS[2] - 4);
      const lid = lidL < 0 ? 46 : heavyLand(lidL, { drop: 46, fall: 4, squash: 0.08 }).y * -1;
      ctx.save();
      ctx.globalAlpha = pose.alpha;
      ctx.translate(OBJ_X, ROW_Y[2] + 116 + pose.y);
      ctx.scale(pose.scaleX, pose.scaleY);
      drawJar(ctx, pal, { h: 200, lidLift: Math.max(0, lid), seed: 4 });
      ctx.restore();
      const al = frame - (HITS[2] + 6);
      if (al > 0) {
        drawSteam(
          ctx,
          steamWisps(frame, 3, { x: OBJ_X, y: ROW_Y[2] + 116 - 230, w: 60 }, 5, 230),
          pal.light,
          0.5 * easeOutCubic(progress(al, 0, 20)),
        );
      }
    }
  }

  // 三个大字 + 竖线上的朱砂刻点
  const keys: TextKey[] = ["c1", "c2", "c3"];
  keys.forEach((k, i) => {
    const hit = HITS[i];
    const l = frame - (hit - DROP);
    if (l <= 0) return;
    const txt = t(params, k);
    const pose = heavyLand(l, { drop: 110, fall: DROP, squash: 0.06 });
    const fs = fitSize(txt, CHAR_SIZE, 420) * fontScale;
    const y = ROW_Y[i];
    const p = easeOutCubic(progress(frame, hit - 3, hit + 12));
    ctx.save();
    ctx.globalAlpha = Math.min(1, l / 3);
    ctx.translate(CHAR_X, y + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    ctx.translate(-CHAR_X, -y);
    inkText(ctx, txt, CHAR_X, y, fs, Math.max(0.35, p), 50 + i * 7, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.018,
    });
    ctx.restore();
    // 刻点：竖线上一笔短横
    const tp = easeOutCubic(progress(frame, hit, hit + 8));
    drawBrushStroke(
      ctx,
      [
        { x: SPINE_X - 20, y: y - 4 },
        { x: SPINE_X + 34, y: y + 2 },
      ],
      tp,
      { width: 9, color: pal.cinnabar, seed: 10 + i, tail: 0.5 },
    );
  });
}

function drawLead(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const l = frame - LEAD_AT;
  if (l <= 0) return;
  const txt = t(params, "lead");
  const fs = fitSize(txt, 56, 360) * fontScale;
  const pose = lightFloat(l, { rise: 14, sway: 1.5, seed: 1 });
  inkText(ctx, txt, SPINE_X - 92, 640 + pose.y, fs, easeOutCubic(progress(l, 0, 18)), 31, {
    color: pal.inkSoft,
    weight: 500,
    vertical: true,
    font: KAI,
    wash: 0.04,
  });
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
