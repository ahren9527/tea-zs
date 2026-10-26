/**
 * 第 21 期 B3「按形态」逐帧画布（1080×1920）。
 * 左边蓬松散茶、右边压紧的饼茶，各进各的木格；大字「各占各区」出现时木格带微回弹下沉让位。
 */
import {
  cameraAt,
  cameraKick,
  drawBrushStroke,
  easeInOutCubic,
  easeOutCubic,
  heavyLand,
  lerp,
  lightFloat,
  mixHex,
  progress,
  rgba,
  springValue,
  type FxPalette,
} from "../kit/fx";
import { type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  beginFrame,
  fitSize,
  inkText,
  life,
  renderLayers,
  softShadow,
  textOf,
} from "../kit/draw-kit";
import { drawLooseTea, drawMiyunCake } from "../kit/objects";
import {
  BOX,
  CAKE_AT,
  GRID_AT,
  HERO_AT,
  HERO_POS,
  LEFT_X,
  LENGTH,
  LOOSE_AT,
  PATH_AT,
  RIGHT_X,
  TEXT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.06,
    drift: 5,
    focus: [
      { at: LOOSE_AT - 6, dur: 22, x: 430, y: 980, zoom: 1.05, pull: 0.22 },
      { at: CAKE_AT - 6, dur: 22, x: 650, y: 980, zoom: 1.05, pull: 0.22 },
      { at: HERO_AT - 6, dur: 26, x: 540, y: 860, zoom: 1.0, pull: 0.16 },
    ],
  });
  for (const [at, amp] of [
    [GRID_AT + 8, 3],
    [CAKE_AT + 9, 5],
    [HERO_AT + 2, 4],
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
    subject: (p) => drawSubject(ctx, frame, p, params, fontScale),
  });
}

