import { AlertCircle, CheckCircle2, Download, Loader2, X } from "lucide-react";
import { type ExportProgress } from "@/lib/export-webm";

type Props = {
  isOpen: boolean;
  progress: ExportProgress | null;
  error: string | null;
  isExporting: boolean;
  clipTitle: string;
  onCancel: () => void;
  onClose: () => void;
};

export function ExportDialog({
  isOpen,
  progress,
  error,
  isExporting,
  clipTitle,
  onCancel,
  onClose,
}: Props) {
  if (!isOpen) return null;

  const isDone = progress?.phase === "done";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-lg border border-chrome-line bg-surface p-6 shadow-2xl text-chrome-fg">
        {/* Close Button */}
        {!isExporting && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded p-1 text-chrome-muted hover:bg-chrome-line hover:text-chrome-fg"
          >
            <X className="size-4" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-moss/20 text-moss-fg">
            {isDone ? (
              <CheckCircle2 className="size-6 text-emerald-500" />
            ) : error ? (
              <AlertCircle className="size-6 text-seal" />
            ) : isExporting ? (
              <Loader2 className="size-6 animate-spin text-moss-fg" />
            ) : (
              <Download className="size-6 text-moss-fg" />
            )}
          </div>
          <div>
            <h3 className="font-serif font-bold text-base">
              {isDone ? "导出成功" : error ? "导出遇到问题" : "正在生成高阶超清视频"}
            </h3>
            <p className="text-xs text-chrome-muted">
              {clipTitle} · 1080×1920 @ 30fps · <span className="text-moss-fg font-medium">16 Mbps 母带级码率</span>
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded bg-seal/10 p-3 text-xs text-seal">
            <p className="font-semibold mb-1">错误详情：</p>
            <p className="break-all">{error}</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {/* Progress bar */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-chrome-line">
              <div
                className="h-full bg-moss transition-all duration-150 ease-out"
                style={{ width: `${progress?.percent ?? 0}%` }}
              />
            </div>

            {/* Status text & percentage */}
            <div className="flex items-center justify-between text-xs text-chrome-muted">
              <span>{progress?.message ?? "准备中..."}</span>
              <span className="font-mono font-medium text-chrome-fg">
                {progress?.percent ?? 0}%
              </span>
            </div>

            {progress && progress.totalFrames > 0 && (
              <div className="flex justify-between text-[11px] text-chrome-muted font-mono">
                <span>
                  当前帧: {progress.currentFrame} / {progress.totalFrames}
                </span>
                <span>阶段: {progress.phase}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-chrome-line/40">
          {isExporting ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded px-4 py-1.5 text-xs font-medium border border-chrome-line text-chrome-muted hover:bg-chrome-line hover:text-chrome-fg transition-colors"
            >
              取消导出
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-moss px-5 py-1.5 text-xs font-medium text-moss-fg transition-transform active:scale-95"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
