import { framesOf } from "@/remotion/shared/theme";

export const CARDS = [
  { num: "干", title: "干不干" },
  { num: "封", title: "封没封严" },
  { num: "净", title: "有没有怪味" },
] as const;

export const LENGTH = framesOf(8);
export const APPEAR = [framesOf(0.4), framesOf(2.6), framesOf(4.9)] as const;

export function sfxHits(_staggerFrames: number) {
  const files = ["tea/sfx/pop1.wav", "tea/sfx/pop2.wav", "tea/sfx/pop3.wav"];
  return APPEAR.map((at, i) => ({ src: files[i], at, volume: 0.44 }));
}
