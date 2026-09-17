import { framesOf } from "@/remotion/shared/theme";

export const LENGTH = framesOf(20);
export const CHAR_AT = framesOf(0.3);
export const NOT_AT = framesOf(2.8);
export const SOUR_AT = framesOf(5.0);
export const RAIN_AT = framesOf(8.2);
export const DEHUM_AT = framesOf(10.0);
export const FRIDGE_AT = framesOf(13.2);
export const ROOM_AT = framesOf(16.6);

export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/tok.wav", at: CHAR_AT, volume: 0.38 },
    { src: "tea/sfx/pop1.wav", at: NOT_AT, volume: 0.42 },
    { src: "tea/sfx/pop2.wav", at: SOUR_AT, volume: 0.44 },
    { src: "tea/sfx/pop3.wav", at: RAIN_AT, volume: 0.4 },
    { src: "tea/sfx/pop1.wav", at: DEHUM_AT, volume: 0.4 },
    { src: "tea/sfx/stamp.wav", at: FRIDGE_AT, volume: 0.5 },
    { src: "tea/sfx/tok.wav", at: ROOM_AT, volume: 0.4 },
  ];
}
