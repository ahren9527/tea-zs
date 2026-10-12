/**
 * 画布绘制工具：纸张、文字排版（自动缩字/换行）、印章、笔触、卡片、勾叉。
 * 所有模板的预览（Remotion 内 canvas）和导出（离屏 canvas）都走这里，保证两边一模一样。
 */
import { fillPaper } from "@/remotion/shared/draw-paper";
import { PAPER_THEMES, SEAL_FONT, type PaperThemeKey } from "@/remotion/shared/theme";
import { TPL_FONT as FONT, TPL_FONT_SONG as FONT_SONG } from "../fonts";
import { clamp, easeOutBack, easeOutCubic, rand } from "./motion";

export const W = 1080;
export const H = 1920;
export { FONT, FONT_SONG, SEAL_FONT };

export type Palette = {
  key: PaperThemeKey;
  paper: string;
  paperDeep: string;
  ink: string;
  seal: string;
  border: string;
  muted: string;
  faint: string;
  good: string;
  dark: boolean;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${c(r1, r2)}, ${c(g1, g2)}, ${c(b1, b2)})`;
}

export function alpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(a)})`;
}

export function palette(key: PaperThemeKey = "classic"): Palette {
  const t = PAPER_THEMES[key] ?? PAPER_THEMES.classic;
  const [r, g, b] = hexToRgb(t.paper);
  const dark = (r * 299 + g * 587 + b * 114) / 1000 < 110;
  return {
    key,
    paper: t.paper,
    paperDeep: t.paperDeep,
    ink: t.ink,
    seal: t.seal,
    border: t.border,
    muted: mix(t.ink, t.paper, 0.42),
    faint: mix(t.ink, t.paper, 0.72),
    good: dark ? "#8fb39a" : "#3d6450",
    dark,
  };
}

export type Env = {
  ctx: CanvasRenderingContext2D;
  pal: Palette;
  fs: number; // fontScale
  t: number; // 秒
};

/** 纸底：复用原有宣纸纹理 + 版心线，再加一层柔和暗角 */
export function paper(env: Env) {
  const { ctx, pal } = env;
  fillPaper(ctx, pal.key);
  ctx.save();
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.72);
  g.addColorStop(0, alpha(pal.paperDeep, 0));
  g.addColorStop(1, alpha(pal.paperDeep, pal.dark ? 0.5 : 0.55));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 文字
// ---------------------------------------------------------------------------

export type FontSpec = { size: number; weight?: number; family?: string };

export function font(f: FontSpec, fs = 1) {
  return `${f.weight ?? 600} ${Math.round(f.size * fs)}px ${f.family ?? FONT}`;
}

/** 在 maxW 内能放下的最大字号（不超过 size，不低于 minSize） */
export function fitSize(ctx: CanvasRenderingContext2D, text: string, f: FontSpec, maxW: number, fs = 1, minSize = 24) {
  let size = Math.round(f.size * fs);
  ctx.save();
  for (; size > minSize; size -= 2) {
    ctx.font = `${f.weight ?? 600} ${size}px ${f.family ?? FONT}`;
    if (ctx.measureText(text).width <= maxW) break;
  }
  ctx.restore();
  return Math.max(minSize, size);
}

const NO_LINE_START = "，。、；：？！）」』》”’,.;:?!)·…";
const NO_LINE_END = "（「『《“‘(";

/** 中文按字断行，标点避头尾；显式 \n 强制换行 */
export function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    const chars = Array.from(para);
    let line = "";
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        if (NO_LINE_START.includes(ch)) {
          // 把标点挂在行尾
          out.push(test);
          line = "";
          continue;
        }
        const last = Array.from(line).pop() ?? "";
        if (NO_LINE_END.includes(last)) {
          out.push(line.slice(0, -last.length));
          line = last + ch;
          continue;
        }
        out.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line || !out.length) out.push(line);
  }
  return out.filter((l, i, arr) => l !== "" || arr.length === 1);
}

/**
 * 文本块排版：先尝试缩字放进一行，缩到 minSize 仍放不下则换行（最多 maxLines），
 * 行多了再整体缩小。返回字号与行数组，绘制交给 drawLines。
 */
