/**
 * 第 23 期共用物件（全部按小正色板 + 宣纸窗光统一质感，确定性纯函数渲染）：
 * 1. 素雪 · 白牡丹-白茶（300g）棉纸茶饼（1:1 还原实物包装：白棉纸、淡灰古塔/远山/牡丹纹、
 *    顶「正上茶舍」绿金标、中烫翠绿「素雪」与雪花、左「一叶倾心」、底墨绿燕尾弧带）
 * 2. 加厚食品级 PE 袋（平口袋 / 拉链自封袋 + 老化漏气）
 * 3. 鹅颈封口动画袋（挤气八九成 → 拧麻花 → 折鹅颈 → 两道扎带死死勒紧）
 * 4. 纯铝箔袋 vs 镀铝袋（强光照射透亮对比 + 硬挺折痕不回弹 + 拉开外袋验茶）
 * 5. 五层加厚瓦楞纸箱（五层波浪瓦楞截面 + 箱盖合拢 + 「工」字形胶带封箱）
 * 6. 铁罐 / 紫砂陶罐外壳（半剖透视：内套前两层袋子的素雪茶饼）
 */
import {
  TAU,
  cachedSurface,
  clamp01,
  hash01,
  mixHex,
  rgba,
  rng,
  type FxPalette,
} from "@/remotion/shared/fx";
import { CAKE_R, CAKE_SIL, paintCakeTexture } from "./cake";
import { KAI, SONG, fillText, softShadow, tracePoly } from "./draw-kit";
import { EMBLEM_GREEN, drawBrandEmblem } from "./emblem";

const HEI = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Noto Serif SC", sans-serif';

// ============================================================================
// 1. 正上茶舍「素雪 · 白牡丹-白茶」300g 实物还原茶饼
// ============================================================================

function drawSnowflake(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.save();
  c.translate(x, y);
  c.strokeStyle = "#1d4a33";
  c.lineWidth = Math.max(2, r * 0.12);
  c.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(ca * r, sa * r);
    // 小分叉
    const mx = ca * r * 0.58;
    const my = sa * r * 0.58;
    c.moveTo(mx, my);
    c.lineTo(mx + Math.cos(a + 0.65) * r * 0.34, my + Math.sin(a + 0.65) * r * 0.34);
    c.moveTo(mx, my);
    c.lineTo(mx + Math.cos(a - 0.65) * r * 0.34, my + Math.sin(a - 0.65) * r * 0.34);
    c.stroke();
  }
  c.restore();
}

