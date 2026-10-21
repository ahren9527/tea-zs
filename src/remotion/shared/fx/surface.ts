/**
 * fx/surface — 离屏画布工厂。浏览器里用 OffscreenCanvas / <canvas>；
 * Node 渲染脚本（scripts/render-frames.mjs）用 setSurfaceFactory 注入 @napi-rs/canvas。
 */
export type Surface = {
  canvas: CanvasImageSource & { width: number; height: number };
  ctx: CanvasRenderingContext2D;
};

type Factory = (w: number, h: number) => Surface;

let factory: Factory | null = null;

export function setSurfaceFactory(f: Factory) {
  factory = f;
  cache.clear();
}

export function createSurface(w: number, h: number): Surface {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));
  if (factory) return factory(W, H);
  if (typeof document !== "undefined") {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return { canvas: c, ctx: c.getContext("2d") as CanvasRenderingContext2D };
  }
  if (typeof OffscreenCanvas !== "undefined") {
    const c = new OffscreenCanvas(W, H);
    return { canvas: c as unknown as Surface["canvas"], ctx: c.getContext("2d") as unknown as CanvasRenderingContext2D };
  }
  throw new Error("fx/surface: 没有可用的画布实现（Node 里请先 setSurfaceFactory）");
}

const cache = new Map<string, Surface>();

/** 按 key 缓存的离屏画布：静态纹理只画一次 */
export function cachedSurface(key: string, w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void): Surface {
  const hit = cache.get(key);
  if (hit) return hit;
  const s = createSurface(w, h);
  paint(s.ctx);
  cache.set(key, s);
  if (cache.size > 64) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  return s;
}

/** 可复用的临时画布（同 key 同尺寸复用，每次调用前清空） */
const scratch = new Map<string, Surface>();
export function scratchSurface(key: string, w: number, h: number): Surface {
  let s = scratch.get(key);
  if (!s || s.canvas.width !== Math.round(w) || s.canvas.height !== Math.round(h)) {
    s = createSurface(w, h);
    scratch.set(key, s);
  }
  s.ctx.setTransform(1, 0, 0, 1, 0, 0);
  s.ctx.globalAlpha = 1;
  s.ctx.globalCompositeOperation = "source-over";
  s.ctx.clearRect(0, 0, s.canvas.width, s.canvas.height);
  return s;
}
