# 正上茶舍 · 动画台

白茶短视频（微信视频号，竖版 9:16）的演示动画面板：预览每个节拍、改画面文案、导出 MP4 / 分轨音效。
线上：https://tea.ahren.cc.cd/ （push 到 `main` 自动部署到 Cloudflare Pages）

```bash
bun install            # 或 npm install
npm run dev            # http://localhost:3000
npm run build:static   # → dist-static/（Cloudflare Pages 的构建命令）
```

每期工作流：

```bash
npm run new:episode -- 23 "本期标题"
npm run vo:estimate -- 23
npm run new:clip -- 23 B1 开门大字
npm run check:ep -- 23
```

接手先读 [docs/交接说明.md](docs/交接说明.md)。
