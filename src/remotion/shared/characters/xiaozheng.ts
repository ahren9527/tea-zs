/**
 * 正上茶舍 IP 角色「小正」（正面，纯代码绘制，各期共用）。
 *
 *   drawXiaozheng(ctx, height, state)   原点 = 两脚中间的地面点，height = 头顶到脚底的像素高
 *   xiaozhengIdle(frame, seed)          给出这一帧的眨眼 / 呼吸值，直接展开进 state
 *
 * 形象依据：attachments/角色设定卡.png（光头圆脑袋、细弯眉、豆豆眼、淡红脸颊、米色立领盘扣短袄、
 * 茶褐七分裤卷边、棕色布鞋，约两头身半）。配色只用设定卡五色及其明暗。
 * 设计坐标：总高 1000，脚底 y = 0，头顶 y = -1000，x 向右为正（画面左右，不是角色左右）。
 *
 * 状态全部是数值，可逐帧插值：
 * - pose / poseTo / poseMix：在两个姿势之间过渡（0 = pose，1 = poseTo）
 * - expr：表情；blink 0..1 眨眼；breath 0..1 呼吸相位；tilt 歪头（弧度，正 = 向画面右）
 * - look：眼珠偏移（-1..1）；rub：摸头动作的来回（0..1，配合 touchHead）
 * - flip：左右镜像（让他朝另一边）
 * 纯函数、确定性，不读时间、不读随机数；同样的参数永远画出同一帧。
 */

export type XzPose = "stand" | "holdCup" | "touchHead" | "straighten" | "wave";
export type XzExpr = "smile" | "calm" | "happy" | "sip" | "curious" | "think" | "surprised" | "shy";

export type XzState = {
  pose?: XzPose;
  poseTo?: XzPose;
  poseMix?: number;
  expr?: XzExpr;
  blink?: number;
  breath?: number;
  tilt?: number;
  look?: { x: number; y: number };
  rub?: number;
  flip?: boolean;
  /** 茶杯里是否有茶（默认 true） */
  tea?: boolean;
  /** 线条粗细倍数（远景小人可调 1.3 左右保持线条可见） */
  lineScale?: number;
};

/** 设定卡五色 + 明暗档 */
export const XZ_COLORS = {
  skin: "#fcdbc1",
  skinShade: "#f2c3a3",
  blush: "#f4a996",
  jacket: "#e6d5bf",
  jacketShade: "#cfb699",
  pants: "#8c6646",
  pantsShade: "#6f4f35",
  shoe: "#9b7049",
  shoeShade: "#7a5435",
  line: "#7d5640",
  eye: "#2e2420",
  cup: "#f9f5ee",
  tea: "#c4924f",
  green: "#6f7d4c",
  red: "#b8352a",
} as const;

const C = XZ_COLORS;
const TAU = Math.PI * 2;

type P = [number, number];
type PoseDef = {
  /** 画面左臂（x < 0）：肩 / 肘 / 手 */
  la: [P, P, P];
  /** 画面右臂（x > 0） */
  ra: [P, P, P];
  /** 茶杯中心；没有就是 null */
  cup: P | null;
  /** 头部额外位移与身体前倾（straighten 时低头） */
  headDy: number;
  /** 茶杯不透明度（姿势过渡时用，默认 1） */
  cupAlpha?: number;
  /** 哪只手举过头顶（要画在头前面）："l" | "r" | "" */
  over: "l" | "r" | "";
};

const SH_L: P = [-92, -648];
const SH_R: P = [92, -648];