function paintSuxueWrapper(c: CanvasRenderingContext2D, pal: FxPalette, seed: number) {
  const R = CAKE_R;
  c.save();
  c.translate(R * 1.15, R * 1.15);

  // 白色手工棉纸基底
  const basePaper = pal.dark ? "#e9e5dc" : "#f8f6f0";
  const bgGrad = c.createRadialGradient(-R * 0.25, -R * 0.32, R * 0.08, 0, 0, R * 1.08);
  bgGrad.addColorStop(0, "#ffffff");
  bgGrad.addColorStop(0.74, basePaper);
  bgGrad.addColorStop(1, mixHex(basePaper, "#c9bfa9", 0.3));
  c.fillStyle = bgGrad;
  c.fillRect(-R * 1.15, -R * 1.15, R * 2.3, R * 2.3);

  // 棉纸自然纤维
  const rr = rng(220 + seed);
  c.strokeStyle = rgba(pal.tea, 0.036);
  c.lineWidth = 0.9;
  for (let i = 0; i < 150; i++) {
    const x = (rr() - 0.5) * R * 2;
    const y = (rr() - 0.5) * R * 2;
    const a = rr() * TAU;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(
      x + Math.cos(a + 0.5) * 12,
      y + Math.sin(a + 0.5) * 12,
      x + Math.cos(a) * 24,
      y + Math.sin(a) * 24,
    );
    c.stroke();
  }

  // 极淡的底层茶叶透影
  c.save();
  c.globalCompositeOperation = "multiply";
  c.globalAlpha = 0.045;
  paintCakeTexture(c, pal, "new");
  c.restore();

  // 手工包饼四周折边纹
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * TAU + (hash01(i, seed) - 0.5) * 0.08;
    const r0 = R * (0.84 + 0.06 * hash01(i, seed + 2));
    const r1 = R * 1.03;
    c.strokeStyle = rgba("#726451", 0.065 + 0.04 * hash01(i, 9));
    c.lineWidth = 2.4 + 2.2 * hash01(i, 3);
    c.beginPath();
    c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    c.lineTo(Math.cos(a + 0.02) * r1, Math.sin(a + 0.02) * r1);
    c.stroke();
  }

  // ── 以下按实拍包装纸（uploads/素雪.webp）逐项还原，坐标以 R 为单位 ──

  // 外圈墨绿细折线（包装纸上那道尖齿状的线框，从左侧绕过顶部到右下）
  c.save();
  c.strokeStyle = rgba("#55603f", 0.42);
  c.lineWidth = 1.5;
  c.lineJoin = "miter";
  c.beginPath();
  const teeth = 10;
  const a0 = Math.PI * 0.86;
  const a1 = Math.PI * 2.32;
  for (let i = 0; i <= teeth * 2; i++) {
    const t = i / (teeth * 2);
    const a = a0 + (a1 - a0) * t + (hash01(i, 41) - 0.5) * 0.05;
    const tip = i % 2 === 0;
    const rr2 = R * (tip ? 0.94 + 0.04 * hash01(i, 43) : 0.7 + 0.1 * hash01(i, 47));
    const px = Math.cos(a) * rr2;
    const py = Math.sin(a) * rr2;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.stroke();
  c.restore();

  const lineGray = rgba("#7d7d77", 0.27);
  const lineGrayLt = rgba("#8f8f88", 0.18);

  // 左上：淡灰线描楼阁（四层飞檐塔 + 下方殿宇与松枝）
  c.save();
  c.strokeStyle = lineGray;
  c.lineWidth = 1.5;
  c.lineJoin = "round";
  const px0 = -R * 0.47;
  const tiers = [
    { y: -R * 0.24, w: R * 0.16 },
    { y: -R * 0.38, w: R * 0.135 },
    { y: -R * 0.51, w: R * 0.11 },
    { y: -R * 0.62, w: R * 0.085 },
  ];
  tiers.forEach((t, i) => {
    const h = R * (i === 3 ? 0.07 : 0.1);
    // 飞檐（两端上翘）
    c.beginPath();
    c.moveTo(px0 - t.w * 1.18, t.y - R * 0.035);
    c.quadraticCurveTo(px0 - t.w * 0.9, t.y, px0 - t.w * 0.55, t.y - R * 0.005);
    c.lineTo(px0 + t.w * 0.55, t.y - R * 0.005);
    c.quadraticCurveTo(px0 + t.w * 0.9, t.y, px0 + t.w * 1.18, t.y - R * 0.035);
    c.lineTo(px0 + t.w * 0.62, t.y - R * 0.045);
    c.lineTo(px0 - t.w * 0.62, t.y - R * 0.045);
    c.closePath();
    c.stroke();
    // 塔身与窗格
    c.strokeRect(px0 - t.w * 0.62, t.y + R * 0.005, t.w * 1.24, h - R * 0.02);
    const cols = 4;
    for (let k = 1; k < cols; k++) {
      const x = px0 - t.w * 0.62 + (t.w * 1.24 * k) / cols;
      c.beginPath();
      c.moveTo(x, t.y + R * 0.01);
      c.lineTo(x, t.y + h - R * 0.02);
      c.stroke();
    }
  });
  // 塔刹
  c.beginPath();
  c.moveTo(px0, -R * 0.665);
  c.lineTo(px0, -R * 0.74);
  c.stroke();
  c.beginPath();
  c.arc(px0, -R * 0.7, R * 0.012, 0, TAU * 0.9995);
  c.stroke();
  // 下方殿宇屋脊与台基
  c.strokeStyle = lineGrayLt;
  c.beginPath();
  c.moveTo(-R * 0.86, -R * 0.08);
  c.quadraticCurveTo(-R * 0.72, -R * 0.12, -R * 0.62, -R * 0.15);
  c.lineTo(-R * 0.32, -R * 0.15);
  c.quadraticCurveTo(-R * 0.24, -R * 0.12, -R * 0.18, -R * 0.1);
  c.moveTo(-R * 0.84, -R * 0.02);
  c.lineTo(-R * 0.2, -R * 0.02);
  c.moveTo(-R * 0.82, R * 0.05);
  c.lineTo(-R * 0.3, R * 0.05);
  c.stroke();
  for (let k = 0; k < 10; k++) {
    const x = -R * 0.8 + k * R * 0.055;
    c.beginPath();
    c.moveTo(x, -R * 0.02);
    c.lineTo(x, R * 0.05);
    c.stroke();
  }
  // 松枝（几簇短横笔）
  const pr = rng(91 + seed);
  for (let k = 0; k < 4; k++) {
    const bx = -R * (0.74 - k * 0.04);
    const by = -R * (0.3 - k * 0.05);
    for (let j = 0; j < 5; j++) {
      c.beginPath();
      const yy = by + j * R * 0.014;
      c.moveTo(bx - R * 0.05 * pr(), yy);
      c.lineTo(bx + R * 0.05 * pr(), yy - R * 0.006);
      c.stroke();
    }
  }
  c.restore();

  // 右侧：淡灰线描大牡丹（外圈大花瓣 + 内圈杯状花瓣 + 叶片）
  c.save();
  c.strokeStyle = lineGray;
  c.lineWidth = 1.4;
  c.lineCap = "round";
  const fx0 = R * 0.62;
  const fy0 = R * 0.14;
  const petalArc = (cx: number, cy: number, rx: number, ry: number, rot: number, scallops: number) => {
    // 一片花瓣：上缘是几段小波浪，下缘收向花心
    c.save();
    c.translate(cx, cy);
    c.rotate(rot);
    c.beginPath();
    c.moveTo(-rx, 0);
    for (let k = 0; k < scallops; k++) {
      const x0 = -rx + (2 * rx * k) / scallops;
      const x1 = -rx + (2 * rx * (k + 1)) / scallops;
      const yy = -ry * Math.sin(Math.PI * ((k + 0.5) / scallops));
      c.quadraticCurveTo((x0 + x1) / 2, yy - ry * 0.28, x1, -ry * Math.sin(Math.PI * ((k + 1) / scallops)));
    }
    c.quadraticCurveTo(rx * 0.4, ry * 0.5, 0, ry * 0.55);
    c.quadraticCurveTo(-rx * 0.4, ry * 0.5, -rx, 0);
    c.stroke();
    // 花瓣脉络
    c.beginPath();
    for (let k = -1; k <= 1; k++) {
      c.moveTo(k * rx * 0.15, ry * 0.4);
      c.lineTo(k * rx * 0.45, -ry * 0.55);
    }
    c.stroke();
    c.restore();
  };
  // 外圈
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + (k / 6) * TAU + 0.3;
    petalArc(fx0 + Math.cos(a) * R * 0.17, fy0 + Math.sin(a) * R * 0.13, R * 0.13, R * 0.1, a + Math.PI / 2, 4);
  }
  // 内圈
  for (let k = 0; k < 4; k++) {
    const a = -Math.PI / 2 + (k / 4) * TAU;
    petalArc(fx0 + Math.cos(a) * R * 0.07, fy0 + Math.sin(a) * R * 0.05, R * 0.08, R * 0.065, a + Math.PI / 2, 3);
  }
  // 叶片
  c.strokeStyle = lineGrayLt;
  for (const [lx, ly, la] of [
    [R * 0.34, R * 0.38, 2.6],
    [R * 0.78, R * 0.42, 0.75],
  ] as const) {
    c.beginPath();
    c.ellipse(lx, ly, R * 0.14, R * 0.05, la, 0, TAU * 0.9995);
    c.stroke();
    c.beginPath();
    c.moveTo(lx - Math.cos(la) * R * 0.13, ly - Math.sin(la) * R * 0.13);
    c.lineTo(lx + Math.cos(la) * R * 0.13, ly + Math.sin(la) * R * 0.13);
    c.stroke();
  }
  c.restore();

  // 底部：淡灰线描远山（几道山脊 + 皴纹）
  c.save();
  c.strokeStyle = lineGray;
  c.lineWidth = 1.5;
  const ridge = [
    [-0.52, 0.6], [-0.4, 0.5], [-0.32, 0.54], [-0.22, 0.46], [-0.12, 0.52],
    [-0.02, 0.48], [0.1, 0.43], [0.2, 0.5], [0.3, 0.47], [0.42, 0.58],
  ];
  c.beginPath();
  ridge.forEach(([x, y], i) => (i ? c.lineTo(x * R, y * R) : c.moveTo(x * R, y * R)));
  c.stroke();
  c.strokeStyle = lineGrayLt;
  for (let i = 1; i < ridge.length - 1; i++) {
    const [x, y] = ridge[i];
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      c.moveTo(x * R + k * R * 0.012, y * R + R * 0.01);
      c.lineTo(x * R + k * R * 0.02 - R * 0.025, y * R + R * 0.07);
      c.stroke();
    }
  }
  c.restore();

  // 顶部「正上茶舍」Logo + 品牌字（字间竖线）+ 拼音
  drawBrandEmblem(c, -R * 0.08, -R * 0.86, R * 0.2);
  {
    const fs = R * 0.078;
    const step = fs * 1.32;
    const chs = ["正", "上", "茶", "舍"];
    const by = -R * 0.705;
    const bx = -R * 0.08;
    chs.forEach((ch, i) => {
      const x = bx + (i - 1.5) * step;
      fillText(c, ch, x, by, fs, { color: EMBLEM_GREEN, weight: 900, font: HEI });
      if (i < 3) {
        c.fillStyle = EMBLEM_GREEN;
        c.fillRect(x + step / 2 - 1.2, by - fs * 0.5, 2.4, fs);
      }
    });
    fillText(c, "-zheng shang cha she-", bx, -R * 0.645, R * 0.036, {
      color: EMBLEM_GREEN,
      weight: 600,
      font: `italic ${SONG}`,
    });
  }

  // 环绕「素雪」的两道翠绿细飘带（左端起笔，绕过字顶，右端回旋后从字下扫回左侧）
  c.save();
  c.lineCap = "round";
  const swirl = (dy: number, color: string, w: number) => {
    c.strokeStyle = color;
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(-R * 0.74, R * (0.06 + dy));
    c.bezierCurveTo(-R * 0.5, -R * (0.24 - dy), R * 0.1, -R * (0.33 - dy), R * 0.56, -R * (0.34 - dy));
    c.bezierCurveTo(R * 0.76, -R * (0.34 - dy), R * 0.72, -R * (0.12 - dy), R * 0.5, -R * (0.04 - dy));
    c.bezierCurveTo(R * 0.2, R * (0.1 + dy), -R * 0.3, R * (0.12 + dy), -R * 0.72, R * (0.14 + dy));
    c.stroke();
  };
  swirl(0, rgba("#25a85a", 0.75), 2.2);
  swirl(0.025, rgba("#6fd99a", 0.55), 1.4);
  c.restore();

  // 右上雪花（墨绿，带一点浅绿）
  drawSnowflake(c, R * 0.47, -R * 0.46, R * 0.07);

  // 中心烫翠绿大字「素雪」（细笔画现代字形，镭射金属绿）
  const jadeGrad = c.createLinearGradient(-R * 0.55, -R * 0.35, R * 0.45, R * 0.15);
  jadeGrad.addColorStop(0, "#36c46e");
  jadeGrad.addColorStop(0.3, "#9af2bb");
  jadeGrad.addColorStop(0.48, "#16a04e");
  jadeGrad.addColorStop(0.7, "#7ae8a4");
  jadeGrad.addColorStop(1, "#139148");
  c.save();
  c.shadowColor = rgba("#0f5a30", 0.18);
  c.shadowBlur = 3;
  c.shadowOffsetY = 1.5;
  c.fillStyle = jadeGrad;
  c.font = `500 ${Math.round(R * 0.46)}px ${HEI}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("素", -R * 0.31, -R * 0.1);
  c.fillText("雪", R * 0.17, -R * 0.1);
  c.restore();

  // 左侧手写「一叶倾心」
  fillText(c, "一叶", -R * 0.69, R * 0.25, R * 0.105, { color: "#22382b", weight: 400, font: KAI, fixed: true });
  fillText(c, "倾心", -R * 0.62, R * 0.355, R * 0.105, { color: "#22382b", weight: 400, font: KAI, fixed: true });

  // 「白牡丹-白茶」
  fillText(c, "白牡丹-白茶", -R * 0.04, R * 0.355, R * 0.1, { color: "#4a4944", weight: 700, font: SONG, fixed: true });

  // 底部墨绿弧形丝带：两端翠绿燕尾 → 墨绿主带（上下细亮边）→ 白色英文
  {
    const cy = -R * 0.1;
    const rMid = R * 0.9;
    const half = R * 0.075;
    const aL = Math.PI / 2 + 0.74;
    const aR = Math.PI / 2 - 0.74;
    // 燕尾：两端翠绿旗形，压在主带下面向外上方竖起，顶端剪出燕尾缺口
    const flag = (sx: number) => {
      const P = (x: number, y: number): [number, number] => [sx * x * R, y * R];
      const body = [P(0.5, 0.7), P(0.66, 0.62), P(0.75, 0.43), P(0.69, 0.47), P(0.61, 0.41), P(0.52, 0.55)];
      c.fillStyle = "#3cb54d";
      c.beginPath();
      body.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.fill();
      // 靠主带一侧的折痕暗面
      const fold = [P(0.5, 0.7), P(0.58, 0.665), P(0.56, 0.56), P(0.52, 0.55)];
      c.fillStyle = "#237a3a";
      c.beginPath();
      fold.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.fill();
    };
    flag(-1);
    flag(1);
    // 主带
    c.strokeStyle = "#174f37";
    c.lineWidth = half * 2;
    c.lineCap = "butt";
    c.beginPath();
    c.arc(0, cy, rMid, aR, aL);
    c.stroke();
    // 上下细亮边
    c.strokeStyle = rgba("#d9f2df", 0.85);
    c.lineWidth = 1.6;
    for (const off of [-half + 4, half - 4]) {
      c.beginPath();
      c.arc(0, cy, rMid + off, aR + 0.01, aL - 0.01);
      c.stroke();
    }
    // 英文沿弧排字（白色窄体粗字）
    const label = "SUXUE-BAI MUDAN WHITE TEA";
    const fs = R * 0.064;
    c.save();
    c.fillStyle = "#f6f7f2";
    c.font = `800 ${Math.round(fs)}px ${HEI}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    const widths = [...label].map((ch) => c.measureText(ch).width * 0.82);
    const total = widths.reduce((s, w) => s + w, 0);
    let acc = -total / 2;
    [...label].forEach((ch, i) => {
      const mid = acc + widths[i] / 2;
      acc += widths[i];
      const a = Math.PI / 2 - mid / rMid;
      c.save();
      c.translate(Math.cos(a) * rMid, cy + Math.sin(a) * rMid);
      c.rotate(a - Math.PI / 2);
      c.scale(0.82, 1);
      c.fillText(ch, 0, 0);
      c.restore();
    });
    c.restore();
    // 净含量（主带上方白底处）
    fillText(c, "净含量:300克", -R * 0.04, R * 0.665, R * 0.058, { color: "#1e1e1c", weight: 700, font: HEI });
  }

  // 左上窗光微明暗体积感
  const vol = c.createRadialGradient(-R * 0.35, -R * 0.38, R * 0.05, 0, 0, R * 1.02);
  vol.addColorStop(0, rgba("#ffffff", 0.16));
  vol.addColorStop(0.62, rgba("#ffffff", 0));
  vol.addColorStop(1, rgba("#3a2a1c", 0.18));
  c.fillStyle = vol;
  c.fillRect(-R * 1.15, -R * 1.15, R * 2.3, R * 2.3);

  c.restore();
}

function suxueSurface(pal: FxPalette, seed: number) {
  const size = Math.round(CAKE_R * 2.3);
  return cachedSurface(`ep22-suxue:${pal.paper}:${seed}`, size, size, (c) => {
    paintSuxueWrapper(c, pal, seed);
  });
}

export type SuxueCakeOpts = {
  lift?: number;
  seed?: number;
  bare?: boolean;
};

/** 绘制「素雪 · 白牡丹」茶饼（原点为中心，半径 radius） */
export function drawSuxueCake(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  radius: number,
  opts: SuxueCakeOpts = {},
) {
  const { lift = 0, seed = 22, bare = false } = opts;
  const sc = radius / CAKE_R;
  ctx.save();
  ctx.scale(sc, sc);

  softShadow(ctx, () => tracePoly(ctx, CAKE_SIL), {
    blur: 22 + 24 * lift,
    dx: 10 + 18 * lift,
    dy: 14 + 26 * lift,
    alpha: Math.max(0.08, 0.26 - 0.12 * lift),
  });

  ctx.save();
  ctx.beginPath();
  tracePoly(ctx, CAKE_SIL);
  ctx.clip();
  if (bare) {
    paintCakeTexture(ctx, pal, "new");
  } else {
    const surf = suxueSurface(pal, seed);
    ctx.drawImage(
      surf.canvas as CanvasImageSource,
      -CAKE_R * 1.15,
      -CAKE_R * 1.15,
      CAKE_R * 2.3,
      CAKE_R * 2.3,
    );
  }
  ctx.restore();

  // 外缘细描边（纸边压感）
  ctx.strokeStyle = rgba(pal.tea, bare ? 0.35 : 0.24);
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  tracePoly(ctx, CAKE_SIL);
  ctx.stroke();

  ctx.restore();
}

