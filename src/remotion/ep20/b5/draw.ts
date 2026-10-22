/**
 * 第 20 期 B5「口诀」逐帧画布（1080×1920）。导出走这里；Comp.tsx 的预览也直接调用它。
 * 宣纸条幅落定 → 竖格线生长 → 「顺纹借力」「够喝一周」右起竖排，逐字随口播压下晕开 →
 * 朱印「快取快封」提起、砸下、印泥洇开，镜头一震。
 */
import {
  cachedSurface,
  cameraAt,
  cameraKick,
  drawBrushStroke,
  drawSeal,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  jaggedPath,
  lightFloat,
  mixHex,
  progress,
  rgba,
  rng,
  sealPress,
  type FxPalette,
  type Pt,
} from "../kit/fx";
import { SEAL_FONT, type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  beginFrame,
  chars,
  fitSize,
  inkText,
  renderLayers,
  softShadow,
  textOf,
  tracePoly,
} from "../kit/draw-kit";
import {
  CHAR_FRAMES,
  COL_SIZE,
  COL_X,
  COL_Y,
  LENGTH,
  P1_AT,
  P2_AT,
  RULE_AT,
  SEAL_AT,
  SEAL_HIT,
  SEAL_LIFT,
  SEAL_POS,
  SEAL_PRESS,
  SHEET,
  SHEET_AT,
  TEXT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.07,
    drift: 5,
    focus: [
      { at: P1_AT - 8, dur: 18, x: COL_X[0], y: COL_Y[0], zoom: 1.03, pull: 0.18 },
      { at: P2_AT - 8, dur: 18, x: COL_X[1], y: COL_Y[1], zoom: 1.04, pull: 0.18 },
      { at: SEAL_AT - 6, dur: 16, x: SEAL_POS.x + 60, y: SEAL_POS.y - 80, zoom: 1.06, pull: 0.22 },
      { at: SEAL_HIT + 14, dur: 30, x: 540, y: 920, zoom: 1.02, pull: 0.1 },
    ],
  });
  const k = cameraKick(frame - SEAL_HIT, 7);
  cam.x -= k.x;
  cam.y -= k.y;
  return cam;
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame, pal, fontScale } = beginFrame(ctx, elapsed, params);
  const cam = beatCamera(frame);
  renderLayers(ctx, frame, pal, cam, {
    leaves: 3,
    subject: (p) => drawSubject(ctx, frame, p, params, fontScale),
  });
}

// ---------------- 宣纸条幅（毛边） ----------------
const SHEET_POLY: Pt[] = (() => {
  const { x, y, w, h } = SHEET;
  const edge = (a: Pt, b: Pt, seed: number) => jaggedPath([a, b], seed, 2.6, 7);
  return [
    ...edge({ x, y }, { x: x + w, y }, 11),
    ...edge({ x: x + w, y }, { x: x + w, y: y + h }, 13),
    ...edge({ x: x + w, y: y + h }, { x, y: y + h }, 17),
    ...edge({ x, y: y + h }, { x, y }, 19),
  ];
})();

