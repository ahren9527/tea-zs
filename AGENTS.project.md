# 本项目说明（优先于 AGENTS.md）

这是「正上茶舍动画台」：为白茶短视频生成竖版 9:16 演示动画的 Remotion + Canvas 面板。
根目录 AGENTS.md 是 Grok App Builder 模板自带的通用沙盒说明，不适用于本项目的日常工作。

动手之前先读：

1. docs/交接说明.md：工作流、风格约束、验收标准，以及哪些地方不能动
2. docs/新建一期.md：新建节拍的四个步骤
3. docs/动效库.md：可以复用的动效函数

硬规矩：push 到 main 就会自动上线，没有用户同意不要推送；不要改构建脚本和面板代码；每期只新增 src/remotion/epNN/。