export function layoutText(
  ctx: CanvasRenderingContext2D,
  text: string,
  f: FontSpec,
  maxW: number,
  fs = 1,
  opts: { maxLines?: number; minSize?: number; oneLineMin?: number } = {},
) {
  const maxLines = opts.maxLines ?? 3;
  const minSize = opts.minSize ?? 28;
  const base = Math.round(f.size * fs);
  const oneLineMin = opts.oneLineMin ?? Math.round(base * 0.72);
  const single = fitSize(ctx, text.replace(/\n/g, ""), f, maxW, fs, minSize);
  if (!text.includes("\n") && single >= oneLineMin) return { size: single, lines: [text] };
  for (let size = base; size >= minSize; size -= 2) {
    ctx.save();
    ctx.font = `${f.weight ?? 600} ${size}px ${f.family ?? FONT}`;
    const lines = wrap(ctx, text, maxW);
    ctx.restore();
    if (lines.length <= maxLines) return { size, lines };
  }
  ctx.save();
  ctx.font = `${f.weight ?? 600} ${minSize}px ${f.family ?? FONT}`;
  const lines = wrap(ctx, text, maxW).slice(0, maxLines);
  ctx.restore();
  return { size: minSize, lines };
}

export function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  cy: number,
  size: number,
  opts: { weight?: number; family?: string; color: string; align?: CanvasTextAlign; lh?: number; spacing?: number },
) {
  const lh = size * (opts.lh ?? 1.28);
  ctx.save();
  ctx.font = `${opts.weight ?? 600} ${size}px ${opts.family ?? FONT}`;
  ctx.fillStyle = opts.color;
  ctx.textAlign = opts.align ?? "center";
  ctx.textBaseline = "middle";
  if (opts.spacing) (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${opts.spacing}px`;
  const top = cy - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, top + i * lh));
  ctx.restore();
  return lines.length * lh;
}

/** 一句话自动排版并绘制（常用捷径） */
export function text(
  env: Env,
  s: string,
  x: number,
  cy: number,
  f: FontSpec & { color: string; maxW: number; maxLines?: number; align?: CanvasTextAlign; spacing?: number; minSize?: number },
) {
  if (!s) return 0;
  const { size, lines } = layoutText(env.ctx, s, f, f.maxW, env.fs, { maxLines: f.maxLines, minSize: f.minSize });
  return drawLines(env.ctx, lines, x, cy, size, {
    weight: f.weight,
    family: f.family,
    color: f.color,
    align: f.align,
    spacing: f.spacing,
  });
}

/** 逐字墨迹显现：每个字从淡、微放大、轻微上浮落定 */
export function inkReveal(
  env: Env,
  s: string,
  cx: number,
  cy: number,
  f: FontSpec & { color: string; maxW: number; minSize?: number },
  p: number,
  stagger = 0.08,
) {
  const { ctx } = env;
  if (!s || p <= 0) return;
  const size = fitSize(ctx, s, f, f.maxW, env.fs, f.minSize ?? 40);
  const chars = Array.from(s);
  ctx.save();
  ctx.font = `${f.weight ?? 600} ${size}px ${f.family ?? FONT}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = cx - total / 2;
  const n = chars.length;
  const span = 1 - Math.min(0.7, stagger * (n - 1));
  chars.forEach((c, i) => {
    const local = clamp((p - i * stagger) / Math.max(0.2, span));
    const e = easeOutCubic(local);
    if (e > 0.005) {
      ctx.save();
      ctx.globalAlpha *= e;
      const w = widths[i];
      ctx.translate(x + w / 2, cy + (1 - e) * size * 0.18);
      const s2 = 1.12 - 0.12 * e;
      ctx.scale(s2, s2);
      ctx.fillStyle = f.color;
      ctx.textAlign = "center";
      ctx.fillText(c, 0, 0);
      ctx.restore();
    }
    x += widths[i];
  });
  ctx.restore();
  return { size, width: total };
}

// ---------------------------------------------------------------------------
// 笔触 / 线条
// ---------------------------------------------------------------------------

/** 毛笔横画：两头尖、中间饱满，带轻微飞白；p 控制从左到右写出 */
export function brush(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y: number,
  x2: number,
  thick: number,
  color: string,
  p = 1,
  seed = 1,
) {
  if (p <= 0) return;
  const len = (x2 - x1) * clamp(p);
  const steps = 28;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const top: [number, number][] = [];
  const bot: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const x = x1 + len * u;
    const taper = Math.sin(Math.PI * Math.min(1, u * 1.05 + 0.02)) ** 0.6;
    const wob = (rand(seed * 13 + i) - 0.5) * thick * 0.18;
    const h = (thick / 2) * (0.35 + 0.65 * taper);
    top.push([x, y - h + wob + Math.sin(u * 3 + seed) * thick * 0.08]);
    bot.push([x, y + h + wob * 0.6 + Math.sin(u * 3 + seed) * thick * 0.08]);
  }
  ctx.moveTo(top[0][0], top[0][1]);
  top.forEach(([x, yy]) => ctx.lineTo(x, yy));
  for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
  ctx.closePath();
  ctx.globalAlpha *= 0.9;
  ctx.fill();
  // 飞白
  ctx.globalCompositeOperation = "destination-out";
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 7; i++) {
    const u = 0.35 + rand(seed + i * 7) * 0.6;
    if (u > p) continue;
    const yy = y + (rand(seed * 3 + i) - 0.5) * thick * 0.7;
    ctx.fillRect(x1 + (x2 - x1) * u, yy, (x2 - x1) * 0.12 * rand(i + seed), 1.6);
  }
  ctx.restore();
}

