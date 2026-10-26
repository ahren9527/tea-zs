/**
 * 第 21 期 B4「为什么分」逐帧画布（1080×1920）。
 * 两个原因各一屏：
 * ① 第一屏：新茶水分没稳（快速跳跃的青绿水滴与急促脉搏波）vs 老茶转化慢（温润缓慢的茶褐同心圆与缓波），
 *    顶部落大字「节奏不同」，主体带微回弹向下让位。
 * ② 第二屏：大字「冲」对「静」；左新茶飘出青绿色香气线，越过中线把右边老茶琥珀色的陈香慢慢盖住，
 *    旁边的蓬松散茶不断吸入青绿香气微粒；最后竹青隔板落下，收尾大字「分开更稳妥」。
 */
import {
  TAU,
  cameraAt,
  cameraKick,
  clamp01,
  drawBrushStroke,
  drawSteam,
  easeInOutCubic,
  easeOutCubic,
  hash01,
  heavyLand,
  lerp,
  lightFloat,
  mixHex,
  progress,
  progressRaw,
  rgba,
  springValue,
  steamWisps,
  type FxPalette,
  type Pt,
} from "../kit/fx";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  beginFrame,
  fitSize,
  inkText,
  life,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawMiyunCake } from "../kit/objects";
import {
  ABSORB_AT,
  CAKE_Y,
  CHONG_AT,
  COVER_AT,
  HERO_Y,
  JING_AT,
  LEFT_X,
  LENGTH,
  MOIST_AT,
  P1_IN,
  P1_OUT,
  P2_IN,
  RHYTHM_AT,
  RIGHT_X,
  SAFE_AT,
  SLOW_AT,
  TEXT,
  WHY_AT,
  WHY_OUT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.06,
    drift: 6,
    focus: [
      { at: MOIST_AT - 6, dur: 22, x: 460, y: 940, zoom: 1.04, pull: 0.2 },
      { at: RHYTHM_AT - 4, dur: 24, x: 540, y: 880, zoom: 1.0, pull: 0.16 },
      { at: CHONG_AT - 4, dur: 20, x: 440, y: 860, zoom: 1.05, pull: 0.22 },
      { at: COVER_AT, dur: 36, x: 600, y: 920, zoom: 1.06, pull: 0.25 },
      { at: SAFE_AT - 6, dur: 26, x: 540, y: 880, zoom: 1.0, pull: 0.15 },
    ],
  });
  for (const [at, amp] of [
    [RHYTHM_AT, 4],
    [CHONG_AT, 5],
    [SAFE_AT + 2, 5],
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
    subject: (p) => {
      drawScreen1(ctx, frame, p, params, fontScale);
      drawScreen2(ctx, frame, p, params, fontScale);
    },
  });
}

