import { framesOf } from "@/remotion/shared/theme";

// Landmarks and texts for Ep19 B4-1
export const STAMP_LIGHT_TEXT = "避光 ✔";
export const STAMP_SEAL_TEXT = "密封 ✔";

// Timeline landmarks: 5.0s (150 frames @ 29.97fps)
export const LENGTH = framesOf(5.0);

// Stage 1: Light refraction (0.8s - 1.8s)
export const LIGHT_START_AT = framesOf(0.75); // frame 22: light beams shoot in
export const LIGHT_IMPACT_AT = framesOf(1.05); // frame 31: beams hit porcelain & scatter
export const STAMP_LIGHT_AT = framesOf(1.25); // frame 37: [避光 ✔] stamp falls

// Refracted Particle Definition for dynamic ballistic trajectories & optical sparkle
export interface RefractParticleDef {
  id: number;
  originIdx: number; // 0: upper (414, 735), 1: mid (405, 778), 2: lower (410, 822)
  vx: number;        // velocity X (pixels outward)
  vy: number;        // velocity Y (pixels outward)
  curveX: number;    // lateral ballistic curvature
  curveY: number;    // vertical arc curvature (creates graceful arced parabolic trajectories)
  wobbleFreq: number;// sine frequency for organic air drift
  wobbleAmp: number; // amplitude of gentle fluttering
  size: number;      // particle radius (2 to 6.5px)
  color: string;     // core color (#fff5aa, #ffd152, #ffeaa7, #d5ffea, #ffaa44)
  glowColor: string; // glow halo color
  hasTrail: boolean; // whether to draw a luminous comet streak
  isStar: boolean;   // whether to render 4-point sparkle cross
  delay: number;     // frame delay (0 to 4 frames)
  life: number;      // frame lifespan (18 to 26 frames)
}

