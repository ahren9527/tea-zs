import { AbsoluteFill } from "remotion";
import { Paper } from "@/remotion/shared/paper";
import { SfxTrack } from "@/remotion/shared/sfx";
import { COLORS } from "@/remotion/shared/theme";
import { CenterRow, MarkCard, SoloWord } from "@/remotion/ep18/shared/beat";
import { BADS, BAD_AT, CHAR_AT, LENGTH, sfxHits } from "./data";

export function duration(_staggerFrames: number) {
  return LENGTH;
}

export function Comp({ staggerFrames }: { staggerFrames: number }) {
  return (
    <AbsoluteFill>
      <Paper />
      <SoloWord at={CHAR_AT} until={BAD_AT[0]} text="净" size={280} color={COLORS.seal} />
      <CenterRow gap={20}>
        {BADS.map((b, i) => (
          <MarkCard key={b.name} at={BAD_AT[i]} label={b.name} kind={b.kind} />
        ))}
      </CenterRow>
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}
