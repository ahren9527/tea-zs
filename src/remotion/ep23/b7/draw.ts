/**
 * 第 23 期 B7「检测报告怎么看」逐帧画布（1080×1920）
 * 32 秒长口播按三幕推进，每幕单一焦点：
 *   幕一：检测报告单 + 放大镜滑至「水分」一行圈定；
 *   幕二：全片统一横向水分刻度尺，实测值 6.4% 落入 ≤7% 竹青区「余量足」+ 标出距 8.5% 缓冲余量 +
 *         底部一次性关键小字「DB35/T 1076—2010 · 地方标准 · 企业内控」；
 *   幕三：同一把刻度尺指针滑向右端 8.35% 紧贴 8.5% 朱砂线，切换为「8%–8.5% · 易受潮跑味」。
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
import { onTwos } from "../kit/hand";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  KAI,
  SONG,
  allTextsOf,
  beatWord,
  beginFrame,
  brushRing,
  fillText,
  fitSize,
  gapMarker,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawMagnifier, drawMoistureScale, drawStandardDoc, drawWaterDrop } from "../kit/objects";
import {
  ACT2_AT,
  ACT3_AT,
  CTRL_AT,
  DAMP_AT,
  DB_AT,
  DB_CODE_AT,
  FIND_AT,
  GAP_AT,
  HIGH_AT,
  LENGTH,
  MARGIN_AT,
  REPORT_AT,
  SEVEN_AT,
  TEXT,
  WATER_AT,
  type TextKey,
} from "./data";
import { VO } from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const STILL_START = Math.max(0, LENGTH - END_STILL_FRAMES);
const CX = 495;
const SCALE_Y = 930;

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.045,
    drift: 3.2,
    focus: [
      { at: REPORT_AT, dur: 18, x: CX, y: 920, zoom: 1.01, pull: 0.12 },
      { at: WATER_AT, dur: 18, x: CX, y: 980, zoom: 1.055, pull: 0.2 },
      { at: ACT2_AT, dur: 20, x: CX, y: 900, zoom: 1.01, pull: 0.14 },
      { at: DB_CODE_AT, dur: 20, x: CX, y: 1030, zoom: 1.025, pull: 0.14 },
      { at: ACT3_AT, dur: 20, x: CX + 40, y: 890, zoom: 1.035, pull: 0.16 },
    ],
  });
  for (const [at, amp] of [
    [WATER_AT + 2, 3.0],
    [SEVEN_AT + 4, 3.5],
    [DAMP_AT + 4, 4.5],
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
  renderLayers(ctx, Math.min(rawF, STILL_START), pal, beatCamera(rawF), {
    leaves: 3,
    subject: (p) => {
      drawAct1(ctx, frame, p, params, fontScale);
      drawAct2And3(ctx, frame, stillFrame, p, params, fontScale);
    },
  });
}

// ================= 幕一：检测报告单 + 放大镜锁定「水分」一行 =================
function drawAct1(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const out = easeInOutCubic(progress(frame, ACT2_AT, ACT2_AT + 14));
  if (out >= 1) return;

  const land = heavyLand(frame - REPORT_AT + 4, { drop: 70, fall: 7, squash: 0.035 });
  const findP = easeInOutCubic(progress(frame, FIND_AT, WATER_AT + 12));
  const ringP = easeOutCubic(progress(frame, WATER_AT, WATER_AT + 16));

  ctx.save();
  ctx.globalAlpha = land.alpha * (1 - out);
  ctx.translate(CX, 930 + land.y - out * 60);
  ctx.scale(land.scaleX, land.scaleY);

  drawStandardDoc(ctx, pal, 640, 820, {
    title: t(params, "reportTitle"),
    fontScale,
    body: () => {
      // 四行简洁检验表格（第 1、2、4 行极淡灰线示意，第 3 行「水分」清晰聚焦）
      const rows = [-130, -32, 72, 176];
      rows.forEach((ry, idx) => {
        ctx.strokeStyle = rgba(pal.tea, idx === 2 ? 0.36 : 0.16);
        ctx.lineWidth = idx === 2 ? 2.6 : 1.6;
        ctx.beginPath();
        ctx.moveTo(-250, ry + 42);
        ctx.lineTo(250, ry + 42);
        ctx.stroke();

        if (idx !== 2) {
          // 占位灰条（不写无关装饰小字）
          ctx.fillStyle = rgba(pal.tea, 0.13);
          ctx.fillRect(-230, ry - 10, 120, 18);
          ctx.fillRect(60, ry - 10, 150, 18);
        } else {
          // 焦点行：「水分」
          if (findP > 0.05) {
            ctx.fillStyle = rgba(pal.bamboo, 0.16 * findP);
            ctx.fillRect(-250, ry - 44, 500, 84);
          }
          const wTxt = t(params, "itemWater");
          fillText(ctx, wTxt, -142, ry, fitSize(wTxt, 56, 200) * fontScale, {
            color: findP > 0.2 ? pal.bamboo : pal.ink,
            font: SONG,
            weight: 900,
          });
          fillText(ctx, "6.4%", 142, ry, 52 * fontScale, {
            color: findP > 0.2 ? pal.bamboo : pal.inkSoft,
            font: SONG,
            weight: 800,
          });
          if (ringP > 0.01) {
            brushRing(ctx, -142, ry, 92, 46, ringP, pal.cinnabar, 71, 7.5);
          }
        }
      });
    },
  });

  // 放大镜从右下平滑移至「水分」一行
  if (findP > 0.01) {
    const mx = 230 - findP * 372;
    const my = 310 - findP * 238;
    ctx.save();
    ctx.globalAlpha *= Math.min(1, findP * 2.2);
    ctx.translate(mx, my);
    drawMagnifier(ctx, pal, 98, { angle: 0.75 });
    ctx.restore();
  }

  ctx.restore();
}

// ================= 幕二 & 幕三：同一把横向水分刻度尺演完两端对比 =================
function drawAct2And3(
  ctx: CanvasRenderingContext2D,
  frame: number,
  stillFrame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < ACT2_AT + 4) return;
  const inP = easeOutCubic(progress(frame, ACT2_AT + 4, ACT2_AT + 18));
  const sevenP = easeInOutCubic(progress(frame, SEVEN_AT - 8, SEVEN_AT + 16));
  const gapP = easeInOutCubic(progress(frame, GAP_AT, MARGIN_AT + 14));
  const act3P = easeInOutCubic(progress(frame, ACT3_AT, HIGH_AT + 24));
  const dampP = easeOutCubic(progress(frame, DAMP_AT, DAMP_AT + 18));

  // 刻度尺指针值：先稳稳落到 6.4%（≤7% 竹青区），幕三平滑推向右端 8.38%（贴着 8.5% 朱砂线）
  const lowVal = 7.4 - sevenP * 1.0; // 7.4 → 6.4
  const curVal = lowVal + act3P * (8.38 - lowVal);
  const scaleLen = 780;
  const minV = 5;
  const maxV = 10;
  const xOf = (v: number) => CX - scaleLen / 2 + ((v - minV) / (maxV - minV)) * scaleLen;

  ctx.save();
  ctx.globalAlpha = inP;

  // 1) 主角：全片统一的横向水分刻度尺（居中 y = 930）
  ctx.save();
  ctx.translate(CX, SCALE_Y);
  drawMoistureScale(ctx, pal, {
    orientation: "horizontal",
    min: minV,
    max: maxV,
    length: scaleLen,
    thickness: 58,
    value: curVal,
    reveal: inP,
    show7: true,
    show85: true,
    emphasize7: (1 - act3P) * (0.4 + sevenP * 0.6),
    emphasize85: 0.45 + act3P * 0.55,
    alert: act3P * 0.65,
    labelSide: "bottom",
    showLabels: true,
    valueText: `${curVal.toFixed(1)}%`,
    fontScale,
    seed: 77,
  });
  ctx.restore();

  // 2) 幕二上方焦点：「≤7%」+「余量足」+ 距 8.5% 的宽裕余量标尺
  const act2Fade = 1 - easeInOutCubic(progress(frame, ACT3_AT - 2, ACT3_AT + 14));
  if (act2Fade > 0.01) {
    ctx.save();
    ctx.globalAlpha *= act2Fade;

    if (sevenP > 0.02) {
      const lValTxt = t(params, "lowVal");
      inkText(ctx, lValTxt, CX, 510, fitSize(lValTxt, 142, 620, 0.78) * fontScale, sevenP, 31, {
        color: pal.bamboo,
        font: SONG,
        weight: 900,
        wash: 0.03,
      });
    }

    const ml = frame - MARGIN_AT;
    if (ml > 0) {
      const mTxt = t(params, "marginOk");
      const mLand = heavyLand(ml, { drop: 34, fall: 5, squash: 0.045 });
      ctx.save();
      ctx.globalAlpha *= mLand.alpha;
      ctx.translate(CX, 650);
      beatWord(ctx, frame, VO, "余量就足", mTxt, 0, 0, fitSize(mTxt, 96, 600) * fontScale, {
        accent: "足",
        color: pal.bamboo,
        font: SONG,
        weight: 900,
      });
      ctx.restore();
    }

    // 标尺：直观画出 6.4% 到 8.5% 之间宽阔的安全缓冲距离
    if (gapP > 0.02) {
      const xa = xOf(6.4);
      const xb = xOf(8.5);
      gapMarker(
        ctx,
        { x: xa, y: SCALE_Y - 76 },
        { x: xb, y: SCALE_Y - 76 },
        gapP,
        pal.bamboo,
        41,
        18,
      );
    }

    // 底部一次性关键小字：DB35/T 1076—2010 · 地方标准 · 企业内控（y = 1230..1360 < 1560）
    const dbP = easeOutCubic(progress(frame, DB_AT, DB_CODE_AT + 12));
    if (dbP > 0.01) {
      const codeTxt = t(params, "dbCode");
      const descTxt = t(params, "dbDesc");
      const ctrlBoost = easeOutCubic(progress(frame, CTRL_AT, CTRL_AT + 14));

      // 细淡墨分隔短线
      ctx.strokeStyle = rgba(pal.tea, 0.28 * dbP);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(CX - 260 * dbP, 1185);
      ctx.lineTo(CX + 260 * dbP, 1185);
      ctx.stroke();

      fillText(ctx, codeTxt, CX, 1255, 44 * fontScale, {
        color: pal.ink,
        font: SONG,
        weight: 800,
      });
      fillText(ctx, descTxt, CX, 1330, 42 * fontScale, {
        color: ctrlBoost > 0.2 ? pal.bamboo : pal.inkSoft,
        font: KAI,
        weight: 700,
      });
    }

    ctx.restore();
  }

  // 3) 幕三上方焦点：「8%–8.5%」+「易受潮跑味」+ 贴线微距与潮气点
  if (act3P > 0.02) {
    ctx.save();
    ctx.globalAlpha *= clamp01(act3P * 1.4);

    const hValTxt = t(params, "highVal");
    inkText(ctx, hValTxt, CX, 510, fitSize(hValTxt, 132, 740, 0.72) * fontScale, act3P, 51, {
      color: pal.cinnabar,
      font: SONG,
      weight: 900,
      wash: 0.03,
    });

    if (dampP > 0.01) {
      const dTxt = t(params, "dampRisk");
      const dLand = heavyLand(frame - DAMP_AT, { drop: 36, fall: 5, squash: 0.05 });
      ctx.save();
      ctx.globalAlpha *= dLand.alpha;
      ctx.translate(CX, 650 + dLand.y);
      ctx.scale(dLand.scaleX, dLand.scaleY);
      inkText(ctx, dTxt, 0, 0, fitSize(dTxt, 96, 680) * fontScale, dampP, 53, {
        color: pal.cinnabar,
        font: SONG,
        weight: 900,
        wash: 0.025,
      });
      ctx.restore();

      // 8.5% 线旁几枚轻浮水汽滴，示意稍潮即过线
      const x85 = xOf(8.5);
      for (let i = 0; i < 4; i++) {
        const dx = x85 - 24 + i * 24;
        const dy = SCALE_Y - 115 + Math.sin(stillFrame * 0.09 + i * 1.5) * 10;
        drawWaterDrop(ctx, dx, dy, 11, "#5b899e", 0.72 * dampP);
      }
    }

    ctx.restore();
  }

  ctx.restore();
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "检验6.4%78501239");
}
