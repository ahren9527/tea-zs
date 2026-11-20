/**
 * 第 22 期 B5「二层纯铝」逐帧画布（1080×1920）
 * 升级：统一三层章节标题 + 开场承接 B4 贴身 PE 素雪茶饼位置、纯铝袋合拢套上 +
 *       主体放大至画幅 52–54% + 避开右侧 120px / 底部 300px + 冷银高光对比 + 尾帧 0.5s 静止
 */
import {
  END_STILL_FRAMES,
  TAU,
  cameraAt,
  cameraKick,
  clamp01,
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
  drawChapterTitle,
  fitSize,
  inkText,
  renderLayers,
  textOf,
} from "../kit/draw-kit";
import { drawFoilBag, drawPeBag, drawSuxueCake } from "../kit/objects";
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
const SAFE_CX = 520;
const STILL_START = Math.max(0, LENGTH - END_STILL_FRAMES);

// ---------------------------------------------------------------------------
// 2.5D 微透视机位 + 分层视差（尾段 0.5 秒平滑归静）
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
    to: 1.055,
    drift: 4.5,
    focus: [
      { at: FOIL_AT, dur: 18, x: SAFE_CX, y: 1000, zoom: 1.015, pull: 0.14 },
      { at: BLOCK2_AT, dur: 22, x: 505, y: 985, zoom: 1.035, pull: 0.16 },
      { at: FAKE_IN, dur: 22, x: SAFE_CX, y: 1010, zoom: 1.035, pull: 0.18 },
      { at: FAKE_GLOW, dur: 18, x: SAFE_CX, y: 1000, zoom: 1.06, pull: 0.22 },
      { at: REAL_IN, dur: 22, x: SAFE_CX, y: 1010, zoom: 1.035, pull: 0.18 },
      { at: CREASE_AT, dur: 22, x: 625, y: 800, zoom: 1.08, pull: 0.24 },
      { at: REAL_TAG - 8, dur: 20, x: SAFE_CX, y: 840, zoom: 1.02, pull: 0.16 },
    ],
  });
  for (const [at, amp] of [
    [FAKE_CROSS + 2, 4.6],
    [CREASE_AT + 4, 4.2],
    [REAL_TAG + 2, 4.8],
  ] as const) {
    const k = cameraKick(frame - at, amp);
    cam.x -= k.x;
    cam.y -= k.y;
  }

  // 最后 0.5 秒平缓收敛透视摇移，保证剪辑切换干净静止
  const tailDamp = 1 - easeInOutCubic(progress(frame, STILL_START - 12, STILL_START));
  const normX = cam.x / 120;
  const normY = cam.y / 160;
  const testSweep =
    easeInOutCubic(progress(frame, FAKE_IN, FAKE_IN + 20)) * Math.sin((frame - FAKE_IN) * 0.032) * 0.22 * tailDamp;
  const yaw = Math.max(-1, Math.min(1, normX * 0.78 + testSweep)) * tailDamp;
  const pitch = Math.max(-1, Math.min(1, normY * 0.78 - 0.06 * Math.cos(frame * 0.022))) * tailDamp;
  const roll = (-yaw * 0.007 + Math.sin(frame * 0.016) * 0.0018) * tailDamp;

  return { cam, yaw, pitch, roll };
}

function applyPerspective(
  ctx: CanvasRenderingContext2D,
  rig: CamRig,
  strength = 1,
  pivotX = SAFE_CX,
  pivotY = STAGE.height / 2,
) {
  ctx.translate(pivotX, pivotY);
  ctx.rotate(rig.roll * strength);
  const sx = 1 - Math.abs(rig.yaw) * 0.016 * strength;
  const sy = 1 - Math.abs(rig.pitch) * 0.014 * strength;
  const skewX = -rig.yaw * 0.012 * strength;
  const skewY = (rig.pitch * 0.009 + rig.yaw * 0.008) * strength;
  ctx.transform(sx, skewY, skewX, sy, 0, 0);
  ctx.translate(-pivotX, -pivotY);
}