// 28 highly dynamic, curved trajectory refraction particles
export const REFRACT_PARTICLES: RefractParticleDef[] = [
  // --- Upper Impact Group (originIdx: 0 -> (414, 735)) ---
  {
    id: 1, originIdx: 0, delay: 0, life: 22,
    vx: -270, vy: -230, curveX: 45, curveY: -70,
    wobbleFreq: 6, wobbleAmp: 12, size: 5.5,
    color: "#fff8d6", glowColor: "rgba(255, 230, 120, 0.6)",
    hasTrail: true, isStar: true,
  },
  {
    id: 2, originIdx: 0, delay: 1, life: 24,
    vx: -180, vy: -310, curveX: -60, curveY: 40,
    wobbleFreq: 8, wobbleAmp: 14, size: 4.2,
    color: "#ffd54f", glowColor: "rgba(255, 200, 50, 0.5)",
    hasTrail: true, isStar: false,
  },
  {
    id: 3, originIdx: 0, delay: 0, life: 20,
    vx: -330, vy: -120, curveX: 30, curveY: -40,
    wobbleFreq: 5, wobbleAmp: 8, size: 4.8,
    color: "#ffffff", glowColor: "rgba(255, 255, 240, 0.7)",
    hasTrail: true, isStar: true,
  },
  {
    id: 4, originIdx: 0, delay: 2, life: 25,
    vx: -130, vy: -190, curveX: 75, curveY: -50,
    wobbleFreq: 9, wobbleAmp: 16, size: 3.6,
    color: "#d9fbe8", glowColor: "rgba(180, 245, 210, 0.5)",
    hasTrail: false, isStar: false,
  },
  {
    id: 5, originIdx: 0, delay: 1, life: 21,
    vx: -220, vy: -270, curveX: -40, curveY: -30,
    wobbleFreq: 7, wobbleAmp: 10, size: 3.8,
    color: "#ffe082", glowColor: "rgba(255, 220, 100, 0.5)",
    hasTrail: true, isStar: false,
  },
  {
    id: 6, originIdx: 0, delay: 3, life: 23,
    vx: -290, vy: -160, curveX: 50, curveY: -60,
    wobbleFreq: 8, wobbleAmp: 12, size: 4.4,
    color: "#fff59d", glowColor: "rgba(255, 240, 140, 0.55)",
    hasTrail: true, isStar: true,
  },
  {
    id: 7, originIdx: 0, delay: 2, life: 26,
    vx: -90, vy: -140, curveX: -30, curveY: 30,
    wobbleFreq: 11, wobbleAmp: 18, size: 2.8,
    color: "#ffffff", glowColor: "rgba(255, 255, 255, 0.6)",
    hasTrail: false, isStar: false,
  },
  {
    id: 8, originIdx: 0, delay: 4, life: 20,
    vx: -240, vy: -210, curveX: 25, curveY: -45,
    wobbleFreq: 6, wobbleAmp: 9, size: 3.5,
    color: "#ffca28", glowColor: "rgba(255, 200, 40, 0.5)",
    hasTrail: true, isStar: false,
  },

  // --- Middle Impact Group (originIdx: 1 -> (405, 778)) ---
  {
    id: 9, originIdx: 1, delay: 0, life: 22,
    vx: -370, vy: -35, curveX: 20, curveY: -35,
    wobbleFreq: 5, wobbleAmp: 8, size: 6.0,
    color: "#fffdf0", glowColor: "rgba(255, 250, 200, 0.75)",
    hasTrail: true, isStar: true,
  },
  {
    id: 10, originIdx: 1, delay: 0, life: 24,
    vx: -270, vy: -160, curveX: -65, curveY: -75,
    wobbleFreq: 7, wobbleAmp: 14, size: 5.0,
    color: "#ffc107", glowColor: "rgba(255, 190, 20, 0.6)",
    hasTrail: true, isStar: false,
  },
  {
    id: 11, originIdx: 1, delay: 1, life: 23,
    vx: -290, vy: 110, curveX: 55, curveY: 65,
    wobbleFreq: 8, wobbleAmp: 12, size: 4.8,
    color: "#ffe082", glowColor: "rgba(255, 220, 110, 0.55)",
    hasTrail: true, isStar: true,
  },
  {
    id: 12, originIdx: 1, delay: 1, life: 25,
    vx: -160, vy: -85, curveX: -85, curveY: -45,
    wobbleFreq: 10, wobbleAmp: 16, size: 3.8,
    color: "#ffffff", glowColor: "rgba(255, 255, 255, 0.65)",
    hasTrail: false, isStar: true,
  },
  {
    id: 13, originIdx: 1, delay: 2, life: 22,
    vx: -320, vy: 70, curveX: 30, curveY: 45,
    wobbleFreq: 6, wobbleAmp: 10, size: 4.5,
    color: "#ffb300", glowColor: "rgba(255, 175, 0, 0.55)",
    hasTrail: true, isStar: false,
  },
  {
    id: 14, originIdx: 1, delay: 2, life: 26,
    vx: -190, vy: 50, curveX: 60, curveY: -55,
    wobbleFreq: 9, wobbleAmp: 15, size: 3.4,
    color: "#c8f7dc", glowColor: "rgba(160, 240, 190, 0.5)",
    hasTrail: false, isStar: false,
  },
  {
    id: 15, originIdx: 1, delay: 3, life: 21,
    vx: -340, vy: -80, curveX: 40, curveY: -50,
    wobbleFreq: 7, wobbleAmp: 11, size: 4.6,
    color: "#fff9c4", glowColor: "rgba(255, 245, 180, 0.6)",
    hasTrail: true, isStar: true,
  },
  {
    id: 16, originIdx: 1, delay: 3, life: 24,
    vx: -120, vy: -120, curveX: -45, curveY: 35,
    wobbleFreq: 12, wobbleAmp: 18, size: 2.8,
    color: "#ffe0b2", glowColor: "rgba(255, 210, 160, 0.5)",
    hasTrail: false, isStar: false,
  },
  {
    id: 17, originIdx: 1, delay: 4, life: 20,
    vx: -250, vy: -40, curveX: 15, curveY: -25,
    wobbleFreq: 5, wobbleAmp: 7, size: 3.5,
    color: "#ffca28", glowColor: "rgba(255, 200, 40, 0.5)",
    hasTrail: true, isStar: false,
  },

  // --- Lower Impact Group (originIdx: 2 -> (410, 822)) ---
  {
    id: 18, originIdx: 2, delay: 0, life: 23,
    vx: -310, vy: 160, curveX: 45, curveY: 80,
    wobbleFreq: 6, wobbleAmp: 12, size: 5.4,
    color: "#fff59d", glowColor: "rgba(255, 240, 130, 0.6)",
    hasTrail: true, isStar: true,
  },
  {
    id: 19, originIdx: 2, delay: 0, life: 25,
    vx: -240, vy: -130, curveX: -65, curveY: -50,
    wobbleFreq: 8, wobbleAmp: 15, size: 4.5,
    color: "#ffd54f", glowColor: "rgba(255, 210, 60, 0.55)",
    hasTrail: true, isStar: false,
  },
  {
    id: 20, originIdx: 2, delay: 1, life: 22,
    vx: -190, vy: 220, curveX: 35, curveY: -55,
    wobbleFreq: 7, wobbleAmp: 13, size: 4.0,
    color: "#ffffff", glowColor: "rgba(255, 255, 240, 0.7)",
    hasTrail: false, isStar: true,
  },
  {
    id: 21, originIdx: 2, delay: 1, life: 24,
    vx: -350, vy: 70, curveX: 25, curveY: 35,
    wobbleFreq: 5, wobbleAmp: 9, size: 5.0,
    color: "#ffc107", glowColor: "rgba(255, 190, 30, 0.6)",
    hasTrail: true, isStar: true,
  },
  {
    id: 22, originIdx: 2, delay: 2, life: 26,
    vx: -150, vy: 120, curveX: -45, curveY: 70,
    wobbleFreq: 10, wobbleAmp: 16, size: 3.5,
    color: "#d0f8e2", glowColor: "rgba(170, 240, 200, 0.5)",
    hasTrail: false, isStar: false,
  },
  {
    id: 23, originIdx: 2, delay: 2, life: 21,
    vx: -270, vy: 190, curveX: 50, curveY: 60,
    wobbleFreq: 7, wobbleAmp: 11, size: 4.4,
    color: "#ffe082", glowColor: "rgba(255, 220, 110, 0.55)",
    hasTrail: true, isStar: false,
  },
  {
    id: 24, originIdx: 2, delay: 3, life: 25,
    vx: -90, vy: 80, curveX: 25, curveY: -40,
    wobbleFreq: 11, wobbleAmp: 17, size: 2.9,
    color: "#ffffff", glowColor: "rgba(255, 255, 255, 0.65)",
    hasTrail: false, isStar: false,
  },
  {
    id: 25, originIdx: 2, delay: 4, life: 20,
    vx: -280, vy: 140, curveX: 30, curveY: 50,
    wobbleFreq: 6, wobbleAmp: 9, size: 3.8,
    color: "#ffb300", glowColor: "rgba(255, 175, 10, 0.5)",
    hasTrail: true, isStar: false,
  },

  // --- Ambient floating motes drifting between beams ---
  {
    id: 26, originIdx: 1, delay: 0, life: 28,
    vx: -140, vy: -170, curveX: 80, curveY: -30,
    wobbleFreq: 12, wobbleAmp: 20, size: 3.2,
    color: "#fff59d", glowColor: "rgba(255, 245, 150, 0.5)",
    hasTrail: false, isStar: true,
  },
  {
    id: 27, originIdx: 1, delay: 1, life: 30,
    vx: -160, vy: 140, curveX: -70, curveY: 50,
    wobbleFreq: 13, wobbleAmp: 22, size: 3.0,
    color: "#c5f5dc", glowColor: "rgba(160, 240, 190, 0.5)",
    hasTrail: false, isStar: false,
  },
  {
    id: 28, originIdx: 0, delay: 2, life: 27,
    vx: -110, vy: -70, curveX: 60, curveY: -80,
    wobbleFreq: 10, wobbleAmp: 18, size: 2.7,
    color: "#ffffff", glowColor: "rgba(255, 255, 255, 0.6)",
    hasTrail: false, isStar: false,
  },
];

