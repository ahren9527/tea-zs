import { framesOf } from "@/remotion/shared/theme";

// Landmarks and default texts for Ep19 B5-2: 梅雨大开雷区（视觉规范与动画合同）
export const TITLE_DEFAULT = "雷区二：梅雨大开";
export const STAMP_DEFAULT = "梅雨忌大开补茶 ✖";

// Timeline landmarks: 5.0s (150 frames @ 29.97fps)
export const LENGTH = framesOf(5.0);

// 0. Top title & seal stamp [✖]
export const TITLE_FADE_AT = 0;
export const TITLE_SEAL_STAMP_AT = framesOf(0.4); // 0.4s: stamp drops with back.out(2) from scale(2.0) -> scale(1)

// 1. Environmental threat: Hygrometer spike (0.6s - 1.4s, hit at 0.8s)
export const HYGROMETER_START_AT = framesOf(0.6);
export const HYGROMETER_TICK_AT = framesOf(0.8); // 0.8s: pointer jumps into 85% RH red zone

// 2. Physical moisture downpour & condensation droplets (1.0s - 2.8s)
export const MIST_START_AT = framesOf(1.0); // 1.0s: pale cyan-grey misty air stream pours down
export const DROP_START_AT = framesOf(1.4); // 1.4s: dense water droplets stream down into open pouch

// 3. Tea leaves damp deformation & discoloration (1.4s - 3.2s)
export const LEAF_DAMP_START = framesOf(1.4);
export const LEAF_DAMP_FULL = framesOf(3.2);

// 4. Leader line growth & warning card landing (2.4s - 3.2s)
export const LEADER_START = framesOf(2.4); // 2.4s: vertical red dashed line grows down (90px)
export const STAMP_AT = framesOf(2.4); // 2.4s: warning card bounces in with back.out(1.6)

// Audio helper for web & programmatic triggering (Web Audio API)
export const teaAudio = {
  playStampWood: () => {
    try {
      if (typeof window !== "undefined") {
        const a = new Audio("/tea/sfx/wood-stamp.wav");
        a.volume = 0.85;
        a.play().catch(() => {});
      }
    } catch {
      // ignore
    }
  },
  playAbacusTick: () => {
    try {
      if (typeof window !== "undefined") {
        const a = new Audio("/tea/sfx/abacus-slide.wav");
        a.volume = 0.85;
        a.play().catch(() => {});
      }
    } catch {
      // ignore
    }
  },
  playWaterDrop: () => {
    try {
      if (typeof window !== "undefined") {
        const a = new Audio("/tea/sfx/water-drop.wav");
        a.volume = 0.85;
        a.play().catch(() => {});
      }
    } catch {
      // ignore
    }
  },
  playRainHiss: () => {
    try {
      if (typeof window !== "undefined") {
        const a = new Audio("/tea/sfx/tea-rustle-hiss.wav");
        a.volume = 0.90;
        a.play().catch(() => {});
      }
    } catch {
      // ignore
    }
  },
  playWoodSnap: () => {
    try {
      if (typeof window !== "undefined") {
        const a = new Audio("/tea/sfx/wood.wav");
        a.volume = 0.85;
        a.play().catch(() => {});
      }
    } catch {
      // ignore
    }
  },
};

// SFX Hits for Remotion SfxTrack
export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/tea-rustle-hiss.wav", at: 0, volume: 0.92 }, // 0s 雨声淅沥
    { src: "tea/sfx/ethereal-breeze.wav", at: framesOf(0.4), volume: 0.40 }, // 0.4s 微风
    { src: "tea/sfx/wood-stamp.wav", at: TITLE_SEAL_STAMP_AT, volume: 0.85 }, // 0.4s 印章落印
    { src: "tea/sfx/tea-rustle-hiss.wav", at: framesOf(1.6), volume: 0.88 }, // 1.6s 持续接力雨声
    { src: "tea/sfx/abacus-slide.wav", at: HYGROMETER_TICK_AT, volume: 0.85 }, // 0.8s 湿度表跳针
    { src: "tea/sfx/water-drop.wav", at: framesOf(1.4), volume: 0.85 }, // 1.4s 水汽落袋声
    { src: "tea/sfx/tea-rustle-hiss.wav", at: framesOf(3.2), volume: 0.85 }, // 3.2s 雨声接力
    { src: "tea/sfx/wood.wav", at: STAMP_AT, volume: 0.85 }, // 2.4s 标牌弹出声
  ];
}

// ----------------------------------------------------
// 三层纵深雨景系统：远景微雨丝 + 中景细雨 + 近景自然雨滴 (精细化尺度)
// ----------------------------------------------------

export interface RainStreak {
  id: number;
  x: number;
  length: number;
  speed: number;
  strokeWidth: number;
  opacity: number;
  color: string;
  delay: number;
  dropRadius?: number;
}

