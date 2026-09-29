import { framesOf } from "@/remotion/shared/theme";

export const LENGTH = framesOf(12);

// Time marks in frames
export const TITLE_AT = framesOf(0.4);
export const BIG_AT = framesOf(1.8);
export const SMALL_AT = framesOf(5.0);
export const FLOW_AT = framesOf(7.4);
export const FOOT_AT = framesOf(9.2);

export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/wood.wav", at: TITLE_AT, volume: 0.45 },
    { src: "tea/sfx/pop1.wav", at: BIG_AT, volume: 0.44 },
    { src: "tea/sfx/pop2.wav", at: SMALL_AT, volume: 0.44 },
    { src: "tea/sfx/scale-a.wav", at: FLOW_AT, volume: 0.48 },
    { src: "tea/sfx/stamp.wav", at: FOOT_AT, volume: 0.5 },
  ];
}
