/**
 * 第 23 期「含水量：8.5%是上限」共用物件（小正色板 + 宣纸窗光，确定性纯函数，无 Math.random）：
 * 1. 本期产品「蜜韵 · 寿眉」饼茶：统一引用 @/remotion/shared/products 的 drawMiyunCake，
 *    并提供带克制受潮斑叠层的 drawMiyunCakeWithDamp（B5/B6）。
 * 2. 全片数字主角「水分刻度尺」drawMoistureScale（竖向 / 横向统一视觉语言：7% 竹青绿、8.5% 朱砂红）。
 * 3. 国标文件 / 检测报告单 drawStandardDoc + 放大镜 drawMagnifier（B2 / B7）。
 * 4. 散茶蓬松叶堆 drawLooseTeaPile + 水汽滴 drawMoistureDrops + 梅雨丝 drawRainStreaks + 废茶篓 drawTrashBin（B4–B6）。
 * 5. 加厚 PE 袋 drawPeBag + 存茶纸箱/茶柜 drawCorrugatedBoxTop / drawStorageCabinet + 茶壶茶杯 drawTeapotAndCup（B4 / B5 / B8）。
 * 6. 简笔手捏茶 drawHandGesture + 简笔闻香鼻 drawNoseProfile（B10）。
 */
import {
  TAU,
  clamp01,
  drawSteam,
  hash01,
  mixHex,
  rgba,
  rng,
  steamWisps,
  type FxPalette,
  type Pt,
} from "@/remotion/shared/fx";
import { drawMiyunCake } from "@/remotion/shared/products";
import { KAI, SONG, fillText, softShadow } from "./draw-kit";
import { boilOffset, drawBoilBrushStroke, traceBoilLine, traceBoilRect } from "./hand";

export { drawMiyunCake };

const HEI = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Noto Serif SC", sans-serif';

// ============================================================================
// 1. 蜜韵饼茶（带可选受潮斑，克制不恶心）与侧视饼茶
// ============================================================================

export type MiyunDampOpts = {
  lift?: number;
  /** 0..1 受潮斑强度（B5/B6 超标发潮） */
  damp?: number;
  seed?: number;
};

/** 绘制「蜜韵 · 寿眉」饼茶（直接复用 shared/products/drawMiyunCake，可叠加克制潮斑） */
export function drawMiyunCakeWithDamp(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  radius: number,
  opts: MiyunDampOpts = {},
) {
  const { lift = 0, damp = 0, seed = 23 } = opts;
  drawMiyunCake(ctx, radius, { lift });

  if (damp > 0.01) {
    const d = clamp01(damp);
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.96, 0, TAU * 0.9995);
    ctx.clip();

    // 整体渐进发暗（演而不讲：高含水饼茶表面先失去明快干爽感，逐渐泛暗潮）
    ctx.fillStyle = rgba("#3e483c", 0.24 * d);
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);

    // 几处克制的宣纸洇潮斑（从边缘向内渐生，暗灰青 + 淡褐水圈，绝不恶心）
    const rr = rng(seed * 41 + 7);
    for (let i = 0; i < 11; i++) {
      const ang = rr() * TAU;
      const dist = radius * (0.16 + rr() * 0.68);
      const bx = Math.cos(ang) * dist;
      const by = Math.sin(ang) * dist;
      const thresh = i * 0.055;
      const localD = clamp01((d - thresh) / (1 - thresh + 0.01));
      if (localD <= 0.01) continue;
      const br = radius * (0.1 + rr() * 0.16) * (0.45 + 0.55 * localD);
      const g = ctx.createRadialGradient(bx, by, br * 0.08, bx, by, br);
      g.addColorStop(0, rgba("#3f4939", 0.48 * localD));
      g.addColorStop(0.58, rgba("#5d5846", 0.28 * localD));
      g.addColorStop(0.86, rgba("#7c5840", 0.18 * localD));
      g.addColorStop(1, rgba("#7c5840", 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, TAU * 0.9995);
      ctx.fill();
    }

    // 边缘一圈微红预警水渍线
    ctx.strokeStyle = rgba(pal.cinnabar, 0.32 * d);
    ctx.lineWidth = Math.max(2, radius * 0.022);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.94, 0, TAU * 0.9995);
    ctx.stroke();

    ctx.restore();
  }
}

/** 侧视「蜜韵」饼茶（红褐金边腰带） */
export function drawCakeSide(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: { wrapped?: boolean } = {},
) {
  const { wrapped = true } = opts;
  ctx.save();
  softShadow(ctx, () => ctx.roundRect(-w / 2, -h / 2, w, h, h * 0.42), {
    blur: 14,
    dx: 4,
    dy: 8,
    alpha: 0.18,
  });
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  if (wrapped) {
    g.addColorStop(0, "#fdfbf6");
    g.addColorStop(0.55, "#efe9dc");
    g.addColorStop(1, "#d8cebc");
  } else {
    g.addColorStop(0, "#8f986e");
    g.addColorStop(0.5, "#6b734e");
    g.addColorStop(1, "#4e5236");
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, h * 0.42);
  ctx.fill();
  ctx.strokeStyle = rgba(pal.tea, 0.34);
  ctx.lineWidth = 2.4;
  ctx.stroke();

  if (wrapped) {
    // 蜜韵红褐丝带与烫金细边
    ctx.fillStyle = "#8e3f26";
    ctx.fillRect(-w * 0.24, -h * 0.17, w * 0.48, h * 0.34);
    ctx.fillStyle = "#e8c98e";
    ctx.fillRect(-w * 0.24, -h * 0.17, w * 0.48, Math.max(2, h * 0.05));
    ctx.fillRect(-w * 0.24, h * 0.12, w * 0.48, Math.max(2, h * 0.05));
  }
  ctx.restore();
}

// ============================================================================
// 2. 全片数字主角：水分刻度尺（竖向 / 横向统一视觉语言）
//    7% 竹青绿（#6B7A4F）· 8.5% 朱砂红（#B5332A）
// ============================================================================

