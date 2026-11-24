/**
 * 第 23 期手绘动画基础工具（全部确定性纯函数，无 Math.random）：
 * 1. 线条抖动（line boil）：每 3 帧换一组 1–2px 微偏，仅用于勾线/刻度尺/毛笔线，不用于文字与茶饼本体；
 * 2. 一拍二（onTwos）：主体位移/旋转按 2 帧取整，镜头与粒子仍逐帧，有手绘节奏又不卡顿；
 * 3. 动画十二法则：预备蓄力（anticipateMove）、过冲回弹与跟随（followThrough）、轻呼吸（idleBreathe ≤ 1%）；
 * 4. 镜头衔接锚点（ANCHORS）：让相邻拍的刻度尺 / 时间轴 / 茶饼在剪辑切点位置与尺寸自然衔接。
 */
import {
  SPRINGS,
  breathe,
  clamp01,
  drawBrushStroke,
  easeInOutSine,
  hash01,
  noise1,
  type BrushOpts,
  type Pt,
  type SpringConfig,
} from "@/remotion/shared/fx";
import { springValue } from "./fx";

// ============================================================================
// 1. 线条抖动（Line Boil）：每 3 帧切一次状态，幅度 1–2px
// ============================================================================

/**
 * 当前真实帧（逐帧，不按一拍二取整）。主体动作按一拍二传进来的 frame 是偶数帧，
 * 若 boil 也跟着它算，会变成 4 帧/2 帧交替的不均匀抖动，所以 boil 一律按真实帧每 3 帧换一次。
 * beginFrame 每帧设置；离线单独调用（未设置）时退回传入的 frame。
 */
let RAW_FRAME = -1;
export function setRawFrame(frame: number) {
  RAW_FRAME = frame;
}
export function rawFrame(fallback: number): number {
  return RAW_FRAME >= 0 ? RAW_FRAME : fallback;
}

/** 每 3 帧步进一次的确定性 boil 序号 */
export function boilStep(frame: number): number {
  return Math.floor(Math.max(0, rawFrame(frame)) / 3);
}

/** 单个顶点在当前 boil 步上的 1–2px 微小偏移（hash01 + noise1 确定性组合） */
export function boilOffset(frame: number, seed: number, idx: number, amp = 1.4): Pt {
  const step = boilStep(frame);
  const hx = hash01(step, seed, idx * 2 + 1) * 2 - 1;
  const hy = hash01(step, seed, idx * 2 + 2) * 2 - 1;
  const nx = noise1(step * 0.73 + idx * 1.3, seed + 17);
  const ny = noise1(step * 0.73 + idx * 1.3, seed + 53);
  return {
    x: (hx * 0.65 + nx * 0.35) * amp,
    y: (hy * 0.65 + ny * 0.35) * amp,
  };
}

/** 给折线每个顶点加上每 3 帧更新一次的手绘抖动 */
export function boilPolyline(pts: Pt[], frame: number, seed: number, amp = 1.35): Pt[] {
  const last = pts.length - 1;
  return pts.map((q, i) => {
    const edgeWeight = i === 0 || i === last ? 0.75 : 1;
    const d = boilOffset(frame, seed, i, amp * edgeWeight);
    return { x: q.x + d.x, y: q.y + d.y };
  });
}

/** 带每 3 帧线条抖动的毛笔笔触（端点微收、笔身有呼吸） */
export function drawBoilBrushStroke(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  p: number,
  frame: number,
  opts: BrushOpts & { boilAmp?: number },
) {
  if (p <= 0) return;
  const { boilAmp = 1.45, seed = 1, ...rest } = opts;
  const step = boilStep(frame);
  const boiled = boilPolyline(pts, frame, seed + 31, boilAmp);
  drawBrushStroke(ctx, boiled, p, {
    ...rest,
    seed: seed + (step % 5) * 0.07,
  });
}

/** 路径：带 3 帧抖动的手绘直线段（内部细分为 3 段，线条有手绘张力） */
export function traceBoilLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  frame: number,
  seed: number,
  amp = 1.3,
) {
  const segs = 3;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const bx = x1 + (x2 - x1) * u;
    const by = y1 + (y2 - y1) * u;
    const d = boilOffset(frame, seed, i, amp * (i === 0 || i === segs ? 0.7 : 1));
    if (i === 0) ctx.moveTo(bx + d.x, by + d.y);
    else ctx.lineTo(bx + d.x, by + d.y);
  }
}

