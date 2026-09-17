import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Paper } from "@/remotion/shared/paper";
import { POP_SPRING } from "@/remotion/shared/breath";
import { SfxTrack } from "@/remotion/shared/sfx";
import { COLORS, FONT } from "@/remotion/shared/theme";
import { FLY_AT, LENGTH, LINE, ZOOM_AT, sfxHits } from "./data";

export function duration(_staggerFrames: number) {
  return LENGTH;
}

export function Comp({ staggerFrames }: { staggerFrames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - FLY_AT;
  const enter = spring({
    frame: local,
    fps,
    config: POP_SPRING,
    durationInFrames: 22,
  });
  const fly = Math.max(0, enter);
  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(fly, [0, 1], [420, 0]);
  const y = interpolate(fly, [0, 1], [90, 0]);
  const zoom = interpolate(frame, [ZOOM_AT, LENGTH - 6], [1, 1.58], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
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
          opacity: Math.max(0, opacity),
          transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${zoom.toFixed(4)})`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 72,
            fontWeight: 600,
            color: COLORS.seal,
            letterSpacing: "0.16em",
            whiteSpace: "nowrap",
          }}
        >
          {LINE}
        </div>
      </div>
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}
