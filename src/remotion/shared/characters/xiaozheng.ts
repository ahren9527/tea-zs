/**
 * 正上茶舍 IP 角色「小正」（纯代码绘制，各期共用）。
 *
 *   drawXiaozheng(ctx, height, state)   原点 = 两脚中间的地面点，height = 头顶到脚底的像素高
 *   xiaozhengIdle(frame, seed)          这一帧的眨眼 / 呼吸值，直接展开进 state
 *
 * 形象依据：attachments/角色设定卡.png、attachments/小正-三视图.png、attachments/小正-表情表.png
 * （光头圆脑袋约占身高 35%、细弯眉、豆豆眼、淡红脸颊、米色立领短袄七分袖宽卷边、茶褐七分裤卷边、棕色圆头布鞋）。
 * 设计坐标：总高 1000，脚底 y = 0，头顶 y = -1000，x 向右为正（画面左右）。
 *
 * view：front 正面（全部姿势）、side 侧面朝画面右（站 / 走，flip 朝左）、back 背面。
 * 状态全部是数，可逐帧插值；纯函数、确定性，同样的参数永远画出同一帧。
 */

export type XzView = "front" | "side" | "back";
export type XzPose = "stand" | "holdCup" | "touchHead" | "straighten" | "wave";
export type XzExpr =
  | "smile"
  | "calm"
  | "happy"
  | "sip"
  | "curious"
  | "think"
  | "surprised"
  | "shy"
  | "sleepy"
  | "awkward";

export type XzState = {
  view?: XzView;
  /** 正面姿势；侧面 / 背面忽略 */
  pose?: XzPose;
  poseTo?: XzPose;
  poseMix?: number;
  expr?: XzExpr;
  blink?: number;
  breath?: number;
  tilt?: number;
  look?: { x: number; y: number };
  /** 摸头来回（配合 touchHead）、挥手来回（配合 wave），让它随时间增长 */
  rub?: number;
  /** 侧面走路相位：每 +1 走一整步（两脚各迈一次）；不传 = 站着 */
  walk?: number;
  flip?: boolean;
  tea?: boolean;
  lineScale?: number;
};

export const XZ_COLORS = {
  skin: "#fad8bc",
  skinShade: "#f0c4a3",
  blush: "#f3a58c",
  jacket: "#e8d6bf",
  jacketShade: "#d3bb9e",
  pants: "#876042",
  pantsShade: "#6c4b32",
  shoe: "#956b49",
  shoeShade: "#734f33",
  line: "#8b6650",
  brow: "#b48562",
  eye: "#2d2320",
  cup: "#f9f5ee",
  tea: "#c4924f",
  green: "#6f7d4c",
  red: "#b8352a",
} as const;

const C = XZ_COLORS;
const TAU = Math.PI * 2;
const HY = -826; // 头部中心
const HRX = 160;
const HRY = 174;
const NECK_Y = -646;

type P = [number, number];
type PoseDef = { la: [P, P, P]; ra: [P, P, P]; cup: P | null; cupAlpha?: number; headDy: number; over: "l" | "r" | "" };

const SH_L: P = [-98, -596];
const SH_R: P = [98, -596];

