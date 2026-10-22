/**
 * 第 20 期 B7「收尾」逐帧画布（1080×1920）。导出走这里；Comp.tsx 的预览也直接调用它。
 * A 缺角的整饼落下 → 棉纸四角依次折起包好 → 朱印「封」压下 →「别敞着」
 * B 金句竖排对联，逐字随口播晕开（撬时不伤叶 / 醒后才更香），旁边一片完整的叶、一缕香
 * C 碎饼「饼碎了」/ 茶针一滴朱砂「扎到手」，被说到时各被毛笔圈住；「评论区说说」+ 一笔指向评论区
 * D 新茶罐、老茶罐落下 → 被塞进木箱挤着晃（会出什么事？）→ 分开、竹青隔线 → 新茶老茶 / 要不要分开放？→ 印「下期见」
 */
import {
  TAU,
  cameraAt,
  cameraKick,
  clamp01,
  drawBrushStroke,
  drawSeal,
  drawSteam,
  easeInOutCubic,
  easeOutCubic,
  hash01,
  heavyLand,
  lerp,
  lightFloat,
  mixHex,
  progress,
  rgba,
  sealPress,
  springValue,
  steamWisps,
  traceLeaf,
  type FxPalette,
  type Pt,
} from "../kit/fx";
import { SEAL_FONT, type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  beginFrame,
  brushRing,
  chars,
  fitSize,
  inkText,
  life,
  renderLayers,
  softShadow,
  textOf,
  tracePoly,
} from "../kit/draw-kit";
import { CAKE_R, CAKE_SIL, centroid, chunkPolygon, paintCakeTexture } from "../kit/cake";
import { drawJar, drawTeaNeedle, paperColor } from "../kit/objects";
import {
  BOX,
  BOX_AT,
  BYE,
  BYE_HIT,
  CAKE,
  CAKE_AT,
  CHAR_FRAMES,
  C_OUT,
  GOLD1_AT,
  GOLD2_AT,
  GOLD_OUT,
  JAR1_AT,
  JAR2_AT,
  JAR_BASE,
  LENGTH,
  NEEDLE_AT,
  NEW_JAR,
  OLD_JAR,
  OPEN_AT,
  OPT_COLS,
  OPT1_AT,
  OPT2_AT,
  PACKET_OUT,
  PIECES_AT,
  SEAL_HIT,
  SEAL_LIFT,
  SEAL_PRESS,
  SHAKE_AT,
  SPLIT_AT,
  TEASER,
  TEXT,
  WRAP_AT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const NOTCH = chunkPolygon(-0.45, 0.4, 0.5, 13);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.06,
    drift: 6,
    focus: [
      { at: WRAP_AT - 6, dur: 20, x: CAKE.x, y: CAKE.y, zoom: 1.08, pull: 0.3 },
      { at: PACKET_OUT, dur: 20, x: 540, y: 900, zoom: 1.0, pull: 0.2 },
      { at: PIECES_AT, dur: 24, x: 540, y: 900, zoom: 1.0, pull: 0.2 },
      { at: JAR1_AT - 6, dur: 24, x: 540, y: 1100, zoom: 1.0, pull: 0.2 },
      { at: BOX_AT, dur: 20, x: 540, y: 1200, zoom: 1.08, pull: 0.3 },
      { at: SPLIT_AT, dur: 26, x: 540, y: 1020, zoom: 1.0, pull: 0.2 },
    ],
  });
  for (const [at, amp] of [
    [CAKE_AT + 10, 4],
    [SEAL_HIT, 5],
    [JAR2_AT + 9, 3],
    [BOX_AT + 10, 4],
    [BYE_HIT, 4],
  ] as const) {
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
    subject: (p) => {
      drawPacketPhase(ctx, frame, p, params);
      drawGoldPhase(ctx, frame, p, params, fontScale);
      drawCommentPhase(ctx, frame, p, params, fontScale);
      drawTeaserPhase(ctx, frame, p, params, fontScale);
    },
    text: (p) => drawTextBand(ctx, frame, p, params, fontScale),
  });
}

