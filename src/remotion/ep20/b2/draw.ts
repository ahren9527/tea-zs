/**
 * 第 20 期 B2「存」逐帧画布（1080×1920）。导出走这里；Comp.tsx 的预览也直接调用它。
 * A 俯视桌面：棉纸饼落下 → 一角被揭起（别撕）→ 朱砂叉住 → 纸抚平（留着）
 * B 铝箔袋从上滑下套住饼、封口压合；袋面上留一圈虚线示意里面那层棉纸（层次用物讲）
 * C 袋子「侧倒」成侧视，落到屋角的矮架上：竹帘落下挡住窗光（避光）、架腿伸长离地、架子离墙
 * D 镜头推近袋子，暖光像呼吸：转化稳
 * 文字只有大字：棉纸 → 别撕 → 铝箔袋 轮流占同一处；避光 / 离地 / 离墙 三行逐行落下；收尾一个「转化稳」
 */
import {
  TAU,
  breathe,
  cameraAt,
  cameraKick,
  clamp01,
  drawBrushStroke,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  hash01,
  heavyLand,
  jaggedPath,
  lerp,
  lightFloat,
  mixHex,
  progress,
  rgba,
  rng,
  springValue,
  SPRINGS,
  type FxPalette,
  type Pt,
} from "../kit/fx";
import { STAGE, type AnimParams } from "@/remotion/shared/theme";
import {
  SONG,
  allTextsOf,
  beginFrame,
  brushCross,
  brushRing,
  fitSize,
  gapMarker,
  inkText,
  life,
  mixColor,
  renderLayers,
  softShadow,
  textOf,
  tracePoly,
} from "../kit/draw-kit";
import { drawWrappedCake, paperColor } from "../kit/objects";
import {
  BAG,
  BAG_AT,
  BAG_DONE,
  CAKE,
  CAKE_DROP_AT,
  CAKE_FALL,
  CALM_AT,
  CROSS_AT,
  DARK_AT,
  FLOOR_AT,
  HERO,
  KEEP_AT,
  LENGTH,
  PACK,
  PAPER_LABEL_AT,
  PUSH_AT,
  ROOM,
  ROOM_WORDS,
  SEAL_AT,
  SHELF,
  TEAR_AT,
  TEXT,
  TILT_AT,
  TILT_DUR,
  WALL_AT,
  WORDS_OUT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const PEEL_ANGLE = -0.72;

// ---------------- 状态 ----------------
function state(frame: number) {
  const tilt = easeInOutCubic(progress(frame, TILT_AT, TILT_AT + TILT_DUR));
  const room = easeOutCubic(progress(frame, TILT_AT + 4, TILT_AT + TILT_DUR + 10));
  const blind = easeInOutSine(progress(frame, DARK_AT, DARK_AT + 14));
  // 离地：架面从贴地（1400）升到 SHELF.y（弹簧，略过冲）
  const floorP = springValue(frame - FLOOR_AT, { stiffness: 190, damping: 15, mass: 1 });
  // 离墙：从贴墙滑开到 gap
  const wallP = springValue(frame - WALL_AT, { stiffness: 150, damping: 17, mass: 1 });
  const plankTop = lerp(1396, SHELF.y, floorP);
  const right = ROOM.wallX - lerp(6, SHELF.gap, wallP);
  return { tilt, room, blind, floorP, wallP, plankTop, right, left: right - SHELF.w };
}

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.05,
    drift: 6,
    focus: [
      { at: TEAR_AT - 6, dur: 16, x: 680, y: 760, zoom: 1.06, pull: 0.3 },
      { at: BAG_AT - 4, dur: 20, x: 540, y: 900, zoom: 1.0, pull: 0.2 },
      { at: TILT_AT, dur: TILT_DUR + 6, x: 540, y: 990, zoom: 0.97, pull: 0.3 },
      { at: PUSH_AT, dur: 80, x: 700, y: 1150, zoom: 1.6, pull: 0.95 },
    ],
  });
  for (const [at, amp] of [
    [CAKE_DROP_AT + CAKE_FALL, 5],
    [SEAL_AT, 3],
    [FLOOR_AT + 4, 3],
  ] as const) {
    const k = cameraKick(frame - at, amp);
    cam.x -= k.x;
    cam.y -= k.y;
  }
  return cam;
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame, pal, fontScale } = beginFrame(ctx, elapsed, params);
  const st = state(frame);
  const cam = beatCamera(frame);
  renderLayers(ctx, frame, pal, cam, {
    leaves: frame < TILT_AT ? 6 : 3,
    light: 1 - 0.5 * st.blind,
    subject: (p) => drawSubject(ctx, frame, p, params, fontScale, st),
    text: (p) => drawTextBand(ctx, frame, p, params, fontScale),
    over: (p) => {
      // 避光后整体压暗一点（暖暗，不发灰）
      if (st.blind > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = rgba(mixHex(p.paper, "#8a6a4a", 0.5), 0.22 * st.blind);
        ctx.fillRect(0, 0, STAGE.width, STAGE.height);
        ctx.restore();
      }
    },
  });
}

