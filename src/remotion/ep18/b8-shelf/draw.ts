import { fillPaper } from "@/remotion/shared/draw-paper";
import { FONT, easeOutCubic, PAPER_THEMES, type AnimParams } from "@/remotion/shared/theme";
import { soloAlpha } from "@/remotion/ep18/shared/beat-draw";
import { FLOOR_AT, SCENE_AT, SHELF_AT, WALL_AT } from "./data";

const WALL_X = 90;
const WALL_W = 70;
const WALL_TOP = 320;
const GAP_W = 150;
const CAB_X = WALL_X + WALL_W + GAP_W;
const CAB_W = 560;
const FLOOR_Y = 1580;
const LEG_H = 110;
const CAB_BOT = FLOOR_Y - LEG_H;
const CAB_TOP = 430;
const CAB_H = CAB_BOT - CAB_TOP;
const BOX_W = 260;
const BOX_H = 150;
const BOX_X = CAB_X + (CAB_W - BOX_W) / 2;
const BOX_Y = 770;

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);
  const theme = PAPER_THEMES[params.paperTheme ?? "classic"] ?? PAPER_THEMES.classic;
  const fontScale = params.fontScale ?? 1;
  const frame = (elapsed / 1000) * 29.97;
  const scene = soloAlpha(frame, SCENE_AT);
  if (scene <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = scene;

  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(70, FLOOR_Y);
  ctx.lineTo(1010, FLOOR_Y);
  ctx.stroke();
  ctx.fillStyle = theme.paperDeep;
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 6;
  ctx.fillRect(WALL_X, WALL_TOP, WALL_W, FLOOR_Y - WALL_TOP);
  ctx.strokeRect(WALL_X, WALL_TOP, WALL_W, FLOOR_Y - WALL_TOP);

  ctx.fillStyle = "#c4a574";
  round(ctx, CAB_X, CAB_TOP, CAB_W, CAB_H, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e2cba0";
  round(ctx, CAB_X + 18, CAB_TOP + 18, CAB_W - 36, CAB_H - 36, 6);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#8a6840";
  ctx.lineWidth = 2.5;
  for (const y of [640, 920, 1200]) {
    round(ctx, CAB_X + 28, y, CAB_W - 56, 22, 3);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#6d5236";
  ctx.lineWidth = 4;
  round(ctx, CAB_X + 36, CAB_BOT, 44, LEG_H, 4);
  ctx.fill();
  ctx.stroke();
  round(ctx, CAB_X + CAB_W - 80, CAB_BOT, 44, LEG_H, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#5a3720";
  ctx.lineWidth = 5;
  round(ctx, BOX_X, BOX_Y, BOX_W, BOX_H, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = theme.paper;
  ctx.font = `600 56px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("茶", BOX_X + BOX_W / 2, BOX_Y + BOX_H / 2);

  ctx.fillStyle = theme.ink;
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText("墙", WALL_X + WALL_W / 2, WALL_TOP + 52);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = theme.ink;
  ctx.font = `500 32px ${FONT}`;
  ctx.fillText("地", 540, 1810);
  ctx.restore();

  const wall = soloAlpha(frame, WALL_AT);
  if (wall > 0.01) {
    const g = easeOutCubic(Math.min(1, (frame - WALL_AT) / 12));
    ctx.save();
    ctx.globalAlpha = scene * wall;
    ctx.fillStyle = theme.seal;
    ctx.globalAlpha = scene * wall * 0.2;
    ctx.fillRect(WALL_X + WALL_W, CAB_TOP, GAP_W * g, CAB_H);
    ctx.globalAlpha = scene * wall;
    ctx.strokeStyle = theme.seal;
    ctx.setLineDash([14, 12]);
    ctx.lineWidth = 4;
    ctx.strokeRect(WALL_X + WALL_W + 4, CAB_TOP + 4, Math.max(0, GAP_W * g - 8), CAB_H - 8);
    ctx.setLineDash([]);
    braceH(ctx, WALL_X + WALL_W, 980, GAP_W, theme.seal);
    const rule1 = params.customTexts?.rule1 || "离墙一尺";
    chip(ctx, WALL_X + WALL_W + GAP_W / 2, 900, rule1, theme.paper, theme.seal, fontScale);
    ctx.restore();
  }

  const floor = soloAlpha(frame, FLOOR_AT);
  if (floor > 0.01) {
    const g = easeOutCubic(Math.min(1, (frame - FLOOR_AT) / 12));
    ctx.save();
    ctx.globalAlpha = scene * floor * 0.2;
    ctx.fillStyle = theme.seal;
    ctx.fillRect(CAB_X, FLOOR_Y - LEG_H * g, CAB_W, LEG_H * g);
    ctx.globalAlpha = scene * floor;
    ctx.strokeStyle = theme.seal;
    ctx.setLineDash([14, 12]);
    ctx.lineWidth = 4;
    ctx.strokeRect(CAB_X + 4, FLOOR_Y - LEG_H * g + 4, CAB_W - 8, Math.max(0, LEG_H * g - 8));
    ctx.setLineDash([]);
    braceV(ctx, CAB_X + 86, CAB_BOT, LEG_H, theme.seal);
    const rule2 = params.customTexts?.rule2 || "离地半尺";
    chip(ctx, CAB_X + 86 - 160, CAB_BOT + LEG_H / 2, rule2, theme.paper, theme.seal, fontScale);
    ctx.restore();
  }

  const shelf = soloAlpha(frame, SHELF_AT);
  if (shelf > 0.01) {
    const action = params.customTexts?.action || params.customTexts?.reason || "架起来放";
    ctx.save();
    ctx.globalAlpha = scene * shelf;
    ctx.fillStyle = theme.paper;
    round(ctx, 300, 110, 480, 100, 16);
    ctx.fill();
    ctx.fillStyle = theme.seal;
    ctx.font = `600 ${Math.round(64 * fontScale)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(action, 540, 160);
    ctx.restore();
  }

  ctx.restore();
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function braceH(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, sealColor: string) {
  ctx.strokeStyle = sealColor;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x, y + 22);
  ctx.moveTo(x + w, y - 22);
  ctx.lineTo(x + w, y + 22);
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}

function braceV(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, sealColor: string) {
  ctx.strokeStyle = sealColor;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 22, y);
  ctx.lineTo(x + 22, y);
  ctx.moveTo(x - 22, y + h);
  ctx.lineTo(x + 22, y + h);
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.stroke();
}

function chip(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, paperColor: string, sealColor: string, fontScale: number = 1) {
  ctx.fillStyle = paperColor;
  round(ctx, x - 130, y - 32, 260, 64, 14);
  ctx.fill();
  ctx.fillStyle = sealColor;
  ctx.font = `600 ${Math.round(36 * fontScale)}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
}
