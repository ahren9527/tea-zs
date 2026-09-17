import { COLORS, STAGE } from "./theme";

export function fillPaper(ctx: CanvasRenderingContext2D) {
  if ("reset" in ctx && typeof ctx.reset === "function") {
    ctx.reset();
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, STAGE.width, STAGE.height);
  ctx.save();
  ctx.globalAlpha = 0.035;
  for (let i = 0; i < 28; i++) {
    ctx.fillStyle = COLORS.paperDeep;
    ctx.fillRect((i * 167) % STAGE.width, (i * 311) % STAGE.height, 2, 16);
  }
  ctx.restore();
}