// ---------------- 主体 ----------------
function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
  st: ReturnType<typeof state>,
) {
  if (st.room > 0) drawRoom(ctx, frame, pal, params, fontScale, st);

  // ---- A/B：俯视的饼与袋 ----
  if (st.tilt < 0.75) {
    const fade = 1 - clamp01((st.tilt - 0.55) / 0.2);
    // 侧倒：整体往架子上缩、压扁（像把袋子平放下去，从侧面看）
    const target = { x: st.left + SHELF.w / 2, y: st.plankTop - PACK.h / 2 };
    const sx = lerp(1, PACK.w / BAG.w, st.tilt);
    const sy = lerp(1, (PACK.h * 1.6) / BAG.h, st.tilt);
    const cx = lerp(CAKE.x, target.x, st.tilt);
    const cy = lerp(CAKE.y, target.y, st.tilt);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(cx, cy);
    ctx.scale(sx, sy);
    ctx.translate(-CAKE.x, -CAKE.y);
    drawTopView(ctx, frame, pal);
    ctx.restore();
  }
  // ---- C/D：侧视的袋子 ----
  if (st.tilt > 0.55) {
    const a = clamp01((st.tilt - 0.55) / 0.25);
    const x = st.left + SHELF.w / 2;
    const y = st.plankTop;
    ctx.save();
    ctx.globalAlpha = a;
    // 推近后的「呼吸」暖光
    const calm = clamp01((frame - PUSH_AT) / 40);
    if (calm > 0) {
      const b = 0.75 + 0.25 * breathe(frame, 3.6).w;
      const g = ctx.createRadialGradient(x, y - 40, 10, x, y - 40, 320);
      g.addColorStop(0, rgba(pal.light, 0.32 * calm * b));
      g.addColorStop(1, rgba(pal.light, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - 340, y - 380, 680, 680);
    }
    drawPackSide(ctx, pal, x, y, frame);
    ctx.restore();
    // 转化稳：一圈竹青笔圈稳稳把它圈住
    const rl = frame - (CALM_AT + 4);
    if (rl > 0)
      brushRing(
        ctx,
        x,
        y - PACK.h * 0.55,
        PACK.w * 0.64,
        PACK.h * 1.5,
        easeInOutCubic(progress(rl, 0, 22)),
        pal.bamboo,
        7,
        6,
      );
  }
}

function drawTopView(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette) {
  // 饼
  const land = heavyLand(frame - CAKE_DROP_AT, { drop: 160, fall: CAKE_FALL, squash: 0.045 });
  const peelOpen = easeOutCubic(progress(frame, TEAR_AT, TEAR_AT + 8)) * 0.42;
  const smooth = springValue(frame - KEEP_AT, SPRINGS.heavy);
  const peel = Math.max(0, peelOpen * (1 - Math.min(1, smooth)));
  const bagIn = springValue(frame - BAG_AT, { stiffness: 120, damping: 17, mass: 1.1 });
  const bagY = lerp(CAKE.y - 1500, CAKE.y + 24, Math.min(1.02, bagIn));
  const bagCovers = frame >= BAG_DONE;

  if (land.alpha > 0 && !bagCovers) {
    ctx.save();
    ctx.globalAlpha = land.alpha;
    ctx.translate(CAKE.x, CAKE.y + land.y);
    ctx.scale(land.scaleX, land.scaleY);
    drawWrappedCake(ctx, pal, CAKE.r, {
      lift: clamp01(-land.y / 160),
      peel: peel / 0.42,
      peelAngle: PEEL_ANGLE,
      seed: 5,
    });
    // 揭起的那一角：翻到饼外，纸背面略深，带毛边
    if (peel > 0.01) drawPeelFlap(ctx, pal, peel / 0.42);
    ctx.restore();
  }
  // 朱砂叉：叉在揭起处
  const cl = frame - CROSS_AT;
  if (cl > 0 && frame < BAG_DONE + 6) {
    const k = CAKE.r * 0.78;
    const fade = 1 - clamp01((frame - (BAG_AT + 6)) / 10);
    ctx.save();
    ctx.globalAlpha = fade;
    brushCross(
      ctx,
      CAKE.x + Math.cos(PEEL_ANGLE) * k,
      CAKE.y + Math.sin(PEEL_ANGLE) * k,
      150,
      progress(cl, 0, 9),
      pal.cinnabar,
      21,
      15,
    );
    ctx.restore();
  }
  // 袋子
  if (frame > BAG_AT) {
    const sealP = easeOutCubic(progress(frame, SEAL_AT, SEAL_AT + 8));
    ctx.save();
    ctx.translate(CAKE.x, bagY);
    drawFoilBagTop(ctx, pal, frame, sealP, frame - SEAL_AT);
    ctx.restore();
    // 袋面上一圈虚线：里面那层棉纸
    const dl = frame - (BAG_DONE - 4);
    if (dl > 0) {
      const p = easeInOutCubic(progress(dl, 0, 18));
      ctx.save();
      ctx.setLineDash([14, 11]);
      ctx.lineDashOffset = -frame * 0.6;
      ctx.strokeStyle = rgba(pal.tea, 0.55);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(CAKE.x, CAKE.y, CAKE.r * 0.98, -Math.PI * 0.85, -Math.PI * 0.85 + TAU * p);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/** 揭起翻到饼外的一角棉纸（局部坐标：饼心为原点） */
function drawPeelFlap(ctx: CanvasRenderingContext2D, pal: FxPalette, p: number) {
  const a0 = PEEL_ANGLE - 0.42 * p;
  const a1 = PEEL_ANGLE + 0.42 * p;
  const R = CAKE.r * 1.02;
  const base0 = { x: Math.cos(a0) * R, y: Math.sin(a0) * R };
  const base1 = { x: Math.cos(a1) * R, y: Math.sin(a1) * R };
  // 角尖：沿揭开方向翻出去
  const out = R + CAKE.r * 0.55 * p;
  const tip = { x: Math.cos(PEEL_ANGLE + 0.08) * out, y: Math.sin(PEEL_ANGLE + 0.08) * out };
  const torn0 = jaggedPath(
    [tip, { x: (tip.x + base0.x) / 2, y: (tip.y + base0.y) / 2 }, base0],
    71,
    5,
    9,
  );
  const torn1 = jaggedPath(
    [base1, { x: (tip.x + base1.x) / 2, y: (tip.y + base1.y) / 2 }, tip],
    73,
    5,
    9,
  );
  const poly = [...torn1, ...torn0];
  softShadow(ctx, () => tracePoly(ctx, poly), { blur: 18, dx: 10, dy: 16, alpha: 0.28 });
  ctx.save();
  ctx.beginPath();
  tracePoly(ctx, poly);
  const g = ctx.createLinearGradient(base0.x, base0.y, tip.x, tip.y);
  g.addColorStop(0, mixHex(paperColor(pal), "#b9a688", 0.35));
  g.addColorStop(1, paperColor(pal));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(pal.tea, 0.3);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}

/** 俯视的铝箔袋（原点 = 袋中心）：金属渐变 + 皱褶面 + 饼的鼓包 + 顶部封口条 */
function drawFoilBagTop(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  frame: number,
  sealP: number,
  sealL: number,
) {
  const w = BAG.w;
  const h = BAG.h;
  const outline: Pt[] = [];
  const N = 24;
  // 顺时针：上边 → 右边 → 下边 → 左边，边上微微起伏
  for (let i = 0; i <= N; i++)
    outline.push({ x: -w / 2 + (w * i) / N, y: -h / 2 + Math.sin(i * 1.3) * 1.5 });
  for (let i = 1; i <= N; i++)
    outline.push({ x: w / 2 - Math.sin((i / N) * Math.PI) * 10, y: -h / 2 + (h * i) / N });
  for (let i = 1; i <= N; i++)
    outline.push({ x: w / 2 - (w * i) / N, y: h / 2 - Math.sin((i / N) * Math.PI) * 6 });
  for (let i = 1; i < N; i++)
    outline.push({ x: -w / 2 + Math.sin((i / N) * Math.PI) * 10, y: h / 2 - (h * i) / N });
  softShadow(ctx, () => tracePoly(ctx, outline), { blur: 30, dx: 18, dy: 26, alpha: 0.32 });
  ctx.save();
  ctx.beginPath();
  tracePoly(ctx, outline);
  const base = mixHex("#d8cfc0", pal.oat, 0.3);
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  g.addColorStop(0, mixHex(base, "#ffffff", 0.55));
  g.addColorStop(0.28, base);
  g.addColorStop(0.46, mixHex(base, "#ffffff", 0.4));
  g.addColorStop(0.7, mixHex(base, "#6e655a", 0.35));
  g.addColorStop(1, mixHex(base, "#4a4239", 0.5));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  // 皱褶：细长的折痕，一亮一暗成对
  const r = rng(909);
  ctx.lineCap = "round";
  for (let i = 0; i < 130; i++) {
    const cx = (r() - 0.5) * w;
    const cy = (r() - 0.5) * h;
    const len = 20 + r() * 70;
    const a = r() * TAU;
    const bend = (r() - 0.5) * 16;
    const dx = Math.cos(a) * len;
    const dy = Math.sin(a) * len;
    const k = r();
    ctx.lineWidth = 1 + r() * 1.6;
    ctx.strokeStyle = rgba("#3a3229", 0.05 + 0.08 * k);
    ctx.beginPath();
    ctx.moveTo(cx - dx / 2, cy - dy / 2);
    ctx.quadraticCurveTo(
      cx - Math.sin(a) * bend,
      cy + Math.cos(a) * bend,
      cx + dx / 2,
      cy + dy / 2,
    );
    ctx.stroke();
    ctx.strokeStyle = rgba("#ffffff", 0.1 + 0.18 * k);
    ctx.beginPath();
    ctx.moveTo(cx - dx / 2 - 1.5, cy - dy / 2 - 1.5);
    ctx.quadraticCurveTo(
      cx - Math.sin(a) * bend - 1.5,
      cy + Math.cos(a) * bend - 1.5,
      cx + dx / 2 - 1.5,
      cy + dy / 2 - 1.5,
    );
    ctx.stroke();
  }
  // 饼的鼓包：左上亮边、右下暗边
  const cy0 = -24;
  const R = CAKE.r * 1.02;
  const ring = ctx.createLinearGradient(-R, cy0 - R, R, cy0 + R);
  ring.addColorStop(0, rgba("#ffffff", 0.5));
  ring.addColorStop(0.5, rgba("#ffffff", 0));
  ring.addColorStop(1, rgba("#2e271f", 0.4));
  ctx.strokeStyle = ring;
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(0, cy0, R, 0, TAU);
  ctx.stroke();
  const dome = ctx.createRadialGradient(-R * 0.35, cy0 - R * 0.35, 10, 0, cy0, R);
  dome.addColorStop(0, rgba("#ffffff", 0.22));
  dome.addColorStop(1, rgba("#ffffff", 0));
  ctx.fillStyle = dome;
  ctx.beginPath();
  ctx.arc(0, cy0, R, 0, TAU);
  ctx.fill();
  // 顶部封口条
  const top = -h / 2;
  ctx.fillStyle = rgba("#3a3229", 0.1 + 0.08 * sealP);
  ctx.fillRect(-w / 2, top + 18, w, 54);
  ctx.strokeStyle = rgba("#3a3229", 0.22 + 0.25 * sealP);
  ctx.lineWidth = 1.6;
  for (let x = -w / 2 + 8; x < w / 2; x += 9) {
    ctx.beginPath();
    ctx.moveTo(x, top + 22);
    ctx.lineTo(x, top + 68);
    ctx.stroke();
  }
  // 压合的一下：沿封口条一道亮光扫过
  if (sealL > 0 && sealL < 22) {
    const sx = lerp(-w / 2 - 80, w / 2 + 80, easeInOutSine(sealL / 22));
    const lg = ctx.createLinearGradient(sx - 80, 0, sx + 80, 0);
    lg.addColorStop(0, rgba("#fff6e0", 0));
    lg.addColorStop(0.5, rgba("#fff6e0", 0.75));
    lg.addColorStop(1, rgba("#fff6e0", 0));
    ctx.fillStyle = lg;
    ctx.fillRect(sx - 80, top + 16, 160, 58);
  }
  // 撕口小缺
  ctx.restore();
  ctx.strokeStyle = rgba("#3a3229", 0.3);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  tracePoly(ctx, outline);
  ctx.stroke();
  void frame;
}

/** 侧视的袋子（平放在架面上；x 为中心，y 为架面） */
function drawPackSide(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  x: number,
  y: number,
  frame: number,
) {
  const w = PACK.w;
  const h = PACK.h;
  const path = () => {
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x - w / 2, y - h * 0.34);
    ctx.bezierCurveTo(x - w * 0.34, y - h * 0.5, x - w * 0.3, y - h * 1.02, x, y - h);
    ctx.bezierCurveTo(
      x + w * 0.32,
      y - h * 1.0,
      x + w * 0.44,
      y - h * 0.62,
      x + w / 2,
      y - h * 0.18,
    );
    ctx.lineTo(x + w / 2, y);
    ctx.closePath();
  };
  softShadow(ctx, path, { blur: 14, dx: 12, dy: 4, alpha: 0.35 });
  const base = mixHex("#d8cfc0", pal.oat, 0.3);
  ctx.save();
  ctx.beginPath();
  path();
  const g = ctx.createLinearGradient(0, y - h, 0, y);
  g.addColorStop(0, mixHex(base, "#ffffff", 0.6));
  g.addColorStop(0.35, base);
  g.addColorStop(0.7, mixHex(base, "#ffffff", 0.25));
  g.addColorStop(1, mixHex(base, "#4a4239", 0.5));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  const r = rng(515);
  ctx.lineCap = "round";
  for (let i = 0; i < 34; i++) {
    const cx = x + (r() - 0.5) * w * 0.95;
    const cy = y - (0.15 + r() * 0.7) * h;
    const len = 14 + r() * 40;
    const a = (r() - 0.5) * 1.2;
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = rgba("#3a3229", 0.12);
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(a) * len * 0.5, cy - Math.sin(a) * len * 0.5);
    ctx.lineTo(cx + Math.cos(a) * len * 0.5, cy + Math.sin(a) * len * 0.5);
    ctx.stroke();
    ctx.strokeStyle = rgba("#ffffff", 0.3);
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(a) * len * 0.5, cy - Math.sin(a) * len * 0.5 - 1.5);
    ctx.lineTo(cx + Math.cos(a) * len * 0.5, cy + Math.sin(a) * len * 0.5 - 1.5);
    ctx.stroke();
  }
  // 左端封口条
  ctx.fillStyle = rgba("#3a3229", 0.16);
  ctx.fillRect(x - w / 2, y - h, 26, h);
  ctx.strokeStyle = rgba("#3a3229", 0.3);
  ctx.lineWidth = 1.2;
  for (let yy = y - h * 0.4; yy < y; yy += 6) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2, yy);
    ctx.lineTo(x - w / 2 + 24, yy);
    ctx.stroke();
  }
  ctx.restore();
  void frame;
}

