/**
 * 第 22 期 B5「二层纯铝」逐帧画布（1080×1920）
 * 升级：2.5D 微透视特写镜头 + 多层视差 + 幕一物理阻隔反弹（光线/水汽/纸浆味）
 *       + 幕二强光束体积光与浮尘（镀铝透射光斑 vs 真纯铝完全截断+暗影+金边+折痕高光）
 */
import {
  TAU,
  cameraAt,
  cameraKick,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  lightFloat,
  progress,
  rgba,
  rng,
  springValue,
  type Camera,
  type FxPalette,
} from "../kit/fx";
import { STAGE, type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  beginFrame,
  brushCross,
  brushRing,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawFoilBag } from "../kit/objects";
import {
  ACT1_OUT,
  BLOCK1_AT,
  BLOCK2_AT,
  BLOCK3_AT,
  CREASE_AT,
  FAKE_CROSS,
  FAKE_GLOW,
  FAKE_IN,
  FAKE_OUT,
  FOIL_AT,
  HEAD_AT,
  LENGTH,
  REAL_IN,
  REAL_TAG,
  TEXT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const ASIDE_SPRING = { stiffness: 90, damping: 11, mass: 1 };

// ---------------------------------------------------------------------------
// 2.5D 微透视机位 + 分层视差
// ---------------------------------------------------------------------------

type CamRig = {
  cam: Camera;
  yaw: number;
  pitch: number;
  roll: number;
};

function beatCameraRig(frame: number): CamRig {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.07,
    drift: 5.5,
    focus: [
      { at: FOIL_AT, dur: 20, x: 540, y: 940, zoom: 1.02, pull: 0.16 },
      { at: BLOCK2_AT, dur: 22, x: 515, y: 965, zoom: 1.045, pull: 0.18 },
      { at: FAKE_IN, dur: 22, x: 540, y: 970, zoom: 1.045, pull: 0.2 },
      { at: FAKE_GLOW, dur: 18, x: 540, y: 960, zoom: 1.075, pull: 0.24 },
      { at: REAL_IN, dur: 22, x: 540, y: 970, zoom: 1.045, pull: 0.2 },
      { at: CREASE_AT, dur: 22, x: 645, y: 785, zoom: 1.11, pull: 0.28 },
      { at: REAL_TAG - 8, dur: 20, x: 540, y: 760, zoom: 1.03, pull: 0.22 },
    ],
  });
  for (const [at, amp] of [
    [FAKE_CROSS + 2, 4.8],
    [CREASE_AT + 4, 4.4],
    [REAL_TAG + 2, 5.2],
  ] as const) {
    const k = cameraKick(frame - at, amp);
    cam.x -= k.x;
    cam.y -= k.y;
  }

  const normX = cam.x / 120;
  const normY = cam.y / 160;
  const testSweep =
    easeInOutCubic(progress(frame, FAKE_IN, FAKE_IN + 20)) * Math.sin((frame - FAKE_IN) * 0.032) * 0.26;
  const yaw = Math.max(-1, Math.min(1, normX * 0.85 + testSweep));
  const pitch = Math.max(-1, Math.min(1, normY * 0.85 - 0.08 * Math.cos(frame * 0.022)));
  const roll = -yaw * 0.0078 + Math.sin(frame * 0.016) * 0.0022;

  return { cam, yaw, pitch, roll };
}

function applyPerspective(
  ctx: CanvasRenderingContext2D,
  rig: CamRig,
  strength = 1,
  pivotX = STAGE.width / 2,
  pivotY = STAGE.height / 2,
) {
  ctx.translate(pivotX, pivotY);
  ctx.rotate(rig.roll * strength);
  const sx = 1 - Math.abs(rig.yaw) * 0.018 * strength;
  const sy = 1 - Math.abs(rig.pitch) * 0.016 * strength;
  const skewX = -rig.yaw * 0.014 * strength;
  const skewY = (rig.pitch * 0.01 + rig.yaw * 0.009) * strength;
  ctx.transform(sx, skewY, skewX, sy, 0, 0);
  ctx.translate(-pivotX, -pivotY);
}

