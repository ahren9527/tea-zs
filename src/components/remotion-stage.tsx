import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useMemo, useRef, useState } from "react";
import { StageErrorBoundary } from "@/components/stage-error";
import { getClip } from "@/remotion/catalog";
import { FPS, HEIGHT, WIDTH } from "@/remotion/shared/theme";

type Props = {
  clipId: string;
  staggerMs: number;
  playId: number;
  onPlayingChange?: (playing: boolean) => void;
};

export function RemotionStage({ clipId, staggerMs, playId, onPlayingChange }: Props) {
  const ref = useRef<PlayerRef>(null);
  const [mounted, setMounted] = useState(false);
  const clip = getClip(clipId);
  const staggerFrames = Math.max(6, Math.round((staggerMs / 1000) * FPS));
  const durationInFrames = Math.max(1, Math.round(clip.duration(staggerFrames)));
  const inputProps = useMemo(() => ({ staggerFrames }), [staggerFrames]);
  const playerKey = `${clipId}-${playId}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const player = ref.current;
    if (!player || !mounted) return;
    player.seekTo(0);
    player.play();
  }, [playId, mounted, playerKey]);

  useEffect(() => {
    const player = ref.current;
    if (!player || !mounted) return;
    const onPlay = () => onPlayingChange?.(true);
    const onPause = () => onPlayingChange?.(false);
    const onEnded = () => onPlayingChange?.(false);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onEnded);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onEnded);
    };
  }, [mounted, onPlayingChange, playerKey]);

  if (!mounted) {
    return <div className="aspect-reel w-full bg-paper" />;
  }

  return (
    <StageErrorBoundary resetKey={playerKey}>
      <Player
        key={playerKey}
        ref={ref}
        component={clip.Comp}
        inputProps={inputProps}
        durationInFrames={durationInFrames}
        compositionWidth={WIDTH}
        compositionHeight={HEIGHT}
        fps={FPS}
        acknowledgeRemotionLicense
        autoPlay
        controls={false}
        clickToPlay
        showVolumeControls={false}
        allowFullscreen={false}
        numberOfSharedAudioTags={12}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#f3ecdc",
          border: "none",
          outline: "none",
          boxShadow: "none",
        }}
      />
    </StageErrorBoundary>
  );
}

export function remotionLengthSec(clipId: string, staggerMs: number) {
  const clip = getClip(clipId);
  const staggerFrames = Math.max(6, Math.round((staggerMs / 1000) * FPS));
  return (clip.duration(staggerFrames) / FPS).toFixed(1);
}