const POSES: Record<XzPose, PoseDef> = {
  stand: { la: [SH_L, [-122, -530], [-118, -420]], ra: [SH_R, [122, -530], [118, -420]], cup: null, headDy: 0, over: "" },
  holdCup: { la: [SH_L, [-130, -520], [-58, -548]], ra: [SH_R, [130, -520], [58, -548]], cup: [0, -580], headDy: 0, over: "" },
  touchHead: { la: [SH_L, [-196, -740], [-112, -912]], ra: [SH_R, [122, -530], [118, -420]], cup: null, headDy: 0, over: "l" },
  straighten: { la: [SH_L, [-136, -500], [-60, -452]], ra: [SH_R, [136, -500], [60, -452]], cup: [0, -476], headDy: 14, over: "" },
  wave: { la: [SH_L, [-122, -530], [-118, -420]], ra: [SH_R, [196, -700], [214, -840]], cup: null, headDy: 0, over: "" },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lp = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function mixPose(a: PoseDef, b: PoseDef, t: number): PoseDef {
  if (t <= 0) return a;
  if (t >= 1) return b;
  // 举手的那只手在过渡中途绕出去，不要直线穿过脸
  const arc = Math.sin(t * Math.PI);
  const arm = (x: [P, P, P], y: [P, P, P], side: number): [P, P, P] => {
    const e = lp(x[1], y[1], t);
    const h = lp(x[2], y[2], t);
    const lift = Math.abs(x[2][1] - y[2][1]) > 200 ? arc : 0;
    return [x[0], [e[0] + side * 40 * lift, e[1]], [h[0] + side * 70 * lift, h[1]]];
  };
  const la = arm(a.la, b.la, -1);
  const ra = arm(a.ra, b.ra, 1);
  // 茶杯跟着两只手走：两手靠拢时才出现（拿起 / 放下的过程淡入淡出）
  let cup: P | null = null;
  let cupAlpha = 0;
  const ref = a.cup ? a : b.cup ? b : null;
  if (ref && ref.cup) {
    const off = ref.cup[1] - (ref.la[2][1] + ref.ra[2][1]) / 2;
    const gap = Math.hypot(ra[2][0] - la[2][0], ra[2][1] - la[2][1]);
    cupAlpha = clamp01((190 - gap) / 50);
    if (cupAlpha > 0) cup = [(la[2][0] + ra[2][0]) / 2, (la[2][1] + ra[2][1]) / 2 + off];
  }
  return {
    cupAlpha,
    la,
    ra,
    cup,
    headDy: lerp(a.headDy, b.headDy, t),
    over: t < 0.5 ? a.over : b.over,
  };
}

/**
 * 这一帧的待机小动作（眨眼 + 呼吸），按帧号算，确定性。
 * 约每 2.6–4 秒眨一次眼（每次约 6 帧），呼吸周期约 3.2 秒。seed 区分同屏多个小正。
 */
export function xiaozhengIdle(frame: number, seed = 0, fps = 29.97): { blink: number; breath: number } {
  const t = frame / fps;
  const breath = (Math.sin((t / 3.2) * TAU + seed) + 1) / 2;
  // 眨眼时刻：按区间伪随机排开
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
  const {
    pose = "stand",
    poseTo,
    poseMix = 0,
    expr = "smile",
    blink = 0,
    breath = 0,
    tilt = 0,
    look = { x: 0, y: 0 },
    rub = 0,
    flip = false,
    tea = true,
    lineScale = 1,
  } = state;
  const base = POSES[pose];
  const P0 = poseTo ? mixPose(base, POSES[poseTo], clamp01(poseMix)) : base;
  const s = height / 1000;
  const LW = 4.2 * lineScale;

  // 摸头：手在头顶小幅来回
  const rubbing = P0.over ? Math.sin(rub * TAU) : 0;
  const pz: PoseDef = P0.over
    ? {
        ...P0,
        [P0.over === "l" ? "la" : "ra"]: (() => {
          const a = P0.over === "l" ? P0.la : P0.ra;
          return [a[0], a[1], [a[2][0] + rubbing * 16, a[2][1] + Math.abs(rubbing) * 6]] as [P, P, P];
        })(),
      }
    : P0;

  // 呼吸：上身微微起伏，头跟着动
  const br = (breath - 0.5) * 2; // -1..1
  const bodyLift = br * 4;

  ctx.save();
  ctx.scale(flip ? -s : s, s);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 地面柔影
  ctx.save();
  ctx.fillStyle = "rgba(90,60,35,0.13)";
  ctx.beginPath();
  ctx.ellipse(0, -4, 175, 24, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  drawLegs(ctx, LW);

  ctx.save();
  ctx.translate(0, -bodyLift);
  drawTorso(ctx, LW);
  if (pz.over !== "l") drawArm(ctx, pz.la, -1, LW, !!pz.cup);
  if (pz.over !== "r") drawArm(ctx, pz.ra, 1, LW, !!pz.cup);
  drawCollar(ctx, LW);
  ctx.restore();

  // 头
  ctx.save();
  ctx.translate(0, -bodyLift * 1.4 + pz.headDy);
  ctx.translate(0, -690);
  ctx.rotate(tilt * (flip ? -1 : 1));
  ctx.translate(0, 690);
  drawHead(ctx, LW, expr, blink, flip ? { x: -look.x, y: look.y } : look, pz.headDy > 6);
  ctx.restore();

  ctx.save();
  ctx.translate(0, -bodyLift);
  if (pz.over === "l") drawArm(ctx, pz.la, -1, LW, false);
  if (pz.over === "r") drawArm(ctx, pz.ra, 1, LW, false);
  if (pz.cup) {
    ctx.save();
    ctx.globalAlpha *= pz.cupAlpha ?? 1;
    drawCup(ctx, pz.cup, LW, tea);
    ctx.restore();
    drawHand(ctx, pz.la[2], -1, LW, (pz.cupAlpha ?? 1) > 0.5);
    drawHand(ctx, pz.ra[2], 1, LW, (pz.cupAlpha ?? 1) > 0.5);
  }
  ctx.restore();

  ctx.restore();
}

// ---------------------------------------------------------------- 部件

function fillStroke(ctx: CanvasRenderingContext2D, fill: string, lw: number, stroke: string = C.line) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawLegs(ctx: CanvasRenderingContext2D, lw: number) {
  for (const sd of [-1, 1]) {
    const x0 = sd * 60;
    // 脚踝
    ctx.beginPath();
    ctx.roundRect(x0 - 26, -140, 52, 90, 10);
    fillStroke(ctx, C.skin, lw);
    // 鞋：圆头布鞋，脚尖略朝外
    ctx.beginPath();
    const ox = sd * 8;
    ctx.moveTo(x0 - 66 + ox, -10);
    ctx.bezierCurveTo(x0 - 74 + ox, -50, x0 - 52, -84, x0 - 4, -86);
    ctx.bezierCurveTo(x0 + 40, -88, x0 + 72 + ox, -62, x0 + 74 + ox, -28);
    ctx.bezierCurveTo(x0 + 76 + ox, -6, x0 + 56, 0, x0 + 32, 0);
    ctx.lineTo(x0 - 46, 0);
    ctx.bezierCurveTo(x0 - 60, 0, x0 - 66 + ox, -2, x0 - 66 + ox, -10);
    ctx.closePath();
    fillStroke(ctx, C.shoe, lw);
    // 鞋口
    ctx.beginPath();
    ctx.ellipse(x0, -74, 32, 10, 0, Math.PI, TAU);
    ctx.fillStyle = C.shoeShade;
    ctx.fill();
    // 鞋底暗边
    ctx.beginPath();
    ctx.moveTo(x0 - 56, -12);
    ctx.quadraticCurveTo(x0, -4, x0 + 62, -14);
    ctx.lineWidth = lw * 1.4;
    ctx.strokeStyle = C.shoeShade;
    ctx.stroke();
  }
  // 裤腿
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -400);
    ctx.lineTo(sd * 116, -400);
    ctx.lineTo(sd * 114, -190);
    ctx.lineTo(sd * 4, -190);
    ctx.closePath();
    fillStroke(ctx, C.pants, lw);
    // 内侧暗面
    ctx.beginPath();
    ctx.moveTo(sd * 2, -360);
    ctx.lineTo(sd * 22, -360);
    ctx.lineTo(sd * 24, -196);
    ctx.lineTo(sd * 6, -196);
    ctx.closePath();
    ctx.fillStyle = C.pantsShade;
    ctx.globalAlpha = 0.45;
    ctx.fill();
    ctx.globalAlpha = 1;
    // 卷边
    ctx.beginPath();
    ctx.roundRect(sd > 0 ? 2 : -120, -200, 118, 64, 14);
    fillStroke(ctx, C.pants, lw);
    ctx.beginPath();
    ctx.moveTo(sd * 8, -166);
    ctx.lineTo(sd * 114, -168);
    ctx.lineWidth = lw * 0.8;
    ctx.strokeStyle = C.pantsShade;
    ctx.stroke();
  }
}

function torsoPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(-36, -688);
  ctx.quadraticCurveTo(-78, -676, -96, -646);
  ctx.quadraticCurveTo(-112, -560, -114, -460);
  ctx.lineTo(-122, -368);
  ctx.quadraticCurveTo(0, -352, 122, -368);
  ctx.lineTo(114, -460);
  ctx.quadraticCurveTo(112, -560, 96, -646);
  ctx.quadraticCurveTo(78, -676, 36, -688);
  ctx.closePath();
}

function drawTorso(ctx: CanvasRenderingContext2D, lw: number) {
  torsoPath(ctx);
  ctx.fillStyle = C.jacket;
  ctx.fill();
  // 麻布纹：极淡的经纬线
  ctx.save();
  torsoPath(ctx);
  ctx.clip();
  ctx.strokeStyle = "rgba(150,120,90,0.06)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let y = -690; y < -350; y += 9) {
    ctx.moveTo(-130, y);
    ctx.lineTo(130, y + 2);
  }
  for (let x = -126; x < 130; x += 9) {
    ctx.moveTo(x, -700);
    ctx.lineTo(x + 2, -350);
  }
  ctx.stroke();
  // 右下暗面
  ctx.fillStyle = C.jacketShade;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(70, -640);
  ctx.quadraticCurveTo(104, -520, 108, -368);
  ctx.lineTo(140, -368);
  ctx.lineTo(140, -660);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.35;
  ctx.fillRect(-140, -392, 280, 40);
  ctx.restore();
  torsoPath(ctx);
  ctx.lineWidth = lw;
  ctx.strokeStyle = C.line;
  ctx.stroke();
  // 门襟（稍偏左）与盘扣
  ctx.beginPath();
  ctx.moveTo(-8, -672);
  ctx.lineTo(-8, -560);
  ctx.lineWidth = lw * 0.8;
  ctx.strokeStyle = C.line;
  ctx.stroke();
  for (const y of [-650, -615, -582]) {
    ctx.beginPath();
    ctx.ellipse(-8, y, 5.5, 4.5, 0, 0, TAU);
    ctx.fillStyle = C.jacketShade;
    ctx.fill();
    ctx.lineWidth = lw * 0.6;
    ctx.stroke();
  }
  // 侧开衩（画面右）
  ctx.beginPath();
  ctx.moveTo(106, -372);
  ctx.lineTo(100, -420);
  ctx.lineWidth = lw * 0.8;
  ctx.stroke();
}

