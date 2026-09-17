import { framesOf } from "@/remotion/shared/theme";

export const LINE = "先存对，再谈老";
export const LENGTH = framesOf(8);
export const FLY_AT = framesOf(0.25);
export const ZOOM_AT = framesOf(2.0);

export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/pop1.wav", at: FLY_AT, volume: 0.44 },
    { src: "tea/sfx/wood.wav", at: ZOOM_AT, volume: 0.38 },
  ];
}
