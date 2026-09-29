import { framesOf } from "@/remotion/shared/theme";

export const LENGTH = framesOf(8);
export const INTRO_AT = framesOf(0.3);
export const WORD_AT = [framesOf(1.6), framesOf(3.0), framesOf(4.4)] as const;
export const WORDS = ["够干", "封死", "没味"] as const;

export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/wood.wav", at: INTRO_AT, volume: 0.44 },
    { src: "tea/sfx/stamp.wav", at: WORD_AT[0], volume: 0.48 },
    { src: "tea/sfx/stamp.wav", at: WORD_AT[1], volume: 0.5 },
    { src: "tea/sfx/stamp.wav", at: WORD_AT[2], volume: 0.54 },
    { src: "tea/sfx/ding.wav", at: WORD_AT[2] + 8, volume: 0.4 },
  ];
}
