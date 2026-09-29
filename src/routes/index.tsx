import { createFileRoute } from "@tanstack/react-router";
import type { PlayerRef } from "@remotion/player";
import { Download, Film, Layers, Settings, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContentInspector } from "@/components/content-inspector";
import { ExportDialog } from "@/components/export-dialog";
import {
  RemotionStage,
  remotionLengthSec,
  remotionTotalFrames,
} from "@/components/remotion-stage";
import { TimelineControls } from "@/components/timeline-controls";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { getDefaultTextsForClip, getMarkersForClip } from "@/lib/clip-data";
import { preloadIcons, type AnimParams } from "@/lib/draw-stage";
import { downloadBlob, exportMp4, exportWebm, type ExportProgress } from "@/lib/export-webm";
import { CLIPS, getClip } from "@/remotion/catalog";
import { type PaperThemeKey } from "@/remotion/shared/theme";

export const Route = createFileRoute("/")({
  component: Home,
  codeSplitGroupings: [],
});

function Home() {
  const [clipId, setClipId] = useState(CLIPS[0].id);
  const [playId, setPlayId] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoop, setIsLoop] = useState(false);
  const [stagger, setStagger] = useState(320);
  const [paperTheme, setPaperTheme] = useState<PaperThemeKey>("classic");
  const [fontScale, setFontScale] = useState(1.0);

  // Custom texts per clip ID
  const [customTextsStore, setCustomTextsStore] = useState<Record<string, Record<string, string>>>({});

  // Active episode filter: 19 | 18 | "all"
  const [selectedEpisode, setSelectedEpisode] = useState<number | "all">(19);

  // Export State
  const [exportOpen, setExportOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Inspector tab in right panel
  const [activeTab, setActiveTab] = useState<"inspector" | "clips">("inspector");

  const playerRef = useRef<PlayerRef | null>(null);
  const clip = getClip(clipId);
  const markers = useMemo(() => getMarkersForClip(clipId), [clipId]);
  const totalFrames = useMemo(() => remotionTotalFrames(clipId, stagger), [clipId, stagger]);

  // Filtered clips based on selectedEpisode
  const displayedClips = useMemo(() => {
    if (selectedEpisode === "all") return CLIPS;
    return CLIPS.filter((c) => c.episode === selectedEpisode);
  }, [selectedEpisode]);

  const switchEpisode = useCallback((ep: number | "all") => {
    setSelectedEpisode(ep);
    if (ep !== "all") {
      const firstInEp = CLIPS.find((c) => c.episode === ep);
      if (firstInEp) {
        setClipId(firstInEp.id);
        setPlayId((n) => n + 1);
        setCurrentFrame(0);
      }
    }
  }, []);

  useEffect(() => {
    void preloadIcons();
  }, []);

  const activeCustomTexts = useMemo(() => {
    return customTextsStore[clipId] ?? getDefaultTextsForClip(clipId);
  }, [customTextsStore, clipId]);

  const params: AnimParams = useMemo(
    () => ({
      startMs: 280,
      staggerMs: stagger,
      durationMs: 420,
      customTexts: activeCustomTexts,
      paperTheme,
      fontScale,
    }),
    [stagger, activeCustomTexts, paperTheme, fontScale],
  );

  const handlePlayerReady = useCallback((player: PlayerRef | null) => {
    playerRef.current = player;
  }, []);

  const handleFrameUpdate = useCallback((frame: number) => {
    setCurrentFrame(frame);
  }, []);

  const replay = useCallback(() => {
    setPlayId((n) => n + 1);
    setCurrentFrame(0);
    playerRef.current?.seekTo(0);
    playerRef.current?.play();
  }, []);

  const selectClip = useCallback((id: string) => {
    setClipId(id);
    setPlayId((n) => n + 1);
    setCurrentFrame(0);
  }, []);

  const handleCustomTextChange = useCallback(
    (key: string, value: string) => {
      setCustomTextsStore((prev) => ({
        ...prev,
        [clipId]: {
          ...(prev[clipId] ?? getDefaultTextsForClip(clipId)),
          [key]: value,
        },
      }));
    },
    [clipId],
  );

  const handleResetDefaults = useCallback(() => {
    setCustomTextsStore((prev) => {
      const copy = { ...prev };
      delete copy[clipId];
      return copy;
    });
  }, [clipId]);

  const handleStartExport = useCallback(
    async (format: "mp4" | "webm") => {
      setExportError(null);
      setExportProgress({
        phase: "init",
        currentFrame: 0,
        totalFrames,
        percent: 0,
        message: "正在初始化离屏渲染管线...",
      });
      setIsExporting(true);
      setExportOpen(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let blob: Blob;
        if (format === "mp4") {
          blob = await exportMp4(
            params,
            clip.id,
            (p) => setExportProgress(p),
            controller.signal,
          );
        } else {
          blob = await exportWebm(
            params,
            clip.id,
            (p) => setExportProgress(p),
            controller.signal,
          );
        }
        const filename =
          format === "mp4"
            ? clip.exportName
            : clip.exportName.replace(/\.mp4$/i, ".webm");
        downloadBlob(blob, filename);
      } catch (e) {
        if (controller.signal.aborted) {
          setExportError("用户已取消视频导出");
        } else {
          setExportError(e instanceof Error ? e.message : "导出失败，请重试");
        }
      } finally {
        setIsExporting(false);
        abortRef.current = null;
      }
    },
    [params, clip, totalFrames],
  );

  const handleCancelExport = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  return (
    <main className="min-h-dvh bg-chrome text-chrome-fg select-none">
      <div className="mx-auto grid min-h-dvh max-w-7xl gap-5 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch">
        {/* Left Side: Video Preview + Timeline Control Bar */}
        <section className="flex min-h-0 flex-col gap-3">
          {/* Header */}
          <header className="flex items-center justify-between gap-3 border-b border-chrome-line/40 pb-3">
            <div className="flex items-center gap-3">
              {/* Vermilion Traditional Chinese Seal Brand */}
              <div className="flex size-9 items-center justify-center rounded-sm bg-seal text-paper font-serif font-black text-base shadow-sm border border-seal/60 tracking-tighter">
                正上
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-serif text-[11px] tracking-[0.25em] text-chrome-muted uppercase">
                    正上茶舍 · 动态排版工坊
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-700/40 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    29.97 FPS · 9:16
                  </span>
                </div>
                <h1 className="font-serif text-lg font-bold flex items-center gap-2 text-chrome-fg">
                  <span>口播动态排版系统</span>
                  <div className="flex items-center rounded-md bg-chrome/60 p-0.5 border border-chrome-line/70 text-xs font-serif">
                    <button
                      type="button"
                      onClick={() => switchEpisode(19)}
                      className={`px-2.5 py-1 rounded transition-all font-medium ${
                        selectedEpisode === 19
                          ? "bg-moss text-moss-fg shadow-sm font-semibold"
                          : "text-chrome-muted hover:text-chrome-fg"
                      }`}
                    >
                      第 19 期 · 散茶大换气 (B1)
                    </button>
                    <button
                      type="button"
                      onClick={() => switchEpisode(18)}
                      className={`px-2.5 py-1 rounded transition-all font-medium ${
                        selectedEpisode === 18
                          ? "bg-moss text-moss-fg shadow-sm font-semibold"
                          : "text-chrome-muted hover:text-chrome-fg"
                      }`}
                    >
                      第 18 期 · 存茶三法则
                    </button>
                    <button
                      type="button"
                      onClick={() => switchEpisode("all")}
                      className={`px-2 py-1 rounded transition-all font-medium ${
                        selectedEpisode === "all"
                          ? "bg-moss text-moss-fg shadow-sm font-semibold"
                          : "text-chrome-muted hover:text-chrome-fg"
                      }`}
                    >
                      全部
                    </button>
                  </div>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <a
                  href="/login"
                  className="rounded-md border border-chrome-line/80 bg-surface/60 px-3.5 py-1.5 text-xs font-serif text-chrome-muted transition-colors hover:border-chrome-muted hover:text-chrome-fg"
                >
                  登录
                </a>
              </SignedOut>
            </div>
          </header>

          {/* Canvas & Player Container - Strict 9:16 Lock with Floating Paper Aesthetic */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center rounded-lg bg-gradient-to-b from-[#181410] via-[#130f0c] to-[#0c0907] p-2.5 sm:p-5 border border-chrome-line/60 shadow-inner overflow-hidden">
            {/* Ambient Background Radial Glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(107,78,49,0.08)_0%,transparent_70%)]" />

            {/* Stage Viewport */}
            <div
              id="stage-viewport-container"
              className="aspect-reel relative flex items-center justify-center overflow-hidden rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/10"
              style={{
                aspectRatio: "9 / 16",
                height: "100%",
                maxHeight: "min(68dvh, 760px)",
                width: "auto",
                maxWidth: "100%",
              }}
            >
              <RemotionStage
                clipId={clipId}
                playId={playId}
                staggerMs={stagger}
                playbackRate={playbackRate}
                isLoop={isLoop}
                paperTheme={paperTheme}
                fontScale={fontScale}
                customTexts={activeCustomTexts}
                onPlayerReady={handlePlayerReady}
                onPlayingChange={setPlaying}
                onFrameUpdate={handleFrameUpdate}
              />
            </div>
          </div>

          {/* Timeline Controls */}
          <TimelineControls
            player={playerRef.current}
            playing={playing}
            currentFrame={currentFrame}
            totalFrames={totalFrames}
            markers={markers}
            playbackRate={playbackRate}
            isLoop={isLoop}
            onPlaybackRateChange={setPlaybackRate}
            onLoopToggle={() => setIsLoop((v) => !v)}
            onReplay={replay}
          />

          {/* Keyboard Shortcuts Hint Bar */}
          <div className="hidden sm:flex items-center justify-between px-2 text-[11px] text-chrome-muted">
            <div className="flex items-center gap-4 font-mono">
              <span>
                <kbd className="rounded bg-surface border border-chrome-line px-1 py-0.5 text-[10px]">
                  空格
                </kbd>{" "}
                播放/暂停
              </span>
              <span>
                <kbd className="rounded bg-surface border border-chrome-line px-1 py-0.5 text-[10px]">
                  [
                </kbd>{" "}
                <kbd className="rounded bg-surface border border-chrome-line px-1 py-0.5 text-[10px]">
                  ]
                </kbd>{" "}
                逐帧步进
              </span>
              <span>
                <kbd className="rounded bg-surface border border-chrome-line px-1 py-0.5 text-[10px]">
                  Shift
                </kbd>
                +
                <kbd className="rounded bg-surface border border-chrome-line px-1 py-0.5 text-[10px]">
                  方向键
                </kbd>{" "}
                步进10帧
              </span>
              <span>
                <kbd className="rounded bg-surface border border-chrome-line px-1 py-0.5 text-[10px]">
                  0
                </kbd>{" "}
                回到开头
              </span>
            </div>
            <span className="text-moss-fg font-serif">1080×1920 (9:16) 超清宣纸动效</span>
          </div>
        </section>

        {/* Right Side: Clip Selector, Customization Inspector & Export */}
        <aside className="flex flex-col gap-4 border-t border-chrome-line/40 pt-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 overflow-y-auto max-h-[calc(100dvh-2rem)]">
          {/* Active Clip Overview Banner */}
          <div className="rounded-lg bg-surface/90 p-4 border border-chrome-line/70 shadow-md backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono tracking-widest text-chrome-muted">
                {clip.code} · 第{clip.episode}期 · 29.97fps
              </span>
              <span className="rounded-full bg-moss/20 border border-moss/30 px-2 py-0.5 text-[10px] text-moss-fg font-mono">
                约 {remotionLengthSec(clipId, stagger)}s
              </span>
            </div>
            <h2 className="mt-1.5 font-serif text-lg font-bold text-chrome-fg flex items-center gap-2">
              <span>{clip.title}</span>
            </h2>
            <p className="mt-1 text-xs leading-5 text-chrome-muted/90 font-serif">{clip.note}</p>
          </div>

          {/* Quick Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface/90 p-1 border border-chrome-line/70 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("inspector")}
              className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-all ${
                activeTab === "inspector"
                  ? "bg-moss text-moss-fg shadow-sm font-semibold"
                  : "text-chrome-muted hover:text-chrome-fg hover:bg-chrome-line/30"
              }`}
            >
              <Settings className="size-3.5" />
              <span>文案与材质调节</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("clips")}
              className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-all ${
                activeTab === "clips"
                  ? "bg-moss text-moss-fg shadow-sm font-semibold"
                  : "text-chrome-muted hover:text-chrome-fg hover:bg-chrome-line/30"
              }`}
            >
              <Layers className="size-3.5" />
              <span>分镜片段 ({displayedClips.length})</span>
            </button>
          </div>

          {/* Clip Selector Grid (Shown when "clips" tab or directly available) */}
          {activeTab === "clips" ? (
            <div className="space-y-3 rounded-lg bg-surface/90 p-3.5 border border-chrome-line/70 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs text-chrome-muted font-serif">选择要编辑或渲染的分镜片段：</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => switchEpisode(19)}
                    className={`px-2 py-0.5 rounded text-[11px] font-serif transition-colors ${
                      selectedEpisode === 19
                        ? "bg-moss text-moss-fg font-semibold"
                        : "text-chrome-muted hover:text-chrome-fg bg-chrome/40"
                    }`}
                  >
                    Ep19 ({CLIPS.filter((c) => c.episode === 19).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => switchEpisode(18)}
                    className={`px-2 py-0.5 rounded text-[11px] font-serif transition-colors ${
                      selectedEpisode === 18
                        ? "bg-moss text-moss-fg font-semibold"
                        : "text-chrome-muted hover:text-chrome-fg bg-chrome/40"
                    }`}
                  >
                    Ep18 ({CLIPS.filter((c) => c.episode === 18).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => switchEpisode("all")}
                    className={`px-2 py-0.5 rounded text-[11px] font-serif transition-colors ${
                      selectedEpisode === "all"
                        ? "bg-moss text-moss-fg font-semibold"
                        : "text-chrome-muted hover:text-chrome-fg bg-chrome/40"
                    }`}
                  >
                    全部
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {displayedClips.map((item) => {
                  const on = item.id === clipId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectClip(item.id)}
                      className={`flex flex-col items-start rounded-md p-2.5 text-left transition-all ${
                        on
                          ? "bg-moss text-moss-fg shadow-md ring-1 ring-moss-fg/40"
                          : "bg-chrome/60 border border-chrome-line/60 text-chrome-muted hover:border-chrome-muted hover:text-chrome-fg hover:bg-chrome-line/20"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-[11px] font-bold">{item.code}</span>
                        <span className="text-[9px] font-mono opacity-70">第{item.episode}期</span>
                      </div>
                      <span className="truncate text-xs font-serif mt-0.5">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Content Inspector (Default Tab) */
            <ContentInspector
              clipId={clipId}
              clipTitle={clip.title}
              staggerMs={stagger}
              onStaggerChange={setStagger}
              paperTheme={paperTheme}
              onPaperThemeChange={setPaperTheme}
              fontScale={fontScale}
              onFontScaleChange={setFontScale}
              customTexts={activeCustomTexts}
              onCustomTextChange={handleCustomTextChange}
              onResetDefaults={handleResetDefaults}
            />
          )}

          {/* Export Action Card */}
          <div className="mt-auto space-y-3 rounded-lg bg-surface/90 p-4 border border-chrome-line/70 shadow-lg">
            <div className="flex items-center justify-between text-xs text-chrome-muted">
              <span className="flex items-center gap-1.5 font-serif">
                <Film className="size-3.5 text-moss-fg" />
                <span>超清视频离屏渲染引擎</span>
              </span>
              <span className="text-[10px] font-mono text-moss-fg bg-moss/15 px-1.5 py-0.5 rounded">
                WebCodecs · 29.97 FPS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleStartExport("mp4")}
                disabled={isExporting}
                className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-moss px-3 text-xs font-medium text-moss-fg shadow-md transition-all active:scale-95 hover:bg-moss/90 disabled:opacity-50"
              >
                <Download className="size-3.5" />
                <span>导出 MP4 (H.264)</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartExport("webm")}
                disabled={isExporting}
                className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-chrome-line/80 bg-chrome/50 px-3 text-xs font-medium text-chrome-fg transition-all hover:bg-chrome-line hover:text-white disabled:opacity-50"
              >
                <Sparkles className="size-3.5" />
                <span>快速 WebM</span>
              </button>
            </div>

            <p className="text-[11px] text-chrome-muted/80 leading-relaxed font-serif">
              纯浏览器离屏逐帧渲染，自动混音茶道实录白噪音与朱红印章敲击音效，文件生成后自动触发本地下载。
            </p>
          </div>
        </aside>
      </div>

      {/* Export Progress Modal */}
      <ExportDialog
        isOpen={exportOpen}
        progress={exportProgress}
        error={exportError}
        isExporting={isExporting}
        clipTitle={clip.title}
        onCancel={handleCancelExport}
        onClose={() => setExportOpen(false)}
      />
    </main>
  );
}
