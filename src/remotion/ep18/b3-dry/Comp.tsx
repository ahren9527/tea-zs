import { AbsoluteFill } from "remotion";
import { Paper, useCustomText } from "@/remotion/shared/paper";
import { SfxTrack } from "@/remotion/shared/sfx";
import { COLORS } from "@/remotion/shared/theme";
import { CenterRow, CenterStack, MarkCard, SoloWord, StackLine } from "@/remotion/ep18/shared/beat";
import { CHAR_AT, DEHUM_AT, FRIDGE_AT, LENGTH, NOT_AT, RAIN_AT, ROOM_AT, SOUR_AT, sfxHits } from "./data";

export function duration(_staggerFrames: number) {
  return LENGTH;
}

export function Comp({ staggerFrames }: { staggerFrames: number }) {
  const title = useCustomText("title", "干");
  const myth = useCustomText("myth", "吸潮 ≠ 变醇");
  const warning = useCustomText("warning", "发酸发霉");
  const solution = useCustomText("solution", "开除湿机");
  const taboo = useCustomText("taboo", "别塞冰箱");

  return (
    <AbsoluteFill>
      <Paper />
      <SoloWord at={CHAR_AT} until={NOT_AT} text={title} size={280} color={COLORS.seal} />
      <CenterStack until={RAIN_AT} gap={48}>
        <StackLine at={NOT_AT} text={myth} size={64} color={COLORS.muted} />
        <StackLine at={SOUR_AT} text={warning} size={96} color={COLORS.seal} />
      </CenterStack>
      <CenterRow until={FRIDGE_AT} gap={40}>
        <MarkCard at={RAIN_AT} label="梅雨季" kind="damp" />
        <MarkCard at={DEHUM_AT} label={solution} kind="damp" />
      </CenterRow>
      <SoloWord at={FRIDGE_AT} until={ROOM_AT} text={taboo} stamp />
      <SoloWord at={ROOM_AT} text="常温阴凉" size={96} />
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}
