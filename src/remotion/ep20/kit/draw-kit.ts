/**
 * 第 20 期共用的画布小工具：口播计时、文案读取、竖排/横排文字、水墨显现文字、柔和投影、
 * 朱砂叉、间距标尺，以及每一帧的标准分层（宣纸 → 浮尘 → 主体 → 前景碎叶 → 文字 → 窗光/暗角/颗粒）。
 * 这里没有 index.ts，面板不会把 kit/ 当成节拍。
 */
import {
  TAU,
  clamp01,
  drawBrushStroke,
  drawGrain,
  drawInkReveal,
  drawLeafParticles,
  drawLightSpots,
  drawRicePaper,
  drawVignette,
  drawWindowLight,
  easeInOutCubic,
  easeOutCubic,
  easeOutExpo,
  fxPalette,
  leafParticles,
  lightSpots,
  progress,
  rgba,
  withLayer,
  type Bounds,
  type Camera,
  type FxPalette,
  type Pt,
  TEMPO,
} from "./fx";
import { FONT_SONG, FPS, STAGE, framesOf, type AnimParams } from "@/remotion/shared/theme";
import { TPL_FONT } from "@/templates/fonts";

// ---------------- 口播计时 ----------------
const PUNCT = /[，。：？！、；“”「」\s]/g;

/**
 * 由口播文本推出「某个词开始说的时刻（帧）」。cps = 每秒字数，start = 口播在本片段里的起点（秒）。
 * 找不到就报错，避免悄悄错位。
 */
export function makeVoAt(script: string, cps: number, start: number) {
  const spoken = script.replace(PUNCT, "");
  return (phrase: string, nth = 0): number => {
    let idx = -1;
    for (let i = 0; i <= nth; i++) idx = spoken.indexOf(phrase, idx + 1);
    if (idx < 0) throw new Error(`口播里找不到「${phrase}」`);
    return framesOf(start + idx / cps);
  };
}
/** 口播总时长（秒） */
export const voSeconds = (script: string, cps: number) => script.replace(PUNCT, "").length / cps;
export const sec = (f: number) => Math.round((f / FPS) * 100) / 100;

// ---------------- 文案 ----------------
export function textOf<K extends string>(params: AnimParams, defaults: Record<K, string>, key: K) {
  const v = params.customTexts?.[key];
  return v !== undefined && v.trim() !== "" ? v.trim() : defaults[key];
}
export function allTextsOf<K extends string>(
  defaults: Record<K, string>,
  params?: AnimParams,
  extra = "",
) {
  const p = params ?? { startMs: 0, staggerMs: 0, durationMs: 0 };
  return (Object.keys(defaults) as K[]).map((k) => textOf(p, defaults, k)).join("") + extra;
}

export const KAI = TPL_FONT;
export const SONG = FONT_SONG;

export function tracePoly(ctx: CanvasRenderingContext2D, pts: Pt[], close = true) {
  pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
  if (close) ctx.closePath();
}

export const chars = (t: string) => Array.from(t);

/** 竖排字距 */
const VSTEP = 1.06;

export function textBounds(
  text: string,
  x: number,
  y: number,
  fs: number,
  vertical = false,
): Bounds {
  const n = chars(text).length;
  return vertical
    ? {
        x: x - fs * 0.62,
        y: y - (n * fs * VSTEP) / 2 - fs * 0.1,
        w: fs * 1.24,
        h: n * fs * VSTEP + fs * 0.2,
      }
    : { x: x - (n * fs * 1.02) / 2, y: y - fs * 0.64, w: n * fs * 1.02, h: fs * 1.28 };
}

export type TextStyle = {
  color: string;
  weight?: number;
  vertical?: boolean;
  font?: string;
  align?: CanvasTextAlign;
  spacing?: number;
};

