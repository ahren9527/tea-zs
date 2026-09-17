import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Paper } from "@/remotion/shared/paper";
import { POP_SPRING, breathOffset, popTransform } from "@/remotion/shared/breath";
import { SfxTrack } from "@/remotion/shared/sfx";
import { COLORS, FONT } from "@/remotion/shared/theme";
import { FOOT_AT, LENGTH, OPTIONS, OPT_AT, Q_AT, sfxHits } from "./data";

export function duration(_staggerFrames: number) {
  return LENGTH;
}

export function Comp({ staggerFrames }: { staggerFrames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const qLocal = frame - Q_AT;
  const qEnter = spring({ frame: qLocal, fps, config: POP_SPRING, durationInFrames: 18 });
  const qOp = interpolate(qLocal, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fLocal = frame - FOOT_AT;
  const fEnter = spring({ frame: fLocal, fps, config: POP_SPRING, durationInFrames: 16 });
  const fOp = interpolate(fLocal, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Paper />
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 280,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 64,
          fontWeight: 600,
          color: COLORS.ink,
          letterSpacing: "0.08em",
          opacity: Math.max(0, qOp),
          transform: popTransform(Math.max(0, qEnter), breathOffset(qLocal, fps), 18, -2),
        }}
      >
        你平时怎么喝？
      </div>
      {OPTIONS.map((opt, i) => (
        <Option key={opt.key} index={i} />
      ))}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 1580,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 48,
          fontWeight: 600,
          color: COLORS.seal,
          letterSpacing: "0.22em",
          opacity: Math.max(0, fOp),
          transform: popTransform(Math.max(0, fEnter), breathOffset(fLocal, fps), 14, -2),
        }}
      >
        评论区聊聊
      </div>
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}

function Option({ index }: { index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opt = OPTIONS[index];
  const local = frame - OPT_AT[index];
  const enter = spring({ frame: local, fps, config: POP_SPRING, durationInFrames: 18 });
  const opacity = interpolate(local, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breath = breathOffset(local, fps);
  const chop = spring({
    frame: Math.max(0, local),
    fps,
    config: { damping: 12, stiffness: 210, mass: 0.55 },
    durationInFrames: 16,
  });
  const sealScale = interpolate(Math.max(0, chop), [0, 1], [1.35, 1]);
  const sealRot = interpolate(Math.max(0, chop), [0, 1], [-12, -6]);

  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        width: 900,
        height: 300,
        top: 520 + index * 380,
        opacity: Math.max(0, opacity),
        transform: popTransform(enter, breath, 28, -3),
        transformOrigin: "80px center",
        backgroundColor: index % 2 === 0 ? "rgba(231, 221, 200, 0.55)" : "rgba(243, 236, 220, 0.72)",
        borderRadius: 28,
        boxShadow: `inset 6px 0 0 ${COLORS.seal}`,
        display: "flex",
        alignItems: "center",
        padding: "0 48px 0 40px",
        gap: 32,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          flexShrink: 0,
          borderRadius: 16,
          border: `5px solid ${COLORS.seal}`,
          boxShadow: `inset 0 0 0 3px ${COLORS.seal}`,
          backgroundColor: "rgba(155, 45, 42, 0.1)",
          color: COLORS.seal,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 72,
          fontWeight: 700,
          transform: `scale(${sealScale}) rotate(${sealRot}deg)`,
        }}
      >
        {opt.key}
      </div>
      <div
        style={{
          fontSize: 56,
          fontWeight: 600,
          color: COLORS.ink,
          letterSpacing: "0.12em",
        }}
      >
        {opt.text}
      </div>
    </div>
  );
}
