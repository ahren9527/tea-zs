import type { ListItem, TemplateContent } from "../schema";

/** 读文本字段（去首尾空格） */
export function s(c: TemplateContent, key: string): string {
  const v = c[key];
  return typeof v === "string" ? v.trim() : v == null || typeof v === "object" ? "" : String(v);
}

export function n(c: TemplateContent, key: string, fallback = 0): number {
  const v = Number(c[key]);
  return Number.isFinite(v) ? v : fallback;
}

export function b(c: TemplateContent, key: string): boolean {
  return c[key] === true;
}

/** 读列表字段；第一个子字段为空的条目自动忽略 */
export function items(c: TemplateContent, key: string, firstKey?: string): ListItem[] {
  const v = c[key];
  if (!Array.isArray(v)) return [];
  return (v as ListItem[]).filter((it) => {
    const k = firstKey ?? Object.keys(it)[0];
    return k ? String(it[k] ?? "").trim() !== "" : false;
  });
}

const CN = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
export function cnNum(i: number) {
  return CN[i] ?? String(i + 1);
}
