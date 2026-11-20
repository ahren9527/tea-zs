/**
 * 第 22 期 B2「顺序对比」逐帧画布（1080×1920）
 */
import {
  cameraAt,
  cameraKick,
  clamp01,
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
    to: 1.06,
    drift: 5,
    focus: [
      { at: BOX_ORDER_AT, dur: 22, x: 540, y: 880, zoom: 1.02, pull: 0.16 },
      { at: WRAP_ALL_AT, dur: 22, x: 540, y: 960, zoom: 1.04, pull: 0.2 },
      { at: ACT2_IN + 4, dur: 22, x: 540, y: 920, zoom: 1.02, pull: 0.16 },
      { at: PEEK_AT, dur: 24, x: 540, y: 940, zoom: 1.07, pull: 0.24 },
    ],
  });
  for (const [at, amp] of [
    [BOX_ORDER_AT, 4],
    [DOUBLE_AT, 4],
    [SINGLE_ORDER_AT, 4],
    [PEEK_AT + 4, 4.5],
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
    leaves: 3,
    subject: (p) => {
      drawActBox(ctx, frame, p, params, fontScale);
      drawActSingle(ctx, frame, p, params, fontScale);
    },
  });
}

// ================= 幕一：大整箱 · 内铝外塑 =================
function drawActBox(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const out = easeInOutCubic(progress(frame, ACT1_OUT, ACT1_OUT + 14));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 顶部标题：大整箱 + 内铝外塑
  {
    const tagP = easeOutCubic(progress(frame, BOX_IN + 8, BOX_IN + 22));
    if (tagP > 0) {
      const txt = t(params, "boxTag");
      inkText(ctx, txt, 540, 355, fitSize(txt, 74, 500) * fontScale, tagP, 11, {
        color: pal.tea,
        weight: 700,
        font: KAI,
      });
    }
    const ordL = frame - (BOX_ORDER_AT - 4);
    if (ordL > 0) {
      const txt = t(params, "boxOrder");
      const pose = heavyLand(ordL, { drop: 70, fall: 6, squash: 0.06 });
      const fs = fitSize(txt, 146, 760) * fontScale;
      ctx.save();
      ctx.translate(540, 485 + pose.y);
      ctx.scale(pose.scaleX, pose.scaleY);
      inkText(ctx, txt, 0, 0, fs, easeOutCubic(progress(ordL, 0, 12)), 19, {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    }
  }

  // 主体箱体轮廓（侧剖视纸箱底槽，干净表达箱内大塑料内胆兜住多包铝箔袋）
  const cx = 540;
  const cy = 1045;
  const bw = 660;
  const bh = 520;

  const boxPose = heavyLand(frame - (BOX_IN + 6), { drop: 100, fall: 9, squash: 0.04 });
  if (boxPose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha *= boxPose.alpha;
    ctx.translate(cx, cy + boxPose.y);
    ctx.scale(boxPose.scaleX, boxPose.scaleY);

    // 纸箱背板
    softShadow(ctx, () => ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 12), {
      blur: 26,
      dx: 10,
      dy: 16,
      alpha: 0.22,
    });
    ctx.fillStyle = "#b58e60";
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 12);
    ctx.fill();

    // 纸箱内腔
    ctx.fillStyle = "#8a6743";
    ctx.beginPath();
    ctx.roundRect(-bw / 2 + 24, -bh / 2 + 24, bw - 48, bh - 48, 8);
    ctx.fill();

    // 多包纯铝箔小袋整齐码放进来（2×2 排列，内铝）
    const slots = [
      { x: -135, y: 95, d: 0 },
      { x: 135, y: 95, d: 5 },
      { x: -135, y: -90, d: 10 },
      { x: 135, y: -90, d: 15 },
    ];
    slots.forEach((s) => {
      const pl = frame - (POUCH_AT + s.d);
      if (pl <= 0) return;
      const lp = heavyLand(pl, { drop: 150, fall: 8, squash: 0.05 });
      ctx.save();
      ctx.globalAlpha *= lp.alpha;
      ctx.translate(s.x, s.y + lp.y);
      ctx.scale(lp.scaleX, lp.scaleY);
      drawFoilBag(ctx, pal, 224, 152, { pure: true });
      ctx.restore();
    });

    // 外层大塑料内胆袋从四周升起把所有铝箔包兜住（外塑）
    const linerP = easeInOutCubic(progress(frame, LINER_AT, LINER_AT + 24));
    const wrapP = easeInOutCubic(progress(frame, WRAP_ALL_AT, WRAP_ALL_AT + 22));
    if (linerP > 0) {
      const lw = bw - 68;
      const lh = (bh - 58) * linerP;
      const ly = bh / 2 - 28 - lh;
      const pinch = wrapP * 120;

      ctx.save();
      ctx.fillStyle = rgba("#ffffff", 0.28);
      ctx.strokeStyle = rgba(pal.bamboo, 0.85);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-lw / 2 + pinch, ly - wrapP * 44);
      ctx.quadraticCurveTo(-lw / 2, ly + 40, -lw / 2, bh / 2 - 28);
      ctx.lineTo(lw / 2, bh / 2 - 28);
      ctx.quadraticCurveTo(lw / 2, ly + 40, lw / 2 - pinch, ly - wrapP * 44);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 内胆袋高光与顶部收口结
      if (wrapP > 0.35) {
        const ka = clamp01((wrapP - 0.35) / 0.65);
        ctx.fillStyle = pal.bamboo;
        ctx.globalAlpha *= ka;
        ctx.beginPath();
        ctx.roundRect(-lw / 2 + pinch - 14, ly - wrapP * 44 - 10, (lw - pinch * 2) + 28, 18, 8);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // 下方结论大字「双重防潮」
  const dl = frame - (DOUBLE_AT - 2);
  if (dl > 0) {
    const txt = t(params, "boxResult");
    const pose = lightFloat(dl, { rise: 22, sway: 0.5, seed: 7 });
    inkText(ctx, txt, 540, 1455 + pose.y, fitSize(txt, 114, 680) * fontScale, easeOutCubic(progress(dl, 0, 12)), 33, {
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

  // 顶部标题：单饼·零散 + 内塑外铝
  {
    const tagP = easeOutCubic(progress(frame, ACT2_IN, ACT2_IN + 14));
    if (tagP > 0) {
      const txt = t(params, "singleTag");
      inkText(ctx, txt, 540, 355, fitSize(txt, 74, 560) * fontScale, tagP, 41, {
        color: pal.tea,
        weight: 700,
        font: KAI,
      });
    }
    const ordL = frame - (SINGLE_ORDER_AT - 4);
    if (ordL > 0) {
      const txt = t(params, "singleOrder");
      const pose = heavyLand(ordL, { drop: 70, fall: 6, squash: 0.06 });
      const fs = fitSize(txt, 146, 760) * fontScale;
      ctx.save();
      ctx.translate(540, 485 + pose.y);
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

  const cx = 540;
  const cy = 1020;

  // 1. 素雪茶饼先落位
  const cakePose = heavyLand(frame - (ACT2_IN + 6), { drop: 120, fall: 9, squash: 0.045 });
  // 2. 贴身透明 PE 袋罩上
  const peP = easeOutCubic(progress(frame, PE_IN_AT, PE_IN_AT + 18));
  // 3. 外层纯铝箔袋从下方套上 → 到「拉开外层铝箔袋」时拉下半截，隔着透明袋一眼看清素雪！
  const foilSlide = easeOutCubic(progress(frame, FOIL_OUT_AT, FOIL_OUT_AT + 20));
  const openFlap = easeInOutCubic(progress(frame, PEEK_AT, PEEK_AT + 24));

  if (cakePose.alpha > 0) {
    ctx.save();
    ctx.globalAlpha = cakePose.alpha;
    ctx.translate(cx, cy + cakePose.y);
    ctx.scale(cakePose.scaleX, cakePose.scaleY);

    const drawInnerTea = () => {
      if (peP > 0.01) {
        ctx.save();
        ctx.globalAlpha = peP;
        drawPeBag(ctx, pal, 450, 470, {
          mode: "flat",
          thickEdge: 0.75,
          inside: () => drawSuxueCake(ctx, pal, 185, { seed: 22 }),
        });
        ctx.restore();
        if (peP < 1) {
          ctx.save();
          ctx.globalAlpha = 1 - peP;
          drawSuxueCake(ctx, pal, 185, { seed: 22 });
          ctx.restore();
        }
      } else {
        drawSuxueCake(ctx, pal, 185, { seed: 22 });
      }
    };

    if (foilSlide <= 0.01) {
      drawInnerTea();
    } else if (openFlap <= 0.01) {
      drawInnerTea();
      ctx.save();
      ctx.globalAlpha = foilSlide;
      ctx.translate(0, (1 - foilSlide) * 260);
      drawFoilBag(ctx, pal, 520, 560, { pure: true });
      ctx.restore();
    } else {
      // 外层铝箔袋拉开，内部完整透明袋+素雪清晰可见
      drawFoilBag(ctx, pal, 520, 560, {
        pure: true,
        openFlap: openFlap * 0.88,
        inside: () => drawInnerTea(),
      });
    }

    // 潮气水滴被完整透明贴身袋挡在外面（说到「不用拆开贴身袋放进潮气」）
    const mp = easeOutCubic(progress(frame, MOISTURE_AT, MOISTURE_AT + 16));
    if (mp > 0) {
      ctx.save();
      ctx.globalAlpha = mp * 0.82;
      const drops = [
        { x: -290, y: -150 },
        { x: -275, y: -40 },
        { x: 285, y: -130 },
        { x: 270, y: -20 },
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
    const pose = lightFloat(ckL, { rise: 20, sway: 0.5, seed: 11 });
    inkText(ctx, txt, 540, 1455 + pose.y, fitSize(txt, 114, 680) * fontScale, easeOutCubic(progress(ckL, 0, 12)), 59, {
      color: pal.bamboo,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
    brushRing(ctx, 540, 1455, 285, 86, progress(ckL, 6, 22), pal.bamboo, 63, 7);
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "素雪白牡丹茶正上茶舍一叶倾心净含量克");
}