function drawCollar(ctx: CanvasRenderingContext2D, lw: number) {
  // 脖子
  ctx.beginPath();
  ctx.roundRect(-22, -716, 44, 40, 8);
  ctx.fillStyle = C.skinShade;
  ctx.fill();
  // 立领：一圈包住脖子，前中留缝
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * 5, -670);
    ctx.lineTo(sd * 5, -706);
    ctx.quadraticCurveTo(sd * 32, -716, sd * 54, -704);
    ctx.lineTo(sd * 58, -672);
    ctx.quadraticCurveTo(sd * 30, -662, sd * 5, -670);
    ctx.closePath();
    fillStroke(ctx, C.jacket, lw * 0.9);
  }
}

/** 袖子（米色粗管 + 卷起的袖口）与手 */
function drawArm(ctx: CanvasRenderingContext2D, a: [P, P, P], side: number, lw: number, holding: boolean) {
  const [sh, el, hd] = a;
  // 手腕位置：手向肘方向回缩一点
  const dx = el[0] - hd[0];
  const dy = el[1] - hd[1];
  const d = Math.hypot(dx, dy) || 1;
  const wr: P = [hd[0] + (dx / d) * 30, hd[1] + (dy / d) * 30];
  const cuff: P = [hd[0] + (dx / d) * 52, hd[1] + (dy / d) * 52];
  const tube = (w: number, color: string) => {
    ctx.beginPath();
    ctx.moveTo(sh[0], sh[1]);
    ctx.quadraticCurveTo(el[0] * 1.02, el[1], cuff[0], cuff[1]);
    ctx.lineWidth = w;
    ctx.strokeStyle = color;
    ctx.stroke();
  };
  // 手腕
  ctx.beginPath();
  ctx.moveTo(cuff[0], cuff[1]);
  ctx.lineTo(wr[0], wr[1]);
  ctx.lineWidth = 34 + lw * 2;
  ctx.strokeStyle = C.line;
  ctx.stroke();
  ctx.lineWidth = 34;
  ctx.strokeStyle = C.skin;
  ctx.stroke();
  tube(66 + lw * 2, C.line);
  tube(66, C.jacket);
  // 袖口卷边
  const ang = Math.atan2(cuff[1] - el[1], cuff[0] - el[0]);
  ctx.save();
  ctx.translate(cuff[0], cuff[1]);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.roundRect(-14, -38, 28, 76, 10);
  fillStroke(ctx, C.jacketShade, lw);
  ctx.restore();
  if (!holding) drawHand(ctx, hd, side, lw, false);
}

