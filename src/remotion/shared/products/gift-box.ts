/**
 * 正上茶舍礼盒（胡桃木纹翻盖木盒，正面平视）与手提袋（深棕木纹纸袋，正面平视）。
 * 盒：左上白色壶形标 + 正|上|茶|舍 + 「正上茶舍 一叶倾心」，左侧竖排金字「福鼎白茶」+ 竖排拼音与细金线，
 *     右侧四角内凹的镂空方章，内衬蓝金织锦；顶边两枚金属合页。
 * 袋：香槟色缎带提手，右下玫瑰金同款方章。
 * 方章的篆字只描外形，不排具体文字。原点为盒 / 袋中心。
 */
import { drawBrandEmblem, drawBrandWordmark } from "./emblem";
import { PKG_KAI, PKG_SONG, alpha, cached, dropShadow, seq, text, vtext, woodGrain } from "./common";

/** 绘制坐标里的盒尺寸（实际大小由 width 缩放） */
const BW = 1150;
const BH = 1110;

/** 四角内凹的「海棠」方框路径 */
function lobedSquare(c: CanvasRenderingContext2D, cx: number, cy: number, s: number, notch: number) {
  const h = s / 2;
  const n = notch;
  c.beginPath();
  c.moveTo(cx - h + n, cy - h);
  c.lineTo(cx + h - n, cy - h);
  c.arc(cx + h, cy - h, n, Math.PI, Math.PI / 2, true);
  c.lineTo(cx + h, cy + h - n);
  c.arc(cx + h, cy + h, n, -Math.PI / 2, Math.PI, true);
  c.lineTo(cx - h + n, cy + h);
  c.arc(cx - h, cy + h, n, 0, -Math.PI / 2, true);
  c.lineTo(cx - h, cy - h + n);
  c.arc(cx - h, cy - h, n, Math.PI / 2, 0, true);
  c.closePath();
}

/** 方章里的篆书笔画（只取外形：两竖、一弯钩、横折与回纹，照片里的结构） */
function sealStrokes(c: CanvasRenderingContext2D, cx: number, cy: number, s: number, w: number) {
  const h = s / 2;
  c.save();
  c.lineWidth = w;
  c.lineCap = "round";
  c.lineJoin = "round";
  const P = (x: number, y: number): [number, number] => [cx + x * h, cy + y * h];
  const path = (pts: [number, number][]) => {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  };
  // 内框（左右各断开一口，照片里的回纹框）
  path([P(-0.86, -0.25), P(-0.86, -0.86), P(-0.25, -0.86)]);
  path([P(0.1, -0.86), P(0.86, -0.86), P(0.86, -0.3)]);
  path([P(0.86, 0.2), P(0.86, 0.86), P(0.1, 0.86)]);
  path([P(-0.25, 0.86), P(-0.86, 0.86), P(-0.86, 0.3)]);
  // 左字：横、两竖、底钩
  path([P(-0.7, -0.15), P(-0.12, -0.15)]);
  path([P(-0.55, -0.6), P(-0.55, 0.62)]);
  path([P(-0.3, -0.4), P(-0.3, 0.62)]);
  path([P(-0.7, 0.2), P(-0.62, 0.2)]);
  // 中间长弯钩
  c.beginPath();
  c.moveTo(...P(0.0, -0.55));
  c.bezierCurveTo(...P(-0.12, -0.1), ...P(0.02, 0.35), ...P(0.25, 0.7));
  c.stroke();
  // 右字：顶盖与竖折
  path([P(0.12, -0.62), P(0.62, -0.62), P(0.62, -0.42)]);
  path([P(0.3, -0.62), P(0.3, 0.62)]);
  path([P(0.48, -0.25), P(0.7, -0.25), P(0.7, 0.05), P(0.55, 0.05)]);
  path([P(0.48, 0.25), P(0.48, 0.62)]);
  c.restore();
}

