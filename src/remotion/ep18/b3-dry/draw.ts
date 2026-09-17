import { fillPaper } from "@/remotion/shared/draw-paper";
import { COLORS, FONT, easeOutCubic, type AnimParams } from "@/remotion/shared/theme";
import { drawSolo, drawStamp, soloAlpha } from "@/remotion/ep18/shared/beat-draw";
import { CHAR_AT, DEHUM_AT, FRIDGE_AT, NOT_AT, RAIN_AT, ROOM_AT, SOUR_AT } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, _params: AnimParams) {
  fillPaper(ctx);
  const frame = (elapsed / 1000) * 29.97;
  drawSolo(ctx, frame, CHAR_AT, NOT_AT, "干", 280, COLORS.seal);

  const pair = soloAlpha(frame, NOT_AT, RAIN_AT);
  if (pair > 0.01) {
    word(ctx, frame, NOT_AT, "吸潮 ≠ 变醇", 64, COLORS.muted, 880, pair);
    word(ctx, frame, SOUR_AT, "发酸发霉", 96, COLORS.seal, 1040, pair);
  }

  const rainG = soloAlpha(frame, RAIN_AT, FRIDGE_AT);
  if (rainG > 0.01) {
    pill(ctx, 320, 790, "梅雨季", rainG * soloAlpha(frame, RAIN_AT));
    pill(ctx, 760, 790, "开除湿机", rainG * soloAlpha(frame, DEHUM_AT));
  }

  drawStamp(ctx, frame, FRIDGE_AT, ROOM_AT, "别塞冰箱");
  drawSolo(ctx, frame, ROOM_AT, undefined, "常温阴凉", 96, COLORS.ink);
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
) {
  if (frame < at) return;
  const p = easeOutCubic(Math.min(1, (frame - at) / 8));
  ctx.save();
  ctx.globalAlpha = p * group;
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 540, y);
  ctx.restore();
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, a: number) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(155, 45, 42, 0.08)";
  ctx.strokeStyle = COLORS.seal;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 140, y, 280, 340, 32);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.seal;
  ctx.font = `600 48px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(label, x, y + 230);
  ctx.restore();
}
