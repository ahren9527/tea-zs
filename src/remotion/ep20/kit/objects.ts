/**
 * 第 20 期共用的「物」：棉纸包着的茶饼（俯视）、茶针、茶刀、茶锥、菜刀、紫砂罐（侧视）。
 * 光一律从左上来（和 AI 场景的窗光一致）。每个函数都画在原点，调用方负责平移/旋转/缩放。
 */
import {
  TAU,
  hash01,
  mixHex,
  noise1,
  rgba,
  rng,
  type FxPalette,
  type Pt,
} from "@/remotion/shared/fx";
import { CAKE_R, CAKE_SIL, paintCakeTexture } from "./cake";
import { mixColor, softShadow, tracePoly } from "./draw-kit";

// ---------------- 棉纸包着的茶饼（俯视） ----------------
export function paperColor(pal: FxPalette) {
  return pal.dark ? "#ddd3c1" : "#f7f0e3";
}

/**
 * 棉纸茶饼。r：半径；lift：离桌面高度 0..1（影子随之变大变淡）；peel：0..1 纸被揭开的程度（露出叶面，楔形）。
 * peelAngle：揭开那一角的方向。
 */
export function drawWrappedCake(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  r: number,
  o: { lift?: number; peel?: number; peelAngle?: number; seed?: number; shadow?: number } = {},
) {
  const s = r / CAKE_R;
  const lift = o.lift ?? 0;
  const seed = o.seed ?? 1;
  ctx.save();
  ctx.scale(s, s);
  const sil = CAKE_SIL.map((q) => ({ x: q.x * 1.03, y: q.y * 1.03 }));
  const sh = o.shadow ?? 1;
  softShadow(ctx, () => tracePoly(ctx, sil), {
    blur: 26 + 40 * lift,
    dx: 16 + 30 * lift,
    dy: 24 + 44 * lift,
    alpha: (0.36 - 0.12 * lift) * sh,
  });
  softShadow(ctx, () => tracePoly(ctx, sil), {
    blur: 6,
    dx: 3,
    dy: 5,
    alpha: 0.28 * (1 - lift) * sh,
  });

  ctx.save();
  ctx.beginPath();
  tracePoly(ctx, sil);
  ctx.clip();
  // 透出来的叶面
  paintCakeTexture(ctx, pal);
  // 纸
  const peel = o.peel ?? 0;
  const pa = o.peelAngle ?? -0.6;
  ctx.save();
  if (peel > 0) {
    // 揭开的楔形不盖纸
    ctx.beginPath();
    ctx.rect(-CAKE_R * 2, -CAKE_R * 2, CAKE_R * 4, CAKE_R * 4);
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, CAKE_R * 1.2, pa - 0.42 * peel, pa + 0.42 * peel);
    ctx.closePath();
    ctx.clip("evenodd");
  }
  ctx.fillStyle = rgba(paperColor(pal), 0.8);
  ctx.fillRect(-CAKE_R * 1.2, -CAKE_R * 1.2, CAKE_R * 2.4, CAKE_R * 2.4);
  // 纤维
  const rr = rng(400 + seed);
  ctx.strokeStyle = rgba(pal.tea, 0.07);
  ctx.lineWidth = 1;
  for (let i = 0; i < 160; i++) {
    const x = (rr() - 0.5) * CAKE_R * 2.2;
    const y = (rr() - 0.5) * CAKE_R * 2.2;
    const a = rr() * TAU;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(a + 0.7) * 14,
      y + Math.sin(a + 0.7) * 14,
      x + Math.cos(a) * 28,
      y + Math.sin(a) * 28,
    );
    ctx.stroke();
  }
  // 叶面的起伏透过纸面（软光叠一层饼纹理）
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = 0.55;
  paintCakeTexture(ctx, pal);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  // 纸绕过饼边的细褶：只在外圈
  const N = 46;
  ctx.lineCap = "round";
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU + (hash01(i, seed) - 0.5) * 0.12;
    const r0 = CAKE_R * (0.8 + 0.1 * hash01(i, seed + 2));
    const r1 = CAKE_R * 1.02;
    const bend = (hash01(i, seed + 5) - 0.5) * 0.08;
    const p0 = { x: Math.cos(a) * r0, y: Math.sin(a) * r0 };
    const pm = { x: Math.cos(a + bend) * (r0 + r1) * 0.5, y: Math.sin(a + bend) * (r0 + r1) * 0.5 };
    const p1 = { x: Math.cos(a) * r1, y: Math.sin(a) * r1 };
    const facing = Math.cos(a + Math.PI * 0.75);
    ctx.strokeStyle = rgba("#5a3a22", 0.08 + 0.06 * hash01(i, 9));
    ctx.lineWidth = 3 + 4 * hash01(i, 3);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(pm.x, pm.y, p1.x, p1.y);
    ctx.stroke();
    ctx.strokeStyle = rgba("#ffffff", 0.16 + 0.2 * Math.max(0, facing));
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(p0.x - 2.5, p0.y - 2.5);
    ctx.quadraticCurveTo(pm.x - 2.5, pm.y - 2.5, p1.x - 2.5, p1.y - 2.5);
    ctx.stroke();
  }
  // 饼心微凹
  const knot = ctx.createRadialGradient(4, 6, 2, 0, 0, CAKE_R * 0.16);
  knot.addColorStop(0, rgba("#5a3a22", 0.16));
  knot.addColorStop(1, rgba("#5a3a22", 0));
  ctx.fillStyle = knot;
  ctx.beginPath();
  ctx.arc(0, 0, CAKE_R * 0.16, 0, TAU);
  ctx.fill();
  // 包装上的朱砂茶号圈（印刷感，很淡）
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = pal.cinnabar;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(CAKE_R * 0.42, CAKE_R * 0.36, 44, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CAKE_R * 0.42, CAKE_R * 0.36, 34, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath();
    ctx.moveTo(CAKE_R * 0.42 + Math.cos(a) * 10, CAKE_R * 0.36 + Math.sin(a) * 10);
    ctx.lineTo(CAKE_R * 0.42 + Math.cos(a) * 26, CAKE_R * 0.36 + Math.sin(a) * 26);
    ctx.stroke();
  }
  // 一圈像印刷字的细短划
  ctx.lineWidth = 3;
  for (let i = 0; i < 28; i++) {
    const a = -2.6 + (i / 28) * 2.2;
    const rr2 = CAKE_R * 0.68;
    if (hash01(i, 31) < 0.18) continue;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
    ctx.lineTo(Math.cos(a + 0.035) * rr2, Math.sin(a + 0.035) * rr2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // 光影：左上受光，右下背光，边缘厚度
  const lg = ctx.createLinearGradient(-CAKE_R, -CAKE_R, CAKE_R, CAKE_R);
  lg.addColorStop(0, rgba("#fff6e2", 0.28));
  lg.addColorStop(0.5, rgba("#fff6e2", 0));
  lg.addColorStop(1, rgba("#2a1a0c", 0.26));
  ctx.fillStyle = lg;
  ctx.fillRect(-CAKE_R * 1.2, -CAKE_R * 1.2, CAKE_R * 2.4, CAKE_R * 2.4);
  const rim = ctx.createRadialGradient(0, 0, CAKE_R * 0.8, 0, 0, CAKE_R * 1.04);
  rim.addColorStop(0, rgba("#2a1a0c", 0));
  rim.addColorStop(1, rgba("#2a1a0c", 0.22));
  ctx.fillStyle = rim;
  ctx.fillRect(-CAKE_R * 1.2, -CAKE_R * 1.2, CAKE_R * 2.4, CAKE_R * 2.4);
  ctx.restore();
  // 纸边一圈细毛边
  ctx.strokeStyle = rgba(pal.tea, 0.22);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  tracePoly(ctx, sil);
  ctx.stroke();
  ctx.restore();
}

// ---------------- 工具（原点 = 尖，沿 +x 方向伸向手柄） ----------------
function steel(ctx: CanvasRenderingContext2D, w: number) {
  const g = ctx.createLinearGradient(0, -w, 0, w);
  g.addColorStop(0, "#f4f1ea");
  g.addColorStop(0.42, "#b5b2aa");
  g.addColorStop(0.62, "#85827b");
  g.addColorStop(1, "#4f4c47");
  return g;
}
function wood(ctx: CanvasRenderingContext2D, pal: FxPalette, w: number, tone = 0) {
  const base = mixHex(pal.tea, "#5b3420", tone);
  const g = ctx.createLinearGradient(0, -w, 0, w);
  g.addColorStop(0, mixColor(base, "#e8c99a", 0.5));
  g.addColorStop(0.5, base);
  g.addColorStop(1, mixColor(base, "#1a0f07", 0.45));
  return g;
}
function woodGrain(ctx: CanvasRenderingContext2D, x0: number, x1: number, w: number, seed: number) {
  ctx.save();
  ctx.strokeStyle = rgba("#1a0f07", 0.28);
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = -w * 0.7 + (i / 4) * w * 1.4;
    ctx.beginPath();
    ctx.moveTo(x0 + 6, y);
    ctx.bezierCurveTo(
      x0 + (x1 - x0) * 0.3,
      y + noise1(i, seed) * 3,
      x0 + (x1 - x0) * 0.7,
      y - noise1(i + 3, seed) * 3,
      x1 - 6,
      y * 0.9,
    );
    ctx.stroke();
  }
  ctx.restore();
}

