/**
 * 结构化脚本 → 一期的原始数据（再交给 normalizeEpisode 规整）。
 * 纯函数、零运行时依赖，Node 测试可直接 import。
 *
 * 格式（一个分镜一块，用 "## " 开头）：
 *
 *   # 第20期 · 白茶能不能煮
 *
 *   ## B1 开门大字 | 破题
 *   误区大字: 越放越香
 *   印章: 毁茶
 *   时长: 10
 *
 *   ## 法则卡片
 *   标题: 存茶三法则
 *   法则卡:
 *   - 干 | 干不干 | 潮气是第一大敌 | 潮气
 *   - 封 | 封没封严
 *
 * 字段名写面板上的中文标签（括号里的提示可省略）或字段 key 都行；
 * 列表项一行一个，用 | 分隔子字段；也可以写成「法则卡: 干不干 / 封没封严 / 有没有怪味」。
 */
import type { FieldDef, ListField, TemplateMeta } from "./schema";

export type ParseOptions = {
  findTemplate: (name: string) => TemplateMeta | undefined;
  /** 把「潮气」「damp」之类解析成图标 key；不传则原样保留 */
  iconOf?: (name: string) => string | undefined;
};

export type ParsedScript = {
  number?: number;
  title?: string;
  beats: { template: string; code: string; title: string; content: Record<string, unknown>; timing: Record<string, number>; exportName?: string; note?: string }[];
  warnings: string[];
};

const strip = (s: string) =>
  s
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

function matchField(fields: FieldDef[], name: string): FieldDef | undefined {
  const q = strip(name);
  if (!q) return undefined;
  return (
    fields.find((f) => f.key.toLowerCase() === q) ??
    fields.find((f) => strip(f.label) === q) ??
    fields.find((f) => strip(f.label).startsWith(q) || q.startsWith(strip(f.label)))
  );
}

const TIMING_KEYS: Record<string, "durationSec" | "pace" | "holdSec"> = {
  时长: "durationSec",
  口播时长: "durationSec",
  duration: "durationSec",
  节奏: "pace",
  pace: "pace",
  停留: "holdSec",
  结尾停留: "holdSec",
  hold: "holdSec",
};

const SPLIT_ITEM = /\s*[|｜]\s*/;
const SPLIT_INLINE = /\s*[/／、]\s*/;

function listItem(f: ListField, raw: string, opts: ParseOptions): Record<string, string> {
  const parts = raw.split(SPLIT_ITEM);
  const item: Record<string, string> = {};
  f.itemFields.forEach((sf, i) => {
    let v = (parts[i] ?? "").trim();
    if (sf.type === "icon" && v) v = opts.iconOf?.(v) ?? v;
    item[sf.key] = v;
  });
  // 只写了主文案、第一个子字段是短印字（如「干」）时，自动把主文案的首字当印字
  if (parts.length === 1 && f.itemFields[0]?.type === "stamp" && f.itemFields[1]) {
    item[f.itemFields[1].key] = raw.trim();
    item[f.itemFields[0].key] = Array.from(raw.trim())[0] ?? "";
  }
  return item;
}

