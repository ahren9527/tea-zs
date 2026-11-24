# 本项目说明（给 AI 编程助手）

这是「正上茶舍动画台」：为白茶短视频生成竖版 9:16 演示动画的 Remotion + Canvas 面板。

动手之前先读：

1. `docs/交接说明.md`：工作流、风格约束、验收标准、改动边界
2. `docs/新建一期.md`：每期的命令与步骤
3. `docs/动效库.md`：可以复用的动效 / 音效函数

硬规矩：

- push 到 `main` 就会自动上线，**没有用户同意不要推送**。
- 每期一个分支 `epNN`，只在 `src/remotion/epNN/`（和 `public/tea/epNN/`、`public/tea/vo/epNN.mp3`）里工作。
- 不顺手改构建脚本、`package.json`、面板代码；要改单独一个分支并先说明原因。
- 交付前跑 `npm run check:ep -- NN`、`npm run typecheck`、`npm run build:static`、`npm test`。
