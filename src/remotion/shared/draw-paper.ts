import { COLORS, PAPER_THEMES, STAGE, type PaperThemeKey } from "./theme";

export function fillPaper(ctx: CanvasRenderingContext2D, themeKey?: PaperThemeKey) {
  const theme = PAPER_THEMES[themeKey ?? "classic"] ?? COLORS;
  if ("reset" in ctx && typeof ctx.reset === "function") {
    ctx.reset();
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.fillStyle = theme.paper;
  ctx.fillRect(0, 0, STAGE.width, STAGE.height);
  ctx.save();
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 64; i++) {
    ctx.fillStyle = theme.paperDeep;
    const x = (i * 137 + (i % 3) * 73) % STAGE.width;
    const y = (i * 251 + (i % 5) * 41) % STAGE.height;
    ctx.fillRect(x, y, i % 2 === 0 ? 1.5 : 2.5, i % 3 === 0 ? 28 : 16);
  }

  // Classical bookplate inner margin rules (文人木刻版心内线)
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.12;
  ctx.strokeRect(36, 48, 1008, 1824);

  ctx.lineWidth = 0.6;
  ctx.globalAlpha = 0.08;
  ctx.strokeRect(44, 56, 992, 1808);

  // Four corner accents
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.2;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(32, 68);
  ctx.lineTo(32, 44);
  ctx.lineTo(56, 44);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(1048, 68);
  ctx.lineTo(1048, 44);
  ctx.lineTo(1024, 44);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(32, 1852);
  ctx.lineTo(32, 1876);
  ctx.lineTo(56, 1876);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(1048, 1852);
  ctx.lineTo(1048, 1876);
  ctx.lineTo(1024, 1876);
  ctx.stroke();

  ctx.restore();
}
