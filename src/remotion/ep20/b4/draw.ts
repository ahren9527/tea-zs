/**
 * 第 20 期 B4「顺纹撬饼」逐帧画布（1080×1920）。导出走这里；Comp.tsx 的预览也直接调用它，所以预览 = 导出。
 * 全部动效来自 @/remotion/shared/fx（镜头、弹簧、纸质感、水墨显现、笔触生长、印章、微动）。
 */
import {
  TAU,
  cameraAt,
  cameraKick,
  clamp01,
  drawBrushStroke,
  drawGrain,
  drawInkReveal,
  drawLeafParticles,
  drawLightSpots,
  drawRicePaper,
  drawSeal,
  drawVignette,
  drawWindowLight,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  easeOutExpo,
  fxPalette,
  heavyLand,
  leafParticles,
  lerp,
  lightFloat,
  lightSpots,
  partialPolyline,
  progress,
  rgba,
  sealPress,
  springValue,
  SPRINGS,
  window01,
  withLayer,
  type Camera,
  type FxPalette,
  type Pt,
} from "@/remotion/shared/fx";
import { FPS, SEAL_FONT, STAGE, type AnimParams } from "@/remotion/shared/theme";
import { TPL_FONT } from "@/templates/fonts";
import {
  CAKE,
  CAKE_DROP_AT,
  CAKE_LAND_AT,
  CENTER_OUT,
  CENTER_RING_AT,
  CENTER_X_AT,
  CHUNK,
  CHUNK_LIFT_AT,
  CRACK_AT,
  CRACK_DONE,
  EDGE_AT,
  GAP_AT,
  GRAIN_AT,
  GRAIN_GUIDE_AT,
  GRAIN_TEXT_OUT,
  KW_OUT_AT,
  LENGTH,
  LEVER_AT,
  MOVE_AT,
  NEEDLE_HIT_AT,
  NEEDLE_IN_AT,
  NEEDLE_OUT_AT,
  PACKET,
  PORTION_TEXT_AT,
  ARC_AT,
  SEAL_AT,
  SEAL_LIFT,
  SEAL_PRESS,
  TEXT,
  TEXT_BAND_Y,
  TURN_AT,
  TURN_OUT,
  WRAP_AT,
  type TextKey,
} from "./data";
import {
  CHUNK_CENTER,
  CHUNK_POLY,
  CRACK_DOWN,
  CRACK_UP,
  GRAIN_RINGS,
  cakeTexture,
  guidePath,
  ringPath,
  silhouette,
  tracePoly,
} from "./cake";

const R = CAKE.r;
const SIL = silhouette();
const GUIDE = guidePath();
const RINGS = GRAIN_RINGS.map((_, k) => ringPath(k, -Math.PI / 2 + k * 0.7));

export function textOf(params: AnimParams, key: TextKey) {
  const v = params.customTexts?.[key];
  return v !== undefined && v.trim() !== "" ? v.trim() : TEXT[key];
}

/** 本拍的镜头：整拍 1.00→1.06 推近；正确方法开始时移向饼边，撬完后退回看全局 */
export function beatCamera(frame: number): Camera {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.06,
    drift: 6,
    focus: [
      { at: EDGE_AT - 12, dur: 42, x: CAKE.x + R * 0.95, y: CAKE.y, zoom: 1.17, pull: 0.55 },
      { at: MOVE_AT - 8, dur: 30, x: 540, y: 1080, zoom: 0.965, pull: 0.32 },
    ],
  });
  const k = cameraKick(frame - CAKE_LAND_AT, 5);
  cam.x -= k.x;
  cam.y -= k.y;
  return cam;
}

// ---------------- 小工具 ----------------
function shadowOf(ctx: CanvasRenderingContext2D, path: () => void, o: { blur: number; dx: number; dy: number; alpha: number; color?: string }) {
  // 用 shadowBlur 画柔和投影（不依赖 ctx.filter，Safari 也一致）：形状本体画到画面外，只留影子
  const m = ctx.getTransform();
  const s = Math.hypot(m.a, m.b) || 1;
  ctx.save();
  ctx.shadowColor = rgba(o.color ?? "#3a2616", o.alpha);
  ctx.shadowBlur = o.blur * s;
  const far = 10000;
  ctx.shadowOffsetX = (o.dx + far) * m.a + o.dy * m.c;
  ctx.shadowOffsetY = (o.dx + far) * m.b + o.dy * m.d;
  ctx.translate(-far, 0);
  ctx.beginPath();
  path();
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();
}

function textBounds(text: string, x: number, y: number, fs: number, vertical = false) {
  const n = Array.from(text).length;
  return vertical
    ? { x: x - fs * 0.6, y: y - (n * fs * 1.08) / 2, w: fs * 1.2, h: n * fs * 1.08 }
    : { x: x - (n * fs * 1.02) / 2, y: y - fs * 0.62, w: n * fs * 1.02, h: fs * 1.24 };
}

