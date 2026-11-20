/**
 * 第 22 期 B3「一层密封」逐帧画布（1080×1920）
 * 升级：统一章节标题（含淡墨晕）+ 0.5s 内主体同框进场 + 主体放大至 54% 宽 +
 *       字左物右充裕留白 + 「够厚」简笔手指按压袋面凹陷再弹回 + 「≥12丝」放大厚度标尺。
 */
import {
  END_STILL_FRAMES,
  cameraAt,
  cameraKick,
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  lightFloat,
  progress,
  progressRaw,
  rgba,
  springValue,
  type FxPalette,
} from "../kit/fx";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  beginFrame,
  brushRing,
  drawChapterTitle,
  fitSize,
  gapMarker,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawPeBag, drawPressFinger, drawSuxueCake } from "../kit/objects";
import {
  BAG_AT,
  HEAD_AT,
  K1_AT,
  K2_AT,
  KW_OUT,
  LENGTH,
  MAT_AT,
  PRESS_AT,
  TEXT,
  THICK_AT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const ASIDE_SPRING = { stiffness: 92, damping: 11.5, mass: 1 };

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.05,
    drift: 4,
    focus: [
      { at: BAG_AT, dur: 18, x: 520, y: 980, zoom: 1.02, pull: 0.14 },
      { at: K1_AT, dur: 20, x: 510, y: 970, zoom: 1.04, pull: 0.18 },
      { at: THICK_AT, dur: 22, x: 505, y: 1000, zoom: 1.05, pull: 0.2 },
    ],
  });
  for (const [at, amp] of [
    [PRESS_AT + 4, 3.6],
    [K2_AT, 3.6],
    [THICK_AT + 2, 5.0],
  ] as const) {
    const k = cameraKick(frame - at, amp);
    cam.x -= k.x;
    cam.y -= k.y;
  }
  return cam;
}