/** 工具投影（贴桌面，向右下）；h 为离桌面高度 0..1 */
function toolShadow(ctx: CanvasRenderingContext2D, path: () => void, h: number) {
  softShadow(ctx, path, {
    blur: 8 + 22 * h,
    dx: 6 + 22 * h,
    dy: 10 + 34 * h,
    alpha: 0.34 - 0.1 * h,
  });
}

export function drawTeaNeedle(ctx: CanvasRenderingContext2D, pal: FxPalette, h = 0) {
  const shaft = 190;
  const handle = 230;
  toolShadow(
    ctx,
    () => {
      ctx.moveTo(0, -1);
      ctx.lineTo(shaft, -4);
      ctx.lineTo(shaft + handle + 18, -11);
      ctx.lineTo(shaft + handle + 18, 11);
      ctx.lineTo(shaft, 4);
      ctx.lineTo(0, 1);
      ctx.closePath();
    },
    h,
  );
  ctx.fillStyle = steel(ctx, 4);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(34, -2.4, shaft, -4);
  ctx.lineTo(shaft, 4);
  ctx.quadraticCurveTo(34, 2.4, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = mixColor(pal.tea, "#c89a5a", 0.6);
  ctx.fillRect(shaft - 4, -8, 20, 16);
  ctx.fillStyle = rgba("#ffffff", 0.35);
  ctx.fillRect(shaft - 4, -8, 20, 3);
  const hx = shaft + 16;
  ctx.fillStyle = wood(ctx, pal, 12);
  ctx.beginPath();
  ctx.moveTo(hx, -9.5);
  ctx.lineTo(hx + handle, -12);
  ctx.quadraticCurveTo(hx + handle + 9, 0, hx + handle, 12);
  ctx.lineTo(hx, 9.5);
  ctx.closePath();
  ctx.fill();
  woodGrain(ctx, hx, hx + handle, 9, 3);
  ctx.strokeStyle = rgba("#1a0f07", 0.5);
  ctx.lineWidth = 2.2;
  for (const nx of [hx + 78, hx + 170]) {
    ctx.beginPath();
    ctx.moveTo(nx, -11);
    ctx.lineTo(nx + 1, 11);
    ctx.stroke();
  }
}

export function drawTeaKnife(ctx: CanvasRenderingContext2D, pal: FxPalette, h = 0) {
  const blade = 210;
  const handle = 210;
  const W = 24;
  const bladePath = () => {
    ctx.moveTo(0, 2);
    ctx.bezierCurveTo(40, -W * 0.7, 120, -W, blade, -W * 0.82);
    ctx.lineTo(blade, W * 0.82);
    ctx.bezierCurveTo(120, W * 0.9, 40, W * 0.6, 0, 2);
    ctx.closePath();
  };
  toolShadow(
    ctx,
    () => {
      bladePath();
      ctx.rect(blade, -15, handle + 24, 30);
    },
    h,
  );
  ctx.fillStyle = steel(ctx, W);
  ctx.beginPath();
  bladePath();
  ctx.fill();
  // 刃口：一道亮边 + 中脊
  ctx.strokeStyle = rgba("#ffffff", 0.7);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, 1);
  ctx.bezierCurveTo(40, -W * 0.62, 120, -W * 0.92, blade - 4, -W * 0.76);
  ctx.stroke();
  ctx.strokeStyle = rgba("#3a3833", 0.35);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(18, 2);
  ctx.quadraticCurveTo(110, 1, blade - 6, 0);
  ctx.stroke();
  // 铜箍 + 木柄
  ctx.fillStyle = mixColor(pal.tea, "#c89a5a", 0.6);
  ctx.fillRect(blade - 4, -17, 22, 34);
  ctx.fillStyle = rgba("#ffffff", 0.3);
  ctx.fillRect(blade - 4, -17, 22, 5);
  const hx = blade + 16;
  ctx.fillStyle = wood(ctx, pal, 16, 0.3);
  ctx.beginPath();
  ctx.moveTo(hx, -15);
  ctx.bezierCurveTo(hx + handle * 0.4, -17, hx + handle * 0.8, -16, hx + handle, -13);
  ctx.quadraticCurveTo(hx + handle + 12, 0, hx + handle, 13);
  ctx.bezierCurveTo(hx + handle * 0.8, 16, hx + handle * 0.4, 17, hx, 15);
  ctx.closePath();
  ctx.fill();
  woodGrain(ctx, hx, hx + handle, 13, 7);
}

