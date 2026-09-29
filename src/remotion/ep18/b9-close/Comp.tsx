import { AbsoluteFill } from "remotion";
import { Paper, usePaperColors, useFontSizeScale, useCustomText } from "@/remotion/shared/paper";
import { popTransform } from "@/remotion/shared/breath";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FONT } from "@/remotion/shared/theme";
import { useAppear } from "@/remotion/ep18/shared/appear";
import { FLY_AT, LENGTH, LINE, sfxHits } from "./data";

export function duration(_staggerFrames: number) {
  return LENGTH;
}

export function Comp({
  staggerFrames,
  line: customLine,
}: {
  staggerFrames: number;
  line?: string;
  customTexts?: Record<string, string>;
}) {
  const colors = usePaperColors();
  const fontScale = useFontSizeScale();
  const text = useCustomText("line", customLine || LINE);
  const { enter, opacity, breath } = useAppear(FLY_AT, 20);

  return (
    <AbsoluteFill>
      <Paper />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity,
          transform: popTransform(enter, breath, 28, -2),
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: Math.round(72 * fontScale),
            fontWeight: 600,
            color: colors.seal,
            letterSpacing: "0.16em",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
      </div>
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}
