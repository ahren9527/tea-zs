/**
 * 第 20 期 B3「工具」逐帧画布（1080×1920）。导出走这里；Comp.tsx 的预览也直接调用它。
 * 茶巾从左铺开 → 茶针 / 茶刀 / 茶锥依次落下，各做一下自己的动作（扎缝 / 顺纹推 / 拧）→
 * 工具退开，菜刀与一只手先后落下、各挨一笔朱砂叉 → 一块饼落下、裂纹生长、碎开、碎叶四散。
 */
import {
  TAU,
  cameraAt,
  cameraKick,
  cachedSurface,
  clamp01,
  drawBrushStroke,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  easeOutExpo,
  hash01,
  heavyLand,
  jaggedPath,
  lightFloat,
  mixHex,
  partialPolyline,
  progress,
  rgba,
  rng,
  smoothPolyline,
  springValue,
  traceLeaf,
  type FxPalette,
  type Pt,
} from "@/remotion/shared/fx";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  KAI,
  SONG,
  allTextsOf,
  beginFrame,
  brushCross,
  fitSize,
  inkText,
  life,
  renderLayers,
  softShadow,
  textOf,
  tracePoly,
} from "../kit/draw-kit";
import { CAKE_R, paintCakeTexture } from "../kit/cake";
import { drawCleaver, drawTeaAwl, drawTeaKnife, drawTeaNeedle } from "../kit/objects";
import {
  BREAK_AT,
  CAKE,
  CAKE_AT,
  CLEAVER_AT,
  CLEAVER_X_AT,
  CLOTH,
  CLOTH_AT,
  CRACK_AT,
  HAND_AT,
  HAND_X_AT,
  LABEL_X,
  LENGTH,
  NO_AT,
  TEXT,
  TOOLS_OUT,
  TOOL_AT,
  TOOL_TIP_X,
  TOOL_Y,
  USE_AT,
  WASTE_AT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const TOOL_ROT = [-0.035, 0.03, -0.02];
const TOOL_SCALE = 1.25;

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.05,
    drift: 6,
    focus: [
      { at: TOOL_AT[0] - 6, dur: 16, x: 540, y: TOOL_Y[0] + 40, zoom: 1.04, pull: 0.2 },
      { at: TOOL_AT[1] - 6, dur: 16, x: 540, y: TOOL_Y[1], zoom: 1.04, pull: 0.2 },
      { at: TOOL_AT[2] - 6, dur: 16, x: 540, y: TOOL_Y[2] - 40, zoom: 1.04, pull: 0.2 },
      { at: TOOLS_OUT, dur: 18, x: 540, y: 960, zoom: 1.0, pull: 0.2 },
      { at: BREAK_AT - 10, dur: 20, x: 540, y: CAKE.y, zoom: 1.1, pull: 0.3 },
    ],
  });
  const kicks: [number, number][] = [
    [TOOL_AT[0] + 8, 2],
    [TOOL_AT[1] + 8, 2],
    [TOOL_AT[2] + 8, 3],
    [CLEAVER_AT + 9, 5],
    [CAKE_AT + 10, 4],
    [BREAK_AT, 7],
  ];
  for (const [at, amp] of kicks) {
    const k = cameraKick(frame - at, amp);
    cam.x -= k.x;
    cam.y -= k.y;
  }
  return cam;
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame, pal, fontScale } = beginFrame(ctx, elapsed, params);
  const cam = beatCamera(frame);
  renderLayers(ctx, frame, pal, cam, {
    leaves: 4,
    subject: (p) => drawSubject(ctx, frame, p, params, fontScale),
    text: (p) => drawTextBand(ctx, frame, p, params, fontScale),
  });
}

