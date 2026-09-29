import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Paper, useCustomText } from "@/remotion/shared/paper";
import { POP_SPRING, breathOffset, popTransform } from "@/remotion/shared/breath";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FONT, SEAL_FONT } from "@/remotion/shared/theme";
import { usePaperColors, useFontSizeScale } from "@/remotion/shared/theme-context";
import { LENGTH, LINE, LINE_AT, MYTH, MYTH_AT, STAMP, STAMP_AT, sfxHits } from "./data";

export function duration(_staggerFrames: number) {
  return LENGTH;
}

export function Comp({
  staggerFrames,
  myth: customMyth,
  stamp: customStamp,
  line: customLine,
}: {
  staggerFrames: number;
  myth?: string;
  stamp?: string;
  line?: string;
}) {
  const colors = usePaperColors();
  const fontScale = useFontSizeScale();
  const hookMyth = useCustomText("myth", MYTH);
  const hookStamp = useCustomText("stamp", STAMP);
  const hookLine = useCustomText("line", LINE);
  const mythText = customMyth || hookMyth;
  const stampText = customStamp || hookStamp;
  const lineText = customLine || hookLine;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mythLocal = frame - MYTH_AT;
  const enter = spring({
    frame: mythLocal,
    fps,
    config: POP_SPRING,
    durationInFrames: 22,
  });
  const mythOp = interpolate(mythLocal, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const breath = breathOffset(mythLocal, fps);
  const chop = spring({
    frame: frame - STAMP_AT,
    fps,
    config: { damping: 11, stiffness: 220, mass: 0.55 },
    durationInFrames: 16,
  });
  const mythDim = interpolate(frame, [STAMP_AT, STAMP_AT + 10], [1, 0.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stampOp = interpolate(frame, [STAMP_AT, STAMP_AT + 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stampScale = interpolate(Math.max(0, chop), [0, 1], [1.55, 1]);
  const stampRot = interpolate(Math.max(0, chop), [0, 1], [-22, -10]);
  const groupOut = interpolate(frame, [LINE_AT - 6, LINE_AT + 6], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineOp = interpolate(frame, [LINE_AT, LINE_AT + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineEnter = spring({
    frame: frame - LINE_AT,
    fps,
    config: POP_SPRING,
    durationInFrames: 18,
  });

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
          fontFamily: FONT,
          opacity: groupOut,
        }}
      >
        <div
          style={{
            position: "relative",
            opacity: Math.max(0, mythOp),
            transform: popTransform(Math.max(0, enter), breath, 24, -3),
          }}
        >
          <div
            style={{
              fontSize: Math.round(108 * fontScale),
              fontWeight: 600,
              color: colors.ink,
              letterSpacing: "0.18em",
              lineHeight: 1,
              opacity: mythDim,
            }}
          >
            {mythText}
          </div>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 268,
              height: 268,
              marginLeft: -134,
              marginTop: -134,
              borderRadius: 8,
              border: `9px solid ${colors.seal}`,
              boxShadow: `inset 0 0 0 5px ${colors.seal}`,
              backgroundColor: colors.paper,
              color: colors.seal,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: SEAL_FONT,
              fontSize: Math.round(88 * fontScale),
              fontWeight: 900,
              lineHeight: 1.08,
              opacity: Math.max(0, stampOp),
              transform: `scale(${stampScale}) rotate(${stampRot}deg)`,
            }}
          >
            {stampText.split("").map((ch) => (
              <span key={ch}>{ch}</span>
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
          fontSize: Math.round(72 * fontScale),
          fontWeight: 600,
          color: colors.ink,
          letterSpacing: "0.12em",
          opacity: Math.max(0, lineOp),
          transform: popTransform(Math.max(0, lineEnter), breathOffset(frame - LINE_AT, fps), 18, -2),
        }}
      >
        {lineText}
      </div>
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}