function applyDeltaParallax(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  deltaDepth: number,
  pivotX = STAGE.width / 2,
  pivotY = STAGE.height / 2,
) {
  const dx = -cam.x * deltaDepth;
  const dy = -cam.y * deltaDepth;
  const dz = 1 + (cam.scale - 1) * deltaDepth;
  ctx.translate(pivotX + dx, pivotY + dy);
  ctx.scale(dz, dz);
  ctx.translate(-pivotX, -pivotY);
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame, pal, fontScale } = beginFrame(ctx, elapsed, params);
  const rig = beatCameraRig(frame);
  // 强光测试时略压暗环境窗光，让透光 / 挡光对比更鲜明
  const testDim = easeInOutCubic(progress(frame, FAKE_IN, FAKE_IN + 18));
  renderLayers(ctx, frame, pal, rig.cam, {
    leaves: 3,
    light: 1 - testDim * 0.56,
    back: (p) => drawDarkroomBackdrop(ctx, frame, p, rig, testDim),
    subject: (p) => {
      drawActShield(ctx, frame, p, params, fontScale, rig);
      drawActFakeFoil(ctx, frame, p, params, fontScale, rig);
      drawActRealFoil(ctx, frame, p, params, fontScale, rig);
    },
  });
}

// 远景背景光场：幕一轻暖金属光晕，幕二平滑过渡为微暗影棚暗角以突出强光测试
function drawDarkroomBackdrop(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  rig: CamRig,
  testDim: number,
) {
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, -0.14);

  if (testDim > 0.01) {
    // 强光暗室微暗四边（保留宣纸肌理但不抢文字可读性）
    const vig = ctx.createRadialGradient(540, 1000, 180, 540, 1000, 880);
    vig.addColorStop(0, rgba(pal.ink, 0.04 * testDim));
    vig.addColorStop(0.58, rgba(pal.ink, 0.14 * testDim));
    vig.addColorStop(1, rgba(pal.ink, 0.34 * testDim));
    ctx.fillStyle = vig;
    ctx.fillRect(-120, -120, STAGE.width + 240, STAGE.height + 240);
  }

  const act1A = 1 - easeInOutCubic(progress(frame, ACT1_OUT, ACT1_OUT + 12));
  if (act1A > 0.02) {
    const aura = ctx.createRadialGradient(680, 975, 40, 680, 975, 480);
    aura.addColorStop(0, rgba(pal.tea, 0.055 * act1A));
    aura.addColorStop(0.6, rgba(pal.ink, 0.02 * act1A));
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.fillRect(0, 320, STAGE.width, 1260);
  }

  ctx.restore();
}