export function parseScript(text: string, opts: ParseOptions): ParsedScript {
  const out: ParsedScript = { beats: [], warnings: [] };
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let cur: { meta: TemplateMeta; beat: ParsedScript["beats"][number] } | null = null;
  let skipping = false;
  let openList: ListField | null = null;

  const headRe = /^#\s*(?:第\s*(\d+)\s*期)?\s*[·・\-—:：]?\s*(.*)$/;
  lines.forEach((rawLine, ln) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("//")) return;

    if (/^##\s*/.test(line)) {
      openList = null;
      const head = line.replace(/^##\s*/, "");
      const [left, titlePart] = head.split(SPLIT_ITEM);
      const m = left.match(/^(B[\w\-′']*)\s+(.+)$/i);
      const code = m ? m[1].toUpperCase() : `B${out.beats.length + 1}`;
      const tplName = (m ? m[2] : left).trim();
      const meta = opts.findTemplate(tplName);
      if (!meta) {
        out.warnings.push(`第 ${ln + 1} 行：找不到模板「${tplName}」，这一块已跳过`);
        cur = null;
        skipping = true;
        return;
      }
      skipping = false;
      const beat = { template: meta.id, code, title: (titlePart ?? "").trim() || meta.name.split(" · ")[0], content: {} as Record<string, unknown>, timing: {} as Record<string, number> };
      out.beats.push(beat);
      cur = { meta, beat };
      return;
    }
    if (/^#\s*/.test(line) && !cur) {
      const m = line.match(headRe);
      if (m) {
        if (m[1]) out.number = Number(m[1]);
        if (m[2]?.trim()) out.title = m[2].trim();
      }
      return;
    }
    if (skipping) return;
    if (!cur) {
      // 头部的「期数: 20」「标题: xxx」
      const kv = line.match(/^([^:：]+)[:：]\s*(.*)$/);
      if (kv) {
        const k = strip(kv[1]);
        if (k === "期数" || k === "number") out.number = Number(kv[2].replace(/\D/g, "")) || out.number;
        else if (k === "标题" || k === "title" || k === "本期标题") out.title = kv[2].trim();
      }
      return;
    }
    const { meta, beat } = cur;
    const bullet = line.match(/^[-·•*]\s*(.+)$/);
    if (bullet && openList) {
      const arr = (beat.content[openList.key] as Record<string, string>[] | undefined) ?? [];
      arr.push(listItem(openList, bullet[1], opts));
      beat.content[openList.key] = arr;
      return;
    }
    const kv = line.match(/^([^:：]+)[:：]\s*(.*)$/);
    if (!kv) {
      out.warnings.push(`第 ${ln + 1} 行：看不懂「${line}」，已忽略`);
      return;
    }
    const name = kv[1].trim();
    const value = kv[2].trim();
    const tk = TIMING_KEYS[strip(name)];
    if (tk) {
      const n = Number(value.replace(/[^\d.]/g, ""));
      if (Number.isFinite(n) && n > 0) beat.timing[tk] = n;
      openList = null;
      return;
    }
    const sk = strip(name);
    if (sk === "导出名" || sk === "文件名" || sk === "exportname") {
      beat.exportName = value;
      return;
    }
    if (sk === "备注" || sk === "口播" || sk === "note") {
      beat.note = value;
      return;
    }
    if (sk === "分镜标题" || sk === "片段标题") {
      beat.title = value;
      return;
    }
    const f = matchField(meta.fields, name);
    if (!f) {
      out.warnings.push(`第 ${ln + 1} 行：模板「${meta.name}」没有字段「${name}」`);
      openList = null;
      return;
    }
    if (f.type === "list") {
      openList = f;
      beat.content[f.key] = value ? value.split(SPLIT_INLINE).filter(Boolean).map((v) => listItem(f, v, opts)) : [];
      return;
    }
    openList = null;
    if (f.type === "icon") beat.content[f.key] = opts.iconOf?.(value) ?? value;
    else if (f.type === "number") beat.content[f.key] = Number(value.replace(/[^\d.-]/g, ""));
    else if (f.type === "toggle") beat.content[f.key] = /^(是|开|有|true|yes|1|显示)$/i.test(value);
    else beat.content[f.key] = value.replace(/\\n/g, "\n");
  });
  return out;
}

/** 把一期导出成可读脚本（与 parseScript 互逆，方便「先导出改字再粘回来」） */
export function episodeToScript(
  ep: { number: number; title: string; beats: { template: string; code: string; title: string; content: Record<string, unknown>; timing: { durationSec?: number } }[] },
  metaOf: (id: string) => TemplateMeta | undefined,
  iconLabel?: (key: string) => string,
): string {
  const out: string[] = [`# 第${ep.number}期 · ${ep.title}`, ""];
  for (const b of ep.beats) {
    const meta = metaOf(b.template);
    if (!meta) continue;
    out.push(`## ${b.code} ${meta.name} | ${b.title}`);
    for (const f of meta.fields) {
      const v = b.content[f.key];
      if (f.type === "list") {
        out.push(`${f.label}:`);
        for (const it of (v as Record<string, string>[]) ?? []) {
          out.push(`- ${f.itemFields.map((sf) => (sf.type === "icon" && iconLabel ? iconLabel(it[sf.key] ?? "") : (it[sf.key] ?? ""))).join(" | ")}`);
        }
      } else if (f.type === "icon") {
        out.push(`${f.label}: ${iconLabel ? iconLabel(String(v ?? "")) : String(v ?? "")}`);
      } else if (f.type === "toggle") {
        out.push(`${f.label}: ${v ? "是" : "否"}`);
      } else if (f.type === "select") {
        out.push(`${f.label}: ${f.options.find((o) => o.value === v)?.label ?? String(v ?? "")}`);
      } else {
        out.push(`${f.label}: ${String(v ?? "").replace(/\n/g, "\\n")}`);
      }
    }
    if (b.timing.durationSec) out.push(`时长: ${b.timing.durationSec}`);
    out.push("");
  }
  return out.join("\n");
}