const POSES: Record<XzPose, PoseDef> = {
  stand: { la: [SH_L, [-150, -478], [-188, -360]], ra: [SH_R, [150, -478], [188, -360]], cup: null, headDy: 0, over: "" },
  holdCup: { la: [SH_L, [-150, -470], [-62, -478]], ra: [SH_R, [150, -470], [62, -478]], cup: [0, -508], headDy: 0, over: "" },
  touchHead: { la: [SH_L, [-210, -700], [-118, -930]], ra: [SH_R, [150, -478], [188, -360]], cup: null, headDy: 0, over: "l" },
  straighten: { la: [SH_L, [-152, -440], [-64, -404]], ra: [SH_R, [152, -440], [64, -404]], cup: [0, -428], headDy: 16, over: "" },
  wave: { la: [SH_L, [-150, -478], [-188, -360]], ra: [SH_R, [214, -640], [236, -800]], cup: null, headDy: 0, over: "" },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lp = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function mixPose(a: PoseDef, b: PoseDef, t: number): PoseDef {
  if (t <= 0) return { ...a, cupAlpha: a.cup ? 1 : 0 };
  if (t >= 1) return { ...b, cupAlpha: b.cup ? 1 : 0 };
  const arc = Math.sin(t * Math.PI);
  const arm = (x: [P, P, P], y: [P, P, P], side: number): [P, P, P] => {
    const e = lp(x[1], y[1], t);
    const h = lp(x[2], y[2], t);
    const lift = Math.abs(x[2][1] - y[2][1]) > 200 ? arc : 0;
    return [x[0], [e[0] + side * 40 * lift, e[1]], [h[0] + side * 80 * lift, h[1]]];
  };
  const la = arm(a.la, b.la, -1);
  const ra = arm(a.ra, b.ra, 1);
  let cup: P | null = null;
  let cupAlpha = 0;
  const ref = a.cup ? a : b.cup ? b : null;
  if (ref && ref.cup) {
    const off = ref.cup[1] - (ref.la[2][1] + ref.ra[2][1]) / 2;
    const gap = Math.hypot(ra[2][0] - la[2][0], ra[2][1] - la[2][1]);
    cupAlpha = clamp01((200 - gap) / 50);
    if (cupAlpha > 0) cup = [(la[2][0] + ra[2][0]) / 2, (la[2][1] + ra[2][1]) / 2 + off];
  }
  return { la, ra, cup, cupAlpha, headDy: lerp(a.headDy, b.headDy, t), over: t < 0.5 ? a.over : b.over };
}

/**
 * 这一帧的待机小动作（眨眼 + 呼吸），按帧号算，确定性。
 * 约每 2.6–4 秒眨一次眼（每次约 6 帧），呼吸周期约 3.2 秒。seed 区分同屏多个小正。
 */
export function xiaozhengIdle(frame: number, seed = 0, fps = 29.97): { blink: number; breath: number } {
  const t = frame / fps;
  const breath = (Math.sin((t / 3.2) * TAU + seed) + 1) / 2;
  let blink = 0;
  const period = 3.3;
  const k = Math.floor(t / period);
  for (const i of [k - 1, k]) {
    const r = Math.sin((i + 1) * 91.7 + seed * 13.1) * 43758.5453;
    const at = i * period + 0.4 + (r - Math.floor(r)) * 2.2;
    const d = (t - at) * fps;
    if (d >= 0 && d < 6) blink = Math.max(blink, Math.sin((d / 6) * Math.PI));
  }
  return { blink, breath };
}

export function drawXiaozheng(ctx: CanvasRenderingContext2D, height: number, state: XzState = {}) {
  const { view = "front", flip = false, lineScale = 1 } = state;
  const s = height / 1000;
  ctx.save();
  ctx.scale(flip ? -s : s, s);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const LW = 3.6 * lineScale;
  // 地面柔影
  ctx.fillStyle = "rgba(90,60,35,0.12)";
  ctx.beginPath();
  ctx.ellipse(0, -3, view === "side" ? 130 : 160, 20, 0, 0, TAU);
  ctx.fill();
  if (view === "side") drawSide(ctx, LW, state);
  else if (view === "back") drawBack(ctx, LW, state);
  else drawFront(ctx, LW, state);
  ctx.restore();
}

// ================================================================ 正面

function drawFront(ctx: CanvasRenderingContext2D, LW: number, st: XzState) {
  const { pose = "stand", poseTo, poseMix = 0, expr = "smile", blink = 0, breath = 0, tilt = 0, look = { x: 0, y: 0 }, rub = 0, flip = false, tea = true } = st;
  const base = POSES[pose];
  let pz: PoseDef = poseTo ? mixPose(base, POSES[poseTo], clamp01(poseMix)) : { ...base, cupAlpha: base.cup ? 1 : 0 };
  // 摸头：手在头顶来回；挥手：小臂左右摆
  const osc = Math.sin(rub * TAU);
  const settled = !poseTo || poseMix >= 1 ? 1 : 0;
  const curPose = !poseTo || poseMix < 0.5 ? pose : poseTo;
  if (curPose === "touchHead" && settled) {
    const a = pz.la;
    pz = { ...pz, la: [a[0], a[1], [a[2][0] + osc * 16, a[2][1] + Math.abs(osc) * 6]] };
  }
  if (curPose === "wave" && settled) {
    const a = pz.ra;
    pz = { ...pz, ra: [a[0], a[1], [a[2][0] + osc * 34, a[2][1] + Math.abs(osc) * 8]] };
  }
  const lift = (breath - 0.5) * 8;

  drawLegsFront(ctx, LW, false);
  ctx.save();
  ctx.translate(0, -lift);
  drawTorsoFront(ctx, LW, false);
  if (pz.over !== "l") drawArm(ctx, pz.la, -1, LW, !!pz.cup && (pz.cupAlpha ?? 0) > 0.5);
  if (pz.over !== "r") drawArm(ctx, pz.ra, 1, LW, !!pz.cup && (pz.cupAlpha ?? 0) > 0.5);
  drawCollar(ctx, LW, false);
  ctx.restore();

  ctx.save();
  ctx.translate(0, -lift * 1.3 + pz.headDy);
  ctx.translate(0, NECK_Y);
  ctx.rotate(tilt * (flip ? -1 : 1));
  ctx.translate(0, -NECK_Y);
  drawHeadFront(ctx, LW, expr, blink, flip ? { x: -look.x, y: look.y } : look, pz.headDy > 6);
  ctx.restore();

  ctx.save();
  ctx.translate(0, -lift);
  if (pz.over === "l") drawArm(ctx, pz.la, -1, LW, false);
  if (pz.over === "r") drawArm(ctx, pz.ra, 1, LW, false);
  if (pz.cup) {
    const a = pz.cupAlpha ?? 1;
    ctx.save();
    ctx.globalAlpha *= a;
    drawCup(ctx, pz.cup, LW, tea);
    ctx.restore();
    if (a > 0.5) {
      drawHand(ctx, pz.la[2], -1, LW, "cup", 0);
      drawHand(ctx, pz.ra[2], 1, LW, "cup", 0);
    }
  }
  ctx.restore();
}

function fillStroke(ctx: CanvasRenderingContext2D, fill: string, lw: number, stroke: string = C.line) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function shoeFront(ctx: CanvasRenderingContext2D, x0: number, lw: number, back: boolean) {
  ctx.beginPath();
  ctx.moveTo(x0 - 54, -8);
  ctx.bezierCurveTo(x0 - 60, -44, x0 - 38, -74, x0, -74);
  ctx.bezierCurveTo(x0 + 38, -74, x0 + 60, -44, x0 + 54, -8);
  ctx.quadraticCurveTo(x0 + 52, 0, x0 + 40, 0);
  ctx.lineTo(x0 - 40, 0);
  ctx.quadraticCurveTo(x0 - 52, 0, x0 - 54, -8);
  ctx.closePath();
  fillStroke(ctx, C.shoe, lw);
  if (!back) {
    ctx.beginPath();
    ctx.ellipse(x0, -62, 30, 10, 0, Math.PI, TAU);
    ctx.fillStyle = C.shoeShade;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(x0 - 50, -10);
  ctx.quadraticCurveTo(x0, -4, x0 + 50, -10);
  ctx.lineWidth = lw * 1.3;
  ctx.strokeStyle = C.shoeShade;
  ctx.stroke();
}

function drawLegsFront(ctx: CanvasRenderingContext2D, lw: number, back: boolean) {
  for (const sd of [-1, 1]) {
    const x0 = sd * 58;
    ctx.beginPath();
    ctx.roundRect(x0 - 28, -118, 56, 70, 10);
    fillStroke(ctx, C.skin, lw);
    shoeFront(ctx, x0, lw, back);
  }
  for (const sd of [-1, 1]) {
    // 裤腿：宽松，向下略收
    ctx.beginPath();
    ctx.moveTo(0, -352);
    ctx.lineTo(sd * 124, -352);
    ctx.quadraticCurveTo(sd * 128, -240, sd * 118, -150);
    ctx.lineTo(sd * 6, -150);
    ctx.closePath();
    fillStroke(ctx, C.pants, lw);
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = C.pantsShade;
    ctx.beginPath();
    ctx.moveTo(sd * 3, -320);
    ctx.lineTo(sd * 22, -320);
    ctx.lineTo(sd * 26, -152);
    ctx.lineTo(sd * 6, -152);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // 宽卷边
    ctx.beginPath();
    ctx.roundRect(sd > 0 ? 2 : -124, -164, 122, 58, 12);
    fillStroke(ctx, C.pants, lw);
    ctx.beginPath();
    ctx.moveTo(sd * 8, -138);
    ctx.lineTo(sd * 118, -140);
    ctx.lineWidth = lw * 0.8;
    ctx.strokeStyle = C.pantsShade;
    ctx.stroke();
  }
}

function torsoPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(-40, -640);
  ctx.quadraticCurveTo(-86, -630, -102, -596);
  ctx.quadraticCurveTo(-120, -480, -122, -410);
  ctx.lineTo(-128, -336);
  ctx.quadraticCurveTo(0, -324, 128, -336);
  ctx.lineTo(122, -410);
  ctx.quadraticCurveTo(120, -480, 102, -596);
  ctx.quadraticCurveTo(86, -630, 40, -640);
  ctx.closePath();
}

function linen(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  ctx.strokeStyle = "rgba(150,120,90,0.07)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let y = y0; y < y1; y += 8) {
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y + 2);
  }
  for (let x = x0; x < x1; x += 8) {
    ctx.moveTo(x, y0);
    ctx.lineTo(x + 2, y1);
  }
  ctx.stroke();
}