/** 蓝金织锦（扇形鳞纹） */
function brocade(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  c.save();
  c.fillStyle = "#2a2a6b";
  c.fillRect(x, y, w, h);
  const r = seq(77);
  const step = w / 7;
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const cx = x + col * step + (row % 2 ? step / 2 : 0);
      const cy = y + row * step * 0.6;
      const pal = ["#3b6fb6", "#57b3c9", "#c99151", "#e3c07a", "#4b3e8f"];
      for (let k = 0; k < 7; k++) {
        const a = Math.PI * (1.08 + (k / 6) * 0.84);
        c.strokeStyle = alpha(pal[Math.floor(r() * pal.length)], 0.8);
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(cx, cy + step * 0.45);
        c.lineTo(cx + Math.cos(a) * step * 0.55, cy + step * 0.45 + Math.sin(a) * step * 0.55);
        c.stroke();
      }
    }
  }
  c.restore();
}

function paintBox(c: CanvasRenderingContext2D) {
  c.save();
  c.translate(BW / 2, BH / 2);
  const x0 = -BW / 2;
  const y0 = -BH / 2;
  // 胡桃木底
  const base = c.createLinearGradient(x0, y0, -x0, -y0);
  base.addColorStop(0, "#6a4a36");
  base.addColorStop(0.5, "#5b3d2c");
  base.addColorStop(1, "#4b3122");
  c.fillStyle = base;
  c.fillRect(x0, y0, BW, BH);
  woodGrain(c, x0, y0, BW, BH, 41, "#2a170d", 1.1);
  // 右侧厚度暗边
  c.fillStyle = alpha("#2a170d", 0.35);
  c.fillRect(BW / 2 - 40, y0, 40, BH);
  c.fillStyle = alpha("#e9c9a6", 0.12);
  c.fillRect(BW / 2 - 42, y0, 3, BH);
  // 顶边合页
  for (const hx of [-BW * 0.32, BW * 0.4]) {
    const g = c.createLinearGradient(hx, y0 - 8, hx, y0 + 12);
    g.addColorStop(0, "#e6cf9a");
    g.addColorStop(1, "#8d7445");
    c.fillStyle = g;
    c.fillRect(hx - 45, y0 - 4, 90, 14);
  }

  // 左上白标：官方 logo 原图描出的矢量，整套单色白
  const lx = x0 + BW * 0.15;
  drawBrandEmblem(c, lx, y0 + BH * 0.13, BH * 0.1, "#f7f2ea");
  drawBrandWordmark(c, lx, y0 + BH * 0.212, BH * 0.026, "#f7f2ea");
  text(c, "正上茶舍   一叶倾心", lx, y0 + BH * 0.258, BH * 0.02, "#f7f2ea", PKG_KAI, 700);

  // 左侧竖排金字「福鼎白茶」+ 拼音 + 细金线
  const gold = c.createLinearGradient(0, y0 + BH * 0.4, 0, y0 + BH * 0.85);
  gold.addColorStop(0, "#f3dfa8");
  gold.addColorStop(0.5, "#cfae6a");
  gold.addColorStop(1, "#f0d99c");
  vtext(c, "福鼎白茶", x0 + BW * 0.14, y0 + BH * 0.62, BH * 0.085, gold, PKG_SONG, 500, 1.35);
  c.save();
  c.translate(x0 + BW * 0.215, y0 + BH * 0.62);
  c.rotate(Math.PI / 2);
  text(c, "FU DING BAI CHA", 0, 0, BH * 0.022, gold, PKG_SONG, 500);
  c.restore();
  c.fillStyle = gold;
  c.fillRect(x0 + BW * 0.24, y0 + BH * 0.42, 2, BH * 0.4);

  // 右侧镂空方章：先织锦，再挖出木纹留下篆字笔画（照片里是木头笔画压在织锦上）
  const sx = x0 + BW * 0.665;
  const sy = y0 + BH * 0.55;
  const ss = BH * 0.4;
  c.save();
  lobedSquare(c, sx, sy, ss, ss * 0.12);
  c.clip();
  brocade(c, sx - ss / 2, sy - ss / 2, ss, ss);
  // 内凹阴影
  c.strokeStyle = alpha("#120a05", 0.55);
  c.lineWidth = 10;
  lobedSquare(c, sx, sy, ss, ss * 0.12);
  c.stroke();
  // 木色笔画
  c.strokeStyle = "#5a3c2b";
  sealStrokes(c, sx, sy, ss, ss * 0.06);
  c.restore();
  // 外圈木框（镂空的边）
  c.strokeStyle = "#5a3c2b";
  c.lineWidth = ss * 0.045;
  lobedSquare(c, sx, sy, ss * 0.94, ss * 0.11);
  c.stroke();

  c.restore();
}