// ---------------- 屋角（侧视） ----------------
function drawRoom(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
  st: ReturnType<typeof state>,
) {
  const a = st.room;
  const F = ROOM.floorY;
  const W = ROOM.wallX;
  ctx.save();
  ctx.globalAlpha = a;
  // 墙（右侧一面墙，略深）+ 踢脚
  const wallG = ctx.createLinearGradient(W, 0, STAGE.width + 60, 0);
  wallG.addColorStop(0, mixHex(pal.paper, pal.oat, 0.55));
  wallG.addColorStop(1, mixHex(pal.paper, pal.tea, 0.18));
  ctx.fillStyle = wallG;
  ctx.fillRect(W, -200, STAGE.width + 200 - W, F + 200);
  ctx.fillStyle = mixHex(pal.oat, pal.tea, 0.35);
  ctx.fillRect(W, F - 34, STAGE.width + 200 - W, 34);
  // 地面（一层淡淡的木色）
  const floorG = ctx.createLinearGradient(0, F, 0, F + 240);
  floorG.addColorStop(0, mixHex(pal.paper, pal.oat, 0.6));
  floorG.addColorStop(1, rgba(pal.paper, 0));
  ctx.fillStyle = floorG;
  ctx.fillRect(-100, F, W + 100, 240);
  ctx.strokeStyle = rgba(pal.tea, 0.12);
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 5; i++) {
    const yy = F + i * i * 9;
    ctx.beginPath();
    ctx.moveTo(-50, yy);
    ctx.lineTo(STAGE.width + 50, yy);
    ctx.stroke();
  }
  // 墙线、地线（毛笔线条）
  drawBrushStroke(
    ctx,
    [
      { x: W, y: 330 },
      { x: W + 2, y: F },
    ],
    easeInOutCubic(progress(a, 0, 0.8)),
    { width: 5, color: pal.ink, seed: 31, tail: 0.1, head: 0.2, alpha: 0.7 },
  );
  drawBrushStroke(
    ctx,
    [
      { x: 30, y: F + 2 },
      { x: W, y: F },
      { x: STAGE.width + 40, y: F - 1 },
    ],
    easeInOutCubic(progress(a, 0.1, 0.9)),
    { width: 5, color: pal.ink, seed: 33, tail: 0.15, head: 0.1, alpha: 0.7 },
  );
  // 窗 + 竹帘
  drawWindow(ctx, frame, pal, st.blind);
  // 窗光落在地上的光斑（竹帘落下就收掉）
  const lit = (1 - st.blind) * a;
  if (lit > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = rgba(pal.light, 0.22 * lit);
    ctx.beginPath();
    ctx.moveTo(ROOM.winX + 120, F + 8);
    ctx.lineTo(ROOM.winX + ROOM.winW + 330, F + 8);
    ctx.lineTo(ROOM.winX + ROOM.winW + 420, F + 120);
    ctx.lineTo(ROOM.winX + 190, F + 120);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // 架子
  drawShelf(ctx, pal, st);
  ctx.restore();

  // ---- 标尺（只跟着当下那个字出现，下一个字落下时退掉）----
  const out = 1 - easeInOutCubic(progress(frame, WORDS_OUT, WORDS_OUT + 16));
  if (out <= 0) return;
  ctx.save();
  ctx.globalAlpha = out;
  {
    const l = frame - FLOOR_AT;
    const fade = 1 - easeInOutCubic(progress(frame, WALL_AT + 2, WALL_AT + 14));
    if (l > 0 && fade > 0) {
      const mx = st.left + SHELF.w * 0.5;
      ctx.save();
      ctx.globalAlpha *= fade;
      gapMarker(
        ctx,
        { x: mx, y: st.plankTop + 26 },
        { x: mx, y: F - 4 },
        easeOutCubic(progress(l, 4, 18)),
        pal.cinnabar,
        41,
        22,
      );
      ctx.restore();
    }
  }
  {
    const l = frame - WALL_AT;
    if (l > 0) {
      const y = st.plankTop - 70;
      gapMarker(
        ctx,
        { x: st.right + 4, y },
        { x: W - 4, y },
        easeOutCubic(progress(l, 6, 20)),
        pal.cinnabar,
        45,
        26,
      );
    }
  }
  ctx.restore();
  void params;
  void fontScale;
}