function drawTorsoFront(ctx: CanvasRenderingContext2D, lw: number, back: boolean) {
  torsoPath(ctx);
  ctx.fillStyle = C.jacket;
  ctx.fill();
  ctx.save();
  torsoPath(ctx);
  ctx.clip();
  linen(ctx, -140, -650, 140, -320);
  ctx.fillStyle = C.jacketShade;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(78, -600);
  ctx.quadraticCurveTo(112, -480, 114, -330);
  ctx.lineTo(150, -330);
  ctx.lineTo(150, -620);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.3;
  ctx.fillRect(-150, -356, 300, 40);
  ctx.restore();
  torsoPath(ctx);
  ctx.lineWidth = lw;
  ctx.strokeStyle = C.line;
  ctx.stroke();
  // 两侧开衩
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * 116, -340);
    ctx.lineTo(sd * 112, -382);
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();
  }
  if (back) return;
  // 门襟 + 盘扣
  ctx.beginPath();
  ctx.moveTo(-4, -630);
  ctx.lineTo(-4, -540);
  ctx.lineWidth = lw * 0.8;
  ctx.stroke();
  for (const y of [-608, -578, -550]) {
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.lineTo(12, y);
    ctx.lineWidth = lw * 0.9;
    ctx.strokeStyle = C.jacketShade;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-4, y, 5, 0, TAU);
    ctx.fillStyle = C.jacketShade;
    ctx.fill();
    ctx.lineWidth = lw * 0.6;
    ctx.strokeStyle = C.line;
    ctx.stroke();
  }
}