export type MoistureScaleOpts = {
  orientation?: "vertical" | "horizontal";
  /** 刻度范围（默认 5%..10%） */
  min?: number;
  max?: number;
  /** 尺体长与宽（竖向时 len=高、thick=宽；横向时 len=宽、thick=高） */
  length: number;
  thickness?: number;
  /** 当前实测值（省略则不画指针，只画空尺） */
  value?: number;
  /** 进场绘制进度 0..1 */
  reveal?: number;
  /** 是否显示 7% 竹青线（默认 true） */
  show7?: boolean;
  /** 是否显示 8.5% 朱砂线（默认 true） */
  show85?: boolean;
  /** 强调 8.5% 红线 0..1 */
  emphasize85?: number;
  /** 强调 7% 绿线 0..1 */
  emphasize7?: number;
  /** 超标警示抖动与红晕 0..1 */
  alert?: number;
  /** 刻度标签侧：vertical 用 "left"|"right"；horizontal 用 "top"|"bottom" */
  labelSide?: "left" | "right" | "top" | "bottom";
  /** 是否显示 7% / 8.5% 数字标 */
  showLabels?: boolean;
  /** 可选自定义 7% / 8.5% 标签文字（面板可改时传入） */
  label7?: string;
  label85?: string;
  /** 额外标注点（如 B3 晒青 9%） */
  extraMark?: { value: number; text: string; alpha: number };
  /** 指针旁实时数值标签 */
  valueText?: string;
  /** 字体缩放 */
  fontScale?: number;
  seed?: number;
  /** 当前帧号：驱动每 3 帧一次的线条抖动（仅作用于勾线/刻度线/毛笔线，数字标签不抖） */
  frame?: number;
  /** 指针数值标签的跟随延迟偏移（px，模拟跟随滞后几帧停稳） */
  tagLag?: number;
  /** 淡墨母题样式（用于 B9 口诀收束：轻墨刻度尺，突出 7%→8.5% 余量） */
  inkMotif?: boolean;
};

/**
 * 全片统一的「水分刻度尺」：
 * 原点在尺体中心。竖向时下低上高（5% 在下，10% 在上）；横向时左低右高（5% 在左，10% 在右）。
 */
