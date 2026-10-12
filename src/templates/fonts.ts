import type { TemplateContent } from "./schema";

/** 模板正文字体：完整霞鹜文楷（CDN 分片）→ 本地子集 → 思源宋体 */
export const TPL_FONT = '"ZS WenKai", "LXGW WenKai", "Noto Serif SC", "Songti SC", serif';
export const TPL_FONT_SONG = '"Noto Serif SC", "Songti SC", "Source Han Serif SC", serif';

const EXTRA = "0123456789%ABCD✔✖·、，。：？！「」（）一二三四五六七八九十正上茶舍";

export function collectText(content: TemplateContent): string {
  const parts: string[] = [];
  for (const v of Object.values(content)) {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) for (const it of v) parts.push(...Object.values(it));
  }
  return Array.from(new Set(Array.from(parts.join("") + EXTRA))).join("");
}

const loaded = new Set<string>();

/**
 * 按需加载这一页文字用到的字体分片。canvas 不会自动触发 unicode-range 分片下载，
 * 所以预览和导出前都要先调用；网络不通时最多等 4 秒，之后用本地字体兜底。
 */
export async function ensureFonts(text: string): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const chars = Array.from(text).filter((c) => !loaded.has(c));
  if (!chars.length) return;
  const sample = chars.join("");
  const jobs = [
    '400 64px "ZS WenKai"',
    '700 64px "ZS WenKai"',
    '700 64px "Noto Serif SC"',
    '800 64px "Noto Serif SC"',
    '900 64px "Noto Serif SC"',
  ].map((f) => document.fonts.load(f, sample).catch(() => []));
  await Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 4000))]);
  chars.forEach((c) => loaded.add(c));
}
