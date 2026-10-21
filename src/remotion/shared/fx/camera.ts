/**
 * fx/camera — 虚拟镜头：整拍缓慢推近（1.00→1.06）、轻微漂移、按层深度视差、背景虚焦。
 *
 *   const cam = cameraAt(frame, LENGTH, { focus: [...] });
 *   // canvas：
 *   withLayer(ctx, cam, 0.4, () => drawBackground(ctx));   // 远景
 *   withLayer(ctx, cam, 1.0, () => drawSubject(ctx));      // 主体
 *   // React：<CameraLayer cam={cam} depth={0.4}>…</CameraLayer>（见 fx/react.tsx）
 *
 * depth：0 = 钉在屏幕上（字幕、版心），1 = 主体平面，>1 = 前景（视差更大），<1 = 远景。
 */
import { STAGE } from "../theme";
import { clamp01, easeInOutCubic, easeInOutSine, noise1, progress } from "./math";

export type FocusKey = {
  /** 从这一帧开始移向这个焦点 */
  at: number;
  /** 用多少帧移过去 */
  dur: number;
  /** 画面里要看的点（舞台坐标），镜头会把它往画面中心带一点 */
  x: number;
  y: number;
  /** 额外推近（乘在基础推近上），默认 1 */
  zoom?: number;
  /** 移到焦点的程度 0..1（默认 0.5：只往中心带一半，不硬切） */
  pull?: number;
};

export type CameraOpts = {
  /** 起止缩放（默认 1.00 → 1.06） */
  from?: number;
  to?: number;
  /** 漂移幅度 px（默认 7） */
  drift?: number;
  /** 漂移的旋转幅度（度，默认 0.25） */
  roll?: number;
  seed?: number;
  /** 焦点关键帧（按 at 排序） */
  focus?: FocusKey[];
  /** 背景虚焦强度：depth 每离开 1 一个单位虚多少 px（默认 0 = 关） */
  focusBlur?: number;
};

export type Camera = {
  scale: number;
  /** 镜头中心相对舞台中心的偏移（舞台坐标） */
  x: number;
  y: number;
  /** 弧度 */
  rot: number;
  blurPerDepth: number;
  frame: number;
};

const CX = STAGE.width / 2;
const CY = STAGE.height / 2;

export function cameraAt(frame: number, length: number, opts: CameraOpts = {}): Camera {
  const { from = 1, to = 1.06, drift = 7, roll = 0.25, seed = 7, focus = [], focusBlur = 0 } = opts;
  // 基础推近：整拍慢进慢出
  let scale = from + (to - from) * easeInOutSine(progress(frame, 0, length));
  // 漂移：低频噪声，几乎察觉不到但让画面「活着」
  const t = frame / 30;
  let x = noise1(t * 0.35, seed) * drift;
  let y = noise1(t * 0.3, seed + 11) * drift * 0.8;
  const rot = ((noise1(t * 0.22, seed + 23) * roll) / 180) * Math.PI;
  // 焦点：依次叠加
  let fx = 0;
  let fy = 0;
  let zoom = 1;
  for (const k of focus) {
    const p = easeInOutCubic(progress(frame, k.at, k.at + k.dur));
    const pull = k.pull ?? 0.5;
    fx += ((k.x - CX) * pull - fx) * p;
    fy += ((k.y - CY) * pull - fy) * p;
    zoom += ((k.zoom ?? 1) - zoom) * p;
  }
  scale *= zoom;
  x += fx;
  y += fy;
  return { scale, x, y, rot, blurPerDepth: focusBlur, frame };
}

/** 某一层（depth）实际要用的平移/缩放：深度越小，跟镜头动得越少（视差） */
export function layerTransform(cam: Camera, depth: number) {
  const d = Math.max(0, depth);
  const scale = 1 + (cam.scale - 1) * d;
  return { scale, x: -cam.x * d, y: -cam.y * d, rot: cam.rot * Math.min(1, d), originX: CX, originY: CY };
}

/** 某一层的虚焦半径 px（主体平面 depth=1 永远清楚） */
export function layerBlur(cam: Camera, depth: number) {
  return Math.abs(1 - depth) * cam.blurPerDepth;
}

/** canvas：把 ctx 变换到某一层的镜头空间，画完自动还原 */
export function withLayer(ctx: CanvasRenderingContext2D, cam: Camera, depth: number, fn: () => void, opts: { blur?: boolean } = {}) {
  const t = layerTransform(cam, depth);
  ctx.save();
  ctx.translate(t.originX + t.x, t.originY + t.y);
  ctx.rotate(t.rot);
  ctx.scale(t.scale, t.scale);
  ctx.translate(-t.originX, -t.originY);
  const b = opts.blur ? layerBlur(cam, depth) : 0;
  if (b > 0.3 && "filter" in ctx) ctx.filter = `blur(${b.toFixed(1)}px)`;
  fn();
  ctx.restore();
}

/** 舞台坐标的一个点，经过某层镜头后落在屏幕哪里（文字跟随物体时用） */
export function projectPoint(cam: Camera, depth: number, x: number, y: number) {
  const t = layerTransform(cam, depth);
  const dx = (x - t.originX) * t.scale;
  const dy = (y - t.originY) * t.scale;
  const c = Math.cos(t.rot);
  const s = Math.sin(t.rot);
  return { x: t.originX + t.x + dx * c - dy * s, y: t.originY + t.y + dx * s + dy * c };
}

/** React/CSS：同一层的 transform 字符串（transform-origin 用舞台中心） */
export function layerCss(cam: Camera, depth: number) {
  const t = layerTransform(cam, depth);
  return {
    transform: `translate(${t.x.toFixed(2)}px, ${t.y.toFixed(2)}px) rotate(${t.rot.toFixed(5)}rad) scale(${t.scale.toFixed(5)})`,
    transformOrigin: `${t.originX}px ${t.originY}px`,
    filter: layerBlur(cam, depth) > 0.3 ? `blur(${layerBlur(cam, depth).toFixed(1)}px)` : undefined,
  };
}

/** 镜头推进的「冲击」：落地瞬间给镜头一个很小的抖动（返回 px 偏移），frame 相对冲击帧 */
export function cameraKick(local: number, amp = 4) {
  if (local < 0 || local > 24) return { x: 0, y: 0 };
  const decay = Math.exp(-local * 0.22);
  return { x: Math.sin(local * 1.9) * amp * 0.35 * decay, y: Math.sin(local * 1.3 + 0.5) * amp * decay * clamp01(local / 2) };
}
