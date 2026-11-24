import { RotateCcw } from "lucide-react";
import type { ClipTextSchema } from "@/remotion/shared/define-clip";

const inputCls =
  "w-full rounded-md border border-chrome-line/80 bg-chrome/60 px-2.5 py-1.5 text-sm text-chrome-fg placeholder:text-chrome-muted/50 focus:border-moss-fg/50 focus:outline-none focus:ring-1 focus:ring-moss-fg/30";

type Props = {
  fields: ClipTextSchema[];
  /** 面板里改过的文案（没改的 key 不在里面） */
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: (key: string) => void;
};

const len = (s: string) => Array.from(s.replace(/\s/g, "")).length;

/** 节拍文案：每个字段对应 index.ts 里 fields 的一项；留空 = 用代码里的默认值 */
export function TextFields({ fields, values, onChange, onReset }: Props) {
  if (!fields.length) return <p className="text-xs text-chrome-muted">这个节拍没有可改的文案。</p>;
  return (
    <div className="space-y-3">
      {fields.map((f) => {
        const edited = values[f.key] !== undefined && values[f.key] !== f.default;
        const value = values[f.key] ?? f.default;
        const stamp = f.type === "stamp";
        return (
          <div key={f.key}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-chrome-fg/90">
                {f.label}
                {edited && <span className="ml-1.5 text-[10px] text-red-200">已改</span>}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-chrome-muted/70">{len(value)} 字</span>
                {edited && (
                  <button
                    type="button"
                    onClick={() => onReset(f.key)}
                    title={`恢复默认：${f.default}`}
                    className="flex items-center gap-0.5 text-[10px] text-chrome-muted hover:text-chrome-fg"
                  >
                    <RotateCcw className="size-3" /> 默认
                  </button>
                )}
              </span>
            </div>
            {f.multiline ? (
              <textarea
                className={`${inputCls} min-h-[3.25rem] resize-y`}
                rows={2}
                value={value}
                placeholder={f.placeholder ?? f.default}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            ) : (
              <input
                className={`${inputCls} ${stamp ? "font-serif tracking-[0.3em]" : ""}`}
                style={stamp ? { color: "#e07a6f" } : undefined}
                value={value}
                placeholder={f.placeholder ?? f.default}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
