import { createFileRoute, Link } from "@tanstack/react-router";
import type { PlayerRef } from "@remotion/player";
import {
  BookOpen,
  CheckCircle2,
  Copy,
  Download,
  FileInput,
  Film,
  FilePlus2,
  Layers,
  Replace,
  RotateCcw,
  Settings2,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BatchExportDialog } from "@/components/studio/batch-export-dialog";
import { BeatList } from "@/components/studio/beat-list";
import { ImportDialog } from "@/components/studio/import-dialog";
import { SchemaForm } from "@/components/studio/schema-form";
import { TemplatePicker } from "@/components/studio/template-picker";
import { ExportDialog } from "@/components/export-dialog";
import { RemotionStage } from "@/components/remotion-stage";
import { RefVoAudio } from "@/components/ref-vo-audio";
import { refVoOf } from "@/remotion/shared/define-clip";
import { PlayerTimeline } from "@/components/studio/player-timeline";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { STATIC_MODE } from "@/lib/static-mode";
import { preloadIcons } from "@/lib/draw-stage";
import {
  downloadBlob,
  exportBeatFiles,
  type ExportProgress,
  type SoundMode,
} from "@/lib/export-webm";
import { useActiveEpisode, useEpisodes } from "@/episodes/store";
import { BESPOKE_STAGGER_MS, resolveBeat } from "@/templates/beat-clip";
import { getTemplate } from "@/templates/registry";
import { defaultExportName, type PaperThemeId } from "@/templates/schema";
import { PAPER_THEMES, type PaperThemeKey } from "@/remotion/shared/theme";

export const Route = createFileRoute("/")({
  component: Home,
  codeSplitGroupings: [],
});

const THEME_KEYS = Object.keys(PAPER_THEMES) as PaperThemeKey[];
const field =
  "rounded-md border border-chrome-line/80 bg-chrome/60 px-2 py-1 text-sm text-chrome-fg focus:border-moss-fg/50 focus:outline-none";

function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const unsub = useEpisodes.persist.onFinishHydration(() => setOk(true));
    void useEpisodes.persist.rehydrate();
    if (useEpisodes.persist.hasHydrated()) setOk(true);
    return unsub;
  }, []);
  return ok;
}

