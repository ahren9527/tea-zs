import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ICONS, ICON_OPTIONS, drawIcon } from "@/templates/kit/icons";
import type { FieldDef, FieldValue, ListField, ListItem, TemplateContent } from "@/templates/schema";

const inputCls =
  "w-full rounded-md border border-chrome-line/80 bg-chrome/60 px-2.5 py-1.5 text-sm text-chrome-fg placeholder:text-chrome-muted/50 focus:border-moss-fg/50 focus:outline-none focus:ring-1 focus:ring-moss-fg/30";

/** 小图标预览（画布绘制，与成片同一套图标） */
export function IconGlyph({ k, size = 22, color = "#e9dcc6" }: { k: string; size?: number; color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = size * dpr;
    c.height = size * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    drawIcon(ctx, k, (size * dpr) / 2, (size * dpr) / 2, size * dpr * 0.92, color, 1);
  }, [k, size, color]);
  return <canvas ref={ref} style={{ width: size, height: size }} className="shrink-0" />;
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className={`${inputCls} flex items-center gap-2 text-left`}>
        <IconGlyph k={value || "none"} />
        <span className="truncate">{ICONS[value]?.label ?? "（无图标）"}</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 grid max-h-64 w-[18rem] grid-cols-4 gap-1 overflow-y-auto rounded-md border border-chrome-line bg-surface p-1.5 shadow-xl">
          {ICON_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              title={o.label}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`flex flex-col items-center gap-1 rounded px-1 py-1.5 text-[10px] ${
                o.value === value ? "bg-moss text-moss-fg" : "text-chrome-muted hover:bg-chrome-line/50 hover:text-chrome-fg"
              }`}
            >
              <IconGlyph k={o.value} size={24} />
              <span className="w-full truncate text-center">{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CharCount({ value, max }: { value: string; max?: number }) {
  if (!max) return null;
  const n = Array.from(value).length;
  return <span className={`font-mono text-[10px] ${n > max ? "text-amber-400" : "text-chrome-muted/60"}`}>{n}/{max}</span>;
}

function ScalarInput({ f, value, onChange }: { f: Exclude<FieldDef, ListField>; value: FieldValue | undefined; onChange: (v: FieldValue) => void }) {
  const str = typeof value === "string" ? value : value == null ? "" : String(value);
  switch (f.type) {
    case "textarea":
      return <textarea className={`${inputCls} min-h-[3.25rem] resize-y`} rows={2} value={str} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
    case "stamp":
      return (
        <input
          className={`${inputCls} font-serif tracking-[0.3em] text-seal`}
          style={{ color: "#e07a6f" }}
          value={str}
          placeholder={f.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "icon":
      return <IconSelect value={str} onChange={onChange} />;
    case "select":
      return (
        <select className={inputCls} value={str} onChange={(e) => onChange(e.target.value)}>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "number":
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            className={inputCls}
            min={f.min}
            max={f.max}
            step={f.step ?? 1}
            value={typeof value === "number" ? value : Number(str) || 0}
            onChange={(e) => onChange(Math.min(f.max, Math.max(f.min, Number(e.target.value) || 0)))}
          />
          {f.unit && <span className="text-xs text-chrome-muted">{f.unit}</span>}
        </div>
      );
    case "toggle":
      return (
        <button
          type="button"
          role="switch"
          aria-checked={value === true}
          onClick={() => onChange(!(value === true))}
          className={`relative h-6 w-11 rounded-full border transition-colors ${value === true ? "border-moss-fg/40 bg-moss" : "border-chrome-line bg-chrome/60"}`}
        >
          <span className={`absolute top-0.5 size-4.5 rounded-full bg-chrome-fg transition-all ${value === true ? "left-5.5" : "left-0.5"}`} />
        </button>
      );
    default:
      return <input className={inputCls} value={str} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
}

function ListEditor({ f, value, onChange }: { f: ListField; value: ListItem[]; onChange: (v: ListItem[]) => void }) {
  const items = Array.isArray(value) ? value : [];
  const set = (i: number, key: string, v: string) => onChange(items.map((it, j) => (j === i ? { ...it, [key]: v } : it)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => {
    const blank: ListItem = {};
    for (const sf of f.itemFields) blank[sf.key] = sf.type === "icon" ? (items[items.length - 1]?.[sf.key] ?? "leaf") : sf.type === "select" ? (sf.options[0]?.value ?? "") : "";
    onChange([...items, blank]);
  };
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-md border border-chrome-line/60 bg-chrome/30 p-2">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-chrome-muted">
            <span className="font-serif">
              第 {i + 1} {f.itemLabel}
            </span>
            <span className="flex items-center gap-0.5">
              <button type="button" title="上移" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 hover:bg-chrome-line disabled:opacity-30">
                <ArrowUp className="size-3" />
              </button>
              <button type="button" title="下移" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded p-1 hover:bg-chrome-line disabled:opacity-30">
                <ArrowDown className="size-3" />
              </button>
              <button
                type="button"
                title="删除"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                disabled={items.length <= f.min}
                className="rounded p-1 hover:bg-chrome-line hover:text-red-300 disabled:opacity-30"
              >
                <Trash2 className="size-3" />
              </button>
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-1.5">
            {f.itemFields.map((sf) => (
              <label key={sf.key} className={`block ${sf.type === "text" && !sf.optional ? "col-span-full" : ""}`}>
                <span className="mb-0.5 block text-[10px] text-chrome-muted/80">{sf.label}</span>
                <ScalarInput f={sf} value={it[sf.key] ?? ""} onChange={(v) => set(i, sf.key, String(v))} />
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={items.length >= f.max}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-chrome-line py-1.5 text-xs text-chrome-muted hover:border-moss-fg/50 hover:text-chrome-fg disabled:opacity-40"
      >
        <Plus className="size-3" />
        添加一{f.itemLabel}（{items.length}/{f.max}）
      </button>
    </div>
  );
}

/** 由模板字段表自动生成的表单：模板改字段，面板自动跟着变，不用写 UI 代码 */
export function SchemaForm({ fields, content, onChange }: { fields: FieldDef[]; content: TemplateContent; onChange: (key: string, value: FieldValue) => void }) {
  if (!fields.length) return <p className="text-xs text-chrome-muted">这个分镜没有可编辑的文案。</p>;
  return (
    <div className="space-y-3">
      {fields.map((f) => {
        const v = content[f.key];
        return (
          <div key={f.key}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-chrome-fg/90">
                {f.label}
                {f.optional && <span className="ml-1 text-[10px] text-chrome-muted/60">可空</span>}
              </span>
              {(f.type === "text" || f.type === "textarea" || f.type === "stamp") && <CharCount value={typeof v === "string" ? v : ""} max={f.maxLen} />}
            </div>
            {f.type === "list" ? (
              <ListEditor f={f} value={(v as ListItem[]) ?? []} onChange={(nv) => onChange(f.key, nv)} />
            ) : (
              <ScalarInput f={f} value={v} onChange={(nv) => onChange(f.key, nv)} />
            )}
            {f.hint && <p className="mt-0.5 text-[10px] text-chrome-muted/70">{f.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}
