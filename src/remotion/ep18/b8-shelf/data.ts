import { framesOf } from "@/remotion/shared/theme";

export const LENGTH = framesOf(12);
export const SCENE_AT = framesOf(0.2);
export const WALL_AT = framesOf(1.6);
export const FLOOR_AT = framesOf(5.2);
export const SHELF_AT = framesOf(8.6);

export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/wood.wav", at: SCENE_AT, volume: 0.4 },
    { src: "tea/sfx/pop1.wav", at: WALL_AT, volume: 0.42 },
    { src: "tea/sfx/pop2.wav", at: FLOOR_AT, volume: 0.42 },
    { src: "tea/sfx/stamp.wav", at: SHELF_AT, volume: 0.46 },
  ];
}
