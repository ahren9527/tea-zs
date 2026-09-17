import { fillPaper } from "@/remotion/shared/draw-paper";
import { COLORS, FONT, SEAL_FONT, easeOutCubic, type AnimParams } from "@/remotion/shared/theme";
import { LINE, LINE_AT, MYTH, MYTH_AT, STAMP, STAMP_AT } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, _params: AnimParams) {
  fillPaper(ctx);
  const fps = 29.97;
  const frame = (elapsed / 1000) * fps;
  const groupOut =
    frame < LINE_AT - 6 ? 1 : 1 - easeOutCubic(Math.min(1, (frame - (LINE_AT - 6)) / 12));

  if (frame >= MYTH_AT) {
    const mythP = easeOutCubic(Math.min(1, (frame - MYTH_AT) / 10));
    const dim = frame >= STAMP_AT ? 0.18 + 0.82 * (1 - easeOutCubic(Math.min(1, (frame - STAMP_AT) / 10))) : 1;
    ctx.save();
    ctx.globalAlpha = mythP * dim * groupOut;
    ctx.fillStyle = COLORS.ink;
    ctx.font = `600 108px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(MYTH, 540, 960);
    ctx.restore();
  }

  if (frame >= STAMP_AT) {
    const local = (frame - STAMP_AT) / 16;
    const p = easeOutCubic(Math.min(1, local));
    const scale = 1.55 - 0.55 * p;
    ctx.save();
    ctx.translate(540, 960);
    ctx.rotate(((-22 + 12 * p) * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.min(1, (frame - STAMP_AT) / 4) * groupOut;
    ctx.fillStyle = COLORS.paper;
    ctx.strokeStyle = COLORS.seal;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.roundRect(-134, -134, 268, 268, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.seal;
    ctx.font = `900 88px ${SEAL_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    STAMP.split("").forEach((ch, i) => ctx.fillText(ch, 0, -48 + i * 96));
    ctx.restore();
  }

  if (frame >= LINE_AT) {
    const p = easeOutCubic(Math.min(1, (frame - LINE_AT) / 10));
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = COLORS.ink;
    ctx.font = `600 72px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(LINE, 540, 960);
    ctx.restore();
  }
}