/** 侧视茶饼（平放装纸箱 / 摞叠防压用） */
export function drawCakeSide(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: { crush?: number; wrapped?: boolean } = {},
) {
  const { crush = 0, wrapped = true } = opts;
  const hh = h * (1 - crush * 0.36);
  const ww = w * (1 + crush * 0.08);
  ctx.save();
  softShadow(ctx, () => ctx.roundRect(-ww / 2, -hh / 2, ww, hh, hh * 0.42), {
    blur: 14,
    dx: 4,
    dy: 8,
    alpha: 0.2,
  });
  const g = ctx.createLinearGradient(-ww / 2, -hh / 2, ww / 2, hh / 2);
  if (wrapped) {
    g.addColorStop(0, "#fdfbf6");
    g.addColorStop(0.55, "#eee9dc");
    g.addColorStop(1, "#d5cbb8");
  } else {
    g.addColorStop(0, "#8f986e");
    g.addColorStop(0.5, "#6b734e");
    g.addColorStop(1, "#4e5236");
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(-ww / 2, -hh / 2, ww, hh, hh * 0.42);
  ctx.fill();
  ctx.strokeStyle = rgba(pal.tea, 0.32);
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // 素雪绿带侧标（呼应实物底部墨绿丝带）
  if (wrapped) {
    ctx.fillStyle = "#1b593f";
    ctx.fillRect(-ww * 0.22, -hh * 0.16, ww * 0.44, hh * 0.32);
    ctx.fillStyle = "#52c47e";
    ctx.fillRect(-ww * 0.26, -hh * 0.12, ww * 0.04, hh * 0.24);
    ctx.fillRect(ww * 0.22, -hh * 0.12, ww * 0.04, hh * 0.24);
  }
  // 压碎裂痕
  if (crush > 0.2) {
    ctx.strokeStyle = rgba(pal.cinnabar, clamp01((crush - 0.2) * 1.4));
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-ww * 0.16, -hh * 0.42);
    ctx.lineTo(-ww * 0.08, 0);
    ctx.lineTo(-ww * 0.14, hh * 0.44);
    ctx.moveTo(ww * 0.18, -hh * 0.4);
    ctx.lineTo(ww * 0.11, hh * 0.06);
    ctx.lineTo(ww * 0.22, hh * 0.42);
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================================
// 2. 加厚食品级 PE 袋（平口袋 / 拉链自封袋）
// ============================================================================

export type PeBagOpts = {
  mode?: "flat" | "ziplock";
  /** 拉链老化漏气 0..1 */
  leak?: number;
  /** 强调加厚壁 0..1 */
  thickEdge?: number;
  /** 袋内内容回调（会自然透在半透明 PE 膜后面） */
  inside?: () => void;
  /** 帧号（用于漏气微动） */
  frame?: number;
  /** 袋面按压凹陷演示（正值向下/向内凹，微负值表示弹性回弹鼓起） */
  dent?: { amount: number; x?: number; y?: number };
};

export function drawPeBag(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: PeBagOpts = {},
) {
  const { mode = "flat", leak = 0, thickEdge = 0.5, inside, frame = 0, dent } = opts;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const r = 16;
  const dentAmt = dent?.amount ?? 0;
  const dentX = dent?.x ?? w * 0.08;
  const dentY = dent?.y ?? h * 0.08;

  ctx.save();
  softShadow(ctx, () => ctx.roundRect(x0, y0, w, h, r), {
    blur: 20,
    dx: 8,
    dy: 14,
    alpha: 0.14,
  });

  // 底层半透明 PE 袋背膜
  ctx.fillStyle = rgba("#ffffff", pal.dark ? 0.14 : 0.34);
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, r);
  ctx.fill();

  // 袋内茶饼 / 茶叶
  if (inside) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x0 + 8, y0 + 8, w - 16, h - 16, r - 4);
    ctx.clip();
    inside();
    ctx.restore();
  }

  // 前层半透明 PE 光泽膜 + 斜向高光带
  const sheen = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
  sheen.addColorStop(0, rgba("#ffffff", 0.42));
  sheen.addColorStop(0.28, rgba("#f4f9f6", 0.12));
  sheen.addColorStop(0.54, rgba("#ffffff", 0.3));
  sheen.addColorStop(0.76, rgba("#e6efe9", 0.08));
  sheen.addColorStop(1, rgba("#ffffff", 0.22));
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, r);
  ctx.fill();

  // 斜向高光条
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, r);
  ctx.clip();
  ctx.fillStyle = rgba("#ffffff", 0.24);
  ctx.beginPath();
  ctx.moveTo(x0 + w * 0.12, y0);
  ctx.lineTo(x0 + w * 0.26, y0);
  ctx.lineTo(x0 + w * 0.04, y0 + h);
  ctx.lineTo(x0 - w * 0.08, y0 + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 热封加厚侧边（12丝以上厚重双线质感）
  const edgeW = 10 + thickEdge * 8;
  ctx.fillStyle = rgba("#dbe5dd", 0.45);
  ctx.fillRect(x0 + 2, y0 + r, edgeW, h - r * 2);
  ctx.fillRect(x0 + w - edgeW - 2, y0 + r, edgeW, h - r * 2);
  ctx.fillRect(x0 + r, y0 + h - edgeW - 2, w - r * 2, edgeW);

  ctx.strokeStyle = rgba(pal.bamboo, 0.55 + thickEdge * 0.25);
  ctx.lineWidth = 2.6 + thickEdge * 2;
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, r);
  ctx.stroke();

  // 内侧压合细线
  ctx.strokeStyle = rgba(pal.bamboo, 0.28);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x0 + edgeW, y0 + 18);
  ctx.lineTo(x0 + edgeW, y0 + h - edgeW);
  ctx.lineTo(x0 + w - edgeW, y0 + h - edgeW);
  ctx.lineTo(x0 + w - edgeW, y0 + 18);
  ctx.stroke();

  if (mode === "ziplock") {
    // 拉链自封条（老化时中间裂开微缝、胶条微卷裂纹，并冒出慢漏气丝与淡潮气点）
    const zy = y0 + 54;
    const gap = leak * 14;
    const railColor = leak > 0.1 ? pal.cinnabar : mixHex(pal.tea, "#7b8c98", 0.5);

    ctx.strokeStyle = railColor;
    ctx.lineWidth = 5.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0 + 14, zy - gap * 0.35);
    ctx.quadraticCurveTo(0, zy - gap * 1.45, x0 + w - 14, zy - gap * 0.35);
    ctx.stroke();

    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(x0 + 14, zy + 9 + gap * 0.35);
    ctx.quadraticCurveTo(0, zy + 9 + gap * 1.35, x0 + w - 14, zy + 9 + gap * 0.35);
    ctx.stroke();

    // 胶条老化细裂纹 + 暗缝阴影
    if (leak > 0.08) {
      ctx.save();
      ctx.fillStyle = rgba("#3a1b16", 0.22 * leak);
      ctx.beginPath();
      ctx.ellipse(0, zy + 4, w * 0.28 * leak, Math.max(2, gap * 0.9), 0, 0, TAU * 0.9995);
      ctx.fill();

      ctx.strokeStyle = rgba(pal.cinnabar, 0.72 * leak);
      ctx.lineWidth = 2.2;
      for (const cx of [-w * 0.14, -w * 0.03, w * 0.09]) {
        ctx.beginPath();
        ctx.moveTo(cx, zy - 7);
        ctx.lineTo(cx + 4, zy + 2);
        ctx.lineTo(cx - 2, zy + 11);
        ctx.stroke();
      }

      // 慢漏气波纹 + 逸散微粒向上飘出
      ctx.lineCap = "round";
      for (let i = -2; i <= 2; i++) {
        const bx = i * (w * 0.13);
        const phase = ((frame * 0.042 + (i + 2) * 0.23) % 1 + 1) % 1;
        const rise = phase * 112;
        const a = Math.sin(phase * Math.PI) * leak;
        ctx.globalAlpha = a * 0.72;
        ctx.strokeStyle = i % 2 === 0 ? pal.cinnabar : mixHex(pal.cinnabar, "#7e9cb0", 0.45);
        ctx.lineWidth = i % 2 === 0 ? 3.2 : 2.4;
        ctx.beginPath();
        ctx.moveTo(bx, zy - 4 - rise);
        ctx.quadraticCurveTo(bx + (i % 2 === 0 ? 15 : -13), zy - 26 - rise, bx + i * 4, zy - 52 - rise);
        ctx.stroke();

        // 顶端微弱气珠
        ctx.fillStyle = rgba(pal.cinnabar, 0.55 * a);
        ctx.beginPath();
        ctx.arc(bx + i * 4, zy - 56 - rise, 2.8, 0, TAU * 0.9995);
        ctx.fill();
      }
      ctx.restore();
    }
  } else {
    // 平口袋顶口双层微张弧线 + 柔和内口阴影
    ctx.strokeStyle = rgba(pal.bamboo, 0.48);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x0 + 10, y0 + 8);
    ctx.quadraticCurveTo(0, y0 + 20, x0 + w - 10, y0 + 8);
    ctx.stroke();
    ctx.strokeStyle = rgba("#ffffff", 0.55);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x0 + 14, y0 + 5);
    ctx.quadraticCurveTo(0, y0 + 14, x0 + w - 14, y0 + 5);
    ctx.stroke();
  }

  // 袋面按压凹陷与弹性应力光圈（B3「够厚」手指按压回弹演示）
  if (Math.abs(dentAmt) > 0.02) {
    const absD = Math.min(1.2, Math.abs(dentAmt));
    const press = Math.max(0, dentAmt);
    const rebound = Math.max(0, -dentAmt);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x0 + 6, y0 + 6, w - 12, h - 12, r - 2);
    ctx.clip();

    if (press > 0.02) {
      // 凹陷阴影碗（中心微暗、外圈塑料绷紧高光脊）
      const dRad = Math.min(w, h) * (0.22 + press * 0.12);
      const dentG = ctx.createRadialGradient(
        dentX - 10,
        dentY - 10,
        6,
        dentX,
        dentY,
        dRad,
      );
      dentG.addColorStop(0, rgba("#2d4739", 0.34 * press));
      dentG.addColorStop(0.52, rgba("#3f5c4c", 0.16 * press));
      dentG.addColorStop(0.78, rgba("#ffffff", 0.42 * press));
      dentG.addColorStop(1, rgba("#ffffff", 0));
      ctx.fillStyle = dentG;
      ctx.beginPath();
      ctx.ellipse(dentX, dentY, dRad * 1.12, dRad * 0.92, -0.25, 0, TAU * 0.9995);
      ctx.fill();

      // 放射状厚膜绷紧褶皱（体现 12 丝厚膜的韧劲）
      ctx.strokeStyle = rgba("#ffffff", 0.65 * press);
      ctx.lineWidth = 3.2;
      ctx.lineCap = "round";
      for (let i = 0; i < 6; i++) {
        const a = -0.5 + (i / 6) * TAU;
        const r0 = dRad * 0.38;
        const r1 = dRad * (0.88 + (i % 2) * 0.22);
        ctx.beginPath();
        ctx.moveTo(dentX + Math.cos(a) * r0, dentY + Math.sin(a) * r0);
        ctx.quadraticCurveTo(
          dentX + Math.cos(a + 0.12) * (r0 + r1) * 0.5,
          dentY + Math.sin(a + 0.12) * (r0 + r1) * 0.5,
          dentX + Math.cos(a) * r1,
          dentY + Math.sin(a) * r1,
        );
        ctx.stroke();
      }
      // 凹坑边缘弧形压痕线
      ctx.strokeStyle = rgba(pal.bamboo, 0.52 * press);
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(dentX, dentY, dRad * 0.52, Math.PI * 0.1, Math.PI * 0.95);
      ctx.stroke();
    }

    if (rebound > 0.02) {
      // 回弹瞬间的两道清新弹力波纹
      const ringR = Math.min(w, h) * (0.24 + (1 - rebound) * 0.16);
      ctx.strokeStyle = rgba("#ffffff", 0.65 * Math.min(1, rebound * 3));
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.arc(dentX, dentY, ringR, 0, TAU * 0.9995);
      ctx.stroke();
    }
    void absD;
    ctx.restore();
  }

  ctx.restore();
}