/** 「够厚」手指按压袋面 → 凹下去 → 弹性回弹的确定性曲线 */
function fingerDemoState(frame: number) {
  const local = frame - (PRESS_AT - 6);
  if (local <= 0 || local >= 52) {
    return { fingerAlpha: 0, reach: 0, press: 0, dent: 0, bagSquash: 0 };
  }
  // 0..10: 手指从右下方滑向袋面；10..18: 按压下陷；18..22: 按稳；22..36: 抬手 + 袋面弹性回弹；36..52: 手指退场
  const approach = easeOutCubic(progressRaw(local, 0, 10));
  const pushIn = easeInOutCubic(progressRaw(local, 9, 17));
  const release = easeOutCubic(progressRaw(local, 21, 30));
  const withdraw = easeInOutCubic(progressRaw(local, 33, 48));

  const press = pushIn * (1 - release);
  let dent = pushIn;
  if (local >= 21) {
    // 阻尼正弦回弹（凹下去 → 弹起来微微鼓过头 → 稳住）
    const rt = (local - 21) / 14;
    dent = Math.exp(-rt * 2.6) * Math.cos(rt * Math.PI * 1.45);
    if (local > 42) dent *= clamp01(1 - (local - 42) / 8);
  }
  const fingerAlpha = approach * (1 - withdraw);
  const reach = approach * (1 - withdraw * 0.9);
  const bagSquash = dent * 0.032;
  return { fingerAlpha, reach, press, dent, bagSquash };
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame, pal, fontScale } = beginFrame(ctx, elapsed, params);
  const cam = beatCamera(frame);
  const stillFrame = Math.min(frame, Math.max(0, LENGTH - END_STILL_FRAMES));
  renderLayers(ctx, stillFrame, pal, cam, {
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
  // 1) 统一三层章节标题「一层 · 封住气」（含淡墨晕，0.5 秒内落定）
  drawChapterTitle(ctx, frame, pal, t(params, "head"), fontScale, {
    at: HEAD_AT,
    color: pal.ink,
    seed: 15,
  });

  // 2) 主体：食品级加厚 PE 平口袋（内含素雪茶饼）
  //    开场居中 580×650（占画幅宽 53.7%），字出现时带回弹右让并轻缩至 458 宽（右缘 924 < 960 安全线）
  const asideSp = springValue(frame - (K1_AT - 2), ASIDE_SPRING);
  const aside = 175 * asideSp;
  const bagScale = 1 - 0.21 * Math.min(1.06, Math.max(0, asideSp));
  const thickBoost = easeInOutCubic(progress(frame, THICK_AT - 4, THICK_AT + 14));
  const bagCx = 520 + aside;
  const bagCy = 1020;

  const demo = fingerDemoState(frame);
  const pose = heavyLand(frame - BAG_AT + 4, { drop: 90, fall: 8, squash: 0.045 });

  if (pose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha = pose.alpha;
    ctx.translate(bagCx, bagCy + pose.y);
    ctx.scale(
      pose.scaleX * bagScale * (1 + demo.bagSquash),
      pose.scaleY * bagScale * (1 - demo.bagSquash * 0.75),
    );
    drawPeBag(ctx, pal, 580, 650, {
      mode: "flat",
      thickEdge: 0.35 + thickBoost * 0.65,
      frame,
      dent: Math.abs(demo.dent) > 0.01 ? { amount: demo.dent, x: 18, y: 65 } : undefined,
      inside: () => {
        ctx.save();
        ctx.translate(0, 22);
        drawSuxueCake(ctx, pal, 215, { seed: 22 });
        ctx.restore();
      },
    });
    ctx.restore();
  }

  // 2b) 「够厚」简笔平涂手指按压袋面再弹回（位于安全区内 x ≤ 890, y ≤ 1490）
  if (demo.fingerAlpha > 0.01) {
    const contactX = bagCx + 14 * bagScale;
    const contactY = bagCy + 52 * bagScale;
    const approachOffset = (1 - demo.reach) * 140;
    const pressOffset = demo.press * 18;
    ctx.save();
    ctx.globalAlpha = demo.fingerAlpha;
    ctx.translate(
      contactX + approachOffset * 0.55 - pressOffset * 0.35,
      contactY + approachOffset * 0.92 - pressOffset * 0.85,
    );
    drawPressFinger(ctx, pal, { press: demo.press, scale: 0.92 });
    ctx.restore();
  }

  // 3) 阶段 1 左侧关键词：「够厚」「勒死」（x = 226，与袋左缘 466 拉开 75px 净空）
  const kwOut = easeInOutCubic(progress(frame, KW_OUT, KW_OUT + 11));
  if (kwOut < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - kwOut;
    const items: [TextKey, number, number, string][] = [
      ["k1", K1_AT, 830, pal.ink],
      ["k2", K2_AT, 1115, pal.cinnabar],
    ];
    items.forEach(([key, at, y, color], idx) => {
      const l = frame - (at - 4);
      if (l <= 0) return;
      const txt = t(params, key);
      const pText = heavyLand(l, { drop: 60, fall: 6, squash: 0.07 });
      ctx.save();
      ctx.globalAlpha *= Math.min(1, l / 4);
      ctx.translate(226, y + pText.y);
      ctx.scale(pText.scaleX, pText.scaleY);
      inkText(ctx, txt, 0, 0, fitSize(txt, 144, 320) * fontScale, easeOutCubic(progress(l, 0, 10)), 31 + idx * 7, {
        color,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    });
    ctx.restore();
  }

  // 4) 阶段 2 左侧规格：「食品级PE」 + 「≥ 12丝」+ 袋壁加厚放大标尺
  const matL = frame - (MAT_AT - 2);
  if (matL > 0) {
    const txt = t(params, "mat");
    const poseM = lightFloat(Math.min(matL, LENGTH - 15 - (MAT_AT - 2)), { rise: 20, sway: 0.35, seed: 12 });
    inkText(ctx, txt, 226, 825 + poseM.y, fitSize(txt, 90, 330) * fontScale, easeOutCubic(progress(matL, 0, 11)), 51, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.025,
    });
  }

  const thL = frame - (THICK_AT - 4);
  if (thL > 0) {
    const txt = t(params, "thick");
    const poseTh = heavyLand(thL, { drop: 68, fall: 6, squash: 0.07 });
    ctx.save();
    ctx.globalAlpha = Math.min(1, thL / 4);
    ctx.translate(226, 1095 + poseTh.y);
    ctx.scale(poseTh.scaleX, poseTh.scaleY);
    inkText(ctx, txt, 0, 0, fitSize(txt, 118, 330) * fontScale, easeOutCubic(progress(thL, 0, 11)), 61, {
      color: pal.cinnabar,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    ctx.restore();

    brushRing(ctx, 226, 1095, 182, 92, progress(thL, 5, 19), pal.cinnabar, 67, 7);

    // 指向袋子加厚左侧热封边的放大厚度标尺（留在安全区底缘 1340 << 1620）
    const edgeX = bagCx - 290 * bagScale;
    const markY = bagCy + 215 * bagScale;
    const rp = easeOutCubic(progress(thL, 4, 20));
    if (rp > 0.01) {
      // 淡竹青高亮条凸显 12 丝厚封边
      ctx.save();
      ctx.globalAlpha = rp * 0.45;
      ctx.fillStyle = pal.bamboo;
      ctx.beginPath();
      ctx.roundRect(edgeX, markY - 42, 22, 84, 4);
      ctx.fill();
      ctx.restore();

      gapMarker(
        ctx,
        { x: edgeX - 18, y: markY },
        { x: edgeX + 32, y: markY },
        rp,
        pal.bamboo,
        71,
        30,
      );
      // 简洁连线从标尺引向左侧「≥ 12丝」
      ctx.save();
      ctx.globalAlpha = rp * 0.55;
      ctx.strokeStyle = rgba(pal.bamboo, 0.72);
      ctx.lineWidth = 2.6;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.moveTo(edgeX - 24, markY);
      ctx.lineTo(395, 1135);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "素雪白牡丹茶正上茶舍一叶倾心净含量克");
}