function sheetTexture(pal: FxPalette) {
  const { w, h } = SHEET;
  return cachedSurface(`ep20b5-sheet:${pal.paper}`, w, h, (c) => {
    const base = pal.dark ? mixHex(pal.paper, pal.rice, 0.12) : mixHex(pal.paper, "#fffaf0", 0.55);
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
    const r = rng(55);
    // 纤维
    c.lineWidth = 0.9;
    for (let i = 0; i < 420; i++) {
      const x = r() * w;
      const y = r() * h;
      const a = r() * Math.PI * 2;
      const l = 8 + r() * 26;
      c.strokeStyle = rgba(pal.tea, 0.04 + r() * 0.05);
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(
        x + Math.cos(a + 0.6) * l * 0.5,
        y + Math.sin(a + 0.6) * l * 0.5,
        x + Math.cos(a) * l,
        y + Math.sin(a) * l,
      );
      c.stroke();
    }
    // 帘纹（很淡的横纹）
    for (let y = 0; y < h; y += 26) {
      c.fillStyle = rgba(pal.tea, 0.025);
      c.fillRect(0, y, w, 1.2);
    }
    // 左上受光
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, rgba("#fff6e4", 0.35));
    g.addColorStop(1, rgba("#7a4e33", 0.06));
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  // 条幅：轻轻浮落
  const sl = frame - SHEET_AT;
  if (sl <= 0) return;
  const pose = lightFloat(sl, { rise: 40, sway: 0.8, seed: 2 });
  ctx.save();
  ctx.globalAlpha = pose.alpha;
  ctx.translate(0, pose.y);
  ctx.translate(540, 920);
  ctx.rotate(-0.012 + pose.rot * 0.3);
  ctx.translate(-540, -920);
  softShadow(ctx, () => tracePoly(ctx, SHEET_POLY), { blur: 26, dx: 14, dy: 20, alpha: 0.22 });
  ctx.save();
  ctx.beginPath();
  tracePoly(ctx, SHEET_POLY);
  ctx.clip();
  ctx.drawImage(sheetTexture(pal).canvas as CanvasImageSource, SHEET.x, SHEET.y, SHEET.w, SHEET.h);
  ctx.restore();

  // 竖格线（淡朱砂）
  const rules = [905, 675, 445];
  rules.forEach((x, i) => {
    const p = easeInOutCubic(progress(frame, RULE_AT + i * 4, RULE_AT + i * 4 + 22));
    drawBrushStroke(
      ctx,
      [
        { x, y: SHEET.y + 70 },
        { x: x + 1, y: SHEET.y + SHEET.h - 70 },
      ],
      p,
      { width: 2.2, color: pal.cinnabar, seed: 5 + i, tail: 0.2, head: 0.05, alpha: 0.28 },
    );
  });

  // 两列口诀：逐字随口播压下 + 晕开
  const cols: [TextKey, number][] = [
    ["p1", P1_AT],
    ["p2", P2_AT],
  ];
  cols.forEach(([key, at], ci) => {
    const txt = t(params, key);
    const cs = chars(txt);
    const fs = fitSize(txt, COL_SIZE, 640, 1.06) * fontScale;
    const step = fs * 1.06;
    const top = COL_Y[ci] - ((cs.length - 1) * step) / 2;
    cs.forEach((ch, k) => {
      const l = frame - (at + k * CHAR_FRAMES);
      if (l <= -2) return;
      const land = heavyLand(l + 2, { drop: 26, fall: 3, squash: 0.08 });
      const y = top + k * step;
      ctx.save();
      ctx.translate(COL_X[ci], y + land.y);
      ctx.scale(land.scaleX, land.scaleY);
      inkText(ctx, ch, 0, 0, fs, easeOutCubic(progress(l, 0, 10)), 120 + ci * 10 + k, {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    });
  });

  // 镇纸：上下各一根，压住条幅（重落）
  [SHEET.y + 46, SHEET.y + SHEET.h - 46].forEach((y, i) => {
    const wl = heavyLand(frame - (SHEET_AT + 10 + i * 4), { drop: 70, fall: 7, squash: 0.06 });
    if (wl.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= wl.alpha;
    ctx.translate(540, y + wl.y);
    ctx.scale(wl.scaleX, wl.scaleY);
    drawWeight(ctx, pal, SHEET.w + 60, Math.min(1, -wl.y / 70));
    ctx.restore();
  });

  // 朱印
  const pl = frame - SEAL_AT;
  if (pl > 0) {
    const sp = sealPress(pl, { lift: SEAL_LIFT, press: SEAL_PRESS, height: 110, rot: -0.07 });
    drawSeal(ctx, {
      text: t(params, "seal"),
      x: SEAL_POS.x,
      y: SEAL_POS.y,
      size: SEAL_POS.size * fontScale ** 0.5,
      pose: sp,
      color: pal.cinnabar,
      paper: pal.paper,
      font: SEAL_FONT,
      seed: 24,
    });
    // 印泥溅出的几粒
    const hl = frame - SEAL_HIT;
    if (hl > 0) {
      const r = rng(81);
      ctx.fillStyle = rgba(pal.cinnabar, 0.55 * (1 - progress(hl, 20, 60)));
      for (let i = 0; i < 9; i++) {
        const a = r() * Math.PI * 2;
        const d = SEAL_POS.size * (0.62 + r() * 0.2) * easeOutCubic(progress(hl, 0, 8));
        ctx.beginPath();
        ctx.arc(
          SEAL_POS.x + Math.cos(a) * d,
          SEAL_POS.y + Math.sin(a) * d,
          2 + r() * 4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

/** 镇纸（乌木长条，原点为中心） */
function drawWeight(ctx: CanvasRenderingContext2D, pal: FxPalette, w: number, lift: number) {
  const h = 36;
  const path = () => {
    ctx.moveTo(-w / 2 + 6, -h / 2);
    ctx.lineTo(w / 2 - 6, -h / 2);
    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + 6);
    ctx.lineTo(w / 2, h / 2 - 6);
    ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - 6, h / 2);
    ctx.lineTo(-w / 2 + 6, h / 2);
    ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - 6);
    ctx.lineTo(-w / 2, -h / 2 + 6);
    ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + 6, -h / 2);
    ctx.closePath();
  };
  softShadow(ctx, path, {
    blur: 10 + 20 * lift,
    dx: 8 + 16 * lift,
    dy: 12 + 24 * lift,
    alpha: 0.4 - 0.15 * lift,
  });
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, mixHex(pal.tea, "#d9b07a", 0.25));
  g.addColorStop(0.3, mixHex(pal.tea, "#2a170c", 0.35));
  g.addColorStop(1, mixHex(pal.tea, "#120a05", 0.7));
  ctx.fillStyle = g;
  ctx.beginPath();
  path();
  ctx.fill();
  // 木纹 + 顶面一道高光
  ctx.strokeStyle = rgba("#000000", 0.18);
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 20, -6 + i * 6);
    ctx.bezierCurveTo(-w * 0.2, -9 + i * 6, w * 0.2, -3 + i * 6, w / 2 - 20, -6 + i * 6);
    ctx.stroke();
  }
  ctx.fillStyle = rgba("#fff1d8", 0.3);
  ctx.fillRect(-w / 2 + 8, -h / 2 + 2, w - 16, 3);
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
