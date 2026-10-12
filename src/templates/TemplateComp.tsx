import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { SfxTrack } from "@/remotion/shared/sfx";
import { HEIGHT, WIDTH, type PaperThemeKey } from "@/remotion/shared/theme";
import { DEFAULT_TIMING, type BeatTiming, type TemplateContent } from "./schema";
import { getTemplate } from "./registry";
import { renderTemplateFrame, sfxFromPlan } from "./render";
import { computePlan } from "./types";
import { collectText, ensureFonts } from "./fonts";

export type TemplateCompProps = {
  templateId: string;
  content: TemplateContent;
  timing?: BeatTiming;
  paperTheme?: PaperThemeKey;
  fontScale?: number;
  muted?: boolean;
};

/** 通用模板合成：Remotion 每帧调用同一个 canvas draw，与导出逐帧画面完全一致 */
export function TemplateComp({ templateId, content, timing, paperTheme = "classic", fontScale = 1, muted }: TemplateCompProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const def = getTemplate(templateId);
  const plan = useMemo(() => (def ? computePlan(def, content, timing ?? DEFAULT_TIMING) : null), [def, content, timing]);
  const hits = useMemo(() => (plan && !muted ? sfxFromPlan(plan) : []), [plan, muted]);
  const [fontTick, setFontTick] = useState(0);

  useEffect(() => {
    let alive = true;
    void ensureFonts(collectText(content)).then(() => alive && setFontTick((n) => n + 1));
    return () => {
      alive = false;
    };
  }, [content]);

  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    let alive = true;
    void document.fonts.ready.then(() => alive && setFontTick((n) => n + 1));
    return () => {
      alive = false;
    };
  }, []);

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas || !def || !plan) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderTemplateFrame(ctx, def, content, plan, frame / fps, paperTheme, fontScale);
  }, [frame, fps, def, plan, content, paperTheme, fontScale, fontTick]);

  if (!def) {
    return (
      <AbsoluteFill style={{ background: "#f4ede1", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
        未知模板：{templateId}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <canvas ref={ref} width={WIDTH} height={HEIGHT} style={{ width: "100%", height: "100%", display: "block" }} />
      <SfxTrack hits={hits} />
    </AbsoluteFill>
  );
}