// Stage 2: Seal compression (1.8s - 3.2s)
export const LID_START_AT = framesOf(1.8); // frame 54: lid descends
export const SILICONE_TOUCH_AT = framesOf(2.2); // frame 66: silicone starts compressing
export const LID_LOCKED_AT = framesOf(2.65); // frame 79: fully locked & airtight
export const AROMA_BURST_AT = framesOf(2.7); // frame 81: golden aroma sphere expands & breathes
export const STAMP_SEAL_AT = framesOf(2.8); // frame 84: [密封 ✔] stamp falls

export function sfxHits(_staggerFrames: number) {
  return [
    // Ambient entrance
    { src: "tea/sfx/paper.wav", at: 0, volume: 0.32 },
    // Stage 1: Crystal refraction shimmer & wooden stamp
    { src: "tea/sfx/crystal-refract.wav", at: LIGHT_IMPACT_AT, volume: 0.7 },
    { src: "tea/sfx/wood-stamp.wav", at: STAMP_LIGHT_AT, volume: 0.68 },
    // Stage 2: Airtight seal suction & celadon chime & seal stamp
    { src: "tea/sfx/airtight-seal.wav", at: SILICONE_TOUCH_AT + 4, volume: 0.72 },
    { src: "tea/sfx/celadon-chime.wav", at: LID_LOCKED_AT, volume: 0.65 },
    { src: "tea/sfx/wood-stamp.wav", at: STAMP_SEAL_AT, volume: 0.68 },
  ];
}
