import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { TemplateThumb } from "@/components/studio/template-thumb";
import { PAPER_THEMES, type PaperThemeKey, WIDTH, HEIGHT } from "@/remotion/shared/theme";
import { getTemplate, TEMPLATES } from "@/templates/registry";
import { renderTemplateFrame } from "@/templates/render";
import { DEFAULT_TIMING, normalizeContent } from "@/templates/schema";
import { computePlan } from "@/templates/types";
import { collectText, ensureFonts } from "@/templates/fonts";

type Search = { only?: string; at?: number; theme?: string; c?: string };

/** 模板图鉴：每个模板的动画分解帧；?only=模板id&at=0.5 输出单帧 1080×1920（截图/核对用） */
export const Route = createFileRoute("/gallery")({
  component: Gallery,
  validateSearch: (s: Record<string, unknown>): Search => ({
    only: typeof s.only === "string" ? s.only : undefined,
    at: s.at != null ? Number(s.at) : undefined,
    theme: typeof s.theme === "string" ? s.theme : undefined,
    c: typeof s.c === "string" ? s.c : s.c && typeof s.c === "object" ? JSON.stringify(s.c) : undefined,
  }),
});

function Gallery() {
  const { only, at, theme, c } = Route.useSearch();
  const th = (theme && theme in PAPER_THEMES ? theme : "classic") as PaperThemeKey;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  if (only) return <FullFrame id={only} at={at ?? 0.97} theme={th} override={c} />;
  return (
    <main className="min-h-dvh bg-chrome p-6 text-chrome-fg">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-xl">模板图鉴 · {TEMPLATES.length} 个节拍模板</h1>
        <Link to="/" className="rounded border border-chrome-line px-3 py-1.5 text-xs text-chrome-muted hover:text-chrome-fg">
          返回操作面板
        </Link>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {TEMPLATES.map((t) => (
          <section key={t.id} className="rounded-lg border border-chrome-line bg-surface p-4">
            <div className="mb-3">
              <span className="mr-2 rounded bg-moss px-1.5 py-0.5 text-[10px] text-moss-fg">{t.category}</span>
              <span className="font-display text-base">{t.name}</span>
              <span className="ml-2 font-mono text-[10px] text-chrome-muted">{t.id}</span>
              <p className="mt-1 text-xs text-chrome-muted">{t.desc}</p>
            </div>
            <div className="flex gap-2">
              {[0.18, 0.42, 0.66, 0.97].map((a) => (
                <TemplateThumb key={a} templateId={t.id} at={a} theme={th} width={150} className="rounded" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function FullFrame({ id, at, theme, override }: { id: string; at: number; theme: PaperThemeKey; override?: string }) {
  const content = useMemo(() => {
    const def = getTemplate(id);
    if (!def) return {};
    let extra: Record<string, unknown> = {};
    try {
      extra = override ? (JSON.parse(override) as Record<string, unknown>) : {};
    } catch {
      extra = {};
    }
    return normalizeContent(def, { ...def.defaults, ...extra });
  }, [id, override]);
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const def = getTemplate(id);
    if (!def) return;
    void ensureFonts(collectText(content))
      .then(() => document.fonts.ready)
      .then(() => setReady(true));
  }, [id, content]);
  useEffect(() => {
    const def = getTemplate(id);
    const ctx = ref.current?.getContext("2d");
    if (!def || !ctx || !ready) return;
    const plan = computePlan(def, content, DEFAULT_TIMING);
    renderTemplateFrame(ctx, def, content, plan, plan.activeSec * at, theme, 1);
  }, [id, at, theme, ready, content]);
  return <canvas ref={ref} width={WIDTH} height={HEIGHT} data-ready={ready ? "1" : "0"} aria-label="frame" style={{ display: "block" }} />;
}
