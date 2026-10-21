/**
 * fx/react — 同一套 fx 的 React 包装（Remotion 预览用）。
 * 原则：要么直接调用 canvas 的 draw 函数（<FxCanvas>，像素级一致），
 * 要么用同一组纯函数算出的几何画 SVG / CSS（<InkReveal>、<GrowStroke>、<CameraLayer>）。
 */
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { HEIGHT, WIDTH } from "../theme";
import { layerCss, type Camera } from "./camera";
import { inkBloomShapes, type Bounds, type InkBloomOpts } from "./ink";
import { pointsToPath, type Pt } from "./math";
import { drawLeafParticles, drawLightSpots, drawSteam, leafParticles, lightSpots, steamWisps, type Area } from "./motion";
import type { FxPalette } from "./palette";
import { drawSeal, type SealOpts } from "./seal";
import { brushOutline, type BrushOpts } from "./stroke";
import { drawGrain, drawRicePaper, drawVignette, drawWindowLight } from "./texture";

/**
 * 每帧调用一次 draw(ctx, frame) 的全屏画布（1080×1920，随 Player 缩放）。
 * fontsReady：字体分片加载完成后的 Promise，完成后会重画一次（canvas 不会自己等字体）。
 */
export function FxCanvas({
  draw,
  style,
  fontsReady,
  deps = [],
}: {
  draw: (ctx: CanvasRenderingContext2D, frame: number) => void;
  style?: CSSProperties;
  fontsReady?: Promise<unknown>;
  deps?: unknown[];
}) {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);
  useLayoutEffect(() => {
    let alive = true;
    void fontsReady?.then(() => alive && setTick((n) => n + 1));
    return () => {
      alive = false;
    };
  }, [fontsReady]);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    draw(ctx, frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, tick, draw, ...deps]);
  return <canvas ref={ref} width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...style }} />;
}

/** 镜头层：children 按 depth 做视差推近（CSS transform，与 canvas withLayer 同一套数学） */
export function CameraLayer({ cam, depth, children, blur = false }: { cam: Camera; depth: number; children: ReactNode; blur?: boolean }) {
  const css = layerCss(cam, depth);
  return (
    <AbsoluteFill style={{ transform: css.transform, transformOrigin: css.transformOrigin, filter: blur ? css.filter : undefined }}>
      {children}
    </AbsoluteFill>
  );
}

/** 宣纸底（纸色 + 纤维 + 帘纹） */
export function RicePaper({ pal }: { pal: FxPalette }) {
  return <FxCanvas draw={(ctx) => drawRicePaper(ctx, pal)} deps={[pal.paper]} />;
}

/** 表层质感：窗光 + 暗角 + 逐帧颗粒（放在最上层） */
export function FilmFinish({ pal, light = 1, vignette = 1, grain = 0.5 }: { pal: FxPalette; light?: number; vignette?: number; grain?: number }) {
  return (
    <FxCanvas
      draw={(ctx, f) => {
        drawWindowLight(ctx, f, pal, light);
        drawVignette(ctx, pal, vignette);
        drawGrain(ctx, f, grain);
      }}
      deps={[pal.paper, light, vignette, grain]}
    />
  );
}

/** 水墨晕染显现：用 inkBloomShapes 的同一组多边形做 SVG 遮罩 */
export function InkReveal({ p, bounds, seed = 1, opts, children }: { p: number; bounds: Bounds; seed?: number; opts?: InkBloomOpts; children: ReactNode }) {
  const id = `ink-${seed}-${Math.round(bounds.x)}-${Math.round(bounds.y)}`;
  if (p <= 0) return null;
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const polys = inkBloomShapes(p, bounds, seed, opts);
  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id={`${id}-f`}>
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width={WIDTH} height={HEIGHT}>
            <g filter={`url(#${id}-f)`}>
              {polys.map((poly, i) => (
                <path key={i} d={pointsToPath(poly)} fill="#fff" />
              ))}
            </g>
          </mask>
        </defs>
      </svg>
      <AbsoluteFill style={{ mask: `url(#${id})`, WebkitMask: `url(#${id})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
}

/** 毛笔笔触生长（SVG 多边形，与 drawBrushStroke 同一轮廓） */
export function GrowStroke({ points, p, opts }: { points: Pt[]; p: number; opts: BrushOpts }) {
  const poly = brushOutline(points, p, opts);
  return (
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      {poly.length > 2 && <path d={pointsToPath(poly)} fill={opts.color ?? "#2b251e"} opacity={opts.alpha ?? 1} />}
    </svg>
  );
}

/** 印章（直接调 drawSeal） */
export function SealStamp(props: SealOpts) {
  return <FxCanvas draw={(ctx) => drawSeal(ctx, props)} deps={[props.text, props.pose.p, props.pose.ink, props.x, props.y, props.size]} />;
}

/** 恒定微动层：光斑 + 水汽 + 碎叶（任一可关） */
export function AmbientMotion({
  pal,
  spots,
  steam,
  leaves,
}: {
  pal: FxPalette;
  spots?: { n: number; area: Area; seed?: number };
  steam?: { n: number; origin: { x: number; y: number; w: number }; seed?: number; height?: number };
  leaves?: { n: number; area: Area; seed?: number };
}) {
  return (
    <FxCanvas
      draw={(ctx, f) => {
        if (spots) drawLightSpots(ctx, lightSpots(f, spots.n, spots.area, spots.seed), pal.light);
        if (steam) drawSteam(ctx, steamWisps(f, steam.n, steam.origin, steam.seed, steam.height), pal.dark ? "#ffffff" : pal.rice);
        if (leaves) drawLeafParticles(ctx, leafParticles(f, leaves.n, leaves.area, leaves.seed), [pal.bamboo, pal.tea, pal.oat]);
      }}
      deps={[pal.paper]}
    />
  );
}