/** 2D 平涂简笔按压手指（暖宣纸国风线稿 + 淡彩平涂，原点为指尖触点） */
export function drawPressFinger(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  opts: { press?: number; scale?: number } = {},
) {
  const { press = 0, scale = 1 } = opts;
  ctx.save();
  ctx.scale(scale, scale);
  // 轻微斜向右下角伸入，指尖在 (0, 0)
  ctx.rotate(0.42 - press * 0.05);

  const skin = "#f1d7bc";
  const skinShade = "#ddb995";
  const nail = "#fbf3ea";
  const sleeve = "#dfd0b6";
  const outline = mixHex(pal.ink, "#4a3828", 0.55);

  // 柔和落影（按下去时影子贴近袋面更实）
  softShadow(
    ctx,
    () => {
      ctx.roundRect(-24, -10, 50, 175, 25);
      ctx.ellipse(24, 155, 58, 72, 0.1, 0, TAU * 0.9995);
    },
    {
      blur: 18 - press * 8,
      dx: 10 - press * 5,
      dy: 16 - press * 9,
      alpha: 0.16 + press * 0.1,
    },
  );

  // 收拢的其余三指（平涂简笔，位于手掌右侧后方）
  ctx.fillStyle = skinShade;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3.6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (let i = 0; i < 3; i++) {
    const fx = 34 + i * 24;
    const fy = 104 + i * 16;
    ctx.beginPath();
    ctx.roundRect(fx - 14, fy - 18, 28, 52, 14);
    ctx.fill();
    ctx.stroke();
  }

  // 手掌主体
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(-24, 118);
  ctx.quadraticCurveTo(-34, 185, -10, 232);
  ctx.lineTo(74, 224);
  ctx.quadraticCurveTo(106, 176, 88, 122);
  ctx.quadraticCurveTo(68, 92, 24, 96);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 伸出的食指（指尖在原点 (0,0)，按压时微扁回弹）
  const tipSquash = 1 + press * 0.08;
  ctx.save();
  ctx.scale(tipSquash, 1 - press * 0.04);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.roundRect(-24, -8, 48, 156, 24);
  ctx.fill();
  // 侧面淡暖阴影条（平涂两色层次）
  ctx.fillStyle = rgba(skinShade, 0.55);
  ctx.beginPath();
  ctx.roundRect(4, 12, 18, 130, 10);
  ctx.fill();
  // 外描边
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3.8;
  ctx.beginPath();
  ctx.roundRect(-24, -8, 48, 156, 24);
  ctx.stroke();

  // 指甲（简笔椭圆）
  ctx.fillStyle = nail;
  ctx.strokeStyle = rgba(outline, 0.55);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-14, 0, 28, 30, 12);
  ctx.fill();
  ctx.stroke();

  // 两道关节细折线
  ctx.strokeStyle = rgba(outline, 0.45);
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-12, 58);
  ctx.quadraticCurveTo(0, 62, 12, 58);
  ctx.moveTo(-13, 104);
  ctx.quadraticCurveTo(0, 108, 13, 104);
  ctx.stroke();
  ctx.restore();

  // 燕麦米袖口（呼应茶室国风）
  ctx.fillStyle = sleeve;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.roundRect(-22, 218, 112, 86, 14);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = rgba(pal.tea, 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, 236);
  ctx.lineTo(82, 236);
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// 3. 鹅颈封口动画袋（挤气力学贴合 → 麻花绞紧 → 连续弯折鹅颈 → 双扎带勒腰闪光）
// ============================================================================

export type GooseneckOpts = {
  /** 挤出空气 0..1 */
  squeeze: number;
  /** 袋口拧成麻花 0..1 */
  twist: number;
  /** 对折成鹅颈状 0..1 */
  fold: number;
  /** 第一道扎带 0..1 */
  tie1: number;
  /** 第二道扎带 0..1 */
  tie2: number;
  /** 帧号 */
  frame: number;
};