function fillText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fs: number, color: string, weight = 700, vertical = false, font = TPL_FONT) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${weight} ${Math.round(fs)}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (vertical) {
    const chars = Array.from(text);
    const step = fs * 1.08;
    chars.forEach((ch, i) => ctx.fillText(ch, x, y - ((chars.length - 1) * step) / 2 + i * step));
  } else {
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

/** 字号随字数收缩，保证不溢出 */
function fitSize(text: string, base: number, maxW: number) {
  const n = Math.max(1, Array.from(text).length);
  return Math.min(base, maxW / (n * 1.04));
}

const local = (frame: number, at: number) => frame - at;

// ---------------- 主函数 ----------------
export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const frame = (elapsed / 1000) * FPS;
  const pal = fxPalette(params.paperTheme);
  const fontScale = params.fontScale ?? 1;
  if ("reset" in ctx && typeof ctx.reset === "function") ctx.reset();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  const cam = beatCamera(frame);

  // 1) 远景：宣纸（视差 0.35，额外放大一点防止露边）
  withLayer(ctx, cam, 0.35, () => {
    ctx.translate(STAGE.width / 2, STAGE.height / 2);
    ctx.scale(1.08, 1.08);
    ctx.translate(-STAGE.width / 2, -STAGE.height / 2);
    drawRicePaper(ctx, pal);
  });
  // 2) 窗光里的浮尘
  withLayer(ctx, cam, 0.55, () => {
    drawLightSpots(ctx, lightSpots(frame, 16, { x: -40, y: 40, w: 760, h: 1200 }, 4), pal.light, 0.9);
  });

  // 3) 主体平面：茶饼、茶针、茶块、棉纸、印章
  withLayer(ctx, cam, 1, () => {
    drawSubject(ctx, frame, pal, params);
  });

  // 4) 前景：碎叶（视差更大）
  withLayer(ctx, cam, 1.35, () => {
    drawLeafParticles(ctx, leafParticles(frame, 7, { x: 60, y: 360, w: 960, h: 1180 }, 8), [pal.bamboo, pal.tea, pal.oat], 0.55);
  });

  // 5) 文字带（几乎钉在屏幕上，跟镜头只动一点点）
  withLayer(ctx, cam, 0.12, () => {
    drawTextBand(ctx, frame, pal, params, fontScale);
  });

  // 6) 表层：窗光、暗角、颗粒
  drawWindowLight(ctx, frame, pal, 1);
  drawVignette(ctx, pal, 1);
  drawGrain(ctx, frame, 0.55);
}