export function drawMoistureScale(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  opts: MoistureScaleOpts,
) {
  const {
    orientation = "vertical",
    min = 5,
    max = 10,
    length,
    thickness = 58,
    value,
    reveal = 1,
    show7 = true,
    show85 = true,
    emphasize85 = 0.6,
    emphasize7 = 0.5,
    alert = 0,
    labelSide = orientation === "vertical" ? "right" : "bottom",
    showLabels = true,
    label7 = "7%",
    label85 = "8.5%",
    extraMark,
    valueText,
    fontScale = 1,
    seed = 23,
    frame = 0,
    tagLag = 0,
    inkMotif = false,
  } = opts;

  const rev = clamp01(reveal);
  if (rev <= 0.01) return;

  const isVert = orientation === "vertical";
  const halfLen = length / 2;
  const halfThk = thickness / 2;
  const posOf = (v: number) => {
    const t = clamp01((v - min) / (max - min));
    return isVert ? halfLen - t * length : -halfLen + t * length;
  };

  ctx.save();
  ctx.globalAlpha *= Math.min(1, rev * 1.4);

  // 1) 尺身宣纸竹木底板
  const x0 = isVert ? -halfThk : -halfLen;
  const y0 = isVert ? -halfLen : -halfThk;
  const w = isVert ? thickness : length;
  const h = isVert ? length : thickness;
  const rr = Math.min(14, thickness * 0.24);

  softShadow(ctx, () => ctx.roundRect(x0, y0, w, h, rr), {
    blur: 18,
    dx: 6,
    dy: 10,
    alpha: 0.14,
  });

  // 裁剪入尺身内部画分区色带
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, rr);
  ctx.clip();

  // 底色（暖米白纸尺）
  const baseG = isVert
    ? ctx.createLinearGradient(-halfThk, 0, halfThk, 0)
    : ctx.createLinearGradient(0, -halfThk, 0, halfThk);
  baseG.addColorStop(0, mixHex(pal.paper, "#ffffff", 0.45));
  baseG.addColorStop(0.55, pal.paper);
  baseG.addColorStop(1, mixHex(pal.paper, pal.oat, 0.55));
  ctx.fillStyle = baseG;
  ctx.fillRect(x0, y0, w, h);

  // 三段色带：≤7% 竹青绿淡底 · 7–8.5% 燕麦暖黄 · >8.5% 朱砂淡警底
  const p7 = posOf(7);
  const p85 = posOf(8.5);
  if (isVert) {
    // <= 7% (p7 .. halfLen)
    ctx.fillStyle = rgba(pal.bamboo, 0.16 + emphasize7 * 0.1);
    ctx.fillRect(-halfThk, p7, thickness, halfLen - p7);
    // 7% .. 8.5% (p85 .. p7)
    ctx.fillStyle = rgba("#d2a85c", 0.14);
    ctx.fillRect(-halfThk, p85, thickness, p7 - p85);
    // > 8.5% (-halfLen .. p85)
    ctx.fillStyle = rgba(pal.cinnabar, 0.15 + alert * 0.22);
    ctx.fillRect(-halfThk, -halfLen, thickness, p85 - -halfLen);
  } else {
    // <= 7% (-halfLen .. p7)
    ctx.fillStyle = rgba(pal.bamboo, 0.16 + emphasize7 * 0.1);
    ctx.fillRect(-halfLen, -halfThk, p7 - -halfLen, thickness);
    // 7% .. 8.5% (p7 .. p85)
    ctx.fillStyle = rgba("#d2a85c", 0.14);
    ctx.fillRect(p7, -halfThk, p85 - p7, thickness);
    // > 8.5% (p85 .. halfLen)
    ctx.fillStyle = rgba(pal.cinnabar, 0.15 + alert * 0.22);
    ctx.fillRect(p85, -halfThk, halfLen - p85, thickness);
  }

  // 2) 液柱填充（当有 value 时，从最小刻度平稳填到当前值）
  if (value !== undefined) {
    const pv = posOf(value);
    const col =
      value > 8.5
        ? pal.cinnabar
        : value >= 7.8
          ? mixHex("#c47c38", pal.cinnabar, clamp01((value - 7.8) / 0.7))
          : pal.bamboo;
    const fillAlpha = value > 8.5 ? 0.52 + alert * 0.2 : 0.44;
    ctx.fillStyle = rgba(col, fillAlpha);
    if (isVert) {
      ctx.fillRect(-halfThk + 5, pv, thickness - 10, halfLen - pv);
    } else {
      ctx.fillRect(-halfLen, -halfThk + 5, pv - -halfLen, thickness - 10);
    }
  }

  // 3) 细腻手绘刻度线（每 0.5% 一短格，每 1% 一长格，带 3 帧微抖）
  ctx.strokeStyle = rgba(inkMotif ? pal.inkSoft : pal.tea, inkMotif ? 0.32 : 0.44);
  ctx.lineCap = "round";
  let tickIdx = 0;
  for (let v = min; v <= max + 0.001; v += 0.5) {
    tickIdx++;
    const isMajor = Math.abs(v - Math.round(v)) < 0.01;
    const tickLen = thickness * (isMajor ? 0.36 : 0.2);
    ctx.lineWidth = isMajor ? 2.4 : 1.5;
    const p = posOf(v);
    ctx.beginPath();
    if (isVert) {
      const sideX = labelSide === "left" ? -halfThk : halfThk;
      const dir = labelSide === "left" ? 1 : -1;
      traceBoilLine(ctx, sideX, p, sideX + dir * tickLen, p, frame, seed + tickIdx * 3, 0.95);
    } else {
      const sideY = labelSide === "top" ? -halfThk : halfThk;
      const dir = labelSide === "top" ? 1 : -1;
      traceBoilLine(ctx, p, sideY, p, sideY + dir * tickLen, frame, seed + tickIdx * 3, 0.95);
    }
    ctx.stroke();
  }
  ctx.restore();

  // 4) 尺身手绘墨边外框（每 3 帧 1.2px line boil）
  ctx.strokeStyle = rgba(inkMotif ? pal.ink : pal.tea, inkMotif ? 0.45 : 0.68);
  ctx.lineWidth = inkMotif ? 2.6 : 3.2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  traceBoilRect(ctx, x0, y0, w, h, frame, seed + 5, 1.25);
  ctx.stroke();

  // 5) 7% 竹青绿参考线（毛笔笔触 + 每 3 帧 line boil）
  if (show7) {
    const ext = 14 + emphasize7 * 12;
    const pts: Pt[] = isVert
      ? [
          { x: -halfThk - ext, y: p7 },
          { x: halfThk + ext, y: p7 },
        ]
      : [
          { x: p7, y: -halfThk - ext },
          { x: p7, y: halfThk + ext },
        ];
    drawBoilBrushStroke(ctx, pts, rev, frame, {
      width: 4.5 + emphasize7 * 2.5,
      color: pal.bamboo,
      seed: seed + 11,
      tail: 0.12,
      jitter: 0.14,
      boilAmp: 1.35,
    });
    if (showLabels) {
      const fs = 36 * fontScale;
      if (isVert) {
        const tx = labelSide === "left" ? -halfThk - ext - 14 : halfThk + ext + 14;
        fillText(ctx, label7, tx, p7, fs, {
          color: pal.bamboo,
          weight: 800,
          font: SONG,
          align: labelSide === "left" ? "right" : "left",
        });
      } else {
        const ty = labelSide === "top" ? -halfThk - ext - 26 : halfThk + ext + 30;
        fillText(ctx, label7, p7, ty, fs, {
          color: pal.bamboo,
          weight: 800,
          font: SONG,
        });
      }
    }
  }

  // 6) 8.5% 朱砂红上限线（全片核心识别符号，带 3 帧 line boil）
  if (show85) {
    const ext = 18 + emphasize85 * 18;
    const pts: Pt[] = isVert
      ? [
          { x: -halfThk - ext, y: p85 },
          { x: halfThk + ext, y: p85 },
        ]
      : [
          { x: p85, y: -halfThk - ext },
          { x: p85, y: halfThk + ext },
        ];
    drawBoilBrushStroke(ctx, pts, rev, frame, {
      width: 6.5 + emphasize85 * 3.5,
      color: pal.cinnabar,
      seed: seed + 23,
      tail: 0.1,
      jitter: 0.16,
      boilAmp: 1.45,
    });
    if (showLabels) {
      const fs = (38 + emphasize85 * 6) * fontScale;
      if (isVert) {
        const tx = labelSide === "left" ? -halfThk - ext - 14 : halfThk + ext + 14;
        fillText(ctx, label85, tx, p85, fs, {
          color: pal.cinnabar,
          weight: 900,
          font: SONG,
          align: labelSide === "left" ? "right" : "left",
        });
      } else {
        const ty = labelSide === "top" ? -halfThk - ext - 26 : halfThk + ext + 32;
        fillText(ctx, label85, p85, ty, fs, {
          color: pal.cinnabar,
          weight: 900,
          font: SONG,
        });
      }
    }
  }

  // 7) 额外小标注（如晒青 9%）
  if (extraMark && extraMark.alpha > 0.01) {
    const pe = posOf(extraMark.value);
    ctx.save();
    ctx.globalAlpha *= extraMark.alpha;
    ctx.strokeStyle = rgba(pal.inkSoft, 0.55);
    ctx.lineWidth = 2.4;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    if (isVert) {
      ctx.moveTo(-halfThk - 10, pe);
      ctx.lineTo(halfThk + 12, pe);
    } else {
      ctx.moveTo(pe, -halfThk - 10);
      ctx.lineTo(pe, halfThk + 12);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    const fs = 28 * fontScale;
    if (isVert) {
      // 放在主标签的另一侧，避免和贴得很近的 8.5% 标签撞在一起
      const tx = labelSide === "left" ? halfThk + 22 : -halfThk - 22;
      fillText(ctx, extraMark.text, tx, pe, fs, {
        color: pal.inkSoft,
        weight: 600,
        font: KAI,
        align: labelSide === "left" ? "left" : "right",
      });
    } else {
      const ty = labelSide === "top" ? -halfThk - 26 : halfThk + 28;
      fillText(ctx, extraMark.text, pe, ty, fs, {
        color: pal.inkSoft,
        weight: 600,
        font: KAI,
      });
    }
    ctx.restore();
  }

  // 8) 指针三角标（随数值滑动，过 8.5% 变朱砂红，勾线带 3 帧抖动，数值牌带跟随滞后且字不抖）
  if (value !== undefined) {
    const pv = posOf(value);
    const pColor = value > 8.5 ? pal.cinnabar : value <= 7.05 ? pal.bamboo : pal.tea;
    const tri = 18 + alert * 4;
    const bd = boilOffset(frame, seed + 71, 0, 1.15);
    ctx.save();
    ctx.fillStyle = pColor;
    ctx.strokeStyle = pal.paper;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    if (isVert) {
      const s = labelSide === "left" ? 1 : -1;
      const tipX = s * (halfThk + 4) + bd.x;
      ctx.moveTo(tipX, pv + bd.y);
      ctx.lineTo(tipX + s * tri * 1.35, pv - tri * 0.72 + bd.y * 0.5);
      ctx.lineTo(tipX + s * tri * 1.35, pv + tri * 0.72 + bd.y * 0.5);
    } else {
      const s = labelSide === "top" ? 1 : -1;
      const tipY = s * (halfThk + 4) + bd.y;
      ctx.moveTo(pv + bd.x, tipY);
      ctx.lineTo(pv - tri * 0.72 + bd.x * 0.5, tipY + s * tri * 1.35);
      ctx.lineTo(pv + tri * 0.72 + bd.x * 0.5, tipY + s * tri * 1.35);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 刻度内细游标横线（带 3 帧微抖）
    ctx.strokeStyle = pColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (isVert) {
      traceBoilLine(ctx, -halfThk + 3, pv, halfThk - 3, pv, frame, seed + 79, 1.0);
    } else {
      traceBoilLine(ctx, pv, -halfThk + 3, pv, halfThk - 3, frame, seed + 79, 1.0);
    }
    ctx.stroke();

    if (valueText) {
      const fs = 36 * fontScale;
      if (isVert) {
        const s = labelSide === "left" ? 1 : -1;
        fillText(ctx, valueText, s * (halfThk + tri * 1.65 + 10), pv + tagLag, fs, {
          color: pColor,
          weight: 900,
          font: SONG,
          align: s > 0 ? "left" : "right",
        });
      } else {
        const s = labelSide === "top" ? 1 : -1;
        fillText(ctx, valueText, pv + tagLag, s * (halfThk + tri * 1.7 + 20), fs, {
          color: pColor,
          weight: 900,
          font: SONG,
        });
      }
    }
    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 3. 国标文件 / 检测报告纸页 + 放大镜（B2 / B7）
// ============================================================================

export type StandardDocOpts = {
  /** 顶部大标题（如「白茶国标」「检测报告」） */
  title: string;
  /** 关键小字（如「GB/T 22291—2017」），可省略 */
  code?: string;
  /** 右上角红章小字（如「国标」/「检验」） */
  badge?: string;
  /** 字体缩放 */
  fontScale?: number;
  /** 当前帧号：驱动纸页外框与红头横线的 3 帧手绘抖动（纸上文字不抖） */
  frame?: number;
  /** 报告纸内部自定义内容回调（原点在纸中心） */
  body?: () => void;
};

export function drawStandardDoc(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: StandardDocOpts,
) {
  const { title, code, badge, fontScale = 1, frame = 0, body } = opts;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const fold = 42;

  ctx.save();
  const sheetPath = () => {
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + w - fold, y0);
    ctx.lineTo(x0 + w, y0 + fold);
    ctx.lineTo(x0 + w, y0 + h);
    ctx.lineTo(x0, y0 + h);
    ctx.closePath();
  };

  softShadow(ctx, sheetPath, { blur: 28, dx: 12, dy: 18, alpha: 0.2 });

  // 温润档案宣纸渐变
  const g = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
  g.addColorStop(0, "#fbf7ee");
  g.addColorStop(0.65, "#f3ebd9");
  g.addColorStop(1, "#e6dac2");
  ctx.fillStyle = g;
  ctx.beginPath();
  sheetPath();
  ctx.fill();

  // 纸页内框手绘墨线（带 3 帧 line boil）
  ctx.strokeStyle = rgba(pal.tea, 0.48);
  ctx.lineWidth = 3;
  ctx.beginPath();
  traceBoilLine(ctx, x0, y0, x0 + w - fold, y0, frame, 201, 1.3);
  traceBoilLine(ctx, x0 + w - fold, y0, x0 + w, y0 + fold, frame, 202, 1.1);
  traceBoilLine(ctx, x0 + w, y0 + fold, x0 + w, y0 + h, frame, 203, 1.3);
  traceBoilLine(ctx, x0 + w, y0 + h, x0, y0 + h, frame, 204, 1.3);
  traceBoilLine(ctx, x0, y0 + h, x0, y0, frame, 205, 1.3);
  ctx.stroke();

  // 右上折角
  ctx.fillStyle = "#dfd2b8";
  ctx.beginPath();
  ctx.moveTo(x0 + w - fold, y0);
  ctx.lineTo(x0 + w - fold, y0 + fold);
  ctx.lineTo(x0 + w, y0 + fold);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(pal.tea, 0.35);
  ctx.lineWidth = 2;
  ctx.stroke();

  // 顶部朱砂双横线（红头文件质感 + 3 帧手绘抖动）
  const lineY = y0 + 168;
  ctx.strokeStyle = rgba(pal.cinnabar, 0.74);
  ctx.lineWidth = 4;
  ctx.beginPath();
  traceBoilLine(ctx, x0 + 44, lineY, x0 + w - 44, lineY, frame, 206, 1.2);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  traceBoilLine(ctx, x0 + 44, lineY + 8, x0 + w - 44, lineY + 8, frame, 207, 1.0);
  ctx.stroke();

  // 顶部标题与标准编号（文字本身不抖）
  fillText(ctx, title, 0, y0 + 82, 54 * fontScale, {
    color: pal.ink,
    weight: 900,
    font: SONG,
  });
  if (code) {
    fillText(ctx, code, 0, y0 + 136, 28 * fontScale, {
      color: pal.inkSoft,
      weight: 600,
      font: HEI,
    });
  }

  // 右上角克制圆章暗印
  if (badge) {
    ctx.save();
    ctx.translate(x0 + w - 104, y0 + 96);
    ctx.rotate(-0.14);
    ctx.strokeStyle = rgba(pal.cinnabar, 0.55);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, TAU * 0.9995);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, TAU * 0.9995);
    ctx.stroke();
    fillText(ctx, badge, 0, 0, 26 * fontScale, {
      color: rgba(pal.cinnabar, 0.75),
      weight: 700,
      font: SONG,
      fixed: true,
    });
    ctx.restore();
  }

  // 自定义内文
  if (body) {
    ctx.save();
    body();
    ctx.restore();
  }

  ctx.restore();
}