function Home() {
  const hydrated = useHydrated();
  const store = useEpisodes();
  const episode = useActiveEpisode();
  const activeBeatId = episode ? store.activeBeatId[episode.id] : undefined;
  const beat = episode?.beats.find((b) => b.id === activeBeatId) ?? episode?.beats[0];

  const [playId, setPlayId] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoop, setIsLoop] = useState(true);
  /** 参考口播（只在预览里放，导出不带） */
  const [refVoOn, setRefVoOn] = useState(false);
  const [tab, setTab] = useState<"content" | "timing">("content");
  const [picker, setPicker] = useState<null | "add" | "change">(null);
  const [importOpen, setImportOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [newMenu, setNewMenu] = useState(false);

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

  useEffect(() => {
    void preloadIcons();
  }, []);

  const resolved = useMemo(
    () => (beat && episode ? resolveBeat(beat, episode) : null),
    [beat, episode],
  );
  const durations = useMemo(() => {
    const out: Record<string, number> = {};
    if (episode) for (const b of episode.beats) out[b.id] = resolveBeat(b, episode).durationSec;
    return out;
  }, [episode]);

  const selectBeat = useCallback(
    (id: string) => {
      store.selectBeat(id);
      setPlayId((n) => n + 1);
    },
    [store],
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
        message: "正在初始化离屏渲染管线...",
      });
      setIsExporting(true);
      setExportOpen(true);
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await exportBeatFiles(
          resolved.params,
          resolved.clip,
          resolved.exportName,
          format,
          soundMode,
          (f) => downloadBlob(f.blob, f.filename),
          (p) => setExportProgress(p),
          controller.signal,
        );
      } catch (e) {
        setExportError(
          controller.signal.aborted
            ? "用户已取消视频导出"
            : e instanceof Error
              ? e.message
              : "导出失败，请重试",
        );
      } finally {
        setIsExporting(false);
        abortRef.current = null;
      }
    },
    [resolved, soundMode],
  );

  if (!hydrated || !episode) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-chrome text-chrome-muted">
        <span className="font-serif text-sm">
          {hydrated ? "还没有任何一期，点「恢复示例」或新建一期" : "正在载入本地存档…"}
        </span>
        {hydrated && (
          <button
            type="button"
            onClick={() => store.restoreSeeds()}
            className="ml-3 rounded border border-chrome-line px-3 py-1 text-xs"
          >
            恢复示例
          </button>
        )}
      </main>
    );
  }

  const tplDef = beat && beat.template !== "bespoke" ? getTemplate(beat.template) : undefined;
  const templateEps = store.episodes.filter((e) => !e.classic);
  const classicEps = store.episodes.filter((e) => e.classic);
  const savedLabel = store.savedAt
    ? new Date(store.savedAt).toLocaleTimeString("zh-CN", { hour12: false })
    : "";

  return (
    <main className="flex min-h-dvh flex-col bg-chrome text-chrome-fg">
      {/* 顶栏：品牌 · 期切换 · 新建 · 导入导出 */}
      <header className="flex flex-wrap items-center gap-3 border-b border-chrome-line/50 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-sm border border-seal/60 bg-seal font-serif text-base font-black tracking-tighter text-paper shadow-sm">
            正上
          </div>
          <div>
            <p className="font-serif text-[10px] uppercase tracking-[0.25em] text-chrome-muted">
              正上茶舍 · 口播动画台
            </p>
            <p className="font-display text-sm font-bold">每期定制动画 · 面板固定</p>
          </div>
        </div>

        <div className="ml-2 flex items-center gap-1.5">
          <label className="sr-only" htmlFor="ep-select">
            切换期
          </label>
          <select
            id="ep-select"
            aria-label="切换期"
            className={`${field} max-w-[19rem] py-1.5 font-serif`}
            value={episode.id}
            onChange={(e) => {
              store.selectEpisode(e.target.value);
              setPlayId((n) => n + 1);
            }}
          >
            {classicEps.length > 0 && (
              <optgroup label="定制期（src/remotion/epNN 手写动画）">
                {classicEps.map((e) => (
                  <option key={e.id} value={e.id}>
                    第{e.number}期 · {e.title}
                  </option>
                ))}
              </optgroup>
            )}
            {templateEps.length > 0 && (
              <optgroup label="模板期（从模板起步）">
                {templateEps.map((e) => (
                  <option key={e.id} value={e.id}>
                    第{e.number}期 · {e.title}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <div className="relative">
            <button
              type="button"
              onClick={() => setNewMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-md bg-moss px-3 py-1.5 text-xs font-medium text-moss-fg shadow hover:bg-moss/90"
            >
              <FilePlus2 className="size-3.5" /> 新建一期
            </button>
            {newMenu && (
              <div className="absolute left-0 z-40 mt-1 w-72 overflow-hidden rounded-md border border-chrome-line bg-surface text-xs shadow-xl">
                <div className="border-b border-chrome-line/60 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 font-medium text-chrome-fg">
                    <Sparkles className="size-3.5 text-moss-fg" /> 定制一期（主路径）
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-chrome-muted">
                    每个节拍的动画单独手写。在项目里运行下面的命令建好节拍文件夹，保存后这里自动出现新的一期：
                  </p>
                  <code className="mt-1.5 block select-all rounded bg-chrome px-2 py-1 font-mono text-[10px] text-moss-fg">
                    npm run new:clip -- 20 B1 标题
                  </code>
                  <p className="mt-1 text-[10px] text-chrome-muted">详见 docs/新建一期.md</p>
                </div>
                <p className="px-3 pt-2 text-[10px] uppercase tracking-widest text-chrome-muted">
                  从模板起步（可选）
                </p>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-chrome-line/50"
                  onClick={() => {
                    store.createEpisode("copy");
                    setNewMenu(false);
                  }}
                >
                  <Copy className="mt-0.5 size-3.5 text-moss-fg" />
                  <span>
                    复制当前期
                    <span className="block text-[10px] text-chrome-muted">
                      沿用分镜结构，只改文案
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-chrome-line/50"
                  onClick={() => {
                    store.createEpisode("blank");
                    setNewMenu(false);
                  }}
                >
                  <FilePlus2 className="mt-0.5 size-3.5 text-moss-fg" />
                  <span>
                    空白模板期
                    <span className="block text-[10px] text-chrome-muted">
                      只带开场 + 收尾两个模板分镜
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 border-t border-chrome-line/60 px-3 py-2 text-left hover:bg-chrome-line/50"
                  onClick={() => {
                    setImportOpen(true);
                    setNewMenu(false);
                  }}
                >
                  <FileInput className="mt-0.5 size-3.5 text-moss-fg" />
                  <span>
                    粘贴脚本生成
                    <span className="block text-[10px] text-chrome-muted">
                      一个分镜一块，自动建好整期
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-chrome-line/80 px-2.5 py-1.5 text-xs text-chrome-muted hover:text-chrome-fg"
          >
            <Replace className="size-3.5" /> 导入 / 导出
          </button>
          <Link
            to="/gallery"
            className="flex items-center gap-1.5 rounded-md border border-chrome-line/80 px-2.5 py-1.5 text-xs text-chrome-muted hover:text-chrome-fg"
          >
            <BookOpen className="size-3.5" /> 模板图鉴
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span
            className="flex items-center gap-1 text-[11px] text-chrome-muted"
            title="所有修改自动保存在本机浏览器"
          >
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            {savedLabel ? `已自动保存 ${savedLabel}` : "自动保存已开启"}
          </span>
          {!STATIC_MODE && (
            <>
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <a
                  href="/login"
                  className="rounded-md border border-chrome-line/80 bg-surface/60 px-3 py-1 text-xs font-serif text-chrome-muted hover:text-chrome-fg"
                >
                  登录
                </a>
              </SignedOut>
            </>
          )}
        </div>
      </header>

      {/* 本期设置 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-chrome-line/30 bg-surface/40 px-4 py-2 text-xs">
        <span className="flex items-center gap-1 text-chrome-muted">
          <Settings2 className="size-3.5" /> 本期
        </span>
        <label className="flex items-center gap-1.5">
          第
          <input
            aria-label="期数"
            type="number"
            min={1}
            className={`${field} w-16 text-center`}
            value={episode.number}
            onChange={(e) =>
              store.updateEpisode(episode.id, { number: Math.max(1, Number(e.target.value) || 1) })
            }
          />
          期
        </label>
        <label className="flex items-center gap-1.5">
          标题
          <input
            aria-label="本期标题"
            className={`${field} w-56 font-serif`}
            value={episode.title}
            onChange={(e) => store.updateEpisode(episode.id, { title: e.target.value })}
          />
        </label>
        <div className="flex items-center gap-1.5">
          纸色
          <div className="flex gap-1">
            {THEME_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                title={PAPER_THEMES[k].name}
                aria-label={`纸色 ${PAPER_THEMES[k].name}`}
                onClick={() => store.updateEpisode(episode.id, { theme: k as PaperThemeId })}
                className={`size-5 rounded-sm border shadow-inner transition-transform ${episode.theme === k ? "scale-110 border-moss-fg ring-1 ring-moss-fg" : "border-black/30"}`}
                style={{
                  background: `linear-gradient(135deg, ${PAPER_THEMES[k].paper} 55%, ${PAPER_THEMES[k].seal} 55%)`,
                }}
              />
            ))}
          </div>
        </div>
        <label className="flex items-center gap-1.5">
          <Type className="size-3.5 text-chrome-muted" /> 字号
          <input
            aria-label="字号"
            type="range"
            min={0.8}
            max={1.3}
            step={0.05}
            value={episode.fontScale}
            onChange={(e) => store.updateEpisode(episode.id, { fontScale: Number(e.target.value) })}
          />
          <span className="w-9 font-mono text-[10px] text-chrome-muted">
            {Math.round(episode.fontScale * 100)}%
          </span>
        </label>
        {episode.classic && (
          <span
            className="rounded bg-seal/25 px-2 py-0.5 text-[11px] text-red-200"
            title={`动画代码在 src/remotion/ep${episode.number}/`}
          >
            定制期：动画在 src/remotion/ep{episode.number}/，这里改文案与导出
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => store.restoreSeeds()}
            className="flex items-center gap-1 text-chrome-muted hover:text-chrome-fg"
            title="把定制期和模板示例期补回列表"
          >
            <RotateCcw className="size-3" /> 恢复示例
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `删除「第${episode.number}期 · ${episode.title}」？此操作不可撤销（可先导出 JSON 备份）。`,
                )
              )
                store.deleteEpisode(episode.id);
            }}
            className="flex items-center gap-1 text-chrome-muted hover:text-red-300"
          >
            <Trash2 className="size-3" /> 删除本期
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[290px_minmax(0,1fr)_390px]">
        {/* 左：分镜列表 */}
        <aside className="flex min-h-0 flex-col gap-3 rounded-lg border border-chrome-line/70 bg-surface/80 p-3 lg:max-h-[calc(100dvh-8.5rem)]">
          <div className="flex items-center gap-1.5 font-serif text-sm">
            <Layers className="size-4 text-moss-fg" /> 本期分镜
          </div>
          <BeatList
            episode={episode}
            activeBeatId={beat?.id}
            durations={durations}
            onSelect={selectBeat}
            onAdd={() => setPicker("add")}
            onMove={store.moveBeat}
            onReorder={store.reorderBeat}
            onDuplicate={store.duplicateBeat}
            onDelete={store.deleteBeat}
            onRenumber={store.renumber}
          />
          <button
            type="button"
            onClick={() => setBatchOpen(true)}
            disabled={!episode.beats.length}
            className="mt-auto flex items-center justify-center gap-1.5 rounded-md border border-moss-fg/40 bg-moss/40 py-2 text-xs font-medium text-moss-fg hover:bg-moss/60 disabled:opacity-40"
          >
            <Download className="size-3.5" /> 批量导出本期（{episode.beats.length} 个）
          </button>
        </aside>

        {/* 中：预览 */}
        <section className="flex min-h-0 flex-col gap-3">
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-chrome-line/60 bg-gradient-to-b from-[#181410] via-[#130f0c] to-[#0c0907] p-3 shadow-inner">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(107,78,49,0.08)_0%,transparent_70%)]" />
            {resolved && beat ? (
              <div
                className="aspect-reel relative flex items-center justify-center overflow-hidden rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/10"
                style={{
                  aspectRatio: "9 / 16",
                  height: "100%",
                  maxHeight: "min(70dvh, 780px)",
                  width: "auto",
                  maxWidth: "100%",
                }}
              >
                <RemotionStage
                  clipId={resolved.clip}
                  extraProps={resolved.extraProps}
                  resetKey={resolved.kind === "template" ? beat.id : undefined}
                  playId={playId}
                  staggerMs={BESPOKE_STAGGER_MS}
                  playbackRate={playbackRate}
                  isLoop={isLoop}
                  paperTheme={resolved.theme}
                  fontScale={resolved.fontScale}
                  customTexts={resolved.customTexts}
                  onPlayerReady={handlePlayerReady}
                />
              </div>
            ) : (
              <p className="text-sm text-chrome-muted">这一期还没有分镜，点左侧「添加分镜」。</p>
            )}
          </div>
          {resolved && (
            <PlayerTimeline
              player={player}
              totalFrames={resolved.totalFrames}
              markers={resolved.markers}
              playbackRate={playbackRate}
              isLoop={isLoop}
              onPlaybackRateChange={setPlaybackRate}
              onLoopToggle={() => setIsLoop((v) => !v)}
              onReplay={replay}
            />
          )}
          {resolved && refVoOf(resolved.clip) && (
            <div className="flex items-center gap-2 text-xs text-chrome-muted">
              <button
                type="button"
                aria-pressed={refVoOn}
                onClick={() => setRefVoOn((v) => !v)}
                className={`rounded-md border px-2.5 py-1 font-medium ${refVoOn ? "border-moss-fg/50 bg-moss/40 text-moss-fg" : "border-chrome-line text-chrome-muted hover:text-chrome-fg"}`}
              >
                参考口播 {refVoOn ? "开" : "关"}
              </button>
              <span className="truncate">
                同步播放马老师口播 {refVoOf(resolved.clip)!.startSec.toFixed(1)}s 起的这一段 ·
                只在预览里，导出不带
              </span>
              <RefVoAudio
                player={player}
                refVo={refVoOf(resolved.clip)}
                enabled={refVoOn}
                playbackRate={playbackRate}
              />
            </div>
          )}
        </section>

        {/* 右：表单 + 导出 */}
        <aside className="flex min-h-0 flex-col gap-3 lg:max-h-[calc(100dvh-8.5rem)] lg:overflow-y-auto">
          {beat && resolved ? (
            <>
              <div className="rounded-lg border border-chrome-line/70 bg-surface/90 p-3.5 shadow-md">
                <div className="flex items-center gap-2">
                  <input
                    aria-label="分镜编号"
                    className={`${field} w-16 font-mono font-bold`}
                    value={beat.code}
                    onChange={(e) => store.updateBeat(beat.id, { code: e.target.value })}
                  />
                  <input
                    aria-label="分镜标题"
                    className={`${field} min-w-0 flex-1 font-serif`}
                    value={beat.title}
                    onChange={(e) => store.updateBeat(beat.id, { title: e.target.value })}
                  />
                  <span className="shrink-0 rounded-full border border-moss/40 bg-moss/20 px-2 py-0.5 font-mono text-[10px] text-moss-fg">
                    {resolved.durationSec.toFixed(1)}s
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-chrome-muted">
                    {tplDef ? (
                      <>
                        模板：<span className="text-chrome-fg">{tplDef.name}</span>
                      </>
                    ) : (
                      <>定制片段（手写动画，代码在 {resolved?.clip.folder}）</>
                    )}
                  </span>
                  {tplDef && (
                    <button
                      type="button"
                      onClick={() => setPicker("change")}
                      className="shrink-0 rounded border border-chrome-line px-2 py-0.5 text-chrome-muted hover:text-chrome-fg"
                    >
                      换模板
                    </button>
                  )}
                </div>
                {resolved.error && (
                  <p className="mt-2 text-xs text-amber-300">⚠ {resolved.error}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1 rounded-lg border border-chrome-line/70 bg-surface/90 p-1 text-xs">
                {(
                  [
                    ["content", "文案"],
                    ["timing", "节奏与导出名"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className={`rounded-md py-1.5 ${tab === k ? "bg-moss font-semibold text-moss-fg" : "text-chrome-muted hover:text-chrome-fg"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-chrome-line/70 bg-surface/90 p-3.5 shadow-md">
                {tab === "content" ? (
                  <>
                    <SchemaForm
                      fields={resolved.fields}
                      content={beat.content}
                      onChange={(k, v) => store.setField(beat.id, k, v)}
                    />
                    {tplDef && (
                      <button
                        type="button"
                        onClick={() =>
                          window.confirm("把这个分镜的文案恢复成模板示例？") &&
                          store.resetBeatContent(beat.id)
                        }
                        className="mt-3 flex items-center gap-1 text-[11px] text-chrome-muted hover:text-chrome-fg"
                      >
                        <RotateCcw className="size-3" /> 恢复模板示例文案
                      </button>
                    )}
                  </>
                ) : (
                  <div className="space-y-3.5 text-xs">
                    {resolved.kind === "template" ? (
                      <>
                        <label className="block">
                          <span className="mb-1 flex justify-between">
                            <span>节奏</span>
                            <span className="font-mono text-chrome-muted">
                              {beat.timing.durationSec
                                ? `自动 ${resolved.plan?.pace.toFixed(2)}×`
                                : `${beat.timing.pace.toFixed(2)}×`}
                            </span>
                          </span>
                          <input
                            aria-label="节奏"
                            type="range"
                            className="w-full"
                            min={0.5}
                            max={2}
                            step={0.05}
                            disabled={Boolean(beat.timing.durationSec)}
                            value={beat.timing.pace}
                            onChange={(e) =>
                              store.setTiming(beat.id, { pace: Number(e.target.value) })
                            }
                          />
                          <span className="text-[10px] text-chrome-muted">
                            越大越快。填了下面的口播时长会自动计算。
                          </span>
                        </label>
                        <label className="block">
                          <span className="mb-1 flex justify-between">
                            <span>结尾定格</span>
                            <span className="font-mono text-chrome-muted">
                              {beat.timing.holdSec.toFixed(1)}s
                            </span>
                          </span>
                          <input
                            aria-label="结尾定格"
                            type="range"
                            className="w-full"
                            min={0}
                            max={4}
                            step={0.1}
                            value={beat.timing.holdSec}
                            onChange={(e) =>
                              store.setTiming(beat.id, { holdSec: Number(e.target.value) })
                            }
                          />
                        </label>
                        <div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(beat.timing.durationSec)}
                              onChange={(e) =>
                                store.setTiming(beat.id, {
                                  durationSec: e.target.checked
                                    ? Math.max(3, Math.round(resolved.durationSec))
                                    : undefined,
                                })
                              }
                            />
                            对齐口播时长
                          </label>
                          {beat.timing.durationSec ? (
                            <div className="mt-1.5 flex items-center gap-2">
                              <input
                                aria-label="口播时长"
                                type="number"
                                min={2}
                                max={120}
                                step={0.5}
                                className={`${field} w-24`}
                                value={beat.timing.durationSec}
                                onChange={(e) =>
                                  store.setTiming(beat.id, {
                                    durationSec: Math.max(2, Number(e.target.value) || 2),
                                  })
                                }
                              />
                              <span className="text-chrome-muted">秒（动画会铺满这段口播）</span>
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <p className="text-chrome-muted">
                        定制片段的节奏写在代码里，这里只能改导出名与纸色。
                      </p>
                    )}
                    <label className="block">
                      <span className="mb-1 block">导出文件名</span>
                      <input
                        className={`${field} w-full font-mono text-xs`}
                        placeholder={defaultExportName(episode.number, beat)}
                        value={beat.exportName ?? ""}
                        onChange={(e) =>
                          store.updateBeat(beat.id, { exportName: e.target.value || undefined })
                        }
                      />
                      <span className="text-[10px] text-chrome-muted">
                        留空自动：{defaultExportName(episode.number, beat)}
                      </span>
                    </label>
                    <label className="block">
                      <span className="mb-1 block">本分镜纸色</span>
                      <select
                        className={`${field} w-full`}
                        value={beat.theme ?? ""}
                        onChange={(e) =>
                          store.updateBeat(beat.id, {
                            theme: (e.target.value || undefined) as PaperThemeId | undefined,
                          })
                        }
                      >
                        <option value="">跟随本期（{PAPER_THEMES[episode.theme].name}）</option>
                        {THEME_KEYS.map((k) => (
                          <option key={k} value={k}>
                            {PAPER_THEMES[k].name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block">口播 / 剪辑备注（不进画面）</span>
                      <textarea
                        className={`${field} min-h-[4rem] w-full`}
                        value={beat.note ?? ""}
                        onChange={(e) =>
                          store.updateBeat(beat.id, { note: e.target.value || undefined })
                        }
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 rounded-lg border border-chrome-line/70 bg-surface/90 p-3.5 shadow-lg">
                <div className="flex items-center justify-between text-xs text-chrome-muted">
                  <span className="flex items-center gap-1.5 font-serif">
                    <Film className="size-3.5 text-moss-fg" /> 导出当前分镜
                  </span>
                  <span className="truncate pl-2 font-mono text-[10px] text-moss-fg">
                    {resolved.exportName}
                  </span>
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
                <div
                  role="radiogroup"
                  aria-label="音效导出方式"
                  className="flex items-center gap-1.5 text-[11px]"
                >
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
                    音效轨为 48 kHz WAV，长度 = 帧数 ÷
                    29.97，与视频逐帧对齐；剪映里两条轨首帧对齐即可。
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="rounded-lg border border-chrome-line/70 bg-surface/90 p-4 text-xs text-chrome-muted">
              选择或添加一个分镜开始编辑。
            </p>
          )}
        </aside>
      </div>

      <TemplatePicker
        open={picker != null}
        title={
          picker === "change" ? "换一个模板（同名字段的文案会保留）" : "添加分镜：选择节拍模板"
        }
        theme={episode.theme}
        current={picker === "change" ? beat?.template : undefined}
        onClose={() => setPicker(null)}
        onPick={(id) => {
          if (picker === "change" && beat) store.changeTemplate(beat.id, id);
          else store.addBeat(id, beat?.id);
          setPicker(null);
          setPlayId((n) => n + 1);
        }}
      />
      <ImportDialog
        open={importOpen}
        episode={episode}
        onClose={() => setImportOpen(false)}
        onImport={(raw, replace) => {
          const r = store.importEpisode(raw, replace ? { replaceId: episode.id } : undefined);
          setPlayId((n) => n + 1);
          return r.warnings;
        }}
      />
      <BatchExportDialog open={batchOpen} episode={episode} onClose={() => setBatchOpen(false)} />
      <ExportDialog
        isOpen={exportOpen}
        progress={exportProgress}
        error={exportError}
        isExporting={isExporting}
        clipTitle={beat ? `${beat.code} ${beat.title}` : ""}
        onCancel={() => abortRef.current?.abort()}
        onClose={() => setExportOpen(false)}
      />
    </main>
  );
}