// ---------------- 主体 ----------------
function drawSubject(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette, params: AnimParams) {
  const fontScale = params.fontScale ?? 1;
  const tex = cakeTexture(pal);
  const land = heavyLand(local(frame, CAKE_DROP_AT), { drop: 150, fall: CAKE_LAND_AT - CAKE_DROP_AT, squash: 0.045 });
  const lifted = frame >= CHUNK_LIFT_AT;
  const crackP = window01(frame, CRACK_AT, CRACK_DONE, easeInOutSine);

  const drawCakeBody = () => {
    ctx.drawImage(tex.canvas as CanvasImageSource, -tex.ext, -tex.ext, tex.ext * 2, tex.ext * 2);
  };

  // ---- 茶饼 ----
  if (land.alpha > 0) {
    // 投影：落地前小而淡，落地后贴实
    const near = 1 - clamp01(-land.y / 150);
    ctx.save();
    ctx.translate(CAKE.x, CAKE.y);
    if (lifted) {
      // 撬走的那块下面没有饼的影子
      ctx.beginPath();
      ctx.rect(-R * 3, -R * 3, R * 6, R * 6);
      tracePoly(ctx, CHUNK_POLY);
      ctx.clip("evenodd");
    }
    shadowOf(ctx, () => tracePoly(ctx, SIL), { blur: lerp(60, 26, near), dx: lerp(40, 16, near), dy: lerp(60, 24, near), alpha: 0.42 * near * land.alpha });
    shadowOf(ctx, () => tracePoly(ctx, SIL), { blur: 6, dx: 3, dy: 5, alpha: 0.35 * near * land.alpha });
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = land.alpha;
    ctx.translate(CAKE.x, CAKE.y + land.y);
    ctx.scale(land.scaleX, land.scaleY);
    if (lifted) {
      // 撬走之后：饼和饼上的一切都不画进那块缺口
      ctx.beginPath();
      ctx.rect(-R * 3, -R * 3, R * 6, R * 6);
      tracePoly(ctx, CHUNK_POLY);
      ctx.clip("evenodd");
    }
    drawCakeBody();

    // 纹理环：看纹理时描出来，之后留淡淡一层
    drawGrainRings(ctx, frame, pal);

    // 撬走之后：断面（饼的厚度）
    if (lifted) {
      ctx.save();
      ctx.lineJoin = "round";
      for (const br of [CRACK_UP, CRACK_DOWN]) {
        ctx.strokeStyle = rgba("#2a1a0c", 0.55);
        ctx.lineWidth = 9;
        ctx.beginPath();
        tracePoly(ctx, br.map((q) => ({ x: q.x - q.x * 0.025, y: q.y - q.y * 0.025 })), false);
        ctx.stroke();
        ctx.strokeStyle = rgba(pal.oat, 0.55);
        ctx.lineWidth = 2;
        ctx.beginPath();
        tracePoly(ctx, br, false);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 饼心：红色虚圈 + 一笔叉（只做提示）
    drawCenterCue(ctx, frame, pal);

    // 饼边高亮（下针处）
    drawEdgeCue(ctx, frame, pal);

    // 缝隙 + 顺纹引导 + 裂纹
    drawCrackStory(ctx, frame, pal, crackP, lifted);
    ctx.restore();
  }

  // ---- 一周量 ----
  drawPortion(ctx, frame, pal, params, fontScale);

  // ---- 茶针 ----
  drawNeedle(ctx, frame, pal);

  // ---- 棉纸 + 茶块 + 印章 ----
  drawPacketAndChunk(ctx, frame, pal, params, tex);
}

function drawGrainRings(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette) {
  const reveal = frame - GRAIN_AT;
  if (reveal < 0) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  RINGS.forEach((ring, k) => {
    const p = easeInOutCubic(progress(reveal, k * 2.2, k * 2.2 + 30));
    if (p <= 0) return;
    const part = partialPolyline(ring, p);
    // 描线时亮一下，之后沉下去
    const glow = 1 - clamp01((reveal - k * 2.2 - 30) / 50);
    ctx.strokeStyle = rgba("#2a1a0c", 0.26 + 0.2 * glow);
    ctx.lineWidth = 2;
    ctx.beginPath();
    tracePoly(ctx, part, false);
    ctx.stroke();
    ctx.strokeStyle = rgba(pal.rice, 0.16 + 0.45 * glow);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    tracePoly(
      ctx,
      part.map((q) => ({ x: q.x - 1.2, y: q.y - 1.2 })),
      false,
    );
    ctx.stroke();
  });
  ctx.restore();
}

function drawCenterCue(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette) {
  const l = frame - CENTER_RING_AT;
  if (l < 0 || frame > CENTER_OUT + 20) return;
  const fade = 1 - window01(frame, CENTER_OUT, CENTER_OUT + 20);
  const ring: Pt[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = -Math.PI * 0.6 + (i / 64) * TAU * 0.96;
    const rr = 62 + Math.sin(i * 0.7) * 1.6;
    ring.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
  }
  ctx.save();
  ctx.globalAlpha = fade * 0.85;
  drawBrushStroke(ctx, ring, easeInOutCubic(progress(l, 0, 16)), { width: 5, color: pal.cinnabar, seed: 3, jitter: 0.3, tail: 0.2 });
  const xl = frame - CENTER_X_AT;
  if (xl > 0) {
    drawBrushStroke(ctx, [{ x: -34, y: -34 }, { x: 0, y: 2 }, { x: 36, y: 36 }], easeOutExpo(progress(xl, 0, 6)), { width: 9, color: pal.cinnabar, seed: 5 });
    drawBrushStroke(ctx, [{ x: 34, y: -36 }, { x: 0, y: 0 }, { x: -36, y: 34 }], easeOutExpo(progress(xl, 3, 9)), { width: 9, color: pal.cinnabar, seed: 6 });
  }
  ctx.restore();
}

function drawEdgeCue(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette) {
  const l = frame - EDGE_AT;
  if (l < 0 || frame > CHUNK_LIFT_AT + 12) return;
  const fade = 1 - window01(frame, CHUNK_LIFT_AT - 4, CHUNK_LIFT_AT + 12);
  // 暖光点在饼边：告诉观众「看这里」
  const pulse = 0.75 + 0.25 * Math.sin(l * 0.18);
  const g = ctx.createRadialGradient(R * 1.0, 0, 0, R * 1.0, 0, R * 0.42);
  g.addColorStop(0, rgba(pal.light, 0.4 * pulse * fade * easeOutCubic(progress(l, 0, 14))));
  g.addColorStop(1, rgba(pal.light, 0));
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = g;
  ctx.fillRect(R * 0.5, -R * 0.5, R, R);
  ctx.restore();
  // 竹青短弧
  const arc: Pt[] = [];
  for (let i = 0; i <= 30; i++) {
    const a = -0.2 + (i / 30) * 0.4;
    arc.push({ x: Math.cos(a) * R * 1.075, y: Math.sin(a) * R * 1.075 });
  }
  ctx.save();
  ctx.globalAlpha = fade;
  drawBrushStroke(ctx, arc, easeInOutCubic(progress(l, 2, 18)), { width: 6, color: pal.bamboo, seed: 9, tail: 0.35 });
  ctx.restore();
}

function drawCrackStory(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette, crackP: number, lifted: boolean) {
  // 缝隙：针扎进去的那道细缝（饼边 → 环）
  const gl = frame - GAP_AT;
  if (gl > 0 && !lifted) {
    const lever = leverAmount(frame);
    const p = easeOutCubic(progress(gl, 0, 10));
    const x0 = R * 1.02;
    const x1 = lerp(x0, R * (CHUNK.ring + 0.02), p);
    ctx.save();
    ctx.fillStyle = rgba("#1e1209", 0.62);
    ctx.beginPath();
    const w = 3 + lever * 3;
    ctx.moveTo(x0 + 6, -w);
    ctx.quadraticCurveTo((x0 + x1) / 2, -w * 0.9, x1, 0);
    ctx.quadraticCurveTo((x0 + x1) / 2, w * 0.9, x0 + 6, w);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // 顺纹引导：竹青虚线沿那条纹理环亮起
  const gg = frame - GRAIN_GUIDE_AT;
  if (gg > 0 && !lifted) {
    const p = easeInOutCubic(progress(gg, 0, 14));
    const fade = 1 - window01(frame, CRACK_DONE, CRACK_DONE + 10);
    const half = GUIDE.length >> 1;
    const up = GUIDE.slice(0, half + 1).reverse();
    const down = GUIDE.slice(half);
    ctx.save();
    ctx.lineDashOffset = -gg * 1.2;
    ctx.lineCap = "round";
    // 先一层暖光晕（在灰绿的饼面上也看得清），再压一条竹青虚线
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = rgba(pal.light, 0.38 * fade);
    ctx.lineWidth = 12;
    for (const seg of [up, down]) {
      ctx.beginPath();
      tracePoly(ctx, partialPolyline(seg, p), false);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.setLineDash([12, 9]);
    ctx.strokeStyle = rgba(pal.rice, 0.95 * fade);
    ctx.lineWidth = 5;
    for (const seg of [up, down]) {
      ctx.beginPath();
      tracePoly(ctx, partialPolyline(seg, p), false);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(pal.bamboo, 0.9 * fade);
    ctx.lineWidth = 2.4;
    for (const seg of [up, down]) {
      ctx.beginPath();
      tracePoly(ctx, partialPolyline(seg, p), false);
      ctx.stroke();
    }
    ctx.restore();
  }
  // 裂纹：沿纹生长（两路），撬起前一直在
  if (crackP > 0 && !lifted) {
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const br of [CRACK_UP, CRACK_DOWN]) {
      const part = partialPolyline(br, crackP);
      ctx.strokeStyle = rgba("#1a0f07", 0.8);
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      tracePoly(ctx, part, false);
      ctx.stroke();
      ctx.strokeStyle = rgba(pal.rice, 0.5);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      tracePoly(
        ctx,
        part.map((q) => ({ x: q.x + 1.6, y: q.y + 1.6 })),
        false,
      );
      ctx.stroke();
      // 裂纹头上的细碎
      const tip = part[part.length - 1];
      if (crackP < 1 && tip) {
        ctx.fillStyle = rgba(pal.oat, 0.7);
        for (let i = 0; i < 4; i++) {
          const a = i * 1.7 + frame * 0.6;
          ctx.beginPath();
          ctx.arc(tip.x + Math.cos(a) * 6, tip.y + Math.sin(a) * 6, 1.4, 0, TAU);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
}

/** 「使巧劲」：茶针轻轻一别（0..1..0） */
function leverAmount(frame: number) {
  const l = frame - LEVER_AT;
  if (l < 0) return 0;
  const up = easeInOutSine(progress(l, 0, 9));
  const hold = frame < CHUNK_LIFT_AT ? 1 : 1 - easeInOutSine(progress(frame, CHUNK_LIFT_AT, CHUNK_LIFT_AT + 10));
  return up * hold;
}

function drawNeedle(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette) {
  const inL = frame - NEEDLE_IN_AT;
  if (inL < 0) return;
  const outP = easeInOutCubic(progress(frame, NEEDLE_OUT_AT, NEEDLE_OUT_AT + 14));
  if (outP >= 1) return;
  // 针尖位置（局部 x，饼心为 0）：从画外滑到饼边，再扎进去
  const rimX = R * 1.04;
  const approach = springValue(inL, { stiffness: 140, damping: 19, mass: 1 });
  let tipX = lerp(R * 2.4, rimX, Math.min(1, approach));
  const pierce = easeOutCubic(progress(frame, NEEDLE_HIT_AT, NEEDLE_HIT_AT + 12));
  tipX = lerp(tipX, R * (CHUNK.ring + 0.04), pierce);
  tipX = lerp(tipX, R * 2.6, outP);
  const lever = leverAmount(frame);
  // 针尖碰到饼边的一下小顿挫
  const hit = frame - NEEDLE_HIT_AT;
  const jolt = hit > 0 && hit < 10 ? Math.sin(hit * 1.6) * Math.exp(-hit * 0.4) * 2.2 : 0;

  ctx.save();
  ctx.translate(CAKE.x, CAKE.y);
  // 支点在饼边，别的时候针身绕饼边转一点
  ctx.translate(rimX, 0);
  ctx.rotate(-0.04 - lever * 0.09);
  ctx.translate(-rimX, jolt);
  const shaftLen = 170;
  const handleLen = 240;
  const tip = { x: tipX, y: 0 };
  const shaftEnd = tip.x + shaftLen;
  // 投影
  shadowOf(
    ctx,
    () => {
      ctx.moveTo(tip.x, -1);
      ctx.lineTo(shaftEnd, -3);
      ctx.lineTo(shaftEnd + handleLen, -11);
      ctx.lineTo(shaftEnd + handleLen, 11);
      ctx.lineTo(shaftEnd, 3);
      ctx.lineTo(tip.x, 1);
      ctx.closePath();
    },
    { blur: 14, dx: 10, dy: 18 + lever * 8, alpha: 0.35 },
  );
  const paintShaft = () => {
    const g = ctx.createLinearGradient(0, -4, 0, 4);
    g.addColorStop(0, "#f2efe8");
    g.addColorStop(0.45, "#a9a69e");
    g.addColorStop(1, "#5b5852");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(tip.x, 0);
    ctx.quadraticCurveTo(tip.x + 30, -2.2, shaftEnd, -3.6);
    ctx.lineTo(shaftEnd, 3.6);
    ctx.quadraticCurveTo(tip.x + 30, 2.2, tip.x, 0);
    ctx.closePath();
    ctx.fill();
  };
  // 扎进饼里的那段：半透明（像透视），饼外的那段：实
  ctx.save();
  ctx.beginPath();
  ctx.rect(-R * 3, -R * 3, R * 6, R * 6);
  tracePoly(ctx, SIL);
  ctx.clip("evenodd");
  paintShaft();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  tracePoly(ctx, SIL);
  ctx.clip();
  ctx.globalAlpha = 0.32;
  paintShaft();
  ctx.restore();
  // 针箍（铜）
  ctx.fillStyle = mixColor(pal.tea, "#c89a5a", 0.6);
  ctx.fillRect(shaftEnd - 4, -7.5, 18, 15);
  ctx.fillStyle = rgba("#ffffff", 0.35);
  ctx.fillRect(shaftEnd - 4, -7.5, 18, 3);
  // 竹柄：茶褐，有竹节和纤维
  const hx = shaftEnd + 14;
  const hg = ctx.createLinearGradient(0, -12, 0, 12);
  hg.addColorStop(0, mixColor(pal.tea, "#e8c99a", 0.55));
  hg.addColorStop(0.5, pal.tea);
  hg.addColorStop(1, mixColor(pal.tea, "#1a0f07", 0.45));
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.moveTo(hx, -9);
  ctx.lineTo(hx + handleLen, -12);
  ctx.quadraticCurveTo(hx + handleLen + 8, 0, hx + handleLen, 12);
  ctx.lineTo(hx, 9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba("#1a0f07", 0.35);
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(hx + 10, -6 + i * 3);
    ctx.lineTo(hx + handleLen - 6, -7.6 + i * 3.8);
    ctx.stroke();
  }
  ctx.strokeStyle = rgba("#1a0f07", 0.5);
  ctx.lineWidth = 2.2;
  for (const nx of [hx + 80, hx + 175]) {
    ctx.beginPath();
    ctx.moveTo(nx, -10.5);
    ctx.lineTo(nx + 1, 10.5);
    ctx.stroke();
  }
  ctx.restore();
}

function mixColor(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (n: number, s: number) => (n >> s) & 255;
  const m = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}

function drawPortion(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette, params: AnimParams, fontScale: number) {
  const l = frame - ARC_AT;
  if (l < 0) return;
  ctx.save();
  ctx.translate(CAKE.x, CAKE.y);
  const rr = R * 1.2;
  const arc: Pt[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = CHUNK.a0 + (CHUNK.a1 - CHUNK.a0) * (i / 40);
    arc.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
  }
  const p = easeInOutCubic(progress(l, 0, 20));
  drawBrushStroke(ctx, arc, p, { width: 7, color: pal.cinnabar, seed: 12, tail: 0.15, head: 0.08 });
  // 两端的短刻度（指向饼心）
  for (const [a, at] of [
    [CHUNK.a0, 0],
    [CHUNK.a1, 14],
  ] as const) {
    const tp = easeOutExpo(progress(l, at, at + 8));
    if (tp <= 0) continue;
    drawBrushStroke(
      ctx,
      [
        { x: Math.cos(a) * (rr + 16), y: Math.sin(a) * (rr + 16) },
        { x: Math.cos(a) * (rr - 26), y: Math.sin(a) * (rr - 26) },
      ],
      tp,
      { width: 5, color: pal.cinnabar, seed: 13 + at },
    );
  }
  // 「一周量」竖排 + 「≈1/8」小字
  const tl = frame - PORTION_TEXT_AT;
  if (tl > 0) {
    const label = textOf(params, "portion");
    const sub = textOf(params, "portionSub");
    const fs = fitSize(label, 58, 220) * fontScale;
    const x = R * 1.3;
    const y = -14;
    const pose = lightFloat(tl, { rise: 14, sway: 1.5, seed: 2 });
    const b = textBounds(label, x, y, fs, true);
    drawInkReveal(ctx, easeOutCubic(progress(tl, 0, 18)), b, 21, (c) => fillText(c, label, x, y + pose.y, fs, pal.cinnabar, 700, true), {
      wash: pal.cinnabar,
      washAlpha: 0.06,
    });
    const sfs = 30 * fontScale;
    const sy = y + b.h / 2 + sfs * 1.1;
    ctx.globalAlpha = clamp01((tl - 8) / 12);
    fillText(ctx, sub, x, sy + pose.y, sfs, pal.inkSoft, 500);
  }
  ctx.restore();
}

// ---- 棉纸 + 茶块 + 印章 ----
const D = 222; // 棉纸对角半径
const FOLD = D * 0.52; // 折线到中心的距离
const FLAPS = [
  { dir: Math.PI / 2, at: 0 }, // 下
  { dir: -Math.PI / 2, at: 3 }, // 上
  { dir: Math.PI, at: 6 }, // 左
  { dir: 0, at: 9 }, // 右
];

function chunkPose(frame: number) {
  // 撬起：heavy 弹簧（离开饼面 + 轻转），移到棉纸：先慢后快再重落
  const liftL = frame - CHUNK_LIFT_AT;
  const lift = springValue(liftL, SPRINGS.heavy);
  const base = { x: CAKE.x + CHUNK_CENTER.x, y: CAKE.y + CHUNK_CENTER.y };
  let x = base.x + 26 * lift;
  let y = base.y - 10 * lift;
  let rot = 0.07 * lift;
  let scale = 1 + 0.045 * lift;
  let height = lift; // 离地高度（影子）
  let sq = { x: 1, y: 1 };
  const mv = easeInOutCubic(progress(frame, MOVE_AT, MOVE_AT + 16));
  if (mv > 0) {
    const tx = PACKET.x;
    const ty = PACKET.y;
    // 弧线路径（往外绕一点）
    const cx = (x + tx) / 2 + 160;
    const cy = (y + ty) / 2 - 40;
    const u = mv;
    const nx = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * cx + u * u * tx;
    const ny = (1 - u) * (1 - u) * y + 2 * (1 - u) * u * cy + u * u * ty;
    x = nx;
    y = ny;
    rot = lerp(rot, Math.PI / 2, mv);
    scale = lerp(scale, 0.7, mv);
    height = lerp(1, 0.6, mv);
    const landL = frame - (MOVE_AT + 16);
    if (landL > 0) {
      const p = heavyLand(landL + 6, { drop: 30, fall: 6, squash: 0.06 });
      sq = { x: p.scaleX, y: p.scaleY };
      height = 0.6 * (1 - clamp01(landL / 4));
    }
  }
  return { x, y, rot, scale, height, sq, visible: frame >= CHUNK_LIFT_AT };
}

function drawChunk(ctx: CanvasRenderingContext2D, frame: number, tex: { canvas: unknown; ext: number }, pal: FxPalette) {
  const c = chunkPose(frame);
  if (!c.visible) return;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rot);
  ctx.scale(c.scale * c.sq.x, c.scale * c.sq.y);
  ctx.translate(-CHUNK_CENTER.x, -CHUNK_CENTER.y);
  shadowOf(ctx, () => tracePoly(ctx, CHUNK_POLY), { blur: 10 + 22 * c.height, dx: 6 + 18 * c.height, dy: 10 + 30 * c.height, alpha: 0.4 });
  ctx.save();
  ctx.beginPath();
  tracePoly(ctx, CHUNK_POLY);
  ctx.clip();
  ctx.drawImage(tex.canvas as CanvasImageSource, -tex.ext, -tex.ext, tex.ext * 2, tex.ext * 2);
  // 撬起时更受光
  ctx.fillStyle = rgba(pal.light, 0.1 * c.height);
  ctx.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3);
  ctx.restore();
  // 新鲜断面：一点浅色毛边
  ctx.strokeStyle = rgba(pal.oat, 0.45);
  ctx.lineWidth = 1.2;
  ctx.lineJoin = "round";
  for (const br of [CRACK_UP, CRACK_DOWN]) {
    ctx.beginPath();
    tracePoly(ctx, br, false);
    ctx.stroke();
  }
  ctx.restore();
}

function flapGeom(dir: number, p: number) {
  const ux = Math.cos(dir);
  const uy = Math.sin(dir);
  const px = -uy;
  const py = ux;
  const half = D - FOLD;
  const a = { x: ux * FOLD + px * half, y: uy * FOLD + py * half };
  const b = { x: ux * FOLD - px * half, y: uy * FOLD - py * half };
  const d = FOLD + half * Math.cos(Math.PI * p);
  const tip = { x: ux * d, y: uy * d };
  return { a, b, tip, back: Math.cos(Math.PI * p) < 0 };
}

/** 棉纸当前外轮廓：顺时针走一圈，每个角取「折线端点 b → 角尖（未翻过去时）→ 折线端点 a」 */
function packetOutline(flapP: number[]): Pt[] {
  const out: Pt[] = [];
  for (const dir of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const i = FLAPS.findIndex((f) => f.dir === dir);
    const g = flapGeom(dir, flapP[i]);
    out.push(g.b);
    if (!g.back && flapP[i] < 1) out.push(g.tip);
    out.push(g.a);
  }
  return out;
}

function drawPaperSheet(ctx: CanvasRenderingContext2D, pts: Pt[], fill: string, pal: FxPalette, seed: number) {
  ctx.save();
  ctx.beginPath();
  tracePoly(ctx, pts);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.clip();
  // 棉纸纤维
  ctx.strokeStyle = rgba(pal.tea, 0.09);
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 70; i++) {
    const x = ((i * 97 + seed * 31) % 420) - 210;
    const y = ((i * 57 + seed * 13) % 420) - 210;
    const a = (i * 2.39 + seed) % TAU;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a + 0.6) * 9, y + Math.sin(a + 0.6) * 9, x + Math.cos(a) * 18, y + Math.sin(a) * 18);
    ctx.stroke();
  }
  ctx.restore();
  // 纸边：一圈很细的毛边
  ctx.strokeStyle = rgba(pal.tea, 0.18);
  ctx.lineWidth = 1;
  ctx.beginPath();
  tracePoly(ctx, pts);
  ctx.stroke();
}

function drawPacketAndChunk(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette, params: AnimParams, tex: { canvas: unknown; ext: number }) {
  const sheetL = frame - (MOVE_AT - 4);
  const sheetIn = sheetL > 0 ? lightFloat(sheetL, { rise: 26, sway: 0, seed: 1 }) : null;
  const sheetColor = pal.dark ? "#d9cfbd" : "#f8f2e6";
  const underside = pal.dark ? "#c9bea9" : "#eee5d3";
  const flapP = FLAPS.map((f) => easeInOutCubic(progress(frame, WRAP_AT + f.at, WRAP_AT + f.at + 10)));

  if (sheetIn) {
    ctx.save();
    ctx.translate(PACKET.x, PACKET.y + sheetIn.y);
    ctx.globalAlpha = sheetIn.alpha;
    ctx.scale(sheetIn.scaleX, sheetIn.scaleY);
    // 纸的影子（很浅，贴着桌面）：外轮廓随折角收进来
    shadowOf(ctx, () => tracePoly(ctx, packetOutline(flapP)), { blur: 18, dx: 6, dy: 12, alpha: 0.18 });
    // 中间部分（四条折线围起来的八边形）
    const core = packetOutline(FLAPS.map(() => 1));
    drawPaperSheet(ctx, core, sheetColor, pal, 1);
    // 还没折的角（平铺在茶块下面）
    FLAPS.forEach((f, i) => {
      if (flapP[i] > 0.02) return;
      const g = flapGeom(f.dir, 0);
      drawPaperSheet(ctx, [g.a, g.tip, g.b], sheetColor, pal, i + 2);
    });
    ctx.restore();
  }

  drawChunk(ctx, frame, tex, pal);

  if (sheetIn) {
    ctx.save();
    ctx.translate(PACKET.x, PACKET.y + sheetIn.y);
    ctx.globalAlpha = sheetIn.alpha;
    // 折起的角：按顺序翻过来盖住茶块；翻到背面颜色略深，并在下面投一点影
    FLAPS.forEach((f, i) => {
      const p = flapP[i];
      if (p <= 0.02) return;
      const g = flapGeom(f.dir, p);
      const lift = Math.sin(Math.PI * p);
      shadowOf(ctx, () => tracePoly(ctx, [g.a, g.tip, g.b]), { blur: 6 + 14 * lift, dx: 3 + 8 * lift, dy: 5 + 12 * lift, alpha: 0.2 });
      drawPaperSheet(ctx, [g.a, g.tip, g.b], g.back ? underside : sheetColor, pal, i + 7);
      // 折痕
      ctx.strokeStyle = rgba(pal.tea, 0.25);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(g.a.x, g.a.y);
      ctx.lineTo(g.b.x, g.b.y);
      ctx.stroke();
    });
    ctx.restore();
  }

  // 印章「快取快封」
  const sl = frame - SEAL_AT;
  if (sl > 0) {
    const pose = sealPress(sl, { lift: SEAL_LIFT, press: SEAL_PRESS, height: 80, rot: -0.08 });
    drawSeal(ctx, {
      text: textOf(params, "seal"),
      x: PACKET.x + 4,
      y: PACKET.y + 2,
      size: 118 * (params.fontScale ?? 1) ** 0.5,
      pose,
      color: pal.cinnabar,
      paper: pal.paper,
      font: SEAL_FONT,
      seed: 20,
    });
  }
}

// ---------------- 文字带 ----------------
function drawTextBand(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette, params: AnimParams, fontScale: number) {
  const y = TEXT_BAND_Y;
  // 看纹理
  {
    const l = frame - GRAIN_AT;
    const out = window01(frame, GRAIN_TEXT_OUT, GRAIN_TEXT_OUT + 14);
    if (l > 0 && out < 1) {
      const t = textOf(params, "grain");
      const fs = fitSize(t, 66, 600) * fontScale;
      ctx.save();
      ctx.globalAlpha = 1 - out;
      drawInkReveal(ctx, easeOutCubic(progress(l, 0, 20)), textBounds(t, 540, y, fs), 31, (c) => fillText(c, t, 540, y, fs, pal.ink, 500), {
        wash: pal.ink,
        washAlpha: 0.05,
      });
      ctx.restore();
    }
  }
  // 正着来（大字 + 朱砂一笔）
  {
    const l = frame - TURN_AT;
    const out = window01(frame, TURN_OUT - 4, TURN_OUT + 10);
    if (l > 0 && out < 1) {
      const t = textOf(params, "turn");
      const fs = fitSize(t, 140, 860) * fontScale;
      const pose = lightFloat(l, { rise: 10, sway: 0, seed: 3 });
      ctx.save();
      ctx.globalAlpha = 1 - out;
      drawInkReveal(ctx, easeOutCubic(progress(l, 0, 16)), textBounds(t, 540, y, fs), 37, (c) => fillText(c, t, 540, y + pose.y, fs, pal.ink, 700), {
        wash: pal.ink,
        washAlpha: 0.045,
      });
      const w = (Array.from(t).length * fs) / 2;
      drawBrushStroke(
        ctx,
        [
          { x: 540 - w * 0.9, y: y + fs * 0.66 },
          { x: 540, y: y + fs * 0.62 },
          { x: 540 + w * 0.9, y: y + fs * 0.7 },
        ],
        easeInOutCubic(progress(l, 8, 22)),
        { width: 9, color: pal.cinnabar, seed: 4, dry: 0.6, dryColor: pal.paper },
      );
      ctx.restore();
    }
  }
  // 饼边 · 借缝 · 顺纹（序号小、关键词大；新的出现时旧的退淡）
  const kws: [TextKey, number, string][] = [
    ["kw1", EDGE_AT, "一"],
    ["kw2", GAP_AT, "二"],
    ["kw3", GRAIN_GUIDE_AT, "三"],
  ];
  const out = window01(frame, KW_OUT_AT, KW_OUT_AT + 16);
  if (out >= 1) return;
  kws.forEach(([key, at, num], i) => {
    const l = frame - at;
    if (l <= 0) return;
    const t = textOf(params, key);
    const fs = fitSize(t, 96, 280) * fontScale;
    const x = 540 + (i - 1) * 300;
    const next = kws[i + 1]?.[1];
    const dim = next !== undefined ? window01(frame, next, next + 10) : 0;
    const pose = lightFloat(l, { rise: 12, sway: 1.2, seed: i });
    ctx.save();
    ctx.globalAlpha = (1 - out) * (1 - 0.5 * dim);
    drawInkReveal(ctx, easeOutCubic(progress(l, 0, 16)), textBounds(t, x, y + 6, fs), 41 + i, (c) => fillText(c, t, x, y + 6 + pose.y, fs, pal.ink, 700), {
      wash: pal.ink,
      washAlpha: 0.05,
    });
    // 小序号（朱砂）
    ctx.globalAlpha *= clamp01((l - 4) / 10);
    fillText(ctx, num, x, y - fs * 0.88, 34 * fontScale, pal.cinnabar, 700);
    ctx.restore();
    // 分隔点
    if (i > 0) {
      ctx.save();
      ctx.globalAlpha = (1 - out) * clamp01(l / 10) * 0.6;
      ctx.fillStyle = pal.inkSoft;
      ctx.beginPath();
      ctx.arc(x - 150, y + 6, 4, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  });
}

export function allTexts(params?: AnimParams) {
  const p = params ?? { startMs: 0, staggerMs: 0, durationMs: 0 };
  return (Object.keys(TEXT) as TextKey[]).map((k) => textOf(p, k)).join("") + "一二三";
}