function drawCollar(ctx: CanvasRenderingContext2D, lw: number, back: boolean) {
  ctx.beginPath();
  ctx.roundRect(-26, -672, 52, 40, 8);
  ctx.fillStyle = C.skinShade;
  ctx.fill();
  if (back) {
    ctx.beginPath();
    ctx.moveTo(-50, -626);
    ctx.lineTo(-48, -654);
    ctx.quadraticCurveTo(0, -664, 48, -654);
    ctx.lineTo(50, -626);
    ctx.quadraticCurveTo(0, -616, -50, -626);
    ctx.closePath();
    fillStroke(ctx, C.jacket, lw * 0.9);
    return;
  }
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * 5, -626);
    ctx.lineTo(sd * 5, -656);
    ctx.quadraticCurveTo(sd * 30, -666, sd * 54, -654);
    ctx.lineTo(sd * 58, -628);
    ctx.quadraticCurveTo(sd * 30, -618, sd * 5, -626);
    ctx.closePath();
    fillStroke(ctx, C.jacket, lw * 0.9);
  }
}

/** 七分袖（粗管 + 宽卷边）+ 小臂 + 手 */
function drawArm(ctx: CanvasRenderingContext2D, a: [P, P, P], side: number, lw: number, holding: boolean) {
  const [sh, el, hd] = a;
  const dx = el[0] - hd[0];
  const dy = el[1] - hd[1];
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const cuff: P = [hd[0] + ux * Math.min(d * 0.62, 78), hd[1] + uy * Math.min(d * 0.62, 78)];
  // 小臂
  ctx.beginPath();
  ctx.moveTo(cuff[0] - ux * 12, cuff[1] - uy * 12);
  ctx.lineTo(hd[0] + ux * 18, hd[1] + uy * 18);
  ctx.lineWidth = 40 + lw * 2;
  ctx.strokeStyle = C.line;
  ctx.stroke();
  ctx.lineWidth = 40;
  ctx.strokeStyle = C.skin;
  ctx.stroke();
  // 袖管
  const tube = (w: number, color: string) => {
    ctx.beginPath();
    ctx.moveTo(sh[0], sh[1]);
    ctx.quadraticCurveTo(el[0], el[1], cuff[0], cuff[1]);
    ctx.lineWidth = w;
    ctx.strokeStyle = color;
    ctx.stroke();
  };
  tube(70 + lw * 2, C.line);
  tube(70, C.jacket);
  // 宽卷边：袖口张开一圈
  const ang = Math.atan2(cuff[1] - el[1], cuff[0] - el[0]);
  ctx.save();
  ctx.translate(cuff[0], cuff[1]);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(-18, -42);
  ctx.lineTo(14, -46);
  ctx.quadraticCurveTo(20, 0, 14, 46);
  ctx.lineTo(-18, 42);
  ctx.quadraticCurveTo(-22, 0, -18, -42);
  ctx.closePath();
  fillStroke(ctx, C.jacketShade, lw);
  ctx.restore();
  if (!holding) drawHand(ctx, hd, side, lw, "open", Math.atan2(-uy, -ux));
}

/** 手：open 张开的小手（指向 dir 方向），cup 贴在杯侧 */
function drawHand(ctx: CanvasRenderingContext2D, h: P, side: number, lw: number, kind: "open" | "cup", dir: number) {
  ctx.save();
  ctx.translate(h[0], h[1]);
  if (kind === "cup") {
    ctx.beginPath();
    ctx.ellipse(0, 6, 30, 34, 0, 0, TAU);
    fillStroke(ctx, C.skin, lw);
    ctx.beginPath();
    ctx.moveTo(-side * 6, -22);
    ctx.quadraticCurveTo(-side * 26, -34, -side * 32, -18);
    ctx.lineWidth = lw * 0.8;
    ctx.strokeStyle = C.line;
    ctx.stroke();
    for (const y of [4, 18]) {
      ctx.beginPath();
      ctx.moveTo(-side * 28, y);
      ctx.lineTo(-side * 14, y + 2);
      ctx.lineWidth = lw * 0.6;
      ctx.stroke();
    }
  } else {
    ctx.rotate(dir - Math.PI / 2);
    // 圆圆的小手（四指并拢、向 +y），拇指贴在内侧
    ctx.beginPath();
    ctx.moveTo(-21, -8);
    ctx.quadraticCurveTo(-25, 24, -10, 34);
    ctx.quadraticCurveTo(4, 40, 16, 30);
    ctx.quadraticCurveTo(24, 16, 21, -8);
    ctx.quadraticCurveTo(0, -18, -21, -8);
    ctx.closePath();
    fillStroke(ctx, C.skin, lw);
    const th = -side;
    ctx.beginPath();
    ctx.moveTo(th * 14, 0);
    ctx.quadraticCurveTo(th * 24, 10, th * 16, 20);
    ctx.lineWidth = lw * 0.7;
    ctx.strokeStyle = C.line;
    ctx.stroke();
  }
  ctx.restore();
}

