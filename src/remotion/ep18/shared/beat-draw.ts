import { FONT, SEAL_FONT, easeOutCubic, PAPER_THEMES, type PaperThemeKey } from "@/remotion/shared/theme";

export function soloAlpha(frame: number, at: number, until?: number) {
  if (frame < at) return 0;
  const inn = easeOutCubic(Math.min(1, (frame - at) / 8));
  if (until == null || frame <= until) return inn;
  return inn * (1 - easeOutCubic(Math.min(1, (frame - until) / 8)));
}

export function drawSolo(
  ctx: CanvasRenderingContext2D,
  frame: number,
  at: number,
  until: number | undefined,
  text: string,
  size: number,
  color: string,
  fontScale: number = 1,
) {
  const a = soloAlpha(frame, at, until);
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.font = `600 ${Math.round(size * fontScale)}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 540, 960);
  ctx.restore();
}

export function drawStamp(
  ctx: CanvasRenderingContext2D,
  frame: number,
  at: number,
  until: number | undefined,
  text: string,
  themeKey?: PaperThemeKey,
  fontScale: number = 1,
) {
  const a = soloAlpha(frame, at, until);
  if (a <= 0.01) return;
  const theme = PAPER_THEMES[themeKey ?? "classic"] ?? PAPER_THEMES.classic;
  const p = easeOutCubic(Math.min(1, (frame - at) / 16));
  const scale = 1.5 - 0.5 * p;
  const chars = text.split("");
  const box = chars.length > 2 ? 280 : 260;
  ctx.save();
  ctx.translate(540, 960);
  ctx.rotate(((-18 + 10 * p) * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.globalAlpha = a;
  ctx.fillStyle = theme.paper;
  ctx.strokeStyle = theme.seal;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.roundRect(-box / 2, -box / 2, box, box, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = theme.seal;
  ctx.font = `900 ${Math.round((chars.length > 2 ? 64 : 88) * fontScale)}px ${SEAL_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  chars.forEach((ch, i) => {
    const mid = (chars.length - 1) / 2;
    ctx.fillText(ch, 0, (i - mid) * (chars.length > 2 ? 72 : 96));
  });
  ctx.restore();
}
