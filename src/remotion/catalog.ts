import type { ClipDef } from "./shared/types";
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

export const CLIPS: ClipDef[] = [
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
];

export function getClip(id: string) {
  return CLIPS.find((c) => c.id === id) ?? CLIPS[0];
}