export function fillText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fs: number,
  s: TextStyle,
) {
  ctx.save();
  ctx.fillStyle = s.color;
  ctx.font = `${s.weight ?? 700} ${Math.round(fs)}px ${s.font ?? KAI}`;
  ctx.textAlign = s.align ?? "center";
  ctx.textBaseline = "middle";
  const cs = chars(text);
  if (s.vertical) {
    const step = fs * (s.spacing ?? VSTEP);
    cs.forEach((ch, i) => ctx.fillText(ch, x, y - ((cs.length - 1) * step) / 2 + i * step));
  } else if (s.spacing && s.spacing !== 1) {
    const step = fs * s.spacing;
    cs.forEach((ch, i) => ctx.fillText(ch, x - ((cs.length - 1) * step) / 2 + i * step, y));
  } else {
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

/** 字号随字数收缩，保证不溢出（maxLen 是这一行/列允许的长度） */
export function fitSize(text: string, base: number, maxLen: number, per = 1.04) {
  const n = Math.max(1, chars(text).length);
  return Math.min(base, maxLen / (n * per));
}

/** 水墨晕开显现的文字（p: 0..1）。wash 给一层很淡的墨洗 */
export function inkText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fs: number,
  p: number,
  seed: number,
  s: TextStyle & { wash?: number; dy?: number },
) {
  if (p <= 0 || !text) return;
  const b = textBounds(text, x, y, fs, s.vertical);
  drawInkReveal(ctx, p, b, seed, (c) => fillText(c, text, x, y + (s.dy ?? 0), fs, s), {
    wash: s.wash ? s.color : undefined,
    washAlpha: s.wash ?? 0,
  });
}

/** 用 shadowBlur 画柔和投影（形状本体画到画面外，只留影子；Safari 也一致） */
export function softShadow(
  ctx: CanvasRenderingContext2D,
  path: () => void,
  o: { blur: number; dx: number; dy: number; alpha: number; color?: string },
) {
  if (o.alpha <= 0.002) return;
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

/** 朱砂两笔叉（p: 0..1，第二笔稍晚） */
export function brushCross(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  p: number,
  color: string,
  seed = 1,
  width = 14,
) {
  if (p <= 0) return;
  const h = size / 2;
  drawBrushStroke(
    ctx,
    [
      { x: cx - h, y: cy - h * 0.92 },
      { x: cx - h * 0.1, y: cy + h * 0.02 },
      { x: cx + h * 1.02, y: cy + h },
    ],
    easeOutExpo(progress(p, 0, 0.55)),
    { width, color, seed, tail: 0.25, jitter: 0.3 },
  );
  drawBrushStroke(
    ctx,
    [
      { x: cx + h * 0.96, y: cy - h },
      { x: cx + h * 0.05, y: cy - h * 0.04 },
      { x: cx - h, y: cy + h * 0.94 },
    ],
    easeOutExpo(progress(p, 0.42, 1)),
    { width, color, seed: seed + 1, tail: 0.25, jitter: 0.3 },
  );
}

/** 毛笔圈（不闭合，起笔重） */
export function brushRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  p: number,
  color: string,
  seed = 1,
  width = 8,
) {
  if (p <= 0) return;
  const pts: Pt[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = -Math.PI * 0.62 + (i / 64) * TAU * 0.95;
    const w = 1 + Math.sin(i * 0.5 + seed) * 0.015;
    pts.push({ x: cx + Math.cos(a) * rx * w, y: cy + Math.sin(a) * ry * w });
  }
  drawBrushStroke(ctx, pts, easeInOutCubic(p), { width, color, seed, tail: 0.25, jitter: 0.25 });
}

/** 间距标尺：两端短横 + 中间一道细笔（像木工划线），p 0..1 */
export function gapMarker(
  ctx: CanvasRenderingContext2D,
  a: Pt,
  b: Pt,
  p: number,
  color: string,
  seed = 1,
  tick = 26,
) {
  if (p <= 0) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const tp = easeOutExpo(progress(p, 0, 0.35));
  for (const [q, s] of [
    [a, seed],
    [b, seed + 1],
  ] as const) {
    drawBrushStroke(
      ctx,
      [
        { x: q.x - nx * tick, y: q.y - ny * tick },
        { x: q.x + nx * tick, y: q.y + ny * tick },
      ],
      tp,
      { width: 5, color, seed: s, tail: 0.2 },
    );
  }
  const lp = easeInOutCubic(progress(p, 0.2, 1));
  const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  // 从中间往两头长
  const half = (q: Pt): Pt[] => [m, { x: m.x + (q.x - m.x) * 0.92, y: m.y + (q.y - m.y) * 0.92 }];
  drawBrushStroke(ctx, half(a), lp, { width: 3.4, color, seed: seed + 2, tail: 0.5, head: 0.02 });
  drawBrushStroke(ctx, half(b), lp, { width: 3.4, color, seed: seed + 3, tail: 0.5, head: 0.02 });
}

export function mixColor(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (n: number, s: number) => (n >> s) & 255;
  const m = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}

/** 0→1→0 的显隐（进 inDur 帧，出 outDur 帧），用于一句话的字幕卡 */
export function life(frame: number, at: number, out: number, inDur = 14, outDur = 12) {
  // progress 已按 TEMPO 放慢，退场窗口要按放慢后的长度判断
  if (frame < at || frame > out + outDur * TEMPO) return 0;
  return (
    easeOutCubic(progress(frame, at, at + inDur)) *
    (1 - easeInOutCubic(progress(frame, out, out + outDur)))
  );
}

// ---------------- 每一帧的标准分层 ----------------
export type FrameLayers = {
  /** 主体平面（depth 1） */
  subject: (pal: FxPalette) => void;
  /** 远景（depth 0.35，宣纸之上）：比如墙、窗 */
  back?: (pal: FxPalette) => void;
  /** 文字带（depth 0.12，几乎钉屏） */
  text?: (pal: FxPalette) => void;
  /** 前景碎叶的数量（0 = 不画） */
  leaves?: number;
  /** 窗光强度（避光时调低） */
  light?: number;
  /** 最上层（不跟镜头）：比如整体压暗 */
  over?: (pal: FxPalette) => void;
};

export function beginFrame(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const frame = (elapsed / 1000) * FPS;
  const pal = fxPalette(params.paperTheme);
  if ("reset" in ctx && typeof ctx.reset === "function") ctx.reset();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  return { frame, pal, fontScale: params.fontScale ?? 1 };
}

export function renderLayers(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  cam: Camera,
  L: FrameLayers,
) {
  const light = L.light ?? 1;
  withLayer(ctx, cam, 0.35, () => {
    ctx.translate(STAGE.width / 2, STAGE.height / 2);
    ctx.scale(1.08, 1.08);
    ctx.translate(-STAGE.width / 2, -STAGE.height / 2);
    drawRicePaper(ctx, pal);
    L.back?.(pal);
  });
  withLayer(ctx, cam, 0.55, () => {
    drawLightSpots(
      ctx,
      lightSpots(frame, 16, { x: -40, y: 40, w: 760, h: 1200 }, 4),
      pal.light,
      0.9 * clamp01(light),
    );
  });
  withLayer(ctx, cam, 1, () => L.subject(pal));
  if (L.leaves) {
    withLayer(ctx, cam, 1.35, () => {
      drawLeafParticles(
        ctx,
        leafParticles(frame, L.leaves ?? 0, { x: 60, y: 300, w: 960, h: 1220 }, 8),
        [pal.bamboo, pal.tea, pal.oat],
        0.5,
      );
    });
  }
  if (L.text) withLayer(ctx, cam, 0.12, () => L.text?.(pal));
  drawWindowLight(ctx, frame, pal, light);
  L.over?.(pal);
  drawVignette(ctx, pal, 1);
  drawGrain(ctx, frame, 0.55);
}

/** 字幕安全区：底部 300px 不放任何画面元素（调试时可画出来看） */
export const SAFE_BOTTOM = STAGE.height - 300;
