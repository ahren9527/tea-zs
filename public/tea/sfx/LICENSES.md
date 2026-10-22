# 音效来源与许可证 · public/tea/sfx/

新物件音效库（2026-10，feat/sfx）全部来自 **CC0 1.0（公共领域贡献）** 的真实录音：可商用、无需署名、可修改。
许可证文本：https://creativecommons.org/publicdomain/zero/1.0/
（每个 Freesound 条目的许可证已于 2026-10-22 在条目页面逐一核对为 CC0 1.0。）

- Freesound 条目使用的是公开的 HQ 试听文件（128 kbps mp3，免登录可下载），再统一处理成 48 kHz / 16-bit / 单声道 WAV。
- Kenney 条目来自 Kenney 官方 CC0 音效包（包内 License.txt：“Creative Commons Zero, CC0 … free to use in personal, educational and commercial projects”）。
- 处理链与截取点全部写在 `scripts/sfx/build-foley.py`，可一键重建：`python3 scripts/sfx/build-foley.py`。

## 动画风音效（mograph，2026-10，第 20 期起的主层）

全部 **在本仓库里程序合成**（`scripts/sfx/build-mograph.py`，numpy + scipy，无任何第三方录音 / 采样，随机种子固定、可逐字节重建：`python3 scripts/sfx/build-mograph.py`）。
许可：本仓库原创，随项目使用，无第三方许可约束。统一处理：48 kHz / 16-bit / 单声道，高通 35 Hz，2.2 kHz 下挖 3 dB（让位人声），峰值 -11 dBFS。
有音高的音色都调在 **D 大调五声**（D E F# A B），与品牌声古筝单音 A4 同调。

| 文件                                                | 用途                                    | 合成方法                                                       |
| --------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| mg-thump.wav / mg-thump-2.wav                       | 重落地（茶饼落桌）                      | 正弦从 A3 指数下滑到 D2 + 次低频 + 起音咔嗒 + 木质泛音，软削波 |
| mg-thump-soft.wav                                   | 轻落地（罐子落定、镇纸）                | 同上，A3 → A2，更短                                            |
| mg-pop.wav / mg-pop-2.wav / mg-pop-3.wav            | 亮 pop / plip（小元素）                 | 快速下滑正弦泡泡（A5 / B5 / D6）                               |
| mg-swoosh-up.wav / mg-swoosh-down.wav               | 滑入 / 落下、拉远                       | 时变带通噪声（350→3200 Hz / 2800→300 Hz）+ 滑音正弦            |
| mg-ding-d5 / e5 / fs5 / a5 / b5.wav、mg-ding-d4.wav | 大字落定（按句子走五声音阶；D4 = 重字） | 软槌加法合成（基频 + 3.98x / 9.2x 分音 + 槌头噪声）+ 短混响    |
| mg-bell.wav                                         | 品牌层：叠在古筝下的轻铃 D6             | 非谐分音铃（1 / 2 / 2.76 / 5.4 / 8.93）+ 混响                  |
| mg-stamp.wav                                        | 印章：厚实 thunk + 小回弹               | 两下下滑 thump（85 ms 间隔）+ 木质泛音                         |
| mg-crunch.wav                                       | 裂 / 碎                                 | 22 颗带通噪声颗粒 + A3→D3 下滑体感                             |
| mg-sparkle.wav                                      | 闪光散落（碎叶、香气）                  | 9 颗五声高音 pop（A6–A7）随机散布 + 混响                       |
| mg-tok.wav / mg-tok-light.wav                       | 罐盖：空心木 tok-clonk / 单下轻 tok     | 双模态木块（1x / 2.71x）A4 → D4                                |
| mg-swish.wav                                        | 毛笔划掉 / 朱砂一笔                     | 短时变带通噪声 900→4200 Hz                                     |
| mg-crinkle.wav / mg-crinkle-2.wav                   | 纸 / 铝箔夸张 crinkle                   | 11–14 颗尖脆带通噪声 snap，低通 8 kHz                          |
| mg-poke.wav                                         | 戳 / 扎（茶针）                         | 高 click + D6→A4 快速下滑 blip                                 |
| mg-scrape.wav                                       | 顺纹推 / 刮（茶刀）                     | 方波调幅带通噪声 + 微升调 D5                                   |
| mg-ratchet.wav                                      | 拧进（茶锥）/ 晃一晃                    | 三下升调木块 tick（75 ms 间隔）                                |
| mg-flutter.wav                                      | 展开（茶巾 / 卷轴 / 竹帘）              | 带通 swoosh × 11 Hz 抖动调幅                                   |
| mg-snap.wav                                         | 压封口                                  | A5 木块 tok + 高通 click                                       |

> 用法：动画声是主层；写实 CC0 物件录音（下表）作辅层，用 `mgLayer()` 在同一帧低 ~10 dB 垫一层质感；纯图形动作只用动画声。

## 物件音效

