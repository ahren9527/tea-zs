import { ArrowDown, ArrowUp, Copy, GripVertical, Hash, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Beat, Episode } from "@/templates/schema";
import { getTemplate } from "@/templates/registry";
import { CLIPS } from "@/remotion/catalog";
import { TemplateThumb } from "./template-thumb";

type Props = {
  episode: Episode;
  activeBeatId?: string;
  durations: Record<string, number>;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onReorder: (from: number, to: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRenumber: () => void;
};

function templateLabel(b: Beat) {
  if (b.template === "bespoke") {
    const c = CLIPS.find((x) => x.id === b.content.clipId);
    return c ? `经典定制 · ${c.folder.split("/").pop()}` : "经典定制";
  }
  return getTemplate(b.template)?.name ?? `未知模板 ${b.template}`;
}

/** 分镜列表：点选 / 拖拽排序 / 上下移 / 复制 / 删除 */
export function BeatList({ episode, activeBeatId, durations, onSelect, onAdd, onMove, onReorder, onDuplicate, onDelete, onRenumber }: Props) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const total = episode.beats.reduce((s, b) => s + (durations[b.id] ?? 0), 0);
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between px-0.5 text-xs text-chrome-muted">
        <span className="font-serif">
          分镜 {episode.beats.length} 个 · 合计约 {total.toFixed(1)}s
        </span>
        <button type="button" onClick={onRenumber} title="按顺序重新编号 B1…Bn" className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-chrome-line hover:text-chrome-fg">
          <Hash className="size-3" />
          重新编号
        </button>
      </div>
      <ol className="flex min-h-0 flex-col gap-1.5 overflow-y-auto pr-0.5">
        {episode.beats.map((b, i) => {
          const on = b.id === activeBeatId;
          return (
            <li
              key={b.id}
              draggable
              onDragStart={(e) => {
                setDrag(i);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(i);
              }}
              onDragLeave={() => setOver((o) => (o === i ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                if (drag != null) onReorder(drag, i);
                setDrag(null);
                setOver(null);
              }}
              onDragEnd={() => {
                setDrag(null);
                setOver(null);
              }}
              className={`group relative flex cursor-pointer items-center gap-2 rounded-md border p-1.5 transition-all ${
                on ? "border-moss-fg/50 bg-moss/40 shadow-md" : "border-chrome-line/60 bg-chrome/40 hover:border-chrome-muted/60 hover:bg-chrome-line/20"
              } ${over === i && drag !== i ? "ring-2 ring-amber-400/60" : ""} ${drag === i ? "opacity-40" : ""}`}
              onClick={() => onSelect(b.id)}
            >
              <GripVertical className="size-3.5 shrink-0 cursor-grab text-chrome-muted/50" />
              {b.template === "bespoke" ? (
                <div className="flex h-[54px] w-[30px] shrink-0 items-center justify-center rounded-sm bg-[#e9dcc6] font-serif text-[10px] font-bold text-seal ring-1 ring-black/30">定制</div>
              ) : (
                <TemplateThumb templateId={b.template} content={b.content} theme={b.theme ?? episode.theme} width={30} className="shrink-0 rounded-sm ring-1 ring-black/30" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-chrome-fg">{b.code}</span>
                  <span className="truncate font-serif text-xs text-chrome-fg">{b.title}</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[10px] text-chrome-muted">{templateLabel(b)}</span>
                  <span className="shrink-0 font-mono text-[10px] text-chrome-muted">{(durations[b.id] ?? 0).toFixed(1)}s</span>
                </div>
              </div>
              <div className="absolute right-1 top-1 hidden items-center gap-0.5 rounded bg-surface/95 p-0.5 shadow group-hover:flex">
                <button type="button" title="上移" aria-label="上移" onClick={(e) => { e.stopPropagation(); onMove(b.id, -1); }} className="rounded p-1 text-chrome-muted hover:bg-chrome-line hover:text-chrome-fg">
                  <ArrowUp className="size-3" />
                </button>
                <button type="button" title="下移" aria-label="下移" onClick={(e) => { e.stopPropagation(); onMove(b.id, 1); }} className="rounded p-1 text-chrome-muted hover:bg-chrome-line hover:text-chrome-fg">
                  <ArrowDown className="size-3" />
                </button>
                <button type="button" title="复制分镜" aria-label="复制分镜" onClick={(e) => { e.stopPropagation(); onDuplicate(b.id); }} className="rounded p-1 text-chrome-muted hover:bg-chrome-line hover:text-chrome-fg">
                  <Copy className="size-3" />
                </button>
                <button
                  type="button"
                  title="删除分镜"
                  aria-label="删除分镜"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`删除分镜「${b.code} ${b.title}」？`)) onDelete(b.id);
                  }}
                  className="rounded p-1 text-chrome-muted hover:bg-chrome-line hover:text-red-300"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-chrome-line py-2 text-xs text-chrome-muted transition-colors hover:border-moss-fg/60 hover:bg-moss/20 hover:text-chrome-fg"
      >
        <Plus className="size-3.5" />
        添加分镜（选模板）
      </button>
    </div>
  );
}
