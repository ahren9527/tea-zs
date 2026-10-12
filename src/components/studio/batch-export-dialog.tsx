import { CheckCircle2, Download, Loader2, X, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { downloadBlob, exportMp4, exportWebm } from "@/lib/export-webm";
import { resolveBeat } from "@/templates/beat-clip";
import type { Episode } from "@/templates/schema";

type Status = { state: "idle" | "running" | "done" | "error" | "skipped"; percent: number; msg?: string };

type Props = { open: boolean; episode: Episode; onClose: () => void };

/** 批量导出：按分镜顺序逐个离屏渲染并下载，文件名用每个分镜的导出名 */
export function BatchExportDialog({ open, episode, onClose }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [format, setFormat] = useState<"mp4" | "webm">("mp4");
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  if (!open) return null;

  const isOn = (id: string) => selected[id] !== false;
  const chosen = episode.beats.filter((b) => isOn(b.id));

  const run = async () => {
    setRunning(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const next: Record<string, Status> = {};
    for (const b of episode.beats) next[b.id] = { state: isOn(b.id) ? "idle" : "skipped", percent: 0 };
    setStatus(next);
    for (const b of chosen) {
      if (ctrl.signal.aborted) break;
      const r = resolveBeat(b, episode);
      setStatus((s) => ({ ...s, [b.id]: { state: "running", percent: 0 } }));
      try {
        const onP = (p: { percent: number; message: string }) => setStatus((s) => ({ ...s, [b.id]: { state: "running", percent: p.percent, msg: p.message } }));
        const blob = format === "mp4" ? await exportMp4(r.params, r.clip, onP, ctrl.signal) : await exportWebm(r.params, r.clip, onP, ctrl.signal);
        downloadBlob(blob, format === "mp4" ? r.exportName : r.exportName.replace(/\.mp4$/i, ".webm"));
        setStatus((s) => ({ ...s, [b.id]: { state: "done", percent: 100 } }));
        await new Promise((res) => setTimeout(res, 400)); // 给浏览器下载留口气，避免被拦截
      } catch (e) {
        setStatus((s) => ({ ...s, [b.id]: { state: "error", percent: 0, msg: ctrl.signal.aborted ? "已取消" : e instanceof Error ? e.message : "导出失败" } }));
      }
    }
    setRunning(false);
    abortRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
      <div role="dialog" aria-label="批量导出" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-lg border border-chrome-line bg-surface p-5 text-chrome-fg shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg">批量导出 · 第{episode.number}期</h3>
            <p className="text-xs text-chrome-muted">逐个渲染、自动下载，拖进剪映即可。导出时请保持本页在前台。</p>
          </div>
          {!running && (
            <button type="button" onClick={onClose} aria-label="关闭" className="rounded p-1.5 text-chrome-muted hover:bg-chrome-line hover:text-chrome-fg">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="text-chrome-muted">格式</span>
          {(["mp4", "webm"] as const).map((f) => (
            <button key={f} type="button" disabled={running} onClick={() => setFormat(f)} className={`rounded px-2.5 py-1 ${format === f ? "bg-moss text-moss-fg" : "border border-chrome-line text-chrome-muted"}`}>
              {f === "mp4" ? "MP4 (H.264)" : "WebM（实时录制）"}
            </button>
          ))}
          <button type="button" disabled={running} onClick={() => setSelected(Object.fromEntries(episode.beats.map((b) => [b.id, !(chosen.length === episode.beats.length)])))} className="ml-auto text-chrome-muted hover:text-chrome-fg">
            {chosen.length === episode.beats.length ? "全不选" : "全选"}
          </button>
        </div>
        <ul className="space-y-1.5">
          {episode.beats.map((b) => {
            const st = status[b.id];
            const r = resolveBeat(b, episode);
            return (
              <li key={b.id} className="rounded-md border border-chrome-line/60 bg-chrome/40 p-2 text-xs">
                <label className="flex items-center gap-2">
                  <input type="checkbox" disabled={running} checked={isOn(b.id)} onChange={(e) => setSelected((s) => ({ ...s, [b.id]: e.target.checked }))} />
                  <span className="font-mono font-bold">{b.code}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-chrome-muted">{r.exportName}</span>
                  <span className="font-mono text-[10px] text-chrome-muted">{r.durationSec.toFixed(1)}s</span>
                  {st?.state === "running" && <Loader2 className="size-3.5 animate-spin text-amber-300" />}
                  {st?.state === "done" && <CheckCircle2 className="size-3.5 text-emerald-400" />}
                  {st?.state === "error" && <XCircle className="size-3.5 text-red-400" />}
                </label>
                {st?.state === "running" && (
                  <div className="mt-1.5 h-1 overflow-hidden rounded bg-chrome-line">
                    <div className="h-full bg-moss-fg/80 transition-all" style={{ width: `${st.percent}%` }} />
                  </div>
                )}
                {st?.state === "error" && <p className="mt-1 text-[11px] text-red-300">{st.msg}</p>}
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex justify-end gap-2">
          {running ? (
            <button type="button" onClick={() => abortRef.current?.abort()} className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/40">
              取消剩余
            </button>
          ) : (
            <button type="button" disabled={!chosen.length} onClick={() => void run()} className="flex items-center gap-1.5 rounded-md bg-moss px-3 py-1.5 text-xs font-medium text-moss-fg hover:bg-moss/90 disabled:opacity-40">
              <Download className="size-3.5" /> 开始导出 {chosen.length} 个
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
