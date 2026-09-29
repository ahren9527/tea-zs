import { fillPaper } from "@/remotion/shared/draw-paper";
import { FONT, easeOutCubic, PAPER_THEMES, type AnimParams } from "@/remotion/shared/theme";
import { drawSolo, drawStamp, soloAlpha } from "@/remotion/ep18/shared/beat-draw";
import { BAN_AT, CHAR_AT, LAYERS, LAYER_AT, LIGHT_AT, MUST_AT, ZISHA_AT } from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);
  const theme = PAPER_THEMES[params.paperTheme ?? "classic"] ?? PAPER_THEMES.classic;
  const fontScale = params.fontScale ?? 1;
  const title = params.customTexts?.title || "封";
  const taboo = params.customTexts?.taboo || "紫砂罐";
  const frame = (elapsed / 1000) * 29.97;
  drawSolo(ctx, frame, CHAR_AT, MUST_AT, title, 280, theme.seal, fontScale);
  drawSolo(ctx, frame, MUST_AT, ZISHA_AT, "必须密封", 96, theme.ink, fontScale);

  const zishaA = soloAlpha(frame, ZISHA_AT, LAYER_AT[0]);
  if (zishaA > 0.01) {
    ctx.save();
    ctx.globalAlpha = zishaA;
    ctx.fillStyle = `${theme.seal}14`;
    ctx.strokeStyle = theme.seal;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(220, 820, 640, 280, 28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = theme.seal;
    ctx.font = `600 ${Math.round(72 * fontScale)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(taboo, 540, 990);
    ctx.restore();
    drawStamp(ctx, frame, BAN_AT, LAYER_AT[0], "不能用", params.paperTheme, fontScale);
  }

  LAYERS.forEach((layer, i) => {
    if (frame < LAYER_AT[i]) return;
    const layerName = params.customTexts?.[`layer${i + 1}`] || layer.name;
    const p = easeOutCubic(Math.min(1, (frame - LAYER_AT[i]) / 8));
    const top = 430 + i * 230;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = i % 2 === 0 ? theme.paperDeep : theme.paper;
    ctx.beginPath();
    ctx.roundRect(150, top, 780, 200, 24);
    ctx.fill();
    ctx.fillStyle = theme.seal;
    ctx.fillRect(150, top + 16, 6, 168);
    ctx.fillStyle = theme.ink;
    ctx.font = `600 ${Math.round(56 * fontScale)}px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(layerName, 280, top + 120);
    ctx.restore();
  });

  if (frame >= LIGHT_AT) {
    const p = easeOutCubic(Math.min(1, (frame - LIGHT_AT) / 8));
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = theme.seal;
    ctx.font = `600 ${Math.round(48 * fontScale)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("挡潮避光", 540, 1600);
    ctx.restore();
  }
}
