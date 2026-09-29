import { framesOf } from "@/remotion/shared/theme";

// Landmarks and texts for Ep19 B4-2: 材质红黑对决
export const LEFT_STAMP_DEFAULT = "瓷·铁 锁香 ✔";
export const RIGHT_STAMP_DEFAULT = "砂·玻 见光死 ✖";

// Timeline landmarks: 5.0s (150 frames @ 29.97fps)
export const LENGTH = framesOf(5.0);

// Stage 1: Simultaneous Light & Gas Dual Test (0.5s - 2.5s)
export const LIGHT_START_AT = framesOf(0.5); // frame 15: dual sunbeams emerge
export const LIGHT_IMPACT_AT = framesOf(0.8); // frame 24: beams hit jars (left deflects, right penetrates)
export const LEAF_WITHER_START = framesOf(0.9); // frame 27: right jar leaves begin yellowing
export const LEAF_WITHER_FULL = framesOf(2.3); // frame 69: right jar leaves withered to grey-brown
export const AROMA_SEAL_START = framesOf(0.85); // frame 25: left jar seal aura solidifies
export const AROMA_LEAK_START = framesOf(0.85); // frame 25: right jar begins continuous aroma dissipation

// Stage 2: Leader lines & stamp badges (2.0s - 3.5s)
export const LEADER_LINE_START = framesOf(2.0); // frame 60: red dashed leader lines draw down
export const STAMP_POP_AT = framesOf(2.4); // frame 72: both stamp badges slam down
export const CRACK_SURGE_AT = framesOf(2.65); // frame 79: dark red cracks fracture across right badge

// Audio helper for web & programmatic triggering
export const teaAudio = {
  playPorcelainChime: () => {
    try {
      if (typeof window !== "undefined") {
        const a = new Audio("/tea/sfx/celadon-chime.wav");
        a.volume = 0.65;
        a.play().catch(() => {
          // ignore play rejection
        });
      }
    } catch {
      // Audio not supported in environment
    }
  },
  playWoodSnap: () => {
    try {
      if (typeof window !== "undefined") {
        const a = new Audio("/tea/sfx/wood.wav");
        a.volume = 0.7;
        a.play().catch(() => {
          // ignore play rejection
        });
      }
    } catch {
      // Audio not supported in environment
    }
  },
};

// SFX Hits for Remotion SfxTrack
export function sfxHits(_staggerFrames: number) {
  return [
    // Ambient entrance
    { src: "tea/sfx/paper.wav", at: 0, volume: 0.32 },
    // Stage 1: Left jar light deflection impact
    { src: "tea/sfx/crystal-refract.wav", at: LIGHT_IMPACT_AT, volume: 0.72 },
    // Stage 1: Left jar seal aura & right jar aroma leak hiss
    { src: "tea/sfx/airtight-seal.wav", at: AROMA_SEAL_START, volume: 0.55 },
    { src: "tea/sfx/tea-rustle-hiss.wav", at: AROMA_LEAK_START + 6, volume: 0.48 },
    // Stage 2: Left stamp lands -> Celadon Chime (青瓷磬音)
    { src: "tea/sfx/celadon-chime.wav", at: STAMP_POP_AT, volume: 0.75 },
    // Stage 2: Right stamp lands -> Wood Snap (断竹轻钝音)
    { src: "tea/sfx/wood.wav", at: STAMP_POP_AT, volume: 0.72 },
  ];
}

// Refracted Particle Definition for Left Jar Deflection
export interface DeflectParticle {
  id: number;
  delay: number;
  life: number;
  vx: number;
  vy: number;
  curveX: number;
  curveY: number;
  wobbleFreq: number;
  wobbleAmp: number;
  size: number;
  color: string;
  glowColor: string;
  hasTrail: boolean;
  isStar: boolean;
}

