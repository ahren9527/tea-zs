import { fillPaper } from "@/remotion/shared/draw-paper";
import { COLORS, FONT, easeOutCubic, type AnimParams } from "@/remotion/shared/theme";
import { FLY_AT, LENGTH, LINE, ZOOM_AT } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, _params: AnimParams) {
  fillPaper(ctx);
  const frame = (elapsed / 1000) * 29.97;
  if (frame < FLY_AT) return;
  const fly = easeOutCubic(Math.min(1, (frame - FLY_AT) / 14));
  const opacity = Math.min(1, (frame - FLY_AT) / 8);
  const x = 540 + (1 - fly) * 420;
  const y = 960 + (1 - fly) * 90;
  const zoomT = Math.max(0, Math.min(1, (frame - ZOOM_AT) / (LENGTH - 6 - ZOOM_AT)));
  const zoom = 1 + 0.58 * (1 - (1 - zoomT) ** 2);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(zoom, zoom);
  ctx.globalAlpha = opacity;
  ctx.fillStyle = COLORS.seal;
  ctx.font = `600 72px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(LINE, 0, 0);
  ctx.restore();
}