function drawTwoGridBox(ctx: CanvasRenderingContext2D, pal: FxPalette, x: number, y: number) {
  const { w, h } = BOX;
  const fw = 24;
  const wood = mixHex(pal.tea, "#4d2f1a", 0.35);
  const woodLight = mixHex(pal.tea, "#dbb584", 0.38);
  const woodDark = mixHex(pal.tea, "#1d1008", 0.55);

  ctx.save();
  softShadow(
    ctx,
    () => {
      ctx.roundRect(x - w / 2, y - h / 2, w, h, 12);
    },
    { blur: 34, dx: 16, dy: 24, alpha: 0.3 },
  );

  // 格底（左格浅暖米，右格略温润）
  ctx.fillStyle = mixHex(pal.paper, pal.oat, 0.42);
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 12);
  ctx.fill();

  // 格内四壁内阴影
  for (const gx of [x - w / 2 + fw, x + fw / 2]) {
    const gw = (w - fw * 3) / 2;
    const gy = y - h / 2 + fw;
    const ig = ctx.createLinearGradient(gx, gy, gx, gy + 56);
    ig.addColorStop(0, rgba("#1e1108", 0.2));
    ig.addColorStop(1, rgba("#1e1108", 0));
    ctx.fillStyle = ig;
    ctx.fillRect(gx, gy, gw, 56);
  }

  // 中间竖隔板
  const divG = ctx.createLinearGradient(x - fw / 2, 0, x + fw / 2, 0);
  divG.addColorStop(0, woodLight);
  divG.addColorStop(0.5, wood);
  divG.addColorStop(1, woodDark);
  ctx.fillStyle = divG;
  ctx.fillRect(x - fw / 2, y - h / 2 + fw - 2, fw, h - fw * 2 + 4);

  // 外框
  ctx.lineWidth = fw;
  ctx.strokeStyle = wood;
  ctx.lineJoin = "round";
  ctx.strokeRect(x - w / 2 + fw / 2, y - h / 2 + fw / 2, w - fw, h - fw);

  ctx.strokeStyle = rgba(woodLight, 0.55);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x - w / 2 + fw, y - h / 2 + fw, w - fw * 2, h - fw * 2);
  ctx.restore();
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const gl = frame - GRID_AT;
  if (gl <= 0) return;

  // 大字「各占各区」出来时，木格整体带一点弹簧回弹向下让位 68px
  const boxYield = 68 * springValue(frame - (HERO_AT - 2), { stiffness: 95, damping: 11.5, mass: 1 });
  const boxLand = heavyLand(gl, { drop: 110, fall: 8, squash: 0.035 });
  const boxY = BOX.y + boxLand.y + boxYield;

  ctx.save();
  ctx.globalAlpha = boxLand.alpha;
  ctx.translate(BOX.x, boxY);
  ctx.scale(boxLand.scaleX, boxLand.scaleY);
  ctx.translate(-BOX.x, -boxY);
  drawTwoGridBox(ctx, pal, BOX.x, boxY);

  // 1. 左格：蓬松散茶（从左上轻柔飘入左格）
  const ll = frame - LOOSE_AT;
  if (ll > 0) {
    const inS = springValue(ll, { stiffness: 110, damping: 14, mass: 1 });
    const fl = lightFloat(ll, { rise: 0, sway: 2.5, seed: 11 });
    const lx = lerp(LEFT_X - 140, LEFT_X, inS);
    const ly = lerp(boxY - 260, boxY, inS) + fl.y * 0.4;
    ctx.save();
    ctx.globalAlpha = Math.min(1, ll / 6);
    ctx.translate(lx, ly);
    ctx.scale(0.85 + 0.15 * inS, 0.85 + 0.15 * inS);
    drawLooseTea(ctx, pal, 152, {
      tone: "new",
      seed: 33,
      breathe: Math.sin(frame / 18) * 0.6,
    });
    ctx.restore();
  }

  // 2. 右格：压紧的饼茶（重落进右格）
  const cl = frame - CAKE_AT;
  if (cl > 0) {
    const land = heavyLand(cl, { drop: 210, fall: 9, squash: 0.05 });
    ctx.save();
    ctx.globalAlpha = land.alpha;
    ctx.translate(RIGHT_X, boxY + land.y);
    ctx.rotate(0.06);
    ctx.scale(land.scaleX, land.scaleY);
    drawMiyunCake(ctx, pal, 154, {
      tone: "old",
      lift: Math.min(1, -land.y / 210),
      peel: 0.48,
      peelAngle: -0.65,
      seed: 39,
    });
    ctx.restore();
  }

  // 3. 中间分隔线竹青一笔加固（各走各的道）
  const pl = frame - PATH_AT;
  if (pl > 0) {
    const pp = easeInOutCubic(progress(pl, 0, 22));
    drawBrushStroke(
      ctx,
      [
        { x: BOX.x, y: boxY - BOX.h / 2 - 28 },
        { x: BOX.x - 2, y: boxY },
        { x: BOX.x + 2, y: boxY + BOX.h / 2 + 28 },
      ],
      pp,
      {
        width: 14,
        color: pal.bamboo,
        seed: 51,
        tail: 0.3,
        head: 0.08,
        dry: 0.4,
        dryColor: pal.paper,
      },
    );
  }
  ctx.restore();

  // 4. 散 / 饼 单字提示（在「各占各区」大字落下前显示在各自格子上方，大字落下时退淡，保持同屏单焦点）
  const subA = life(frame, LOOSE_AT + 2, HERO_AT - 8, 10, 10);
  if (subA > 0) {
    const fs = fitSize(t(params, "loose"), 175, 320) * fontScale;
    ctx.save();
    ctx.globalAlpha = subA;
    inkText(
      ctx,
      t(params, "loose"),
      LEFT_X,
      540,
      fs,
      easeOutCubic(progress(frame - LOOSE_AT, 0, 12)),
      61,
      { color: pal.bamboo, weight: 900, font: SONG, wash: 0.025 },
    );
    ctx.restore();
  }
  const cakeSubA = life(frame, CAKE_AT + 4, HERO_AT - 8, 10, 10);
  if (cakeSubA > 0) {
    const fs = fitSize(t(params, "cake"), 175, 320) * fontScale;
    ctx.save();
    ctx.globalAlpha = cakeSubA;
    inkText(
      ctx,
      t(params, "cake"),
      RIGHT_X,
      540,
      fs,
      easeOutCubic(progress(frame - CAKE_AT, 2, 14)),
      63,
      { color: pal.tea, weight: 900, font: SONG, wash: 0.025 },
    );
    ctx.restore();
  }

  // 5. 顶部焦点大字：「各占各区」
  const hl = frame - HERO_AT;
  if (hl > 0) {
    const pose = heavyLand(hl + 2, { drop: 70, fall: 6, squash: 0.05 });
    const fl = lightFloat(hl, { rise: 12, sway: 1, seed: 7 });
    const txt = t(params, "hero");
    const fs = fitSize(txt, HERO_POS.size, 880) * fontScale;
    ctx.save();
    ctx.translate(HERO_POS.x, HERO_POS.y + pose.y + fl.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    inkText(ctx, txt, 0, 0, fs, easeOutCubic(progress(hl, 0, 16)), 77, {
      color: pal.ink,
      weight: 900,
      font: SONG,
      wash: 0.035,
    });
    ctx.restore();
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "蜜韵正");
}
