/**
 * fx/palette — 小正 IP 角色卡的配色，和纸色主题（theme.ts）调和。
 *   暖米白 #F3EADB · 燕麦米 #E3CFB4 · 茶褐 #7A4E33 · 竹青绿 #6B7A4F · 朱砂红 #B5332A
 * 纸色仍然跟随面板选的主题（PAPER_THEMES），角色色只做点缀；深色主题下自动提亮。
 */
import { PAPER_THEMES, type PaperThemeKey } from "../theme";

export const XIAOZHENG = {
  rice: "#F3EADB", // 暖米白
  oat: "#E3CFB4", // 燕麦米
  tea: "#7A4E33", // 茶褐
  bamboo: "#6B7A4F", // 竹青绿
  cinnabar: "#B5332A", // 朱砂红
} as const;

export type FxPalette = {
  /** 纸 */
  paper: string;
  paperDeep: string;
  /** 正文墨色 */
  ink: string;
  /** 次要文字（墨色的淡版） */
  inkSoft: string;
  rice: string;
  oat: string;
  tea: string;
  bamboo: string;
  /** 印泥：取主题印色与朱砂的折中 */
  cinnabar: string;
  /** 窗光（暖） */
  light: string;
  dark: boolean;
};

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}
const toHex = (c: readonly number[]) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;

/** 两色混合（t=0 取 a） */
export function mixHex(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return toHex(ca.map((v, i) => v + (cb[i] - v) * t));
}

/** hex + 透明度 → rgba() */
export function rgba(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

export function fxPalette(themeKey?: PaperThemeKey): FxPalette {
  const t = PAPER_THEMES[themeKey ?? "classic"] ?? PAPER_THEMES.classic;
  const dark = t.id === "dark";
  return {
    paper: t.paper,
    paperDeep: t.paperDeep,
    ink: t.ink,
    inkSoft: mixHex(t.ink, t.paper, 0.38),
    rice: dark ? mixHex(XIAOZHENG.rice, t.paper, 0.15) : mixHex(XIAOZHENG.rice, t.paper, 0.5),
    oat: dark ? mixHex(XIAOZHENG.oat, t.paper, 0.2) : XIAOZHENG.oat,
    tea: dark ? mixHex(XIAOZHENG.tea, "#ffffff", 0.25) : XIAOZHENG.tea,
    bamboo: dark ? mixHex(XIAOZHENG.bamboo, "#ffffff", 0.2) : XIAOZHENG.bamboo,
    cinnabar: mixHex(XIAOZHENG.cinnabar, t.seal, 0.35),
    light: dark ? "#d9b27a" : "#ffd9a0",
    dark,
  };
}
