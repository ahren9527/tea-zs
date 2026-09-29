import { fillPaper } from "@/remotion/shared/draw-paper";
import { FONT, easeOutCubic, PAPER_THEMES, type AnimParams } from "@/remotion/shared/theme";
import { FOOT_AT, OPTIONS, OPT_AT, Q_AT } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);
  const theme = PAPER_THEMES[params.paperTheme ?? "classic"] ?? PAPER_THEMES.classic;
  const fontScale = params.fontScale ?? 1;
  const qText = params.customTexts?.question || "你平时怎么喝？";
  const ctaText = params.customTexts?.cta || "评论区聊聊";
  const frame = (elapsed / 1000) * 29.97;

  if (frame >= Q_AT) {
    const p = easeOutCubic(Math.min(1, (frame - Q_AT) / 8));
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = theme.ink;
    ctx.font = `600 ${Math.round(64 * fontScale)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(qText, 540, 340);
    ctx.restore();
  }

  OPTIONS.forEach((opt, i) => {
    if (frame < OPT_AT[i]) return;
    const optText = params.customTexts?.[i === 0 ? "optA" : "optB"] || opt.text;
    const p = easeOutCubic(Math.min(1, (frame - OPT_AT[i]) / 8));
    const top = 520 + i * 380;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = i % 2 === 0 ? theme.paperDeep : theme.paper;
    ctx.beginPath();
    ctx.roundRect(90, top, 900, 300, 28);
    ctx.fill();
    ctx.fillStyle = theme.seal;
    ctx.fillRect(90, top + 28, 6, 244);
    ctx.strokeStyle = theme.seal;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(136, top + 90, 120, 120, 16);
    ctx.stroke();
    ctx.font = `700 ${Math.round(72 * fontScale)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(opt.key, 196, top + 174);
    ctx.fillStyle = theme.ink;
    ctx.font = `600 ${Math.round(56 * fontScale)}px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(optText, 290, top + 174);
    ctx.restore();
  });

  if (frame >= FOOT_AT) {
    const p = easeOutCubic(Math.min(1, (frame - FOOT_AT) / 8));
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = theme.seal;
    ctx.font = `600 ${Math.round(48 * fontScale)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(ctaText, 540, 1630);
    ctx.restore();
  }
}
