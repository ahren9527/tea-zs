import { framesOf } from "@/remotion/shared/theme";

// Landmarks and default texts for Ep19 B6-1: 昼夜双境·纯净聚焦版
export const TITLE_DEFAULT = "大罐睡觉 · 小罐上班";
export const STAMP_DEFAULT = "准则";

// Timeline landmarks: 4.5s (135 frames @ 29.97fps)
export const LENGTH = framesOf(4.5);

// 0. Split world & central banner drop
export const BANNER_DROP_AT = framesOf(0.4); // 0.4s: central seal banner drops with back.out(1.8)

// 1. Top dark warehouse: Urn floating Zzz
export const SLEEP_START_AT = framesOf(0.7);

// 2. Bottom morning desk: Sunbeam & aroma tea leaves swirl (0.8s - 2.8s)
export const SUNBEAM_START_AT = framesOf(0.8);
export const AROMA_START_AT = framesOf(1.0);

// Audio helper (no-op in web to avoid overlapping sound triggers)
export const teaAudio = {
  playStampWood: () => {},
  playAromaWake: () => {},
  playCeladonChime: () => {},
};

// SFX Hits for Remotion SfxTrack: 纯净克制音效，避免杂乱重叠
export function sfxHits(_staggerFrames: number) {
  return [
    // 0.4s：主横幅破空砸落压轴印章声（干净干脆）
    { src: "tea/sfx/wood-stamp.wav", at: BANNER_DROP_AT, volume: 0.8 },
    // 1.0s：小瓷罐茶香与嫩芽升腾时的清脆瓷鸣回响
    { src: "tea/sfx/celadon-chime.wav", at: AROMA_START_AT, volume: 0.75 },
  ];
}