/** 手绘茶木铜框放大镜（原点在镜片中心，外框带 3 帧 line boil） */
export function drawMagnifier(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  radius: number,
  opts: { angle?: number; frame?: number } = {},
) {
  const { angle = 0.78, frame = 0 } = opts;
  const bd = boilOffset(frame, 311, 0, 1.3);
  ctx.save();

  // 手柄
  const hx0 = Math.cos(angle) * (radius + 6);
  const hy0 = Math.sin(angle) * (radius + 6);
  const hx1 = Math.cos(angle) * (radius + radius * 1.18);
  const hy1 = Math.sin(angle) * (radius + radius * 1.18);

  softShadow(
    ctx,
    () => {
      ctx.arc(0, 0, radius + 10, 0, TAU * 0.9995);
    },
    { blur: 18, dx: 8, dy: 12, alpha: 0.16 },
  );

  ctx.strokeStyle = pal.tea;
  ctx.lineWidth = radius * 0.24;
  ctx.lineCap = "round";
  ctx.beginPath();
  traceBoilLine(ctx, hx0, hy0, hx1, hy1, frame, 312, 1.2);
  ctx.stroke();

  // 手柄高光线
  ctx.strokeStyle = rgba("#e4c794", 0.55);
  ctx.lineWidth = radius * 0.06;
  ctx.beginPath();
  ctx.moveTo(hx0 + Math.cos(angle) * 10, hy0 + Math.sin(angle) * 10 - 3);
  ctx.lineTo(hx1 - Math.cos(angle) * 12, hy1 - Math.sin(angle) * 12 - 3);
  ctx.stroke();

  // 镜片微亮玻璃底
  const glassG = ctx.createRadialGradient(
    -radius * 0.28,
    -radius * 0.28,
    radius * 0.1,
    0,
    0,
    radius,
  );
  glassG.addColorStop(0, rgba("#ffffff", 0.42));
  glassG.addColorStop(0.65, rgba("#eef6f2", 0.14));
  glassG.addColorStop(1, rgba(pal.bamboo, 0.12));
  ctx.fillStyle = glassG;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU * 0.9995);
  ctx.fill();

  // 镜片斜高光弧
  ctx.strokeStyle = rgba("#ffffff", 0.68);
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.74, -Math.PI * 0.85, -Math.PI * 0.48);
  ctx.stroke();

  // 铜褐外框 + 外墨线（3 帧微抖）
  ctx.strokeStyle = mixHex(pal.tea, "#a97d42", 0.4);
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.arc(bd.x * 0.5, bd.y * 0.5, radius, 0, TAU * 0.9995);
  ctx.stroke();

  ctx.strokeStyle = rgba(pal.ink, 0.48);
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(bd.x, bd.y, radius + 5.5, 0, TAU * 0.9995);
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// 4. 散茶蓬松叶堆 + 水汽滴 + 梅雨丝 + 废茶篓（B4 / B5 / B6）
// ============================================================================

