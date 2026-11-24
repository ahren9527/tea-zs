/**
 * 照片描图茶饼的通用画法（素雪、月影共用；蜜韵在 miyun.ts 里单独写，规则相同）。
 *
 * 印刷图案不靠目测重画：每款从实物照片按颜色分层描出轮廓（xxx-data.ts，Google polyline 编码），
 * 这里只负责上色与质感——每层平涂「本色 + 右下暗面」两档，镭射烫字再加一道极淡的左上高光；
 * 丝带用拟合出的两段圆弧画（底色 + 细竖纹 + 上下细线 + 描出的白字）；
 * 顶部 logo 一律用官方 logo 原图描出的矢量（emblem.ts），位置和大小对齐照片；
 * 最后撒一层纸齿、压一道右下暗面、画手绘外缘，和即梦的平涂淡彩手绘对齐。
 * 包装上的字是印刷品，不跟面板字体走。原点为饼中心。
 */
import { WORDMARK_SIZE, drawBrandEmblem, drawBrandWordmark } from "./emblem";
import { TAU, alpha, bezierPts, brushLine, cached, cakeOutline, dropShadow, paperTooth, seq, tracePts } from "./common";

export type RibbonGeom = {
  top: { cy: number; r: number };
  bottom: { cy: number; r: number };
  /** 两端斜切：上沿端点 |x|、下沿端点 |x|（单位：饼半径 = 1） */
  endTopX: number;
  endBottomX: number;
};

export type LayerPaint = {
  layer: string;
  color: string;
  /** 暗面颜色（往右下错开一层）；不给就不画暗面 */
  shade?: string;
  /** 镭射烫字：左上极淡高光 */
  sheen?: string;
};

export type TracedCakeSpec = {
  /** 缓存 key */
  key: string;
  /** 数据坐标单位：饼半径 = unit */
  unit: number;
  layers: Readonly<Record<string, readonly string[]>>;
  ribbon: RibbonGeom;
  /** 丝带上的白字在哪一层 */
  ribbonTextLayer: string;
  /** 按顺序画的各层（丝带之前） */
  under: LayerPaint[];
  /** 丝带之后画的层（压在丝带上面的，一般没有） */
  over?: LayerPaint[];
  ribbonStyle: { fill: string; stripe: string; line: string; text: string };
  /** 照片里 logo 的位置（数据坐标）：壶形标中心与高度；品牌字 + 拼音的外框 */
  logo: { emblem: { x: number; y: number; h: number }; wordmark: { x0: number; x1: number; y0: number; y1: number } };
  /** 照片里纸边比图案多出的比例（图案按 R / paperMargin 缩放，四周留纸边） */
  paperMargin?: number;
  paper?: string;
};

const R = 330;
const OUTLINE = cakeOutline(R);
const SIZE = Math.round(R * 2.3);
const PAPER_FOLD = "#d9cfbd";
/** 暗面 / 高光偏移（绘制坐标像素）：光从左上来 */
const SD = 1.4;

function decode(s: string, k: number): number[] {
  const vals: number[] = [];
  let i = 0;
  while (i < s.length) {
    let res = 0;
    let sh = 0;
    let b: number;
    do {
      b = s.charCodeAt(i++) - 63;
      res |= (b & 0x1f) << sh;
      sh += 5;
    } while (b >= 0x20);
    vals.push(res & 1 ? ~(res >> 1) : res >> 1);
  }
  const out: number[] = [];
  let x = 0;
  let y = 0;
  for (let j = 0; j < vals.length; j += 2) {
    x += vals[j];
    y += vals[j + 1];
    out.push(x * k, y * k);
  }
  return out;
}

