import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { POP_SPRING, breathOffset, popTransform } from "@/remotion/shared/breath";
import { COLORS, FONT, SEAL_FONT } from "@/remotion/shared/theme";

export function GiantLaw({
  char,
  hold,
  kicker,
}: {
  char: string;
  hold: number;
  kicker: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: POP_SPRING,
    durationInFrames: 18,
  });
  const holdAt = Number.isFinite(hold) ? hold : 72;
  const fade = interpolate(frame, [holdAt, holdAt + 12], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rise = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const giantOp = rise * fade;
  const smallOp = interpolate(frame, [holdAt + 4, holdAt + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const breath = breathOffset(frame, fps);
  const showGiant = frame < holdAt + 12 && giantOp > 0.02;

  return (
    <>
      {showGiant ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 760,
            textAlign: "center",
            fontFamily: SEAL_FONT,
            fontSize: 280,
            fontWeight: 900,
            color: COLORS.seal,
            letterSpacing: "0.12em",
            lineHeight: 1,
            opacity: giantOp,
            transform: popTransform(enter, breath, 24, -4),
            pointerEvents: "none",
          }}
        >
          {char}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 140,
          textAlign: "center",
          fontFamily: SEAL_FONT,
          fontSize: 72,
          fontWeight: 900,
          color: COLORS.seal,
          letterSpacing: "0.12em",
          lineHeight: 1,
          opacity: smallOp,
        }}
      >
        {char}
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 230,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 36,
          fontWeight: 500,
          color: COLORS.muted,
          letterSpacing: "0.42em",
          opacity: smallOp,
        }}
      >
        {kicker}
      </div>
    </>
  );
}