export function drawGooseneckBag(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  opts: GooseneckOpts,
) {
  const { squeeze, twist, fold, tie1, tie2, frame } = opts;
  // 袋身随挤气贴合茶饼收缩（保留约一二成自然呼吸余量，绝不抽成真空死褶）
  const bodyW = 482 - squeeze * 58;
  const bodyH = 448 - squeeze * 28;
  const bodyCy = 122;
  const neckBaseY = bodyCy - bodyH / 2 + 14;
  // 双扎带勒紧时整体略带紧实微缩回弹
  const lockGrip = tie1 * 0.5 + tie2 * 0.5;

  ctx.save();

  // 1) 袋身主体（含素雪棉纸茶饼 + 贴合压褶与动态塑料反光）
  const bagPath = () => {
    const hw = bodyW / 2;
    const topPinch = hw * (1 - twist * 0.8) + 18 * twist;
    const shoulderDip = squeeze * 18 + twist * 14;
    ctx.moveTo(-topPinch, neckBaseY);
    ctx.bezierCurveTo(
      -hw * (0.94 - squeeze * 0.04),
      neckBaseY + 46 + shoulderDip,
      -hw,
      bodyCy - 42,
      -hw,
      bodyCy + bodyH * 0.34,
    );
    ctx.quadraticCurveTo(-hw, bodyCy + bodyH / 2, -hw + 28, bodyCy + bodyH / 2);
    ctx.lineTo(hw - 28, bodyCy + bodyH / 2);
    ctx.quadraticCurveTo(hw, bodyCy + bodyH / 2, hw, bodyCy + bodyH * 0.34);
    ctx.bezierCurveTo(
      hw,
      bodyCy - 42,
      hw * (0.94 - squeeze * 0.04),
      neckBaseY + 46 + shoulderDip,
      topPinch,
      neckBaseY,
    );
    ctx.closePath();
  };

  softShadow(ctx, bagPath, { blur: 26, dx: 11, dy: 18, alpha: 0.18 });
  ctx.fillStyle = rgba("#ffffff", pal.dark ? 0.14 : 0.34);
  ctx.beginPath();
  bagPath();
  ctx.fill();

  // 袋内的素雪茶饼（带着原装棉纸）
  ctx.save();
  ctx.beginPath();
  bagPath();
  ctx.clip();
  ctx.translate(0, bodyCy + 14);
  drawSuxueCake(ctx, pal, 178, { seed: 22 });

  // 挤气贴合后，塑料膜在茶饼肩部形成柔和放射折光褶皱
  if (squeeze > 0.08) {
    ctx.save();
    ctx.translate(0, -(bodyCy + 14));
    ctx.strokeStyle = rgba("#ffffff", 0.42 * squeeze);
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    for (const side of [-1, 1] as const) {
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(side * (24 + k * 24), neckBaseY + 18 + k * 14);
        ctx.quadraticCurveTo(
          side * (88 + k * 28),
          neckBaseY + 62 + k * 22,
          side * (bodyW * 0.44 - k * 14),
          bodyCy - 24 + k * 34,
        );
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 前层 PE 高光罩 + 随挤气微移的斜向流光条
  ctx.translate(0, -(bodyCy + 14));
  const sweepShift = (squeeze * 28 + Math.sin(frame * 0.03) * 8);
  const sheen = ctx.createLinearGradient(-bodyW / 2 + sweepShift, neckBaseY, bodyW / 2, bodyCy + bodyH / 2);
  sheen.addColorStop(0, rgba("#ffffff", 0.44));
  sheen.addColorStop(0.32, rgba("#eef5f0", 0.08));
  sheen.addColorStop(0.56, rgba("#ffffff", 0.32));
  sheen.addColorStop(0.78, rgba("#dcebe2", 0.08));
  sheen.addColorStop(1, rgba("#ffffff", 0.16));
  ctx.fillStyle = sheen;
  ctx.fillRect(-bodyW, neckBaseY - 20, bodyW * 2, bodyH + 120);

  // 斜向高光反光带
  ctx.fillStyle = rgba("#ffffff", 0.22 + squeeze * 0.08);
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.34 + sweepShift, neckBaseY);
  ctx.lineTo(-bodyW * 0.21 + sweepShift, neckBaseY);
  ctx.lineTo(-bodyW * 0.44 + sweepShift, bodyCy + bodyH * 0.55);
  ctx.lineTo(-bodyW * 0.56 + sweepShift, bodyCy + bodyH * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 加厚袋身外轮廓 + 侧边双线热封质感
  ctx.strokeStyle = rgba(pal.bamboo, 0.76);
  ctx.lineWidth = 4;
  ctx.beginPath();
  bagPath();
  ctx.stroke();

  // 挤气阶段：两侧柔和向内挤压提示弧 + 5 道渐细气流与微气泡向上排出
  if (squeeze > 0.04 && twist < 0.75) {
    const airAlpha = Math.sin(clamp01(squeeze) * Math.PI) * (1 - twist);
    ctx.save();
    // 两侧轻柔向内收拢的弧形压感提示（不画生硬大箭头，用克制水墨双弧）
    const pressIn = squeeze * 26;
    ctx.strokeStyle = rgba(pal.bamboo, 0.52 * airAlpha);
    ctx.lineWidth = 4.2;
    ctx.lineCap = "round";
    for (const side of [-1, 1] as const) {
      const px = side * (bodyW / 2 + 46 - pressIn);
      ctx.beginPath();
      ctx.arc(px + side * 26, bodyCy - 18, 56, side === -1 ? -0.45 : Math.PI - 0.45, side === -1 ? 0.45 : Math.PI + 0.45);
      ctx.stroke();
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(px + side * 44, bodyCy - 18, 44, side === -1 ? -0.35 : Math.PI - 0.35, side === -1 ? 0.35 : Math.PI + 0.35);
      ctx.stroke();
      ctx.lineWidth = 4.2;
    }

    // 5 道向袋口外逸出的柔和气流丝 + 顶珠
    for (let i = -2; i <= 2; i++) {
      const ph = ((frame * 0.068 + (i + 2) * 0.19) % 1 + 1) % 1;
      const sx = i * 44 * (1 - squeeze * 0.22);
      const sy = neckBaseY - 26 - ph * 140;
      const a = Math.sin(ph * Math.PI) * airAlpha;
      ctx.globalAlpha = a;
      ctx.strokeStyle = pal.bamboo;
      ctx.lineWidth = 3.8 - Math.abs(i) * 0.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy + 52);
      ctx.quadraticCurveTo(sx + i * 16, sy + 22, sx + i * 8, sy);
      ctx.stroke();

      ctx.fillStyle = rgba(pal.bamboo, 0.65);
      ctx.beginPath();
      ctx.arc(sx + i * 8, sy - 6, 3.2 - Math.abs(i) * 0.4, 0, TAU * 0.9995);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2) 袋口颈部：连续演进（宽袋口 → 绞成麻花 → 平滑折弯成 U 形鹅颈 → 双扎带勒腰）
  const neckW = bodyW * 0.9 * (1 - twist * 0.84) + 34 * twist;
  const neckH = 224;

  if (fold < 0.02) {
    // 宽口 → 麻花螺旋绞紧
    ctx.save();
    const topFlare = neckW * (1 + (1 - twist) * 0.08 + twist * 0.52);
    const waistW = neckW * (1 - twist * 0.24);
    const gNeck = ctx.createLinearGradient(-neckW, neckBaseY, neckW, neckBaseY - neckH);
    gNeck.addColorStop(0, rgba("#ffffff", 0.48));
    gNeck.addColorStop(0.45, rgba("#dcebe2", 0.64));
    gNeck.addColorStop(0.75, rgba("#ffffff", 0.5));
    gNeck.addColorStop(1, rgba("#e4efe8", 0.36));
    ctx.fillStyle = gNeck;
    ctx.beginPath();
    ctx.moveTo(-neckW * 0.52, neckBaseY + 6);
    ctx.bezierCurveTo(
      -waistW * 0.48,
      neckBaseY - neckH * 0.42,
      -waistW * 0.44,
      neckBaseY - neckH * 0.74,
      -topFlare * 0.56,
      neckBaseY - neckH,
    );
    ctx.lineTo(topFlare * 0.56, neckBaseY - neckH);
    ctx.bezierCurveTo(
      waistW * 0.44,
      neckBaseY - neckH * 0.74,
      waistW * 0.48,
      neckBaseY - neckH * 0.42,
      neckW * 0.52,
      neckBaseY + 6,
    );
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(pal.bamboo, 0.76);
    ctx.lineWidth = 3.4;
    ctx.stroke();

    // 拧麻花时的前后交错螺旋光影棱纹（带高光脊 + 压痕暗沟）
    if (twist > 0.06) {
      const twistShift = twist * 14;
      for (let k = 0; k < 6; k++) {
        const yy = neckBaseY - 22 - k * 32 - twistShift * 0.35;
        if (yy < neckBaseY - neckH + 18) continue;
        const hw = Math.max(15, waistW * 0.5);
        // 暗折沟
        ctx.strokeStyle = rgba(pal.bamboo, 0.68 * twist);
        ctx.lineWidth = 3.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-hw, yy + 11);
        ctx.bezierCurveTo(-hw * 0.25, yy - 2, hw * 0.25, yy - 6, hw, yy - 13);
        ctx.stroke();
        // 高光脊
        ctx.strokeStyle = rgba("#ffffff", 0.65 * twist);
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.85, yy + 6);
        ctx.quadraticCurveTo(0, yy - 6, hw * 0.85, yy - 16);
        ctx.stroke();
      }
    }
    ctx.restore();
  } else {
    // 连续弯折鹅颈 U 形：fold 0→1 时顶部麻花从竖直流畅弯曲 180° 贴向右侧下方！
    const bendH = 128;
    const theta = fold * Math.PI; // 0 = 竖直向上, PI = 完全对折向下
    const archR = 44;
    const baseX = -18 * fold;
    const pivotX = baseX + archR * Math.sin(theta * 0.5);
    const pivotY = neckBaseY - bendH;
    const tailLen = 122;

    // 计算平滑折弯后的终点与切向
    const arcCx = baseX + archR;
    const arcCy = pivotY;
    const endAngle = Math.PI + theta;
    const arcEndX = arcCx + Math.cos(endAngle) * archR;
    const arcEndY = arcCy + Math.sin(endAngle) * archR;
    // 切线方向（顺时针旋转 90°）
    const tanX = -Math.sin(endAngle);
    const tanY = Math.cos(endAngle);
    const tailEndX = arcEndX + tanX * (tailLen * (0.45 + 0.55 * fold));
    const tailEndY = arcEndY + tanY * (tailLen * (0.45 + 0.55 * fold));

    // 扎带勒紧时，鹅颈双管微微向中轴收束
    const cinchScaleX = 1 - lockGrip * 0.08;

    ctx.save();
    ctx.scale(cinchScaleX, 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const drawGoosePath = () => {
      ctx.moveTo(baseX, neckBaseY + 6);
      ctx.lineTo(baseX, pivotY);
      ctx.arc(arcCx, arcCy, archR, Math.PI, endAngle, false);
      ctx.lineTo(tailEndX, tailEndY);
    };

    // 鹅颈软投影
    softShadow(ctx, drawGoosePath, { blur: 16, dx: 6, dy: 10, alpha: 0.14 });

    // 外描边（加厚 PE 轮廓）
    ctx.strokeStyle = rgba(pal.bamboo, 0.8);
    ctx.lineWidth = 42;
    ctx.beginPath();
    drawGoosePath();
    ctx.stroke();

    // 管体底色
    ctx.strokeStyle = rgba("#e4efe8", 0.94);
    ctx.lineWidth = 34;
    ctx.beginPath();
    drawGoosePath();
    ctx.stroke();

    // 管体中心立体高光脊（呈现塑料圆柱光泽）
    ctx.strokeStyle = rgba("#ffffff", 0.62);
    ctx.lineWidth = 10;
    ctx.beginPath();
    drawGoosePath();
    ctx.stroke();

    // 鹅颈双管的麻花斜棱纹
    ctx.strokeStyle = rgba(pal.bamboo, 0.54);
    ctx.lineWidth = 2.8;
    for (let k = 0; k < 4; k++) {
      const yy = neckBaseY - 18 - k * 28;
      ctx.beginPath();
      ctx.moveTo(baseX - 15, yy + 7);
      ctx.lineTo(baseX + 15, yy - 7);
      ctx.stroke();
    }
    if (fold > 0.45) {
      const aTail = clamp01((fold - 0.45) * 2);
      ctx.strokeStyle = rgba(pal.bamboo, 0.48 * aTail);
      for (let k = 1; k <= 3; k++) {
        const u = k * 0.25;
        const px = arcEndX + tanX * tailLen * u;
        const py = arcEndY + tanY * tailLen * u;
        const nx = -tanY;
        const ny = tanX;
        ctx.beginPath();
        ctx.moveTo(px - nx * 14 - tanX * 5, py - ny * 14 - tanY * 5);
        ctx.lineTo(px + nx * 14 + tanX * 5, py + ny * 14 + tanY * 5);
        ctx.stroke();
      }
    }

    // 鹅颈尾部散开的小伞口（随切向自然旋转）
    const fanAngle = Math.atan2(tanY, tanX) - Math.PI / 2;
    ctx.save();
    ctx.translate(tailEndX, tailEndY);
    ctx.rotate(fanAngle);
    ctx.fillStyle = rgba("#e8f2ec", 0.88);
    ctx.strokeStyle = rgba(pal.bamboo, 0.76);
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-16, -4);
    ctx.lineTo(-36, 36);
    ctx.quadraticCurveTo(0, 44, 36, 32);
    ctx.lineTo(16, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 两道扎带（勒腰暗褶 + 齿纹带身 + 锁扣 + 锁紧瞬间高光星闪）
    const drawTie = (yy: number, p: number, seedOffset: number) => {
      if (p <= 0.01) return;
      // 模拟瞬间收紧的弹性过冲回弹
      const snap = p < 0.7 ? p / 0.7 : 1 + Math.sin(((p - 0.7) / 0.3) * Math.PI) * 0.06;
      const cinch = 1 - 0.19 * clamp01(p);
      const lx = (baseX - 28) * cinch;
      const rx = (arcCx + archR + 26) * cinch;
      const wTie = rx - lx;

      ctx.save();
      ctx.globalAlpha = clamp01(p * 1.6);

      // 勒紧时上下紧挨的塑料袋挤压暗褶（真实“勒死”收腰感！）
      ctx.strokeStyle = rgba("#2d4739", 0.36 * p);
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(lx + 6, yy - 11);
      ctx.lineTo(rx - 6, yy - 11);
      ctx.moveTo(lx + 6, yy + 11);
      ctx.lineTo(rx - 6, yy + 11);
      ctx.stroke();

      // 扎带主体（带立体圆柱渐变与细齿纹）
      const tieG = ctx.createLinearGradient(0, yy - 9, 0, yy + 9);
      tieG.addColorStop(0, mixHex(pal.cinnabar, "#f6b29f", 0.28));
      tieG.addColorStop(0.45, pal.cinnabar);
      tieG.addColorStop(1, mixHex(pal.cinnabar, "#3b130e", 0.42));
      ctx.fillStyle = tieG;
      ctx.beginPath();
      ctx.roundRect(lx, yy - 8.5 * snap, wTie, 17 * snap, 7);
      ctx.fill();

      // 扎带横向细防滑齿纹
      ctx.strokeStyle = rgba("#3b130e", 0.25);
      ctx.lineWidth = 1.4;
      for (let gx = lx + 12; gx < rx - 22; gx += 9) {
        ctx.beginPath();
        ctx.moveTo(gx, yy - 5);
        ctx.lineTo(gx, yy + 5);
        ctx.stroke();
      }

      // 锁扣方块（立体高光）
      ctx.fillStyle = mixHex(pal.cinnabar, "#2b100c", 0.38);
      ctx.beginPath();
      ctx.roundRect(rx - 18, yy - 12, 24, 24, 5);
      ctx.fill();
      ctx.fillStyle = rgba("#ffd7c8", 0.36);
      ctx.fillRect(rx - 14, yy - 9, 16, 4);

      // 向右拉出的紧绷扎带尾条
      ctx.strokeStyle = pal.cinnabar;
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(rx + 4, yy);
      ctx.quadraticCurveTo(rx + 26 * p, yy - 1, rx + 50 * p, yy - 6);
      ctx.stroke();

      // 勒紧到位瞬间的四芒紧固闪光（提示「勒死锁紧」）
      if (p > 0.55 && p < 0.99) {
        const spark = Math.sin(((p - 0.55) / 0.44) * Math.PI);
        const sx = rx - 6;
        const sy = yy;
        const sr = 26 * spark;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(seedOffset * 0.4);
        ctx.strokeStyle = rgba("#fff6d6", 0.92 * spark);
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-sr, 0);
        ctx.lineTo(sr, 0);
        ctx.moveTo(0, -sr);
        ctx.lineTo(0, sr);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    };

    drawTie(neckBaseY - 46, tie1, 1);
    drawTie(neckBaseY - 82, tie2, 2);

    ctx.restore();
    // 消除 unused 警告（pivotX 辅助定位）
    void pivotX;
  }

  ctx.restore();
}

// ============================================================================
// 4. 纯铝箔袋 vs 镀铝袋（强光丁达尔光柱透射对比 + 逆光金边 + 金属硬折痕反光）
// ============================================================================

export type FoilBagOpts = {
  /** true = 真纯铝箔袋（不透光、硬挺）；false = 镀铝袋（强光一照透亮） */
  pure?: boolean;
  /** 背后强光强度 0..1 */
  backlight?: number;
  /** 右上角折痕程度 0..1（真纯铝折痕硬挺不回弹） */
  foldCrease?: number;
  /** 拉开顶部袋口看清内部 0..1 */
  openFlap?: number;
  /** 内部回调（openFlap > 0 时显露） */
  inside?: () => void;
  /** 可选帧号（驱动金属流光与强光微尘呼吸） */
  frame?: number;
};

export function drawFoilBag(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: FoilBagOpts = {},
) {
  const { pure = true, backlight = 0, foldCrease = 0, openFlap = 0, inside, frame = 0 } = opts;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const r = 10;

  ctx.save();

  // 1) 背后强光体积光晕 + 斜向丁达尔光束（让「对着强光一照」瞬间具备物理沉浸感）
  if (backlight > 0.02) {
    const pulse = 1 + Math.sin(frame * 0.07) * 0.03;
    const bgGlow = ctx.createRadialGradient(0, -16, 14, 0, -16, w * 0.92 * pulse);
    bgGlow.addColorStop(0, rgba("#fff9dc", 0.96 * backlight));
    bgGlow.addColorStop(0.38, rgba("#ffe08a", 0.56 * backlight));
    bgGlow.addColorStop(0.72, rgba("#f2b84b", 0.16 * backlight));
    bgGlow.addColorStop(1, rgba("#f2b84b", 0));
    ctx.fillStyle = bgGlow;
    ctx.beginPath();
    ctx.arc(0, -16, w * 0.92 * pulse, 0, TAU * 0.9995);
    ctx.fill();

    // 放射强光射线（真纯铝完全被袋身截断，只在袋身外圈露出逆光边缘射线！）
    ctx.save();
    ctx.globalAlpha = 0.28 * backlight;
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI * 0.85 + (i / 7) * Math.PI * 1.7 + Math.sin(frame * 0.02 + i) * 0.03;
      const len = w * (0.72 + (i % 2) * 0.22);
      const rg = ctx.createLinearGradient(0, -16, Math.cos(a) * len, -16 + Math.sin(a) * len);
      rg.addColorStop(0, rgba("#fff7d1", 0.8));
      rg.addColorStop(1, rgba("#ffd770", 0));
      ctx.strokeStyle = rg;
      ctx.lineWidth = 18 + (i % 3) * 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(Math.cos(a) * len, -16 + Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  softShadow(ctx, () => ctx.roundRect(x0, y0, w, h, r), {
    blur: 24,
    dx: 12,
    dy: 18,
    alpha: 0.24,
  });

  // 2) 如果顶部拉开，先画内腔 + 内部物体（例如透明 PE 袋裹着的素雪茶饼）
  const cutY = y0 + openFlap * h * 0.56;
  if (openFlap > 0.02) {
    const backG = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
    backG.addColorStop(0, "#8f8a81");
    backG.addColorStop(0.5, "#747068");
    backG.addColorStop(1, "#9a958b");
    ctx.fillStyle = backG;
    ctx.beginPath();
    ctx.roundRect(x0, y0, w, h, r);
    ctx.fill();

    if (inside) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x0 + 14, y0 + 12, w - 28, h - 24, r);
      ctx.clip();
      inside();
      ctx.restore();
    }
  }

  // 3) 前袋主体路径（带折角或拉开）
  const foldSz = foldCrease * Math.min(w, h) * 0.36;
  const frontPath = () => {
    const topY = openFlap > 0.02 ? cutY : y0;
    ctx.moveTo(x0 + r, topY);
    if (foldSz > 2 && openFlap < 0.02) {
      ctx.lineTo(x0 + w - foldSz, topY);
      ctx.lineTo(x0 + w, topY + foldSz);
    } else {
      ctx.lineTo(x0 + w - r, topY);
      ctx.quadraticCurveTo(x0 + w, topY, x0 + w, topY + r);
    }
    ctx.lineTo(x0 + w, y0 + h - r);
    ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    ctx.lineTo(x0 + r, y0 + h);
    ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    ctx.lineTo(x0, topY + r);
    ctx.quadraticCurveTo(x0, topY, x0 + r, topY);
    ctx.closePath();
  };

  // 材质渐变：纯铝冷调银灰金属（与暖米宣纸拉开清晰冷暖对比）；镀铝偏轻薄冷白半透感
  const sheenShift = Math.sin(frame * 0.032) * w * 0.08;
  const fg = ctx.createLinearGradient(x0 + sheenShift, y0, x0 + w + sheenShift, y0 + h);
  if (pure) {
    fg.addColorStop(0, "#bfc9d2");
    fg.addColorStop(0.24, "#94a2ae");
    fg.addColorStop(0.48, "#dfe7ee");
    fg.addColorStop(0.72, "#7c8a96");
    fg.addColorStop(1, "#aab6c1");
  } else {
    fg.addColorStop(0, "#e6ecf1");
    fg.addColorStop(0.38, "#c2ccd5");
    fg.addColorStop(0.64, "#f2f6fa");
    fg.addColorStop(1, "#aebbc6");
  }
  ctx.fillStyle = fg;
  ctx.beginPath();
  frontPath();
  ctx.fill();

  // 细微金属冷色高光带与热封压边纹理
  ctx.save();
  ctx.beginPath();
  frontPath();
  ctx.clip();
  // 主斜向冷白金属高光带
  ctx.fillStyle = rgba("#f4faff", pure ? 0.32 : 0.28);
  ctx.beginPath();
  ctx.moveTo(x0 + w * 0.14 + sheenShift, y0);
  ctx.lineTo(x0 + w * 0.31 + sheenShift, y0);
  ctx.lineTo(x0 + w * 0.0 + sheenShift, y0 + h);
  ctx.lineTo(x0 - w * 0.15 + sheenShift, y0 + h);
  ctx.closePath();
  ctx.fill();

  // 第二道细冷色反光棱条（增强厚铝金属质感）
  if (pure) {
    ctx.fillStyle = rgba("#e4f1fc", 0.24);
    ctx.beginPath();
    ctx.moveTo(x0 + w * 0.56 + sheenShift * 0.7, y0);
    ctx.lineTo(x0 + w * 0.63 + sheenShift * 0.7, y0);
    ctx.lineTo(x0 + w * 0.34 + sheenShift * 0.7, y0 + h);
    ctx.lineTo(x0 + w * 0.28 + sheenShift * 0.7, y0 + h);
    ctx.closePath();
    ctx.fill();

    // 左上冷银高光边线 + 右下冷钢暗缘
    ctx.strokeStyle = rgba("#f2f8ff", 0.65);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x0 + r, y0 + 3);
    ctx.lineTo(x0 + w - r, y0 + 3);
    ctx.moveTo(x0 + 3, y0 + r);
    ctx.lineTo(x0 + 3, y0 + h - r);
    ctx.stroke();
  }

  // 三边热封宽边压纹（真纯铝更厚实清晰）
  const rim = pure ? 20 : 13;
  ctx.strokeStyle = rgba("#35434f", pure ? 0.32 : 0.16);
  ctx.lineWidth = pure ? 2.2 : 1.5;
  ctx.strokeRect(x0 + rim, y0 + rim, w - rim * 2, h - rim * 2);
  ctx.restore();

  // 4) 镀铝袋被强光穿透的刺眼透亮光斑 + 廉价镀层微透斑驳（真纯铝完全不透！）
  if (!pure && backlight > 0.02) {
    ctx.save();
    ctx.beginPath();
    frontPath();
    ctx.clip();
    const bleed = ctx.createRadialGradient(0, -16, 10, 0, -16, w * 0.56);
    bleed.addColorStop(0, rgba("#ffffff", 0.98 * backlight));
    bleed.addColorStop(0.32, rgba("#fff0b5", 0.9 * backlight));
    bleed.addColorStop(0.65, rgba("#ffc55c", 0.48 * backlight));
    bleed.addColorStop(1, rgba("#ffb84d", 0));
    ctx.fillStyle = bleed;
    ctx.fillRect(x0, y0, w, h);

    // 廉价镀铝层受强光照射时的细密半透明亮斑/针孔质感
    const rr = rng(314);
    for (let i = 0; i < 22; i++) {
      const px = (rr() - 0.5) * w * 0.62;
      const py = -16 + (rr() - 0.5) * h * 0.52;
      const pr = 6 + rr() * 24;
      const pg = ctx.createRadialGradient(px, py, 0, px, py, pr);
      pg.addColorStop(0, rgba("#ffffff", 0.45 * backlight));
      pg.addColorStop(1, rgba("#ffe49e", 0));
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, TAU * 0.9995);
      ctx.fill();
    }
    ctx.restore();
  }

  // 5) 真纯铝在强光下呈现 100% 实心遮光冷暗调 + 锐利逆光金边（与镀铝袋形成极致反差）
  if (pure && backlight > 0.02) {
    ctx.save();
    ctx.beginPath();
    frontPath();
    ctx.clip();
    const darkCore = ctx.createRadialGradient(0, -10, 20, 0, -10, w * 0.72);
    darkCore.addColorStop(0, rgba("#25303a", 0.36 * backlight));
    darkCore.addColorStop(0.75, rgba("#33404c", 0.24 * backlight));
    darkCore.addColorStop(1, rgba("#536270", 0.08 * backlight));
    ctx.fillStyle = darkCore;
    ctx.fillRect(x0, y0, w, h);
    ctx.restore();

    // 逆光勾勒的锋利金属金边
    ctx.save();
    ctx.strokeStyle = rgba("#fff0b8", 0.86 * backlight);
    ctx.lineWidth = 4.8;
    ctx.beginPath();
    frontPath();
    ctx.stroke();
    ctx.restore();
  }

  // 外框清晰钢墨描边（与暖米底色利落分离）
  ctx.strokeStyle = pure ? rgba("#2b3742", 0.72) : rgba("#465664", 0.48);
  ctx.lineWidth = pure ? 4.2 : 2.6;
  ctx.beginPath();
  frontPath();
  ctx.stroke();

  if (openFlap < 0.02) {
    // 顶部易撕口小三角缺口
    ctx.fillStyle = pal.paper;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + 36);
    ctx.lineTo(x0 + 11, y0 + 41);
    ctx.lineTo(x0, y0 + 46);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x0 + w, y0 + 36);
    ctx.lineTo(x0 + w - 11, y0 + 41);
    ctx.lineTo(x0 + w, y0 + 46);
    ctx.closePath();
    ctx.fill();
  }

  // 6) 真纯铝右上角硬挺死折痕（折下定形不回弹 + 金属棱线高光闪 + 放射应力折纹）
  if (foldSz > 2 && openFlap < 0.02) {
    ctx.save();
    // 折翻三角落下的硬朗投影
    ctx.fillStyle = rgba("#221b14", 0.28);
    ctx.beginPath();
    ctx.moveTo(x0 + w - foldSz, y0);
    ctx.lineTo(x0 + w, y0 + foldSz);
    ctx.lineTo(x0 + w - foldSz + 12, y0 + foldSz + 16);
    ctx.closePath();
    ctx.fill();

    // 折痕下方微细金属应力折纹（体现纯铝硬挺定形质感）
    ctx.strokeStyle = rgba("#474139", 0.34 * foldCrease);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x0 + w - foldSz + 6, y0 + 6);
    ctx.lineTo(x0 + w - foldSz - 24 * foldCrease, y0 + 28 * foldCrease);
    ctx.moveTo(x0 + w - 8, y0 + foldSz - 4);
    ctx.lineTo(x0 + w - 34 * foldCrease, y0 + foldSz + 26 * foldCrease);
    ctx.stroke();

    // 折翻过来的内面铝箔三角
    const fgFold = ctx.createLinearGradient(x0 + w - foldSz, y0 + foldSz, x0 + w, y0);
    fgFold.addColorStop(0, "#f3f0e8");
    fgFold.addColorStop(0.55, "#cfcac0");
    fgFold.addColorStop(1, "#9a9388");
    ctx.fillStyle = fgFold;
    ctx.beginPath();
    ctx.moveTo(x0 + w - foldSz, y0);
    ctx.lineTo(x0 + w - foldSz, y0 + foldSz);
    ctx.lineTo(x0 + w, y0 + foldSz);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(pal.ink, 0.45);
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // 锐利死折脊线（深折沟 + 亮金属脊）
    ctx.strokeStyle = rgba("#3e3830", 0.55);
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(x0 + w - foldSz, y0);
    ctx.lineTo(x0 + w, y0 + foldSz);
    ctx.stroke();

    ctx.strokeStyle = rgba("#ffffff", 0.88);
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(x0 + w - foldSz + 1, y0 + 1);
    ctx.lineTo(x0 + w - 1, y0 + foldSz - 1);
    ctx.stroke();

    // 折合到位瞬间沿折痕扫过的金属反光星闪
    if (foldCrease > 0.35 && foldCrease < 0.99) {
      const sp = Math.sin(((foldCrease - 0.35) / 0.64) * Math.PI);
      const gx = x0 + w - foldSz * (1 - sp * 0.7);
      const gy = y0 + foldSz * (sp * 0.7);
      const sr = 28 * sp;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.strokeStyle = rgba("#ffffff", 0.95 * sp);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-sr, 0);
      ctx.lineTo(sr, 0);
      ctx.moveTo(0, -sr);
      ctx.lineTo(0, sr);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 5. 五层加厚瓦楞纸箱 + 「工」字形封箱胶带