// 22 Dynamic Ballistic Particles bouncing off the left jar outer glaze
export const LEFT_DEFLECT_PARTICLES: DeflectParticle[] = [
  {
    id: 1, delay: 0, life: 22,
    vx: -240, vy: -190, curveX: 40, curveY: -60,
    wobbleFreq: 6, wobbleAmp: 10, size: 5.2,
    color: "#fff8d6", glowColor: "rgba(255, 230, 120, 0.6)",
    hasTrail: true, isStar: true,
  },
  {
    id: 2, delay: 1, life: 24,
    vx: -160, vy: -260, curveX: -50, curveY: 30,
    wobbleFreq: 8, wobbleAmp: 12, size: 4.2,
    color: "#ffd54f", glowColor: "rgba(255, 200, 50, 0.5)",
    hasTrail: true, isStar: false,
  },
  {
    id: 3, delay: 0, life: 20,
    vx: -290, vy: -90, curveX: 25, curveY: -35,
    wobbleFreq: 5, wobbleAmp: 8, size: 4.6,
    color: "#ffffff", glowColor: "rgba(255, 255, 240, 0.7)",
    hasTrail: true, isStar: true,
  },
  {
    id: 4, delay: 2, life: 25,
    vx: -120, vy: -160, curveX: 65, curveY: -45,
    wobbleFreq: 9, wobbleAmp: 14, size: 3.5,
    color: "#d9fbe8", glowColor: "rgba(180, 245, 210, 0.5)",
    hasTrail: false, isStar: false,
  },
  {
    id: 5, delay: 1, life: 21,
    vx: -190, vy: -230, curveX: -35, curveY: -25,
    wobbleFreq: 7, wobbleAmp: 9, size: 3.8,
    color: "#ffe082", glowColor: "rgba(255, 220, 100, 0.5)",
    hasTrail: true, isStar: false,
  },
  {
    id: 6, delay: 3, life: 23,
    vx: -260, vy: -130, curveX: 45, curveY: -50,
    wobbleFreq: 8, wobbleAmp: 11, size: 4.2,
    color: "#fff59d", glowColor: "rgba(255, 240, 140, 0.55)",
    hasTrail: true, isStar: true,
  },
  {
    id: 7, delay: 2, life: 26,
    vx: -80, vy: -120, curveX: -25, curveY: 25,
    wobbleFreq: 11, wobbleAmp: 15, size: 2.8,
    color: "#ffffff", glowColor: "rgba(255, 255, 255, 0.6)",
    hasTrail: false, isStar: false,
  },
  {
    id: 8, delay: 4, life: 20,
    vx: -210, vy: -180, curveX: 20, curveY: -40,
    wobbleFreq: 6, wobbleAmp: 8, size: 3.4,
    color: "#ffca28", glowColor: "rgba(255, 200, 40, 0.5)",
    hasTrail: true, isStar: false,
  },
  {
    id: 9, delay: 0, life: 23,
    vx: -310, vy: -30, curveX: 20, curveY: -30,
    wobbleFreq: 5, wobbleAmp: 7, size: 5.5,
    color: "#fffdf0", glowColor: "rgba(255, 250, 200, 0.75)",
    hasTrail: true, isStar: true,
  },
  {
    id: 10, delay: 1, life: 24,
    vx: -230, vy: -140, curveX: -55, curveY: -65,
    wobbleFreq: 7, wobbleAmp: 12, size: 4.8,
    color: "#ffc107", glowColor: "rgba(255, 190, 20, 0.6)",
    hasTrail: true, isStar: false,
  },
  {
    id: 11, delay: 1, life: 22,
    vx: -250, vy: 95, curveX: 45, curveY: 55,
    wobbleFreq: 8, wobbleAmp: 10, size: 4.5,
    color: "#ffe082", glowColor: "rgba(255, 220, 110, 0.55)",
    hasTrail: true, isStar: true,
  },
  {
    id: 12, delay: 2, life: 25,
    vx: -140, vy: -70, curveX: -70, curveY: -35,
    wobbleFreq: 10, wobbleAmp: 14, size: 3.6,
    color: "#ffffff", glowColor: "rgba(255, 255, 255, 0.65)",
    hasTrail: false, isStar: true,
  },
  {
    id: 13, delay: 2, life: 21,
    vx: -270, vy: 60, curveX: 25, curveY: 40,
    wobbleFreq: 6, wobbleAmp: 9, size: 4.2,
    color: "#ffb300", glowColor: "rgba(255, 175, 0, 0.55)",
    hasTrail: true, isStar: false,
  },
  {
    id: 14, delay: 3, life: 26,
    vx: -160, vy: 40, curveX: 50, curveY: -45,
    wobbleFreq: 9, wobbleAmp: 13, size: 3.2,
    color: "#c8f7dc", glowColor: "rgba(160, 240, 190, 0.5)",
    hasTrail: false, isStar: false,
  },
  {
    id: 15, delay: 3, life: 20,
    vx: -280, vy: -70, curveX: 35, curveY: -40,
    wobbleFreq: 7, wobbleAmp: 10, size: 4.4,
    color: "#fff9c4", glowColor: "rgba(255, 245, 180, 0.6)",
    hasTrail: true, isStar: true,
  },
  {
    id: 16, delay: 4, life: 23,
    vx: -100, vy: -100, curveX: -35, curveY: 30,
    wobbleFreq: 12, wobbleAmp: 16, size: 2.8,
    color: "#ffe0b2", glowColor: "rgba(255, 210, 160, 0.5)",
    hasTrail: false, isStar: false,
  },
  {
    id: 17, delay: 1, life: 23,
    vx: -260, vy: 140, curveX: 35, curveY: 70,
    wobbleFreq: 6, wobbleAmp: 11, size: 5.0,
    color: "#fff59d", glowColor: "rgba(255, 240, 130, 0.6)",
    hasTrail: true, isStar: true,
  },
  {
    id: 18, delay: 2, life: 25,
    vx: -200, vy: -110, curveX: -55, curveY: -40,
    wobbleFreq: 8, wobbleAmp: 13, size: 4.2,
    color: "#ffd54f", glowColor: "rgba(255, 210, 60, 0.55)",
    hasTrail: true, isStar: false,
  },
  {
    id: 19, delay: 2, life: 22,
    vx: -160, vy: 180, curveX: 30, curveY: -45,
    wobbleFreq: 7, wobbleAmp: 11, size: 3.8,
    color: "#ffffff", glowColor: "rgba(255, 255, 240, 0.7)",
    hasTrail: false, isStar: true,
  },
  {
    id: 20, delay: 3, life: 24,
    vx: -290, vy: 60, curveX: 20, curveY: 30,
    wobbleFreq: 5, wobbleAmp: 8, size: 4.6,
    color: "#ffc107", glowColor: "rgba(255, 190, 30, 0.6)",
    hasTrail: true, isStar: true,
  },
  {
    id: 21, delay: 3, life: 26,
    vx: -130, vy: 100, curveX: -40, curveY: 60,
    wobbleFreq: 10, wobbleAmp: 14, size: 3.3,
    color: "#d0f8e2", glowColor: "rgba(170, 240, 200, 0.5)",
    hasTrail: false, isStar: false,
  },
  {
    id: 22, delay: 4, life: 21,
    vx: -230, vy: 160, curveX: 40, curveY: 50,
    wobbleFreq: 7, wobbleAmp: 10, size: 4.0,
    color: "#ffe082", glowColor: "rgba(255, 220, 110, 0.55)",
    hasTrail: true, isStar: false,
  },
];