// ---------------- 茶巾 ----------------
function clothTexture(pal: FxPalette) {
  const { w, h } = CLOTH;
  return cachedSurface(`ep20b3-cloth:${pal.paper}`, w, h, (c) => {
    const base = mixHex(pal.oat, pal.rice, 0.45);
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
    // 麻布织纹
    const r = rng(33);
    c.lineWidth = 1;
    for (let y = 0; y < h; y += 4) {
      c.strokeStyle = rgba(r() > 0.5 ? "#ffffff" : "#6b4a2e", 0.05 + r() * 0.05);
      c.beginPath();
      c.moveTo(0, y + r());
      c.lineTo(w, y + r());
      c.stroke();
    }
    for (let x = 0; x < w; x += 4) {
      c.strokeStyle = rgba(r() > 0.5 ? "#ffffff" : "#6b4a2e", 0.04 + r() * 0.04);
      c.beginPath();
      c.moveTo(x + r(), 0);
      c.lineTo(x + r(), h);
      c.stroke();
    }
    // 粗纱结
    for (let i = 0; i < 90; i++) {
      c.fillStyle = rgba("#6b4a2e", 0.08 + r() * 0.08);
      c.fillRect(r() * w, r() * h, 6 + r() * 14, 1.6);
    }
    // 两道竹青织带
    for (const y0 of [46, h - 78]) {
      c.fillStyle = rgba(pal.bamboo, 0.55);
      c.fillRect(0, y0, w, 14);
      c.fillStyle = rgba(pal.bamboo, 0.35);
      c.fillRect(0, y0 + 22, w, 5);
    }
    // 轻微褶皱的明暗
    for (let i = 0; i < 6; i++) {
      const x = r() * w;
      const g = c.createLinearGradient(x - 60, 0, x + 60, 0);
      g.addColorStop(0, rgba("#ffffff", 0));
      g.addColorStop(0.5, rgba(r() > 0.5 ? "#ffffff" : "#5a3a22", 0.06));
      g.addColorStop(1, rgba("#ffffff", 0));
      c.fillStyle = g;
      c.fillRect(x - 60, 0, 120, h);
    }
  });
}

function drawCloth(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette) {
  const p = easeOutCubic(progress(frame, CLOTH_AT, CLOTH_AT + 20));
  if (p <= 0) return;
  const { x, y, w, h, rot } = CLOTH;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rot);
  ctx.translate(-w / 2, -h / 2);
  const shown = w * p;
  softShadow(ctx, () => ctx.rect(0, 0, shown, h), { blur: 18, dx: 8, dy: 12, alpha: 0.2 });
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, shown, h);
  ctx.clip();
  const tex = clothTexture(pal);
  ctx.drawImage(tex.canvas as CanvasImageSource, 0, 0, w, h);
  ctx.restore();
  // 流苏（短边）
  ctx.strokeStyle = rgba(mixHex(pal.oat, pal.tea, 0.3), 0.8);
  ctx.lineWidth = 1.6;
  for (let i = 0; i < h; i += 9) {
    const len = 16 + hash01(i, 5) * 10;
    ctx.beginPath();
    ctx.moveTo(0, i + 4);
    ctx.lineTo(-len, i + 4 + (hash01(i, 6) - 0.5) * 6);
    ctx.stroke();
    if (p >= 1) {
      ctx.beginPath();
      ctx.moveTo(w, i + 4);
      ctx.lineTo(w + len, i + 4 + (hash01(i, 7) - 0.5) * 6);
      ctx.stroke();
    }
  }
  // 还没铺开的那卷
  if (p < 1) {
    const g = ctx.createLinearGradient(shown - 24, 0, shown + 24, 0);
    g.addColorStop(0, mixHex(pal.oat, "#ffffff", 0.3));
    g.addColorStop(1, mixHex(pal.oat, pal.tea, 0.4));
    ctx.fillStyle = g;
    ctx.fillRect(shown - 24, -6, 48, h + 12);
  }
  ctx.restore();
}

