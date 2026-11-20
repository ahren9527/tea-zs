/**
 * 第 22 期 B2「顺序对比」逐帧画布（1080×1920）
 * 开场 0.5 秒内主体与标题同步进场；主体宽占画幅 54–60%；避开右侧 120px 与底部 300px；
 * 结尾加左右并排对比（大整箱·内铝外塑 vs 单饼·内塑外铝），完整同屏停留 ≥ 1.5 秒。
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
  lightFloat,
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
  brushRing,
  fitSize,
  inkText,
  renderLayers,
  softShadow,
  textOf,
} from "../kit/draw-kit";
import { drawFoilBag, drawPeBag, drawSuxueCake } from "../kit/objects";
import {
  ACT1_OUT,
  ACT2_IN,
  BOX_IN,
  BOX_ORDER_AT,
  CHECK_AT,
  COMPARE_AT,
  DOUBLE_AT,
  FOIL_OUT_AT,
  LENGTH,
  LINER_AT,
  MOISTURE_AT,
  PEEK_AT,
  PE_IN_AT,
  POUCH_AT,
  SINGLE_ORDER_AT,
  TEXT,
  WRAP_ALL_AT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.05,
    drift: 4.5,
    focus: [
      { at: BOX_ORDER_AT, dur: 20, x: 520, y: 900, zoom: 1.02, pull: 0.14 },
      { at: WRAP_ALL_AT, dur: 20, x: 520, y: 970, zoom: 1.04, pull: 0.18 },
      { at: ACT2_IN + 4, dur: 20, x: 520, y: 940, zoom: 1.02, pull: 0.14 },
      { at: PEEK_AT, dur: 22, x: 520, y: 960, zoom: 1.06, pull: 0.2 },
      { at: COMPARE_AT, dur: 18, x: 495, y: 940, zoom: 1.0, pull: 0.18 },
    ],
  });
  for (const [at, amp] of [
    [BOX_ORDER_AT, 3.6],
    [DOUBLE_AT, 3.6],
    [SINGLE_ORDER_AT, 3.6],
    [PEEK_AT + 4, 4.2],
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
  const stillFrame = Math.min(frame, Math.max(0, LENGTH - END_STILL_FRAMES));
  renderLayers(ctx, stillFrame, pal, cam, {
    leaves: 3,
    subject: (p) => {
      drawActBox(ctx, frame, p, params, fontScale);
      drawActSingle(ctx, frame, p, params, fontScale);
      drawActCompare(ctx, frame, p, params, fontScale);
    },
  });
}

/** 绘制大整箱 + 4 包纯铝箔袋 + 外层大塑料内胆（供幕一与结尾对比复用） */
function paintBigBoxAssembly(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  bw: number,
  bh: number,
  opts: { pouchProgress: (idx: number) => { alpha: number; y: number; sx: number; sy: number }; linerP: number; wrapP: number; frame: number },
) {
  const { pouchProgress, linerP, wrapP, frame } = opts;

  softShadow(ctx, () => ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 12), {
    blur: 24,
    dx: 10,
    dy: 14,
    alpha: 0.22,
  });
  ctx.fillStyle = "#b89163";
  ctx.beginPath();
  ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 12);
  ctx.fill();
  ctx.strokeStyle = rgba(pal.ink, 0.36);
  ctx.lineWidth = 3;
  ctx.stroke();

  // 纸箱内腔
  const pad = bw * 0.038;
  ctx.fillStyle = "#8a6845";
  ctx.beginPath();
  ctx.roundRect(-bw / 2 + pad, -bh / 2 + pad, bw - pad * 2, bh - pad * 2, 8);
  ctx.fill();

  // 2×2 纯铝箔小袋
  const slots = [
    { x: -bw * 0.21, y: bh * 0.185 },
    { x: bw * 0.21, y: bh * 0.185 },
    { x: -bw * 0.21, y: -bh * 0.175 },
    { x: bw * 0.21, y: -bh * 0.175 },
  ];
  slots.forEach((s, i) => {
    const lp = pouchProgress(i);
    if (lp.alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha *= lp.alpha;
    ctx.translate(s.x, s.y + lp.y);
    ctx.scale(lp.sx, lp.sy);
    drawFoilBag(ctx, pal, bw * 0.34, bh * 0.3, { pure: true, frame });
    ctx.restore();
  });

  // 外层大塑料内胆袋兜住所有铝箔包（外塑）
  if (linerP > 0.01) {
    const lw = bw - pad * 2.8;
    const lh = (bh - pad * 2.4) * linerP;
    const ly = bh / 2 - pad * 1.1 - lh;
    const pinch = wrapP * (lw * 0.22);

    ctx.save();
    ctx.fillStyle = rgba("#ffffff", 0.28);
    ctx.strokeStyle = rgba(pal.bamboo, 0.88);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-lw / 2 + pinch, ly - wrapP * 40);
    ctx.quadraticCurveTo(-lw / 2, ly + 36, -lw / 2, bh / 2 - pad * 1.1);
    ctx.lineTo(lw / 2, bh / 2 - pad * 1.1);
    ctx.quadraticCurveTo(lw / 2, ly + 36, lw / 2 - pinch, ly - wrapP * 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (wrapP > 0.35) {
      const ka = clamp01((wrapP - 0.35) / 0.65);
      ctx.fillStyle = pal.bamboo;
      ctx.globalAlpha *= ka;
      ctx.beginPath();
      ctx.roundRect(-lw / 2 + pinch - 12, ly - wrapP * 40 - 9, lw - pinch * 2 + 24, 18, 8);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ================= 幕一：大整箱 · 内铝外塑 =================
function drawActBox(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const out = easeInOutCubic(progress(frame, ACT1_OUT, ACT1_OUT + 12));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 顶部标题：开场 0.5 秒内即与箱体同步现身（不留空帧）
  {
    const tagP = easeOutCubic(clamp01((frame - BOX_IN + 2) / 13));
    const txt = t(params, "boxTag");
    inkText(ctx, txt, 520, 345, fitSize(txt, 78, 520) * fontScale, Math.max(0.22, tagP), 11, {
      color: pal.tea,
      weight: 700,
      font: KAI,
    });

    const ordL = frame - (BOX_ORDER_AT - 4);
    if (ordL > 0) {
      const ordTxt = t(params, "boxOrder");
      const pose = heavyLand(ordL, { drop: 64, fall: 6, squash: 0.06 });
      const fs = fitSize(ordTxt, 148, 760) * fontScale;
      ctx.save();
      ctx.translate(520, 475 + pose.y);
      ctx.scale(pose.scaleX, pose.scaleY);
      inkText(ctx, ordTxt, 0, 0, fs, easeOutCubic(progress(ordL, 0, 12)), 19, {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    }
  }

  // 主体箱体（宽 640px ≈ 画幅 59%，安全居中于 x=520，右缘 840 << 960）
  const cx = 520;
  const cy = 1030;
  const bw = 640;
  const bh = 500;
  const boxPose = heavyLand(frame - BOX_IN + 4, { drop: 80, fall: 8, squash: 0.04 });

  if (boxPose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha *= boxPose.alpha;
    ctx.translate(cx, cy + boxPose.y);
    ctx.scale(boxPose.scaleX, boxPose.scaleY);

    const linerP = easeInOutCubic(progress(frame, LINER_AT, LINER_AT + 22));
    const wrapP = easeInOutCubic(progress(frame, WRAP_ALL_AT, WRAP_ALL_AT + 20));
    paintBigBoxAssembly(ctx, pal, bw, bh, {
      pouchProgress: (i) => {
        const pl = frame - (POUCH_AT + i * 5);
        if (pl <= 0) return { alpha: 0, y: 0, sx: 1, sy: 1 };
        const lp = heavyLand(pl, { drop: 140, fall: 8, squash: 0.05 });
        return { alpha: lp.alpha, y: lp.y, sx: lp.scaleX, sy: lp.scaleY };
      },
      linerP,
      wrapP,
      frame,
    });
    ctx.restore();
  }

  // 下方结论大字「双重防潮」（底缘约 1495 << 1620 安全线）
  const dl = frame - (DOUBLE_AT - 2);
  if (dl > 0) {
    const txt = t(params, "boxResult");
    const pose = lightFloat(dl, { rise: 20, sway: 0.4, seed: 7 });
    inkText(ctx, txt, 520, 1435 + pose.y, fitSize(txt, 114, 680) * fontScale, easeOutCubic(progress(dl, 0, 12)), 33, {
      color: pal.bamboo,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }

  ctx.restore();
}

// ================= 幕二：单饼 · 内塑外铝 =================
function drawActSingle(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < ACT2_IN) return;
  const out = easeInOutCubic(progress(frame, COMPARE_AT, COMPARE_AT + 12));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 顶部标题：单饼·零散 + 内塑外铝
  {
    const tagP = easeOutCubic(progress(frame, ACT2_IN, ACT2_IN + 12));
    if (tagP > 0) {
      const txt = t(params, "singleTag");
      inkText(ctx, txt, 520, 345, fitSize(txt, 78, 560) * fontScale, tagP, 41, {
        color: pal.tea,
        weight: 700,
        font: KAI,
      });
    }
    const ordL = frame - (SINGLE_ORDER_AT - 4);
    if (ordL > 0) {
      const txt = t(params, "singleOrder");
      const pose = heavyLand(ordL, { drop: 64, fall: 6, squash: 0.06 });
      const fs = fitSize(txt, 148, 760) * fontScale;
      ctx.save();
      ctx.translate(520, 475 + pose.y);
      ctx.scale(pose.scaleX, pose.scaleY);
      inkText(ctx, txt, 0, 0, fs, easeOutCubic(progress(ordL, 0, 12)), 47, {
        color: pal.bamboo,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    }
  }

  const cx = 520;
  const cy = 1020;

  const cakePose = heavyLand(frame - (ACT2_IN + 4), { drop: 110, fall: 8, squash: 0.045 });
  const peP = easeOutCubic(progress(frame, PE_IN_AT, PE_IN_AT + 16));
  const foilSlide = easeOutCubic(progress(frame, FOIL_OUT_AT, FOIL_OUT_AT + 18));
  const openFlap = easeInOutCubic(progress(frame, PEEK_AT, PEEK_AT + 22));

  if (cakePose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha *= cakePose.alpha;
    ctx.translate(cx, cy + cakePose.y);
    ctx.scale(cakePose.scaleX, cakePose.scaleY);

    const drawInnerTea = () => {
      if (peP > 0.01) {
        ctx.save();
        ctx.globalAlpha *= peP;
        drawPeBag(ctx, pal, 500, 525, {
          mode: "flat",
          thickEdge: 0.78,
          inside: () => drawSuxueCake(ctx, pal, 205, { seed: 22 }),
        });
        ctx.restore();
        if (peP < 1) {
          ctx.save();
          ctx.globalAlpha *= 1 - peP;
          drawSuxueCake(ctx, pal, 205, { seed: 22 });
          ctx.restore();
        }
      } else {
        drawSuxueCake(ctx, pal, 205, { seed: 22 });
      }
    };

    if (foilSlide <= 0.01) {
      drawInnerTea();
    } else if (openFlap <= 0.01) {
      drawInnerTea();
      ctx.save();
      ctx.globalAlpha *= foilSlide;
      ctx.translate(0, (1 - foilSlide) * 260);
      drawFoilBag(ctx, pal, 580, 610, { pure: true, frame });
      ctx.restore();
    } else {
      drawFoilBag(ctx, pal, 580, 610, {
        pure: true,
        openFlap: openFlap * 0.88,
        frame,
        inside: () => drawInnerTea(),
      });
    }

    // 潮气水滴被完整透明贴身袋挡在外面（右缘 max 520 + 330 = 850 << 960）
    const mp = easeOutCubic(progress(frame, MOISTURE_AT, MOISTURE_AT + 14));
    if (mp > 0) {
      ctx.save();
      ctx.globalAlpha *= mp * 0.85;
      const drops = [
        { x: -325, y: -155 },
        { x: -310, y: -35 },
        { x: 320, y: -135 },
        { x: 305, y: -15 },
      ];
      drops.forEach((d, idx) => {
        const bounce = Math.sin(frame * 0.14 + idx * 1.4) * 10;
        const px = d.x + Math.sign(d.x) * bounce;
        ctx.fillStyle = "#5a889c";
        ctx.beginPath();
        ctx.moveTo(px, d.y - 16);
        ctx.quadraticCurveTo(px + 13, d.y + 4, px, d.y + 14);
        ctx.quadraticCurveTo(px - 13, d.y + 4, px, d.y - 16);
        ctx.fill();
      });
      ctx.restore();
    }

    ctx.restore();
  }

  // 下方结论大字「隔袋看清」+ 竹青圈
  const ckL = frame - (CHECK_AT - 2);
  if (ckL > 0) {
    const txt = t(params, "checkNote");
    const pose = lightFloat(ckL, { rise: 18, sway: 0.4, seed: 11 });
    inkText(ctx, txt, 520, 1445 + pose.y, fitSize(txt, 114, 680) * fontScale, easeOutCubic(progress(ckL, 0, 12)), 59, {
      color: pal.bamboo,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
    brushRing(ctx, 520, 1445, 285, 86, progress(ckL, 5, 20), pal.bamboo, 63, 7);
  }

  ctx.restore();
}

// ================= 幕三：结尾左右并排对比（停留约 2.0s ≥ 1.5s，最后 0.5s 完全静止） =================
function drawActCompare(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < COMPARE_AT) return;
  const cl = frame - COMPARE_AT;
  const enter = easeOutCubic(clamp01(cl / 15));
  const slideOffset = (1 - enter) * 44;

  // 安全区 [40, 950] 等分左右两半：中线 x = 495，左心 x = 268，右心 x = 722
  const midX = 495;
  const leftX = 268;
  const rightX = 722;

  ctx.save();
  ctx.globalAlpha = enter;

  // 中间一道干脆水墨竖隔线
  drawBrushStroke(
    ctx,
    [
      { x: midX, y: 380 },
      { x: midX, y: 1470 },
    ],
    enter,
    { width: 4.5, color: rgba(pal.ink, 0.28), seed: 88, tail: 0.12 },
  );

  // 左半：大整箱 · 内铝外塑
  ctx.save();
  ctx.translate(-slideOffset, 0);
  inkText(ctx, t(params, "boxTag"), leftX, 420, fitSize(t(params, "boxTag"), 62, 360) * fontScale, 1, 91, {
    color: pal.tea,
    weight: 700,
    font: KAI,
  });
  inkText(ctx, t(params, "boxOrder"), leftX, 525, fitSize(t(params, "boxOrder"), 94, 380) * fontScale, 1, 92, {
    color: pal.ink,
    weight: 900,
    font: SONG,
    wash: 0.025,
  });

  ctx.save();
  ctx.translate(leftX, 975);
  paintBigBoxAssembly(ctx, pal, 380, 310, {
    pouchProgress: () => ({ alpha: 1, y: 0, sx: 1, sy: 1 }),
    linerP: 1,
    wrapP: 1,
    frame: Math.min(frame, COMPARE_AT + 18),
  });
  ctx.restore();

  inkText(ctx, t(params, "boxResult"), leftX, 1345, fitSize(t(params, "boxResult"), 72, 360) * fontScale, 1, 93, {
    color: pal.tea,
    weight: 900,
    font: SONG,
  });
  ctx.restore();

  // 右半：单饼·零散 · 内塑外铝
  ctx.save();
  ctx.translate(slideOffset, 0);
  inkText(ctx, t(params, "singleTag"), rightX, 420, fitSize(t(params, "singleTag"), 58, 380) * fontScale, 1, 94, {
    color: pal.tea,
    weight: 700,
    font: KAI,
  });
  inkText(ctx, t(params, "singleOrder"), rightX, 525, fitSize(t(params, "singleOrder"), 94, 380) * fontScale, 1, 95, {
    color: pal.bamboo,
    weight: 900,
    font: SONG,
    wash: 0.025,
  });

  ctx.save();
  ctx.translate(rightX, 975);
  drawFoilBag(ctx, pal, 350, 390, {
    pure: true,
    openFlap: 0.84,
    frame: Math.min(frame, COMPARE_AT + 18),
    inside: () => {
      drawPeBag(ctx, pal, 300, 330, {
        mode: "flat",
        thickEdge: 0.78,
        inside: () => drawSuxueCake(ctx, pal, 122, { seed: 22 }),
      });
    },
  });
  ctx.restore();

  inkText(ctx, t(params, "checkNote"), rightX, 1345, fitSize(t(params, "checkNote"), 72, 360) * fontScale, 1, 96, {
    color: pal.bamboo,
    weight: 900,
    font: SONG,
  });
  ctx.restore();

  ctx.restore();
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "素雪白牡丹茶正上茶舍一叶倾心净含量克");
}
