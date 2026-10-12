/** 通用入场 / 淡出（弹簧 + 呼吸），任何一期的手写片段都可以用 */
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { POP_SPRING, breathOffset } from "@/remotion/shared/breath";

export function useAppear(at: number, dur = 18) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - at;
  const enter = spring({
    frame: local,
    fps,
    config: POP_SPRING,
    durationInFrames: dur,
  });
  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return {
    frame,
    fps,
    local,
    enter,
    opacity: Math.max(0, opacity),
    breath: breathOffset(local, fps),
  };
}

export function useFadeOut(at: number, len = 10) {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + len], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
