import { ClientOnly, createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";

const APP_NAME = "正上茶舍 · 动画台";
const APP_DESC = "正上茶舍白茶短视频的演示动画面板：预览、改字、导出 MP4";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: APP_DESC },
      { name: "robots", content: "noindex, nofollow" },
      { name: "theme-color", content: "#14110e" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preload", href: "/fonts/lxgw-wenkai-medium.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "/fonts/zs-wenkai.css" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;900&family=Noto+Serif+SC:wght@500;600;700;900&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {/* 面板只在浏览器里渲染（画布、localStorage、WebCodecs 都是浏览器能力），静态 index.html 只是空壳 */}
        <ClientOnly>
          <Outlet />
        </ClientOnly>
        <Scripts />
      </body>
    </html>
  ),
});
