import { createFileRoute } from "@tanstack/react-router";
import type { PlayerRef } from "@remotion/player";
import { CheckCircle2, Download, Film, FolderOpen, Layers, RotateCcw, Sparkles, Type } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BatchExportDialog } from "@/components/batch-export-dialog";
import { BeatList } from "@/components/beat-list";
import { ExportDialog } from "@/components/export-dialog";
import { PlayerTimeline } from "@/components/player-timeline";
import { RefVoAudio } from "@/components/ref-vo-audio";
import { RemotionStage } from "@/components/remotion-stage";
import { TextFields } from "@/components/text-fields";
import { STAGGER_MS, resolveBeat } from "@/lib/beat";
import { preloadIcons } from "@/lib/draw-stage";
import { downloadBlob, exportBeatFiles, type ExportProgress, type SoundMode } from "@/lib/export-webm";
import { rehydratePanel, usePanel } from "@/lib/panel-store";
import { DEFAULT_FONTS, FONT_OPTIONS, type FontId } from "@/remotion/shared/fonts";
import { CLIPS, EPISODE_NUMBERS, getEpisodeMeta } from "@/remotion/catalog";

export const Route = createFileRoute("/")({
  component: Home,
  codeSplitGroupings: [],
});

const field =
  "rounded-md border border-chrome-line/80 bg-chrome/60 px-2 py-1 text-sm text-chrome-fg focus:border-moss-fg/50 focus:outline-none";

function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => rehydratePanel(() => setOk(true)), []);
  return ok;
}

/** 参考口播文件是否真的部署了（没有就提示，而不是静默没声音） */
function useFileExists(src: string | undefined) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    if (!src) {
      setOk(null);
      return;
    }
    let alive = true;
    fetch(`/${src}`, { method: "HEAD" })
      .then((r) => {
        // SPA 回落会把不存在的路径返回成 index.html，所以还要看类型
        if (alive) setOk(r.ok && !(r.headers.get("content-type") ?? "").includes("text/html"));
      })
      .catch(() => {
        if (alive) setOk(false);
      });
    return () => {
      alive = false;
    };
  }, [src]);
  return ok;
}

