/**
 * 产品物件共用的小工具（自带，不依赖某一期的 kit），全部是确定性纯函数。
 */
export const TAU = Math.PI * 2;
export const PKG_KAI = '"ZS WenKai", "LXGW WenKai", "Noto Serif SC", serif';
export const PKG_SONG = '"Noto Serif SC", "Songti SC", "Source Han Serif SC", serif';
export const PKG_HEI = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

export type Pt = { x: number; y: number };

export function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** 可复现的伪随机序列 */
export function seq(seed: number) {
  let i = 0;
  return () => hash(seed * 1000 + i++);
}

export function alpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** 略带起伏的茶饼外轮廓（半径 r） */
export function cakeOutline(r: number, n = 160): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const k = 1 + 0.006 * Math.sin(a * 3 + 1.3) + 0.004 * Math.sin(a * 7 + 0.4) + 0.0025 * Math.sin(a * 13);
    out.push({ x: Math.cos(a) * r * k, y: Math.sin(a) * r * k });
  }
  return out;
}

export function tracePts(c: CanvasRenderingContext2D, pts: Pt[]) {
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.closePath();
}

export function text(
  c: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size: number,
  color: string | CanvasGradient,
  font: string,
  weight = 700,
  align: CanvasTextAlign = "center",
) {
  c.save();
  c.fillStyle = color;
  c.font = `${weight} ${Math.round(size)}px ${font}`;
  c.textAlign = align;
  c.textBaseline = "middle";
  c.fillText(s, x, y);
  c.restore();
}

/** 竖排 */
export function vtext(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string | CanvasGradient, font: string, weight = 700, step = 1.12) {
  const cs = Array.from(s);
  cs.forEach((ch, i) => text(c, ch, x, y + (i - (cs.length - 1) / 2) * size * step, size, color, font, weight));
}

