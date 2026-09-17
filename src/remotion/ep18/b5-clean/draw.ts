import { fillPaper } from "@/remotion/shared/draw-paper";
import { COLORS, FONT, easeOutCubic, type AnimParams } from "@/remotion/shared/theme";
import { drawSolo } from "@/remotion/ep18/shared/beat-draw";
import { drawLawIcon } from "@/remotion/ep18/shared/icons";
import { BADS, BAD_AT, CHAR_AT } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, _params: AnimParams) {
  fillPaper(ctx);
  const frame = (elapsed / 1000) * 29.97;
  drawSolo(ctx, frame, CHAR_AT, BAD_AT[0], "净", 280, COLORS.seal);

  BADS.forEach((b, i) => {
    if (frame < BAD_AT[i]) return;
    const p = easeOutCubic(Math.min(1, (frame - BAD_AT[i]) / 8));
    const x = 230 + i * 310;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = "rgba(155, 45, 42, 0.08)";
    ctx.strokeStyle = COLORS.seal;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x - 150, 750, 300, 420, 32);
    ctx.fill();
    ctx.stroke();
    drawLawIcon(ctx, b.kind, x, 900, 148);
    ctx.fillStyle = COLORS.seal;
    ctx.font = `600 44px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(b.name, x, 1088);
    ctx.restore();
  });
}
