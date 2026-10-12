import type { PlayerRef } from "@remotion/player";
import { useEffect, useState } from "react";
import { TimelineControls } from "@/components/timeline-controls";
import type { KeyframeMarker } from "@/lib/clip-data";

type Props = {
  player: PlayerRef | null;
  totalFrames: number;
  markers: KeyframeMarker[];
  playbackRate: number;
  isLoop: boolean;
  onPlaybackRateChange: (r: number) => void;
  onLoopToggle: () => void;
  onReplay: () => void;
};

/**
 * 时间轴自己订阅播放器事件：逐帧刷新只重绘这一小块，
 * 不让整个面板（表单、分镜列表）跟着每帧重渲染。
 */
export function PlayerTimeline({ player, ...rest }: Props) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!player) return;
    setFrame(player.getCurrentFrame());
    setPlaying(player.isPlaying());
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener("frameupdate", onFrame as unknown as () => void);
    player.addEventListener("seeked", onFrame as unknown as () => void);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onPause);
    return () => {
      player.removeEventListener("frameupdate", onFrame as unknown as () => void);
      player.removeEventListener("seeked", onFrame as unknown as () => void);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onPause);
    };
  }, [player]);
  return <TimelineControls player={player} playing={playing} currentFrame={frame} {...rest} />;
}