// ================= A：包好封上 =================
const D = 600; // 棉纸对角半径（折好后内切圆半径 = FOLD，要盖住饼）
const FOLD = 300;
const FLAPS = [
  { dir: (3 * Math.PI) / 4, at: 0 },
  { dir: -Math.PI / 4, at: 4 },
  { dir: Math.PI / 4, at: 8 },
  { dir: (-3 * Math.PI) / 4, at: 12 },
];
function flapGeom(dir: number, p: number) {
  const ux = Math.cos(dir);
  const uy = Math.sin(dir);
  const half = D - FOLD;
  const a = { x: ux * FOLD - uy * half, y: uy * FOLD + ux * half };
  const b = { x: ux * FOLD + uy * half, y: uy * FOLD - ux * half };
  const d = FOLD + half * Math.cos(Math.PI * p);
  return { a, b, tip: { x: ux * d, y: uy * d }, back: Math.cos(Math.PI * p) < 0 };
}
function core(): Pt[] {
  const out: Pt[] = [];
  for (const dir of [Math.PI / 4, (3 * Math.PI) / 4, (-3 * Math.PI) / 4, -Math.PI / 4]) {
    const g = flapGeom(dir, 1);
    out.push(g.b, g.a);
  }
  return out;
}
function paperSheet(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  fill: string,
  pal: FxPalette,
  seed: number,
) {
  ctx.save();
  ctx.beginPath();
  tracePoly(ctx, pts);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = rgba(pal.tea, 0.08);
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 80; i++) {
    const x = ((i * 97 + seed * 31) % 600) - 300;
    const y = ((i * 57 + seed * 13) % 600) - 300;
    const a = (i * 2.39 + seed) % TAU;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(a + 0.6) * 10,
      y + Math.sin(a + 0.6) * 10,
      x + Math.cos(a) * 20,
      y + Math.sin(a) * 20,
    );
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = rgba(pal.tea, 0.2);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  tracePoly(ctx, pts);
  ctx.stroke();
}

function drawPacketPhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
) {
  const out = easeInOutCubic(progress(frame, PACKET_OUT, PACKET_OUT + 16));
  if (out >= 1) return;
  const land = heavyLand(frame - CAKE_AT, { drop: 160, fall: 10, squash: 0.045 });
  if (land.alpha <= 0) return;
  const flapP = FLAPS.map((f) =>
    easeInOutCubic(progress(frame, WRAP_AT + f.at, WRAP_AT + f.at + 11)),
  );
  const sheetIn = lightFloat(frame - (WRAP_AT - 12), { rise: 30, sway: 0, seed: 1 });
  const fill = paperColor(pal);
  const under = mixHex(fill, "#b9a688", 0.18);
  ctx.save();
  ctx.globalAlpha = 1 - out;
  ctx.translate(CAKE.x - 260 * out, CAKE.y - 380 * out);
  ctx.scale(1 - 0.4 * out, 1 - 0.4 * out);
  ctx.rotate(-0.25 * out);
  // 棉纸垫在饼下面
  if (frame > WRAP_AT - 12) {
    ctx.save();
    ctx.globalAlpha *= sheetIn.alpha;
    ctx.translate(0, sheetIn.y);
    softShadow(ctx, () => tracePoly(ctx, core()), { blur: 16, dx: 6, dy: 12, alpha: 0.16 });
    paperSheet(ctx, core(), fill, pal, 1);
    FLAPS.forEach((f, i) => {
      if (flapP[i] > 0.02) return;
      const g = flapGeom(f.dir, 0);
      paperSheet(ctx, [g.a, g.tip, g.b], fill, pal, i + 2);
    });
    ctx.restore();
  }
  // 缺角的饼
  ctx.save();
  ctx.translate(0, land.y);
  ctx.scale(land.scaleX, land.scaleY);
  const s = CAKE.r / CAKE_R;
  ctx.scale(s, s);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-CAKE_R * 2, -CAKE_R * 2, CAKE_R * 4, CAKE_R * 4);
  tracePoly(ctx, NOTCH);
  ctx.clip("evenodd");
  softShadow(ctx, () => tracePoly(ctx, CAKE_SIL), {
    blur: 24,
    dx: 14,
    dy: 22,
    alpha: 0.36 * (1 - clamp01(-land.y / 160)),
  });
  paintCakeTexture(ctx, pal);
  ctx.restore();
  ctx.restore();
  // 四角折起盖住饼
  FLAPS.forEach((f, i) => {
    const p = flapP[i];
    if (p <= 0.02) return;
    const g = flapGeom(f.dir, p);
    const lift = Math.sin(Math.PI * p);
    softShadow(ctx, () => tracePoly(ctx, [g.a, g.tip, g.b]), {
      blur: 8 + 16 * lift,
      dx: 4 + 10 * lift,
      dy: 6 + 14 * lift,
      alpha: 0.22,
    });
    paperSheet(ctx, [g.a, g.tip, g.b], rgba(g.back ? under : fill, 0.9), pal, i + 7);
    ctx.strokeStyle = rgba(pal.tea, 0.25);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(g.a.x, g.a.y);
    ctx.lineTo(g.b.x, g.b.y);
    ctx.stroke();
  });
  // 纸下饼的鼓包（四角都折好后）
  const wrapped = flapP[3];
  if (wrapped > 0.6) {
    const a = (wrapped - 0.6) / 0.4;
    const R = CAKE.r * 1.02;
    ctx.save();
    ctx.globalAlpha *= a;
    const ring = ctx.createLinearGradient(-R, -R, R, R);
    ring.addColorStop(0, rgba("#ffffff", 0.55));
    ring.addColorStop(0.5, rgba("#ffffff", 0));
    ring.addColorStop(1, rgba("#3a2616", 0.3));
    ctx.strokeStyle = ring;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(0, 0, R - 8, 0, TAU);
    ctx.stroke();
    const dome = ctx.createRadialGradient(-R * 0.4, -R * 0.4, 10, 0, 0, R);
    dome.addColorStop(0, rgba("#ffffff", 0.18));
    dome.addColorStop(0.7, rgba("#ffffff", 0));
    dome.addColorStop(1, rgba("#3a2616", 0.12));
    ctx.fillStyle = dome;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  // 朱印「封」
  const sl = frame - (SEAL_HIT - SEAL_LIFT - SEAL_PRESS);
  if (sl > 0) {
    drawSeal(ctx, {
      text: t(params, "seal"),
      x: 6,
      y: 4,
      size: 150,
      pose: sealPress(sl, { lift: SEAL_LIFT, press: SEAL_PRESS, height: 90, rot: -0.1 }),
      color: pal.cinnabar,
      paper: pal.paper,
      font: SEAL_FONT,
      seed: 30,
    });
  }
  ctx.restore();
}

// ================= B：金句 =================
const GOLD_X = [730, 390];
const GOLD_Y = [800, 940];

function drawGoldPhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < GOLD1_AT - 2) return;
  const out = easeInOutCubic(progress(frame, GOLD_OUT, GOLD_OUT + 14));
  if (out >= 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - out;
  const cols: [TextKey, number][] = [
    ["gold1", GOLD1_AT],
    ["gold2", GOLD2_AT],
  ];
  cols.forEach(([key, at], ci) => {
    const txt = t(params, key);
    const cs = chars(txt);
    const fs = fitSize(txt, 172, 920, 1.06) * fontScale;
    const step = fs * 1.06;
    const top = GOLD_Y[ci] - ((cs.length - 1) * step) / 2;
    cs.forEach((ch, k) => {
      const l = frame - (at + k * CHAR_FRAMES);
      if (l <= -2) return;
      const pose = lightFloat(l + 2, { rise: 18, sway: 1, seed: k + ci * 5 });
      inkText(
        ctx,
        ch,
        GOLD_X[ci],
        top + k * step + pose.y,
        fs,
        easeOutCubic(progress(l, 0, 12)),
        200 + ci * 10 + k,
        {
          color: pal.ink,
          weight: 900,
          font: SONG,
          wash: 0.025,
        },
      );
    });
    // 上联旁一片完整的叶（不伤叶），下联旁一缕香
    const deco = frame - (at + cs.length * CHAR_FRAMES - 4);
    if (deco > 0) {
      const a = easeOutCubic(progress(deco, 0, 16));
      if (ci === 0) {
        const f = lightFloat(deco, { rise: 30, sway: 8, seed: 3 });
        drawWholeLeaf(ctx, pal, GOLD_X[0] + 150, top + step * 3.6 + f.y, -0.9 + f.rot * 4, a);
      } else {
        drawSteam(
          ctx,
          steamWisps(frame, 3, { x: GOLD_X[1] - 150, y: top + step * 4.6, w: 50 }, 21, 360),
          mixHex(pal.oat, pal.tea, 0.3),
          1.2 * a,
        );
      }
    }
  });
  // 两联之间一道淡朱砂竖线
  const lp = easeInOutCubic(progress(frame, GOLD1_AT + 6, GOLD2_AT + 20));
  drawBrushStroke(
    ctx,
    [
      { x: 562, y: 470 },
      { x: 560, y: 1300 },
    ],
    lp,
    { width: 2.4, color: pal.cinnabar, seed: 220, tail: 0.3, head: 0.05, alpha: 0.35 },
  );
  ctx.restore();
}