export function drawTeaAwl(ctx: CanvasRenderingContext2D, pal: FxPalette, h = 0) {
  const spike = 150;
  const handle = 170;
  const spikePath = () => {
    ctx.moveTo(0, 0);
    ctx.lineTo(spike, -11);
    ctx.lineTo(spike, 11);
    ctx.closePath();
  };
  const handlePath = () => {
    const hx = spike + 10;
    ctx.moveTo(hx, -16);
    ctx.bezierCurveTo(hx + 40, -30, hx + handle * 0.7, -34, hx + handle, -24);
    ctx.quadraticCurveTo(hx + handle + 22, 0, hx + handle, 24);
    ctx.bezierCurveTo(hx + handle * 0.7, 34, hx + 40, 30, hx, 16);
    ctx.closePath();
  };
  toolShadow(
    ctx,
    () => {
      spikePath();
      handlePath();
    },
    h,
  );
  ctx.fillStyle = steel(ctx, 11);
  ctx.beginPath();
  spikePath();
  ctx.fill();
  ctx.strokeStyle = rgba("#ffffff", 0.55);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(6, -0.6);
  ctx.lineTo(spike - 2, -7);
  ctx.stroke();
  ctx.fillStyle = mixColor(pal.tea, "#c89a5a", 0.6);
  ctx.fillRect(spike - 4, -17, 18, 34);
  ctx.fillStyle = rgba("#ffffff", 0.3);
  ctx.fillRect(spike - 4, -17, 18, 5);
  // 牛角/乌木柄：深、亮
  const g = ctx.createLinearGradient(0, -32, 0, 32);
  g.addColorStop(0, "#8b6a4d");
  g.addColorStop(0.35, "#3d2717");
  g.addColorStop(1, "#160d07");
  ctx.fillStyle = g;
  ctx.beginPath();
  handlePath();
  ctx.fill();
  ctx.strokeStyle = rgba("#fff1d8", 0.35);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(spike + 40, -21);
  ctx.bezierCurveTo(spike + 90, -27, spike + 140, -27, spike + handle - 6, -19);
  ctx.stroke();
}

