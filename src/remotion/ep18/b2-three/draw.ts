import { fillPaper } from "@/remotion/shared/draw-paper";
import { FONT, SEAL_FONT, easeOutCubic, PAPER_THEMES, type AnimParams } from "@/remotion/shared/theme";
import { APPEAR, CARDS } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);
  const theme = PAPER_THEMES[params.paperTheme ?? "classic"] ?? PAPER_THEMES.classic;
  const fontScale = params.fontScale ?? 1;
  const frame = (elapsed / 1000) * 29.97;
  CARDS.forEach((card, i) => {
    const local = frame - APPEAR[i];
    if (local < 0) return;
    const title = params.customTexts?.[`card${i + 1}`] || card.title;
    const p = easeOutCubic(Math.min(1, local / 10));
    const top = 400 + i * 360 + (1 - p) * 28;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = i % 2 === 0 ? theme.paperDeep : theme.paper;
    ctx.beginPath();
    ctx.roundRect(130, top, 820, 300, 28);
    ctx.fill();
    ctx.fillStyle = theme.seal;
    ctx.fillRect(130, top + 20, 6, 260);
    ctx.strokeStyle = theme.seal;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(170, top + 90, 120, 120, 16);
    ctx.stroke();
    ctx.font = `900 ${Math.round(64 * fontScale)}px ${SEAL_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(card.num, 230, top + 150);
    ctx.fillStyle = theme.ink;
    ctx.font = `600 ${Math.round(60 * fontScale)}px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(title, 326, top + 172);
    ctx.restore();
  });
}
