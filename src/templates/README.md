# 节拍模板库（src/templates）

面板固定、模板固定，**每期只改内容**。一期 = 元信息（期数、标题、纸色、字号）+ 有序的分镜列表；
每个分镜 = `{ template, code, title, content, timing, exportName? }`，存成 JSON（见 `src/episodes/seeds/*.json`）。

## 目录

| 路径 | 作用 |
| --- | --- |
| `schema.ts` | 期 / 分镜 / 字段的类型与纯函数（规整、复制、导出名）。Node 测试可直接加载 |
| `script-parser.ts` | 结构化脚本 ⇄ 一期（粘贴脚本生成整期 / 导出成脚本） |
| `types.ts` | `defineTemplate`、`computePlan`（排时间轴、按口播时长反算节奏） |
| `kit/` | 画布工具：纸张、自动缩字换行、印章、毛笔笔触、卡片、勾叉、线描图标、缓动 |
| `library/` | 11 个节拍模板，每个一个文件：字段表 + `plan`（时间点）+ `draw`（画一帧） |
| `registry.ts` | 模板注册表（顺序 = 选择器里的顺序） |
| `TemplateComp.tsx` | 通用 Remotion 合成：每帧调用同一个 `draw`，预览 = 导出 |
| `beat-clip.ts` | 把分镜解析成播放器 / 导出可用的 `ClipDef`（含经典定制片段 `bespoke`） |
| `fonts.ts` | 完整霞鹜文楷（CDN 分片）按需加载，避免本地子集缺字混排 |

## 新增一个模板

1. 在 `library/` 新建 `xxx.ts`，用 `defineTemplate({ id, name, category, desc, fields, defaults, plan, draw })`。
   - `fields` 决定右侧表单（text / textarea / stamp / icon / select / number / toggle / list）。
   - `plan(c, tl)` 用 `tl.wait(秒)` 排节拍、`tl.mark(标签, 标记, 类型, 音效?)` 打关键帧——时间轴标记和音效都从这里自动来。
   - `draw(env, c, P)` 只画内容（纸底已画好），文字一律走 `text / blockText / layoutText`，自动适配长短。
2. 加到 `registry.ts` 的 `TEMPLATES`。
3. 打开 `/gallery` 看分解帧；`/gallery?only=xxx&at=0.6&theme=dark` 输出单帧 1080×1920。

## 图标

`kit/icons.ts` 的 `ICONS` 里加一项（72×72 画板、SVG path），所有模板的图标下拉自动出现。