function drawCup(ctx: CanvasRenderingContext2D, c: P, lw: number, tea: boolean) {
  ctx.save();
  ctx.translate(c[0], c[1]);
  ctx.scale(1.2, 1.2);
  ctx.beginPath();
  ctx.moveTo(-56, -26);
  ctx.bezierCurveTo(-54, 12, -30, 30, -20, 32);
  ctx.lineTo(20, 32);
  ctx.bezierCurveTo(30, 30, 54, 12, 56, -26);
  ctx.closePath();
  fillStroke(ctx, C.cup, lw);
  ctx.beginPath();
  ctx.moveTo(26, -20);
  ctx.quadraticCurveTo(48, -8, 22, 28);
  ctx.strokeStyle = "rgba(160,130,100,0.25)";
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-20, 30, 40, 9, 3);
  fillStroke(ctx, C.cup, lw * 0.8);
  ctx.beginPath();
  ctx.ellipse(0, -26, 56, 12, 0, 0, TAU);
  fillStroke(ctx, C.cup, lw);
  if (tea) {
    ctx.beginPath();
    ctx.ellipse(0, -24, 46, 8, 0, 0, TAU);
    ctx.fillStyle = C.tea;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-14, -26, 12, 2.5, 0, 0, TAU);
    ctx.fillStyle = "rgba(255,240,210,0.6)";
    ctx.fill();
  }
  ctx.restore();
}

function headPath(ctx: CanvasRenderingContext2D, cx = 0) {
  ctx.beginPath();
  ctx.moveTo(cx, HY - HRY);
  ctx.bezierCurveTo(cx + HRX * 0.6, HY - HRY, cx + HRX, HY - HRY * 0.56, cx + HRX, HY + 4);
  ctx.bezierCurveTo(cx + HRX, HY + HRY * 0.62, cx + HRX * 0.6, HY + HRY, cx, HY + HRY);
  ctx.bezierCurveTo(cx - HRX * 0.6, HY + HRY, cx - HRX, HY + HRY * 0.62, cx - HRX, HY + 4);
  ctx.bezierCurveTo(cx - HRX, HY - HRY * 0.56, cx - HRX * 0.6, HY - HRY, cx, HY - HRY);
  ctx.closePath();
}

function ear(ctx: CanvasRenderingContext2D, x: number, sd: number, lw: number) {
  ctx.beginPath();
  ctx.ellipse(x, HY + 76, 30, 40, sd * 0.15, 0, TAU);
  fillStroke(ctx, C.skin, lw);
  ctx.beginPath();
  ctx.arc(x + sd * 2, HY + 80, 16, sd > 0 ? -1.3 : Math.PI - 1.8, sd > 0 ? 1.8 : Math.PI + 1.3);
  ctx.lineWidth = lw * 0.7;
  ctx.strokeStyle = C.line;
  ctx.stroke();
}

/** 头的上色：平涂 + 右下暗面 + 头顶右上一小块高光（照表情表） */
function shadeHead(ctx: CanvasRenderingContext2D, lw: number, cx = 0) {
  headPath(ctx, cx);
  ctx.fillStyle = C.skin;
  ctx.fill();
  ctx.save();
  headPath(ctx, cx);
  ctx.clip();
  ctx.fillStyle = C.skinShade;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(cx - 24, HY - 20, HRX + 14, HRY + 16, 0, 0, TAU);
  ctx.rect(cx + 220, HY - 240, -440, 480);
  ctx.fill("evenodd");
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255,248,240,0.55)";
  ctx.beginPath();
  ctx.ellipse(cx + 66, HY - 128, 15, 9, -0.5, 0, TAU);
  ctx.fill();
  ctx.restore();
  headPath(ctx, cx);
  ctx.lineWidth = lw;
  ctx.strokeStyle = C.line;
  ctx.stroke();
}