export type LooseTeaOpts = {
  /** 蓬松张开度 0..1 */
  fluff?: number;
  /** 受潮暗沉程度 0..1 */
  damp?: number;
  seed?: number;
};

/** 手绘白茶散茶堆（蓬松、大叶片间隙、银毫灰绿茶褐层次） */
export function drawLooseTeaPile(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  rx: number,
  ry: number,
  opts: LooseTeaOpts = {},
) {
  const { fluff = 0.5, damp = 0, seed = 61 } = opts;
  const spread = 1 + fluff * 0.18;
  const d = clamp01(damp);

  ctx.save();

  // 底层柔和阴影
  softShadow(
    ctx,
    () => {
      ctx.ellipse(0, ry * 0.35, rx * spread * 0.92, ry * 0.48, 0, 0, TAU * 0.9995);
    },
    { blur: 24, dx: 6, dy: 14, alpha: 0.18 },
  );

  // 蓬松叶片层（确定性分布：大大小小舒展卷曲的白茶干叶 + 明显空隙）
  const rr = rng(seed * 17 + 3);
  const colors = [
    mixHex("#7f8c5c", "#4d5242", d * 0.65),
    mixHex("#9aa37a", "#565a49", d * 0.65),
    mixHex("#6c6244", "#433d31", d * 0.6),
    mixHex("#b8b398", "#6f6e60", d * 0.65), // 银毫面
    mixHex("#5b6b45", "#3b4233", d * 0.65),
  ];

  const count = 46;
  for (let i = 0; i < count; i++) {
    const u = rr();
    const v = rr();
    const ang = u * TAU;
    const dist = Math.pow(v, 0.62);
    const lx = Math.cos(ang) * rx * spread * dist * 0.92;
    const ly = Math.sin(ang) * ry * spread * dist * 0.84 - (1 - dist) * ry * 0.18;
    const rot = (rr() - 0.5) * Math.PI * 1.6;
    const leafLen = 28 + rr() * 34;
    const leafWid = 8 + rr() * 11;
    const col = colors[Math.floor(rr() * colors.length)];

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);

    // 叶片微弯轮廓
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-leafLen * 0.5, 0);
    ctx.quadraticCurveTo(0, -leafWid, leafLen * 0.5, -leafWid * 0.15);
    ctx.quadraticCurveTo(0, leafWid * 0.78, -leafLen * 0.5, 0);
    ctx.closePath();
    ctx.fill();

    // 叶脉细线
    ctx.strokeStyle = rgba("#2f2a20", 0.32);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-leafLen * 0.42, 0);
    ctx.quadraticCurveTo(0, -leafWid * 0.12, leafLen * 0.38, -leafWid * 0.1);
    ctx.stroke();

    // 干白茶银毫微亮边（受潮时减弱）
    if (i % 3 === 0 && d < 0.85) {
      ctx.strokeStyle = rgba("#f2efe4", 0.48 * (1 - d * 0.7));
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-leafLen * 0.35, -leafWid * 0.25);
      ctx.quadraticCurveTo(0, -leafWid * 0.75, leafLen * 0.32, -leafWid * 0.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 蓬松时画出几道外围轻淡虚弧，直观传达「蓬松、缝隙大、接触面广」
  if (fluff > 0.2 && d < 0.5) {
    const fa = clamp01((fluff - 0.2) * 1.4) * (1 - d * 2);
    ctx.strokeStyle = rgba(pal.tea, 0.24 * fa);
    ctx.lineWidth = 2.4;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.ellipse(0, -ry * 0.04, rx * spread * 1.06, ry * spread * 0.98, 0, 0, TAU * 0.9995);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 受潮暗斑与微红预警圈
  if (d > 0.15) {
    const g = ctx.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx * spread);
    g.addColorStop(0, rgba("#445044", 0.28 * d));
    g.addColorStop(0.75, rgba("#5a5a48", 0.14 * d));
    g.addColorStop(1, rgba(pal.cinnabar, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * spread, ry * spread, 0, 0, TAU * 0.9995);
    ctx.fill();
  }

  ctx.restore();
}

/** 单个水墨水滴（原点在中心） */
export function drawWaterDrop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color = "#5b899e",
  alpha = 0.82,
) {
  if (alpha <= 0.01 || r <= 0.5) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.35);
  ctx.quadraticCurveTo(r * 1.05, r * 0.1, 0, r);
  ctx.quadraticCurveTo(-r * 1.05, r * 0.1, 0, -r * 1.35);
  ctx.closePath();
  ctx.fill();

  // 左上微高光
  ctx.fillStyle = rgba("#ffffff", 0.55);
  ctx.beginPath();
  ctx.ellipse(-r * 0.26, r * 0.12, r * 0.18, r * 0.34, -0.35, 0, TAU * 0.9995);
  ctx.fill();
  ctx.restore();
}

/** 梅雨斜雨丝（确定性动画，frame 驱动下落，可传 stillFrame 冻结末尾） */
export function drawRainStreaks(
  ctx: CanvasRenderingContext2D,
  frame: number,
  bounds: { x: number; y: number; w: number; h: number },
  strength: number,
  seed = 51,
) {
  const s = clamp01(strength);
  if (s <= 0.01) return;
  ctx.save();
  ctx.lineCap = "round";
  const count = 24;
  for (let i = 0; i < count; i++) {
    const h1 = hash01(i, seed);
    const h2 = hash01(i, seed + 13);
    const speed = 0.022 + h2 * 0.018;
    const ph = (((frame * speed + h1) % 1) + 1) % 1;
    const x = bounds.x + hash01(i, seed + 29) * bounds.w - ph * 56;
    const y = bounds.y + ph * bounds.h;
    const len = 32 + h2 * 34;
    const a = Math.sin(ph * Math.PI) * s * (0.42 + h1 * 0.35);
    ctx.strokeStyle = rgba("#58869c", a);
    ctx.lineWidth = 2.6 + h1 * 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - len * 0.26, y + len);
    ctx.stroke();
  }
  ctx.restore();
}

