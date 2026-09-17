import { framesOf } from "@/remotion/shared/theme";

export const LENGTH = framesOf(18);
export const CHAR_AT = framesOf(0.3);
export const MUST_AT = framesOf(2.6);
export const ZISHA_AT = framesOf(4.6);
export const BAN_AT = framesOf(6.4);
export const LAYER_AT = [framesOf(8.8), framesOf(10.6), framesOf(12.4)] as const;
export const LIGHT_AT = framesOf(15.4);

export const LAYERS = [
  { name: "铝箔袋", kind: "foil" as const },
  { name: "塑料袋", kind: "bag" as const },
  { name: "纸箱", kind: "box" as const },
];

export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/tok.wav", at: CHAR_AT, volume: 0.38 },
    { src: "tea/sfx/pop1.wav", at: MUST_AT, volume: 0.4 },
    { src: "tea/sfx/pop2.wav", at: ZISHA_AT, volume: 0.42 },
    { src: "tea/sfx/stamp.wav", at: BAN_AT, volume: 0.5 },
    { src: "tea/sfx/pop1.wav", at: LAYER_AT[0], volume: 0.4 },
    { src: "tea/sfx/pop2.wav", at: LAYER_AT[1], volume: 0.4 },
    { src: "tea/sfx/pop3.wav", at: LAYER_AT[2], volume: 0.44 },
    { src: "tea/sfx/tok.wav", at: LIGHT_AT, volume: 0.4 },
  ];
}