function blushAt(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, rx = 40, ry = 26) {
  const g = ctx.createRadialGradient(x, y, 2, x, y, rx);
  g.addColorStop(0, `rgba(243,150,128,${a})`);
  g.addColorStop(1, "rgba(243,150,128,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
}

function drawHeadFront(ctx: CanvasRenderingContext2D, lw: number, expr: XzExpr, blink: number, look: { x: number; y: number }, lookDown: boolean) {
  for (const sd of [-1, 1]) ear(ctx, sd * (HRX + 8), sd, lw);
  shadeHead(ctx, lw);

  const blushA = expr === "shy" ? 0.8 : expr === "happy" ? 0.6 : 0.5;
  for (const sd of [-1, 1]) blushAt(ctx, sd * 98, HY + 96, blushA);

  // 眉：细、淡、高
  const lift = expr === "curious" || expr === "surprised" ? 12 : 0;
  for (const sd of [-1, 1]) {
    let l = lift;
    let inner = 0; // 眉头抬（为难）
    if (expr === "think" && sd > 0) l += 8;
    if (expr === "awkward") inner = sd < 0 ? 14 : 4;
    if (expr === "sleepy" || expr === "sip") l -= 3;
    ctx.beginPath();
    ctx.moveTo(sd * 36, HY + 2 - l - inner);
    ctx.quadraticCurveTo(sd * 62, HY - 14 - l - inner * 0.6, sd * 92, HY - 2 - l);
    ctx.lineWidth = lw * 1.25;
    ctx.strokeStyle = C.brow;
    ctx.stroke();
  }

  // 眼
  const ex = 62;
  const ey = HY + 64;
  const lx = look.x * 9;
  const ly = (lookDown || expr === "shy" ? 5 : 0) + look.y * 8;
  for (const sd of [-1, 1]) {
    const x = sd * ex + lx;
    const y = ey + ly;
    ctx.strokeStyle = C.eye;
    if (expr === "happy" || expr === "sip") {
      // ∩ 弯弯闭眼，外眼角一根小睫毛
      ctx.beginPath();
      ctx.moveTo(x - 16, y + 5);
      ctx.quadraticCurveTo(x, y - 12, x + 16, y + 5);
      ctx.lineWidth = lw * 1.3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + sd * 16, y + 5);
      ctx.lineTo(x + sd * 22, y + 2);
      ctx.lineWidth = lw * 0.8;
      ctx.stroke();
      continue;
    }
    const big = expr === "surprised" ? 1.12 : expr === "curious" ? 1.06 : 1;
    const lid = expr === "sleepy" ? 0.55 : 0; // 上眼皮盖住的比例
    const open = (1 - clamp01(blink)) * (1 - lid);
    const ry = 17 * big;
    const rx = 13 * big;
    if (open < 0.18) {
      ctx.beginPath();
      ctx.moveTo(x - 14, y + 2);
      ctx.quadraticCurveTo(x, y + 8, x + 14, y + 2);
      ctx.lineWidth = lw * 1.2;
      ctx.stroke();
      continue;
    }
    const top = y + ry - 2 * ry * open; // 眼皮下沿
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 30, top, 60, 60);
    ctx.clip();
    if (expr === "surprised" || expr === "curious") {
      ctx.beginPath();
      ctx.ellipse(x, y, rx + 6, ry + 5, 0, 0, TAU);
      ctx.fillStyle = "#fffaf4";
      ctx.fill();
      ctx.lineWidth = lw * 0.7;
      ctx.strokeStyle = C.line;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fillStyle = C.eye;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 4 + lx * 0.2, y - ry * 0.42, 4.6, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
    if (lid > 0 || open < 0.95) {
      ctx.beginPath();
      ctx.moveTo(x - rx - 3, top + 2);
      ctx.quadraticCurveTo(x, top - 3, x + rx + 3, top + 2);
      ctx.lineWidth = lw * 1.3;
      ctx.strokeStyle = C.eye;
      ctx.stroke();
    }
  }

  // 鼻：一点
  ctx.beginPath();
  ctx.ellipse(0, HY + 92, 6, 4, 0, 0, TAU);
  ctx.fillStyle = "rgba(230,160,130,0.55)";
  ctx.fill();

  // 嘴
  const my = HY + 122;
  ctx.lineWidth = lw * 1.05;
  ctx.strokeStyle = C.line;
  ctx.beginPath();
  switch (expr) {
    case "happy":
      ctx.moveTo(-26, my - 6);
      ctx.quadraticCurveTo(0, my - 2, 26, my - 6);
      ctx.quadraticCurveTo(22, my + 24, 0, my + 24);
      ctx.quadraticCurveTo(-22, my + 24, -26, my - 6);
      ctx.closePath();
      ctx.fillStyle = "#b9524a";
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, my + 15, 11, 6, 0, 0, TAU);
      ctx.fillStyle = "#e5857a";
      ctx.fill();
      break;
    case "surprised":
    case "curious": {
      const r = expr === "surprised" ? 9 : 7;
      ctx.ellipse(0, my + 2, r * 0.8, r, 0, 0, TAU);
      ctx.fillStyle = "#b9524a";
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "calm":
    case "think":
      ctx.moveTo(-14 + (expr === "think" ? 6 : 0), my);
      ctx.quadraticCurveTo(0, my + (expr === "think" ? 0 : 3), 14 + (expr === "think" ? 4 : 0), my);
      ctx.stroke();
      break;
    case "awkward":
      ctx.moveTo(-18, my + 2);
      ctx.quadraticCurveTo(-9, my - 3, 0, my + 1);
      ctx.quadraticCurveTo(9, my + 4, 18, my - 1);
      ctx.stroke();
      break;
    default:
      ctx.moveTo(-22, my - 4);
      ctx.quadraticCurveTo(0, my + 12, 22, my - 4);
      ctx.stroke();
  }
}

// ================================================================ 背面