function drawWholeLeaf(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  x: number,
  y: number,
  rot: number,
  a: number,
) {
  const len = 130;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = rgba("#2a1a0c", 0.18);
  ctx.beginPath();
  traceLeaf(ctx, x + 14, y + 20, rot, len, len * 0.36);
  ctx.fill();
  const g = ctx.createLinearGradient(x - 60, y - 60, x + 60, y + 60);
  g.addColorStop(0, mixHex(pal.bamboo, "#d9d2a8", 0.35));
  g.addColorStop(1, mixHex(pal.bamboo, "#2f3a1f", 0.25));
  ctx.fillStyle = g;
  ctx.beginPath();
  traceLeaf(ctx, x, y, rot, len, len * 0.36);
  ctx.fill();
  ctx.strokeStyle = rgba("#2f3a1f", 0.55);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - Math.cos(rot) * len * 0.46, y - Math.sin(rot) * len * 0.46);
  ctx.lineTo(x + Math.cos(rot) * len * 0.46, y + Math.sin(rot) * len * 0.46);
  ctx.stroke();
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    const u = i * 0.16;
    const px = x + Math.cos(rot) * len * u;
    const py = y + Math.sin(rot) * len * u;
    for (const side of [1, -1]) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(
        px + Math.cos(rot + side * 0.9) * 22 + Math.cos(rot) * 10,
        py + Math.sin(rot + side * 0.9) * 22 + Math.sin(rot) * 10,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ================= C：评论区 =================
const PIECES = [
  chunkPolygon(-0.5, 0.35, 0.3, 41),
  chunkPolygon(1.6, 2.5, 0.45, 43),
  chunkPolygon(3.4, 4.1, 0.55, 47),
];
const PIECE_POS = [
  { x: 250, y: 840, r: 0.6 },
  { x: 430, y: 1000, r: -0.9 },
  { x: 220, y: 1090, r: 2.2 },
];
/** 碎饼整体下移到左列字下面；茶针尖放到右列字下面 */
const PIECES_SHIFT = { x: 0, y: 270 };
const NEEDLE_TIP = { x: 570, y: 1345 };

function drawCommentPhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < PIECES_AT) return;
  const out = easeInOutCubic(progress(frame, C_OUT, C_OUT + 14));
  if (out >= 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - out;
  // 碎饼三块 + 碎叶（左列「饼碎了」下面）
  ctx.save();
  ctx.translate(PIECES_SHIFT.x, PIECES_SHIFT.y);
  PIECES.forEach((poly, i) => {
    const pose = heavyLand(frame - (PIECES_AT + i * 3), { drop: 120, fall: 8, squash: 0.06 });
    if (pose.alpha <= 0) return;
    const c = centroid(poly);
    const p = PIECE_POS[i];
    ctx.save();
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(p.x, p.y + pose.y);
    ctx.rotate(p.r);
    ctx.scale(0.8 * pose.scaleX, 0.8 * pose.scaleY);
    ctx.translate(-c.x, -c.y);
    softShadow(ctx, () => tracePoly(ctx, poly), { blur: 14, dx: 10, dy: 14, alpha: 0.3 });
    ctx.save();
    ctx.beginPath();
    tracePoly(ctx, poly);
    ctx.clip();
    paintCakeTexture(ctx, pal);
    ctx.restore();
    ctx.restore();
  });
  const crumbs = frame - (PIECES_AT + 8);
  if (crumbs > 0) {
    const cols = [
      mixHex("#9a9474", pal.bamboo, 0.18),
      mixHex("#94765a", pal.tea, 0.25),
      mixHex("#b9a684", pal.oat, 0.35),
    ];
    for (let i = 0; i < 22; i++) {
      const a = hash01(i, 71) * TAU;
      const d = 40 + hash01(i, 72) * 170 * (1 - Math.exp(-crumbs * 0.2));
      const x = 310 + Math.cos(a) * d;
      const y = 990 + Math.sin(a) * d * 0.8;
      ctx.fillStyle = cols[i % 3];
      ctx.beginPath();
      traceLeaf(ctx, x, y, hash01(i, 73) * TAU, 12 + hash01(i, 74) * 14, 5);
      ctx.fill();
    }
  }
  ctx.restore();
  // 茶针 + 针尖一滴朱砂
  const nl = frame - NEEDLE_AT;
  if (nl > 0) {
    const s = springValue(nl, { stiffness: 160, damping: 17, mass: 1 });
    ctx.save();
    ctx.translate(NEEDLE_TIP.x + (1 - s) * 300, NEEDLE_TIP.y - (1 - s) * 120);
    ctx.rotate(-0.42);
    ctx.scale(1.15, 1.15);
    drawTeaNeedle(ctx, pal, (1 - s) * 0.5);
    ctx.restore();
    const dl = frame - (OPT2_AT - 4);
    if (dl > 0) {
      const dp = springValue(dl, { stiffness: 260, damping: 14, mass: 1 });
      const r = 13 * dp;
      const x = NEEDLE_TIP.x - 18;
      const y = NEEDLE_TIP.y + 12;
      ctx.fillStyle = pal.cinnabar;
      ctx.beginPath();
      ctx.moveTo(x, y - r * 1.8);
      ctx.bezierCurveTo(x + r * 1.1, y - r * 0.4, x + r, y + r, x, y + r);
      ctx.bezierCurveTo(x - r, y + r, x - r * 1.1, y - r * 0.4, x, y - r * 1.8);
      ctx.fill();
      ctx.fillStyle = rgba("#ffffff", 0.5);
      ctx.beginPath();
      ctx.arc(x - r * 0.35, y - r * 0.1, r * 0.22, 0, TAU);
      ctx.fill();
    }
  }
  // 两列竖排大字（像 B5 的条幅）：说到时各被一道朱砂竖圈圈住
  const opts: [TextKey, number][] = [
    ["opt1", OPT1_AT],
    ["opt2", OPT2_AT],
  ];
  opts.forEach(([key, at], ci) => {
    const l = frame - (at - 2);
    if (l <= 0) return;
    const txt = t(params, key);
    const cs = chars(txt);
    const fs = fitSize(txt, OPT_COLS.size, 600, 1.06) * fontScale;
    const step = Math.min(OPT_COLS.step, fs * 1.06);
    const x = OPT_COLS.x[ci];
    cs.forEach((ch, k) => {
      const cl = l - k * CHAR_FRAMES;
      if (cl <= -2) return;
      const land = heavyLand(cl + 2, { drop: 26, fall: 3, squash: 0.08 });
      ctx.save();
      ctx.translate(x, OPT_COLS.y + k * step + land.y);
      ctx.scale(land.scaleX, land.scaleY);
      inkText(ctx, ch, 0, 0, fs, easeOutCubic(progress(cl, 0, 10)), 240 + ci * 10 + k, {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    });
    const cy = OPT_COLS.y + ((cs.length - 1) * step) / 2;
    const ry = ((cs.length - 1) * step) / 2 + fs * 0.75;
    brushRing(
      ctx,
      x,
      cy,
      fs * 0.82,
      ry,
      progress(l, 8 + cs.length * CHAR_FRAMES, 30 + cs.length * CHAR_FRAMES),
      pal.cinnabar,
      250 + ci,
      8,
    );
  });
  ctx.restore();
}

// ================= D：下期预告 =================
function drawTeaserPhase(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  if (frame < JAR1_AT) return;
  const inBox = easeInOutCubic(progress(frame, BOX_AT + 4, BOX_AT + 18));
  const split = easeInOutCubic(progress(frame, SPLIT_AT, SPLIT_AT + 18));
  const boxA =
    easeOutCubic(progress(frame, BOX_AT, BOX_AT + 10)) *
    (1 - easeInOutCubic(progress(frame, SPLIT_AT - 2, SPLIT_AT + 12)));
  // 晃一晃（会出什么事）
  const sh = frame - SHAKE_AT;
  const shake = sh > 0 && frame < SPLIT_AT ? Math.sin(sh * 0.9) * Math.exp(-sh * 0.06) : 0;
  const jars = [
    { cfg: NEW_JAR, at: JAR1_AT, body: mixHex("#8d9a74", pal.bamboo, 0.3), seed: 8, dir: -1 },
    { cfg: OLD_JAR, at: JAR2_AT, body: mixHex("#5b3624", pal.tea, 0.2), seed: 9, dir: 1 },
  ];
  // 箱子背板（在罐子后面）
  if (boxA > 0) drawBox(ctx, pal, boxA, "back");
  jars.forEach((j) => {
    const pose = heavyLand(frame - j.at, { drop: 150, fall: 9, squash: 0.05 });
    if (pose.alpha <= 0) return;
    let x = lerp(j.cfg.x, j.cfg.boxX, inBox);
    x = lerp(x, j.cfg.splitX, split);
    const rot = shake * 0.05 * j.dir;
    ctx.save();
    ctx.globalAlpha = pose.alpha;
    ctx.translate(x + shake * 6 * j.dir, JAR_BASE + pose.y);
    ctx.rotate(rot);
    ctx.scale(pose.scaleX, pose.scaleY);
    drawJar(ctx, pal, { h: j.cfg.h, body: j.body, seed: j.seed });
    ctx.restore();
  });
  if (boxA > 0) drawBox(ctx, pal, boxA, "front");
  // 「会出什么事？」：一笔朱砂问号
  if (sh > 0 && frame < SPLIT_AT + 16) {
    const a = 1 - easeInOutCubic(progress(frame, SPLIT_AT - 4, SPLIT_AT + 10));
    const q: Pt[] = [
      { x: 500, y: 860 },
      { x: 530, y: 820 },
      { x: 580, y: 818 },
      { x: 606, y: 852 },
      { x: 596, y: 896 },
      { x: 556, y: 924 },
      { x: 548, y: 970 },
    ];
    ctx.save();
    ctx.globalAlpha = a;
    drawBrushStroke(ctx, q, easeOutCubic(progress(sh, 0, 12)), {
      width: 11,
      color: pal.cinnabar,
      seed: 260,
      tail: 0.3,
    });
    const dp = easeOutCubic(progress(sh, 10, 16));
    if (dp > 0) {
      ctx.fillStyle = pal.cinnabar;
      ctx.beginPath();
      ctx.arc(548, 1012, 9 * dp, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  // 分开后：中间一道竹青隔线
  if (split > 0) {
    drawBrushStroke(
      ctx,
      [
        { x: 542, y: 960 },
        { x: 538, y: 1200 },
        { x: 541, y: JAR_BASE - 10 },
      ],
      split,
      { width: 9, color: pal.bamboo, seed: 270, tail: 0.25, dry: 0.5, dryColor: pal.paper },
    );
  }
  // 小印「下期见」
  const bl = frame - (BYE_HIT - 12);
  if (bl > 0) {
    drawSeal(ctx, {
      text: t(params, "bye"),
      x: BYE.x,
      y: BYE.y,
      size: BYE.size * fontScale ** 0.5,
      pose: sealPress(bl, { lift: 8, press: 4, height: 70, rot: 0.06 }),
      color: pal.cinnabar,
      paper: pal.paper,
      font: SEAL_FONT,
      seed: 31,
    });
  }
  void params;
}

/** 木箱（侧视，开口朝上）：back = 箱内背板，front = 前板 */
function drawBox(ctx: CanvasRenderingContext2D, pal: FxPalette, a: number, part: "back" | "front") {
  const { x0, x1, top } = BOX;
  const bottom = JAR_BASE + 14;
  const drop = (1 - a) * -60;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(0, drop);
  if (part === "back") {
    ctx.fillStyle = mixHex(pal.tea, "#1a0f07", 0.35);
    ctx.fillRect(x0 + 16, top - 70, x1 - x0 - 32, bottom - top + 70);
  } else {
    softShadow(ctx, () => ctx.rect(x0, top, x1 - x0, bottom - top), {
      blur: 20,
      dx: 14,
      dy: 10,
      alpha: 0.3,
    });
    const planks = 3;
    const ph = (bottom - top) / planks;
    for (let i = 0; i < planks; i++) {
      const g = ctx.createLinearGradient(0, top + i * ph, 0, top + (i + 1) * ph);
      g.addColorStop(0, mixHex(pal.tea, "#d9b07a", 0.42 - i * 0.05));
      g.addColorStop(1, mixHex(pal.tea, "#3b2416", 0.18));
      ctx.fillStyle = g;
      ctx.fillRect(x0, top + i * ph, x1 - x0, ph - 3);
      ctx.strokeStyle = rgba("#1a0f07", 0.18);
      ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(x0 + 10, top + i * ph + 12 + k * 18);
        ctx.bezierCurveTo(
          x0 + 200,
          top + i * ph + 8 + k * 18,
          x1 - 200,
          top + i * ph + 16 + k * 18,
          x1 - 10,
          top + i * ph + 12 + k * 18,
        );
        ctx.stroke();
      }
    }
    // 两根竖档
    ctx.fillStyle = mixHex(pal.tea, "#2a170c", 0.3);
    ctx.fillRect(x0, top - 4, 22, bottom - top + 4);
    ctx.fillRect(x1 - 22, top - 4, 22, bottom - top + 4);
    ctx.fillStyle = rgba("#fff2dc", 0.3);
    ctx.fillRect(x0, top - 4, x1 - x0, 3);
  }
  ctx.restore();
}

// ================= 文字带 =================
function drawTextBand(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  // 别敞着
  {
    const a = life(frame, OPEN_AT, PACKET_OUT + 2, 12, 12);
    if (a > 0) {
      const txt = t(params, "open");
      const fs = fitSize(txt, 190, 900) * fontScale;
      ctx.save();
      ctx.globalAlpha = a;
      inkText(ctx, txt, 540, 290, fs, easeOutCubic(progress(frame - OPEN_AT, 0, 12)), 301, {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    }
  }
  // 新茶老茶 / 要不要分开放？—— 两行大字，出来后一直留到结尾
  {
    const l = frame - (JAR1_AT + 2);
    if (l > 0) {
      const txt = t(params, "teaser");
      const fs = fitSize(txt, TEASER.size, 900) * fontScale;
      const pose = lightFloat(l, { rise: 14, sway: 1, seed: 6 });
      inkText(ctx, txt, 540, TEASER.y + pose.y, fs, easeOutCubic(progress(l, 0, 16)), 309, {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      const sl = frame - (SPLIT_AT + 2);
      if (sl > 0) {
        const sub = t(params, "teaserSub");
        const sfs = fitSize(sub, TEASER.subSize, 960) * fontScale;
        const sp = lightFloat(sl, { rise: 14, sway: 1, seed: 7 });
        inkText(ctx, sub, 540, TEASER.subY + sp.y, sfs, easeOutCubic(progress(sl, 0, 14)), 311, {
          color: pal.cinnabar,
          weight: 900,
          font: SONG,
          wash: 0.03,
        });
      }
    }
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
