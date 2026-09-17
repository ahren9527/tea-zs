import { fillPaper } from "@/remotion/shared/draw-paper";
import { COLORS, FONT, SEAL_FONT, easeOutCubic, type AnimParams } from "@/remotion/shared/theme";
import { APPEAR, CARDS } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, _params: AnimParams) {
  fillPaper(ctx);
  const frame = (elapsed / 1000) * 29.97;
  CARDS.forEach((card, i) => {
    const local = frame - APPEAR[i];
    if (local < 0) return;
    const p = easeOutCubic(Math.min(1, local / 10));
    const top = 400 + i * 360 + (1 - p) * 28;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = i % 2 === 0 ? "rgba(231, 221, 200, 0.55)" : "rgba(243, 236, 220, 0.7)";
    ctx.beginPath();
    ctx.roundRect(130, top, 820, 300, 28);
    ctx.fill();
    ctx.fillStyle = COLORS.seal;
    ctx.fillRect(130, top + 20, 6, 260);
    ctx.strokeStyle = COLORS.seal;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(170, top + 90, 120, 120, 16);
    ctx.stroke();
    ctx.font = `900 64px ${SEAL_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(card.num, 230, top + 150);
    ctx.fillStyle = COLORS.ink;
    ctx.font = `600 60px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(card.title, 326, top + 172);
    ctx.restore();
  });
}