/** 克制极简的竹编废茶篓（原点在篓中心，用于 B6「整批扔掉」，外框带 3 帧 line boil） */
export function drawTrashBin(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  frame = 0,
) {
  const topW = w;
  const botW = w * 0.72;
  const y0 = -h / 2;
  const y1 = h / 2;

  ctx.save();
  const body = () => {
    ctx.moveTo(-topW / 2, y0);
    ctx.lineTo(topW / 2, y0);
    ctx.lineTo(botW / 2, y1);
    ctx.lineTo(-botW / 2, y1);
    ctx.closePath();
  };

  softShadow(ctx, body, { blur: 20, dx: 8, dy: 14, alpha: 0.16 });

  const g = ctx.createLinearGradient(-topW / 2, 0, topW / 2, 0);
  g.addColorStop(0, "#cbb796");
  g.addColorStop(0.45, "#dfd0b4");
  g.addColorStop(1, "#ae9774");
  ctx.fillStyle = g;
  ctx.beginPath();
  body();
  ctx.fill();

  // 竹编斜纹
  ctx.save();
  ctx.beginPath();
  body();
  ctx.clip();
  ctx.strokeStyle = rgba(pal.tea, 0.26);
  ctx.lineWidth = 2.4;
  for (let yy = y0 + 28; yy < y1; yy += 30) {
    ctx.beginPath();
    traceBoilLine(ctx, -topW / 2, yy, topW / 2, yy, frame, 400 + yy, 1.0);
    ctx.stroke();
  }
  for (let xx = -topW * 0.4; xx <= topW * 0.4; xx += 36) {
    ctx.beginPath();
    traceBoilLine(ctx, xx, y0, xx * 0.74, y1, frame, 500 + Math.round(xx), 1.0);
    ctx.stroke();
  }
  ctx.restore();

  // 篓口暗椭圆 + 手绘边框（3 帧微抖）
  ctx.fillStyle = "#6c5740";
  ctx.beginPath();
  ctx.ellipse(0, y0, topW / 2, 18, 0, 0, TAU * 0.9995);
  ctx.fill();

  const bd = boilOffset(frame, 419, 0, 1.25);
  ctx.strokeStyle = rgba(pal.tea, 0.74);
  ctx.lineWidth = 4;
  ctx.beginPath();
  traceBoilLine(ctx, -topW / 2, y0, -botW / 2, y1, frame, 421, 1.35);
  traceBoilLine(ctx, -botW / 2, y1, botW / 2, y1, frame, 422, 1.35);
  traceBoilLine(ctx, botW / 2, y1, topW / 2, y0, frame, 423, 1.35);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(bd.x * 0.6, y0 + bd.y * 0.6, topW / 2, 18, 0, 0, TAU * 0.9995);
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// 5. 加厚 PE 袋 + 存茶纸箱/茶柜 + 茶壶茶杯（B4 / B5 / B8）
// ============================================================================

export type PeBagOpts = {
  mode?: "flat" | "ziplock";
  /** 封口松动漏气 0..1 */
  leak?: number;
  thickEdge?: number;
  inside?: () => void;
  frame?: number;
};

export function drawPeBag(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: PeBagOpts = {},
) {
  const { mode = "ziplock", leak = 0, thickEdge = 0.5, inside, frame = 0 } = opts;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const r = 16;

  ctx.save();
  softShadow(ctx, () => ctx.roundRect(x0, y0, w, h, r), {
    blur: 20,
    dx: 8,
    dy: 14,
    alpha: 0.14,
  });

  ctx.fillStyle = rgba("#ffffff", pal.dark ? 0.14 : 0.34);
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, r);
  ctx.fill();

  if (inside) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x0 + 8, y0 + 8, w - 16, h - 16, r - 4);
    ctx.clip();
    inside();
    ctx.restore();
  }

  // 半透明 PE 光泽膜
  const sheen = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
  sheen.addColorStop(0, rgba("#ffffff", 0.4));
  sheen.addColorStop(0.32, rgba("#f4f9f6", 0.1));
  sheen.addColorStop(0.56, rgba("#ffffff", 0.28));
  sheen.addColorStop(1, rgba("#ffffff", 0.18));
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, r);
  ctx.fill();

  ctx.strokeStyle = rgba(pal.bamboo, 0.6 + thickEdge * 0.2);
  ctx.lineWidth = 2.8 + thickEdge * 1.4;
  ctx.beginPath();
  traceBoilRect(ctx, x0, y0, w, h, frame, 511, 1.3);
  ctx.stroke();

  if (mode === "ziplock") {
    const zy = y0 + 50;
    const gap = leak * 15;
    const zb = boilOffset(frame, 517, 0, 1.15);
    const railColor = leak > 0.1 ? pal.cinnabar : mixHex(pal.tea, "#7b8c98", 0.5);
    ctx.strokeStyle = railColor;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0 + 14 + zb.x * 0.5, zy - gap * 0.35 + zb.y * 0.5);
    ctx.quadraticCurveTo(
      zb.x,
      zy - gap * 1.45 + zb.y,
      x0 + w - 14 + zb.x * 0.5,
      zy - gap * 0.35 - zb.y * 0.5,
    );
    ctx.stroke();
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(x0 + 14 - zb.x * 0.5, zy + 9 + gap * 0.35 - zb.y * 0.5);
    ctx.quadraticCurveTo(
      -zb.x,
      zy + 9 + gap * 1.35 + zb.y,
      x0 + w - 14 - zb.x * 0.5,
      zy + 9 + gap * 0.35 + zb.y * 0.5,
    );
    ctx.stroke();

    // 缝隙漏潮气进入袋内
    if (leak > 0.08) {
      ctx.save();
      ctx.fillStyle = rgba("#3a1b16", 0.22 * leak);
      ctx.beginPath();
      ctx.ellipse(0, zy + 4, w * 0.26 * leak, Math.max(2, gap * 0.9), 0, 0, TAU * 0.9995);
      ctx.fill();

      for (let i = -1; i <= 1; i++) {
        const bx = i * (w * 0.14);
        const ph = (((frame * 0.048 + (i + 1) * 0.31) % 1) + 1) % 1;
        const dropY = zy + 10 + ph * 96;
        const a = Math.sin(ph * Math.PI) * leak;
        ctx.strokeStyle = rgba("#58869c", 0.72 * a);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx, dropY - 26);
        ctx.quadraticCurveTo(bx + (i === 0 ? 10 : -i * 12), dropY - 8, bx, dropY + 12);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

/** 俯视 / 正视存茶纸箱（带箱盖合拢与「工」字封箱，B4 / B8 用，外框带 3 帧 line boil） */
export function drawCorrugatedBoxTop(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: { close?: number; hTape?: number; inside?: () => void; frame?: number } = {},
) {
  const { close = 0, hTape = 0, inside, frame = 0 } = opts;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const wall = 20;

  ctx.save();
  softShadow(ctx, () => ctx.roundRect(x0, y0, w, h, 8), {
    blur: 24,
    dx: 10,
    dy: 16,
    alpha: 0.22,
  });

  ctx.fillStyle = "#8d6a47";
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, 8);
  ctx.fill();

  if (inside && close < 0.99) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 + wall, y0 + wall, w - wall * 2, h - wall * 2);
    ctx.clip();
    inside();
    ctx.restore();
  }

  ctx.strokeStyle = "#b99264";
  ctx.lineWidth = wall;
  ctx.strokeRect(x0 + wall / 2, y0 + wall / 2, w - wall, h - wall);

  const flapW = (w / 2) * (0.24 + 0.76 * close);
  if (close > 0.01) {
    for (const side of [-1, 1] as const) {
      const fx = side === -1 ? x0 : x0 + w - flapW;
      const g = ctx.createLinearGradient(fx, y0, fx + flapW, y0 + h);
      g.addColorStop(0, side === -1 ? "#d3b286" : "#c7a374");
      g.addColorStop(1, side === -1 ? "#bd9768" : "#b08859");
      ctx.fillStyle = g;
      ctx.fillRect(fx, y0, flapW, h);
      ctx.strokeStyle = rgba("#5e4024", 0.45);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      traceBoilRect(ctx, fx, y0, flapW, h, frame, side === -1 ? 541 : 542, 1.0);
      ctx.stroke();
    }
  }

  if (hTape > 0.01) {
    const tapeColor = rgba("#e4be78", 0.82);
    const tw = Math.min(46, w * 0.14);
    const pMid = clamp01(hTape * 2);
    const pEdge = clamp01((hTape - 0.5) * 2);
    ctx.fillStyle = tapeColor;
    if (pMid > 0) ctx.fillRect(-tw / 2, y0 - 4, tw, (h + 8) * pMid);
    if (pEdge > 0) {
      ctx.fillRect(x0 - 4, y0 - 4, (w + 8) * pEdge, tw * 0.75);
      ctx.fillRect(x0 - 4, y0 + h - tw * 0.75 + 4, (w + 8) * pEdge, tw * 0.75);
    }
  }

  ctx.strokeStyle = rgba(pal.ink, 0.46);
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  traceBoilRect(ctx, x0, y0, w, h, frame, 549, 1.35);
  ctx.stroke();
  ctx.restore();
}

