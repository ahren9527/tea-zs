import { framesOf } from "@/remotion/shared/theme";

export const LINE = "先存对，再谈老";
export const LENGTH = framesOf(8);
export const FLY_AT = framesOf(0.25);

export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/wood.wav", at: FLY_AT, volume: 0.46 },
    { src: "tea/sfx/ding.wav", at: FLY_AT + 3, volume: 0.42 },
  ];
}
