import type { PlayerRef } from "@remotion/player";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type KeyframeMarker } from "@/lib/clip-data";
import { FPS } from "@/remotion/shared/theme";

type Props = {
  player: PlayerRef | null;
  playing: boolean;
  currentFrame: number;
  totalFrames: number;
  markers: KeyframeMarker[];
  playbackRate: number;
  isLoop: boolean;
  onPlaybackRateChange: (rate: number) => void;
  onLoopToggle: () => void;
  onReplay: () => void;
};

export function TimelineControls({
  player,
  playing,
  currentFrame,
  totalFrames,
  markers,
  playbackRate,
  isLoop,
  onPlaybackRateChange,
  onLoopToggle,
  onReplay,
}: Props) {
  const [isMuted, setIsMuted] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<KeyframeMarker | null>(null);

  const safeTotal = Math.max(1, totalFrames);
  const safeCurrent = Math.min(safeTotal, Math.max(0, currentFrame));
  const progressPercent = (safeCurrent / safeTotal) * 100;
  const currentSec = (safeCurrent / FPS).toFixed(1);
  const totalSec = (safeTotal / FPS).toFixed(1);

  const togglePlay = useCallback(() => {
    if (!player) return;
    if (playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, playing]);

  const stepFrame = useCallback(
    (delta: number) => {
      if (!player) return;
      player.pause();
      const target = Math.max(0, Math.min(safeTotal - 1, safeCurrent + delta));
      player.seekTo(target);
    },
    [player, safeTotal, safeCurrent],
  );

  const seekToPercent = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!player) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const targetFrame = Math.round(pct * (safeTotal - 1));
      player.seekTo(targetFrame);
    },
    [player, safeTotal],
  );

  const toggleMute = useCallback(() => {
    if (!player) return;
    if (isMuted) {
      player.unmute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  }, [player, isMuted]);

  // Global hotkeys when focused or anywhere on the studio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "[" || e.key === "ArrowLeft") {
        e.preventDefault();
        stepFrame(e.shiftKey ? -10 : -1);
      } else if (e.key === "]" || e.key === "ArrowRight") {
        e.preventDefault();
        stepFrame(e.shiftKey ? 10 : 1);
      } else if (e.key === "Home" || e.key === "0") {
        e.preventDefault();
        player?.seekTo(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, stepFrame, player]);

  return (
    <div className="flex flex-col gap-2 rounded-sm bg-surface p-3 text-chrome-fg">
      {/* Scrubber Progress Bar with Keyframe Markers */}
      <div className="relative flex flex-col gap-1.5">
        <div
          role="slider"
          aria-label="视频时间轴"
          aria-valuemin={0}
          aria-valuemax={safeTotal}
          aria-valuenow={safeCurrent}
          tabIndex={0}
          onClick={seekToPercent}
          className="group relative h-4 w-full cursor-pointer flex items-center select-none"
        >
          {/* Background track */}
          <div className="relative h-1.5 w-full rounded-full bg-chrome-line transition-all group-hover:h-2">
            {/* Active progress fill */}
            <div
              className="h-full rounded-full bg-moss transition-[width] duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Keyframe Markers */}
          {markers.map((marker, idx) => {
            const markerPct = Math.min(100, Math.max(0, (marker.frame / safeTotal) * 100));
            const isPassed = safeCurrent >= marker.frame;
            return (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  player?.seekTo(marker.frame);
                }}
                onMouseEnter={() => setHoveredMarker(marker)}
                onMouseLeave={() => setHoveredMarker(null)}
                style={{ left: `${markerPct}%` }}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-1 cursor-pointer"
              >
                <span
                  className={`block size-2 rounded-full border border-surface transition-transform hover:scale-150 ${
                    marker.type === "stamp"
                      ? "bg-seal"
                      : marker.type === "punchline"
                      ? "bg-amber-500"
                      : isPassed
                      ? "bg-moss-fg"
                      : "bg-chrome-muted"
                  }`}
                />
              </div>
            );
          })}

          {/* Scrubber thumb */}
          <div
            style={{ left: `${progressPercent}%` }}
            className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-3.5 rounded-full bg-moss-fg shadow-sm transition-transform group-hover:scale-125"
          />
        </div>

        {/* Hover / Marker Tooltip */}
        {hoveredMarker ? (
          <div className="flex items-center gap-1.5 text-xs text-chrome-muted animate-fadeIn">
            <span className="font-mono text-moss-fg">
              {hoveredMarker.timeSec.toFixed(1)}s (第{hoveredMarker.frame}帧)
            </span>
            <span className="rounded bg-chrome-line px-1.5 py-0.5 text-[10px] text-chrome-fg">
              {hoveredMarker.tag}
            </span>
            <span>{hoveredMarker.label}</span>
          </div>
        ) : null}
      </div>

      {/* Control Buttons & Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-chrome-line/40 text-xs">
        {/* Playback Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={togglePlay}
            title={playing ? "暂停 (空格键)" : "播放 (空格键)"}
            className="flex size-7 items-center justify-center rounded bg-moss text-moss-fg transition-transform active:scale-95"
          >
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>

          <button
            type="button"
            onClick={onReplay}
            title="从头开始播放"
            className="flex size-7 items-center justify-center rounded text-chrome-muted transition-colors hover:bg-chrome-line hover:text-chrome-fg"
          >
            <RotateCcw className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={() => stepFrame(-1)}
            title="上一帧 (快捷键: [ 或 ←)"
            className="flex size-7 items-center justify-center rounded text-chrome-muted transition-colors hover:bg-chrome-line hover:text-chrome-fg"
          >
            <ChevronLeft className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={() => stepFrame(1)}
            title="下一帧 (快捷键: ] 或 →)"
            className="flex size-7 items-center justify-center rounded text-chrome-muted transition-colors hover:bg-chrome-line hover:text-chrome-fg"
          >
            <ChevronRight className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={onLoopToggle}
            title={isLoop ? "循环已开启" : "循环已关闭"}
            className={`flex size-7 items-center justify-center rounded transition-colors ${
              isLoop ? "bg-moss/20 text-moss-fg" : "text-chrome-muted hover:text-chrome-fg"
            }`}
          >
            <Repeat className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? "取消静音" : "静音音效"}
            className="flex size-7 items-center justify-center rounded text-chrome-muted transition-colors hover:bg-chrome-line hover:text-chrome-fg"
          >
            {isMuted ? <VolumeX className="size-3.5 text-seal" /> : <Volume2 className="size-3.5" />}
          </button>
        </div>

        {/* Time & Frame Counter */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-chrome-muted">
          <span>
            {currentSec}s / {totalSec}s
          </span>
          <span className="text-chrome-line">|</span>
          <span>
            {safeCurrent} / {safeTotal} 帧
          </span>
        </div>

        {/* Playback Rate Selector */}
        <div className="flex items-center gap-1">
          {[0.5, 1, 1.5, 2].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => onPlaybackRateChange(rate)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                playbackRate === rate
                  ? "bg-moss text-moss-fg font-medium"
                  : "text-chrome-muted hover:text-chrome-fg"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
