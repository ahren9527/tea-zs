/**
 * 第 20 期 B6「醒」逐帧画布（1080×1920）。导出走这里；Comp.tsx 的预览也直接调用它。
 * 茶块浮着（一周量）→ 茶杯凑过来、朱砂一笔拦回（先别急）→ 紫砂罐落下、掀盖、茶块划弧落进罐口、盖子重落 →
 * 暗影从左扫过（避光）→ 昼夜明暗交替、墨笔一天一划（三实四虚：3–7 天）→ 盖子掀开一线、香气升起 → 「干醒」。
 * 文字只用顶部一个焦点位（一次一个大字）+ 最后的竖排「干醒」，没有小字。
 */
import {
  cameraAt,
  cameraKick,
  clamp01,
  drawBrushStroke,
  drawSteam,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  heavyLand,
  lerp,
  lightFloat,
  mixHex,
  progress,
  progressRaw,
  rgba,
  springValue,
  steamWisps,
  type FxPalette,
  type Pt,
} from "../kit/fx";
import { STAGE, type AnimParams } from "@/remotion/shared/theme";
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
  tracePoly,
} from "../kit/draw-kit";
import { centroid, chunkPolygon, paintCakeTexture } from "../kit/cake";
import { drawJar, drawJarLid } from "../kit/objects";
import {
  AROMA_AT,
  CHUNK_AT,
  CHUNK_HOME,
  CUP,
  CUP_AT,
  CUP_OUT,
  DARK_AT,
  DAYS_AT,
  DAY_FRAMES,
  DROP_AT,
  DROP_DUR,
  JAR,
  KEY_WORD,
  JAR_AT,
  KEY_AT,
  KEY_MARK_AT,
  HERO,
  LENGTH,
  LID_CLOSE_AT,
  LID_UP_AT,
  PORTION_AT,
  TALLY,
  TEXT,
  WAIT_AT,
  WAKE_AT,
  type TextKey,
} from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);
const CHUNK = chunkPolygon(-0.42, 0.42, 0.42, 9);
const CHUNK_C = centroid(CHUNK);

function beatCamera(frame: number) {
  const cam = cameraAt(frame, LENGTH, {
    from: 1,
    to: 1.06,
    drift: 6,
    focus: [
      { at: CHUNK_AT, dur: 30, x: CHUNK_HOME.x, y: CHUNK_HOME.y + 60, zoom: 1.06, pull: 0.25 },
      { at: JAR_AT - 6, dur: 24, x: JAR.x, y: 1060, zoom: 1.0, pull: 0.25 },
      { at: DAYS_AT - 4, dur: 20, x: JAR.x, y: 940, zoom: 0.98, pull: 0.2 },
      { at: AROMA_AT, dur: 40, x: JAR.x, y: JAR.base - JAR.h - 80, zoom: 1.08, pull: 0.3 },
      { at: KEY_AT - 6, dur: 30, x: JAR.x, y: 980, zoom: 1.03, pull: 0.2 },
    ],
  });
  for (const [at, amp] of [
    [JAR_AT + 9, 4],
    [LID_CLOSE_AT + 5, 5],
  ] as const) {
    const k = cameraKick(frame - at, amp);
    cam.x -= k.x;
    cam.y -= k.y;
  }
  return cam;
}

/** 避光 + 昼夜交替的暗度（0..1） */
function darkness(frame: number) {
  const dark = easeInOutSine(progress(frame, DARK_AT, DARK_AT + 16));
  const cycle = frame - DAYS_AT;
  const dayLen = DAY_FRAMES * 7 + 6;
  const day =
    cycle > 0 && cycle < dayLen ? 0.18 * Math.sin((cycle / DAY_FRAMES) * Math.PI) ** 2 : 0;
  const wake = easeInOutSine(progress(frame, WAKE_AT, WAKE_AT + 30));
  return clamp01(dark * (0.55 + day) * (1 - 0.55 * wake));
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame, pal, fontScale } = beginFrame(ctx, elapsed, params);
  const cam = beatCamera(frame);
  const dk = darkness(frame);
  renderLayers(ctx, frame, pal, cam, {
    leaves: 4,
    light: 1 - 0.75 * dk,
    subject: (p) => drawSubject(ctx, frame, p, params, fontScale, dk),
    text: (p) => drawTextBand(ctx, frame, p, params, fontScale),
    over: (p) => {
      if (dk <= 0) return;
      // 暗影从左往右扫过来（扫完后整面压暗）
      const sweep = easeInOutCubic(progress(frame, DARK_AT, DARK_AT + 16));
      const edge = lerp(-400, STAGE.width + 400, sweep);
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      const g = ctx.createLinearGradient(edge - 380, 0, edge + 20, 0);
      const col = mixHex(p.paper, "#6e5136", 0.55);
      g.addColorStop(0, rgba(col, 0.5 * dk));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, STAGE.width, STAGE.height);
      ctx.restore();
    },
  });
}