/** 绘制礼盒（原点为中心，width 为像素宽度） */
export function drawGiftBox(ctx: CanvasRenderingContext2D, width: number) {
  const sc = width / BW;
  ctx.save();
  ctx.scale(sc, sc);
  dropShadow(ctx, () => {
    ctx.beginPath();
    ctx.rect(-BW / 2, -BH / 2, BW, BH);
  }, 30, 14, 24, 0.3);
  const surf = cached("product:giftbox", BW, BH, paintBox);
  if (surf) ctx.drawImage(surf, -BW / 2, -BH / 2, BW, BH);
  ctx.restore();
}

export const GIFT_BOX_ASPECT = BH / BW;

// ---------------------------------------------------------------------------
// 手提袋
// ---------------------------------------------------------------------------
const GW = 1060;
const GH = 1020;

function paintBag(c: CanvasRenderingContext2D) {
  c.save();
  c.translate(GW / 2, GH * 0.62);
  const w = GW;
  const h = GH * 0.76;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const base = c.createLinearGradient(x0, y0, -x0, -y0);
  base.addColorStop(0, "#6b3f2e");
  base.addColorStop(1, "#4e2b1f");
  c.fillStyle = base;
  c.fillRect(x0, y0, w, h);
  woodGrain(c, x0, y0, w, h, 53, "#22110a", 1.3);
  // 底部折边
  c.fillStyle = alpha("#22110a", 0.25);
  c.fillRect(x0, -y0 - h * 0.1, w, 3);
  // 左侧袋身折线
  c.fillStyle = alpha("#22110a", 0.3);
  c.fillRect(x0, y0, 24, h);

  // 玫瑰金方章
  const sx = x0 + w * 0.79;
  const sy = y0 + h * 0.6;
  const ss = h * 0.42;
  const rg = c.createLinearGradient(sx - ss / 2, sy - ss / 2, sx + ss / 2, sy + ss / 2);
  rg.addColorStop(0, "#e9b9a1");
  rg.addColorStop(0.5, "#c98d72");
  rg.addColorStop(1, "#e7b69c");
  c.fillStyle = rg;
  lobedSquare(c, sx, sy, ss, ss * 0.12);
  c.fill();
  c.strokeStyle = "#5c3224";
  c.lineWidth = ss * 0.04;
  lobedSquare(c, sx, sy, ss * 0.9, ss * 0.1);
  c.stroke();
  sealStrokes(c, sx, sy, ss, ss * 0.06);
  c.restore();

  // 缎带提手（香槟色，从袋口两孔弯下）
  c.save();
  c.translate(GW / 2, GH * 0.62);
  c.strokeStyle = "#e2c1a0";
  c.lineWidth = 34;
  c.lineCap = "butt";
  // 照片里提手从袋口两侧垂下来，搭在袋面上（U 形下垂到袋身约 45% 处）
  c.beginPath();
  c.moveTo(-w * 0.17, y0 + 4);
  c.bezierCurveTo(-w * 0.2, y0 + h * 0.42, w * 0.06, y0 + h * 0.62, w * 0.2, y0 + 4);
  c.stroke();
  c.strokeStyle = alpha("#8f6a48", 0.5);
  c.lineWidth = 2;
  c.stroke();
  c.restore();
}

/** 绘制手提袋（原点为袋身中心偏上，width 为像素宽度） */
export function drawGiftBag(ctx: CanvasRenderingContext2D, width: number) {
  const sc = width / GW;
  ctx.save();
  ctx.scale(sc, sc);
  // 袋身在画布里的位置：中心在 GH*0.62，高 GH*0.76
  dropShadow(ctx, () => {
    ctx.beginPath();
    ctx.rect(-GW / 2, GH * 0.62 - GH * 0.38 - GH / 2, GW, GH * 0.76);
  }, 26, 12, 20, 0.28);
  const surf = cached("product:giftbag", GW, GH, paintBag);
  if (surf) ctx.drawImage(surf, -GW / 2, -GH / 2, GW, GH);
  ctx.restore();
}

export const GIFT_BAG_ASPECT = GH / GW;
