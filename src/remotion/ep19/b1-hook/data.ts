import { framesOf } from "@/remotion/shared/theme";

// Minimal qualitative title and cross mark
export const TITLE_TEXT = "频繁开大袋";
export const CROSS_MARK = "✖";

// Timeline landmarks: 6.8s (~204 frames at 29.97fps)
export const LENGTH = framesOf(6.8);

export const CONTENT_ENTER_AT = 0;
export const STAMP_AT = framesOf(1.0); // frame 30: ✖ stamp hits
export const BAG_OPEN_AT = framesOf(1.8); // frame 54: zipper unzips
export const LEAF_RISE_AT = framesOf(2.2); // frame 66: leaf escapes
export const WATER_DROP_AT = framesOf(2.9); // frame 87: water droplet intrudes
export const DROP_START_AT = framesOf(3.2); // frame 96: gauge begins shrinking
export const DROP_END_AT = framesOf(5.2); // frame 156: gauge ends at 23%

export function sfxHits(_staggerFrames: number) {
  return [
    // 0. 画面微起伏入场轻宣纸音
    { src: "tea/sfx/paper.wav", at: 0, volume: 0.35 },
    // 1. 沉木印章声（低钝实感）：古木方章盖在宣纸上的沉闷微顿声（咚/笃）
    { src: "tea/sfx/wood-stamp.wav", at: STAMP_AT, volume: 0.72 },
    // 2. 干茶沙沙声 + 微弱气流声：抓动干燥白茶条索细碎摩擦声 + 微嗤放气
    { src: "tea/sfx/tea-rustle-hiss.wav", at: BAG_OPEN_AT, volume: 0.58 },
    // 3. 空灵微风声（柔和泛音）：极低音量气流轻拂竹林泛音，随粒子上升消隐
    { src: "tea/sfx/ethereal-breeze.wav", at: LEAF_RISE_AT, volume: 0.42 },
    // 4. 空谷水滴声（单声）：清脆圆润的一记泉水滴入深潭声（叮咚/滴）
    { src: "tea/sfx/water-drop.wav", at: WATER_DROP_AT, volume: 0.62 },
    // 5. 竹算盘拨珠声 / 木棘轮连响：清脆连续木珠拨动声（嗒嗒嗒嗒嗒）
    { src: "tea/sfx/abacus-slide.wav", at: DROP_START_AT, volume: 0.52 },
    // 6. 滑动条到尾定格声：滑槽阻尼滑行微声 + 终点磁吸/卡扣限位落槽声（清脆顺滑归位）
    { src: "tea/sfx/slider-settle.wav", at: DROP_END_AT, volume: 0.65 },
  ];
}
