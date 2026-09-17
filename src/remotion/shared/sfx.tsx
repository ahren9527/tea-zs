import { Audio, Sequence } from "remotion";

export type SfxHit = {
  src: string;
  at: number;
  volume?: number;
};

export function SfxTrack({ hits }: { hits: SfxHit[] }) {
  return (
    <>
      {hits.map((hit, i) => (
        <Sequence key={`${hit.src}-${hit.at}-${i}`} from={Math.max(0, Math.round(hit.at))} layout="none">
          <Audio src={`/${hit.src}`} volume={hit.volume ?? 0.42} />
        </Sequence>
      ))}
    </>
  );
}
