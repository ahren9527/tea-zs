import { fillPaper } from "@/remotion/shared/draw-paper";
import { FONT, easeOutCubic, PAPER_THEMES, type AnimParams } from "@/remotion/shared/theme";
import { drawSolo } from "@/remotion/ep18/shared/beat-draw";
import { drawLawIcon } from "@/remotion/ep18/shared/icons";
import { BADS, BAD_AT, CHAR_AT } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);
  const theme = PAPER_THEMES[params.paperTheme ?? "classic"] ?? PAPER_THEMES.classic;
  const fontScale = params.fontScale ?? 1;
  const title = params.customTexts?.title || "净";
  const frame = (elapsed / 1000) * 29.97;
  drawSolo(ctx, frame, CHAR_AT, BAD_AT[0], title, 280, theme.seal, fontScale);

  BADS.forEach((b, i) => {
    if (frame < BAD_AT[i]) return;
    const badName = params.customTexts?.[`bad${i + 1}`] || b.name;
    const p = easeOutCubic(Math.min(1, (frame - BAD_AT[i]) / 8));
    const x = 230 + i * 310;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = `${theme.seal}14`;
    ctx.strokeStyle = theme.seal;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x - 150, 750, 300, 420, 32);
    ctx.fill();
    ctx.stroke();
    drawLawIcon(ctx, b.kind, x, 900, 148);
    ctx.fillStyle = theme.seal;
    ctx.font = `600 ${Math.round(44 * fontScale)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(badName, x, 1088);
    ctx.restore();
  });
}
