import { fillPaper } from "@/remotion/shared/draw-paper";
import { COLORS, SEAL_FONT, easeOutCubic, PAPER_THEMES, type AnimParams } from "@/remotion/shared/theme";
import { drawSolo } from "@/remotion/ep18/shared/beat-draw";
import { INTRO_AT, WORDS, WORD_AT } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);
  const theme = PAPER_THEMES[params.paperTheme ?? "classic"] ?? PAPER_THEMES.classic;
  const fontScale = params.fontScale ?? 1;
  const frame = (elapsed / 1000) * 29.97;
  drawSolo(ctx, frame, INTRO_AT, WORD_AT[0], "六个字", 72, COLORS.muted, fontScale);

  WORDS.forEach((w, i) => {
    if (frame < WORD_AT[i]) return;
    const wordText = params.customTexts?.[`w${i + 1}`] || w;
    const p = easeOutCubic(Math.min(1, (frame - WORD_AT[i]) / 8));
    const x = 300 + i * 276;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = theme.paper;
    ctx.strokeStyle = theme.seal;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(x - 120, 840, 240, 240, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = theme.seal;
    ctx.font = `900 ${Math.round(72 * fontScale)}px ${SEAL_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(wordText, x, 960);
    ctx.restore();
  });
}
