import { useCurrentFrame, useVideoConfig } from "remotion";

export const POP_SPRING = { damping: 10, stiffness: 190, mass: 0.58 };

export function breathOffset(local: number, fps: number, _delay = 0) {
  if (local < 0) return { y: 0, scale: 1 };
  const t = local / fps;
  if (t > 1.4) return { y: 0, scale: 1 };
  const decay = Math.exp(-t * 3.1);
  const w = Math.sin((t / 0.72) * Math.PI * 2) * decay;
  return { y: -5.2 * w, scale: 1 + 0.055 * w };
}

export function popTransform(
  enter: number,
  breath: { y: number; scale: number } = { y: 0, scale: 1 },
  rise = 30,
  tilt = -5.5,
) {
  const e = Math.max(0, enter);
  const y = (1 - e) * rise + breath.y;
  const scale = (0.9 + 0.1 * e) * breath.scale;
  const rot = (1 - e) * tilt;
  return `translateY(${y.toFixed(2)}px) scale(${scale.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;
}

export function breathTransform(local: number, fps: number, delay = 0) {
  const { y, scale } = breathOffset(local, fps, delay);
  return `translateY(${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
}

export function TextBreath({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        display: "inline-block",
        transform: breathTransform(frame - delay, fps),
        transformOrigin: "center center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