// ---------------- 主体 ----------------
function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  drawCloth(ctx, frame, pal);

  // 三件工具 + 名字/用途
  const out = easeInOutCubic(progress(frame, TOOLS_OUT, TOOLS_OUT + 14));
  if (out < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - out;
    ctx.translate(-60 * out, -40 * out);
    for (let i = 0; i < 3; i++) drawTool(ctx, frame, pal, params, fontScale, i);
    ctx.restore();
  }

  // 菜刀 + 手（挨叉），饼一落下就退场
  const wrongOut = easeInOutCubic(progress(frame, CAKE_AT - 2, CAKE_AT + 8));
  if (wrongOut < 1 && frame > CLEAVER_AT) {
    ctx.save();
    ctx.globalAlpha = 1 - wrongOut;
    // 菜刀：重落
    const cl = heavyLand(frame - CLEAVER_AT, { drop: 150, fall: 9, squash: 0.03 });
    ctx.save();
    ctx.globalAlpha *= cl.alpha;
    ctx.translate(200, 780 + cl.y);
    ctx.rotate(-0.1);
    ctx.scale(1.45, 1.45);
    drawCleaver(ctx, pal, clamp01(-cl.y / 150));
    ctx.restore();
    brushCross(ctx, 420, 790, 250, progress(frame - CLEAVER_X_AT, 0, 9), pal.cinnabar, 41, 18);
    // 手：从右下伸进来
    const hl = frame - HAND_AT;
    if (hl > 0) {
      const s = springValue(hl, { stiffness: 150, damping: 16, mass: 1 });
      ctx.save();
      ctx.translate(600 + (1 - s) * 260, 1210 + (1 - s) * 260);
      ctx.rotate(-0.32 + (1 - s) * 0.3);
      drawHand(ctx, pal, easeInOutCubic(progress(hl, 0, 16)), frame);
      ctx.restore();
      brushCross(ctx, 600, 1180, 230, progress(frame - HAND_X_AT, 0, 9), pal.cinnabar, 45, 18);
    }
    ctx.restore();
  }

  // 饼：落下 → 裂 → 碎开
  if (frame > CAKE_AT) drawBreakingCake(ctx, frame, pal);
}

function drawTool(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
  i: number,
) {
  const l = frame - TOOL_AT[i];
  if (l <= 0) return;
  const pose = heavyLand(l, { drop: 110, fall: 8, squash: 0.02 });
  const u = frame - USE_AT[i];
  let dx = 0;
  let rot = TOOL_ROT[i];
  if (u > 0) {
    if (i === 0) dx = -24 * Math.max(0, Math.sin((u / 9) * Math.PI)) * (u < 18 ? 1 : 0); // 扎两下
    if (i === 1) dx = -46 * Math.sin(easeInOutSine(progress(u, 0, 24)) * Math.PI); // 顺纹推一下
    if (i === 2) {
      rot += 0.07 * Math.sin(u * 0.55) * Math.exp(-u * 0.09); // 拧
      dx = -10 * Math.sin(easeInOutSine(progress(u, 0, 14)) * Math.PI);
    }
  }
  const y = TOOL_Y[i];
  ctx.save();
  ctx.globalAlpha *= pose.alpha;
  ctx.translate(TOOL_TIP_X + dx, y + pose.y);
  ctx.rotate(rot);
  ctx.scale(TOOL_SCALE, TOOL_SCALE);
  const h = clamp01(-pose.y / 110);
  if (i === 0) drawTeaNeedle(ctx, pal, h);
  if (i === 1) drawTeaKnife(ctx, pal, h);
  if (i === 2) drawTeaAwl(ctx, pal, h);
  ctx.restore();
  // 尖头前的一点：用途动作时亮一下（竹青短笔）
  if (u > 0 && u < 30) {
    const a = 1 - u / 30;
    ctx.save();
    ctx.globalAlpha *= a;
    drawBrushStroke(
      ctx,
      [
        { x: TOOL_TIP_X - 30, y: y - 26 },
        { x: TOOL_TIP_X - 44, y: y },
        { x: TOOL_TIP_X - 30, y: y + 26 },
      ],
      easeOutCubic(progress(u, 0, 8)),
      { width: 5, color: pal.bamboo, seed: 60 + i, tail: 0.4 },
    );
    ctx.restore();
  }
  // 名字（小，朱砂）+ 用途（大，墨）
  const name = t(params, (["n1", "n2", "n3"] as const)[i]);
  const use = t(params, (["u1", "u2", "u3"] as const)[i]);
  const nfs = fitSize(name, 46, 200) * fontScale;
  const ufs = fitSize(use, 104, 290) * fontScale;
  inkText(ctx, name, LABEL_X, y - 72, nfs, easeOutCubic(progress(l, 4, 16)), 70 + i, {
    color: pal.cinnabar,
    weight: 700,
    font: KAI,
    spacing: 1.25,
  });
  if (u > -4) {
    const fp = lightFloat(u + 4, { rise: 10, sway: 1, seed: i });
    inkText(ctx, use, LABEL_X, y + 22 + fp.y, ufs, easeOutCubic(progress(u, -2, 12)), 74 + i, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.025,
    });
  }
}

