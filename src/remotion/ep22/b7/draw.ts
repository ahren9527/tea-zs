/**
 * 第 22 期 B7「口诀金句」逐帧画布（1080×1920，对标 ep20 B5 标杆）
 * 宣纸条幅落定 → 上下乌木镇纸压住 → 淡朱砂竖格线生长 →
 * 「封住气」「挡住光」「护住形」右起三列竖排，逐字随口播压下晕开 →
 * 左下朱砂白文方印「三层护茶」提起、砸下、印泥微溅，镜头轻震。
 */
import {
  TAU,
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
  P3_AT,
  RULE_AT,
  SEAL_AT,
  SEAL_HIT,
  SEAL_LIFT,
  SEAL_POS,
  SEAL_PRESS,
  SHEET,
  SHEET_AT,
  TEXT,
  TITLE_AT,
  TITLE_Y,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.07,
    drift: 5,
    focus: [
      { at: P1_AT - 8, dur: 18, x: COL_X[0], y: COL_Y[0], zoom: 1.03, pull: 0.16 },
      { at: P2_AT - 8, dur: 18, x: COL_X[1], y: COL_Y[1], zoom: 1.04, pull: 0.16 },
      { at: P3_AT - 8, dur: 18, x: COL_X[2], y: COL_Y[2], zoom: 1.05, pull: 0.18 },
      { at: SEAL_AT - 4, dur: 16, x: SEAL_POS.x + 80, y: SEAL_POS.y - 90, zoom: 1.06, pull: 0.2 },
      { at: SEAL_HIT + 14, dur: 28, x: 540, y: 920, zoom: 1.01, pull: 0.1 },
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

// 毛边宣纸条幅外轮廓
const SHEET_POLY: Pt[] = (() => {
  const { x, y, w, h } = SHEET;
  const edge = (a: Pt, b: Pt, seed: number) => jaggedPath([a, b], seed, 2.6, 7);
  return [
    ...edge({ x, y }, { x: x + w, y }, 21),
    ...edge({ x: x + w, y }, { x: x + w, y: y + h }, 23),
    ...edge({ x: x + w, y: y + h }, { x, y: y + h }, 27),
    ...edge({ x, y: y + h }, { x, y }, 29),
  ];
})();

function sheetTexture(pal: FxPalette) {
  const { w, h } = SHEET;
  return cachedSurface(`ep22b7-sheet:${pal.paper}`, w, h, (c) => {
    const base = pal.dark ? mixHex(pal.paper, pal.rice, 0.12) : mixHex(pal.paper, "#fffaf0", 0.55);
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
    const r = rng(77);
    c.lineWidth = 0.9;
    for (let i = 0; i < 420; i++) {
      const x = r() * w;
      const y = r() * h;
      const a = r() * TAU;
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
    for (let y = 0; y < h; y += 26) {
      c.fillStyle = rgba(pal.tea, 0.025);
      c.fillRect(0, y, w, 1.2);
    }
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
  const sl = frame - SHEET_AT;
  if (sl <= 0) return;
  const pose = lightFloat(sl, { rise: 40, sway: 0.8, seed: 2 });

  ctx.save();
  ctx.globalAlpha = pose.alpha;
  ctx.translate(0, pose.y);
  ctx.translate(540, 915);
  ctx.rotate(-0.01 + pose.rot * 0.3);
  ctx.translate(-540, -915);

  softShadow(ctx, () => tracePoly(ctx, SHEET_POLY), { blur: 26, dx: 14, dy: 20, alpha: 0.22 });
  ctx.save();
  ctx.beginPath();
  tracePoly(ctx, SHEET_POLY);
  ctx.clip();
  ctx.drawImage(sheetTexture(pal).canvas as CanvasImageSource, SHEET.x, SHEET.y, SHEET.w, SHEET.h);
  ctx.restore();

  // 四道淡朱砂竖格线
  const rules = [900, 710, 520, 330];
  rules.forEach((x, i) => {
    const p = easeInOutCubic(progress(frame, RULE_AT + i * 4, RULE_AT + i * 4 + 22));
    drawBrushStroke(
      ctx,
      [
        { x, y: SHEET.y + 200 },
        { x: x + 1, y: SHEET.y + SHEET.h - 72 },
      ],
      p,
      { width: 2.2, color: pal.cinnabar, seed: 15 + i, tail: 0.2, head: 0.05, alpha: 0.26 },
    );
  });

  // 横排标题「各管一件事」：口播说到「三层各管」时晕开，三列口诀落在它下方
  {
    const tl = frame - TITLE_AT;
    if (tl > 0) {
      const txt = t(params, "title");
      const fs = fitSize(txt, 104, 660) * fontScale;
      inkText(ctx, txt, 540, TITLE_Y, fs, easeOutCubic(progress(tl, 0, 14)), 131, {
        color: pal.tea,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
    }
  }

  // 三列竖排口诀：「封住气」「挡住光」「护住形」
  const cols: [TextKey, number][] = [
    ["p1", P1_AT],
    ["p2", P2_AT],
    ["p3", P3_AT],
  ];
  cols.forEach(([key, at], ci) => {
    const txt = t(params, key);
    const cs = chars(txt);
    const fs = fitSize(txt, COL_SIZE, 560, 1.06) * fontScale;
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
      inkText(ctx, ch, 0, 0, fs, easeOutCubic(progress(l, 0, 10)), 140 + ci * 10 + k, {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.03,
      });
      ctx.restore();
    });
  });

  // 上下乌木镇纸
  [SHEET.y + 46, SHEET.y + SHEET.h - 46].forEach((y, i) => {
    const wl = heavyLand(frame - (SHEET_AT + 10 + i * 4), { drop: 70, fall: 7, squash: 0.06 });
    if (wl.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= wl.alpha;
    ctx.translate(540, y + wl.y);
    ctx.scale(wl.scaleX, wl.scaleY);
    drawWeight(ctx, pal, SHEET.w + 56, Math.min(1, -wl.y / 70));
    ctx.restore();
  });

  // 左下朱印「三层护茶」
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
      seed: 42,
    });
    const hl = frame - SEAL_HIT;
    if (hl > 0) {
      const r = rng(93);
      ctx.fillStyle = rgba(pal.cinnabar, 0.52 * (1 - progress(hl, 20, 60)));
      for (let i = 0; i < 9; i++) {
        const a = r() * TAU;
        const d = SEAL_POS.size * (0.62 + r() * 0.2) * easeOutCubic(progress(hl, 0, 8));
        ctx.beginPath();
        ctx.arc(
          SEAL_POS.x + Math.cos(a) * d,
          SEAL_POS.y + Math.sin(a) * d,
          2 + r() * 4,
          0,
          TAU * 0.9995,
        );
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

function drawWeight(ctx: CanvasRenderingContext2D, pal: FxPalette, w: number, lift: number) {
  const h = 36;
  const path = () => {
    ctx.roundRect(-w / 2, -h / 2, w, h, 6);
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
  ctx.fillStyle = rgba("#fff1d8", 0.3);
  ctx.fillRect(-w / 2 + 8, -h / 2 + 2, w - 16, 3);
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
