#!/usr/bin/env node
/**
 * 纯静态构建（Cloudflare Pages / 任意静态托管，挂在域名根路径）：
 *   npm run build:static   →  dist-static/
 *
 * - 不带 Nitro / 服务端：没有登录、没有数据库、没有 /api/*（MP4 只走浏览器内导出）。
 * - index.html 是 SPA 壳；不生成 404.html，Cloudflare Pages 会把未知路径回落到 index.html。
 *   其它静态托管请配置「所有路径回落到 /index.html」。
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist-static");
const CLIENT = join(ROOT, "dist", "client");

rmSync(join(ROOT, "dist"), { recursive: true, force: true });
const r = spawnSync("npx", ["vite", "build"], {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, STATIC_BUILD: "1", VITE_STATIC: "1", VITE_AUTH_ENABLED: "false" },
});
if (r.status !== 0) process.exit(r.status ?? 1);

if (!existsSync(join(CLIENT, "index.html"))) {
  console.error("✖ 没有找到 dist/client/index.html（SPA 壳预渲染失败）");
  process.exit(1);
}
rmSync(OUT, { recursive: true, force: true });
cpSync(CLIENT, OUT, { recursive: true });
// 不要 404.html：有它 Cloudflare Pages 就不做 SPA 回落
rmSync(join(OUT, "404.html"), { force: true });
writeFileSync(
  join(OUT, "_headers"),
  ["/assets/*", "  Cache-Control: public, max-age=31536000, immutable", ""].join("\n"),
);
const n = readdirSync(OUT).length;
console.log(`\n✔ 静态站点已生成：dist-static/（${n} 项）。Cloudflare Pages：构建命令 npm run build:static，输出目录 dist-static`);
