import { AbsoluteFill } from "remotion";
import { Paper } from "@/remotion/shared/paper";
import { SfxTrack } from "@/remotion/shared/sfx";
import { COLORS } from "@/remotion/shared/theme";
import { CenterRow, SealChip, SoloWord } from "@/remotion/ep18/shared/beat";
import { INTRO_AT, LENGTH, WORDS, WORD_AT, sfxHits } from "./data";

export function duration(_staggerFrames: number) {
  return LENGTH;
}

export function Comp({ staggerFrames }: { staggerFrames: number }) {
  return (
    <AbsoluteFill>
      <Paper />
      <SoloWord at={INTRO_AT} until={WORD_AT[0]} text="六个字" size={72} color={COLORS.muted} />
      <CenterRow gap={36}>
        {WORDS.map((w, i) => (
          <SealChip key={w} at={WORD_AT[i]} text={w} />
        ))}
      </CenterRow>
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}