function drawWindow(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette, blind: number) {
  const { winX: x, winY: y, winW: w, winH: h } = ROOM;
  // 窗洞里的光
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, mixHex(pal.light, "#ffffff", 0.5));
  g.addColorStop(1, mixHex(pal.light, pal.paper, 0.5));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // 远处一枝竹影（随风轻摆）
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const sway = Math.sin(frame / 28) * 6;
  ctx.strokeStyle = rgba(pal.bamboo, 0.28);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.78, y + h + 10);
  ctx.quadraticCurveTo(x + w * 0.74 + sway * 0.5, y + h * 0.5, x + w * 0.62 + sway, y - 10);
  ctx.stroke();
  ctx.fillStyle = rgba(pal.bamboo, 0.24);
  for (let i = 0; i < 7; i++) {
    const py = y + 40 + i * 52;
    const px = x + w * (0.7 - i * 0.012) + sway * (1 - i / 9);
    const dir = i % 2 ? 1 : -1;
    ctx.beginPath();
    ctx.ellipse(px + dir * 34, py, 40, 8, dir * 0.5 + Math.sin(frame / 22 + i) * 0.06, 0, TAU);
    ctx.fill();
  }
  // 竹帘：从上往下放
  if (blind > 0) {
    const bh = h * blind;
    for (let yy = y; yy < y + bh; yy += 9) {
      const k = hash01(Math.round(yy), 3);
      ctx.fillStyle = mixHex(mixHex(pal.oat, pal.bamboo, 0.25), pal.tea, 0.15 + 0.15 * k);
      ctx.fillRect(x, yy, w, 7);
      ctx.fillStyle = rgba("#2a1a0c", 0.25);
      ctx.fillRect(x, yy + 7, w, 2);
    }
    // 两条系绳
    ctx.strokeStyle = rgba(pal.tea, 0.7);
    ctx.lineWidth = 2;
    for (const fx of [0.25, 0.75]) {
      ctx.beginPath();
      ctx.moveTo(x + w * fx, y);
      ctx.lineTo(x + w * fx, y + bh);
      ctx.stroke();
    }
    ctx.fillStyle = mixHex(pal.tea, "#1a0f07", 0.2);
    ctx.fillRect(x - 6, y + bh - 4, w + 12, 10);
  }
  ctx.restore();
  // 窗框 + 窗棂
  const frameCol = mixColor(pal.tea, "#3b2416", 0.3);
  ctx.strokeStyle = frameCol;
  ctx.lineWidth = 14;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 5;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (w * i) / 3, y);
    ctx.lineTo(x + (w * i) / 3, y + h);
    ctx.stroke();
  }
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + (h * i) / 4);
    ctx.lineTo(x + w, y + (h * i) / 4);
    ctx.stroke();
  }
  // 窗台
  ctx.fillStyle = frameCol;
  ctx.fillRect(x - 20, y + h + 4, w + 40, 14);
}

