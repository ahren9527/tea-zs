import { framesOf } from "@/remotion/shared/theme";

export const LENGTH = framesOf(8);
export const INTRO_AT = framesOf(0.3);
export const WORD_AT = [framesOf(1.6), framesOf(3.0), framesOf(4.4)] as const;
export const WORDS = ["够干", "封死", "没味"] as const;

export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/tok.wav", at: INTRO_AT, volume: 0.38 },
    { src: "tea/sfx/pop1.wav", at: WORD_AT[0], volume: 0.42 },
    { src: "tea/sfx/pop2.wav", at: WORD_AT[1], volume: 0.42 },
    { src: "tea/sfx/pop3.wav", at: WORD_AT[2], volume: 0.44 },
  ];
}