/** 细引线（带端点圆点） */
export function leader(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, p: number) {
  if (p <= 0) return;
  const x = x1 + (x2 - x1) * p;
  const y = y1 + (y2 - y1) * p;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x1, y1, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 印章
// ---------------------------------------------------------------------------

export type SealOpts = {
  x: number;
  y: number;
  size: number;
  /** 0..1 落印进度（从大到小砸下） */
  p: number;
  rot?: number;
  /** filled=朱文底白字（阴文），否则白底红字框（阳文） */
  filled?: boolean;
  round?: boolean;
  color: string;
  paper: string;
  seed?: number;
  fs?: number;
};

/** 印章排字：1字居中，2-3字竖排，4字田字（右起竖读），5字以上缩成两列 */
function sealGlyphs(chars: string[], size: number) {
  const n = chars.length;
  const inner = size * 0.78;
  if (n <= 1) return chars.map((c) => ({ c, x: 0, y: 0, s: inner * 0.82 }));
  if (n <= 3) {
    const s = Math.min(inner / n, inner * 0.72);
    return chars.map((c, i) => ({ c, x: 0, y: (i - (n - 1) / 2) * s * 1.02, s: s * 0.94 }));
  }
  const cols = 2;
  const rows = Math.ceil(n / cols);
  const s = Math.min(inner / rows, inner / cols);
  return chars.map((c, i) => {
    const col = Math.floor(i / rows); // 右起
    const row = i % rows;
    return { c, x: (0.5 - col) * s * 1.02, y: (row - (rows - 1) / 2) * s * 1.02, s: s * 0.92 };
  });
}

export function seal(ctx: CanvasRenderingContext2D, label: string, o: SealOpts) {
  if (o.p <= 0 || !label) return;
  const chars = Array.from(label.replace(/\s+/g, ""));
  const e = easeOutBack(o.p, 1.9);
  const scale = 1.75 - 0.75 * e;
  const a = clamp(o.p * 3);
  const rot = ((o.rot ?? -6) + (1 - easeOutCubic(o.p)) * -14) * (Math.PI / 180);
  const size = o.size;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha *= a;
  // 冲击墨晕
  if (o.p > 0.35 && o.p < 1) {
    const r = clamp((o.p - 0.35) / 0.65);
    ctx.save();
    ctx.globalAlpha *= (1 - r) * 0.35;
    ctx.strokeStyle = o.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, size * (0.62 + r * 0.5), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const half = size / 2;
  ctx.beginPath();
  if (o.round) ctx.arc(0, 0, half, 0, Math.PI * 2);
  else ctx.roundRect(-half, -half, size, size, size * 0.07);
  if (o.filled) {
    ctx.fillStyle = o.color;
    ctx.fill();
  } else {
    ctx.fillStyle = alpha(o.paper, 0.92);
    ctx.fill();
    ctx.strokeStyle = o.color;
    ctx.lineWidth = Math.max(4, size * 0.045);
    ctx.stroke();
    ctx.beginPath();
    const ins = size * 0.075;
    if (o.round) ctx.arc(0, 0, half - ins, 0, Math.PI * 2);
    else ctx.roundRect(-half + ins, -half + ins, size - ins * 2, size - ins * 2, size * 0.04);
    ctx.lineWidth = Math.max(1.5, size * 0.015);
    ctx.stroke();
  }
  ctx.fillStyle = o.filled ? o.paper : o.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const g of sealGlyphs(chars, size * (o.round ? 0.86 : 1))) {
    ctx.font = `900 ${Math.round(g.s)}px ${SEAL_FONT}`;
    ctx.fillText(g.c, g.x, g.y + g.s * 0.04);
  }
  // 印泥斑驳
  ctx.globalCompositeOperation = "destination-out";
  const seed = o.seed ?? 3;
  for (let i = 0; i < 26; i++) {
    const rx = (rand(seed * 31 + i) - 0.5) * size;
    const ry = (rand(seed * 17 + i * 3) - 0.5) * size;
    ctx.globalAlpha = 0.25 + rand(i + seed) * 0.35;
    ctx.beginPath();
    ctx.arc(rx, ry, 1 + rand(i * 5 + seed) * size * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** 横幅印章（长条，适合 4-10 字的「标牌」：避开厨房油烟 ✖） */
export function plaque(
  env: Env,
  label: string,
  cx: number,
  cy: number,
  p: number,
  opts: { color?: string; maxW?: number; size?: number; filled?: boolean; mark?: "ok" | "bad" | "" } = {},
) {
  const { ctx, pal, fs } = env;
  if (p <= 0 || !label) return;
  const color = opts.color ?? pal.seal;
  const maxW = opts.maxW ?? 820;
  const markW = opts.mark ? 1 : 0;
  const base = opts.size ?? 64;
  const size = fitSize(ctx, label, { size: base, weight: 800, family: FONT_SONG }, maxW - 120 - markW * 90, fs, 30);
  ctx.save();
  ctx.font = `800 ${size}px ${FONT_SONG}`;
  const tw = ctx.measureText(label).width;
  const markSize = size * 1.05;
  const w = tw + 110 + (opts.mark ? markSize + 24 : 0);
  const h = size + 64;
  const e = easeOutBack(p, 1.6);
  ctx.translate(cx, cy + (1 - easeOutCubic(p)) * -60);
  ctx.scale(0.6 + 0.4 * e, 0.6 + 0.4 * e);
  ctx.rotate((-1.5 * Math.PI) / 180);
  ctx.globalAlpha *= clamp(p * 2.5);
  ctx.shadowColor = alpha(pal.ink, 0.18);
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 14);
  ctx.fillStyle = opts.filled ? color : pal.paper;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 8);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = opts.filled ? alpha(pal.paper, 0.6) : alpha(color, 0.6);
  ctx.stroke();
  ctx.fillStyle = opts.filled ? pal.paper : color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const x0 = -w / 2 + 55;
  ctx.fillText(label, x0, 2);
  if (opts.mark) {
    const mx = x0 + tw + 24 + markSize / 2;
    if (opts.mark === "ok") check(ctx, mx, 0, markSize, opts.filled ? pal.paper : color, 1);
    else cross(ctx, mx, 0, markSize, opts.filled ? pal.paper : color, 1);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 卡片 / 记号
// ---------------------------------------------------------------------------

export function card(
  env: Env,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: string; accent?: string | null; radius?: number; shadow?: number; border?: string } = {},
) {
  const { ctx, pal } = env;
  const r = opts.radius ?? 26;
  ctx.save();
  if (opts.shadow !== 0) {
    ctx.shadowColor = alpha(pal.dark ? "#000000" : pal.ink, pal.dark ? 0.45 : 0.1);
    ctx.shadowBlur = opts.shadow ?? 30;
    ctx.shadowOffsetY = 12;
  }
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = opts.fill ?? (pal.dark ? mix(pal.paper, pal.paperDeep, 0.9) : mix(pal.paper, "#ffffff", 0.35));
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = opts.border ?? alpha(pal.ink, 0.12);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (opts.accent !== null) {
    ctx.fillStyle = opts.accent ?? pal.seal;
    ctx.beginPath();
    ctx.roundRect(x, y + Math.min(26, h * 0.18), 7, h - Math.min(52, h * 0.36), 4);
    ctx.fill();
  }
  ctx.restore();
}

export function check(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, p = 1) {
  if (p <= 0) return;
  const s = size / 2;
  const pts: [number, number][] = [
    [-s * 0.62, s * 0.02],
    [-s * 0.16, s * 0.48],
    [s * 0.7, -s * 0.5],
  ];
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(4, size * 0.13);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx + pts[0][0], cy + pts[0][1]);
  const p1 = clamp(p / 0.4);
  ctx.lineTo(cx + pts[0][0] + (pts[1][0] - pts[0][0]) * p1, cy + pts[0][1] + (pts[1][1] - pts[0][1]) * p1);
  if (p > 0.4) {
    const p2 = clamp((p - 0.4) / 0.6);
    ctx.lineTo(cx + pts[1][0] + (pts[2][0] - pts[1][0]) * p2, cy + pts[1][1] + (pts[2][1] - pts[1][1]) * p2);
  }
  ctx.stroke();
  ctx.restore();
}

export function cross(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, p = 1) {
  if (p <= 0) return;
  const s = size * 0.36;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(4, size * 0.13);
  ctx.lineCap = "round";
  const p1 = clamp(p / 0.5);
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - s);
  ctx.lineTo(cx - s + 2 * s * p1, cy - s + 2 * s * p1);
  if (p > 0.5) {
    const p2 = clamp((p - 0.5) / 0.5);
    ctx.moveTo(cx + s, cy - s);
    ctx.lineTo(cx + s - 2 * s * p2, cy - s + 2 * s * p2);
  }
  ctx.stroke();
  ctx.restore();
}

/** 圆形徽记（勾 / 叉 / 字） */
export function badge(
  env: Env,
  cx: number,
  cy: number,
  size: number,
  kind: "ok" | "bad" | "text",
  p: number,
  label = "",
) {
  const { ctx, pal } = env;
  if (p <= 0) return;
  const color = kind === "ok" ? pal.good : pal.seal;
  const e = easeOutBack(p, 2);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(e, e);
  ctx.globalAlpha *= clamp(p * 3);
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = alpha(color, 0.1);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(3, size * 0.06);
  ctx.stroke();
  if (kind === "ok") check(ctx, 0, 0, size * 0.62, color, clamp(p * 1.4));
  else if (kind === "bad") cross(ctx, 0, 0, size * 0.62, color, clamp(p * 1.4));
  else {
    ctx.fillStyle = color;
    ctx.font = `900 ${Math.round(size * (Array.from(label).length > 1 ? 0.36 : 0.52))}px ${SEAL_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, size * 0.03);
  }
  ctx.restore();
}

/** 顶部标题区：小字眉题 + 主标题 + 毛笔下划线；返回占用的底部 y */
export function header(
  env: Env,
  opts: { eyebrow?: string; title: string; y?: number; p: number; color?: string; size?: number },
) {
  const { ctx, pal } = env;
  const y = opts.y ?? 250;
  const p = opts.p;
  if (p <= 0) return y + 120;
  const e = easeOutCubic(p);
  ctx.save();
  ctx.globalAlpha *= e;
  let cy = y;
  if (opts.eyebrow) {
    text(env, opts.eyebrow, W / 2, cy - 74 + (1 - e) * 12, {
      size: 36,
      weight: 500,
      color: pal.muted,
      maxW: 820,
      maxLines: 1,
      spacing: 6,
    });
  }
  const h = text(env, opts.title, W / 2, cy + (1 - e) * 16, {
    size: opts.size ?? 78,
    weight: 700,
    color: opts.color ?? pal.ink,
    maxW: 880,
    maxLines: 2,
  });
  cy += h / 2 + 34;
  ctx.restore();
  brush(ctx, W / 2 - 150, cy, W / 2 + 150, 14, alpha(pal.seal, 0.85), easeOutCubic(clamp((p - 0.25) / 0.75)), 7);
  return cy + 40;
}

/** 底部收束一句（朱红小字 + 两侧短线） */
export function footLine(env: Env, s: string, y: number, p: number, color?: string) {
  const { ctx, pal } = env;
  if (!s || p <= 0) return;
  const e = easeOutCubic(p);
  ctx.save();
  ctx.globalAlpha *= e;
  const size = fitSize(ctx, s, { size: 52, weight: 600 }, 760, env.fs, 28);
  ctx.font = `600 ${size}px ${FONT}`;
  const tw = ctx.measureText(s).width;
  ctx.fillStyle = color ?? pal.seal;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s, W / 2, y + (1 - e) * 14);
  ctx.strokeStyle = alpha(color ?? pal.seal, 0.55);
  ctx.lineWidth = 2;
  const gap = 28;
  const len = 70 * e;
  ctx.beginPath();
  ctx.moveTo(W / 2 - tw / 2 - gap, y);
  ctx.lineTo(W / 2 - tw / 2 - gap - len, y);
  ctx.moveTo(W / 2 + tw / 2 + gap, y);
  ctx.lineTo(W / 2 + tw / 2 + gap + len, y);
  ctx.stroke();
  ctx.restore();
}

/** 落款：品牌名竖排小印（每个模板默认在右下角带一个，可关闭） */
export function signature(env: Env, p: number, label = "正上") {
  if (p <= 0) return;
  seal(env.ctx, label, {
    x: W - 132,
    y: H - 190,
    size: 84,
    p,
    rot: -4,
    filled: true,
    color: env.pal.seal,
    paper: env.pal.paper,
    seed: 11,
  });
}

/**
 * 卡片内的「主文案 + 说明」文字块：左对齐、垂直居中，自动缩字直到放进 maxH。
 * 返回实际字号，便于调试。
 */
export function blockText(
  env: Env,
  o: { main: string; sub?: string; x: number; cy: number; maxW: number; maxH: number; size: number; subSize?: number; color?: string; subColor?: string; weight?: number; align?: CanvasTextAlign },
) {
  const { ctx, pal, fs } = env;
  const subBase = o.subSize ?? 38;
  let size = o.size;
  let lay = layoutText(ctx, o.main, { size, weight: o.weight ?? 700 }, o.maxW, fs, { maxLines: 2, minSize: 30 });
  let subPx = Math.round(subBase * fs);
  const total = () => lay.lines.length * lay.size * 1.22 + (o.sub ? subPx * 1.55 : 0);
  for (let i = 0; i < 12 && total() > o.maxH && size > 30; i++) {
    size -= 4;
    subPx = Math.max(22, Math.round(subPx * 0.94));
    lay = layoutText(ctx, o.main, { size, weight: o.weight ?? 700 }, o.maxW, fs, { maxLines: 2, minSize: 28 });
  }
  const showSub = Boolean(o.sub) && total() <= o.maxH + 4;
  const mainH = lay.lines.length * lay.size * 1.22;
  const all = mainH + (showSub ? subPx * 1.55 : 0);
  const mcy = o.cy - all / 2 + mainH / 2;
  drawLines(ctx, lay.lines, o.x, mcy, lay.size, { weight: o.weight ?? 700, color: o.color ?? pal.ink, align: o.align ?? "left", lh: 1.22 });
  if (showSub && o.sub) {
    const subSize = fitSize(ctx, o.sub, { size: subPx, weight: 500 }, o.maxW, 1, 20);
    drawLines(ctx, [o.sub], o.x, mcy + mainH / 2 + subPx * 0.85, subSize, { weight: 500, color: o.subColor ?? pal.muted, align: o.align ?? "left" });
  }
  return lay.size;
}