// ---------------- 手（毛笔勾线 + 淡肤色） ----------------
const HAND_RAW: Pt[] = [
  { x: -66, y: 140 },
  { x: -78, y: 40 },
  { x: -96, y: 16 },
  { x: -138, y: -24 },
  { x: -150, y: -52 },
  { x: -134, y: -64 },
  { x: -108, y: -42 },
  { x: -80, y: -18 },
  { x: -72, y: -62 },
  { x: -76, y: -128 },
  { x: -62, y: -142 },
  { x: -46, y: -130 },
  { x: -40, y: -58 },
  { x: -34, y: -74 },
  { x: -28, y: -152 },
  { x: -12, y: -164 },
  { x: 3, y: -152 },
  { x: 6, y: -62 },
  { x: 12, y: -64 },
  { x: 22, y: -140 },
  { x: 36, y: -148 },
  { x: 48, y: -136 },
  { x: 44, y: -56 },
  { x: 50, y: -48 },
  { x: 64, y: -102 },
  { x: 78, y: -106 },
  { x: 86, y: -94 },
  { x: 74, y: -20 },
  { x: 78, y: 40 },
  { x: 66, y: 140 },
];
const HAND = smoothPolyline(HAND_RAW, 2);

function drawHand(ctx: CanvasRenderingContext2D, pal: FxPalette, p: number, frame: number) {
  ctx.save();
  ctx.scale(1.25, 1.25);
  const skin = mixHex(pal.oat, "#e9bf98", 0.5);
  softShadow(ctx, () => tracePoly(ctx, HAND), { blur: 22, dx: 14, dy: 22, alpha: 0.26 * p });
  ctx.globalAlpha *= p;
  ctx.fillStyle = skin;
  ctx.beginPath();
  tracePoly(ctx, HAND);
  ctx.fill();
  // 掌心的明暗
  const g = ctx.createLinearGradient(-90, -120, 90, 120);
  g.addColorStop(0, rgba("#fff2dc", 0.35));
  g.addColorStop(1, rgba("#7a4e33", 0.25));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.globalAlpha = 1;
  // 勾线（生长）
  drawBrushStroke(ctx, HAND, p, {
    width: 4.2,
    color: pal.tea,
    seed: 17,
    tail: 0.1,
    head: 0.04,
    jitter: 0.25,
  });
  // 指缝 / 掌纹
  const lines: Pt[][] = [
    [
      { x: -40, y: -50 },
      { x: -42, y: -20 },
    ],
    [
      { x: 8, y: -56 },
      { x: 8, y: -24 },
    ],
    [
      { x: 46, y: -46 },
      { x: 44, y: -16 },
    ],
    [
      { x: -60, y: 30 },
      { x: -10, y: 10 },
      { x: 40, y: 22 },
    ],
  ];
  lines.forEach((ln, i) =>
    drawBrushStroke(ctx, ln, easeOutCubic(progress(p, 0.6 + i * 0.08, 1)), {
      width: 2.4,
      color: pal.tea,
      seed: 20 + i,
      alpha: 0.6,
    }),
  );
  void frame;
  ctx.restore();
}

