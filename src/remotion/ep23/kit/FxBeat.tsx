import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { FxCanvas } from "@/remotion/shared/fx/react";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FPS, type AnimParams } from "@/remotion/shared/theme";
import { useCustomTexts, useFontChoice, useFontSizeScale, usePaperTheme } from "@/remotion/shared/theme-context";
import { ensureFonts, setActiveFonts } from "@/remotion/shared/fonts";
import type { SfxHit } from "@/remotion/shared/sfx-lib";

/**
 * 第 23 期节拍的预览：画面全部由该拍 draw.ts 逐帧画在 canvas 上，这里直接调用同一个 draw()，
 * 保证预览与导出逐像素一致。
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
  const fonts = useFontChoice();
  const params = useMemo<AnimParams>(
    () => ({ startMs: 0, staggerMs: 0, durationMs: 0, paperTheme, fontScale, customTexts, fonts }),
    [paperTheme, fontScale, customTexts, fonts],
  );
  const fontsReady = useMemo(() => {
    setActiveFonts(fonts);
    return ensureFonts(allTexts(params));
  }, [params, allTexts, fonts]);
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
