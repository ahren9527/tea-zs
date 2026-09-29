import { framesOf } from "@/remotion/shared/theme";

export const CARDS = [
  { num: "干", title: "干不干" },
  { num: "封", title: "封没封严" },
  { num: "净", title: "有没有怪味" },
] as const;

export const LENGTH = framesOf(8);
export const APPEAR = [framesOf(0.4), framesOf(2.6), framesOf(4.9)] as const;

export function sfxHits(_staggerFrames: number) {
  const sequence = [
    { src: "tea/sfx/pop1.wav", volume: 0.4 },
    { src: "tea/sfx/pop2.wav", volume: 0.44 },
    { src: "tea/sfx/scale-a.wav", volume: 0.48 },
  ];
  return APPEAR.map((at, i) => ({
    src: sequence[i].src,
    at,
    volume: sequence[i].volume,
  }));
}
