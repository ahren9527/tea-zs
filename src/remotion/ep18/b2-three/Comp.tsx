import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Paper, usePaperColors, useFontSizeScale, useCustomText } from "@/remotion/shared/paper";
import { POP_SPRING, breathOffset, popTransform } from "@/remotion/shared/breath";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FONT, SEAL_FONT } from "@/remotion/shared/theme";
import { APPEAR, CARDS, LENGTH, sfxHits } from "./data";

export function duration(_staggerFrames: number) {
  return LENGTH;
}

export function Comp({ staggerFrames }: { staggerFrames: number }) {
  return (
    <AbsoluteFill>
      <Paper />
      {CARDS.map((card, i) => (
        <Card key={card.num} index={i} />
      ))}
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}

function Card({ index }: { index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = usePaperColors();
  const fontScale = useFontSizeScale();
  const card = CARDS[index];
  const title = useCustomText(`card${index + 1}`, card.title);
  const local = frame - APPEAR[index];
  const enter = spring({
    frame: local,
    fps,
    config: POP_SPRING,
    durationInFrames: 20,
  });
  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const breath = breathOffset(local, fps);
  const chop = spring({
    frame: Math.max(0, local),
    fps,
    config: { damping: 12, stiffness: 210, mass: 0.55 },
    durationInFrames: 16,
  });
  const sealScale = interpolate(Math.max(0, chop), [0, 1], [1.4, 1]);
  const sealRot = interpolate(Math.max(0, chop), [0, 1], [-14, -6]);

  return (
    <div
      style={{
        position: "absolute",
        left: 130,
        top: 400 + index * 360,
        width: 820,
        height: 300,
        opacity: Math.max(0, opacity),
        transform: popTransform(enter, breath, 32, -3.5),
        transformOrigin: "80px center",
        backgroundColor: index % 2 === 0 ? colors.paperDeep : colors.paper,
        borderRadius: 28,
        boxShadow: `inset 6px 0 0 ${colors.seal}`,
        display: "flex",
        alignItems: "center",
        padding: "0 48px 0 40px",
        gap: 36,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          flexShrink: 0,
          borderRadius: 16,
          border: `5px solid ${colors.seal}`,
          boxShadow: `inset 0 0 0 3px ${colors.seal}`,
          backgroundColor: `${colors.seal}18`,
          color: colors.seal,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SEAL_FONT,
          fontSize: Math.round(64 * fontScale),
          fontWeight: 900,
          transform: `scale(${sealScale}) rotate(${sealRot}deg)`,
        }}
      >
        {card.num}
      </div>
      <div
        style={{
          fontSize: Math.round(60 * fontScale),
          fontWeight: 600,
          color: colors.ink,
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </div>
    </div>
  );
}
