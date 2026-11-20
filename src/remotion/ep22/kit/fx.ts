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

/** 片尾最后 0.5 秒（15 帧）保持画面干净静止，便于剪辑衔接 */
export const END_STILL_FRAMES = 15;

export function cameraAt(frame: number, length: number, opts: CameraOpts = {}): Camera {
  const settleAt = Math.max(0, length - END_STILL_FRAMES);
  // 在片尾前 12 帧柔和收住镜头微漂移，最后 15 帧（0.5s）完全静止
  const clampedFrame =
    frame <= settleAt - 12
      ? frame
      : frame >= settleAt
        ? settleAt
        : settleAt - 12 + 12 * Math.sin(((frame - (settleAt - 12)) / 12) * (Math.PI / 2));
  return baseCameraAt(clampedFrame, length, {
    ...opts,
    focus: opts.focus?.map((k) => ({ ...k, dur: k.dur * TEMPO })),
  });
}