// ---------------- 碎开的饼 ----------------
const WEDGE_A = [0.2, 1.05, 1.8, 2.75, 3.55, 4.4, 5.4];
const CRACKS: Pt[][] = WEDGE_A.map((a, i) => {
  const pts: Pt[] = [];
  const c0 = { x: 18 * Math.cos(i * 2.1), y: 18 * Math.sin(i * 2.1) };
  for (let k = 0; k <= 8; k++) {
    const rr = (k / 8) * CAKE_R * 1.15;
    const aa = a + 0.12 * Math.sin(k * 0.9 + i);
    pts.push({
      x: c0.x * (1 - k / 8) + Math.cos(aa) * rr,
      y: c0.y * (1 - k / 8) + Math.sin(aa) * rr,
    });
  }
  return jaggedPath(pts, 200 + i, 6, 12);
});
function wedge(i: number, rad: number): Pt[] {
  const a = WEDGE_A[i];
  const b = i + 1 < WEDGE_A.length ? WEDGE_A[i + 1] : WEDGE_A[0] + TAU;
  const arc: Pt[] = [];
  for (let k = 0; k <= 14; k++) {
    const aa = a + 0.12 * Math.sin(8 * 0.9 + i) + (b - a) * (k / 14);
    arc.push({ x: Math.cos(aa) * CAKE_R * rad, y: Math.sin(aa) * CAKE_R * rad });
  }
  const cut = (c: Pt[]) => c.filter((q) => Math.hypot(q.x, q.y) <= CAKE_R * rad);
  return [...cut(CRACKS[i]), ...arc, ...cut(CRACKS[(i + 1) % CRACKS.length]).reverse()];
}
const SHADOWS: Pt[][] = WEDGE_A.map((_, i) => wedge(i, 0.99));
const WEDGES: Pt[][] = WEDGE_A.map((a, i) => {
  const b = i + 1 < WEDGE_A.length ? WEDGE_A[i + 1] : WEDGE_A[0] + TAU;
  const arc: Pt[] = [];
  for (let k = 0; k <= 14; k++) {
    const aa = a + 0.12 * Math.sin(8 * 0.9 + i) + (b - a) * (k / 14);
    arc.push({ x: Math.cos(aa) * CAKE_R * 1.15, y: Math.sin(aa) * CAKE_R * 1.15 });
  }
  const next = CRACKS[(i + 1) % CRACKS.length].slice().reverse();
  return [...CRACKS[i], ...arc, ...next];
});

function drawBreakingCake(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette) {
  const land = heavyLand(frame - CAKE_AT, { drop: 150, fall: 10, squash: 0.05 });
  const s = CAKE.r / CAKE_R;
  const crack = easeOutCubic(progress(frame, CRACK_AT, CRACK_AT + 10));
  const brk = frame - BREAK_AT;
  ctx.save();
  ctx.globalAlpha = land.alpha;
  ctx.translate(CAKE.x, CAKE.y + land.y);
  ctx.scale(s * land.scaleX, s * land.scaleY);
  WEDGES.forEach((poly, i) => {
    const mid = (WEDGE_A[i] + (i + 1 < WEDGE_A.length ? WEDGE_A[i + 1] : WEDGE_A[0] + TAU)) / 2;
    const d =
      brk > 0
        ? 58 * easeOutExpo(progress(brk, 0, 14)) +
          10 * hash01(i, 3) * easeOutCubic(progress(brk, 0, 30))
        : 0;
    const r = brk > 0 ? (hash01(i, 9) - 0.5) * 0.3 * easeOutExpo(progress(brk, 0, 16)) : 0;
    ctx.save();
    ctx.translate(Math.cos(mid) * d, Math.sin(mid) * d);
    ctx.rotate(r);
    softShadow(ctx, () => tracePoly(ctx, SHADOWS[i]), { blur: 14, dx: 8, dy: 12, alpha: 0.3 });
    ctx.save();
    ctx.beginPath();
    tracePoly(ctx, poly);
    ctx.clip();
    paintCakeTexture(ctx, pal);
    ctx.restore();
    // 断口：深色细线
    if (brk > 0) {
      ctx.strokeStyle = rgba("#2a1a0c", 0.5);
      ctx.lineWidth = 3;
      ctx.beginPath();
      tracePoly(ctx, CRACKS[i], false);
      ctx.stroke();
    }
    ctx.restore();
  });
  // 裂纹生长（碎开之前）
  if (crack > 0 && brk <= 0) {
    ctx.strokeStyle = rgba("#1a0f07", 0.8);
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    for (const c of CRACKS) {
      ctx.beginPath();
      tracePoly(ctx, partialPolyline(c, crack), false);
      ctx.stroke();
    }
  }
  ctx.restore();
  // 碎叶四散（俯视：只有阻力，没有重力；落定后留在茶巾上）
  if (brk > 0) drawLeafBurst(ctx, brk, pal);
}

