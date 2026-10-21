/**
 * fx/springs — 三种手感的弹簧预设（纯函数，帧 → 姿态）。
 *   heavy：茶饼 / 印章 —— 有分量地落下，触地压扁一点再弹回。
 *   light：叶片 / 香气 —— 慢慢浮起，轻轻荡开。
 *   seal ：盖章 —— 先提起（预备），再快速压下，印泥向外洇开。
 * 都是解析解（不累积状态），任意帧可直接求值，Comp 与 draw 结果一致。
 */
import { clamp01, easeInOutSine, easeOutExpo, progress } from "./math";

export type SpringConfig = { stiffness: number; damping: number; mass: number };

export const SPRINGS = {
  heavy: { stiffness: 210, damping: 17, mass: 1.4 },
  light: { stiffness: 38, damping: 9.5, mass: 1 },
  seal: { stiffness: 520, damping: 26, mass: 1.1 },
} satisfies Record<string, SpringConfig>;

/** 阻尼弹簧 0→1（可过冲）。local：相对起始帧的帧数 */
export function springValue(local: number, cfg: SpringConfig, fps = 29.97) {
  if (local <= 0) return 0;
  const t = local / fps;
  const w0 = Math.sqrt(cfg.stiffness / cfg.mass);
  const zeta = cfg.damping / (2 * Math.sqrt(cfg.stiffness * cfg.mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

export type Pose = {
  /** 0..1 入场进度（可能略 >1 过冲） */
  p: number;
  /** 竖直偏移 px（负 = 上） */
  y: number;
  scaleX: number;
  scaleY: number;
  /** 弧度 */
  rot: number;
  /** 透明度 0..1 */
  alpha: number;
};

/**
 * heavy：从 drop px 高处落下（先加速），触地压扁 squash，再回弹一次。
 * local 相对开始下落的帧；fall 是下落用的帧数。
 */
export function heavyLand(local: number, opts: { drop?: number; fall?: number; squash?: number; tilt?: number } = {}): Pose {
  const { drop = 120, fall = 11, squash = 0.07, tilt = 0 } = opts;
  if (local <= 0) return { p: 0, y: -drop, scaleX: 1, scaleY: 1, rot: tilt, alpha: 0 };
  const fp = clamp01(local / fall);
  const y = -drop * (1 - fp * fp); // 重力：先慢后快
  const alpha = clamp01(local / 4);
  if (fp < 1) {
    const stretch = 0.02 * fp; // 下落时微微拉长
    return { p: fp * 0.9, y, scaleX: 1 - stretch, scaleY: 1 + stretch, rot: tilt * (1 - fp), alpha };
  }
  // 触地：用阻尼振荡描述「压扁 → 回弹」
  const after = local - fall;
  const osc = Math.exp(-after * 0.24) * Math.cos(after * 0.62);
  const sq = squash * osc;
  const bounce = Math.max(0, -osc) * drop * 0.035; // 回弹时离地一点点
  return { p: 1, y: -bounce, scaleX: 1 + sq, scaleY: 1 - sq * 1.2, rot: 0, alpha };
}

/** light：慢慢浮起 rise px，到位后保留很轻的上下荡（float） */
export function lightFloat(local: number, opts: { rise?: number; sway?: number; seed?: number } = {}): Pose {
  const { rise = 36, sway = 4, seed = 0 } = opts;
  const s = springValue(local, SPRINGS.light);
  const t = Math.max(0, local) / 30;
  const drift = Math.sin(t * 1.7 + seed) * sway * clamp01(local / 20);
  return {
    p: s,
    y: (1 - s) * rise + drift,
    scaleX: 0.96 + 0.04 * s,
    scaleY: 0.96 + 0.04 * s,
    rot: (Math.sin(t * 1.1 + seed * 2) * 1.2 * Math.PI) / 180,
    alpha: clamp01(local / 14),
  };
}

export type SealPose = Pose & {
  /** 印泥洇开 0..1（压下后） */
  ink: number;
  /** 是否已经接触纸面 */
  contact: boolean;
};

/**
 * seal：lift 帧提起（预备动作，上提 + 放大 + 微转），press 帧砸下，之后印泥洇开、印面回弹。
 * local 相对动作开始帧。press 帧之后才算盖上。
 */
export function sealPress(local: number, opts: { lift?: number; press?: number; height?: number; rot?: number } = {}): SealPose {
  const { lift = 9, press = 4, height = 70, rot = -0.07 } = opts;
  if (local <= 0) return { p: 0, y: -height * 0.6, scaleX: 1.12, scaleY: 1.12, rot: rot * 2.2, alpha: 0, ink: 0, contact: false };
  // 1) 预备：从略高处出现并继续上提
  if (local < lift) {
    const a = easeInOutSine(local / lift);
    return {
      p: 0.3 * a,
      y: -height * (0.6 + 0.4 * a),
      scaleX: 1.12 + 0.08 * a,
      scaleY: 1.12 + 0.08 * a,
      rot: rot * (2.2 + 0.4 * a),
      alpha: clamp01(local / 4),
      ink: 0,
      contact: false,
    };
  }
  // 2) 砸下：加速
  const l2 = local - lift;
  if (l2 < press) {
    const a = (l2 / press) ** 2;
    return { p: 0.3 + 0.7 * a, y: -height * (1 - a), scaleX: 1.2 - 0.2 * a, scaleY: 1.2 - 0.2 * a, rot: rot * (2.6 - 1.6 * a), alpha: 1, ink: 0, contact: false };
  }
  // 3) 接触：压扁回弹，印泥洇开
  const l3 = l2 - press;
  const osc = Math.exp(-l3 * 0.35) * Math.cos(l3 * 0.9);
  return {
    p: 1,
    y: 0,
    scaleX: 1 + 0.035 * osc,
    scaleY: 1 - 0.035 * osc,
    rot,
    alpha: 1,
    ink: easeOutExpo(progress(l3, 0, 20)),
    contact: true,
  };
}
