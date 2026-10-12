import type { BeatTiming, TemplateContent, TemplateMeta } from "./schema";
import { Timeline, type PlanMarker } from "./kit/motion";
import type { Env } from "./kit/paint";

/**
 * 一个节拍模板 = 元信息（字段表单）+ plan（排时间轴）+ draw（画一帧）。
 * plan 只依赖内容和节奏，返回本模板自己的时间点数据 P；draw 每帧调用，纯函数。
 */
export type TemplateDef<P = any> = TemplateMeta & {
  /** 在模板选择器缩略图里展示的时间点（占总时长比例，默认 0.82） */
  thumbAt?: number;
  plan: (c: TemplateContent, tl: Timeline) => P;
  draw: (env: Env, c: TemplateContent, P: P) => void;
};

export function defineTemplate<P>(def: TemplateDef<P>): TemplateDef<P> {
  return def;
}

export type ComputedPlan<P = any> = {
  P: P;
  /** 秒 */
  duration: number;
  activeSec: number;
  pace: number;
  markers: PlanMarker[];
};

function run<P>(def: TemplateDef<P>, c: TemplateContent, pace: number) {
  const tl = new Timeline(pace);
  const P = def.plan(c, tl);
  return { P, tl };
}

/**
 * 计算一个分镜的完整时间轴。填了 durationSec 时，会反算 pace 让动画刚好落在口播时长里。
 */
export function computePlan<P>(def: TemplateDef<P>, c: TemplateContent, timing: BeatTiming): ComputedPlan<P> {
  let pace = timing.pace || 1;
  if (timing.durationSec && timing.durationSec > timing.holdSec + 0.5) {
    const base = run(def, c, 1).tl.t;
    // 对齐口播：节奏最慢放到 0.6 倍，再多出来的时间变成结尾停留，避免动作拖沓
    pace = Math.min(2.5, Math.max(0.6, base / (timing.durationSec - timing.holdSec)));
  }
  const { P, tl } = run(def, c, pace);
  const activeSec = tl.t;
  const duration = timing.durationSec && timing.durationSec > 1 ? Math.max(timing.durationSec, activeSec + 0.3) : activeSec + timing.holdSec;
  return { P, duration, activeSec, pace, markers: tl.markers };
}
