/**
 * 第 22 期的动效入口：转出共享动效库，沿用第 20/21 期的整体放慢系数（宁慢勿快，剪辑加速不伤帧率）。
 */
import {
  cameraAt as baseCameraAt,
  lightFloat as baseLightFloat,
  progress as baseProgress,
  springValue as baseSpringValue,
  type Camera,
  type CameraOpts,
  type Pose,
  type SpringConfig,
} from "@/remotion/shared/fx";

export * from "@/remotion/shared/fx";

/** 过渡（淡入淡出、位移、描笔）放慢倍数 */
export const TEMPO = 1.3;
/** 弹簧 / 轻浮入场放慢倍数 */
export const SPRING_TEMPO = 1.25;

/** 原版 progress（不放慢）：给循环动画、归一化区间用 */
export const progressRaw = baseProgress;

export function progress(x: number, a: number, b: number) {
  const span = b - a;
  return span > 1.5 ? baseProgress(x, a, a + span * TEMPO) : baseProgress(x, a, b);
}

export function springValue(local: number, cfg: SpringConfig, fps?: number) {
  return baseSpringValue(local / SPRING_TEMPO, cfg, fps);
}

export function lightFloat(
  local: number,
  opts: { rise?: number; sway?: number; seed?: number } = {},
): Pose {
  return baseLightFloat(local / SPRING_TEMPO, opts);
}

export function cameraAt(frame: number, length: number, opts: CameraOpts = {}): Camera {
  return baseCameraAt(frame, length, {
    ...opts,
    focus: opts.focus?.map((k) => ({ ...k, dur: k.dur * TEMPO })),
  });
}