export function makeTracedCake(spec: TracedCakeSpec) {
  const D = R / (spec.paperMargin ?? 1.07);
  const K = D / spec.unit;
  const U = (v: number) => v * K;
  const PAPER = spec.paper ?? "#f8f4eb";
  const decoded = new Map<string, number[][]>();
  const rings = (layer: string) => {
    let r = decoded.get(layer);
    if (!r) {
      r = (spec.layers[layer] ?? []).map((s) => decode(s, K));
      decoded.set(layer, r);
    }
    return r;
  };
  const fillLayer = (c: CanvasRenderingContext2D, layer: string, color: string, dx = 0, dy = 0) => {
    c.beginPath();
    for (const r of rings(layer)) {
      c.moveTo(r[0] + dx, r[1] + dy);
      for (let i = 2; i < r.length; i += 2) c.lineTo(r[i] + dx, r[i + 1] + dy);
      c.closePath();
    }
    c.fillStyle = color;
    c.fill("evenodd");
  };
  const paintLayer = (c: CanvasRenderingContext2D, p: LayerPaint) => {
    if (p.shade) fillLayer(c, p.layer, p.shade, SD, SD);
    fillLayer(c, p.layer, p.color);
  };
  const layerPath = (c: CanvasRenderingContext2D, layer: string, dx = 0, dy = 0) => {
    for (const r of rings(layer)) {
      c.moveTo(r[0] + dx, r[1] + dy);
      for (let i = 2; i < r.length; i += 2) c.lineTo(r[i] + dx, r[i + 1] + dy);
      c.closePath();
    }
  };
  // 高光：只在本层里面，取「本层 − 往右下错开的本层」，留下左上一道细边，填极淡亮色
  const sheenLayer = (c: CanvasRenderingContext2D, p: LayerPaint) => {
    if (!p.sheen) return;
    c.save();
    c.beginPath();
    layerPath(c, p.layer);
    c.clip("evenodd");
    c.beginPath();
    layerPath(c, p.layer);
    layerPath(c, p.layer, SD * 1.6, SD * 1.6);
    c.fillStyle = p.sheen;
    c.fill("evenodd");
    c.restore();
  };

  function paper(c: CanvasRenderingContext2D) {
    c.fillStyle = PAPER;
    c.fillRect(-R * 1.15, -R * 1.15, R * 2.3, R * 2.3);
    const r = seq(301);
    for (let i = 0; i < 22; i++) {
      const a = r() * TAU;
      const r0 = R * (0.6 + r() * 0.3);
      const pts = bezierPts(
        { x: Math.cos(a) * R * 1.03, y: Math.sin(a) * R * 1.03 },
        { x: Math.cos(a + 0.05) * R * 0.95, y: Math.sin(a + 0.05) * R * 0.95 },
        { x: Math.cos(a + 0.08) * (r0 + R * 0.08), y: Math.sin(a + 0.08) * (r0 + R * 0.08) },
        { x: Math.cos(a + 0.03) * r0, y: Math.sin(a + 0.03) * r0 },
        16,
      );
      brushLine(c, pts, 4 + r() * 4, alpha(PAPER_FOLD, 0.16 + r() * 0.14), { seed: 40 + i, taperIn: 0.2, taperOut: 0.7, wobble: 0.3 });
    }
    for (let i = 0; i < 220; i++) {
      const x = (r() - 0.5) * R * 2;
      const y = (r() - 0.5) * R * 2;
      const a = r() * TAU;
      const l = 5 + r() * 12;
      c.strokeStyle = alpha("#b7ab95", 0.1 + r() * 0.1);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      c.stroke();
    }
  }

  function ribbon(c: CanvasRenderingContext2D) {
    const { top, bottom, endTopX, endBottomX } = spec.ribbon;
    const st = spec.ribbonStyle;
    const yTop = (x: number) => (top.cy + Math.sqrt(Math.max(0, top.r * top.r - x * x))) * D;
    const yBot = (x: number) => (bottom.cy + Math.sqrt(Math.max(0, bottom.r * bottom.r - x * x))) * D;
    const N = 60;
    const band = () => {
      c.beginPath();
      for (let i = 0; i <= N; i++) {
        const x = -endTopX + (2 * endTopX * i) / N;
        i ? c.lineTo(x * D, yTop(x)) : c.moveTo(x * D, yTop(x));
      }
      for (let i = 0; i <= N; i++) {
        const x = endBottomX - (2 * endBottomX * i) / N;
        c.lineTo(x * D, yBot(x));
      }
      c.closePath();
    };
    c.save();
    band();
    c.fillStyle = st.fill;
    c.fill();
    band();
    c.clip();
    c.strokeStyle = alpha(st.stripe, 0.55);
    c.lineWidth = D * 0.0045;
    const lim = Math.max(endTopX, endBottomX);
    for (let x = -lim; x <= lim; x += 0.013) {
      c.beginPath();
      c.moveTo(x * D, yTop(x) - 4);
      c.lineTo(x * D, yBot(x) + 4);
      c.stroke();
    }
    c.restore();
    for (const [f, inset, s, end] of [
      [yTop, 0.017, 1, endTopX],
      [yBot, -0.017, 2, endBottomX],
    ] as const) {
      const pts: { x: number; y: number }[] = [];
      const l = end - 0.03;
      for (let i = 0; i <= N; i++) {
        const x = -l + (2 * l * i) / N;
        pts.push({ x: x * D, y: f(x) + inset * D });
      }
      brushLine(c, pts, D * 0.008, st.line, { seed: 90 + s, taperIn: 0.03, taperOut: 0.03, wobble: 0.15 });
    }
    fillLayer(c, spec.ribbonTextLayer, st.text);
  }

  function brandLogo(c: CanvasRenderingContext2D) {
    const { emblem, wordmark } = spec.logo;
    drawBrandEmblem(c, U(emblem.x), U(emblem.y), U(emblem.h));
    c.save();
    const sy = U(wordmark.y1) - U(wordmark.y0);
    const sx = U(wordmark.x1) - U(wordmark.x0);
    c.translate(U((wordmark.x0 + wordmark.x1) / 2), U((wordmark.y0 + wordmark.y1) / 2));
    c.scale(sx / (WORDMARK_SIZE.width * (sy / WORDMARK_SIZE.height)), 1);
    drawBrandWordmark(c, 0, 0, (sy / WORDMARK_SIZE.height) * 100);
    c.restore();
  }

  function paintWrapper(c: CanvasRenderingContext2D) {
    c.save();
    c.translate(SIZE / 2, SIZE / 2);
    paper(c);
    for (const p of spec.under) {
      paintLayer(c, { ...p, sheen: undefined });
      sheenLayer(c, p);
    }
    brandLogo(c);
    ribbon(c);
    for (const p of spec.over ?? []) paintLayer(c, p);
    paperTooth(c, R * 1.02, PAPER, 401, 120);
    for (let k = 0; k < 3; k++) {
      c.fillStyle = alpha("#7b6548", 0.028);
      c.beginPath();
      c.arc(0, 0, R * 1.12, 0, TAU * 0.9995);
      c.arc(-R * (0.1 + k * 0.025), -R * (0.12 + k * 0.03), R * (0.97 + k * 0.01), 0, TAU * 0.9995, true);
      c.fill("evenodd");
    }
    c.restore();
  }

  return function drawTracedCake(ctx: CanvasRenderingContext2D, radius: number, opts: { lift?: number } = {}) {
    const { lift = 0 } = opts;
    const sc = radius / R;
    ctx.save();
    ctx.scale(sc, sc);
    dropShadow(ctx, () => tracePts(ctx, OUTLINE), 22 + 24 * lift, 10 + 18 * lift, 14 + 26 * lift, Math.max(0.08, 0.26 - 0.12 * lift));
    ctx.save();
    tracePts(ctx, OUTLINE);
    ctx.clip();
    const surf = cached(`product:${spec.key}`, SIZE, SIZE, paintWrapper);
    if (surf) ctx.drawImage(surf, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
    ctx.restore();
    const loop = [...OUTLINE, OUTLINE[0]];
    brushLine(ctx, loop, 5, alpha(PAPER, 0.6), { seed: 501, taperIn: 0, taperOut: 0, wobble: 0.12 });
    brushLine(ctx, loop.slice(4), 3.6, alpha("#7a4e33", 0.26), { seed: 502, taperIn: 0.05, taperOut: 0.08, wobble: 0.1 });
    brushLine(ctx, [...loop.slice(90), ...loop.slice(1, 70)], 2.6, alpha("#7a4e33", 0.14), { seed: 503, taperIn: 0.1, taperOut: 0.15, wobble: 0.2 });
    ctx.restore();
  };
}