function drawBack(ctx: CanvasRenderingContext2D, LW: number, st: XzState) {
  const { breath = 0, tilt = 0, flip = false } = st;
  const lift = (breath - 0.5) * 8;
  drawLegsFront(ctx, LW, true);
  ctx.save();
  ctx.translate(0, -lift);
  drawTorsoFront(ctx, LW, true);
  const pz = POSES.stand;
  drawArm(ctx, pz.la, -1, LW, false);
  drawArm(ctx, pz.ra, 1, LW, false);
  drawCollar(ctx, LW, true);
  ctx.restore();
  ctx.save();
  ctx.translate(0, -lift * 1.3 + NECK_Y);
  ctx.rotate(tilt * (flip ? -1 : 1));
  ctx.translate(0, -NECK_Y);
  for (const sd of [-1, 1]) ear(ctx, sd * (HRX + 4), sd, LW);
  shadeHead(ctx, LW);
  ctx.restore();
}

// ================================================================ 侧面（朝画面右）

function drawSide(ctx: CanvasRenderingContext2D, LW: number, st: XzState) {
  const { expr = "smile", blink = 0, breath = 0, tilt = 0, walk, look = { x: 0, y: 0 } } = st;
  const walking = walk !== undefined;
  const ph = walking ? (walk as number) * TAU : 0;
  const swing = walking ? Math.sin(ph) : 0;
  const bob = walking ? Math.abs(Math.cos(ph)) * 10 : 0;
  const lift = (breath - 0.5) * 8 + bob;

  // 远侧腿 → 远侧胳膊 → 身体 → 近侧腿 → 近侧胳膊 → 头
  const leg = (sw: number, far: boolean) => {
    const hip: P = [0, -330];
    const ang = sw * 0.24;
    ctx.save();
    ctx.translate(hip[0], hip[1] - lift * 0.3);
    ctx.rotate(-ang);
    ctx.translate(-hip[0], -hip[1]);
    // 脚踝 + 鞋（朝右）
    ctx.beginPath();
    ctx.roundRect(-24, -118, 48, 70, 10);
    fillStroke(ctx, far ? C.skinShade : C.skin, LW);
    ctx.beginPath();
    ctx.moveTo(-42, -8);
    ctx.bezierCurveTo(-48, -50, -30, -72, 0, -72);
    ctx.bezierCurveTo(40, -70, 84, -44, 86, -14);
    ctx.quadraticCurveTo(86, 0, 70, 0);
    ctx.lineTo(-30, 0);
    ctx.quadraticCurveTo(-42, 0, -42, -8);
    ctx.closePath();
    fillStroke(ctx, far ? C.shoeShade : C.shoe, LW);
    ctx.beginPath();
    ctx.moveTo(-38, -10);
    ctx.lineTo(80, -10);
    ctx.lineWidth = LW * 1.2;
    ctx.strokeStyle = C.shoeShade;
    ctx.stroke();
    // 裤腿
    ctx.beginPath();
    ctx.moveTo(-84, -340);
    ctx.lineTo(84, -340);
    ctx.quadraticCurveTo(88, -240, 70, -150);
    ctx.lineTo(-66, -150);
    ctx.quadraticCurveTo(-82, -250, -84, -340);
    ctx.closePath();
    fillStroke(ctx, far ? C.pantsShade : C.pants, LW);
    ctx.beginPath();
    ctx.roundRect(-72, -164, 148, 58, 12);
    fillStroke(ctx, far ? C.pantsShade : C.pants, LW);
    ctx.restore();
  };
  const sideArm = (sw: number, far: boolean) => {
    const sh: P = [0, -590];
    const ang = -sw * 0.38;
    ctx.save();
    ctx.translate(sh[0], sh[1] - lift);
    ctx.rotate(ang);
    // 袖
    ctx.beginPath();
    ctx.moveTo(-36, -10);
    ctx.quadraticCurveTo(-46, 90, -40, 150);
    ctx.lineTo(40, 158);
    ctx.quadraticCurveTo(44, 80, 36, -10);
    ctx.closePath();
    fillStroke(ctx, far ? C.jacketShade : C.jacket, LW);
    // 小臂 + 手
    ctx.beginPath();
    ctx.roundRect(-20, 150, 40, 70, 16);
    fillStroke(ctx, C.skin, LW);
    ctx.beginPath();
    ctx.ellipse(2, 232, 24, 30, 0, 0, TAU);
    fillStroke(ctx, C.skin, LW);
    ctx.beginPath();
    ctx.moveTo(18, 214);
    ctx.quadraticCurveTo(30, 230, 20, 244);
    ctx.lineWidth = LW * 0.7;
    ctx.stroke();
    // 卷边
    ctx.beginPath();
    ctx.moveTo(-46, 128);
    ctx.lineTo(46, 134);
    ctx.quadraticCurveTo(50, 158, 44, 176);
    ctx.lineTo(-46, 170);
    ctx.quadraticCurveTo(-52, 150, -46, 128);
    ctx.closePath();
    fillStroke(ctx, C.jacketShade, LW);
    ctx.restore();
  };

  leg(-swing, true);
  sideArm(-swing, true);
  leg(swing, false);
  // 身体（侧面：背直、肚子微微鼓）
  ctx.save();
  ctx.translate(0, -lift);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-40, -640);
    ctx.quadraticCurveTo(-88, -620, -92, -560);
    ctx.quadraticCurveTo(-98, -440, -100, -336);
    ctx.quadraticCurveTo(0, -326, 110, -336);
    ctx.quadraticCurveTo(116, -460, 92, -566);
    ctx.quadraticCurveTo(76, -630, 34, -640);
    ctx.closePath();
  };
  body();
  ctx.fillStyle = C.jacket;
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  linen(ctx, -100, -650, 110, -320);
  ctx.restore();
  body();
  ctx.lineWidth = LW;
  ctx.strokeStyle = C.line;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-80, -340);
  ctx.lineTo(-76, -380);
  ctx.lineWidth = LW * 0.8;
  ctx.stroke();
  // 立领（侧）+ 前襟扣
  ctx.beginPath();
  ctx.roundRect(-10, -672, 40, 40, 8);
  ctx.fillStyle = C.skinShade;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-40, -630);
  ctx.lineTo(-36, -656);
  ctx.quadraticCurveTo(10, -664, 52, -652);
  ctx.lineTo(54, -628);
  ctx.quadraticCurveTo(10, -620, -40, -630);
  ctx.closePath();
  fillStroke(ctx, C.jacket, LW * 0.9);
  ctx.beginPath();
  ctx.arc(76, -596, 5, 0, TAU);
  ctx.fillStyle = C.jacketShade;
  ctx.fill();
  ctx.lineWidth = LW * 0.6;
  ctx.stroke();
  ctx.restore();
  sideArm(swing, false);

  // 头（侧面：脸朝右，耳朵偏后）
  ctx.save();
  ctx.translate(0, -lift * 1.3 + NECK_Y);
  ctx.rotate(tilt);
  ctx.translate(0, -NECK_Y);
  const cx = 6;
  shadeHead(ctx, LW, cx);
  // 鼻尖小凸起：在轮廓右侧补一笔
  ctx.beginPath();
  ctx.arc(cx + 136, HY + 90, 9, 0, TAU);
  ctx.fillStyle = C.skin;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 136, HY + 90, 9, -1.1, 1.4);
  ctx.lineWidth = LW;
  ctx.strokeStyle = C.line;
  ctx.stroke();
  ear(ctx, cx - 10, -1, LW);
  blushAt(ctx, cx + 78, HY + 100, expr === "shy" ? 0.8 : 0.5, 34, 24);
  // 眉
  ctx.beginPath();
  ctx.moveTo(cx + 82, HY + 2);
  ctx.quadraticCurveTo(cx + 104, HY - 12, cx + 126, HY - 4);
  ctx.lineWidth = LW * 1.25;
  ctx.strokeStyle = C.brow;
  ctx.stroke();
  // 眼（侧面竖椭圆，略窄）
  const x = cx + 108 + look.x * 4;
  const y = HY + 64 + look.y * 6;
  ctx.strokeStyle = C.eye;
  if (expr === "happy" || expr === "sip" || blink > 0.82) {
    ctx.beginPath();
    ctx.moveTo(x - 10, y + (blink > 0.82 && !(expr === "happy" || expr === "sip") ? 2 : 5));
    ctx.quadraticCurveTo(x, y + (blink > 0.82 && !(expr === "happy" || expr === "sip") ? 7 : -10), x + 10, y + 4);
    ctx.lineWidth = LW * 1.3;
    ctx.stroke();
  } else {
    const ry = 16 * (1 - clamp01(blink)) * (expr === "sleepy" ? 0.5 : 1);
    ctx.beginPath();
    ctx.ellipse(x, y + (16 - ry) * 0.6, 9.5, Math.max(ry, 2), 0, 0, TAU);
    ctx.fillStyle = C.eye;
    ctx.fill();
    if (ry > 8) {
      ctx.beginPath();
      ctx.arc(x - 2, y - ry * 0.4, 3.6, 0, TAU);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
  }
  // 嘴
  ctx.beginPath();
  if (expr === "happy") {
    ctx.moveTo(cx + 92, HY + 116);
    ctx.quadraticCurveTo(cx + 104, HY + 138, cx + 116, HY + 114);
    ctx.closePath();
    ctx.fillStyle = "#b9524a";
    ctx.fill();
  } else if (expr === "surprised" || expr === "curious") {
    ctx.ellipse(cx + 108, HY + 122, 4, 6, 0, 0, TAU);
    ctx.fillStyle = "#b9524a";
    ctx.fill();
  } else {
    ctx.moveTo(cx + 96, HY + 118);
    ctx.quadraticCurveTo(cx + 106, HY + 126, cx + 116, HY + 114);
  }
  ctx.lineWidth = LW;
  ctx.strokeStyle = C.line;
  ctx.stroke();
  ctx.restore();
}
