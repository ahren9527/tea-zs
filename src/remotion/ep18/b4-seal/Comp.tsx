import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Paper } from "@/remotion/shared/paper";
import { POP_SPRING, popTransform } from "@/remotion/shared/breath";
import { SfxTrack } from "@/remotion/shared/sfx";
import { COLORS, FONT, SEAL_FONT } from "@/remotion/shared/theme";
import { LawIcon } from "@/remotion/ep18/shared/icons";
import { CenterStack, SoloWord } from "@/remotion/ep18/shared/beat";
import { useAppear, useFadeOut } from "@/remotion/ep18/shared/appear";
import { BAN_AT, CHAR_AT, LAYERS, LAYER_AT, LENGTH, LIGHT_AT, MUST_AT, ZISHA_AT, sfxHits } from "./data";

export function duration(_staggerFrames: number) {
  return LENGTH;
}

export function Comp({ staggerFrames }: { staggerFrames: number }) {
  const zishaHide = useFadeOut(LAYER_AT[0], 8);
  const zisha = useAppear(ZISHA_AT);
  const light = useAppear(LIGHT_AT);

  return (
    <AbsoluteFill>
      <Paper />
      <SoloWord at={CHAR_AT} until={MUST_AT} text="封" size={280} color={COLORS.seal} />
      <SoloWord at={MUST_AT} until={ZISHA_AT} text="必须密封" size={96} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: zishaHide,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 640,
            height: 280,
            opacity: zisha.opacity,
            transform: popTransform(zisha.enter, zisha.breath, 20, -3),
            backgroundColor: "rgba(155, 45, 42, 0.08)",
            borderRadius: 28,
            border: `3px solid ${COLORS.seal}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontSize: 72,
            fontWeight: 600,
            color: COLORS.seal,
            letterSpacing: "0.18em",
          }}
        >
          紫砂罐
          <BanStamp />
        </div>
      </div>
      <CenterStack gap={28}>
        {LAYERS.map((layer, i) => (
          <LayerRow key={layer.name} index={i} />
        ))}
        <div
          style={{
            marginTop: 24,
            fontFamily: FONT,
            fontSize: 48,
            fontWeight: 600,
            color: COLORS.seal,
            letterSpacing: "0.28em",
            opacity: light.opacity,
            transform: popTransform(light.enter, light.breath, 14, -2),
          }}
        >
          挡潮避光
        </div>
      </CenterStack>
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}

function BanStamp() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chop = spring({
    frame: frame - BAN_AT,
    fps,
    config: { damping: 11, stiffness: 220, mass: 0.55 },
    durationInFrames: 16,
  });
  const op = interpolate(frame, [BAN_AT, BAN_AT + 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(Math.max(0, chop), [0, 1], [1.5, 1]);
  const rot = interpolate(Math.max(0, chop), [0, 1], [-20, -9]);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 200,
        height: 200,
        marginLeft: -100,
        marginTop: -100,
        borderRadius: 8,
        border: `8px solid ${COLORS.seal}`,
        boxShadow: `inset 0 0 0 4px ${COLORS.seal}`,
        backgroundColor: COLORS.paper,
        color: COLORS.seal,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: SEAL_FONT,
        fontSize: 56,
        fontWeight: 900,
        lineHeight: 1.1,
        opacity: Math.max(0, op),
        transform: `scale(${scale}) rotate(${rot}deg)`,
      }}
    >
      {"不能用".split("").map((ch) => (
        <span key={ch}>{ch}</span>
      ))}
    </div>
  );
}

function LayerRow({ index }: { index: number }) {
  const layer = LAYERS[index];
  const { enter, opacity, breath } = useAppear(LAYER_AT[index]);
  return (
    <div
      style={{
        width: 780,
        height: 200,
        opacity,
        transform: popTransform(enter, breath, 24, -3),
        backgroundColor: index % 2 === 0 ? "rgba(231, 221, 200, 0.55)" : "rgba(243, 236, 220, 0.7)",
        borderRadius: 24,
        boxShadow: `inset 6px 0 0 ${COLORS.seal}`,
        display: "flex",
        alignItems: "center",
        padding: "0 40px",
        gap: 28,
        fontFamily: FONT,
      }}
    >
      <LawIcon kind={layer.kind} />
      <div
        style={{
          fontSize: 56,
          fontWeight: 600,
          color: COLORS.ink,
          letterSpacing: "0.12em",
        }}
      >
        {layer.name}
      </div>
    </div>
  );
}