// ---------------- 主体 ----------------
function chunkPose(frame: number) {
  const l = frame - CHUNK_AT;
  const fl = lightFloat(l, { rise: 60, sway: 6, seed: 3 });
  let x = CHUNK_HOME.x;
  let y = CHUNK_HOME.y + fl.y;
  let rot = -0.3 + fl.rot * 3;
  let scale = CHUNK_HOME.scale;
  const mv = easeInOutCubic(progress(frame, DROP_AT, DROP_AT + DROP_DUR));
  const mouth = { x: JAR.x, y: JAR.base - JAR.h - 30 };
  if (mv > 0) {
    // 往上抛一点的弧线，落向罐口
    const cx = (x + mouth.x) / 2 + 40;
    const cy = Math.min(y, mouth.y) - 220;
    const u = mv;
    x = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * cx + u * u * mouth.x;
    y = (1 - u) * (1 - u) * y + 2 * (1 - u) * u * cy + u * u * mouth.y;
    rot = lerp(rot, -1.4, mv);
    scale = lerp(scale, 0.5, mv);
  }
  // 落进罐里
  const sink = easeInOutCubic(progress(frame, DROP_AT + DROP_DUR - 2, DROP_AT + DROP_DUR + 8));
  y += 150 * sink;
  return { x, y, rot, scale, alpha: fl.alpha, sinking: sink > 0 || mv > 0.92, hidden: sink >= 1 };
}

