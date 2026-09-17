import { fillPaper } from "@/remotion/shared/draw-paper";
import { COLORS, FONT, easeOutCubic, type AnimParams } from "@/remotion/shared/theme";
import { FOOT_AT, OPTIONS, OPT_AT, Q_AT } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, _params: AnimParams) {
  fillPaper(ctx);
  const frame = (elapsed / 1000) * 29.97;

  if (frame >= Q_AT) {
    const p = easeOutCubic(Math.min(1, (frame - Q_AT) / 8));
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = COLORS.ink;
    ctx.font = `600 64px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("你平时怎么喝？", 540, 340);
    ctx.restore();
  }

  OPTIONS.forEach((opt, i) => {
    if (frame < OPT_AT[i]) return;
    const p = easeOutCubic(Math.min(1, (frame - OPT_AT[i]) / 8));
    const top = 520 + i * 380;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = i % 2 === 0 ? "rgba(231, 221, 200, 0.55)" : "rgba(243, 236, 220, 0.72)";
    ctx.beginPath();
    ctx.roundRect(90, top, 900, 300, 28);
    ctx.fill();
    ctx.fillStyle = COLORS.seal;
    ctx.fillRect(90, top + 28, 6, 244);
    ctx.strokeStyle = COLORS.seal;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(136, top + 90, 120, 120, 16);
    ctx.stroke();
    ctx.font = `700 72px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(opt.key, 196, top + 174);
    ctx.fillStyle = COLORS.ink;
    ctx.font = `600 56px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(opt.text, 290, top + 174);
    ctx.restore();
  });

  if (frame >= FOOT_AT) {
    const p = easeOutCubic(Math.min(1, (frame - FOOT_AT) / 8));
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = COLORS.seal;
    ctx.font = `600 48px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("评论区聊聊", 540, 1630);
    ctx.restore();
  }
}
