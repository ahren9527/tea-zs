export const FPS = 29.97;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const STAGE = {
  width: WIDTH,
  height: HEIGHT,
};

export const COLORS = {
  paper: "#f3ecdc",
  paperDeep: "#e7ddc8",
  ink: "#2b261c",
  muted: "#5c5346",
  seal: "#9b2d2a",
  bar: "#c4b49a",
};

export const FONT = '"LXGW WenKai", "Noto Serif SC", "Songti SC", serif';
export const SEAL_FONT = '"Noto Serif SC", "Songti SC", serif';

export function framesOf(seconds: number) {
  return Math.round(seconds * FPS);
}

export type AnimParams = {
  startMs: number;
  staggerMs: number;
  durationMs: number;
};

export function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export function lineProgress(index: number, elapsed: number, params: AnimParams, leadMs = 0) {
  const local = (elapsed - params.startMs - leadMs - index * params.staggerMs) / params.durationMs;
  if (local <= 0) return 0;
  if (local >= 1) return 1;
  return easeOutCubic(local);
}