function drawChunk(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  c: ReturnType<typeof chunkPose>,
  lift: number,
) {
  ctx.save();
  ctx.globalAlpha *= c.alpha;
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rot);
  ctx.scale(c.scale, c.scale);
  ctx.translate(-CHUNK_C.x, -CHUNK_C.y);
  softShadow(ctx, () => tracePoly(ctx, CHUNK), {
    blur: 20 + 30 * lift,
    dx: 18 + 40 * lift,
    dy: 30 + 60 * lift,
    alpha: 0.32 - 0.12 * lift,
  });
  ctx.save();
  ctx.beginPath();
  tracePoly(ctx, CHUNK);
  ctx.clip();
  paintCakeTexture(ctx, pal);
  ctx.fillStyle = rgba(pal.light, 0.08);
  ctx.fillRect(-400, -400, 800, 800);
  ctx.restore();
  ctx.strokeStyle = rgba(pal.oat, 0.45);
  ctx.lineWidth = 2;
  ctx.beginPath();
  tracePoly(ctx, CHUNK);
  ctx.stroke();
  ctx.restore();
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
  dk: number,
) {
  const mouthY = JAR.base - JAR.h;
  // ---- 茶杯（凑过来又退开） ----
  drawCupStory(ctx, frame, pal);

  // ---- 罐 ----
  const jl = frame - JAR_AT;
  let lidLift = 0;
  let lidX = 0;
  let lidRot = 0;
  if (jl > 0) {
    // 盖子：掀起 → 悬着 → 重落 → 醒时掀开一线
    const up = springValue(frame - LID_UP_AT, { stiffness: 90, damping: 13, mass: 1 });
    const closeL = frame - LID_CLOSE_AT;
    const down = closeL > 0 ? heavyLand(closeL, { drop: 1, fall: 5, squash: 0.1 }) : null;
    const k = down ? 1 - clamp01(closeL / 5) ** 2 : 1;
    lidLift = 190 * up * k;
    lidX = 120 * up * k;
    lidRot = 0.32 * up * k;
    if (down && closeL >= 5) lidLift = -down.y * 120; // 落定后的小回弹
    const wake = easeOutCubic(progress(frame, WAKE_AT, WAKE_AT + 16));
    if (wake > 0) {
      const f = lightFloat(frame - WAKE_AT, { rise: 0, sway: 3, seed: 5 });
      lidLift += 34 * wake + f.y;
      lidX += -12 * wake;
      lidRot += -0.12 * wake;
    }
    const pose = heavyLand(jl, { drop: 140, fall: 9, squash: 0.04 });
    ctx.save();
    ctx.globalAlpha = pose.alpha;
    ctx.translate(JAR.x, JAR.base + pose.y);
    ctx.scale(pose.scaleX, pose.scaleY);
    const glow = easeOutCubic(progress(frame, AROMA_AT - 6, AROMA_AT + 20));
    drawJar(ctx, pal, { h: JAR.h, lid: false, glow, seed: 6 });
    ctx.restore();
  }

  // ---- 茶块（落进罐口时只画罐口以上的部分）----
  const c = chunkPose(frame);
  if (!c.hidden && frame > CHUNK_AT) {
    ctx.save();
    if (c.sinking) {
      ctx.beginPath();
      ctx.rect(0, 0, STAGE.width, mouthY + 4);
      ctx.clip();
    }
    const lift = frame < DROP_AT ? 1 : 0.6;
    drawChunk(ctx, pal, c, lift);
    ctx.restore();
  }
  // ---- 盖子 ----
  if (jl > 0) {
    const pose = heavyLand(jl, { drop: 140, fall: 9, squash: 0.04 });
    ctx.save();
    ctx.globalAlpha = pose.alpha;
    ctx.translate(JAR.x + lidX, JAR.base + pose.y);
    drawJarLid(ctx, pal, JAR.h, lidLift, lidRot);
    ctx.restore();
  }

  // ---- 香气 ----
  const al = frame - AROMA_AT;
  if (al > 0) {
    const s = easeOutCubic(progress(al, 0, 24));
    drawSteam(
      ctx,
      steamWisps(frame, 5, { x: JAR.x - 10, y: mouthY - 40, w: 130 }, 11, 560),
      mixHex(pal.oat, pal.tea, 0.35),
      1.4 * s,
    );
    // 三缕香：毛笔细线，S 形往上长，长完慢慢上飘、变淡（循环）
    for (let k = 0; k < 3; k++) {
      const period = 54;
      const local = (al + k * 18) % period;
      const cycleN = Math.floor((al + k * 18) / period);
      const grow = easeOutCubic(progressRaw(local, 0, 26));
      const fade = 1 - progressRaw(local, 30, period); // 循环动画：不放慢
      const x0 = JAR.x - 50 + k * 50;
      const y0 = mouthY - 60 - local * 1.6;
      const amp = 22 + 6 * k;
      const pts: Pt[] = [];
      for (let i = 0; i <= 16; i++) {
        const u = i / 16;
        pts.push({ x: x0 + Math.sin(u * Math.PI * 1.6 + k + cycleN) * amp * u, y: y0 - u * 230 });
      }
      ctx.save();
      ctx.globalAlpha = s * fade * 0.55;
      drawBrushStroke(ctx, pts, grow, {
        width: 4,
        color: mixHex(pal.tea, pal.oat, 0.35),
        seed: 190 + k,
        tail: 0.6,
        head: 0.2,
      });
      ctx.restore();
    }
    drawSteam(
      ctx,
      steamWisps(frame + 40, 3, { x: JAR.x + 20, y: mouthY - 50, w: 80 }, 17, 460),
      mixHex(pal.light, "#ffffff", 0.2),
      1.2 * s,
    );
  }

  // ---- 一天一划：三实四虚 ----
  const dl = frame - DAYS_AT;
  const tallyOut = 1 - easeInOutCubic(progress(frame, AROMA_AT + 10, AROMA_AT + 26));
  if (dl > 0 && tallyOut > 0) {
    ctx.save();
    ctx.globalAlpha = tallyOut;
    for (let i = 0; i < 7; i++) {
      const p = easeOutCubic(progress(dl, i * DAY_FRAMES, i * DAY_FRAMES + 6));
      if (p <= 0) continue;
      const x = TALLY.x0 + i * TALLY.step;
      const solid = i < 3;
      drawBrushStroke(
        ctx,
        [
          { x: x + 4, y: TALLY.y - 56 },
          { x: x - 2, y: TALLY.y },
          { x: x + 3, y: TALLY.y + 56 },
        ],
        p,
        {
          width: solid ? 13 : 8,
          color: solid ? pal.ink : pal.bamboo,
          seed: 140 + i,
          tail: 0.35,
          alpha: solid ? 0.9 : 0.6,
          dry: solid ? 0.4 : 0.8,
          dryColor: pal.paper,
        },
      );
    }
    // 3–7 之间的朱砂托线
    const bp = easeInOutCubic(progress(dl, 2 * DAY_FRAMES, 7 * DAY_FRAMES));
    drawBrushStroke(
      ctx,
      [
        { x: TALLY.x0 + 2 * TALLY.step - 10, y: TALLY.y + 84 },
        { x: TALLY.x0 + 4.5 * TALLY.step, y: TALLY.y + 92 },
        { x: TALLY.x0 + 6 * TALLY.step + 14, y: TALLY.y + 84 },
      ],
      bp,
      { width: 6, color: pal.cinnabar, seed: 150, tail: 0.3 },
    );
    ctx.restore();
  }
  void dk;
  void fontScale;
  void params;
}

