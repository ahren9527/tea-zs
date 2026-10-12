import { ClipboardCopy, Download, FileJson, FileText, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { findTemplate, templateMeta, TEMPLATES } from "@/templates/registry";
import { normalizeEpisode, toEpisodeFile, type Episode } from "@/templates/schema";
import { episodeToScript, parseScript } from "@/templates/script-parser";
import { iconLabel, iconOf, SCRIPT_EXAMPLE } from "@/templates/script-helpers";

type Props = {
  open: boolean;
  episode?: Episode;
  onClose: () => void;
  onImport: (raw: unknown, replace: boolean) => string[];
};

function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** 导入 / 导出：粘贴结构化脚本或 JSON，一次生成整期；也能把当前期导出成 JSON / 脚本 */
export function ImportDialog({ open, episode, onClose, onImport }: Props) {
  const [mode, setMode] = useState<"script" | "json">("script");
  const [text, setText] = useState("");
  const [result, setResult] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const preview = useMemo(() => {
    if (!text.trim()) return null;
    try {
      if (mode === "json") {
        const { episode: ep, warnings } = normalizeEpisode(JSON.parse(text), templateMeta);
        return { ok: true as const, raw: ep, count: ep.beats.length, title: `第${ep.number}期 · ${ep.title}`, warnings };
      }
      const r = parseScript(text, { findTemplate, iconOf });
      const raw = { number: r.number ?? (episode ? episode.number + 1 : 1), title: r.title ?? "新一期", theme: episode?.theme ?? "classic", beats: r.beats };
      return { ok: true as const, raw, count: r.beats.length, title: `第${raw.number}期 · ${raw.title}`, warnings: r.warnings };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  }, [text, mode, episode]);

  if (!open) return null;
  const epName = episode ? `正上茶舍_第${episode.number}期_${episode.title}`.replace(/[\\/:*?"<>|\s·]+/g, "") : "episode";

  const doImport = (replace: boolean) => {
    if (!preview?.ok) return;
    const warnings = onImport(preview.raw, replace);
    setResult(Array.from(new Set([...(preview.warnings ?? []), ...warnings])));
    if (!warnings.length && !(preview.warnings ?? []).length) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs" onClick={onClose}>
      <div role="dialog" aria-label="导入导出" className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-lg border border-chrome-line bg-surface p-5 text-chrome-fg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg">导入 / 导出一期</h3>
          <button type="button" onClick={onClose} aria-label="关闭" className="rounded p-1.5 text-chrome-muted hover:bg-chrome-line hover:text-chrome-fg">
            <X className="size-4" />
          </button>
        </div>

        {episode && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-chrome-line/70 bg-chrome/40 p-3 text-xs">
            <span className="mr-1 text-chrome-muted">当前期「第{episode.number}期 · {episode.title}」：</span>
            <button type="button" onClick={() => download(`${epName}.json`, JSON.stringify(toEpisodeFile(episode), null, 2), "application/json")} className="flex items-center gap-1 rounded border border-chrome-line px-2 py-1 hover:bg-chrome-line">
              <Download className="size-3" /> 下载 JSON
            </button>
            <button type="button" onClick={() => download(`${epName}.txt`, episodeToScript(episode, templateMeta, iconLabel), "text/plain")} className="flex items-center gap-1 rounded border border-chrome-line px-2 py-1 hover:bg-chrome-line">
              <FileText className="size-3" /> 下载脚本
            </button>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(episodeToScript(episode, templateMeta, iconLabel));
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
              className="flex items-center gap-1 rounded border border-chrome-line px-2 py-1 hover:bg-chrome-line"
            >
              <ClipboardCopy className="size-3" /> {copied ? "已复制" : "复制脚本"}
            </button>
            <span className="text-[10px] text-chrome-muted/70">（经典定制分镜不会写进脚本，JSON 会完整保留）</span>
          </div>
        )}

        <div className="mb-2 flex items-center gap-1 text-xs">
          {(["script", "json"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={`flex items-center gap-1 rounded px-2.5 py-1 ${mode === m ? "bg-moss text-moss-fg" : "text-chrome-muted hover:text-chrome-fg"}`}>
              {m === "script" ? <FileText className="size-3" /> : <FileJson className="size-3" />}
              {m === "script" ? "粘贴脚本" : "粘贴 / 上传 JSON"}
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-1 rounded border border-chrome-line px-2 py-1 text-chrome-muted hover:text-chrome-fg">
            <Upload className="size-3" /> 选择文件
            <input
              type="file"
              accept=".json,.txt,.md"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const t = await f.text();
                setMode(/\.json$/i.test(f.name) || t.trim().startsWith("{") ? "json" : "script");
                setText(t);
                setResult(null);
              }}
            />
          </label>
          {mode === "script" && (
            <button type="button" onClick={() => setText(SCRIPT_EXAMPLE)} className="rounded border border-chrome-line px-2 py-1 text-chrome-muted hover:text-chrome-fg">
              填入示例
            </button>
          )}
        </div>

        <textarea
          className="h-72 w-full resize-y rounded-md border border-chrome-line/80 bg-chrome/60 p-3 font-mono text-xs leading-5 text-chrome-fg focus:outline-none"
          placeholder={mode === "script" ? "每个分镜一块，以「## 编号 模板名 | 标题」开头，下面写「字段: 内容」，列表用「- 」逐行写。点「填入示例」看格式。" : '{"kind":"zhengshang-episode", "episode": {...}}'}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
        />

        {mode === "script" && (
          <details className="mt-2 text-[11px] text-chrome-muted">
            <summary className="cursor-pointer">可用模板名（也认别名）</summary>
            <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5">
              {TEMPLATES.map((t) => (
                <li key={t.id}>
                  <span className="text-chrome-fg">{t.name}</span>：{t.fields.map((f) => f.label.replace(/（.*?）/g, "")).join(" / ")}
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-chrome-muted">
            {preview == null ? "粘贴后这里会显示识别结果" : preview.ok ? `识别到：${preview.title}，共 ${preview.count} 个分镜` : `解析失败：${preview.error}`}
          </span>
          <div className="ml-auto flex gap-2">
            <button type="button" disabled={!preview?.ok || !episode || episode.classic} onClick={() => doImport(true)} className="rounded-md border border-chrome-line px-3 py-1.5 text-xs hover:bg-chrome-line disabled:opacity-40" title={episode?.classic ? "经典定制期不能被替换" : ""}>
              替换当前期
            </button>
            <button type="button" disabled={!preview?.ok} onClick={() => doImport(false)} className="rounded-md bg-moss px-3 py-1.5 text-xs font-medium text-moss-fg hover:bg-moss/90 disabled:opacity-40">
              导入为新一期
            </button>
          </div>
        </div>
        {(result ?? (preview?.ok ? preview.warnings : []))?.length ? (
          <ul className="mt-2 space-y-0.5 rounded border border-amber-500/30 bg-amber-950/30 p-2 text-[11px] text-amber-200">
            {(result ?? (preview?.ok ? preview.warnings : []) ?? []).map((w, i) => (
              <li key={i}>⚠ {w}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
