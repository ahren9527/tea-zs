import { framesOf } from "@/remotion/shared/theme";

export const LENGTH = framesOf(10);
export const Q_AT = framesOf(0.4);
export const OPT_AT = [framesOf(2.6), framesOf(4.8)] as const;
export const FOOT_AT = framesOf(7.6);

export const OPTIONS = [
  { key: "A", text: "现喝现撬" },
  { key: "B", text: "提前分装" },
] as const;

export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/tok.wav", at: Q_AT, volume: 0.4 },
    { src: "tea/sfx/pop1.wav", at: OPT_AT[0], volume: 0.42 },
    { src: "tea/sfx/pop2.wav", at: OPT_AT[1], volume: 0.44 },
    { src: "tea/sfx/stamp.wav", at: FOOT_AT, volume: 0.4 },
  ];
}
