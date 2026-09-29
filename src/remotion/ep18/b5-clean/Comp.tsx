import { AbsoluteFill } from "remotion";
import { Paper, usePaperColors, useCustomText } from "@/remotion/shared/paper";
import { SfxTrack } from "@/remotion/shared/sfx";
import { CenterRow, MarkCard, SoloWord } from "@/remotion/ep18/shared/beat";
import { BADS, BAD_AT, CHAR_AT, LENGTH, sfxHits } from "./data";

export function duration(_staggerFrames: number) {
  return LENGTH;
}

export function Comp({ staggerFrames }: { staggerFrames: number }) {
  const colors = usePaperColors();
  const title = useCustomText("title", "净");
  return (
    <AbsoluteFill>
      <Paper />
      <SoloWord at={CHAR_AT} until={BAD_AT[0]} text={title} size={280} color={colors.seal} />
      <CenterRow gap={20}>
        {BADS.map((b, i) => (
          <BadItem key={b.name} index={i} defaultName={b.name} kind={b.kind} />
        ))}
      </CenterRow>
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}

function BadItem({ index, defaultName, kind }: { index: number; defaultName: string; kind: (typeof BADS)[number]["kind"] }) {
  const name = useCustomText(`bad${index + 1}`, defaultName);
  return <MarkCard at={BAD_AT[index]} label={name} kind={kind} />;
}
