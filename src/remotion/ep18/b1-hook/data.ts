import { framesOf } from "@/remotion/shared/theme";

export const MYTH = "越放越香";
export const STAMP = "毁茶";
export const LINE = "你以为在陈化";

export const LENGTH = framesOf(10);

export const MYTH_AT = framesOf(2.0);
export const STAMP_AT = framesOf(5.2);
export const LINE_AT = framesOf(7.6);

export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/paper.wav", at: MYTH_AT - 4, volume: 0.35 },
    { src: "tea/sfx/wood.wav", at: MYTH_AT, volume: 0.44 },
    { src: "tea/sfx/stamp.wav", at: STAMP_AT, volume: 0.52 },
    { src: "tea/sfx/ding.wav", at: LINE_AT + 4, volume: 0.38 },
  ];
}
