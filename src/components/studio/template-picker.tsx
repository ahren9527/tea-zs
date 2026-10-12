import { X } from "lucide-react";
import type { PaperThemeKey } from "@/remotion/shared/theme";
import { TEMPLATES } from "@/templates/registry";
import { TemplateThumb } from "./template-thumb";

type Props = {
  open: boolean;
  title?: string;
  theme: PaperThemeKey;
  current?: string;
  onPick: (templateId: string) => void;
  onClose: () => void;
};

/** 模板选择器：缩略图直接用模板 draw 画出（与成片一致） */
export function TemplatePicker({ open, title = "选择节拍模板", theme, current, onPick, onClose }: Props) {
  if (!open) return null;
  const cats = Array.from(new Set(TEMPLATES.map((t) => t.category)));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        className="max-h-[90dvh] w-full max-w-5xl overflow-y-auto rounded-lg border border-chrome-line bg-surface p-5 text-chrome-fg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg">{title}</h3>
            <p className="text-xs text-chrome-muted">每个模板都是固定动画 + 可填文案，选好后在右侧表单里改字就行。</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1.5 text-chrome-muted hover:bg-chrome-line hover:text-chrome-fg" aria-label="关闭">
            <X className="size-4" />
          </button>
        </div>
        {cats.map((cat) => (
          <section key={cat} className="mb-4">
            <p className="mb-2 font-serif text-xs tracking-widest text-chrome-muted">{cat}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {TEMPLATES.filter((t) => t.category === cat).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-label={`模板 ${t.name}`}
                  onClick={() => onPick(t.id)}
                  className={`group flex flex-col gap-2 rounded-lg border p-2 text-left transition-all ${
                    current === t.id ? "border-moss-fg/60 bg-moss/30" : "border-chrome-line/70 bg-chrome/40 hover:border-chrome-muted hover:bg-chrome-line/30"
                  }`}
                >
                  <TemplateThumb templateId={t.id} theme={theme} width={150} className="mx-auto rounded shadow-md ring-1 ring-black/30" />
                  <div>
                    <p className="font-display text-sm text-chrome-fg">{t.name}</p>
                    <p className="line-clamp-2 text-[11px] leading-4 text-chrome-muted">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