// ================= 第一屏：水分未稳 vs 转化节奏不同 =================
function drawScreen1(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const out = easeInOutCubic(progress(frame, P1_OUT, P1_OUT + 16));
  if (out >= 1) return;

  const yieldY =
    56 * springValue(frame - (RHYTHM_AT - 2), { stiffness: 95, damping: 11.5, mass: 1 });
  const cy = CAKE_Y - 80 + yieldY;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 左：新茶饼 + 急促水分波动
  const lNew = frame - P1_IN;
  if (lNew > 0) {
    const land = heavyLand(lNew, { drop: 130, fall: 9, squash: 0.05 });
    const jitter =
      frame >= MOIST_AT ? Math.sin((frame - MOIST_AT) * 0.45) * 6 : 0;
    ctx.save();
    ctx.globalAlpha *= land.alpha;
    ctx.translate(LEFT_X, cy + land.y + jitter);
    ctx.scale(land.scaleX, land.scaleY);
    drawMiyunCake(ctx, pal, 165, { tone: "new", peel: 0.6, peelAngle: 2.3, seed: 41 });
    ctx.restore();

    // 新茶上方：跳跃的水珠与快频波纹（水分还没完全稳定）
    const ml = frame - MOIST_AT;
    if (ml > 0) {
      const mp = easeOutCubic(progress(ml, 0, 18));
      ctx.save();
      ctx.globalAlpha *= mp;
      // 快频起伏曲线
      const wavePts: Pt[] = [];
      for (let i = 0; i <= 28; i++) {
        const u = i / 28;
        const wx = LEFT_X - 150 + u * 300;
        const wy =
          cy -
          275 +
          Math.sin(u * Math.PI * 5 - frame * 0.38) * 32 * Math.sin(u * Math.PI);
        wavePts.push({ x: wx, y: wy });
      }
      drawBrushStroke(ctx, wavePts, mp, {
        width: 7,
        color: pal.bamboo,
        seed: 101,
        tail: 0.25,
        head: 0.1,
      });

      // 三颗上升的水分小滴
      for (let d = 0; d < 3; d++) {
        const cyc = ((ml + d * 13) % 38) / 38;
        const dx = LEFT_X - 75 + d * 75 + Math.sin(cyc * TAU + d) * 10;
        const dy = cy - 210 - cyc * 140;
        const da = Math.sin(cyc * Math.PI);
        const r = 11 * (0.7 + 0.3 * da);
        ctx.fillStyle = rgba(pal.bamboo, 0.75 * da);
        ctx.beginPath();
        ctx.moveTo(dx, dy - r * 1.6);
        ctx.bezierCurveTo(dx + r, dy - r * 0.3, dx + r, dy + r, dx, dy + r);
        ctx.bezierCurveTo(dx - r, dy + r, dx - r, dy - r * 0.3, dx, dy - r * 1.6);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // 右：老茶饼 + 沉稳缓慢转化波纹
  const lOld = frame - (P1_IN + 6);
  if (lOld > 0) {
    const land = heavyLand(lOld, { drop: 130, fall: 9, squash: 0.05 });
    const slowBreath = Math.sin(frame * 0.07) * 3;
    ctx.save();
    ctx.globalAlpha *= land.alpha;
    ctx.translate(RIGHT_X, cy + land.y + slowBreath);
    ctx.scale(land.scaleX, land.scaleY);
    drawMiyunCake(ctx, pal, 165, { tone: "old", peel: 0.6, peelAngle: -0.7, seed: 42 });
    ctx.restore();

    const sl = frame - SLOW_AT;
    if (sl > 0) {
      const sp = easeOutCubic(progress(sl, 0, 22));
      ctx.save();
      ctx.globalAlpha *= sp;
      // 舒缓平稳的长波（老茶转化节奏沉稳）
      const slowPts: Pt[] = [];
      for (let i = 0; i <= 28; i++) {
        const u = i / 28;
        const wx = RIGHT_X - 150 + u * 300;
        const wy =
          cy -
          275 +
          Math.sin(u * Math.PI * 1.5 - frame * 0.08) * 14 * Math.sin(u * Math.PI);
        slowPts.push({ x: wx, y: wy });
      }
      drawBrushStroke(ctx, slowPts, sp, {
        width: 8,
        color: pal.tea,
        seed: 109,
        tail: 0.3,
        head: 0.1,
      });
      ctx.restore();
    }
  }

  // 开场大字「为什么分？」：口播一开口就有焦点，到「首先」后上浮淡出，给「节奏不同」让位
  const wl = frame - WHY_AT;
  const whyOut = easeInOutCubic(progress(frame, WHY_OUT, WHY_OUT + 12));
  if (wl > 0 && whyOut < 1) {
    const pose = heavyLand(wl + 2, { drop: 65, fall: 6, squash: 0.05 });
    const txt = t(params, "why");
    const fs = fitSize(txt, 180, 760) * fontScale;
    ctx.save();
    ctx.globalAlpha *= 1 - whyOut;
    ctx.translate(540, HERO_Y + pose.y - 40 * whyOut);
    ctx.scale(pose.scaleX, pose.scaleY);
    inkText(ctx, txt, 0, 0, fs, easeOutCubic(progress(wl, 0, 15)), 113, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    ctx.restore();
  }

  // 第一屏顶部大字：「节奏不同」
  const rl = frame - RHYTHM_AT;
  if (rl > 0) {
    const pose = heavyLand(rl + 2, { drop: 65, fall: 6, squash: 0.05 });
    const fl = lightFloat(rl, { rise: 10, sway: 1, seed: 3 });
    const txt = t(params, "rhythm");
    const fs = fitSize(txt, 180, 800) * fontScale;
    ctx.save();
    ctx.translate(540, HERO_Y + pose.y + fl.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    inkText(ctx, txt, 0, 0, fs, easeOutCubic(progress(rl, 0, 15)), 115, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    ctx.restore();
  }

  ctx.restore();
}

// ================= 第二屏：「冲」对「静」+ 青绿香气盖过琥珀陈香 + 散茶吸味 =================
function drawScreen2(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < P2_IN) return;
  const inP = easeOutCubic(progress(frame, P2_IN, P2_IN + 16));
  const coverP = easeInOutCubic(progress(frame, COVER_AT, COVER_AT + 70));
  const safeP = easeInOutCubic(progress(frame, SAFE_AT, SAFE_AT + 24));

  // 「分开更稳妥」出现时，左右茶往两侧回弹分开，中间立起隔断
  const sepDx = 42 * springValue(frame - SAFE_AT, { stiffness: 95, damping: 12, mass: 1 });
  const lx = LEFT_X - sepDx;
  const rx = RIGHT_X + sepDx;
  const objY = CAKE_Y + 20;

  ctx.save();
  ctx.globalAlpha = inP;

  // 1. 左：新茶饼（香「冲」）
  {
    const pose = heavyLand(frame - P2_IN, { drop: 110, fall: 8, squash: 0.04 });
    ctx.save();
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(lx, objY + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawMiyunCake(ctx, pal, 160, { tone: "new", peel: 0.65, peelAngle: 2.35, seed: 51 });
    ctx.restore();
  }

  // 2. 右：老茶 + 蓬松散茶（香「静」，散茶易吸味）
  {
    const pose = heavyLand(frame - (P2_IN + 4), { drop: 110, fall: 8, squash: 0.04 });
    const absorbTint = coverP * (1 - safeP * 0.8);
    ctx.save();
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(rx, objY + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    // 右边始终是同一块老茶饼（不换成散叶）；吸味时饼面微微泛青
    drawMiyunCake(ctx, pal, 160, { tone: "old", peel: 0.65, peelAngle: -0.7, seed: 52 });
    if (absorbTint > 0) {
      ctx.fillStyle = rgba("#6f8f4e", 0.16 * absorbTint);
      ctx.beginPath();
      ctx.arc(0, 0, 150, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. 老茶琥珀色陈香（原本温润向上的琥珀色香气，被青绿香气慢慢压住变淡；分开后恢复）
  const jingL = frame - JING_AT;
  if (jingL > 0) {
    const amberSuppression = clamp01(1 - coverP * 0.78 + safeP * 0.8);
    const amberColor = mixHex("#c88232", pal.tea, 0.25);
    const amberEnter = easeOutCubic(progress(jingL, 0, 20));
    drawSteam(
      ctx,
      steamWisps(frame, 4, { x: rx - 10, y: objY - 120, w: 110 }, 23, 360 * amberSuppression),
      amberColor,
      1.35 * amberEnter * amberSuppression,
    );
    // 两缕温润琥珀色细香线
    for (let k = 0; k < 2; k++) {
      const pts: Pt[] = [];
      for (let i = 0; i <= 16; i++) {
        const u = i / 16;
        pts.push({
          x: rx - 28 + k * 56 + Math.sin(u * Math.PI * 1.5 + frame * 0.06 + k) * 16,
          y: objY - 130 - u * 250 * amberSuppression,
        });
      }
      ctx.save();
      ctx.globalAlpha *= amberEnter * amberSuppression * 0.75;
      drawBrushStroke(ctx, pts, 1, {
        width: 5.5,
        color: amberColor,
        seed: 210 + k,
        tail: 0.55,
        head: 0.15,
      });
      ctx.restore();
    }
  }

  // 4. 新茶青绿色香气线：从左边飘出，横向越界把右边老茶的琥珀陈香盖住，并钻进散茶里
  const chongL = frame - CHONG_AT;
  if (chongL > 0) {
    const greenColor = mixHex("#4f7a3e", pal.bamboo, 0.35);
    const greenEnter = easeOutCubic(progress(chongL, 0, 22));
    // 分开后（safeP），越界到右边的青绿香气退回左边
    const reachRight = coverP * (1 - safeP);

    drawSteam(
      ctx,
      steamWisps(frame, 5, { x: lx + reachRight * 220, y: objY - 130, w: 160 }, 17, 460),
      greenColor,
      1.4 * greenEnter,
    );

    // 5 条青绿色香气长线：随 coverP 从左(lx)一直蔓延笼罩到右(rx)老茶散茶上方
    for (let k = 0; k < 5; k++) {
      const period = 48;
      const local = (chongL + k * 9) % period;
      const grow = easeOutCubic(progressRaw(local, 0, 28));
      const fade = 1 - 0.5 * progressRaw(local, 34, period);
      const pts: Pt[] = [];
      const spanX = lerp(90, rx - lx + 80, reachRight);
      const baseH = 260 + (k % 3) * 55;
      for (let i = 0; i <= 22; i++) {
        const u = i / 22;
        const arch = Math.sin(u * Math.PI);
        const wave = Math.sin(u * Math.PI * 2.4 - frame * 0.14 + k * 1.3) * 26;
        const px = lx - 20 + u * spanX + (1 - reachRight) * (k - 2) * 28;
        const py =
          objY -
          120 -
          u * baseH * (1 - 0.52 * reachRight) -
          arch * 180 * reachRight +
          wave;
        pts.push({ x: px, y: py });
      }
      ctx.save();
      ctx.globalAlpha *= greenEnter * fade * 0.82;
      drawBrushStroke(ctx, pts, grow, {
        width: 7,
        color: greenColor,
        seed: 230 + k,
        tail: 0.5,
        head: 0.15,
      });
      ctx.restore();
    }

    // 散茶吸味：青绿色香气颗粒向右侧蓬松散茶内部吸附汇聚
    const absL = frame - ABSORB_AT;
    if (absL > 0 && safeP < 0.8) {
      const absA = easeOutCubic(progress(absL, 0, 20)) * (1 - safeP);
      ctx.save();
      ctx.globalAlpha *= absA;
      for (let i = 0; i < 16; i++) {
        const cyc = ((absL * 0.032 + hash01(i, 91)) % 1);
        const ang = hash01(i, 92) * Math.PI * 1.4 - Math.PI * 1.2;
        const dist = lerp(240, 28, easeInOutCubic(cyc));
        const px = rx + Math.cos(ang) * dist;
        const py = objY - 40 + Math.sin(ang) * dist * 0.8;
        ctx.fillStyle = rgba(greenColor, Math.sin(cyc * Math.PI) * 0.85);
        ctx.beginPath();
        ctx.arc(px, py, 5 + (1 - cyc) * 5, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // 5. 大字「冲」对「静」（在结尾「分开更稳妥」出来前占据上方焦点，出来时退淡让位）
  const pairA = life(frame, CHONG_AT - 2, SAFE_AT - 10, 10, 12);
  if (pairA > 0) {
    ctx.save();
    ctx.globalAlpha *= pairA;
    if (chongL > 0) {
      const poseC = heavyLand(chongL + 2, { drop: 75, fall: 6, squash: 0.06 });
      const fsC = fitSize(t(params, "chong"), 240, 380) * fontScale;
      ctx.save();
      ctx.translate(LEFT_X, 460 + poseC.y);
      ctx.scale(poseC.scaleX, poseC.scaleY);
      inkText(ctx, t(params, "chong"), 0, 0, fsC, easeOutCubic(progress(chongL, 0, 12)), 251, {
        color: pal.bamboo,
        weight: 900,
        font: SONG,
        wash: 0.035,
      });
      ctx.restore();
    }
    if (jingL > 0) {
      const flJ = lightFloat(jingL, { rise: 22, sway: 1, seed: 8 });
      const fsJ = fitSize(t(params, "jing"), 240, 380) * fontScale;
      // 被青绿香气盖住时，「静」字也微微被压暗一点
      ctx.save();
      ctx.globalAlpha *= 1 - 0.38 * coverP;
      inkText(
        ctx,
        t(params, "jing"),
        RIGHT_X,
        460 + flJ.y,
        fsJ,
        easeOutCubic(progress(jingL, 0, 16)),
        257,
        {
          color: pal.tea,
          weight: 900,
          font: SONG,
          wash: 0.03,
        },
      );
      ctx.restore();
    }
    ctx.restore();
  }

  // 6. 结尾：中间落下一道竹青分隔线，顶部浮现大字「分开更稳妥」
  if (safeP > 0) {
    drawBrushStroke(
      ctx,
      [
        { x: 540, y: 680 },
        { x: 538, y: 1020 },
        { x: 541, y: 1360 },
      ],
      safeP,
      {
        width: 12,
        color: pal.bamboo,
        seed: 271,
        tail: 0.3,
        head: 0.08,
        dry: 0.4,
        dryColor: pal.paper,
      },
    );

    const sl = frame - SAFE_AT;
    const poseS = heavyLand(sl + 2, { drop: 65, fall: 6, squash: 0.05 });
    const flS = lightFloat(sl, { rise: 10, sway: 1, seed: 12 });
    const txtS = t(params, "safe");
    const fsS = fitSize(txtS, 170, 780) * fontScale;
    ctx.save();
    ctx.translate(540, HERO_Y + poseS.y + flS.y);
    ctx.scale(poseS.scaleX, poseS.scaleY);
    inkText(ctx, txtS, 0, 0, fsS, easeOutCubic(progress(sl, 0, 16)), 281, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    ctx.restore();
  }

  ctx.restore();
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "蜜韵正");
}