// Aroma Leak Particles definition for Right Jar (紫砂微孔跑香)
export interface AromaLeakParticle {
  id: number;
  originX: number; // offset relative to jar center (750)
  originY: number; // offset relative to jar center (890)
  driftX: number;  // lateral dispersion
  riseY: number;   // upward escape
  wobbleSpeed: number;
  wobbleAmp: number;
  size: number;
  phase: number;
}

export const RIGHT_AROMA_LEAK_PARTICLES: AromaLeakParticle[] = [
  { id: 1, originX: -65, originY: -85, driftX: -45, riseY: -130, wobbleSpeed: 0.08, wobbleAmp: 16, size: 5.5, phase: 0.0 },
  { id: 2, originX: 68, originY: -82, driftX: 52, riseY: -140, wobbleSpeed: 0.09, wobbleAmp: 18, size: 6.0, phase: 0.8 },
  { id: 3, originX: -40, originY: -92, driftX: -28, riseY: -160, wobbleSpeed: 0.07, wobbleAmp: 14, size: 4.8, phase: 1.6 },
  { id: 4, originX: 38, originY: -90, driftX: 35, riseY: -155, wobbleSpeed: 0.085, wobbleAmp: 15, size: 5.2, phase: 2.3 },
  { id: 5, originX: -74, originY: -40, driftX: -60, riseY: -110, wobbleSpeed: 0.1, wobbleAmp: 20, size: 4.2, phase: 0.5 },
  { id: 6, originX: 75, originY: -35, driftX: 64, riseY: -115, wobbleSpeed: 0.095, wobbleAmp: 22, size: 4.5, phase: 1.2 },
  { id: 7, originX: -80, originY: 10, driftX: -70, riseY: -90, wobbleSpeed: 0.075, wobbleAmp: 18, size: 3.8, phase: 2.7 },
  { id: 8, originX: 82, originY: 15, driftX: 72, riseY: -95, wobbleSpeed: 0.08, wobbleAmp: 19, size: 4.0, phase: 3.4 },
  { id: 9, originX: -20, originY: -96, driftX: -15, riseY: -175, wobbleSpeed: 0.065, wobbleAmp: 12, size: 6.2, phase: 4.1 },
  { id: 10, originX: 18, originY: -95, driftX: 22, riseY: -170, wobbleSpeed: 0.07, wobbleAmp: 13, size: 5.8, phase: 4.9 },
  { id: 11, originX: -55, originY: -60, driftX: -48, riseY: -125, wobbleSpeed: 0.11, wobbleAmp: 17, size: 4.0, phase: 1.9 },
  { id: 12, originX: 58, originY: -58, driftX: 50, riseY: -130, wobbleSpeed: 0.105, wobbleAmp: 16, size: 4.4, phase: 3.1 },
];
