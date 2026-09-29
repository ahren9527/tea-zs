import { fillPaper } from "@/remotion/shared/draw-paper";
import { COLORS, FONT, easeOutCubic, PAPER_THEMES, type AnimParams } from "@/remotion/shared/theme";
import { drawSolo, drawStamp, soloAlpha } from "@/remotion/ep18/shared/beat-draw";
import { CHAR_AT, DEHUM_AT, FRIDGE_AT, NOT_AT, RAIN_AT, ROOM_AT, SOUR_AT } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);
  const theme = PAPER_THEMES[params.paperTheme ?? "classic"] ?? PAPER_THEMES.classic;
  const fontScale = params.fontScale ?? 1;
  const title = params.customTexts?.title || "干";
  const myth = params.customTexts?.myth || "吸潮 ≠ 变醇";
  const warning = params.customTexts?.warning || "发酸发霉";
  const solution = params.customTexts?.solution || "开除湿机";
  const taboo = params.customTexts?.taboo || "别塞冰箱";
  const frame = (elapsed / 1000) * 29.97;
  drawSolo(ctx, frame, CHAR_AT, NOT_AT, title, 280, theme.seal, fontScale);

  const pair = soloAlpha(frame, NOT_AT, RAIN_AT);
  if (pair > 0.01) {
    word(ctx, frame, NOT_AT, myth, 64, COLORS.muted, 880, pair, fontScale);
    word(ctx, frame, SOUR_AT, warning, 96, theme.seal, 1040, pair, fontScale);
  }

  const rainG = soloAlpha(frame, RAIN_AT, FRIDGE_AT);
  if (rainG > 0.01) {
    pill(ctx, 320, 790, "梅雨季", rainG * soloAlpha(frame, RAIN_AT), theme.seal, fontScale);
    pill(ctx, 760, 790, solution, rainG * soloAlpha(frame, DEHUM_AT), theme.seal, fontScale);
  }

  drawStamp(ctx, frame, FRIDGE_AT, ROOM_AT, taboo, params.paperTheme, fontScale);
  drawSolo(ctx, frame, ROOM_AT, undefined, "常温阴凉", 96, theme.ink, fontScale);
}

function word(
  ctx: CanvasRenderingContext2D,
  frame: number,
  at: number,
  text: string,
  size: number,
  color: string,
  y: number,
  group: number,
  fontScale: number = 1,
) {
  if (frame < at) return;
  const p = easeOutCubic(Math.min(1, (frame - at) / 8));
  ctx.save();
  ctx.globalAlpha = p * group;
  ctx.fillStyle = color;
  ctx.font = `600 ${Math.round(size * fontScale)}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 540, y);
  ctx.restore();
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, a: number, sealColor = COLORS.seal, fontScale: number = 1) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = `${sealColor}14`;
  ctx.strokeStyle = sealColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 140, y, 280, 340, 32);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = sealColor;
  ctx.font = `600 ${Math.round(48 * fontScale)}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(label, x, y + 230);
  ctx.restore();
}