/** 菜刀（错误示范）：宽刀身，原点在刀口前端中点 */
export function drawCleaver(ctx: CanvasRenderingContext2D, pal: FxPalette, h = 0) {
  const L = 300;
  const H = 150;
  const body = () => {
    ctx.moveTo(0, -H * 0.5);
    ctx.lineTo(L, -H * 0.5);
    ctx.lineTo(L, H * 0.32);
    ctx.quadraticCurveTo(L * 0.5, H * 0.56, 0, H * 0.5);
    ctx.quadraticCurveTo(-8, 0, 0, -H * 0.5);
    ctx.closePath();
  };
  toolShadow(
    ctx,
    () => {
      body();
      ctx.rect(L, -H * 0.42, 170, 40);
    },
    h,
  );
  const g = ctx.createLinearGradient(0, -H * 0.5, 0, H * 0.5);
  g.addColorStop(0, "#9e9c96");
  g.addColorStop(0.55, "#c9c6bf");
  g.addColorStop(0.8, "#e9e6df");
  g.addColorStop(1, "#77746e");
  ctx.fillStyle = g;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.fillStyle = rgba("#2b2a27", 0.5);
  ctx.beginPath();
  ctx.arc(L * 0.12, -H * 0.3, 11, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba("#ffffff", 0.75);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, H * 0.48);
  ctx.quadraticCurveTo(L * 0.5, H * 0.54, L - 4, H * 0.32);
  ctx.stroke();
  ctx.fillStyle = wood(ctx, pal, 20, 0.5);
  ctx.beginPath();
  ctx.moveTo(L, -H * 0.42);
  ctx.lineTo(L + 170, -H * 0.4);
  ctx.quadraticCurveTo(L + 182, -H * 0.27, L + 170, -H * 0.14);
  ctx.lineTo(L, -H * 0.16);
  ctx.closePath();
  ctx.fill();
}

