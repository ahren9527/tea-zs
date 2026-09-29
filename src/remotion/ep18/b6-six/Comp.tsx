import { AbsoluteFill } from "remotion";
import { Paper, useCustomText } from "@/remotion/shared/paper";
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
          <SixWordChip key={w} index={i} defaultWord={w} />
        ))}
      </CenterRow>
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}

function SixWordChip({ index, defaultWord }: { index: number; defaultWord: string }) {
  const text = useCustomText(`w${index + 1}`, defaultWord);
  return <SealChip at={WORD_AT[index]} text={text} />;
}
