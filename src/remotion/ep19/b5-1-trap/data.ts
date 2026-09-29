import { framesOf } from "@/remotion/shared/theme";

// Landmarks and default texts for Ep19 B5-1: 吸异味雷区（终极视觉与动画规范）
export const TITLE_DEFAULT = "雷区一：极易吸味";
export const STAMP_DEFAULT = "避开厨房油烟 ✖";

// Timeline landmarks: 5.0s (150 frames @ 29.97fps)
export const LENGTH = framesOf(5.0);

// 0. Top title & seal stamp [✖]
export const TITLE_FADE_AT = 0;
export const TITLE_SEAL_STAMP_AT = framesOf(0.4); // 0.4s: stamp drops with back.out(2)

// 1. Organic cloud smoke eruption (0.65s - 3.2s)
export const SMOKE_START_AT = framesOf(0.65); // 0.65s: Oil heats up and billowing cloud smoke rises
export const SMOKE_OVER_JAR_AT = framesOf(1.35); // 1.35s: Clouds drift over and settle into porcelain jar

// 2. White tea discoloration & physical deterioration (1.4s - 3.0s)
export const LEAF_DISCOLOR_START = framesOf(1.4); // 1.4s: leaves begin dulling from fresh green to oxidized yellowish-brown
export const LEAF_DISCOLOR_FULL = framesOf(2.9); // 2.9s: discoloration fully completed

// 3. Leader line growth & warning card landing (2.4s - 3.2s)
export const LEADER_START = framesOf(2.4); // 2.4s: vertical red dashed line grows down
export const STAMP_AT = framesOf(2.5); // 2.5s: warning card bounces in with back.out(1.6)

