import { fillPaper } from "@/remotion/shared/draw-paper";
import { COLORS, FONT, easeOutCubic, type AnimParams } from "@/remotion/shared/theme";
import { drawSolo, drawStamp, soloAlpha } from "@/remotion/ep18/shared/beat-draw";
import { BAN_AT, CHAR_AT, LAYERS, LAYER_AT, LIGHT_AT, MUST_AT, ZISHA_AT } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, _params: AnimParams) {
  fillPaper(ctx);
  const frame = (elapsed / 1000) * 29.97;
  drawSolo(ctx, frame, CHAR_AT, MUST_AT, "封", 280, COLORS.seal);
  drawSolo(ctx, frame, MUST_AT, ZISHA_AT, "必须密封", 96, COLORS.ink);

  const zishaA = soloAlpha(frame, ZISHA_AT, LAYER_AT[0]);
  if (zishaA > 0.01) {
    ctx.save();
    ctx.globalAlpha = zishaA;
    ctx.fillStyle = "rgba(155, 45, 42, 0.08)";
    ctx.strokeStyle = COLORS.seal;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(220, 820, 640, 280, 28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.seal;
    ctx.font = `600 72px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("紫砂罐", 540, 990);
    ctx.restore();
    drawStamp(ctx, frame, BAN_AT, LAYER_AT[0], "不能用");
  }

  LAYERS.forEach((layer, i) => {
    if (frame < LAYER_AT[i]) return;
    const p = easeOutCubic(Math.min(1, (frame - LAYER_AT[i]) / 8));
    const top = 430 + i * 230;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = i % 2 === 0 ? "rgba(231, 221, 200, 0.55)" : "rgba(243, 236, 220, 0.7)";
    ctx.beginPath();
    ctx.roundRect(150, top, 780, 200, 24);
    ctx.fill();
    ctx.fillStyle = COLORS.seal;
    ctx.fillRect(150, top + 16, 6, 168);
    ctx.fillStyle = COLORS.ink;
    ctx.font = `600 56px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(layer.name, 280, top + 120);
    ctx.restore();
  });

  if (frame >= LIGHT_AT) {
    const p = easeOutCubic(Math.min(1, (frame - LIGHT_AT) / 8));
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = COLORS.seal;
    ctx.font = `600 48px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("挡潮避光", 540, 1600);
    ctx.restore();
  }
}