/** 茶杯（侧视，毛笔勾线），凑过来 → 朱砂一笔挡住 → 退开 */
function drawCupStory(ctx: CanvasRenderingContext2D, frame: number, pal: FxPalette) {
  const l = frame - CUP_AT;
  if (l <= 0) return;
  const inS = springValue(l, { stiffness: 150, damping: 15, mass: 1 });
  const outP = easeInOutCubic(progress(frame, CUP_OUT, CUP_OUT + 14));
  if (outP >= 1) return;
  const x = CUP.x + (1 - inS) * 300 + outP * 360;
  const y = CUP.y;
  ctx.save();
  ctx.globalAlpha = 1 - outP;
  ctx.translate(x, y);
  ctx.rotate(-0.06 * inS);
  // 杯身
  const w = 150;
  const h = 110;
  const body = () => {
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2);
    ctx.bezierCurveTo(w / 2, h * 0.1, w * 0.3, h / 2, 0, h / 2);
    ctx.bezierCurveTo(-w * 0.3, h / 2, -w / 2, h * 0.1, -w / 2, -h / 2);
    ctx.closePath();
  };
  softShadow(ctx, body, { blur: 18, dx: 14, dy: 16, alpha: 0.25 });
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, mixHex(pal.rice, "#ffffff", 0.5));
  g.addColorStop(0.6, pal.rice);
  g.addColorStop(1, mixHex(pal.rice, pal.tea, 0.3));
  ctx.fillStyle = g;
  ctx.beginPath();
  body();
  ctx.fill();
  // 杯口茶汤
  ctx.fillStyle = mixHex("#c9a25a", pal.tea, 0.25);
  ctx.beginPath();
  ctx.ellipse(0, -h / 2, w / 2 - 6, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba(pal.tea, 0.7);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -h / 2, w / 2, 14, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  body();
  ctx.stroke();
  // 竹青一圈杯纹
  ctx.strokeStyle = rgba(pal.bamboo, 0.6);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 4, -h * 0.18);
  ctx.quadraticCurveTo(0, -h * 0.1, w / 2 - 4, -h * 0.18);
  ctx.stroke();
  ctx.restore();
  // 朱砂一笔：挡在杯子和茶块之间
  const wl = frame - WAIT_AT;
  if (wl > 0) {
    const pts: Pt[] = [
      { x: CUP.x - 150, y: CUP.y - 170 },
      { x: CUP.x - 162, y: CUP.y },
      { x: CUP.x - 150, y: CUP.y + 150 },
    ];
    ctx.save();
    ctx.globalAlpha = 1 - outP;
    drawBrushStroke(ctx, pts, easeOutCubic(progress(wl, 0, 7)), {
      width: 16,
      color: pal.cinnabar,
      seed: 160,
      tail: 0.3,
      jitter: 0.3,
    });
    ctx.restore();
  }
}

// ---------------- 文字带 ----------------
/** 顶部焦点位的一行大字（横排），退场在 out 开始、按放慢后的时长淡完 */
function heroWord(
  ctx: CanvasRenderingContext2D,
  frame: number,
  txt: string,
  at: number,
  out: number,
  size: number,
  seed: number,
  color: string,
  fontScale: number,
) {
  const a = life(frame, at, out, 12, OUT_DUR);
  if (a <= 0) return;
  const fs = fitSize(txt, size, 820) * fontScale;
  const pose = lightFloat(frame - at, { rise: 12, sway: 1, seed });
  ctx.save();
  ctx.globalAlpha = a;
  inkText(ctx, txt, HERO.x, HERO.y + pose.y, fs, easeOutCubic(progress(frame - at, 0, 14)), seed, {
    color,
    weight: 900,
    font: SONG,
    wash: 0.03,
  });
  ctx.restore();
}