function Home() {
  const hydrated = useHydrated();
  const store = usePanel();

  const episode = EPISODE_NUMBERS.includes(store.episode) ? store.episode : (EPISODE_NUMBERS[0] ?? 0);
  const clips = useMemo(() => CLIPS.filter((c) => c.episode === episode), [episode]);
  const clip = clips.find((c) => c.id === store.activeClip[episode]) ?? clips[0];
  const overrides = clip ? store.texts[clip.id] : undefined;
  const fontScale = store.fontScale[episode] ?? 1;
  const fonts = store.fonts[episode] ?? DEFAULT_FONTS;
  const resolved = useMemo(
    () => (clip ? resolveBeat(clip, overrides, { fontScale, fonts }) : null),
    [clip, overrides, fontScale, fonts],
  );
  const durations = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of clips) out[c.id] = resolveBeat(c).durationSec;
    return out;
  }, [clips]);
  const edited = useMemo(() => {
    const set = new Set<string>();
    for (const c of clips) {
      const t = store.texts[c.id] ?? {};
      if (c.fields.some((f) => t[f.key] !== undefined && t[f.key] !== f.default)) set.add(c.id);
    }
    return set;
  }, [clips, store.texts]);

  const [playId, setPlayId] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoop, setIsLoop] = useState(true);
  const [refVoOn, setRefVoOn] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [soundMode, setSoundMode] = useState<SoundMode>("mix");
  const abortRef = useRef<AbortController | null>(null);
  const playerRef = useRef<PlayerRef | null>(null);
  const [player, setPlayer] = useState<PlayerRef | null>(null);
  const handlePlayerReady = useCallback((p: PlayerRef | null) => {
    playerRef.current = p;
    setPlayer(p);
  }, []);
  const refVoExists = useFileExists(clip?.refVo?.src);

  useEffect(() => {
    void preloadIcons();
  }, []);

  const selectClip = useCallback(
    (id: string) => {
      store.selectClip(episode, id);
      setPlayId((n) => n + 1);
    },
    [store, episode],
  );

  const replay = useCallback(() => {
    setPlayId((n) => n + 1);
    playerRef.current?.seekTo(0);
    playerRef.current?.play();
  }, []);

  const handleStartExport = useCallback(
    async (format: "mp4" | "webm") => {
      if (!resolved) return;
      setExportError(null);
      setExportProgress({
        phase: "init",
        currentFrame: 0,
        totalFrames: resolved.totalFrames,
        percent: 0,
        message: "正在初始化离屏渲染…",
      });
      setIsExporting(true);
      setExportOpen(true);
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await exportBeatFiles(
          resolved.params,
          resolved.clip,
          resolved.clip.exportName,
          format,
          soundMode,
          (f) => downloadBlob(f.blob, f.filename),
          (p) => setExportProgress(p),
          controller.signal,
        );
      } catch (e) {
        setExportError(
          controller.signal.aborted ? "已取消导出" : e instanceof Error ? e.message : "导出失败，请重试",
        );
      } finally {
        setIsExporting(false);
        abortRef.current = null;
      }
    },
    [resolved, soundMode],
  );

  if (!hydrated) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-chrome text-chrome-muted">
        <span className="font-serif text-sm">正在载入本机存档…</span>
      </main>
    );
  }

  if (!clips.length || !clip || !resolved) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-chrome text-chrome-muted">
        <p className="font-serif text-sm">还没有任何一期。</p>
        <code className="rounded bg-surface px-2 py-1 font-mono text-xs text-moss-fg">
          npm run new:episode -- 23 本期标题
        </code>
      </main>
    );
  }

  const savedLabel = store.savedAt ? new Date(store.savedAt).toLocaleTimeString("zh-CN", { hour12: false }) : "";
  const fieldValues = store.texts[clip.id] ?? {};

  return (
    <main className="flex min-h-dvh flex-col bg-chrome text-chrome-fg">
      {/* 顶栏：品牌 · 选期 · 批量导出 · 保存状态 */}
      <header className="flex flex-wrap items-center gap-3 border-b border-chrome-line/50 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-sm border border-seal/60 bg-seal font-serif text-base font-black tracking-tighter text-paper shadow-sm">
            正上
          </div>
          <div>
            <p className="font-serif text-[10px] uppercase tracking-[0.25em] text-chrome-muted">正上茶舍 · 动画台</p>
            <p className="font-display text-sm font-bold">每期演示动画 · 预览 / 改字 / 导出</p>
          </div>
        </div>

        <label className="ml-2 flex items-center gap-1.5 text-xs text-chrome-muted">
          <span className="sr-only">切换期</span>
          <select
            aria-label="切换期"
            className={`${field} max-w-[19rem] py-1.5 font-serif`}
            value={episode}
            onChange={(e) => {
              store.selectEpisode(Number(e.target.value));
              setPlayId((n) => n + 1);
            }}
          >
            {EPISODE_NUMBERS.map((n) => (
              <option key={n} value={n}>
                第{n}期 · {getEpisodeMeta(n).title}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setBatchOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-moss px-3 py-1.5 text-xs font-medium text-moss-fg shadow hover:bg-moss/90"
        >
          <Download className="size-3.5" /> 批量导出本期（{clips.length} 个）
        </button>

        <label className="flex items-center gap-1.5 text-xs" title="整期画面文字的字号倍数，预览和导出一致">
          <Type className="size-3.5 text-chrome-muted" /> 字号
          <input
            aria-label="字号"
            type="range"
            min={0.8}
            max={1.3}
            step={0.05}
            value={fontScale}
            onChange={(e) => store.setFontScale(episode, Number(e.target.value))}
          />
          <span className="w-9 font-mono text-[10px] text-chrome-muted">{Math.round(fontScale * 100)}%</span>
          {fontScale !== 1 && (
            <button type="button" onClick={() => store.setFontScale(episode, 1)} className="text-[10px] text-chrome-muted hover:text-chrome-fg">
              复原
            </button>
          )}
        </label>

        <div className="flex items-center gap-1.5 text-xs" title="换掉画面里楷体 / 宋体位置的字体；包装、印章上的字不变。预览和导出一致">
          <span className="text-chrome-muted">字体</span>
          {(
            [
              ["body", "正文"],
              ["title", "标题"],
            ] as const
          ).map(([slot, label]) => (
            <label key={slot} className="flex items-center gap-1">
              <span className="text-[10px] text-chrome-muted">{label}</span>
              <select
                aria-label={`${label}字体`}
                className={`${field} py-0.5 text-xs`}
                value={fonts[slot]}
                onChange={(e) => store.setFonts(episode, { [slot]: e.target.value as FontId })}
              >
                {(Object.keys(FONT_OPTIONS) as FontId[]).map((id) => (
                  <option key={id} value={id}>
                    {FONT_OPTIONS[id].label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {(fonts.body !== DEFAULT_FONTS.body || fonts.title !== DEFAULT_FONTS.title) && (
            <button type="button" onClick={() => store.setFonts(episode, null)} className="text-[10px] text-chrome-muted hover:text-chrome-fg">
              复原
            </button>
          )}
        </div>

        <span
          className="ml-auto flex items-center gap-1 text-[11px] text-chrome-muted"
          title="改过的文案只存在这台电脑的浏览器里；动画以代码为准"
        >
          <CheckCircle2 className="size-3.5 text-emerald-400" />
          {savedLabel ? `改字已保存在本机 ${savedLabel}` : "改字自动保存在本机"}
        </span>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)_380px]">
        {/* 左：节拍列表 */}
        <aside className="flex min-h-0 flex-col gap-3 rounded-lg border border-chrome-line/70 bg-surface/80 p-3 lg:max-h-[calc(100dvh-5.5rem)]">
          <div className="flex items-center gap-1.5 font-serif text-sm">
            <Layers className="size-4 text-moss-fg" /> 第{episode}期 · {getEpisodeMeta(episode).title}
          </div>
          <BeatList clips={clips} activeId={clip.id} durations={durations} edited={edited} onSelect={selectClip} />
        </aside>

        {/* 中：预览 */}
        <section className="flex min-h-0 flex-col gap-3">
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-chrome-line/60 bg-gradient-to-b from-[#181410] via-[#130f0c] to-[#0c0907] p-3 shadow-inner">
            <div
              className="relative flex items-center justify-center overflow-hidden rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/10"
              style={{ aspectRatio: "9 / 16", height: "100%", maxHeight: "min(72dvh, 800px)", width: "auto", maxWidth: "100%" }}
            >
              <RemotionStage
                clipId={resolved.clip}
                playId={playId}
                staggerMs={STAGGER_MS}
                playbackRate={playbackRate}
                isLoop={isLoop}
                fontScale={resolved.fontScale}
                fonts={resolved.fonts}
                customTexts={resolved.texts}
                onPlayerReady={handlePlayerReady}
              />
            </div>
          </div>
          <PlayerTimeline
            player={player}
            totalFrames={resolved.totalFrames}
            markers={clip.markers}
            playbackRate={playbackRate}
            isLoop={isLoop}
            onPlaybackRateChange={setPlaybackRate}
            onLoopToggle={() => setIsLoop((v) => !v)}
            onReplay={replay}
          />
          {clip.refVo && (
            <div className="flex items-center gap-2 text-xs text-chrome-muted">
              <button
                type="button"
                aria-pressed={refVoOn}
                disabled={refVoExists === false}
                onClick={() => setRefVoOn((v) => !v)}
                className={`rounded-md border px-2.5 py-1 font-medium disabled:opacity-40 ${refVoOn ? "border-moss-fg/50 bg-moss/40 text-moss-fg" : "border-chrome-line text-chrome-muted hover:text-chrome-fg"}`}
              >
                参考口播 {refVoOn ? "开" : "关"}
              </button>
              <span className="truncate">
                {refVoExists === false
                  ? `没找到 public/${clip.refVo.src}，录音放进去并部署后才能对口播预览`
                  : `同步播放口播 ${clip.refVo.startSec.toFixed(1)}s 起的这一段 · 只在预览里，导出不带`}
              </span>
              <RefVoAudio player={player} refVo={clip.refVo} enabled={refVoOn} playbackRate={playbackRate} />
            </div>
          )}
        </section>

        {/* 右：节拍信息 · 文案 · 导出 */}
        <aside className="flex min-h-0 flex-col gap-3 lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto">
          <div className="rounded-lg border border-chrome-line/70 bg-surface/90 p-3.5 shadow-md">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold">{clip.code}</span>
              <span className="min-w-0 flex-1 truncate font-serif">{clip.title}</span>
              <span className="shrink-0 rounded-full border border-moss/40 bg-moss/20 px-2 py-0.5 font-mono text-[10px] text-moss-fg">
                {resolved.durationSec.toFixed(1)}s
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-chrome-muted">{clip.note}</p>
            <p className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-chrome-muted/80">
              <FolderOpen className="size-3" /> {clip.folder}
            </p>
          </div>

          <div className="rounded-lg border border-chrome-line/70 bg-surface/90 p-3.5 shadow-md">
            <div className="mb-2.5 flex items-center justify-between text-xs">
              <span className="font-serif text-chrome-fg">画面文案</span>
              {edited.has(clip.id) && (
                <button
                  type="button"
                  onClick={() => window.confirm("把这个节拍的文案全部恢复成代码里的默认值？") && store.resetClip(clip.id)}
                  className="flex items-center gap-1 text-[11px] text-chrome-muted hover:text-chrome-fg"
                >
                  <RotateCcw className="size-3" /> 全部恢复默认
                </button>
              )}
            </div>
            <TextFields
              fields={clip.fields}
              values={fieldValues}
              onChange={(k, v) => store.setText(clip.id, k, v)}
              onReset={(k) => store.resetText(clip.id, k)}
            />
            <p className="mt-3 text-[10px] leading-relaxed text-chrome-muted/80">
              这里改的字只存在本机浏览器，换电脑不会带过去。要长期生效，把改动告诉维护的人写进代码默认值。
            </p>
          </div>

          <div className="space-y-2.5 rounded-lg border border-chrome-line/70 bg-surface/90 p-3.5 shadow-lg">
            <div className="flex items-center justify-between text-xs text-chrome-muted">
              <span className="flex items-center gap-1.5 font-serif">
                <Film className="size-3.5 text-moss-fg" /> 导出当前节拍
              </span>
              <span className="truncate pl-2 font-mono text-[10px] text-moss-fg">{clip.exportName}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void handleStartExport("mp4")}
                disabled={isExporting}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-moss text-xs font-medium text-moss-fg shadow-md hover:bg-moss/90 disabled:opacity-50"
              >
                <Download className="size-3.5" /> MP4 (H.264)
              </button>
              <button
                type="button"
                onClick={() => void handleStartExport("webm")}
                disabled={isExporting}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-chrome-line/80 bg-chrome/50 text-xs font-medium text-chrome-fg hover:bg-chrome-line disabled:opacity-50"
              >
                <Sparkles className="size-3.5" /> 快速 WebM
              </button>
            </div>
            <div role="radiogroup" aria-label="音效导出方式" className="flex items-center gap-1.5 text-[11px]">
              <span className="text-chrome-muted">音效</span>
              {(
                [
                  ["mix", "合成进视频"],
                  ["stems", "分轨：无音效视频 + WAV"],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={soundMode === m}
                  disabled={isExporting}
                  onClick={() => setSoundMode(m)}
                  className={`rounded px-2 py-0.5 ${soundMode === m ? "bg-moss/80 text-moss-fg" : "border border-chrome-line/70 text-chrome-muted hover:text-chrome-fg"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {soundMode === "stems" && (
              <p className="text-[10px] leading-relaxed text-chrome-muted">
                音效轨为 48 kHz WAV，长度 = 帧数 ÷ 29.97，与视频逐帧对齐；剪辑里两条轨首帧对齐即可。
              </p>
            )}
          </div>
        </aside>
      </div>

      <BatchExportDialog
        open={batchOpen}
        episode={episode}
        clips={clips}
        texts={store.texts}
        fontScale={fontScale}
        fonts={fonts}
        onClose={() => setBatchOpen(false)}
      />
      <ExportDialog
        isOpen={exportOpen}
        progress={exportProgress}
        error={exportError}
        isExporting={isExporting}
        clipTitle={`${clip.code} ${clip.title}`}
        onCancel={() => abortRef.current?.abort()}
        onClose={() => setExportOpen(false)}
      />
    </main>
  );
}
