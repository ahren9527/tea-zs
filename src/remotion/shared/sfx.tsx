import { Audio, Sequence, useVideoConfig } from "remotion";
import { envelopeAt, resolveHit, type SfxHit } from "./sfx-lib";

export type { SfxHit } from "./sfx-lib";

/** 预览用音效轨：每条 hit 的增益 / 变速 / 循环 / 淡入淡出与导出混音（src/lib/sfx-mix.ts）同源 */
export function SfxTrack({ hits }: { hits: SfxHit[] }) {
  const { durationInFrames } = useVideoConfig();
  return (
    <>
      {hits.map((hit, i) => {
        const r = resolveHit(hit, durationInFrames);
        const key = `${hit.src}-${hit.at}-${i}`;
        const len = r.until != null ? Math.max(1, r.until - r.from) : undefined;
        if (r.loop) {
          // 环境底：在 Sequence 里循环；volume 回调的帧号相对 Sequence 起点
          return (
            <Sequence key={key} from={r.from} durationInFrames={len} layout="none">
              <Audio
                src={`/${r.src}`}
                loop
                playbackRate={r.rate}
                volume={(f) => r.gain * envelopeAt(r, f + r.from)}
                loopVolumeCurveBehavior="extend"
              />
            </Sequence>
          );
        }
        return (
          <Sequence key={key} from={r.from} durationInFrames={len} layout="none">
            <Audio
              src={`/${r.src}`}
              playbackRate={r.rate}
              volume={r.fadeIn || r.fadeOut ? (f) => r.gain * envelopeAt(r, f + r.from) : r.gain}
            />
          </Sequence>
        );
      })}
    </>
  );
}