/** 大字退场帧数（放慢前）；下一个大字到来前 OUT_LEAD 帧就开始退，保证同一时刻只有一个 */
const OUT_DUR = 10;
const OUT_LEAD = Math.round(OUT_DUR * 1.3) + 1;

function drawTextBand(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  // 顶部焦点位：一周量 → 先别急 → 避光 → 3–7天，前一个退掉下一个才来
  heroWord(
    ctx,
    frame,
    t(params, "portion"),
    PORTION_AT,
    WAIT_AT - OUT_LEAD,
    HERO.size,
    171,
    pal.ink,
    fontScale,
  );
  heroWord(
    ctx,
    frame,
    t(params, "wait"),
    WAIT_AT,
    CUP_OUT + 4,
    HERO.size + 10,
    173,
    pal.cinnabar,
    fontScale,
  );
  heroWord(
    ctx,
    frame,
    t(params, "dark"),
    DARK_AT,
    DAYS_AT - OUT_LEAD,
    HERO.size + 10,
    177,
    pal.ink,
    fontScale,
  );
  // 3–7 天（数字和「天」都是大字，整组居中）
  {
    const at = DAYS_AT;
    const a = life(frame, at, AROMA_AT + 14, 12, 14);
    if (a > 0) {
      const num = t(params, "daysNum");
      const unit = t(params, "daysUnit");
      const fs = fitSize(num, 230, 560, 0.62) * fontScale;
      const ufs = Math.max(150, fs * 0.8);
      const nw = Array.from(num).length * fs * 0.6;
      const uw = Array.from(unit).length * ufs;
      const gap = 24;
      const x0 = HERO.x - (nw + gap + uw) / 2;
      const pose = lightFloat(frame - at, { rise: 12, sway: 1, seed: 7 });
      ctx.save();
      ctx.globalAlpha = a;
      inkText(
        ctx,
        num,
        x0 + nw / 2,
        HERO.y + 10 + pose.y,
        fs,
        easeOutCubic(progress(frame - at, 0, 14)),
        179,
        {
          color: pal.ink,
          weight: 900,
          font: SONG,
          wash: 0.03,
        },
      );
      inkText(
        ctx,
        unit,
        x0 + nw + gap + uw / 2,
        HERO.y + 10 + fs * 0.06 + pose.y,
        ufs,
        easeOutCubic(progress(frame - at, 6, 18)),
        181,
        { color: pal.ink, weight: 900, font: SONG },
      );
      ctx.restore();
    }
  }
  // 干醒（竖排大字，左侧）；说到「少不了」时旁边一道朱砂竖笔，不加字
  {
    const l = frame - KEY_AT;
    if (l > 0) {
      const txt = t(params, "key");
      const fs = fitSize(txt, 250, 600, 1.06) * fontScale;
      const pose = lightFloat(l, { rise: 16, sway: 1.2, seed: 9 });
      inkText(
        ctx,
        txt,
        KEY_WORD.x,
        KEY_WORD.y + pose.y,
        fs,
        easeOutCubic(progress(l, 0, 18)),
        183,
        {
          color: pal.ink,
          weight: 900,
          font: SONG,
          vertical: true,
          wash: 0.035,
        },
      );
      const ml = frame - KEY_MARK_AT;
      if (ml > 0) {
        const n = Math.max(1, Array.from(txt).length);
        const half = ((n - 1) * fs * 1.06) / 2 + fs * 0.45;
        const x = KEY_WORD.x + fs * 0.62 + 20;
        drawBrushStroke(
          ctx,
          [
            { x: x + 4, y: KEY_WORD.y - half + pose.y },
            { x: x - 4, y: KEY_WORD.y + pose.y },
            { x: x + 2, y: KEY_WORD.y + half + pose.y },
          ],
          easeOutCubic(progress(ml, 0, 16)),
          { width: 14, color: pal.cinnabar, seed: 186, tail: 0.4, jitter: 0.25 },
        );
      }
    }
  }
}

export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params, "0123456789–");
}