// 1. 远景微小细雨丝 (60 根：细腻轻盈、速度慢、透明度柔和)
export const FAR_RAIN_STREAKS: RainStreak[] = Array.from({ length: 60 }, (_, i) => {
  const seed1 = (i * 163 + 41) % 1000;
  const seed2 = (i * 293 + 89) % 1000;
  const seed3 = (i * 433 + 23) % 1000;

  return {
    id: i,
    x: -80 + (seed1 % 1240),
    length: 36 + (seed2 % 34), // 36px ~ 70px
    speed: 1.6 + (seed3 % 60) / 100, // 1.6s ~ 2.2s 缓慢飘洒
    strokeWidth: 0.8 + (seed1 % 4) / 10, // 0.8px ~ 1.1px
    opacity: 0.16 + (seed2 % 14) / 100, // 0.16 ~ 0.30 柔和微朦胧
    color: "#90A4AE",
    delay: (seed3 % 180) / 100,
  };
});

// 2. 中景连绵细雨丝 (42 根：清秀骨架、适中密度)
export const MID_RAIN_STREAKS: RainStreak[] = Array.from({ length: 42 }, (_, i) => {
  const seed1 = (i * 181 + 53) % 1000;
  const seed2 = (i * 317 + 97) % 1000;
  const seed3 = (i * 457 + 31) % 1000;

  return {
    id: i,
    x: -80 + (seed1 % 1240),
    length: 75 + (seed2 % 45), // 75px ~ 120px
    speed: 0.95 + (seed3 % 35) / 100, // 0.95s ~ 1.30s
    strokeWidth: 1.2 + (seed1 % 5) / 10, // 1.2px ~ 1.6px
    opacity: 0.35 + (seed2 % 16) / 100, // 0.35 ~ 0.51
    color: "#546E7A",
    delay: (seed3 % 120) / 100,
    dropRadius: 1.4,
  };
});

// 3. 近景特写雨滴与粗雨丝 (24 根：高对比度、快速掠过、小巧精致水珠头)
export const NEAR_RAIN_STREAKS: RainStreak[] = Array.from({ length: 24 }, (_, i) => {
  const seed1 = (i * 197 + 59) % 1000;
  const seed2 = (i * 337 + 107) % 1000;
  const seed3 = (i * 487 + 37) % 1000;

  return {
    id: i,
    x: -100 + (seed1 % 1280),
    length: 130 + (seed2 % 70), // 130px ~ 200px
    speed: 0.45 + (seed3 % 22) / 100, // 0.45s ~ 0.67s 疾速划落
    strokeWidth: 1.8 + (seed1 % 8) / 10, // 1.8px ~ 2.5px（调小精致）
    opacity: 0.65 + (seed2 % 22) / 100, // 0.65 ~ 0.87 清晰可见
    color: "#263238", // 深沉雨青色
    delay: (seed3 % 50) / 100,
    dropRadius: 2.1 + (seed2 % 8) / 10, // 2.1px ~ 2.8px（调小精致，绝不突兀）
  };
});

// ----------------------------------------------------
// 物理直灌水滴 (Moisture Drops: 36 颗清澈精致小水珠)
// ----------------------------------------------------

export interface MoistureDroplet {
  id: number;
  startTime: number;
  duration: number;
  x0: number;
  y0: number;
  y1: number;
  r: number;
  opacity: number;
}

export const MOISTURE_DROPS: MoistureDroplet[] = Array.from({ length: 36 }, (_, i) => {
  const seed1 = (i * 137 + 29) % 1000;
  const seed2 = (i * 269 + 83) % 1000;
  const seed3 = (i * 397 + 17) % 1000;

  const startTime = 1.05 + i * 0.045; // 1.05s ~ 2.65s
  const duration = 0.52 + (seed1 % 24) / 100;

  const x0 = 350 + (seed2 % 160);
  const y0 = 175 + (seed3 % 50);
  const y1 = 430 + (seed1 % 28);

  return {
    id: i,
    startTime,
    duration,
    x0,
    y0,
    y1,
    r: 2.6 + (seed1 % 16) / 10, // 2.6px ~ 4.1px 精巧自然水滴
    opacity: 0.85 + (seed3 % 15) / 100,
  };
});

/**
 * 确定性计算水滴位置状态 (Canvas 2D 导出用)
 */
export function getDropletState(d: MoistureDroplet, time: number) {
  const dt = time - d.startTime;
  if (dt < 0 || dt > d.duration) return null;

  const prog = dt / d.duration;
  const ease = prog * prog;
  const y = d.y0 + (d.y1 - d.y0) * ease;
  const opacity = prog < 0.15 ? (prog / 0.15) * d.opacity : prog > 0.85 ? ((1 - prog) / 0.15) * d.opacity : d.opacity;

  return { x: d.x0, y, r: d.r, opacity };
}