function applyDeltaParallax(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  deltaDepth: number,
  pivotX = SAFE_CX,
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
  const stillFrame = Math.min(frame, STILL_START);
  // 强光测试时略压暗环境窗光，让透光 / 挡光对比更鲜明
  const testDim = easeInOutCubic(progress(frame, FAKE_IN, FAKE_IN + 18));
  renderLayers(ctx, stillFrame, pal, rig.cam, {
    leaves: 3,
    light: 1 - testDim * 0.56,
    back: (p) => drawDarkroomBackdrop(ctx, frame, p, rig, testDim),
    subject: (p) => {
      drawActShield(ctx, frame, p, params, fontScale, rig);
      drawActFakeFoil(ctx, frame, p, params, fontScale, rig);
      drawActRealFoil(ctx, frame, stillFrame, p, params, fontScale, rig);
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
    const vig = ctx.createRadialGradient(SAFE_CX, 1020, 180, SAFE_CX, 1020, 880);
    vig.addColorStop(0, rgba(pal.ink, 0.04 * testDim));
    vig.addColorStop(0.58, rgba(pal.ink, 0.14 * testDim));
    vig.addColorStop(1, rgba(pal.ink, 0.34 * testDim));
    ctx.fillStyle = vig;
    ctx.fillRect(-120, -120, STAGE.width + 240, STAGE.height + 240);
  }

  const act1A = 1 - easeInOutCubic(progress(frame, ACT1_OUT, ACT1_OUT + 12));
  if (act1A > 0.02) {
    const aura = ctx.createRadialGradient(660, 1020, 40, 660, 1020, 480);
    aura.addColorStop(0, rgba(pal.tea, 0.055 * act1A));
    aura.addColorStop(0.6, rgba(pal.ink, 0.02 * act1A));
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.fillRect(0, 320, STAGE.width, 1260);
  }

  ctx.restore();
}

// ================= 幕一物理阻隔反弹视觉（贴近铝箔左壁，位于左字与右袋间隙） =================
function drawShieldDeflections(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  wallX: number,
) {
  // ① 挡光（y=750）：三束金黄光线射向铝箔左侧被利落弹开
  const p1 = easeOutCubic(progress(frame, BLOCK1_AT, BLOCK1_AT + 16));
  if (p1 > 0.01) {
    ctx.save();
    ctx.globalAlpha *= p1;
    const hitX = wallX - 6;
    const hitY = 750;
    const rays = [
      { dy: -32, bounceAngle: -2.52 },
      { dy: 0, bounceAngle: -2.84 },
      { dy: 32, bounceAngle: 2.66 },
    ];
    rays.forEach((r, idx) => {
      const cycle = (frame * 0.045 + idx * 0.33) % 1;
      const inStart = hitX - 78;
      const y0 = hitY + r.dy;
      const gRay = ctx.createLinearGradient(inStart, y0 - 10, hitX, y0);
      gRay.addColorStop(0, "rgba(232,175,68,0)");
      gRay.addColorStop(1, `rgba(222,158,42,${(0.78 * p1).toFixed(3)})`);
      ctx.strokeStyle = gRay;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(inStart, y0 - 9);
      ctx.lineTo(hitX, y0);
      ctx.stroke();

      const bx = hitX + Math.cos(r.bounceAngle) * (36 + cycle * 24);
      const by = y0 + Math.sin(r.bounceAngle) * (36 + cycle * 24);
      ctx.strokeStyle = `rgba(244,194,88,${((1 - cycle * 0.6) * 0.68 * p1).toFixed(3)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hitX, y0);
      ctx.lineTo(bx, by);
      ctx.stroke();
    });
    const gSpark = ctx.createRadialGradient(hitX + 2, hitY, 2, hitX + 2, hitY, 32);
    gSpark.addColorStop(0, `rgba(255,244,205,${(0.8 * p1).toFixed(3)})`);
    gSpark.addColorStop(1, "rgba(255,220,130,0)");
    ctx.fillStyle = gSpark;
    ctx.beginPath();
    ctx.arc(hitX + 2, hitY, 32, 0, TAU * 0.9995);
    ctx.fill();
    ctx.restore();
  }

  // ② 隔水汽（y=1010）：淡青水珠漂至铝箔壁弹回并化开水环
  const p2 = easeOutCubic(progress(frame, BLOCK2_AT, BLOCK2_AT + 16));
  if (p2 > 0.01) {
    ctx.save();
    ctx.globalAlpha *= p2;
    const hitX = wallX - 8;
    const hitY = 1010;
    for (let i = 0; i < 4; i++) {
      const tDrop = (frame * 0.028 + i * 0.25) % 1;
      const approach = tDrop < 0.55 ? tDrop / 0.55 : 1 - (tDrop - 0.55) / 0.45;
      const bounceY = tDrop < 0.55 ? 0 : ((tDrop - 0.55) / 0.45) * (i % 2 === 0 ? -22 : 22);
      const dx = hitX - 74 + approach * 68;
      const dy = hitY + (i - 1.5) * 26 + bounceY;
      const a = Math.sin(tDrop * Math.PI) * 0.74;
      ctx.fillStyle = rgba(pal.bamboo, a * 0.48);
      ctx.strokeStyle = rgba(pal.bamboo, a * 0.86);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dx, dy, 5.5 + (i % 2) * 1.5, 0, TAU * 0.9995);
      ctx.fill();
      ctx.stroke();

      if (tDrop > 0.48 && tDrop < 0.76) {
        const rp = (tDrop - 0.48) / 0.28;
        ctx.strokeStyle = rgba(pal.bamboo, (1 - rp) * 0.52);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(hitX - 4, hitY + (i - 1.5) * 26, 6 + rp * 16, 0, TAU * 0.9995);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ③ 隔箱味（y=1270）：牛皮纸褐卷曲气味线撞到铝箔壁即回卷消散
  const p3 = easeOutCubic(progress(frame, BLOCK3_AT, BLOCK3_AT + 16));
  if (p3 > 0.01) {
    ctx.save();
    ctx.globalAlpha *= p3;
    const hitX = wallX - 8;
    const hitY = 1270;
    for (let i = 0; i < 3; i++) {
      const cy = hitY + (i - 1) * 30;
      const phase = frame * 0.065 + i * 1.9;
      ctx.strokeStyle = rgba("#7d5836", 0.54);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hitX - 74, cy + Math.sin(phase) * 7);
      ctx.bezierCurveTo(
        hitX - 46,
        cy - 14 + Math.cos(phase) * 6,
        hitX - 22,
        cy + 12 + Math.sin(phase + 1) * 6,
        hitX - 12,
        cy - 4,
      );
      ctx.quadraticCurveTo(hitX - 4, cy - 16, hitX - 20, cy - 22 + Math.sin(phase) * 4);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ================= 幕一：承接 B4 贴身 PE 素雪茶饼 → 套上纯铝箔袋阻隔三害 =================
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

  // 开场 0..26 帧：承接 B4 尾帧位于 (520, 1030) 的贴身 PE 素雪茶饼，纯铝箔袋顺滑套合封上（零空帧）
  const wrapClose = easeInOutCubic(progress(frame, FOIL_AT, FOIL_AT + 28));
  const openFlap = Math.max(0, (1 - wrapClose) * 0.62);
  const bagRise = (1 - easeOutCubic(clamp01((frame + 2) / 14))) * 26;

  // 随左侧三行字出现，主体带弹性弹簧右让并微缩，确保右侧边缘 <= 921 (< 960)
  const asideP = springValue(frame - (BLOCK1_AT - 2), ASIDE_SPRING);
  const bagScale = 1 - 0.22 * clamp01(asideP);
  const fx = SAFE_CX + 175 * asideP;
  const fy = 1030;
  const bagW = 580;
  const bagH = 660;

  ctx.save();
  applyPerspective(ctx, rig, 0.72, fx, fy);
  ctx.translate(fx, fy + bagRise);
  ctx.scale(bagScale, bagScale);
  drawFoilBag(ctx, pal, bagW, bagH, {
    pure: true,
    openFlap,
    frame,
    inside:
      openFlap > 0.02
        ? () => {
            drawPeBag(ctx, pal, 500, 520, {
              mode: "flat",
              thickEdge: 0.72,
              inside: () => drawSuxueCake(ctx, pal, 195, { seed: 22 }),
            });
          }
        : undefined,
  });
  ctx.restore();

  // 贴合铝箔左壁的物理阻隔微动效
  ctx.save();
  applyPerspective(ctx, rig, 0.64, fx, fy);
  drawShieldDeflections(ctx, frame, pal, fx - (bagW * bagScale) / 2);
  ctx.restore();

  // 前景文字层
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, 0.05);
  applyPerspective(ctx, rig, 0.34, SAFE_CX, 760);

  // 顶部统一三层章节标题「二层 · 挡住光」（0.5 秒内落定，带淡墨晕）
  drawChapterTitle(ctx, frame, pal, t(params, "head"), fontScale, {
    at: HEAD_AT,
    color: pal.ink,
    seed: 25,
  });

  // 左侧三行大字「挡光 / 隔水汽 / 隔箱味」（安全左区 x=220，与右移后的铝箔袋拉开 ~89px 间距）
  const rows: [TextKey, number, number, string][] = [
    ["b1", BLOCK1_AT, 750, pal.tea],
    ["b2", BLOCK2_AT, 1010, pal.bamboo],
    ["b3", BLOCK3_AT, 1270, pal.ink],
  ];
  rows.forEach(([key, at, y, color], i) => {
    const l = frame - (at - 4);
    if (l <= 0) return;
    const txt = t(params, key);
    const pose = heavyLand(l, { drop: 58, fall: 6, squash: 0.065 });
    ctx.save();
    ctx.globalAlpha *= Math.min(1, l / 4);
    ctx.translate(220, y + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    inkText(ctx, txt, 0, 0, fitSize(txt, 106, 310) * fontScale, easeOutCubic(progress(l, 0, 12)), 29 + i * 7, {
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
  animFrame: number,
  strength: number,
  opts: { pierced: boolean },
) {
  if (strength <= 0.01) return;
  const { pierced } = opts;

  ctx.save();
  ctx.globalAlpha *= strength;

  const srcX = 56;
  const srcY = 1265;
  const targetX = SAFE_CX;
  const targetY = 1030;

  // 1) 光源光晕（左下方强光手电口）
  const lampG = ctx.createRadialGradient(srcX, srcY, 6, srcX, srcY, 175);
  lampG.addColorStop(0, "rgba(255,252,235,0.92)");
  lampG.addColorStop(0.28, "rgba(255,226,142,0.52)");
  lampG.addColorStop(1, "rgba(255,205,98,0)");
  ctx.fillStyle = lampG;
  ctx.beginPath();
  ctx.arc(srcX, srcY, 175, 0, TAU * 0.9995);
  ctx.fill();

  // 2) 射向铝箔袋背面的体积光锥
  const endX = pierced ? 960 : targetX + 120;
  const endY = pierced ? 775 : targetY - 110;
  const beamG = ctx.createLinearGradient(srcX, srcY, endX, endY);
  beamG.addColorStop(0, "rgba(255,246,204,0.62)");
  beamG.addColorStop(0.42, "rgba(255,222,126,0.34)");
  beamG.addColorStop(0.75, pierced ? "rgba(255,212,110,0.2)" : "rgba(255,212,110,0.06)");
  beamG.addColorStop(1, "rgba(255,205,95,0)");

  ctx.fillStyle = beamG;
  ctx.beginPath();
  ctx.moveTo(srcX - 18, srcY - 34);
  ctx.lineTo(endX, endY - (pierced ? 300 : 250));
  ctx.lineTo(endX, endY + (pierced ? 260 : 250));
  ctx.lineTo(srcX + 26, srcY + 38);
  ctx.closePath();
  ctx.fill();

  // 3) 确定性光束内浮动微尘
  const r = rng(2205);
  for (let i = 0; i < 14; i++) {
    const u = r();
    const spread = (r() - 0.5) * 2;
    const speed = 0.008 + r() * 0.012;
    const tPos = (u + animFrame * speed) % 1;
    const maxT = pierced ? 0.92 : 0.44;
    if (tPos > maxT) continue;
    const px = srcX + (endX - srcX) * tPos;
    const py =
      srcY + (endY - srcY) * tPos + spread * (28 + tPos * 185) + Math.sin(animFrame * 0.05 + i) * 6;
    const radius = 1.6 + r() * 2.4;
    const alpha = Math.sin((tPos / maxT) * Math.PI) * 0.72;
    ctx.fillStyle = `rgba(255,248,218,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, TAU * 0.9995);
    ctx.fill();
  }

  ctx.restore();
}

// 假镀铝透出的前向散射余光
function drawFakePiercedSpill(ctx: CanvasRenderingContext2D, frame: number, glow: number) {
  if (glow <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= glow;
  const pulse = 1 + Math.sin(frame * 0.14) * 0.04;
  const spill = ctx.createRadialGradient(SAFE_CX, 1030, 14, SAFE_CX, 1030, 290 * pulse);
  spill.addColorStop(0, "rgba(255,253,235,0.54)");
  spill.addColorStop(0.35, "rgba(255,232,148,0.25)");
  spill.addColorStop(1, "rgba(255,212,110,0)");
  ctx.fillStyle = spill;
  ctx.beginPath();
  ctx.arc(SAFE_CX, 1030, 290 * pulse, 0, TAU * 0.9995);
  ctx.fill();
  ctx.restore();
}

// 真纯铝截断强光后在右上方投出的干脆暗影锥
function drawPureOpaqueUmbra(ctx: CanvasRenderingContext2D, pal: FxPalette, strength: number) {
  if (strength <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= strength;
  const umb = ctx.createLinearGradient(730, 960, 1040, 740);
  umb.addColorStop(0, rgba(pal.ink, 0.22));
  umb.addColorStop(0.65, rgba(pal.ink, 0.08));
  umb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = umb;
  ctx.beginPath();
  ctx.moveTo(790, 720);
  ctx.lineTo(1060, 560);
  ctx.lineTo(1060, 1180);
  ctx.lineTo(790, 1340);
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
  const pose = heavyLand(frame - FAKE_IN, { drop: 105, fall: 8, squash: 0.04 });

  drawFlashlightBeam(ctx, frame, glow * 0.95, { pierced: true });

  if (pose.alpha > 0) {
    ctx.save();
    applyPerspective(ctx, rig, 0.78, SAFE_CX, 1030);
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(SAFE_CX, 1030 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawFoilBag(ctx, pal, 560, 640, { pure: false, backlight: glow, frame });
    ctx.restore();

    drawFakePiercedSpill(ctx, frame, glow * pose.alpha);
  }

  // 前景层：「镀铝 · 透光」+ 朱砂叉（避开右侧 120px）
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, 0.05);
  applyPerspective(ctx, rig, 0.34, SAFE_CX, 740);
  const tl = frame - (FAKE_GLOW - 2);
  if (tl > 0) {
    const txt = t(params, "fake");
    const poseT = lightFloat(tl, { rise: 20, sway: 0.45, seed: 8 });
    inkText(ctx, txt, SAFE_CX, 405 + poseT.y, fitSize(txt, 118, 780) * fontScale, easeOutCubic(progress(tl, 0, 12)), 53, {
      color: pal.cinnabar,
      weight: 900,
      font: SONG,
      wash: 0.03,
    });
  }
  brushCross(ctx, SAFE_CX, 1020, 490, progress(frame, FAKE_CROSS, FAKE_CROSS + 16), pal.cinnabar, 59, 22);
  ctx.restore();

  ctx.restore();
}

// ================= 幕二B：真纯铝不透光 + 硬折痕不回弹 ✓ =================
function drawActRealFoil(
  ctx: CanvasRenderingContext2D,
  frame: number,
  stillFrame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
  rig: CamRig,
) {
  if (frame < REAL_IN) return;
  const rl = frame - REAL_IN;
  const pose = heavyLand(rl, { drop: 105, fall: 8, squash: 0.04 });
  const crease = easeOutCubic(progress(frame, CREASE_AT, CREASE_AT + 18));
  const beamIn = easeOutCubic(progress(rl, 0, 14));

  // 强光束射到真纯铝背面被 100% 截断 + 右侧暗影锥（尾帧 0.5s 用 stillFrame 保持静止）
  drawFlashlightBeam(ctx, stillFrame, beamIn * 0.96, { pierced: false });
  drawPureOpaqueUmbra(ctx, pal, beamIn * pose.alpha);

  if (pose.alpha > 0) {
    ctx.save();
    applyPerspective(ctx, rig, 0.78, SAFE_CX, 1030);
    ctx.globalAlpha = pose.alpha;
    ctx.translate(SAFE_CX, 1030 + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawFoilBag(ctx, pal, 560, 640, {
      pure: true,
      backlight: 0.96,
      foldCrease: crease,
      frame: stillFrame,
    });
    ctx.restore();
  }

  // 前景层：「真纯铝 · 不透光」+ 竹青笔圈（安全居中 x=520，宽 <= 740）
  ctx.save();
  applyDeltaParallax(ctx, rig.cam, 0.05);
  applyPerspective(ctx, rig, 0.34, SAFE_CX, 740);
  const tl = frame - (REAL_TAG - 6);
  if (tl > 0) {
    const txt = t(params, "real");
    const poseT = heavyLand(tl, { drop: 58, fall: 6, squash: 0.06 });
    ctx.save();
    ctx.globalAlpha = Math.min(1, tl / 4);
    ctx.translate(SAFE_CX, 405 + poseT.y);
    ctx.scale(poseT.scaleX, poseT.scaleY);
    inkText(ctx, txt, 0, 0, fitSize(txt, 102, 720) * fontScale, easeOutCubic(progress(tl, 0, 12)), 71, {
      color: pal.bamboo,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    ctx.restore();
    brushRing(ctx, SAFE_CX, 405, 378, 90, progress(tl, 6, 22), rgba(pal.bamboo, 0.85), 77, 7);
  }
  ctx.restore();
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "素雪白牡丹茶正上茶舍一叶倾心净含量克");
}
