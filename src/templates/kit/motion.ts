/** 动效基础：缓动、进度、时间轴（单位全部是秒） */

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeOutCubic = (t: number) => 1 - (1 - clamp(t)) ** 3;
export const easeInOutCubic = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
export const easeOutQuart = (t: number) => 1 - (1 - clamp(t)) ** 4;
export function easeOutBack(t: number, s = 1.70158) {
  const x = clamp(t) - 1;
  return x * x * ((s + 1) * x + s) + 1;
}

/** t 在 [at, at+dur] 内的 0..1 进度 */
export function prog(t: number, at: number, dur: number) {
  if (dur <= 0) return t >= at ? 1 : 0;
  return clamp((t - at) / dur);
}

/** 入场 + 可选退场的透明度 */
export function inOut(t: number, at: number, inDur: number, outAt?: number, outDur = 0.3) {
  const a = easeOutCubic(prog(t, at, inDur));
  if (outAt == null || t < outAt) return a;
  return a * (1 - easeOutCubic(prog(t, outAt, outDur)));
}

/** 轻微呼吸（静止画面不死板） */
export function breath(t: number, amp = 1, period = 3.2) {
  return Math.sin((t / period) * Math.PI * 2) * amp;
}

/** 可复现的伪随机 */
export function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export type MarkerType = "intro" | "action" | "stamp" | "punchline";
export type PlanMarker = { at: number; label: string; tag: string; type: MarkerType; sfx?: string };

/**
 * 时间轴构建器：模板用它按顺序排布节拍，自动得到关键帧标记与总时长。
 * wait() 的秒数会被 pace 缩放（pace>1 更快）。
 */
export class Timeline {
  t = 0;
  markers: PlanMarker[] = [];
  constructor(public pace: number) {}
  wait(sec: number) {
    this.t += sec / this.pace;
    return this.t;
  }
  /** 记录一个节拍点并返回它的时间 */
  mark(label: string, tag: string, type: MarkerType, sfx?: string) {
    this.markers.push({ at: this.t, label, tag, type, sfx });
    return this.t;
  }
  /** 动画时长也按 pace 缩放，但不低于 min，避免快节奏时动作发抖 */
  dur(sec: number, min = 0.12) {
    return Math.max(min, sec / this.pace);
  }
}