// ============================================================================

export type BoxOpts = {
  /** 顶盖合拢程度 0..1 */
  close?: number;
  /** 「工」字封箱胶带进度 0..1 */
  hTape?: number;
  /** 内部回调（开箱时可见平放茶饼） */
  inside?: () => void;
};

/** 俯视/高角度五层瓦楞纸箱（原点为中心），清晰呈现平放茶饼与「工」字胶带 */
export function drawCorrugatedBoxTop(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: BoxOpts = {},
) {
  const { close = 0, hTape = 0, inside } = opts;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const wall = 22;

  ctx.save();
  softShadow(ctx, () => ctx.roundRect(x0, y0, w, h, 8), {
    blur: 28,
    dx: 14,
    dy: 20,
    alpha: 0.25,
  });

  // 纸箱内腔底色（深牛皮纸褐）
  ctx.fillStyle = "#8a6744";
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, 8);
  ctx.fill();

  // 箱内平放茶饼
  if (inside && close < 0.99) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 + wall, y0 + wall, w - wall * 2, h - wall * 2);
    ctx.clip();
    inside();
    ctx.restore();
  }

  // 四壁厚纸板边框（体现五层加厚质感）
  ctx.strokeStyle = "#b99264";
  ctx.lineWidth = wall;
  ctx.strokeRect(x0 + wall / 2, y0 + wall / 2, w - wall, h - wall);

  // 五层瓦楞波浪切面暗示（顶边与底边细波纹）
  ctx.strokeStyle = rgba("#5e4024", 0.55);
  ctx.lineWidth = 1.8;
  for (const edgeY of [y0 + wall * 0.35, y0 + wall * 0.65, y0 + h - wall * 0.35, y0 + h - wall * 0.65]) {
    ctx.beginPath();
    for (let px = x0 + wall; px <= x0 + w - wall; px += 12) {
      const py = edgeY + ((Math.round(px / 12) % 2 === 0 ? -2.2 : 2.2));
      if (px === x0 + wall) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // 左右折翼箱盖：close = 0 时向外张开；close = 1 时在正中严丝合缝合拢
  const flapW = (w / 2) * (0.28 + 0.72 * close);
  const paintFlap = (side: -1 | 1) => {
    const fx = side === -1 ? x0 : x0 + w - flapW;
    const g = ctx.createLinearGradient(fx, y0, fx + flapW, y0 + h);
    g.addColorStop(0, side === -1 ? "#d3b286" : "#c7a374");
    g.addColorStop(1, side === -1 ? "#bd9768" : "#b08859");
    ctx.fillStyle = g;
    ctx.fillRect(fx, y0, flapW, h);
    ctx.strokeStyle = rgba("#5e4024", 0.45);
    ctx.lineWidth = 2.6;
    ctx.strokeRect(fx, y0, flapW, h);
  };
  if (close > 0.01) {
    paintFlap(-1);
    paintFlap(1);
    // 正中合缝线
    if (close > 0.92) {
      ctx.strokeStyle = rgba("#472f19", 0.52);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(0, y0 + h);
      ctx.stroke();
    }
  }

  // 「工」字形封箱胶带（三道：1 竖封中缝 → 2 顶横封边 → 3 底横封边）
  if (hTape > 0.01) {
    const tapeColor = rgba("#e4be78", 0.82);
    const tapeEdge = rgba("#9c7233", 0.55);
    const tw = 56;
    const pMid = clamp01(hTape * 3);
    const pTop = clamp01((hTape - 0.34) * 3);
    const pBot = clamp01((hTape - 0.67) * 3);

    const drawTapeStrip = (rx: number, ry: number, rw: number, rh: number) => {
      ctx.fillStyle = tapeColor;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = tapeEdge;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(rx, ry, rw, rh);
    };

    if (pMid > 0) drawTapeStrip(-tw / 2, y0 - 8, tw, (h + 16) * pMid);
    if (pTop > 0) drawTapeStrip(x0 - 8, y0 - 6, (w + 16) * pTop, tw * 0.86);
    if (pBot > 0) drawTapeStrip(x0 - 8, y0 + h - tw * 0.86 + 6, (w + 16) * pBot, tw * 0.86);
  }

  // 箱体外框描边
  ctx.strokeStyle = rgba(pal.ink, 0.38);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, 8);
  ctx.stroke();

  ctx.restore();
}