| 文件                | 用途                     | 来源（作者 · 标题）                                                                  | 链接                                   | 许可证  |
| ------------------- | ------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------- | ------- |
| cake-thud.wav       | 茶饼落到木桌             | Kenney · Impact Sounds `impactSoft_heavy_000` + `impactWood_light_000`（-9 dB 叠层） | https://kenney.nl/assets/impact-sounds | CC0 1.0 |
| cake-thud-2.wav     | 同上（变体）             | Kenney · Impact Sounds `impactSoft_heavy_002` + `impactWood_light_001`               | https://kenney.nl/assets/impact-sounds | CC0 1.0 |
| paper-rustle.wav    | 棉纸翻动 / 揭开          | Tomoyo Ichijouji · PageRustle                                                        | https://freesound.org/s/211246/        | CC0 1.0 |
| paper-rustle-2.wav  | 同上（变体）             | keweldog · rustling paper.wav                                                        | https://freesound.org/s/181774/        | CC0 1.0 |
| paper-tear.wav      | 棉纸撕开                 | keweldog · tearing paper4.wav                                                        | https://freesound.org/s/181773/        | CC0 1.0 |
| foil-crinkle.wav    | 铝箔袋揉动               | AndersHolm · Rustling of chips bag.wav                                               | https://freesound.org/s/411221/        | CC0 1.0 |
| foil-crinkle-2.wav  | 同上（变体）             | Anthousai · tinfoil 05.wav                                                           | https://freesound.org/s/337524/        | CC0 1.0 |
| foil-seal.wav       | 自封袋 / 铝箔袋压封口    | miekyj · Zip Lock Bag OWI.wav                                                        | https://freesound.org/s/326466/        | CC0 1.0 |
| needle-pierce.wav   | 茶针扎进紧压饼           | denizozturk5749 · Stabbing cardboard box                                             | https://freesound.org/s/778123/        | CC0 1.0 |
| needle-pierce-2.wav | 同上（变体）             | LittleLuigi · #2 Bag Stab-2.wav                                                      | https://freesound.org/s/363191/        | CC0 1.0 |
| needle-scrape.wav   | 茶针沿饼面撬 / 刮        | Hano_van_Dalen · WOODFric_Knife Carving Wood_HvD_OwSFX                               | https://freesound.org/s/767324/        | CC0 1.0 |
| cake-crack.wav      | 饼块撬开 / 掰裂          | Yin_Yang_Jake007 · Crisp Crunch                                                      | https://freesound.org/s/443469/        | CC0 1.0 |
| cake-crack-2.wav    | 同上（同一录音的另一下） | Yin_Yang_Jake007 · Crisp Crunch                                                      | https://freesound.org/s/443469/        | CC0 1.0 |
| leaf-scatter.wav    | 碎叶散落                 | Diim_1 · Revolver Hojas Otonales - Shuffling Autumn Leaves                           | https://freesound.org/s/867127/        | CC0 1.0 |
| jar-lid.wav         | 陶 / 紫砂罐盖合上        | megashroom · Teapot Lid Small 170428_1476.wav                                        | https://freesound.org/s/390342/        | CC0 1.0 |
| jar-lid-2.wav       | 同上（同一录音的另一下） | megashroom · Teapot Lid Small 170428_1476.wav                                        | https://freesound.org/s/390342/        | CC0 1.0 |
| seal-wood.wav       | 木印章压下               | I.fekry · traditional stamp.wav                                                      | https://freesound.org/s/470710/        | CC0 1.0 |
| cloth-unroll.wav    | 布展开                   | Kenney · RPG Audio `cloth1` + `cloth3`（错开 0.42 s）                                | https://kenney.nl/assets/rpg-audio     | CC0 1.0 |
| scroll-unroll.wav   | 卷轴展开                 | justeluis · Scroll.wav                                                               | https://freesound.org/s/185051/        | CC0 1.0 |
| paperweight.wav     | 镇纸压到木面             | Kenney · RPG Audio `bookPlace2` + Impact Sounds `impactWood_light_001`               | https://kenney.nl/assets/rpg-audio     | CC0 1.0 |
| whoosh-soft.wav     | 镜头运动（极轻）         | Mikes-MultiMedia · light slow swoosh.mp3                                             | https://freesound.org/s/349698/        | CC0 1.0 |
| whoosh-soft-2.wav   | 同上（短）               | Sadiquecat · Broomstick whoosh 3 - Quiet - OKM1                                      | https://freesound.org/s/816262/        | CC0 1.0 |

## 品牌声

| 文件            | 用途                                 | 来源                                                     | 链接                            | 许可证  |
| --------------- | ------------------------------------ | -------------------------------------------------------- | ------------------------------- | ------- |
| zheng-pluck.wav | 口诀落印 / 金句（默认）              | nanliu_music · GUZHENG - instrument- Single Note - Sound | https://freesound.org/s/847157/ | CC0 1.0 |
| bowl-strike.wav | 口诀落印 / 金句（备选：钵 / 磬一击） | inoshirodesign · singing bowl strike sound               | https://freesound.org/s/271370/ | CC0 1.0 |

> 说明：Freesound 上找不到 CC0 的**古琴**真录音（唯一的 “guqin” 条目是 Kaivo 物理建模合成），所以挑弦声用的是**古筝**单音真录音。

## 环境底

| 文件          | 用途                                | 来源                                                                                                                | 链接                                                              | 许可证  |
| ------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------- |
| room-tone.wav | 茶室底噪（20 s 无缝循环，-40 LUFS） | leonelmail · Roomtone Bedroom Yew（主体） + mario1298 · a gentle breeze, wind 2（低通 900 Hz，约 -9 dB 叠一层远风） | https://freesound.org/s/329569/ · https://freesound.org/s/181251/ | CC0 1.0 |

## 旧文件

其余 20 个旧 wav（abacus-slide、wood、tok、stamp、pop1-3 等）是本仓库早先生成 / 导入的通用音效，其中一部分由 `scripts/generate-ep19-sfx.js` 程序合成；第 18–20 期仍在用，保留不动，不在本表范围内。
