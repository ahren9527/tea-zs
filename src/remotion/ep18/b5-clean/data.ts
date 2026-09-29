import { framesOf } from "@/remotion/shared/theme";

export const LENGTH = framesOf(10);
export const CHAR_AT = framesOf(0.3);
export const BAD_AT = [framesOf(2.6), framesOf(4.2), framesOf(5.8)] as const;

export const BADS = [
  { name: "油烟", kind: "smell" as const },
  { name: "潮气", kind: "damp" as const },
  { name: "樟脑丸", kind: "camphor" as const },
];

export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/wood.wav", at: CHAR_AT, volume: 0.42 },
    { src: "tea/sfx/pop1.wav", at: BAD_AT[0], volume: 0.4 },
    { src: "tea/sfx/pop2.wav", at: BAD_AT[1], volume: 0.42 },
    { src: "tea/sfx/stamp.wav", at: BAD_AT[2], volume: 0.5 },
  ];
}
