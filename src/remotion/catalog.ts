import type { ClipDef } from "./shared/types";
// Ep 19 clips
import { Comp as E19B1, duration as e19b1Duration } from "./ep19/b1-hook/Comp";
import { draw as e19b1Draw } from "./ep19/b1-hook/draw";
import { Comp as E19B4_1 } from "./ep19/b4-1-defense/Comp";
import { duration as e19b4_1Duration } from "./ep19/b4-1-defense/data-export";
import { draw as e19b4_1Draw } from "./ep19/b4-1-defense/draw";
import { Comp as E19B4_2 } from "./ep19/b4-2-duel/Comp";
import { duration as e19b4_2Duration } from "./ep19/b4-2-duel/data-export";
import { draw as e19b4_2Draw } from "./ep19/b4-2-duel/draw";
import { Comp as E19B5_1 } from "./ep19/b5-1-trap/Comp";
import { duration as e19b5_1Duration } from "./ep19/b5-1-trap/data-export";
import { draw as e19b5_1Draw } from "./ep19/b5-1-trap/draw";
import { Comp as E19B5_2 } from "./ep19/b5-2-open/Comp";
import { duration as e19b5_2Duration } from "./ep19/b5-2-open/data-export";
import { draw as e19b5_2Draw } from "./ep19/b5-2-open/draw";
import { Comp as E19B6_1 } from "./ep19/b6-1-vessels/Comp";
import { duration as e19b6_1Duration } from "./ep19/b6-1-vessels/data-export";
import { draw as e19b6_1Draw } from "./ep19/b6-1-vessels/draw";

// Ep 18 clips
import { Comp as B1, duration as b1Duration } from "./ep18/b1-hook/Comp";
import { draw as b1Draw } from "./ep18/b1-hook/draw";
import { Comp as B2, duration as b2Duration } from "./ep18/b2-three/Comp";
import { draw as b2Draw } from "./ep18/b2-three/draw";
import { Comp as B3, duration as b3Duration } from "./ep18/b3-dry/Comp";
import { draw as b3Draw } from "./ep18/b3-dry/draw";
import { Comp as B4, duration as b4Duration } from "./ep18/b4-seal/Comp";
import { draw as b4Draw } from "./ep18/b4-seal/draw";
import { Comp as B5, duration as b5Duration } from "./ep18/b5-clean/Comp";
import { draw as b5Draw } from "./ep18/b5-clean/draw";
import { Comp as B6, duration as b6Duration } from "./ep18/b6-six/Comp";
import { draw as b6Draw } from "./ep18/b6-six/draw";
import { Comp as B7, duration as b7Duration } from "./ep18/b7-poll/Comp";
import { draw as b7Draw } from "./ep18/b7-poll/draw";
import { Comp as B8, duration as b8Duration } from "./ep18/b8-shelf/Comp";
import { draw as b8Draw } from "./ep18/b8-shelf/draw";
import { Comp as B9, duration as b9Duration } from "./ep18/b9-close/Comp";
import { draw as b9Draw } from "./ep18/b9-close/draw";
import { Comp as B10, duration as b10Duration } from "./ep18/b10-jar/Comp";
import { draw as b10Draw } from "./ep18/b10-jar/draw";

