import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { FxCanvas } from "@/remotion/shared/fx/react";
import { useCustomTexts, useFontSizeScale } from "@/remotion/shared/paper";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FPS, type AnimParams } from "@/remotion/shared/theme";
import { usePaperTheme } from "@/remotion/shared/theme-context";
import { ensureFonts } from "@/templates/fonts";

type SfxHit = { src: string; at: number; volume?: number };

/**
 * 第 20 期节拍的预览：画面全部由该拍 draw.ts 逐帧画在 canvas 上，这里直接调用同一个 draw()，
 * 所以预览与导出逐像素一致。
 */
export function FxBeat({
  draw,
  allTexts,
  hits,
}: {
  draw: (ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) => void;
  allTexts: (params?: AnimParams) => string;
  hits: SfxHit[];
}) {
  const paperTheme = usePaperTheme();
  const fontScale = useFontSizeScale();
  const customTexts = useCustomTexts();
  const params = useMemo<AnimParams>(
    () => ({ startMs: 0, staggerMs: 0, durationMs: 0, paperTheme, fontScale, customTexts }),
    [paperTheme, fontScale, customTexts],
  );
  const fontsReady = useMemo(() => ensureFonts(allTexts(params)), [params, allTexts]);
  return (
    <AbsoluteFill>
      <FxCanvas
        draw={(ctx, frame) => draw(ctx, (frame / FPS) * 1000, params)}
        fontsReady={fontsReady}
        deps={[params]}
      />
      <SfxTrack hits={hits} />
    </AbsoluteFill>
  );
}
