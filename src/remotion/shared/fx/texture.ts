/**
 * fx/texture — 纸面质感：宣纸纤维（静态）、逐帧变化的颗粒（确定性）、暗角、左上窗光。
 * 用法（canvas，一般放在每帧最前 / 最后）：
 *   drawRicePaper(ctx, pal)               // 底：纸色 + 纤维 + 帘纹（缓存，只算一次）
 *   …画主体…
 *   drawWindowLight(ctx, frame, pal)      // 左上暖光 + 窗格光带
 *   drawVignette(ctx, pal)                // 暗角
 *   drawGrain(ctx, frame)                 // 胶片/纸颗粒（每帧不同，但同一帧永远一样）
 * React 版本见 fx/react.tsx（<PaperGrain/> 等，内部调用同一组函数）。
 */
import { STAGE } from "../theme";
import { hash01, noise1, rng } from "./math";
import { rgba, type FxPalette } from "./palette";
import { cachedSurface } from "./surface";

const W = STAGE.width;
const H = STAGE.height;

/** 宣纸底：纸色、云状深浅、纤维、细帘纹。静态，按主题缓存 */
export function drawRicePaper(ctx: CanvasRenderingContext2D, pal: FxPalette, seed = 3) {
  const s = cachedSurface(`ricepaper:${pal.paper}:${seed}`, W, H, (c) => {
    c.fillStyle = pal.paper;
    c.fillRect(0, 0, W, H);
    const r = rng(seed);
    // 云状深浅（纸浆厚薄不均）
    for (let i = 0; i < 70; i++) {
      const x = r() * W;
      const y = r() * H;
      const rad = 80 + r() * 260;
      const g = c.createRadialGradient(x, y, 0, x, y, rad);
      const deep = r() > 0.45;
      g.addColorStop(0, rgba(deep ? pal.paperDeep : "#ffffff", deep ? 0.22 : 0.1));
      g.addColorStop(1, rgba(deep ? pal.paperDeep : "#ffffff", 0));
      c.fillStyle = g;
      c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // 帘纹（抄纸竹帘留下的横向细纹）
    c.globalAlpha = pal.dark ? 0.035 : 0.018;
    c.strokeStyle = pal.ink;
    c.lineWidth = 1;
    for (let y = 6; y < H; y += 9 + Math.floor(r() * 3)) {
      c.beginPath();
      c.moveTo(0, y);
      for (let x = 0; x <= W; x += 60) c.lineTo(x, y + noise1(x / 300 + y, seed) * 1.2);
      c.stroke();
    }
    // 纤维：细长卷曲的短线
    for (let i = 0; i < 1400; i++) {
      const x = r() * W;
      const y = r() * H;
      const len = 6 + r() * 34;
      const a = r() * Math.PI * 2;
      const bend = (r() - 0.5) * 0.9;
      c.globalAlpha = 0.05 + r() * 0.09;
      c.strokeStyle = r() > 0.3 ? pal.paperDeep : pal.inkSoft;
      c.lineWidth = 0.5 + r() * 0.9;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(
        x + Math.cos(a + bend) * len * 0.5,
        y + Math.sin(a + bend) * len * 0.5,
        x + Math.cos(a) * len,
        y + Math.sin(a) * len,
      );
      c.stroke();
    }
    // 极少量的草屑斑点
    for (let i = 0; i < 90; i++) {
      c.globalAlpha = 0.08 + r() * 0.12;
      c.fillStyle = pal.inkSoft;
      c.beginPath();
      c.arc(r() * W, r() * H, 0.6 + r() * 1.4, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  });
  ctx.drawImage(s.canvas, 0, 0);
}

const GRAIN_TILE = 256;
const GRAIN_VARIANTS = 6;

function grainTile(i: number) {
  return cachedSurface(`grain:${i}`, GRAIN_TILE, GRAIN_TILE, (c) => {
    const img = c.createImageData(GRAIN_TILE, GRAIN_TILE);
    const r = rng(1000 + i);
    for (let p = 0; p < img.data.length; p += 4) {
      // 偏向中灰的颗粒（soft-light 下中灰 = 无变化）
      const v = 128 + (r() + r() + r() - 1.5) * 150;
      img.data[p] = v;
      img.data[p + 1] = v;
      img.data[p + 2] = v;
      img.data[p + 3] = 255;
    }
    c.putImageData(img, 0, 0);
  });
}

/** 逐帧颗粒：同一帧号永远同一张；strength 0..1（默认 0.5 很克制） */
export function drawGrain(ctx: CanvasRenderingContext2D, frame: number, strength = 0.5) {
  const f = Math.floor(frame);
  const tile = grainTile(Math.floor(hash01(f, 91) * GRAIN_VARIANTS));
  const ox = Math.floor(hash01(f, 92) * GRAIN_TILE);
  const oy = Math.floor(hash01(f, 93) * GRAIN_TILE);
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = 0.32 * strength;
  const pat = ctx.createPattern(tile.canvas as CanvasImageSource, "repeat");
  if (pat) {
    ctx.translate(-ox, -oy);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W + GRAIN_TILE, H + GRAIN_TILE);
  }
  ctx.restore();
}

/** 暗角参数（canvas 与 CSS 共用） */
export function vignetteStops(pal: FxPalette, strength = 1) {
  const edge = pal.dark ? "#000000" : pal.tea;
  return {
    cx: W * 0.5,
    cy: H * 0.46,
    inner: H * 0.3,
    outer: H * 0.78,
    stops: [
      [0, rgba(edge, 0)],
      [0.55, rgba(edge, 0.05 * strength)],
      [1, rgba(edge, 0.3 * strength)],
    ] as [number, string][],
  };
}

export function drawVignette(ctx: CanvasRenderingContext2D, pal: FxPalette, strength = 1) {
  const v = vignetteStops(pal, strength);
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const g = ctx.createRadialGradient(v.cx, v.cy, v.inner, v.cx, v.cy, v.outer);
  for (const [o, c] of v.stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** 窗光强度随时间轻轻呼吸（云过窗前） */
export function windowLightLevel(frame: number, seed = 5) {
  return 0.86 + 0.14 * noise1(frame / 75, seed);
}

/** 窗格光带：几条从左上斜射下来的柔光（角度、位置、宽度） */
export function windowShafts(frame: number) {
  const sway = noise1(frame / 120, 77) * 18;
  return [
    { x: 120 + sway, w: 150, alpha: 0.55 },
    { x: 330 + sway * 1.2, w: 90, alpha: 0.4 },
    { x: 470 + sway * 1.4, w: 46, alpha: 0.28 },
  ];
}
export const SHAFT_ANGLE = (28 * Math.PI) / 180;

/** 左上暖色窗光：大面积暖光晕 + 斜向光带 + 右下一点冷暗 */
export function drawWindowLight(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette, strength = 1) {
  const lvl = windowLightLevel(frame) * strength;
  ctx.save();
  // 暖光晕
  ctx.globalCompositeOperation = pal.dark ? "screen" : "soft-light";
  const g = ctx.createRadialGradient(-60, -120, 40, -60, -120, 1350);
  g.addColorStop(0, rgba(pal.light, 0.95 * lvl));
  g.addColorStop(0.45, rgba(pal.light, 0.35 * lvl));
  g.addColorStop(1, rgba(pal.light, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 光带
  ctx.globalCompositeOperation = "screen";
  ctx.translate(0, 0);
  ctx.rotate(-SHAFT_ANGLE);
  for (const s of windowShafts(frame)) {
    const lg = ctx.createLinearGradient(s.x - s.w / 2, 0, s.x + s.w / 2, 0);
    const a = s.alpha * 0.16 * lvl * (pal.dark ? 0.6 : 1);
    lg.addColorStop(0, rgba(pal.light, 0));
    lg.addColorStop(0.5, rgba(pal.light, a));
    lg.addColorStop(1, rgba(pal.light, 0));
    ctx.fillStyle = lg;
    // 沿光带方向渐隐
    ctx.fillRect(s.x - s.w / 2, -200, s.w, 1700);
  }
  ctx.restore();
  // 右下角微冷的暗部，拉开空间
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const d = ctx.createRadialGradient(W * 1.05, H * 1.02, 60, W * 1.05, H * 1.02, H * 0.7);
  d.addColorStop(0, rgba(pal.dark ? "#000000" : "#7d7466", 0.22 * strength));
  d.addColorStop(1, rgba("#7d7466", 0));
  ctx.fillStyle = d;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
