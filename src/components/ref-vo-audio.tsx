/**
 * 参考口播：面板预览时，按播放器当前帧同步播放整条口播里本片段对应的那一段。
 * 只是页面上的一个 <audio>，不在 Remotion 合成里，所以导出（MP4/WebM）永远不会带上它。
 */
import type { PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import type { RefVo } from "@/remotion/shared/define-clip";
import { FPS } from "@/remotion/shared/theme";

/** 偏差超过这个秒数才重新对时（避免频繁 seek 造成爆音） */
const DRIFT = 0.18;

export function RefVoAudio({
  player,
  refVo,
  enabled,
  playbackRate,
}: {
  player: PlayerRef | null;
  refVo: RefVo | undefined;
  enabled: boolean;
  playbackRate: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !player || !refVo || !enabled) {
      audio?.pause();
      return;
    }
    const target = () => refVo.startSec + player.getCurrentFrame() / FPS;
    const sync = (force = false) => {
      const t = target();
      if (force || Math.abs(audio.currentTime - t) > DRIFT) audio.currentTime = t;
    };
    const start = () => {
      sync(true);
      void audio.play().catch(() => {});
    };
    const stop = () => audio.pause();
    const onSeek = () => {
      sync(true);
      if (!player.isPlaying()) audio.pause();
    };
    const onFrame = () => {
      if (!player.isPlaying()) return;
      sync();
      if (audio.paused) void audio.play().catch(() => {});
    };
    audio.playbackRate = playbackRate;
    player.addEventListener("play", start);
    player.addEventListener("pause", stop);
    player.addEventListener("ended", stop);
    player.addEventListener("seeked", onSeek);
    player.addEventListener("frameupdate", onFrame);
    if (player.isPlaying()) start();
    return () => {
      player.removeEventListener("play", start);
      player.removeEventListener("pause", stop);
      player.removeEventListener("ended", stop);
      player.removeEventListener("seeked", onSeek);
      player.removeEventListener("frameupdate", onFrame);
      audio.pause();
    };
  }, [player, refVo, enabled, playbackRate]);

  if (!refVo) return null;
  return <audio ref={audioRef} src={`/${refVo.src}`} preload={enabled ? "auto" : "none"} />;
}