function drawLeafBurst(ctx: CanvasRenderingContext2D, l: number, pal: FxPalette) {
  const cols = [
    mixHex("#9a9474", pal.bamboo, 0.18),
    mixHex("#94765a", pal.tea, 0.25),
    mixHex("#b9a684", pal.oat, 0.35),
    mixHex("#7d7558", pal.bamboo, 0.12),
  ];
  const drag = 0.13;
  const travel = (1 - Math.exp(-l * drag)) / drag;
  for (let i = 0; i < 54; i++) {
    const a = hash01(i, 1) * TAU;
    const v = 22 + hash01(i, 2) * 46;
    const d = 60 + v * travel;
    const x = CAKE.x + Math.cos(a) * d;
    const y = CAKE.y + Math.sin(a) * d * 0.95;
    if (y > 1580) continue;
    const spin = (hash01(i, 3) - 0.5) * 0.5 * travel * 0.25 + hash01(i, 4) * TAU;
    const len = 12 + hash01(i, 5) * 22;
    const lift = Math.exp(-l * 0.12); // 刚飞出时离桌面高，影子远
    ctx.fillStyle = rgba("#2a1a0c", 0.22);
    ctx.beginPath();
    traceLeaf(ctx, x + 4 + 14 * lift, y + 6 + 20 * lift, spin, len, len * 0.3);
    ctx.fill();
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath();
    traceLeaf(ctx, x, y, spin, len, len * 0.3);
    ctx.fill();
  }
}

// ---------------- 文字带 ----------------
function drawTextBand(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  // 别用（朱砂大字）
  {
    const a = life(frame, NO_AT, CAKE_AT - 2, 10, 10);
    if (a > 0) {
      const txt = t(params, "no");
      const fs = fitSize(txt, 156, 520) * fontScale;
      const pose = lightFloat(frame - NO_AT, { rise: 10, sway: 0, seed: 3 });
      ctx.save();
      ctx.globalAlpha = a;
      inkText(ctx, txt, 540, 330 + pose.y, fs, easeOutCubic(progress(frame - NO_AT, 0, 12)), 101, {
        color: pal.cinnabar,
        weight: 900,
        font: SONG,
        wash: 0.04,
      });
      ctx.restore();
    }
  }
  // 碎（单字，偏右上）+ 白压了（竖排小字，左侧）
  {
    const l = frame - BREAK_AT;
    if (l > 0) {
      const txt = t(params, "broke");
      const fs = fitSize(txt, 250, 520) * fontScale;
      const pose = heavyLand(l + 4, { drop: 50, fall: 4, squash: 0.06 });
      ctx.save();
      ctx.translate(810, 470 + pose.y);
      ctx.rotate(0.06);
      ctx.scale(pose.scaleX, pose.scaleY);
      inkText(ctx, txt, 0, 0, fs, easeOutCubic(progress(l, 0, 10)), 103, {
        color: pal.cinnabar,
        weight: 900,
        font: SONG,
        wash: 0.04,
      });
      ctx.restore();
      const wl = frame - WASTE_AT;
      if (wl > 0) {
        const w = t(params, "waste");
        const wfs = fitSize(w, 76, 360, 1.06) * fontScale;
        inkText(ctx, w, 150, 980, wfs, easeOutCubic(progress(wl, 0, 14)), 105, {
          color: pal.ink,
          weight: 700,
          font: KAI,
          vertical: true,
          wash: 0.03,
        });
      }
    }
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