/** 手绘国风陶壶 + 茶杯 + 温润茶烟（原点在整体视觉中心，B8「趁早先喝掉」） */
export function drawTeapotAndCup(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  scale = 1,
  opts: { frame?: number; steam?: number } = {},
) {
  const { frame = 0, steam = 1 } = opts;
  ctx.save();
  ctx.scale(scale, scale);

  // 柔和茶盘底影
  softShadow(
    ctx,
    () => {
      ctx.ellipse(-28, 66, 108, 28, 0, 0, TAU * 0.9995);
      ctx.ellipse(98, 72, 54, 18, 0, 0, TAU * 0.9995);
    },
    { blur: 18, dx: 6, dy: 10, alpha: 0.18 },
  );

  // 1) 紫砂/暖陶茶壶（左偏 -28）
  ctx.save();
  ctx.translate(-28, 10);
  // 壶把（右侧耳形）
  ctx.strokeStyle = "#7e5138";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(76, 6, 36, -Math.PI * 0.42, Math.PI * 0.48);
  ctx.stroke();
  ctx.strokeStyle = rgba(pal.ink, 0.42);
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(76, 6, 43, -Math.PI * 0.42, Math.PI * 0.48);
  ctx.stroke();

  // 壶嘴（左翘流嘴）
  ctx.fillStyle = "#8a5a3e";
  ctx.beginPath();
  ctx.moveTo(-72, 18);
  ctx.quadraticCurveTo(-116, 4, -124, -34);
  ctx.lineTo(-104, -36);
  ctx.quadraticCurveTo(-96, -8, -68, -6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(pal.ink, 0.42);
  ctx.lineWidth = 2.6;
  ctx.stroke();

  // 壶身（勾线带 3 帧微抖）
  const pBoil = boilOffset(frame, 611, 0, 1.25);
  const potG = ctx.createLinearGradient(-86, -40, 86, 62);
  potG.addColorStop(0, "#b4815f");
  potG.addColorStop(0.35, "#9c6748");
  potG.addColorStop(0.85, "#6f442d");
  potG.addColorStop(1, "#85563c");
  ctx.fillStyle = potG;
  ctx.beginPath();
  ctx.ellipse(0, 14, 86, 58, 0, 0, TAU * 0.9995);
  ctx.fill();
  ctx.strokeStyle = rgba(pal.ink, 0.48);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(pBoil.x, 14 + pBoil.y, 86, 58, 0, 0, TAU * 0.9995);
  ctx.stroke();

  // 壶身左上暖高光
  ctx.fillStyle = rgba("#fff6e8", 0.28);
  ctx.beginPath();
  ctx.ellipse(-34, -8, 22, 12, -0.45, 0, TAU * 0.9995);
  ctx.fill();

  // 壶盖与壶钮
  ctx.fillStyle = "#a77454";
  ctx.beginPath();
  ctx.ellipse(0, -40, 48, 15, 0, 0, TAU * 0.9995);
  ctx.fill();
  ctx.strokeStyle = rgba(pal.ink, 0.45);
  ctx.lineWidth = 2.6;
  ctx.stroke();

  ctx.fillStyle = "#8d5b3e";
  ctx.beginPath();
  ctx.arc(0, -56, 13, 0, TAU * 0.9995);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 2) 白瓷品茗杯（右偏 +98）
  ctx.save();
  ctx.translate(98, 36);
  // 琥珀白茶汤面
  ctx.fillStyle = "#d9a959";
  ctx.beginPath();
  ctx.ellipse(0, -24, 44, 13, 0, 0, TAU * 0.9995);
  ctx.fill();

  // 杯身
  const cupG = ctx.createLinearGradient(-48, -24, 48, 38);
  cupG.addColorStop(0, "#fcf9f2");
  cupG.addColorStop(0.65, "#ece3d3");
  cupG.addColorStop(1, "#d5c7b0");
  ctx.fillStyle = cupG;
  ctx.beginPath();
  ctx.moveTo(-46, -24);
  ctx.quadraticCurveTo(-44, 34, -22, 42);
  ctx.lineTo(22, 42);
  ctx.quadraticCurveTo(44, 34, 46, -24);
  ctx.ellipse(0, -24, 46, 13, 0, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = rgba(pal.tea, 0.52);
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(-46, -24);
  ctx.quadraticCurveTo(-44, 34, -22, 42);
  ctx.lineTo(22, 42);
  ctx.quadraticCurveTo(44, 34, 46, -24);
  ctx.stroke();

  // 杯口
  ctx.beginPath();
  ctx.ellipse(0, -24, 46, 13, 0, 0, TAU * 0.9995);
  ctx.stroke();

  // 柔和茶汤热气
  if (steam > 0.02) {
    drawSteam(ctx, steamWisps(frame, 3, { x: 0, y: -32, w: 48 }, 83, 120), "#d9a959", 0.95 * steam);
  }
  ctx.restore();

  ctx.restore();
}

// ============================================================================
// 6. B10 互动投票简笔示意：靠手感（指捏干茶） / 靠鼻子（闻香示意）
// ============================================================================

/** 2D 国风手绘线稿 + 淡彩：大拇指与食指轻捻一片白茶干叶（原点在中心，线条带 3 帧 line boil） */
export function drawHandGesture(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  scale = 1,
  opts: { pinch?: number; frame?: number } = {},
) {
  const { pinch = 0, frame = 0 } = opts;
  const ink = mixHex(pal.ink, "#453425", 0.45);
  const skin = "#f2dbc0";
  const skinShade = "#dfc09d";
  const hb = boilOffset(frame, 701, 0, 1.35);

  ctx.save();
  ctx.scale(scale, scale);

  // 柔和圆底光晕（极淡宣纸气韵，非圆角卡片）
  const halo = ctx.createRadialGradient(0, 10, 12, 0, 10, 150);
  halo.addColorStop(0, rgba(pal.bamboo, 0.1));
  halo.addColorStop(1, rgba(pal.bamboo, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 10, 150, 0, TAU * 0.9995);
  ctx.fill();

  ctx.translate(hb.x * 0.65, hb.y * 0.65);
  const pOff = pinch * 7;

  // 被指尖轻捻的一片白茶干叶（竹青灰绿）
  ctx.save();
  ctx.translate(-32, -26);
  ctx.rotate(-0.35 + pinch * 0.14);
  ctx.fillStyle = pal.bamboo;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-48, 8);
  ctx.quadraticCurveTo(-4, -28, 48, -6);
  ctx.quadraticCurveTo(6, 22, -48, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-40, 6);
  ctx.quadraticCurveTo(0, -6, 38, -5);
  ctx.stroke();
  ctx.restore();

  // 手掌与蜷起三指
  ctx.fillStyle = skinShade;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 4.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(96, 118);
  ctx.quadraticCurveTo(118, 42, 82, -16);
  ctx.quadraticCurveTo(56, -54, 14, -52);
  ctx.quadraticCurveTo(10, 14, 18, 72);
  ctx.quadraticCurveTo(32, 118, 96, 118);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 食指（从右上弯向左上指尖，向下轻捻）
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(64, -22);
  ctx.quadraticCurveTo(28, -94, -24, -68 + pOff);
  ctx.quadraticCurveTo(-52, -52 + pOff, -34, -30 + pOff);
  ctx.quadraticCurveTo(-4, -34 + pOff, 26, -12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 拇指（从下向上轻托茶叶）
  ctx.beginPath();
  ctx.moveTo(32, 86);
  ctx.quadraticCurveTo(-24, 58, -42, 6 - pOff);
  ctx.quadraticCurveTo(-48, -18 - pOff, -20, -14 - pOff);
  ctx.quadraticCurveTo(12, 8, 52, 48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 轻触的脆感小波纹弧（示意「手感脆不脆」）
  ctx.strokeStyle = rgba(pal.bamboo, 0.72);
  ctx.lineWidth = 3.2;
  for (let i = 0; i < 2; i++) {
    const rr = 22 + i * 16 + pinch * 4;
    ctx.beginPath();
    ctx.arc(-44, -26, rr, Math.PI * 0.72, Math.PI * 1.32);
    ctx.stroke();
  }

  ctx.restore();
}

/** 2D 国风手绘线稿 + 淡彩：极简侧脸鼻廓 + 缕缕清香弧线（原点在中心） */
export function drawNoseProfile(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  scale = 1,
  opts: { frame?: number; sniff?: number } = {},
) {
  const { frame = 0, sniff = 0 } = opts;
  const ink = mixHex(pal.ink, "#453425", 0.45);
  const skin = "#f2dbc0";

  ctx.save();
  ctx.scale(scale, scale);

  // 柔和暖晕
  const halo = ctx.createRadialGradient(0, 10, 12, 0, 10, 150);
  halo.addColorStop(0, rgba(pal.cinnabar, 0.08));
  halo.addColorStop(1, rgba(pal.cinnabar, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 10, 150, 0, TAU * 0.9995);
  ctx.fill();

  // 极简国风侧脸剪影（额 → 鼻梁 → 鼻尖 → 鼻翼 → 嘴唇微廓，面向左侧茶香）
  ctx.save();
  ctx.translate(22, -4 - sniff * 4);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(46, -108);
  ctx.quadraticCurveTo(8, -94, -4, -64);
  ctx.quadraticCurveTo(-18, -28, -46, 12);
  ctx.quadraticCurveTo(-56, 28, -36, 36);
  ctx.lineTo(-10, 38);
  ctx.quadraticCurveTo(-14, 58, -4, 72);
  ctx.quadraticCurveTo(-10, 92, 16, 104);
  ctx.lineTo(74, 104);
  ctx.quadraticCurveTo(86, 2, 46, -108);
  ctx.closePath();
  ctx.fill();

  // 主轮廓墨线（只勾画正面呼吸侧，带 3 帧 line boil）
  const nb = boilOffset(frame, 731, 0, 1.35);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 4.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(16 + nb.x * 0.5, -96 + nb.y * 0.5);
  ctx.quadraticCurveTo(nb.x, -68 + nb.y, -6 + nb.x, -46 + nb.y);
  ctx.quadraticCurveTo(-20 - nb.x * 0.6, -14 + nb.y, -46 + nb.x, 12 + nb.y * 0.6);
  ctx.quadraticCurveTo(-56 + nb.x, 28 - nb.y * 0.5, -36 + nb.x * 0.5, 36 + nb.y);
  ctx.quadraticCurveTo(-20, 40 + nb.y * 0.5, -10, 36);
  ctx.stroke();

  // 鼻翼弧线
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.arc(-14, 24, 13, 0.35, Math.PI * 1.15);
  ctx.stroke();

  // 淡眉毛一笔 + 闭目细闻的弯眼（温润雅致，不是小正）
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(2, -56);
  ctx.quadraticCurveTo(18, -62, 32, -54);
  ctx.moveTo(4, -36);
  ctx.quadraticCurveTo(16, -28, 28, -35);
  ctx.stroke();
  ctx.restore();

  // 飘向鼻尖的三缕干茶清香弧线（随帧轻摇）
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const phase = Math.sin(frame * 0.08 + i * 1.4) * 7;
    const baseY = 74 + i * 16;
    const startX = -104 + i * 18;
    ctx.strokeStyle = rgba(i === 1 ? pal.cinnabar : pal.tea, 0.62 - i * 0.12);
    ctx.lineWidth = 3.8 - i * 0.5;
    ctx.beginPath();
    ctx.moveTo(startX, baseY);
    ctx.bezierCurveTo(
      startX - 10 + phase,
      baseY - 34,
      -52 - i * 6 - phase,
      46 - i * 8,
      -34 + i * 4,
      24 + i * 4,
    );
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}