// ---------------- 紫砂罐（侧视，原点 = 罐底中点） ----------------
export type JarOpts = {
  /** 罐高（不含盖） */
  h: number;
  /** 盖子离开罐口的高度 px（0 = 盖好） */
  lidLift?: number;
  lidRot?: number;
  /** 是否画盖子 */
  lid?: boolean;
  /** 罐身颜色（默认紫砂红褐） */
  body?: string;
  /** 罐内暖光（香气）0..1 */
  glow?: number;
  seed?: number;
};

export function jarProfile(h: number): Pt[] {
  // 右半边轮廓（底 → 口），左右对称
  return [
    { x: h * 0.3, y: 0 },
    { x: h * 0.4, y: -h * 0.08 },
    { x: h * 0.47, y: -h * 0.28 },
    { x: h * 0.47, y: -h * 0.5 },
    { x: h * 0.42, y: -h * 0.7 },
    { x: h * 0.3, y: -h * 0.86 },
    { x: h * 0.25, y: -h * 0.93 },
    { x: h * 0.27, y: -h },
  ];
}

function traceJar(ctx: CanvasRenderingContext2D, h: number) {
  const p = jarProfile(h);
  ctx.moveTo(-p[0].x, 0);
  ctx.lineTo(p[0].x, 0);
  ctx.bezierCurveTo(h * 0.37, -h * 0.01, h * 0.47, -h * 0.12, h * 0.48, -h * 0.36);
  ctx.bezierCurveTo(h * 0.49, -h * 0.62, h * 0.38, -h * 0.82, h * 0.25, -h * 0.9);
  ctx.quadraticCurveTo(h * 0.25, -h * 0.97, h * 0.28, -h);
  ctx.lineTo(-h * 0.28, -h);
  ctx.quadraticCurveTo(-h * 0.25, -h * 0.97, -h * 0.25, -h * 0.9);
  ctx.bezierCurveTo(-h * 0.38, -h * 0.82, -h * 0.49, -h * 0.62, -h * 0.48, -h * 0.36);
  ctx.bezierCurveTo(-h * 0.47, -h * 0.12, -h * 0.37, -h * 0.01, -p[0].x, 0);
  ctx.closePath();
}

export function jarBodyColor(pal: FxPalette) {
  return mixHex("#8e4a33", pal.tea, 0.3);
}