function drawShelf(ctx: CanvasRenderingContext2D, pal: FxPalette, st: ReturnType<typeof state>) {
  const F = ROOM.floorY;
  const top = st.plankTop;
  const th = 24;
  const x0 = st.left;
  const x1 = st.right;
  const woodTop = mixHex(pal.tea, "#d9b07a", 0.35);
  // 腿
  for (const lx of [x0 + 26, x1 - 42]) {
    const g = ctx.createLinearGradient(lx, 0, lx + 16, 0);
    g.addColorStop(0, mixHex(pal.tea, "#d9b07a", 0.2));
    g.addColorStop(1, mixHex(pal.tea, "#1a0f07", 0.3));
    ctx.fillStyle = g;
    ctx.fillRect(lx, top + th - 2, 16, Math.max(0, F - top - th + 2));
  }
  // 地上的影子
  ctx.fillStyle = rgba("#2a1a0c", 0.12 + 0.1 * (1 - st.floorP));
  ctx.beginPath();
  ctx.ellipse((x0 + x1) / 2 + 20, F + 6, SHELF.w * 0.55, 10, 0, 0, TAU);
  ctx.fill();
  // 架板
  const g = ctx.createLinearGradient(0, top, 0, top + th);
  g.addColorStop(0, woodTop);
  g.addColorStop(1, mixHex(pal.tea, "#1a0f07", 0.25));
  ctx.fillStyle = g;
  ctx.fillRect(x0, top, x1 - x0, th);
  ctx.strokeStyle = rgba("#1a0f07", 0.22);
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x0 + 8, top + 6 + i * 6);
    ctx.bezierCurveTo(
      x0 + 140,
      top + 4 + i * 6,
      x1 - 160,
      top + 9 + i * 6,
      x1 - 8,
      top + 6 + i * 6,
    );
    ctx.stroke();
  }
  ctx.fillStyle = rgba("#fff2dc", 0.35);
  ctx.fillRect(x0, top, x1 - x0, 3);
}

