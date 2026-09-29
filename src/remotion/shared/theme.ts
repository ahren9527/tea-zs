export const FPS = 29.97;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const STAGE = {
  width: WIDTH,
  height: HEIGHT,
};

export const COLORS = {
  paper: "#f3ecdc",
  paperDeep: "#e7ddc8",
  ink: "#2b261c",
  muted: "#5c5346",
  seal: "#9b2d2a",
  bar: "#c4b49a",
};

export const PAPER_THEMES = {
  classic: {
    id: "classic",
    name: "澄心堂纸 · 苍古暖宣",
    desc: "北宋宣纸 · 暖润包浆，墨色沉实",
    paper: "#f4ede1",
    paperDeep: "#e6dcce",
    ink: "#2b251e",
    seal: "#9b2d2a",
    border: "#dfd2bf",
  },
  song: {
    id: "song",
    name: "月白素瓷 · 汝窑青润",
    desc: "雨过天青 · 恬淡清雅，文人雅致",
    paper: "#f3f5f4",
    paperDeep: "#e1e7e5",
    ink: "#202524",
    seal: "#a1322b",
    border: "#d5dedc",
  },
  ru_green: {
    id: "ru_green",
    name: "天青影青 · 越窑古翠",
    desc: "翠峰凝脂 · 千峰翠色，古朴温和",
    paper: "#edf2ee",
    paperDeep: "#dbe5dc",
    ink: "#1f2a24",
    seal: "#96342e",
    border: "#cedccd",
  },
  tea_tan: {
    id: "tea_tan",
    name: "黄栌落叶 · 陈木老茶",
    desc: "普洱陈仓 · 沉木暗香，古色浓郁",
    paper: "#ede3d2",
    paperDeep: "#dccdb7",
    ink: "#33261a",
    seal: "#8f2924",
    border: "#cfbfa6",
  },
  bamboo: {
    id: "bamboo",
    name: "菉竹漪漪 · 碧涧春晓",
    desc: "竹林微风 · 鲜叶初展，生津明润",
    paper: "#edf2e8",
    paperDeep: "#dce6d4",
    ink: "#1d291e",
    seal: "#9e322d",
    border: "#d0dec6",
  },
  dan_ochre: {
    id: "dan_ochre",
    name: "古赭紫石 · 岩茶焙火",
    desc: "丹霞古壁 · 武夷岩韵，雄浑沉稳",
    paper: "#ebe1da",
    paperDeep: "#dbcbc2",
    ink: "#2f221e",
    seal: "#932c25",
    border: "#cfb9ad",
  },
  dark: {
    id: "dark",
    name: "玄端漆墨 · 重焙乌金",
    desc: "宋元漆器 · 墨玉金石，朱砂夺目",
    paper: "#1a1816",
    paperDeep: "#27231f",
    ink: "#ece4d8",
    seal: "#cb443b",
    border: "#3a342c",
  },
} as const;

export type PaperThemeKey = keyof typeof PAPER_THEMES;

export const FONT = '"LXGW WenKai", "Noto Serif SC", "Songti SC", serif';
export const FONT_SONG = '"Noto Serif SC", "Songti SC", "Source Han Serif SC", serif';
export const SEAL_FONT = '"Noto Serif SC", "Songti SC", serif';

export function framesOf(seconds: number) {
  return Math.round(seconds * FPS);
}

export type AnimParams = {
  startMs: number;
  staggerMs: number;
  durationMs: number;
  customTexts?: Record<string, string>;
  paperTheme?: PaperThemeKey;
  fontScale?: number;
};

export function scaledFontSize(baseSize: number, fontScale: number = 1): number {
  return Math.round(baseSize * (fontScale || 1));
}

export function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export function lineProgress(index: number, elapsed: number, params: AnimParams, leadMs = 0) {
  const local = (elapsed - params.startMs - leadMs - index * params.staggerMs) / params.durationMs;
  if (local <= 0) return 0;
  if (local >= 1) return 1;
  return easeOutCubic(local);
}
