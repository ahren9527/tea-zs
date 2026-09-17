import { createFileRoute } from "@tanstack/react-router";
import { Download, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RemotionStage, remotionLengthSec } from "@/components/remotion-stage";
import { downloadBlob, exportMp4 } from "@/lib/export-webm";
import { preloadIcons, type AnimParams } from "@/lib/draw-stage";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { CLIPS, getClip } from "@/remotion/catalog";

export const Route = createFileRoute("/")({
  component: Home,
  codeSplitGroupings: [],
});

function Home() {
  const [clipId, setClipId] = useState(CLIPS[0].id);
  const [playId, setPlayId] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stagger, setStagger] = useState(320);
  const clip = getClip(clipId);

  useEffect(() => {
    void preloadIcons();
  }, []);

  const params: AnimParams = useMemo(
    () => ({ startMs: 280, staggerMs: stagger, durationMs: 420 }),
    [stagger],
  );

  const replay = useCallback(() => {
    setError(null);
    setPlayId((n) => n + 1);
  }, []);

  const selectClip = useCallback((id: string) => {
    setError(null);
    setClipId(id);
    setPlayId((n) => n + 1);
  }, []);

  const handleExport = useCallback(async () => {
    setError(null);
    setExporting(true);
    try {
      const blob = await exportMp4(params, clip.id);
      downloadBlob(blob, clip.exportName);
    } catch (e) {
      setError(e instanceof Error ? e.message : "导出失败");
    } finally {
      setExporting(false);
    }
  }, [params, clip]);

  return (
    <main className="min-h-dvh bg-chrome text-chrome-fg">
      <div className="mx-auto grid min-h-dvh max-w-6xl gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
        <section className="flex min-h-0 flex-col">
          <header className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-sm tracking-[0.18em] text-chrome-muted">正上茶舍</p>
              <h1 className="font-display text-2xl font-semibold">口播动画台</h1>
            </div>
            <div className="flex items-center gap-2">
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <a
                  href="/login"
                  className="rounded-sm border border-chrome-line px-3 py-2 text-sm text-chrome-muted transition-colors hover:text-chrome-fg"
                >
                  登录
                </a>
              </SignedOut>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 items-center justify-center rounded-sm bg-surface p-3 sm:p-5">
            <div className="aspect-reel mx-auto h-auto w-full max-h-[78dvh] max-w-md overflow-hidden">
              <RemotionStage
                clipId={clipId}
                playId={playId}
                staggerMs={stagger}
                onPlayingChange={setPlaying}
              />
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-5 border-t border-chrome-line pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <p className="text-xs tracking-widest text-chrome-muted">
              {clip.code} · 第{clip.episode}期 · 29.97fps
            </p>
            <h2 className="mt-1 font-display text-xl">{clip.title}</h2>
            <p className="mt-2 text-sm leading-6 text-chrome-muted">{clip.note}</p>
            <p className="mt-1 font-mono text-[11px] text-chrome-muted">{clip.folder}</p>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {CLIPS.map((item) => {
              const on = item.id === clipId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectClip(item.id)}
                  className={`h-10 rounded-sm text-sm tracking-wide transition-colors ${
                    on ? "bg-moss text-moss-fg" : "bg-surface text-chrome-muted hover:text-chrome-fg"
                  }`}
                >
                  {item.code}
                </button>
              );
            })}
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-sm bg-surface px-3 py-2">
              <dt className="text-chrome-muted">画幅</dt>
              <dd>9:16 · 1080×1920</dd>
            </div>
            <div className="rounded-sm bg-surface px-3 py-2">
              <dt className="text-chrome-muted">时长</dt>
              <dd>约 {remotionLengthSec(clipId, stagger)} 秒</dd>
            </div>
          </dl>

          <label className="block text-sm">
            <span className="mb-2 flex justify-between text-chrome-muted">
              间隔 <em className="not-italic text-chrome-fg">{stagger}ms</em>
            </span>
            <input
              type="range"
              min={180}
              max={520}
              step={20}
              value={stagger}
              onChange={(e) => setStagger(Number(e.target.value))}
              className="w-full accent-moss"
            />
          </label>

          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={replay}
              className="flex h-11 items-center justify-center gap-2 rounded-sm bg-moss text-moss-fg transition-transform duration-150 ease-out active:scale-[0.96]"
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              {playing ? "播放中 · 再播" : "重新播放"}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="flex h-11 items-center justify-center gap-2 rounded-sm border border-chrome-line text-chrome-fg transition-colors hover:bg-surface disabled:opacity-50"
            >
              {exporting ? <RotateCcw className="size-4 animate-spin" /> : <Download className="size-4" />}
              {exporting ? "正在导出…" : "导出 MP4"}
            </button>
            {error ? <p className="text-sm text-seal">{error}</p> : null}
            <p className="text-xs leading-5 text-chrome-muted">
              一条动画一个文件夹。改字进 data.ts，改动效进 Comp.tsx。
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