/** 正视/侧视五层瓦楞纸箱（原点为箱底中心，方便逐个往上摞叠；支持压扁鼓肚 + 剖视茶饼裂纹） */
export function drawCorrugatedBoxSide(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: { crush?: number; cutaway?: boolean } = {},
) {
  const { crush = 0, cutaway = false } = opts;
  const hh = h * (1 - crush * 0.34);
  const bulge = crush * 34;
  const hw = w / 2;

  ctx.save();

  const boxOutline = () => {
    ctx.moveTo(-hw, -hh);
    ctx.lineTo(hw, -hh);
    ctx.bezierCurveTo(hw + bulge, -hh * 0.65, hw + bulge, -hh * 0.35, hw, 0);
    ctx.lineTo(-hw, 0);
    ctx.bezierCurveTo(-hw - bulge, -hh * 0.35, -hw - bulge, -hh * 0.65, -hw, -hh);
    ctx.closePath();
  };

  softShadow(ctx, boxOutline, { blur: 18, dx: 6, dy: 10, alpha: 0.2 });

  // 纸箱正立面牛皮纸渐变（柔和温润，不发闷）
  const g = ctx.createLinearGradient(-hw, -hh, hw, 0);
  g.addColorStop(0, "#d4b387");
  g.addColorStop(0.45, "#c39d6f");
  g.addColorStop(1, "#aa8357");
  ctx.fillStyle = g;
  ctx.beginPath();
  boxOutline();
  ctx.fill();

  // 顶盖横缝线 + 中心竖封胶带小段
  ctx.strokeStyle = rgba("#634427", 0.42);
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-hw + 8, -hh + 18);
  ctx.lineTo(hw - 8, -hh + 18);
  ctx.stroke();

  ctx.fillStyle = rgba("#e4be78", 0.72);
  ctx.fillRect(-26, -hh, 52, Math.min(34, hh * 0.26));
  ctx.strokeStyle = rgba("#8d652c", 0.4);
  ctx.lineWidth = 1.6;
  ctx.strokeRect(-26, -hh, 52, Math.min(34, hh * 0.26));

  // 最底箱剖视窗：直接看见箱内平放的素雪茶饼被压扁、裂开
  if (cutaway) {
    const cw = w * 0.76;
    const ch = hh * 0.72;
    const cy = -hh * 0.48;
    ctx.save();
    ctx.fillStyle = "#816141";
    ctx.beginPath();
    ctx.roundRect(-cw / 2, cy - ch / 2, cw, ch, 12);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(-cw / 2 + 4, cy - ch / 2 + 4, cw - 8, ch - 8, 9);
    ctx.clip();

    // 箱内上下两饼素雪茶饼
    const cakeW = cw * 0.84;
    const cakeH = Math.max(32, ch * 0.44);
    ctx.save();
    ctx.translate(0, cy + ch * 0.22);
    drawCakeSide(ctx, pal, cakeW, cakeH, { crush, wrapped: true });
    ctx.restore();
    ctx.save();
    ctx.translate(0, cy - ch * 0.22);
    drawCakeSide(ctx, pal, cakeW, cakeH, { crush: crush * 0.78, wrapped: true });
    ctx.restore();

    // 压碎时散落的几粒茶屑
    if (crush > 0.35) {
      const ca = clamp01((crush - 0.35) / 0.65);
      ctx.fillStyle = rgba("#5c4a30", 0.85 * ca);
      const crumbs = [
        { x: -cw * 0.26, y: cy + ch * 0.35, r: 4.5 },
        { x: -cw * 0.12, y: cy + ch * 0.4, r: 3.5 },
        { x: cw * 0.16, y: cy + ch * 0.38, r: 5 },
        { x: cw * 0.29, y: cy + ch * 0.34, r: 3.8 },
      ];
      crumbs.forEach((cr) => {
        ctx.beginPath();
        ctx.arc(cr.x, cr.y, cr.r, 0, TAU * 0.9995);
        ctx.fill();
      });
    }
    ctx.restore();

    // 剖视框线
    ctx.strokeStyle = rgba("#f2dfb8", 0.78);
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.roundRect(-cw / 2, cy - ch / 2, cw, ch, 12);
    ctx.stroke();
  }

  // 压扁时的纸箱受压折痕（四角内凹折皱）
  if (crush > 0.15) {
    const ca = clamp01((crush - 0.15) / 0.85);
    ctx.strokeStyle = rgba("#4e3118", 0.68 * ca);
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    for (const side of [-1, 1] as const) {
      ctx.beginPath();
      ctx.moveTo(side * (hw + bulge * 0.65), -hh * 0.5);
      ctx.lineTo(side * (hw - 36 * ca), -hh * 0.62);
      ctx.moveTo(side * (hw + bulge * 0.65), -hh * 0.5);
      ctx.lineTo(side * (hw - 32 * ca), -hh * 0.36);
      ctx.stroke();
    }
  }

  // 清晰箱体描边
  ctx.strokeStyle = rgba(pal.ink, 0.52);
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  boxOutline();
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// 6. 铁罐 / 紫砂陶罐外壳（半透剖视：内套前两层袋子的素雪茶饼）
// ============================================================================

