import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * 动画台是纯前端面板（画布绘制 + 浏览器内 WebCodecs 导出），没有服务端。
 * - `npm run dev`：本地开发，http://localhost:3000
 * - `npm run build:static`（scripts/build-static.mjs 设置 STATIC_BUILD=1）：SPA 模式，
 *   预渲染一个 index.html 空壳，产物 dist-static/ 直接放 Cloudflare Pages。
 */
const STATIC_BUILD = process.env.STATIC_BUILD === "1";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      router: {
        codeSplittingOptions: {
          defaultBehavior: [],
          splitBehavior: () => [],
        },
      },
      ...(STATIC_BUILD
        ? { spa: { enabled: true, prerender: { outputPath: "/index.html", crawlLinks: false } } }
        : {}),
    }),
    viteReact(),
  ],
});