function drawHand(ctx: CanvasRenderingContext2D, h: P, side: number, lw: number, onCup: boolean) {
  ctx.save();
  ctx.translate(h[0], h[1]);
  ctx.beginPath();
  if (onCup) {
    // 捧杯：手掌贴在杯侧，拇指搭在杯沿
    ctx.ellipse(0, 4, 30, 34, 0, 0, TAU);
    fillStroke(ctx, C.skin, lw);
    ctx.beginPath();
    ctx.moveTo(-side * 8, -24);
    ctx.quadraticCurveTo(-side * 26, -34, -side * 30, -20);
    ctx.lineWidth = lw * 0.8;
    ctx.strokeStyle = C.line;
    ctx.stroke();
    // 指缝
    for (const y of [2, 16]) {
      ctx.beginPath();
      ctx.moveTo(-side * 26, y);
      ctx.lineTo(-side * 12, y + 2);
      ctx.lineWidth = lw * 0.6;
      ctx.stroke();
    }
  } else {
    ctx.ellipse(0, 0, 30, 32, 0, 0, TAU);
    fillStroke(ctx, C.skin, lw);
    ctx.beginPath();
    ctx.moveTo(-side * 14, -18);
    ctx.quadraticCurveTo(-side * 30, -10, -side * 24, 8);
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
  // 杯身
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
  // 圈足
  ctx.beginPath();
  ctx.roundRect(-20, 30, 40, 9, 3);
  fillStroke(ctx, C.cup, lw * 0.8);
  // 杯口 + 茶汤
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

function drawHead(ctx: CanvasRenderingContext2D, lw: number, expr: XzExpr, blink: number, look: { x: number; y: number }, lookDown: boolean) {
  const HY = -850;
  // 耳朵
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sd * 146, HY + 64, 26, 32, sd * 0.2, 0, TAU);
    fillStroke(ctx, C.skin, lw);
    ctx.beginPath();
    ctx.arc(sd * 146, HY + 66, 13, sd > 0 ? -1.2 : Math.PI - 1.9, sd > 0 ? 1.9 : Math.PI + 1.2);
    ctx.lineWidth = lw * 0.7;
    ctx.strokeStyle = C.line;
    ctx.stroke();
  }
  // 头：略宽的圆，下巴收一点
  const head = () => {
    ctx.beginPath();
    ctx.moveTo(0, HY - 150);
    ctx.bezierCurveTo(88, HY - 150, 152, HY - 92, 152, HY - 4);
    ctx.bezierCurveTo(152, HY + 86, 92, HY + 150, 0, HY + 150);
    ctx.bezierCurveTo(-92, HY + 150, -152, HY + 86, -152, HY - 4);
    ctx.bezierCurveTo(-152, HY - 92, -88, HY - 150, 0, HY - 150);
    ctx.closePath();
  };
  head();
  ctx.fillStyle = C.skin;
  ctx.fill();
  ctx.save();
  head();
  ctx.clip();
  // 右下暗面 + 头顶高光
  ctx.fillStyle = C.skinShade;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(-26, HY - 22, 168, 170, 0, 0, TAU);
  ctx.rect(200, HY - 200, -400, 400);
  ctx.fill("evenodd");
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255,246,236,0.16)";
  ctx.beginPath();
  ctx.ellipse(-48, HY - 104, 54, 26, -0.45, 0, TAU);
  ctx.fill();
  ctx.restore();
  head();
  ctx.lineWidth = lw;
  ctx.strokeStyle = C.line;
  ctx.stroke();

  // 腮红
  const blushA = expr === "shy" ? 0.75 : 0.45;
  for (const sd of [-1, 1]) {
    const g = ctx.createRadialGradient(sd * 94, HY + 86, 2, sd * 94, HY + 86, 38);
    g.addColorStop(0, `rgba(244,150,130,${blushA})`);
    g.addColorStop(1, "rgba(244,150,130,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(sd * 94, HY + 86, 40, 26, 0, 0, TAU);
    ctx.fill();
  }

  // 眉毛
  const browLift = expr === "curious" || expr === "surprised" ? 12 : expr === "think" ? 4 : 0;
  for (const sd of [-1, 1]) {
    const lift = browLift + (expr === "think" && sd > 0 ? 8 : 0);
    ctx.beginPath();
    ctx.moveTo(sd * 34, HY + 10 - lift);
    ctx.quadraticCurveTo(sd * 56, HY - 6 - lift, sd * 80, HY + 6 - lift);
    ctx.lineWidth = lw * 1.05;
    ctx.strokeStyle = C.line;
    ctx.stroke();
  }

  // 眼睛
  const ex = 56;
  const ey = HY + 50;
  const lx = look.x * 9;
  const ly = (lookDown || expr === "shy" ? 5 : 0) + look.y * 8;
  const happyEye = expr === "happy" || expr === "sip";
  for (const sd of [-1, 1]) {
    const x = sd * ex + lx;
    const y = ey + ly;
    if (happyEye) {
      ctx.beginPath();
      ctx.moveTo(x - 14, y + 4);
      ctx.quadraticCurveTo(x, y - 12, x + 14, y + 4);
      ctx.lineWidth = lw * 1.3;
      ctx.strokeStyle = C.eye;
      ctx.stroke();
      continue;
    }
    const big = expr === "surprised" ? 1.15 : expr === "curious" ? 1.07 : 1;
    const ry = 19 * big * (1 - clamp01(blink));
    if (ry < 3) {
      ctx.beginPath();
      ctx.moveTo(x - 13, y + 1);
      ctx.quadraticCurveTo(x, y + 7, x + 13, y + 1);
      ctx.lineWidth = lw * 1.2;
      ctx.strokeStyle = C.eye;
      ctx.stroke();
      continue;
    }
    ctx.beginPath();
    ctx.ellipse(x, y, 14.5 * big, ry, 0, 0, TAU);
    ctx.fillStyle = C.eye;
    ctx.fill();
    if (ry > 7) {
      ctx.beginPath();
      ctx.arc(x - 4.5, y - ry * 0.4, 4.8, 0, TAU);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
  }

  // 鼻子：一笔小弧
  ctx.beginPath();
  ctx.moveTo(-4, HY + 72);
  ctx.quadraticCurveTo(2, HY + 76, 6, HY + 71);
  ctx.lineWidth = lw * 0.7;
  ctx.strokeStyle = "rgba(170,110,85,0.7)";
  ctx.stroke();

  // 嘴
  const my = HY + 100;
  ctx.lineWidth = lw * 1.05;
  ctx.strokeStyle = C.line;
  ctx.beginPath();
  switch (expr) {
    case "happy":
      ctx.moveTo(-22, my - 4);
      ctx.quadraticCurveTo(0, my + 26, 22, my - 4);
      ctx.closePath();
      ctx.fillStyle = "#b65a4a";
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, my + 10, 9, 4, 0, 0, TAU);
      ctx.fillStyle = "#e48d7c";
      ctx.fill();
      break;
    case "surprised":
    case "curious": {
      const r = expr === "surprised" ? 9 : 6;
      ctx.ellipse(0, my + 4, r * 0.85, r, 0, 0, TAU);
      ctx.fillStyle = "#b65a4a";
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "calm":
    case "think":
      ctx.moveTo(-12 + (expr === "think" ? 6 : 0), my + 2);
      ctx.quadraticCurveTo(2, my + (expr === "think" ? 1 : 5), 14 + (expr === "think" ? 4 : 0), my + 2);
      ctx.stroke();
      break;
    default: // smile / sip / shy
      ctx.moveTo(-22, my - 3);
      ctx.quadraticCurveTo(0, my + 15, 22, my - 3);
      ctx.stroke();
  }
}
