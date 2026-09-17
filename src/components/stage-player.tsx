import { useEffect, useRef, useState } from "react";
import { STAGE } from "@/data/scenes";
import { drawFrame, totalDuration, type AnimParams } from "@/lib/draw-stage";

type Props = {
  playId: number;
  params: AnimParams;
  onPlayingChange?: (playing: boolean) => void;
};

export function StagePlayer({ playId, params, onPlayingChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const duration = totalDuration(params);
    const started = performance.now();
    let raf = 0;
    onPlayingChange?.(true);

    const tick = (now: number) => {
      const elapsed = now - started;
      drawFrame(ctx, elapsed, params);
      if (elapsed < duration) {
        raf = requestAnimationFrame(tick);
      } else {
        drawFrame(ctx, duration, params);
        onPlayingChange?.(false);
      }
    };

    drawFrame(ctx, 0, params);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      onPlayingChange?.(false);
    };
  }, [playId, params, ready, onPlayingChange]);

  return (
    <canvas
      ref={canvasRef}
      width={STAGE.width}
      height={STAGE.height}
      className="h-auto w-full max-h-full bg-paper shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      aria-label="茶类区分卡动画"
    />
  );
}