// Audio helper for web & programmatic triggering
export const teaAudio = {
  playStampWood: () => {
    try {
      if (typeof window !== "undefined") {
        const a = new Audio("/tea/sfx/wood-stamp.wav");
        a.volume = 0.75;
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
        a.volume = 0.75;
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
    { src: "tea/sfx/paper.wav", at: 0, volume: 0.35 },
    { src: "tea/sfx/wood-stamp.wav", at: TITLE_SEAL_STAMP_AT, volume: 0.75 },
    { src: "tea/sfx/tea-rustle-hiss.wav", at: SMOKE_START_AT, volume: 0.45 },
    { src: "tea/sfx/tea-rustle-hiss.wav", at: SMOKE_OVER_JAR_AT, volume: 0.35 },
    { src: "tea/sfx/wood.wav", at: STAMP_AT, volume: 0.78 },
  ];
}

// ----------------------------------------------------
// 纯团状油烟模型（彻底去除所有线条！纯粹的蓬松云团与团团翻滚）
// ----------------------------------------------------

export interface SmokeCloudPuff {
  id: number;
  startTime: number;
  duration: number;
  // Starting point (at pan surface)
  x0: number;
  y0: number;
  r0: number;
  // Mid rising point (expanding into billow)
  x1: number;
  y1: number;
  r1: number;
  // Approaching jar or mid-air
  x2: number;
  y2: number;
  r2: number;
  // Settling into jar or dissipating
  x3: number;
  y3: number;
  r3: number;
  maxOpacity: number;
  target: "jar" | "air";
}

// 24 组团状烟雾（无任何单线条！全部为柔和渐变的云团）
// 14 组向右侧跨越翻滚，柔顺沉降渗透进茶罐口；10 组在锅口上空向上漫散成环境烟雾
export const CLOUD_PUFFS: SmokeCloudPuff[] = Array.from({ length: 24 }, (_, i) => {
  const seed1 = (i * 149 + 37) % 1000;
  const seed2 = (i * 263 + 89) % 1000;
  const seed3 = (i * 389 + 23) % 1000;

  const isJar = i % 12 < 7; // 约 60% 进罐，40% 升空
  const startTime = 0.65 + i * 0.085;
  const duration = 2.1 + (seed1 % 40) / 100; // 2.1s ~ 2.5s

  // 锅底热油源头 (X: 185 ~ 225, Y: 606 ~ 622)
  const x0 = 205 + ((seed1 % 36) - 18);
  const y0 = 614 + ((seed2 % 14) - 7);
  const r0 = 22 + (seed3 % 12);

  // 阶段 1：锅口上方急剧膨胀的翻滚云头
  const x1 = 265 + ((seed2 % 80) - 40);
  const y1 = 440 + ((seed3 % 60) - 30);
  const r1 = 52 + (seed1 % 22);

  let x2: number, y2: number, r2: number;
  let x3: number, y3: number, r3: number;

  if (isJar) {
    // 阶段 2：空中向茶罐方向推进的大团烟云
    x2 = 490 + ((seed3 % 90) - 45);
    y2 = 270 + ((seed1 % 60) - 30);
    r2 = 68 + (seed2 % 24);

    // 阶段 3：在茶罐口上方聚集收敛，缓缓沉入罐口内
    x3 = 682 + ((seed1 % 28) - 14);
    y3 = 445 + ((seed2 % 24) - 12);
    r3 = 26 + (seed3 % 10);
  } else {
    // 阶段 2：在中高空自然漫步扩散的团雾
    x2 = 320 + ((seed2 % 140) - 70);
    y2 = 240 + ((seed3 % 90) - 45);
    r2 = 75 + (seed1 % 30);

    // 阶段 3：高空彻底散逸变淡
    x3 = 380 + ((seed3 % 180) - 90);
    y3 = 110 + ((seed1 % 70) - 35);
    r3 = 95 + (seed2 % 35);
  }

  // 温润半透明 (0.24 ~ 0.38)
  const maxOpacity = 0.24 + (seed1 % 15) / 100;

  return {
    id: i,
    startTime,
    duration,
    x0,
    y0,
    r0,
    x1,
    y1,
    r1,
    x2,
    y2,
    r2,
    x3,
    y3,
    r3,
    maxOpacity,
    target: isJar ? "jar" : "air",
  };
});

/**
 * 确定性计算团状烟雾在指定时间下的插值状态 (Canvas 2D 导出用)
 */
export function getCloudPuffState(p: SmokeCloudPuff, time: number) {
  const dt = time - p.startTime;
  if (dt < 0 || dt > p.duration) return null;

  const s1 = p.duration * 0.30;
  const s2 = p.duration * 0.40;
  const s3 = p.duration * 0.30;

  let x = p.x0;
  let y = p.y0;
  let r = p.r0;
  let opacity = 0;

  if (dt <= s1) {
    const prog = dt / s1;
    const ease = 1 - (1 - prog) * (1 - prog); // power2.out
    x = p.x0 + (p.x1 - p.x0) * ease;
    y = p.y0 + (p.y1 - p.y0) * ease;
    r = p.r0 + (p.r1 - p.r0) * ease;
    opacity = p.maxOpacity * ease;
  } else if (dt <= s1 + s2) {
    const prog = (dt - s1) / s2;
    const ease = -(Math.cos(Math.PI * prog) - 1) / 2; // sine.inOut
    x = p.x1 + (p.x2 - p.x1) * ease;
    y = p.y1 + (p.y2 - p.y1) * ease;
    r = p.r1 + (p.r2 - p.r1) * ease;
    opacity = p.maxOpacity * (1 - prog * 0.15);
  } else {
    const prog = (dt - s1 - s2) / s3;
    const ease = prog * prog; // power2.in
    x = p.x2 + (p.x3 - p.x2) * ease;
    y = p.y2 + (p.y3 - p.y2) * ease;
    r = p.r2 + (p.r3 - p.r2) * ease;
    opacity = p.maxOpacity * 0.85 * (1 - prog);
  }

  return { x, y, r, opacity };
}
