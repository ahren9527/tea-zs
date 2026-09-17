import { COLORS, FONT, SEAL_FONT, easeOutCubic } from "@/remotion/shared/theme";

export function drawGiantLaw(
  ctx: CanvasRenderingContext2D,
  frame: number,
  char: string,
  hold: number,
  kicker: string,
) {
  const giantIn = easeOutCubic(Math.min(1, frame / 8));
  const giantOut = frame <= hold ? 1 : 1 - easeOutCubic(Math.min(1, (frame - hold) / 12));
  const giantOp = giantIn * giantOut;
  if (giantOp > 0.01) {
    ctx.save();
    ctx.globalAlpha = giantOp;
    ctx.fillStyle = COLORS.seal;
    ctx.font = `900 280px ${SEAL_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(char, 540, 900);
    ctx.restore();
  }

  if (frame > hold + 4) {
    const smallOp = easeOutCubic(Math.min(1, (frame - (hold + 4)) / 12));
    ctx.save();
    ctx.globalAlpha = smallOp;
    ctx.fillStyle = COLORS.seal;
    ctx.font = `900 72px ${SEAL_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(char, 540, 176);
    ctx.fillStyle = COLORS.muted;
    ctx.font = `500 36px ${FONT}`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(kicker, 540, 268);
    ctx.restore();
  }
}