export const CLIPS: ClipDef[] = [
  // --- 第 19 期: 大罐存、小罐醒 ---
  {
    id: "ep19-b1",
    episode: 19,
    code: "B1",
    title: "频繁开大袋",
    note: "频繁开大袋 ≠ 正常取茶 · 散茶头香散失 70% · 6.8秒",
    folder: "src/remotion/ep19/b1-hook",
    exportName: "正上茶舍_19_B1_频繁开大袋.mp4",
    Comp: E19B1,
    duration: e19b1Duration,
    draw: e19b1Draw,
  },
  {
    id: "ep19-b4-1",
    episode: 19,
    code: "B4-1",
    title: "避光与密封物理防御",
    note: "小瓷罐纵剖面 · 避光折射散射 · 硅胶密封挤压 · 5秒",
    folder: "src/remotion/ep19/b4-1-defense",
    exportName: "正上茶舍_19_B4-1_避光与密封物理防御.mp4",
    Comp: E19B4_1,
    duration: e19b4_1Duration,
    draw: e19b4_1Draw,
  },
  {
    id: "ep19-b4-2",
    episode: 19,
    code: "B4-2",
    title: "材质红黑对决",
    note: "瓷铁 vs 砂玻 · 避光折射与枯萎灰褐 · 密封光罩与跑香逸散 · 5秒",
    folder: "src/remotion/ep19/b4-2-duel",
    exportName: "正上茶舍_19_B4-2_材质红黑对决.mp4",
    Comp: E19B4_2,
    duration: e19b4_2Duration,
    draw: e19b4_2Draw,
  },
  {
    id: "ep19-b5-1",
    episode: 19,
    code: "B5-1",
    title: "吸异味雷区",
    note: "后景厨房铁锅油烟升腾 · 前景墨绿瓷罐两叶一芽茶变质 · 避开厨房油烟 · 4.5秒",
    folder: "src/remotion/ep19/b5-1-trap",
    exportName: "正上茶舍_19_B5-1_吸异味雷区.mp4",
    Comp: E19B5_1,
    duration: e19b5_1Duration,
    draw: e19b5_1Draw,
  },
  {
    id: "ep19-b5-2",
    episode: 19,
    code: "B5-2",
    title: "梅雨大开雷区",
    note: "中式湿度计飙升85% · 物理湿气水滴倾泻 · 大铝箔自封袋大敞大开 · 茶叶受潮发软 · 5秒",
    folder: "src/remotion/ep19/b5-2-open",
    exportName: "正上茶舍_19_B5-2_梅雨大开雷区.mp4",
    Comp: E19B5_2,
    duration: e19b5_2Duration,
    draw: e19b5_2Draw,
  },
  {
    id: "ep19-b6-1",
    episode: 19,
    code: "B6-1",
    title: "昼夜双境·仓台对读",
    note: "上半屏暗仓夜境大瓮经年 · 下半屏晨曦案头小瓷罐醒茶 · 居中破空砸落印章横幅 · 4.5秒",
    folder: "src/remotion/ep19/b6-1-vessels",
    exportName: "正上茶舍_19_B6-1_昼夜双境仓台对读.mp4",
    Comp: E19B6_1,
    duration: e19b6_1Duration,
    draw: e19b6_1Draw,
  },

  // --- 第 18 期: 存茶三法则 ---
  {
    id: "ep18-b1",
    episode: 18,
    code: "B1",
    title: "破题",
    note: "越放越香 → 毁茶 → 你以为在陈化 · 10秒",
    folder: "src/remotion/ep18/b1-hook",
    exportName: "正上茶舍_18_B1_破题.mp4",
    Comp: B1,
    duration: b1Duration,
    draw: b1Draw,
  },
  {
    id: "ep18-b2",
    episode: 18,
    code: "B2",
    title: "三法则",
    note: "干 / 封 / 净 三张卡 · 8秒",
    folder: "src/remotion/ep18/b2-three",
    exportName: "正上茶舍_18_B2_三法则.mp4",
    Comp: B2,
    duration: b2Duration,
    draw: b2Draw,
  },
  {
    id: "ep18-b3",
    episode: 18,
    code: "B3",
    title: "干",
    note: "吸潮≠变醇／发酸发霉 → 梅雨除湿机 → 别塞冰箱 · 20秒",
    folder: "src/remotion/ep18/b3-dry",
    exportName: "正上茶舍_18_B3_干.mp4",
    Comp: B3,
    duration: b3Duration,
    draw: b3Draw,
  },
  {
    id: "ep18-b4",
    episode: 18,
    code: "B4",
    title: "封",
    note: "紫砂不能用 → 三层法叠上 → 挡潮避光 · 18秒",
    folder: "src/remotion/ep18/b4-seal",
    exportName: "正上茶舍_18_B4_封.mp4",
    Comp: B4,
    duration: b4Duration,
    draw: b4Draw,
  },
  {
    id: "ep18-b5",
    episode: 18,
    code: "B5",
    title: "净",
    note: "油烟 · 潮气 · 樟脑丸 · 10秒",
    folder: "src/remotion/ep18/b5-clean",
    exportName: "正上茶舍_18_B5_净.mp4",
    Comp: B5,
    duration: b5Duration,
    draw: b5Draw,
  },
  {
    id: "ep18-b6",
    episode: 18,
    code: "B6",
    title: "总结",
    note: "够干、封死、没味 三印 · 8秒",
    folder: "src/remotion/ep18/b6-six",
    exportName: "正上茶舍_18_B6_六个字.mp4",
    Comp: B6,
    duration: b6Duration,
    draw: b6Draw,
  },
  {
    id: "ep18-b7",
    episode: 18,
    code: "B7",
    title: "互动",
    note: "怎么喝 → A/B 同屏 → 评论区聊聊 · 10秒",
    folder: "src/remotion/ep18/b7-poll",
    exportName: "正上茶舍_18_B7_互动.mp4",
    Comp: B7,
    duration: b7Duration,
    draw: b7Draw,
  },
  {
    id: "ep18-b8",
    episode: 18,
    code: "B8",
    title: "架起来放",
    note: "离墙一尺 → 离地半尺 → 架起来放 · 12秒",
    folder: "src/remotion/ep18/b8-shelf",
    exportName: "正上茶舍_18_B8_架起来放.mp4",
    Comp: B8,
    duration: b8Duration,
    draw: b8Draw,
  },
  {
    id: "ep18-b9",
    episode: 18,
    code: "B9",
    title: "先存对",
    note: "先存对，再谈老 · 飞入后放大 · 8秒",
    folder: "src/remotion/ep18/b9-close",
    exportName: "正上茶舍_18_B9_先存对再谈老.mp4",
    Comp: B9,
    duration: b9Duration,
    draw: b9Draw,
  },
  {
    id: "ep18-b10",
    episode: 18,
    code: "B10",
    title: "大罐存小罐醒",
    note: "大罐存 · 小罐醒 · 主仓与随喝搭配 · 12秒",
    folder: "src/remotion/ep18/b10-jar",
    exportName: "正上茶舍_18_B10_大罐存小罐醒.mp4",
    Comp: B10,
    duration: b10Duration,
    draw: b10Draw,
  },
];

export function getClip(id: string) {
  return CLIPS.find((c) => c.id === id) ?? CLIPS[0];
}
