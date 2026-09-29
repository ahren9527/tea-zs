import { Check, Copy, Palette, RotateCcw, Sliders, Sparkles, Type } from "lucide-react";
import { useState } from "react";
import { getFieldsForClip } from "@/lib/clip-data";
import { PAPER_THEMES, type PaperThemeKey } from "@/remotion/shared/theme";

type Props = {
  clipId: string;
  clipTitle: string;
  staggerMs: number;
  onStaggerChange: (val: number) => void;
  paperTheme: PaperThemeKey;
  onPaperThemeChange: (theme: PaperThemeKey) => void;
  fontScale?: number;
  onFontScaleChange?: (val: number) => void;
  customTexts: Record<string, string>;
  onCustomTextChange: (key: string, value: string) => void;
  onResetDefaults: () => void;
};

export function ContentInspector({
  clipId,
  clipTitle,
  staggerMs,
  onStaggerChange,
  paperTheme,
  onPaperThemeChange,
  fontScale = 1,
  onFontScaleChange,
  customTexts,
  onCustomTextChange,
  onResetDefaults,
}: Props) {
  const [copied, setCopied] = useState(false);
  const fields = getFieldsForClip(clipId);

  const handleCopyConfig = () => {
    const data = {
      clipId,
      staggerMs,
      paperTheme,
      fontScale,
      customTexts,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4.5 rounded-lg bg-surface/90 p-4 text-chrome-fg border border-chrome-line/70 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-chrome-line/50 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded bg-moss/20 text-moss-fg">
            <Sliders className="size-3.5" />
          </div>
          <h3 className="font-serif font-bold text-sm tracking-wide">参数与文案调节</h3>
          <span className="rounded bg-chrome-line/80 px-1.5 py-0.5 font-mono text-[10px] text-chrome-muted">
            {clipId}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyConfig}
            title="复制配置 JSON"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-chrome-muted hover:bg-chrome-line hover:text-chrome-fg transition-colors"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            <span>{copied ? "已复制" : "导出配置"}</span>
          </button>
          <button
            type="button"
            onClick={onResetDefaults}
            title="重置所有文本为预设"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-chrome-muted hover:bg-chrome-line hover:text-chrome-fg transition-colors"
          >
            <RotateCcw className="size-3.5" />
            <span>重置预设</span>
          </button>
        </div>
      </div>

      {/* Visual Paper Theme Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-chrome-muted font-serif">
            <Palette className="size-3.5 text-moss-fg" />
            <span>宣纸材质与底色 (即时生效)</span>
          </span>
          <span className="text-[11px] text-moss-fg/80 font-mono">
            {PAPER_THEMES[paperTheme]?.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {(Object.keys(PAPER_THEMES) as PaperThemeKey[]).map((themeKey) => {
            const item = PAPER_THEMES[themeKey];
            const isSelected = paperTheme === themeKey;
            return (
              <button
                key={themeKey}
                type="button"
                onClick={() => onPaperThemeChange(themeKey)}
                className={`group relative flex flex-col items-start gap-1.5 rounded-lg border p-2.5 text-left transition-all ${
                  isSelected
                    ? "border-moss-fg/80 bg-moss/10 shadow-md ring-1 ring-moss-fg/40"
                    : "border-chrome-line/70 bg-chrome/40 hover:border-chrome-muted hover:bg-chrome-line/20"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Visual paper swatch */}
                    <div
                      className="flex size-5 items-center justify-center rounded border border-black/25 shadow-inner text-[10px] font-serif font-bold transition-transform group-hover:scale-105"
                      style={{ backgroundColor: item.paper, color: item.ink }}
                    >
                      茶
                    </div>
                    <span className="font-serif text-xs font-semibold text-chrome-fg">
                      {item.name}
                    </span>
                  </div>
                  {isSelected ? (
                    <span className="flex size-4 items-center justify-center rounded-full bg-moss-fg text-chrome">
                      <Check className="size-2.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span
                      className="size-2 rounded-full opacity-60"
                      style={{ backgroundColor: item.seal }}
                    />
                  )}
                </div>
                <p className="text-[10px] text-chrome-muted/90 font-serif leading-tight">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Text Customization Fields */}
      {fields.length > 0 && (
        <div className="space-y-3 border-t border-chrome-line/40 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-chrome-muted font-serif">
              <Type className="size-3.5 text-moss-fg" />
              <span>台词与印章文案 ({clipTitle})</span>
            </span>
            <span className="text-[10px] text-chrome-muted font-mono">
              实时同步画布与导出
            </span>
          </div>

          <div className="space-y-2.5">
            {fields.map((field) => {
              const currentValue = customTexts[field.key] ?? field.default;
              const isModified = currentValue !== field.default;

              return (
                <div key={field.key} className="space-y-1.5 rounded-md bg-chrome/50 p-2.5 border border-chrome-line/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-chrome-muted flex items-center gap-1.5 font-medium">
                      {field.label}
                      {field.type === "stamp" ? (
                        <span className="rounded bg-seal/20 px-1.5 py-0.5 text-[10px] text-seal font-serif font-bold border border-seal/30">
                          朱红印章
                        </span>
                      ) : (
                        <span className="rounded bg-moss/20 px-1 py-0.2 text-[10px] text-moss-fg/80 font-mono">
                          字幕
                        </span>
                      )}
                    </span>
                    {isModified && (
                      <button
                        type="button"
                        onClick={() => onCustomTextChange(field.key, field.default)}
                        className="text-[10px] text-moss-fg hover:underline font-mono"
                      >
                        恢复默认
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={currentValue}
                    placeholder={field.placeholder ?? field.default}
                    onChange={(e) => onCustomTextChange(field.key, e.target.value)}
                    className="w-full rounded border border-chrome-line/70 bg-surface px-3 py-1.5 font-serif text-xs text-chrome-fg placeholder:text-chrome-muted/40 focus:border-moss-fg focus:outline-none focus:ring-1 focus:ring-moss-fg transition-all"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Font Size Adjustment Slider */}
      <div className="space-y-2 border-t border-chrome-line/40 pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-chrome-muted font-serif flex items-center gap-1.5">
            <Type className="size-3.5 text-moss-fg" />
            <span>字体排版大小 (Font Scale)</span>
          </span>
          <div className="flex items-center gap-1.5">
            {fontScale !== 1 && onFontScaleChange && (
              <button
                type="button"
                onClick={() => onFontScaleChange(1)}
                className="text-[10px] text-moss-fg hover:underline font-mono"
              >
                复位
              </button>
            )}
            <span className="font-mono text-moss-fg font-medium bg-moss/15 px-1.5 py-0.5 rounded text-[11px]">
              {Math.round(fontScale * 100)}% · {fontScale.toFixed(2)}x
            </span>
          </div>
        </div>

        <input
          type="range"
          min={0.75}
          max={1.35}
          step={0.05}
          value={fontScale}
          onChange={(e) => onFontScaleChange?.(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-chrome-line accent-moss-fg"
        />

        <div className="flex justify-between text-[10px] text-chrome-muted font-mono">
          <span>精炼 (75%)</span>
          <button
            type="button"
            onClick={() => onFontScaleChange?.(1)}
            className={`transition-colors hover:text-chrome-fg ${
              fontScale === 1 ? "text-moss-fg font-bold" : ""
            }`}
          >
            标准 (100%)
          </button>
          <span>醒目 (135%)</span>
        </div>

        {/* Quick preset buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {[
            { label: "精巧 85%", val: 0.85 },
            { label: "标准 100%", val: 1.0 },
            { label: "醒目 115%", val: 1.15 },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => onFontScaleChange?.(preset.val)}
              className={`rounded py-1 text-[10px] font-serif transition-all ${
                Math.abs(fontScale - preset.val) < 0.02
                  ? "bg-moss/20 text-moss-fg border border-moss/40 font-bold"
                  : "bg-chrome/40 border border-chrome-line/60 text-chrome-muted hover:text-chrome-fg hover:bg-chrome-line/30"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stagger (Rhythm) Slider */}
      <div className="space-y-2 border-t border-chrome-line/40 pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-chrome-muted font-serif flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-moss-fg" />
            <span>动画层叠节奏 (Stagger)</span>
          </span>
          <span className="font-mono text-moss-fg font-medium bg-moss/15 px-1.5 py-0.5 rounded text-[11px]">
            {staggerMs} ms · 约 {Math.max(2, Math.round((staggerMs / 1000) * 29.97))} 帧
          </span>
        </div>
        <input
          type="range"
          min={50}
          max={450}
          step={10}
          value={staggerMs}
          onChange={(e) => onStaggerChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-chrome-line accent-moss-fg"
        />
        <div className="flex justify-between text-[10px] text-chrome-muted font-mono">
          <span>紧凑 (50ms)</span>
          <span>标准 (180ms)</span>
          <span>舒缓 (450ms)</span>
        </div>
      </div>
    </div>
  );
}