// ================= 幕一物理阻隔反弹视觉（贴近铝箔左壁） =================
function drawShieldDeflections(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  wallX: number,
) {
  // ① 挡光（y=710）：三束金黄光线射向铝箔左侧被利落弹开
  const p1 = easeOutCubic(progress(frame, BLOCK1_AT, BLOCK1_AT + 16));
  if (p1 > 0.01) {
    ctx.save();
    ctx.globalAlpha *= p1;
    const hitX = wallX - 8;
    const hitY = 710;
    const rays = [
      { dy: -36, bounceAngle: -2.52 },
      { dy: 0, bounceAngle: -2.84 },
      { dy: 36, bounceAngle: 2.66 },
    ];
    rays.forEach((r, idx) => {
      const cycle = ((frame * 0.045 + idx * 0.33) % 1);
      const inStart = hitX - 96;
      const y0 = hitY + r.dy;
      const gRay = ctx.createLinearGradient(inStart, y0 - 12, hitX, y0);
      gRay.addColorStop(0, "rgba(232,175,68,0)");
      gRay.addColorStop(1, `rgba(222,158,42,${(0.75 * p1).toFixed(3)})`);
      ctx.strokeStyle = gRay;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(inStart, y0 - 10);
      ctx.lineTo(hitX, y0);
      ctx.stroke();

      // 反弹折射短束
      const bx = hitX + Math.cos(r.bounceAngle) * (44 + cycle * 28);
      const by = y0 + Math.sin(r.bounceAngle) * (44 + cycle * 28);
      ctx.strokeStyle = `rgba(244,194,88,${((1 - cycle * 0.6) * 0.65 * p1).toFixed(3)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hitX, y0);
      ctx.lineTo(bx, by);
      ctx.stroke();
    });
    // 铝箔墙受光反光点
    const gSpark = ctx.createRadialGradient(hitX + 2, hitY, 2, hitX + 2, hitY, 34);
    gSpark.addColorStop(0, `rgba(255,244,205,${(0.78 * p1).toFixed(3)})`);
    gSpark.addColorStop(1, "rgba(255,220,130,0)");
    ctx.fillStyle = gSpark;
    ctx.beginPath();
    ctx.arc(hitX + 2, hitY, 34, 0, TAU * 0.9995);
    ctx.fill();
    ctx.restore();
  }

  // ② 隔水汽（y=975）：淡青水珠漂至铝箔壁弹回并化开水环
  const p2 = easeOutCubic(progress(frame, BLOCK2_AT, BLOCK2_AT + 16));
  if (p2 > 0.01) {
    ctx.save();
    ctx.globalAlpha *= p2;
    const hitX = wallX - 10;
    const hitY = 975;
    for (let i = 0; i < 4; i++) {
      const tDrop = ((frame * 0.028 + i * 0.25) % 1);
      const approach = tDrop < 0.55 ? tDrop / 0.55 : 1 - (tDrop - 0.55) / 0.45;
      const bounceY = tDrop < 0.55 ? 0 : ((tDrop - 0.55) / 0.45) * (i % 2 === 0 ? -24 : 24);
      const dx = hitX - 88 + approach * 82;
      const dy = hitY + (i - 1.5) * 28 + bounceY;
      const a = Math.sin(tDrop * Math.PI) * 0.72;
      ctx.fillStyle = rgba(pal.bamboo, a * 0.48);
      ctx.strokeStyle = rgba(pal.bamboo, a * 0.85);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dx, dy, 5.5 + (i % 2) * 1.5, 0, TAU * 0.9995);
      ctx.fill();
      ctx.stroke();

      // 撞击瞬间微水环
      if (tDrop > 0.48 && tDrop < 0.76) {
        const rp = (tDrop - 0.48) / 0.28;
        ctx.strokeStyle = rgba(pal.bamboo, (1 - rp) * 0.5);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(hitX - 4, hitY + (i - 1.5) * 28, 6 + rp * 18, 0, TAU * 0.9995);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ③ 隔箱味（y=1240）：牛皮纸褐卷曲气味线撞到铝箔壁即回卷消散
  const p3 = easeOutCubic(progress(frame, BLOCK3_AT, BLOCK3_AT + 16));
  if (p3 > 0.01) {
    ctx.save();
    ctx.globalAlpha *= p3;
    const hitX = wallX - 10;
    const hitY = 1240;
    for (let i = 0; i < 3; i++) {
      const cy = hitY + (i - 1) * 32;
      const phase = frame * 0.065 + i * 1.9;
      ctx.strokeStyle = rgba("#7d5836", 0.52);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hitX - 88, cy + Math.sin(phase) * 7);
      ctx.bezierCurveTo(
        hitX - 52,
        cy - 14 + Math.cos(phase) * 6,
        hitX - 24,
        cy + 12 + Math.sin(phase + 1) * 6,
        hitX - 14,
        cy - 4,
      );
      // 遇阻后向上回卷
      ctx.quadraticCurveTo(hitX - 4, cy - 16, hitX - 22, cy - 22 + Math.sin(phase) * 4);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ================= 幕一：纯铝箔袋阻隔三害 =================
function drawActShield(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
  rig: CamRig,
) {
  const out = easeInOutCubic(progress(frame, ACT1_OUT, ACT1_OUT + 12));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  // 纯铝箔袋落位并随左侧字出现弹簧右让（主体层微透视）
  const fl = frame - FOIL_AT;
  const aside = 170 * springValue(frame - (BLOCK1_AT - 2), ASIDE_SPRING);
  const fx = 540 + aside;
  const fy = 975;

  if (fl > 0) {
    const pose = heavyLand(fl, { drop: 120, fall: 9, squash: 0.05 });
    ctx.save();
    applyPerspective(ctx, rig, 0.72, fx, fy);
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(fx, fy + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawFoilBag(ctx, pal, 410, 520, { pure: true, frame });
    ctx.restore();

    // 贴合铝箔左壁的物理阻隔微动效
    ctx.save();
    applyPerspective(ctx, rig, 0.64, fx, fy);
    drawShieldDeflections(ctx, frame, pal, fx - 205);
    ctx.restore();
  }

  // 前景文字层（轻微正视差）
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, 0.055);
  applyPerspective(ctx, rig, 0.36, 540, 760);

  // 顶部「二层 · 挡住光」
  const hl = frame - HEAD_AT;
  if (hl > 0) {
    const txt = t(params, "head");
    const pose = lightFloat(hl, { rise: 22, sway: 0.5, seed: 3 });
    inkText(ctx, txt, 540, 390 + pose.y, fitSize(txt, 114, 780) * fontScale, easeOutCubic(progress(hl, 0, 14)), 13, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }

  // 左侧三行大字「挡光 / 隔水汽 / 隔箱味」
  const rows: [TextKey, number, number, string][] = [
    ["b1", BLOCK1_AT, 710, pal.tea],
    ["b2", BLOCK2_AT, 975, pal.bamboo],
    ["b3", BLOCK3_AT, 1240, pal.ink],
  ];
  rows.forEach(([key, at, y, color], i) => {
    const l = frame - (at - 4);
    if (l <= 0) return;
    const txt = t(params, key);
    const pose = heavyLand(l, { drop: 64, fall: 6, squash: 0.07 });
    ctx.save();
    ctx.globalAlpha *= Math.min(1, l / 4);
    ctx.translate(275, y + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    inkText(ctx, txt, 0, 0, fitSize(txt, 108, 320) * fontScale, easeOutCubic(progress(l, 0, 12)), 29 + i * 7, {
      color,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
    ctx.restore();
  });

  ctx.restore();
  ctx.restore();
}

// ================= 幕二共用：斜向强光体积光束 + 浮尘 =================
function drawFlashlightBeam(
  ctx: CanvasRenderingContext2D,
  frame: number,
  strength: number,
  opts: { pierced: boolean },
) {
  if (strength <= 0.01) return;
  const { pierced } = opts;

  ctx.save();
  ctx.globalAlpha *= strength;

  const srcX = 56;
  const srcY = 1235;
  const targetX = 540;
  const targetY = 1000;

  // 1) 光源光晕（左下方强光手电口）
  const lampG = ctx.createRadialGradient(srcX, srcY, 6, srcX, srcY, 170);
  lampG.addColorStop(0, "rgba(255,252,235,0.92)");
  lampG.addColorStop(0.28, "rgba(255,226,142,0.52)");
  lampG.addColorStop(1, "rgba(255,205,98,0)");
  ctx.fillStyle = lampG;
  ctx.beginPath();
  ctx.arc(srcX, srcY, 170, 0, TAU * 0.9995);
  ctx.fill();

  // 2) 射向铝箔袋背面的体积光锥
  const endX = pierced ? 1020 : targetX + 120;
  const endY = pierced ? 745 : targetY - 120;
  const beamG = ctx.createLinearGradient(srcX, srcY, endX, endY);
  beamG.addColorStop(0, "rgba(255,246,204,0.62)");
  beamG.addColorStop(0.42, "rgba(255,222,126,0.34)");
  beamG.addColorStop(0.75, pierced ? "rgba(255,212,110,0.2)" : "rgba(255,212,110,0.06)");
  beamG.addColorStop(1, "rgba(255,205,95,0)");

  ctx.fillStyle = beamG;
  ctx.beginPath();
  ctx.moveTo(srcX - 18, srcY - 34);
  ctx.lineTo(endX, endY - (pierced ? 310 : 250));
  ctx.lineTo(endX, endY + (pierced ? 270 : 250));
  ctx.lineTo(srcX + 26, srcY + 38);
  ctx.closePath();
  ctx.fill();

  // 3) 确定性光束内浮动微尘（增加光学空间感）
  const r = rng(2205);
  for (let i = 0; i < 14; i++) {
    const u = r();
    const spread = (r() - 0.5) * 2;
    const speed = 0.008 + r() * 0.012;
    const tPos = (u + frame * speed) % 1;
    // 纯铝不透光时微尘仅出现在袋体左侧光路上
    const maxT = pierced ? 0.94 : 0.44;
    if (tPos > maxT) continue;
    const px = srcX + (endX - srcX) * tPos;
    const py =
      srcY + (endY - srcY) * tPos + spread * (28 + tPos * 195) + Math.sin(frame * 0.05 + i) * 6;
    const radius = 1.6 + r() * 2.4;
    const alpha = Math.sin((tPos / maxT) * Math.PI) * 0.72;
    ctx.fillStyle = `rgba(255,248,218,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, TAU * 0.9995);
    ctx.fill();
  }

  ctx.restore();
}

// 假镀铝透出的前向散射余光（叠加在袋体上方，强化「透亮刺眼」直觉）
function drawFakePiercedSpill(ctx: CanvasRenderingContext2D, frame: number, glow: number) {
  if (glow <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= glow;
  const pulse = 1 + Math.sin(frame * 0.14) * 0.04;
  const spill = ctx.createRadialGradient(540, 1000, 12, 540, 1000, 260 * pulse);
  spill.addColorStop(0, "rgba(255,253,235,0.52)");
  spill.addColorStop(0.35, "rgba(255,232,148,0.24)");
  spill.addColorStop(1, "rgba(255,212,110,0)");
  ctx.fillStyle = spill;
  ctx.beginPath();
  ctx.arc(540, 1000, 260 * pulse, 0, TAU * 0.9995);
  ctx.fill();
  ctx.restore();
}

// 真纯铝截断强光后在右上方投出的干脆暗影锥
function drawPureOpaqueUmbra(ctx: CanvasRenderingContext2D, pal: FxPalette, strength: number) {
  if (strength <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= strength;
  const umb = ctx.createLinearGradient(680, 940, 1040, 720);
  umb.addColorStop(0, rgba(pal.ink, 0.22));
  umb.addColorStop(0.65, rgba(pal.ink, 0.08));
  umb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = umb;
  ctx.beginPath();
  ctx.moveTo(745, 730);
  ctx.lineTo(1060, 560);
  ctx.lineTo(1060, 1140);
  ctx.lineTo(745, 1270);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ================= 幕二A：镀铝袋照强光透亮 × =================
function drawActFakeFoil(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
  rig: CamRig,
) {
  if (frame < FAKE_IN) return;
  const out = easeInOutCubic(progress(frame, FAKE_OUT, FAKE_OUT + 12));
  if (out >= 1) return;

  ctx.save();
  ctx.globalAlpha = 1 - out;

  const glow = easeOutCubic(progress(frame, FAKE_GLOW - 6, FAKE_GLOW + 14));
  const pose = heavyLand(frame - FAKE_IN, { drop: 110, fall: 8, squash: 0.04 });

  // 背后的斜向强光体积光束（透穿）
  drawFlashlightBeam(ctx, frame, glow * 0.95, { pierced: true });

  if (pose.alpha > 0) {
    ctx.save();
    applyPerspective(ctx, rig, 0.78, 540, 1000);
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(540, 1000 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawFoilBag(ctx, pal, 460, 560, { pure: false, backlight: glow, frame });
    ctx.restore();

    drawFakePiercedSpill(ctx, frame, glow * pose.alpha);
  }

  // 前景层：「镀铝 · 透光」+ 朱砂叉
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, 0.055);
  applyPerspective(ctx, rig, 0.36, 540, 740);
  const tl = frame - (FAKE_GLOW - 2);
  if (tl > 0) {
    const txt = t(params, "fake");
    const poseT = lightFloat(tl, { rise: 22, sway: 0.5, seed: 8 });
    inkText(ctx, txt, 540, 420 + poseT.y, fitSize(txt, 116, 780) * fontScale, easeOutCubic(progress(tl, 0, 12)), 53, {
      color: pal.cinnabar,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }
  brushCross(ctx, 540, 990, 440, progress(frame, FAKE_CROSS, FAKE_CROSS + 16), pal.cinnabar, 59, 22);
  ctx.restore();

  ctx.restore();
}

// ================= 幕二B：真纯铝不透光 + 硬折痕不回弹 ✓ =================
function drawActRealFoil(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
  rig: CamRig,
) {
  if (frame < REAL_IN) return;
  const rl = frame - REAL_IN;
  const pose = heavyLand(rl, { drop: 110, fall: 8, squash: 0.04 });
  const crease = easeOutCubic(progress(frame, CREASE_AT, CREASE_AT + 18));
  const beamIn = easeOutCubic(progress(rl, 0, 14));

  // 强光束射到真纯铝背面被 100% 截断 + 右侧暗影锥
  drawFlashlightBeam(ctx, frame, beamIn * 0.96, { pierced: false });
  drawPureOpaqueUmbra(ctx, pal, beamIn * pose.alpha);

  if (pose.alpha > 0) {
    ctx.save();
    applyPerspective(ctx, rig, 0.78, 540, 1000);
    ctx.globalAlpha = pose.alpha;
    ctx.translate(540, 1000 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawFoilBag(ctx, pal, 460, 560, {
      pure: true,
      backlight: 0.96,
      foldCrease: crease,
      frame,
    });
    ctx.restore();
  }

  // 前景层：「真纯铝 · 不透光」+ 竹青笔圈
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, 0.055);
  applyPerspective(ctx, rig, 0.36, 540, 740);
  const tl = frame - (REAL_TAG - 6);
  if (tl > 0) {
    const txt = t(params, "real");
    const poseT = heavyLand(tl, { drop: 60, fall: 6, squash: 0.06 });
    ctx.save();
    ctx.globalAlpha = Math.min(1, tl / 4);
    ctx.translate(540, 420 + poseT.y);
    ctx.scale(poseT.scaleX, poseT.scaleY);
    inkText(ctx, txt, 0, 0, fitSize(txt, 100, 700) * fontScale, easeOutCubic(progress(tl, 0, 12)), 71, {
      color: pal.bamboo,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    ctx.restore();
    brushRing(ctx, 540, 420, 370, 90, progress(tl, 6, 22), rgba(pal.bamboo, 0.85), 77, 7);
  }
  ctx.restore();
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
