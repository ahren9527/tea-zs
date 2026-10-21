import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { FxCanvas } from "@/remotion/shared/fx/react";
import { useCustomTexts, useFontSizeScale } from "@/remotion/shared/paper";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FPS, type AnimParams } from "@/remotion/shared/theme";
import { usePaperTheme } from "@/remotion/shared/theme-context";
import { ensureFonts } from "@/templates/fonts";
import { sfxHits } from "./data";
import { allTexts, draw } from "./draw";

/**
 * 预览（Remotion）。这一拍的画面全部由 draw.ts 逐帧画在 canvas 上，
 * 这里直接调用同一个 draw()，所以预览与导出逐像素一致，不需要两边各写一遍。
 */
export function Comp({ staggerFrames = 0 }: { staggerFrames?: number }) {
  const paperTheme = usePaperTheme();
  const fontScale = useFontSizeScale();
  const customTexts = useCustomTexts();
  const params = useMemo<AnimParams>(
    () => ({ startMs: 0, staggerMs: 0, durationMs: 0, paperTheme, fontScale, customTexts }),
    [paperTheme, fontScale, customTexts],
  );
  const fontsReady = useMemo(() => ensureFonts(allTexts(params)), [params]);
  return (
    <AbsoluteFill>
      <FxCanvas draw={(ctx, frame) => draw(ctx, (frame / FPS) * 1000, params)} fontsReady={fontsReady} deps={[params]} />
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}
