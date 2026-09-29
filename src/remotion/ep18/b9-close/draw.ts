import { fillPaper } from "@/remotion/shared/draw-paper";
import { FONT, easeOutCubic, PAPER_THEMES, type AnimParams } from "@/remotion/shared/theme";
import { FLY_AT, LINE } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);
  const theme = PAPER_THEMES[params.paperTheme ?? "classic"] ?? PAPER_THEMES.classic;
  const fontScale = params.fontScale ?? 1;
  const text = params.customTexts?.line || LINE;
  const frame = (elapsed / 1000) * 29.97;
  if (frame < FLY_AT) return;
  const p = easeOutCubic(Math.min(1, (frame - FLY_AT) / 14));
  const opacity = Math.min(1, (frame - FLY_AT) / 8);
  const y = 960 + (1 - p) * 28;
  const scale = 0.9 + 0.1 * p;
  ctx.save();
  ctx.translate(540, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = opacity;
  ctx.fillStyle = theme.seal;
  ctx.font = `600 ${Math.round(72 * fontScale)}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