export function drawJar(ctx: CanvasRenderingContext2D, pal: FxPalette, o: JarOpts) {
  const h = o.h;
  const col = o.body ?? jarBodyColor(pal);
  // 桌面上的影子：接触影 + 往右下拉长的投影
  ctx.save();
  ctx.fillStyle = rgba("#2a1a0c", 0.3);
  ctx.beginPath();
  ctx.ellipse(h * 0.06, 2, h * 0.42, h * 0.05, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  softShadow(
    ctx,
    () => {
      ctx.ellipse(h * 0.32, -h * 0.02, h * 0.52, h * 0.1, 0.12, 0, TAU);
    },
    { blur: 30, dx: 0, dy: 0, alpha: 0.26 },
  );
  ctx.save();
  ctx.beginPath();
  traceJar(ctx, h);
  const body = ctx.createLinearGradient(-h * 0.5, 0, h * 0.5, 0);
  body.addColorStop(0, mixHex(col, "#f0c9a2", 0.28));
  body.addColorStop(0.3, mixHex(col, "#f0c9a2", 0.1));
  body.addColorStop(0.65, col);
  body.addColorStop(1, mixHex(col, "#1a0d07", 0.55));
  ctx.fillStyle = body;
  ctx.fill();
  ctx.clip();
  // 竖向：底部发暗
  const v = ctx.createLinearGradient(0, -h, 0, 0);
  v.addColorStop(0, rgba("#1a0d07", 0.1));
  v.addColorStop(0.6, rgba("#1a0d07", 0));
  v.addColorStop(1, rgba("#1a0d07", 0.32));
  ctx.fillStyle = v;
  ctx.fillRect(-h, -h * 1.1, h * 2, h * 1.2);
  // 砂粒
  const r = rng(77 + (o.seed ?? 0));
  for (let i = 0; i < 520; i++) {
    const x = (r() - 0.5) * h;
    const y = -r() * h;
    ctx.fillStyle = r() > 0.5 ? rgba("#f3d6b6", 0.16) : rgba("#1a0d07", 0.18);
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  // 左上窗光的高光：一条柔和竖带 + 肩部一点亮
  ctx.save();
  ctx.translate(-h * 0.26, -h * 0.5);
  ctx.scale(1, 3.2);
  const hl = ctx.createRadialGradient(0, 0, 0, 0, 0, h * 0.12);
  hl.addColorStop(0, rgba("#fff2dc", 0.24));
  hl.addColorStop(1, rgba("#fff2dc", 0));
  ctx.fillStyle = hl;
  ctx.fillRect(-h * 0.12, -h * 0.12, h * 0.24, h * 0.24);
  ctx.restore();
  const sh = ctx.createRadialGradient(-h * 0.2, -h * 0.74, 0, -h * 0.2, -h * 0.74, h * 0.2);
  sh.addColorStop(0, rgba("#fff2dc", 0.3));
  sh.addColorStop(1, rgba("#fff2dc", 0));
  ctx.fillStyle = sh;
  ctx.fillRect(-h * 0.5, -h, h, h * 0.5);
  // 肩线 / 腰线（拉坯的弦纹）
  ctx.strokeStyle = rgba("#1a0d07", 0.22);
  ctx.lineWidth = 2;
  for (const yy of [-h * 0.84, -h * 0.22]) {
    ctx.beginPath();
    ctx.ellipse(0, yy, h * (yy < -h * 0.5 ? 0.33 : 0.45), h * 0.03, 0, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }
  ctx.restore();
  // 罐口
  ctx.save();
  ctx.fillStyle = mixHex(col, "#1a0d07", 0.6);
  ctx.beginPath();
  ctx.ellipse(0, -h, h * 0.28, h * 0.045, 0, 0, TAU);
  ctx.fill();
  if ((o.glow ?? 0) > 0) {
    const g = ctx.createRadialGradient(0, -h, 0, 0, -h, h * 0.3);
    g.addColorStop(0, rgba(pal.light, 0.6 * (o.glow ?? 0)));
    g.addColorStop(1, rgba(pal.light, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, -h, h * 0.28, h * 0.045, 0, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = rgba("#f3d6b6", 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -h, h * 0.28, h * 0.045, 0, Math.PI * 1.05, Math.PI * 1.75);
  ctx.stroke();
  ctx.restore();
  if (o.lid !== false) drawJarLid(ctx, pal, h, o.lidLift ?? 0, o.lidRot ?? 0, col);
}

export function drawJarLid(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  h: number,
  lift: number,
  rot: number,
  col = jarBodyColor(pal),
) {
  ctx.save();
  ctx.translate(0, -h - lift);
  ctx.rotate(rot);
  // 盖子在罐口上的影子（落下时）
  const w = h * 0.31;
  const g = ctx.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, mixHex(col, "#f0c9a2", 0.3));
  g.addColorStop(0.55, col);
  g.addColorStop(1, mixHex(col, "#1a0d07", 0.5));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-w, 0);
  ctx.bezierCurveTo(-w * 0.95, -h * 0.1, w * 0.95, -h * 0.1, w, 0);
  ctx.quadraticCurveTo(0, h * 0.035, -w, 0);
  ctx.closePath();
  ctx.fill();
  // 钮
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.085, h * 0.055, h * 0.04, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba("#fff2dc", 0.28);
  ctx.beginPath();
  ctx.ellipse(-h * 0.015, -h * 0.095, h * 0.022, h * 0.013, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba("#fff2dc", 0.28);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.8, -h * 0.03);
  ctx.quadraticCurveTo(-w * 0.4, -h * 0.07, 0, -h * 0.072);
  ctx.stroke();
  ctx.restore();
}
