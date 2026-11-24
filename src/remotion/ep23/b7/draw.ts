/**
 * 第 23 期 B7「检测报告怎么看」逐帧画布（1080×1920）。预览和导出都调用这一个 draw()。
 */
import { cameraAt, easeOutCubic, progress, type FxPalette } from "../kit/fx";
import { type AnimParams } from "@/remotion/shared/theme";
import { allTextsOf, beginFrame, inkText, KAI, renderLayers, textOf } from "../kit/draw-kit";
import { LENGTH, LINE_AT, TEXT, type TextKey } from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame, pal, fontScale } = beginFrame(ctx, elapsed, params);
  const cam = cameraAt(frame, LENGTH, { from: 1, to: 1.04, drift: 4 });
  renderLayers(ctx, frame, pal, cam, {
    leaves: 3,
    subject: (p) => drawSubject(ctx, frame, p, params, fontScale),
  });
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  // TODO 主体：用 kit/objects.ts 里的物件讲事（茶饼、茶盒、紫砂罐…），字出现时主体带回弹右让（字左物右）
  // 大字：口播说到时水墨显现；底部 300px 留给字幕（SAFE_BOTTOM）
  const p = easeOutCubic(progress(frame, LINE_AT, LINE_AT + 18));
  inkText(ctx, t(params, "line"), 540, 900, 132 * fontScale, p, 7, {
    color: pal.ink,
    font: KAI,
    weight: 700,
  });
}

/** 预览 / 导出前按需加载字体分片：本拍所有可能出现的字 */
export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