/** 沿圆弧排字（弧心 (0, cy)，半径 r，文字中心在正下方 a=π/2） */
export function arcText(c: CanvasRenderingContext2D, s: string, cy: number, r: number, size: number, color: string, font: string, squeeze = 0.82) {
  c.save();
  c.fillStyle = color;
  c.font = `800 ${Math.round(size)}px ${font}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  const cs = Array.from(s);
  const ws = cs.map((ch) => c.measureText(ch).width * squeeze);
  let acc = -ws.reduce((a, b) => a + b, 0) / 2;
  cs.forEach((ch, i) => {
    const mid = acc + ws[i] / 2;
    acc += ws[i];
    const a = Math.PI / 2 - mid / r;
    c.save();
    c.translate(Math.cos(a) * r, cy + Math.sin(a) * r);
    c.rotate(a - Math.PI / 2);
    c.scale(squeeze, 1);
    c.fillText(ch, 0, 0);
    c.restore();
  });
  c.restore();
}

/** 离屏缓存：静态包装面只画一次（浏览器 / Node 渲染脚本通用） */
const cache = new Map<string, { canvas: CanvasImageSource }>();
let makeCanvas: ((w: number, h: number) => { canvas: CanvasImageSource; ctx: CanvasRenderingContext2D }) | null = null;

export function setProductCanvasFactory(f: (w: number, h: number) => { canvas: CanvasImageSource; ctx: CanvasRenderingContext2D }) {
  makeCanvas = f;
  cache.clear();
}

export function cached(key: string, w: number, h: number, paint: (c: CanvasRenderingContext2D) => void): CanvasImageSource | null {
  const hit = cache.get(key);
  if (hit) return hit.canvas;
  let made: { canvas: CanvasImageSource; ctx: CanvasRenderingContext2D } | null = null;
  if (makeCanvas) made = makeCanvas(w, h);
  else if (typeof document !== "undefined") {
    const el = document.createElement("canvas");
    el.width = w;
    el.height = h;
    made = { canvas: el, ctx: el.getContext("2d") as CanvasRenderingContext2D };
  }
  if (!made) return null;
  paint(made.ctx);
  cache.set(key, { canvas: made.canvas });
  if (cache.size > 24) cache.delete(cache.keys().next().value as string);
  return made.canvas;
}

/** 柔和落影（与 kit 里 softShadow 同一做法：把形状挪出画面，只留影子） */
export function dropShadow(c: CanvasRenderingContext2D, path: () => void, blur: number, dx: number, dy: number, a: number) {
  if (a <= 0.002) return;
  const m = c.getTransform();
  const s = Math.hypot(m.a, m.b) || 1;
  const far = 10000;
  c.save();
  c.shadowColor = `rgba(58,38,22,${a})`;
  c.shadowBlur = blur * s;
  c.shadowOffsetX = (dx + far) * m.a + dy * m.c;
  c.shadowOffsetY = (dx + far) * m.b + dy * m.d;
  c.translate(-far, 0);
  path();
  c.fillStyle = "#000";
  c.fill();
  c.restore();
}

/** 木纹（胡桃木 / 印刷木纹纸）：在 (x, y, w, h) 内画暗色流线 */
export function woodGrain(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, ink: string, density = 1) {
  const r = seq(seed);
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  const lines = Math.round(70 * density);
  for (let i = 0; i < lines; i++) {
    const y0 = y + (i / lines) * h + (r() - 0.5) * 6;
    const amp = 2 + r() * 6;
    const freq = 0.004 + r() * 0.006;
    const ph = r() * TAU;
    c.strokeStyle = alpha(ink, 0.06 + r() * 0.12);
    c.lineWidth = 0.6 + r() * 1.6;
    c.beginPath();
    for (let k = 0; k <= 60; k++) {
      const xx = x + (k / 60) * w;
      const yy = y0 + Math.sin(xx * freq + ph) * amp + Math.sin(xx * freq * 3.1 + ph * 2) * amp * 0.3;
      k ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
    }
    c.stroke();
  }
  // 几处木眼（椭圆年轮）
  for (let i = 0; i < 3; i++) {
    const cx = x + w * (0.15 + r() * 0.7);
    const cy = y + h * (0.1 + r() * 0.8);
    for (let k = 1; k <= 5; k++) {
      c.strokeStyle = alpha(ink, 0.1);
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(cx, cy, w * 0.03 * k, h * 0.006 * k, 0, 0, TAU * 0.9995);
      c.stroke();
    }
  }
  c.restore();
}


// ---------------------------------------------------------------------------
// 手绘感工具：笔触、抖动、纸纹（与即梦的平涂淡彩手绘对齐，全部确定性）
// ---------------------------------------------------------------------------

/** 0–1 平滑一维噪声（确定性） */
export function noise(x: number, seed: number) {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i + seed * 57.31);
  const b = hash(i + 1 + seed * 57.31);
  const t = f * f * (3 - 2 * f);
  return a + (b - a) * t;
}

export function bezierPts(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 40): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return out;
}

export function arcPts(cx: number, cy: number, r: number, a0: number, a1: number, n = 40): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return out;
}

export function shift(pts: Pt[], dx: number, dy: number): Pt[] {
  return pts.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

export type BrushOpts = { seed?: number; taperIn?: number; taperOut?: number; wobble?: number };

/**
 * 手绘笔触：沿折线画一条粗细变化的线（起笔略重、收笔尖、粗细与边缘轻微抖动）。
 * width 为最粗处的像素宽；taperIn / taperOut 为起收笔占全长的比例（0 = 不收）。
 */
export function brushLine(c: CanvasRenderingContext2D, pts: Pt[], width: number, color: string, opts: BrushOpts = {}) {
  const { seed = 1, taperIn = 0.15, taperOut = 0.35, wobble = 0.18 } = opts;
  const n = pts.length;
  if (n < 2) return;
  const L = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = L[n - 1] || 1;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[Math.min(n - 1, i + 1)];
    const o = pts[Math.max(0, i - 1)];
    let dx = q.x - o.x;
    let dy = q.y - o.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const t = L[i] / total;
    const tin = taperIn > 0 ? Math.min(1, t / taperIn) : 1;
    const tout = taperOut > 0 ? Math.min(1, (1 - t) / taperOut) : 1;
    const prof = (0.4 + 0.6 * Math.sin((tin * Math.PI) / 2)) * (0.12 + 0.88 * Math.sin((tout * Math.PI) / 2));
    const jitter = 1 + wobble * (noise(L[i] / 18, seed) - 0.5) * 2;
    const w = (width * prof * jitter) / 2;
    const off = wobble * width * 0.3 * (noise(L[i] / 29, seed + 7) - 0.5);
    left.push({ x: p.x - dy * (w + off), y: p.y + dx * (w + off) });
    right.push({ x: p.x + dy * (w - off), y: p.y - dx * (w - off) });
  }
  c.save();
  c.fillStyle = color;
  c.beginPath();
  left.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  for (let i = n - 1; i >= 0; i--) c.lineTo(right[i].x, right[i].y);
  c.closePath();
  c.fill();
  c.restore();
}

/** 带抖动的闭合 / 开放多边形（平涂色块的边不完全规整） */
export function wobblyPoly(c: CanvasRenderingContext2D, pts: Pt[], amp: number, seed: number) {
  c.beginPath();
  pts.forEach((p, i) => {
    const x = p.x + (noise(i * 0.7, seed) - 0.5) * amp * 2;
    const y = p.y + (noise(i * 0.7, seed + 3) - 0.5) * amp * 2;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  });
  c.closePath();
}

/** 印刷落在棉纸上的「纸齿」：在已画好的图案上撒纸色小点，让色块不再死平 */
export function paperTooth(c: CanvasRenderingContext2D, r: number, paperColor: string, seed: number, count = 1400) {
  const rr = seq(seed);
  c.save();
  for (let i = 0; i < count; i++) {
    const a = rr() * TAU;
    const d = Math.sqrt(rr()) * r;
    c.fillStyle = alpha(paperColor, 0.25 + rr() * 0.4);
    c.beginPath();
    c.arc(Math.cos(a) * d, Math.sin(a) * d, 0.8 + rr() * 1.8, 0, TAU * 0.9995);
    c.fill();
  }
  c.restore();
}
