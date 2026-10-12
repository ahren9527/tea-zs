import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useMemo, useRef, useState } from "react";
import { StageErrorBoundary } from "@/components/stage-error";
import { resolveClip, type ClipRef } from "@/lib/draw-stage";
import { FPS, HEIGHT, WIDTH, PAPER_THEMES, type PaperThemeKey } from "@/remotion/shared/theme";
import { PaperThemeContext, FontSizeContext, CustomTextContext } from "@/remotion/shared/theme-context";

type Props = {
  /** 经典片段 id，或直接传 ClipDef（模板分镜） */
  clipId: ClipRef;
  /** 额外传给合成组件的 props（模板分镜的 templateId / content / timing） */
  extraProps?: Record<string, unknown>;
  /** 播放器重建的依据；不传时文案变化会重建播放器（经典片段的旧行为） */
  resetKey?: string;
  staggerMs: number;
  playId: number;
  playbackRate?: number;
  isLoop?: boolean;
  paperTheme?: PaperThemeKey;
  fontScale?: number;
  customTexts?: Record<string, string>;
  onPlayerReady?: (player: PlayerRef | null) => void;
  onPlayingChange?: (playing: boolean) => void;
  onFrameUpdate?: (frame: number) => void;
};

export function RemotionStage({
  clipId,
  extraProps,
  resetKey,
  staggerMs,
  playId,
  playbackRate = 1,
  isLoop = false,
  paperTheme = "classic",
  fontScale = 1,
  customTexts,
  onPlayerReady,
  onPlayingChange,
  onFrameUpdate,
}: Props) {
  const ref = useRef<PlayerRef>(null);
  const [mounted, setMounted] = useState(false);
  const clip = resolveClip(clipId);
  const staggerFrames = Math.max(6, Math.round((staggerMs / 1000) * FPS));
  const durationInFrames = Math.max(1, Math.round(clip.duration(staggerFrames)));
  const inputProps = useMemo(
    () => ({
      staggerFrames,
      customTexts,
      ...customTexts,
      paperTheme,
      fontScale,
      ...extraProps,
    }),
    [staggerFrames, customTexts, paperTheme, fontScale, extraProps],
  );
  const textKey = useMemo(() => resetKey ?? JSON.stringify(customTexts ?? {}), [customTexts, resetKey]);
  const playerKey = `${clip.id}-${playId}-${paperTheme}-${fontScale}-${staggerFrames}-${textKey}`;
  const themeColor = PAPER_THEMES[paperTheme]?.paper ?? "#f3ecdc";

  const ThemedComponent = useMemo(() => {
    const RawComp = clip.Comp;
    return function ThemedPlayerRoot(props: Record<string, unknown>) {
      const activeTheme = (props.paperTheme as PaperThemeKey) ?? paperTheme ?? "classic";
      const activeFontScale = (props.fontScale as number) ?? fontScale ?? 1;
      const activeTexts = (props.customTexts as Record<string, string>) ?? customTexts ?? {};
      return (
        <PaperThemeContext.Provider value={activeTheme}>
          <FontSizeContext.Provider value={activeFontScale}>
            <CustomTextContext.Provider value={activeTexts}>
              <RawComp
                {...(props as any)}
                fontScale={activeFontScale}
                customTexts={activeTexts}
                staggerFrames={staggerFrames}
              />
            </CustomTextContext.Provider>
          </FontSizeContext.Provider>
        </PaperThemeContext.Provider>
      );
    };
  }, [clip.Comp, paperTheme, fontScale, customTexts, staggerFrames]);

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
    onPlayerReady?.(player);

    const onFrame = (e: { detail: { frame: number } }) => {
      onFrameUpdate?.(e.detail.frame);
    };
    const onPlay = () => onPlayingChange?.(true);
    const onPause = () => onPlayingChange?.(false);
    const onEnded = () => onPlayingChange?.(false);

    player.addEventListener("frameupdate", onFrame as unknown as () => void);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onEnded);

    return () => {
      player.removeEventListener("frameupdate", onFrame as unknown as () => void);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onEnded);
    };
  }, [mounted, onPlayingChange, onFrameUpdate, onPlayerReady, playerKey]);

  if (!mounted) {
    return (
      <div
        className="aspect-reel h-full w-auto"
        style={{ aspectRatio: "9 / 16", backgroundColor: themeColor }}
      />
    );
  }

  return (
    <StageErrorBoundary resetKey={playerKey}>
      <Player
        key={playerKey}
        ref={ref}
        component={ThemedComponent}
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
        playbackRate={playbackRate}
        loop={isLoop}
        spaceKeyToPlayOrPause
        numberOfSharedAudioTags={12}
        style={{
          width: "100%",
          height: "100%",
          aspectRatio: "9 / 16",
          backgroundColor: themeColor,
          border: "none",
          outline: "none",
          boxShadow: "none",
        }}
      />
    </StageErrorBoundary>
  );
}

export function remotionLengthSec(clipId: ClipRef, staggerMs: number) {
  const clip = resolveClip(clipId);
  const staggerFrames = Math.max(6, Math.round((staggerMs / 1000) * FPS));
  return (clip.duration(staggerFrames) / FPS).toFixed(1);
}

export function remotionTotalFrames(clipId: ClipRef, staggerMs: number) {
  const clip = resolveClip(clipId);
  const staggerFrames = Math.max(6, Math.round((staggerMs / 1000) * FPS));
  return Math.max(1, Math.round(clip.duration(staggerFrames)));
}