export function drawOuterCanister(
  ctx: CanvasRenderingContext2D,
  pal: FxPalette,
  w: number,
  h: number,
  opts: { cutaway?: number; style?: "iron" | "clay" } = {},
) {
  const { cutaway = 0, style = "clay" } = opts;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const lidH = h * 0.22;

  ctx.save();
  softShadow(ctx, () => ctx.roundRect(x0, y0 + 18, w, h - 18, 34), {
    blur: 26,
    dx: 12,
    dy: 18,
    alpha: 0.22,
  });

  // 罐身主体：压低饱和、提亮陶釉高光层次，去掉沉闷深褐块感
  const bodyG = ctx.createLinearGradient(x0, 0, x0 + w, 0);
  if (style === "clay") {
    bodyG.addColorStop(0, "#9d8877");
    bodyG.addColorStop(0.22, "#c6b4a3");
    bodyG.addColorStop(0.42, "#b49f8d");
    bodyG.addColorStop(0.74, "#8b7665");
    bodyG.addColorStop(0.92, "#756152");
    bodyG.addColorStop(1, "#9a8778"); // 右缘环境反光
  } else {
    bodyG.addColorStop(0, "#687570");
    bodyG.addColorStop(0.24, "#9aa7a1");
    bodyG.addColorStop(0.55, "#6b7873");
    bodyG.addColorStop(0.86, "#4c5753");
    bodyG.addColorStop(1, "#6f7c77");
  }
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.roundRect(x0, y0 + lidH * 0.65, w, h - lidH * 0.65, 36);
  ctx.fill();

  // 罐身竖向陶瓷柔光带 + 微妙陶轮横纹（增加通透立体层次）
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x0, y0 + lidH * 0.65, w, h - lidH * 0.65, 36);
  ctx.clip();
  const glossG = ctx.createLinearGradient(x0 + w * 0.14, 0, x0 + w * 0.36, 0);
  glossG.addColorStop(0, rgba("#fff9f0", 0));
  glossG.addColorStop(0.5, rgba("#fff9f0", 0.34));
  glossG.addColorStop(1, rgba("#fff9f0", 0));
  ctx.fillStyle = glossG;
  ctx.fillRect(x0 + w * 0.12, y0 + lidH * 0.65, w * 0.26, h);

  // 顶部肩部柔光晕
  const shoulderG = ctx.createRadialGradient(x0 + w * 0.28, y0 + lidH + 24, 12, x0 + w * 0.28, y0 + lidH + 24, w * 0.42);
  shoulderG.addColorStop(0, rgba("#fff6e8", 0.26));
  shoulderG.addColorStop(1, rgba("#fff6e8", 0));
  ctx.fillStyle = shoulderG;
  ctx.fillRect(x0, y0 + lidH * 0.65, w, h * 0.4);

  // 细雅陶轮水平釉环
  ctx.strokeStyle = rgba("#fff4e4", 0.14);
  ctx.lineWidth = 2;
  for (const frac of [0.34, 0.56, 0.78]) {
    const ly = y0 + lidH + (h - lidH) * frac;
    ctx.beginPath();
    ctx.moveTo(x0 + 16, ly);
    ctx.lineTo(x0 + w - 16, ly);
    ctx.stroke();
  }
  ctx.restore();

  // 罐身细腻外描边
  ctx.strokeStyle = rgba(pal.ink, 0.36);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x0, y0 + lidH * 0.65, w, h - lidH * 0.65, 36);
  ctx.stroke();

  // 罐盖（同色系略浅，带盖沿亮脊）
  const lidG = ctx.createLinearGradient(x0 - 8, 0, x0 + w + 8, 0);
  if (style === "clay") {
    lidG.addColorStop(0, "#ab9684");
    lidG.addColorStop(0.26, "#d4c3b3");
    lidG.addColorStop(0.68, "#937d6b");
    lidG.addColorStop(0.92, "#7d6858");
    lidG.addColorStop(1, "#a28f7f");
  } else {
    lidG.addColorStop(0, "#75827d");
    lidG.addColorStop(0.28, "#a9b6b0");
    lidG.addColorStop(0.7, "#5e6b66");
    lidG.addColorStop(1, "#7b8883");
  }
  ctx.fillStyle = lidG;
  ctx.beginPath();
  ctx.roundRect(x0 - 10, y0 + 16, w + 20, lidH, 24);
  ctx.fill();
  ctx.strokeStyle = rgba(pal.ink, 0.36);
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // 盖顶高光弧线
  ctx.strokeStyle = rgba("#fff8ec", 0.45);
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0 + 28, y0 + 28);
  ctx.lineTo(x0 + w * 0.48, y0 + 28);
  ctx.stroke();

  // 顶钮（带高光点）
  const knobG = ctx.createLinearGradient(-48, y0, 48, y0 + 22);
  knobG.addColorStop(0, style === "clay" ? "#cab8a7" : "#9aa7a1");
  knobG.addColorStop(1, style === "clay" ? "#8b7665" : "#5e6b66");
  ctx.fillStyle = knobG;
  ctx.beginPath();
  ctx.ellipse(0, y0 + 16, 50, 22, 0, Math.PI, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(pal.ink, 0.36);
  ctx.lineWidth = 2.6;
  ctx.stroke();

  // 罐盖腰线高光 + 下缘阴影线
  ctx.strokeStyle = rgba("#fff4e0", 0.42);
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(x0 + 14, y0 + lidH + 14);
  ctx.lineTo(x0 + w - 14, y0 + lidH + 14);
  ctx.stroke();

  // 半透剖视窗：清晰展示里面仍套好前两层袋子（外铝 + 内透明PE + 素雪饼）
  if (cutaway > 0.02) {
    const cw = w * 0.76;
    const ch = (h - lidH) * 0.8;
    const cy = y0 + lidH + (h - lidH) * 0.48;
    ctx.save();
    ctx.globalAlpha *= cutaway;
    ctx.fillStyle = mixHex(pal.paper, "#3a291d", 0.08);
    ctx.beginPath();
    ctx.roundRect(-cw / 2, cy - ch / 2, cw, ch, 24);
    ctx.fill();
    ctx.strokeStyle = rgba("#f3e3c3", 0.82);
    ctx.lineWidth = 3.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(-cw / 2 + 4, cy - ch / 2 + 4, cw - 8, ch - 8, 20);
    ctx.clip();

    // 外层纯铝箔袋拉开半截，露出内层透明PE袋 + 素雪茶饼
    ctx.translate(0, cy + 8);
    drawFoilBag(ctx, pal, cw * 0.84, ch * 0.84, {
      pure: true,
      openFlap: 0.48,
      inside: () => {
        drawPeBag(ctx, pal, cw * 0.72, ch * 0.72, {
          mode: "flat",
          thickEdge: 0.8,
          inside: () => {
            drawSuxueCake(ctx, pal, cw * 0.3, { seed: 22 });
          },
        });
      },
    });
    ctx.restore();
  }

  ctx.restore();
}