/** 路径：带 3 帧抖动的手绘矩形/圆角框外缘（勾线用，填充仍可用规整裁剪） */
export function traceBoilRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  frame: number,
  seed: number,
  amp = 1.3,
) {
  const pts: Pt[] = [
    { x, y },
    { x: x + w * 0.5, y },
    { x: x + w, y },
    { x: x + w, y: y + h * 0.5 },
    { x: x + w, y: y + h },
    { x: x + w * 0.5, y: y + h },
    { x, y: y + h },
    { x, y: y + h * 0.5 },
  ];
  const b = boilPolyline(pts, frame, seed, amp);
  ctx.moveTo(b[0].x, b[0].y);
  for (let i = 1; i < b.length; i++) ctx.lineTo(b[i].x, b[i].y);
  ctx.closePath();
}

// ============================================================================
// 2. 一拍二（Animating on Twos）：主体动作按 2 帧步进
// ============================================================================

/** 将帧号量化为偶数帧（一拍二），保留负值不误触发 */
export function onTwos(frame: number): number {
  return Math.floor(frame / 2) * 2;
}

// ============================================================================
// 3. 十二法则辅助：微呼吸（≤1%）、预备蓄力、过冲跟随
// ============================================================================

/** 极轻的手绘静止呼吸（缩放幅度严格 ≤ 1%，在片尾 0.5s 静止期也保留呼吸感） */
export function idleBreathe(frame: number, period = 4.4, phase = 0, amp = 1) {
  const safeAmp = Math.min(1.15, Math.max(0, amp));
  const b = breathe(frame, period, phase, safeAmp * 0.85);
  return {
    w: b.w,
    scale: 1 + (b.scale - 1) * 0.95, // ≤ 0.78%
    y: b.y * 0.75, // ≤ 2.2px
  };
}

/**
 * 预备动作 + 弹簧过冲位移（0 → -back → 1.0x → 1）：
 * 动之前先反向蓄一下，再带一点过冲回弹停稳，全用一拍二节奏。
 */
export function anticipateMove(
  local: number,
  opts: { prep?: number; back?: number; spring?: SpringConfig } = {},
): number {
  const { prep = 6, back = 0.09, spring = SPRINGS.heavy } = opts;
  const f = onTwos(local);
  if (f <= 0) return 0;
  if (f < prep) {
    const u = easeInOutSine(f / prep);
    return -back * Math.sin(u * Math.PI);
  }
  const s = springValue(f - prep, spring);
  return -back * (1 - clamp01((f - prep) / 5)) + s * (1 + back * (1 - clamp01((f - prep) / 5)));
}

/**
 * 跟随动作（Follow-through / Overlapping action）：
 * 比主体晚 lag 帧才启动并带柔和阻尼回弹，适合影子、指针数值牌、丝带、小标注。
 */
export function followThrough(
  local: number,
  lag = 4,
  cfg: SpringConfig = { stiffness: 165, damping: 14, mass: 1.2 },
): number {
  const f = onTwos(local - lag);
  if (f <= 0) return 0;
  return springValue(f, cfg);
}

// ============================================================================
// 4. 跨拍镜头衔接锚点（剪辑切点上的共同位置与尺寸）
// ============================================================================

export const ANCHORS = {
  /** B1 结尾 ↔ B2 开头：8.5% 横向朱砂刻度线位置 */
  b1ToB2Scale: { x: 495, y: 980, length: 740, thickness: 66 },
  /** B3 结尾 ↔ B4 开头：3–5 年横向时间轴基准 */
  b3ToB4Timeline: { x0: 120, x1: 870, yEndB3: 1365, yStartB4: 590 },
  /** B5 结尾 ↔ B6 开头：蜜韵饼茶位置与半径 */
  b5ToB6Cake: { x: 670, y: 980, radius: 152 },
  /** B7 结尾 ↔ B8 开头：横向水分刻度尺位置与尺寸 */
  b7ToB8Scale: { x: 495, y: 760, length: 740, thickness: 62 },
  /** B8 结尾 ↔ B9 开头：收束后的横向水分刻度尺母题 */
  b8ToB9Scale: { x: 495, y: 515, length: 680, thickness: 44, yEndB9: 1445 },
} as const;
