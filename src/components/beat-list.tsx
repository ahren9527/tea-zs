import type { ClipModule } from "@/remotion/shared/define-clip";

type Props = {
  clips: ClipModule[];
  activeId?: string;
  durations: Record<string, number>;
  /** 改过文案的节拍 */
  edited: Set<string>;
  onSelect: (id: string) => void;
};

/** 本期节拍列表：顺序、编号、时长都来自代码，这里只负责选择 */
export function BeatList({ clips, activeId, durations, edited, onSelect }: Props) {
  const total = clips.reduce((s, c) => s + (durations[c.id] ?? 0), 0);
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="px-0.5 font-serif text-xs text-chrome-muted">
        节拍 {clips.length} 个 · 合计约 {total.toFixed(1)}s
      </div>
      <ol className="flex min-h-0 flex-col gap-1.5 overflow-y-auto pr-0.5">
        {clips.map((c) => {
          const on = c.id === activeId;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-current={on ? "true" : undefined}
                className={`w-full rounded-md border p-2 text-left transition-colors ${
                  on
                    ? "border-moss-fg/50 bg-moss/40 shadow-md"
                    : "border-chrome-line/60 bg-chrome/40 hover:border-chrome-muted/60 hover:bg-chrome-line/20"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-chrome-fg">{c.code}</span>
                  <span className="min-w-0 flex-1 truncate font-serif text-xs text-chrome-fg">{c.title}</span>
                  {edited.has(c.id) && (
                    <span className="shrink-0 rounded bg-seal/30 px-1 text-[9px] text-red-200" title="面板里改过文案">
                      已改字
                    </span>
                  )}
                  <span className="shrink-0 font-mono text-[10px] text-chrome-muted">
                    {(durations[c.id] ?? 0).toFixed(1)}s
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-chrome-muted">{c.note}</p>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
