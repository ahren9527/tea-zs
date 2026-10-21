#!/usr/bin/env node
/**
 * 在 Node 里直接跑某个节拍的 draw.ts（导出路径），把指定秒数渲成 PNG，用来检查画面。
 *
 *   node scripts/render-frames.mjs src/remotion/ep20/b2/draw.ts 0.5 3 7.6 12.6 [--out screenshots/ep20-b2] [--theme classic]
 *
 * 依赖（不进 package.json，按需装在任意目录）：@napi-rs/canvas、esbuild，以及字体文件：
 *   RENDER_DEPS=/path/to/dir   该目录下 node_modules 里有 @napi-rs/canvas 与 esbuild（默认先找本仓库）
 *   RENDER_FONTS=/path/to/fonts 该目录下的 .ttf/.otf：文件名含 wenkai → 注册为 "ZS WenKai"/"LXGW WenKai"，
 *                               含 serif → "Noto Serif SC"
 */
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  if (i < 0) return d;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const outDir = resolve(ROOT, opt("out", "screenshots/frames"));
const theme = opt("theme", "classic");
const texts = opt("texts", "");
const [entry, ...secs] = args;
if (!entry || !secs.length) {
  console.error(
    "用法：node scripts/render-frames.mjs <draw.ts> <秒> [秒…] [--out dir] [--theme key] [--texts JSON]",
  );
  process.exit(1);
}

const depsDir = process.env.RENDER_DEPS ? resolve(process.env.RENDER_DEPS) : ROOT;
const req = createRequire(join(depsDir, "package.json"));
const { createCanvas, GlobalFonts } = req("@napi-rs/canvas");
const esbuild = req("esbuild");

// 字体
const fontDir = process.env.RENDER_FONTS;
if (fontDir) {
  for (const f of readdirSync(fontDir)) {
    const p = join(fontDir, f);
    if (/wenkai/i.test(f)) {
      GlobalFonts.registerFromPath(p, "ZS WenKai");
      GlobalFonts.registerFromPath(p, "LXGW WenKai");
    } else if (/serif/i.test(f)) GlobalFonts.registerFromPath(p, "Noto Serif SC");
  }
}

// 打包 draw.ts（@/ → src/）
const bundle = join(outDir, ".render-bundle.mjs");
mkdirSync(outDir, { recursive: true });
const stub = `export * from ${JSON.stringify(resolve(ROOT, entry))};
export { setSurfaceFactory } from ${JSON.stringify(join(ROOT, "src/remotion/shared/fx/surface.ts"))};`;
await esbuild.build({
  stdin: { contents: stub, resolveDir: ROOT, loader: "ts" },
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundle,
  alias: { "@": join(ROOT, "src") },
  logLevel: "warning",
});
const mod = await import(pathToFileURL(bundle).href + `?t=${Date.now()}`);
mod.setSurfaceFactory((w, h) => {
  const c = createCanvas(w, h);
  return { canvas: c, ctx: c.getContext("2d") };
});

const FPS = 29.97;
const canvas = createCanvas(1080, 1920);
const ctx = canvas.getContext("2d");
const params = {
  startMs: 0,
  staggerMs: 0,
  durationMs: 0,
  paperTheme: theme,
  fontScale: 1,
  customTexts: texts ? JSON.parse(texts) : {},
};
for (const s of secs) {
  const t = Number(s);
  const frame = Math.round(t * FPS);
  const t0 = performance.now();
  mod.draw(ctx, (frame / FPS) * 1000, params);
  const ms = (performance.now() - t0).toFixed(0);
  const file = join(outDir, `f${String(frame).padStart(4, "0")}_${t.toFixed(2)}s.png`);
  writeFileSync(file, canvas.toBuffer("image/png"));
  console.log(`${file}  (${ms} ms)`);
}