// ---------------- 文字带：任一时刻只有一个焦点大字 ----------------
/** 一个焦点大字：轻浮入场、墨晕开；out 之后墨退 */
function heroWord(
  ctx: CanvasRenderingContext2D,
  frame: number,
  txt: string,
  at: number,
  out: number,
  x: number,
  y: number,
  fs: number,
  seed: number,
  color: string,
) {
  const a = life(frame, at, out, 10, 10);
  if (a <= 0) return;
  const l = frame - at;
  const pose = lightFloat(l, { rise: 16, sway: 1, seed });
  ctx.save();
  ctx.globalAlpha = a;
  inkText(ctx, txt, x, y + pose.y, fs, easeOutCubic(progress(l, 0, 14)), seed, {
    color,
    weight: 900,
    font: SONG,
    wash: 0.035,
  });
  ctx.restore();
}

function drawTextBand(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  const size = (k: TextKey, base: number, max: number) =>
    fitSize(t(params, k), base, max) * fontScale;
  // 俯视段：棉纸 → 别撕 → 铝箔袋，同一个位置轮流出现
  heroWord(
    ctx,
    frame,
    t(params, "paper"),
    PAPER_LABEL_AT,
    CROSS_AT - 8,
    HERO.x,
    HERO.y,
    size("paper", HERO.size, 900),
    89,
    pal.ink,
  );
  heroWord(
    ctx,
    frame,
    t(params, "noTear"),
    CROSS_AT,
    BAG_AT + 4,
    HERO.x,
    HERO.y,
    size("noTear", HERO.size + 20, 900),
    91,
    pal.cinnabar,
  );
  heroWord(
    ctx,
    frame,
    t(params, "bag"),
    BAG_DONE - 2,
    TILT_AT - 4,
    HERO.x,
    HERO.y,
    size("bag", HERO.size, 900),
    93,
    pal.ink,
  );

  // 屋角段：避光 / 离地 / 离墙 三行逐行落下，新落下的那行是焦点、前面的退成淡墨
  {
    const out = 1 - easeInOutCubic(progress(frame, WORDS_OUT, WORDS_OUT + 16));
    if (out > 0) {
      const rows: [TextKey, number][] = [
        ["dark", DARK_AT],
        ["floor", FLOOR_AT],
        ["wall", WALL_AT],
      ];
      rows.forEach(([key, at], i) => {
        const l = frame - at;
        if (l <= -2) return;
        const next = rows[i + 1]?.[1];
        const dim = next === undefined ? 0 : easeInOutCubic(progress(frame, next, next + 10));
        const land = heavyLand(l + 2, { drop: 30, fall: 4, squash: 0.08 });
        const txt = t(params, key);
        const fs = fitSize(txt, ROOM_WORDS.size, 520) * fontScale;
        ctx.save();
        ctx.globalAlpha = out * (1 - 0.55 * dim);
        ctx.translate(ROOM_WORDS.x, ROOM_WORDS.y + i * ROOM_WORDS.step + land.y);
        ctx.scale(land.scaleX, land.scaleY);
        inkText(ctx, txt, 0, 0, fs, easeOutCubic(progress(l, 0, 12)), 81 + i * 2, {
          color: pal.ink,
          weight: 900,
          font: SONG,
          wash: 0.03,
        });
        ctx.restore();
      });
    }
  }

  // 收尾：只留一个「转化稳」
  {
    const l = frame - CALM_AT;
    if (l > 0) {
      const txt = t(params, "calm");
      const fs = fitSize(txt, 230, 860) * fontScale;
      const pose = lightFloat(l, { rise: 14, sway: 1.2, seed: 4 });
      inkText(ctx, txt, 560, 640 + pose.y, fs, easeOutCubic(progress(l, 0, 18)), 97, {
        color: pal.ink,
        weight: 900,
        font: SONG,
        wash: 0.035,
      });
    }
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
