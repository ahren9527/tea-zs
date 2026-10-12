/**
 * 静态部署（`npm run build:static`，如 Cloudflare Pages）时为 true：
 * 没有服务器，所以不显示登录、不走服务端 MP4 转码兜底，PWA 清单也不引用。
 * 动画预览、改文案、本机自动保存、浏览器内导出 MP4/WebM 都照常工作。
 */
export const STATIC_MODE = import.meta.env.VITE_STATIC === "1";
