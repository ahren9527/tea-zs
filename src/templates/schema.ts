/**
 * 正上茶舍 · 模板与期数据结构（纯数据，无运行时依赖）
 *
 * 这个文件只放类型和纯函数，Node 测试可以直接 import（--experimental-strip-types）。
 * 不要在这里引入 React / Remotion / 画布代码，也不要使用 "@/..." 路径别名。
 */

export type PaperThemeId = "classic" | "song" | "ru_green" | "tea_tan" | "bamboo" | "dan_ochre" | "dark";

/** 单个字段值：文本 / 数字 / 开关 / 列表（列表项是若干文本字段） */
export type ListItem = Record<string, string>;
export type FieldValue = string | number | boolean | ListItem[];
export type TemplateContent = Record<string, FieldValue>;

export type BaseField = {
  key: string;
  label: string;
  /** 一句话提示，显示在输入框下方 */
  hint?: string;
  placeholder?: string;
  /** 文本建议最大字数（超出不会截断，画面会自动缩字/换行，只用于面板提醒） */
  maxLen?: number;
  /** 可选字段：留空就不出现在画面里 */
  optional?: boolean;
};

export type TextField = BaseField & { type: "text" | "textarea" | "stamp" };
export type IconField = BaseField & { type: "icon" };
export type SelectField = BaseField & { type: "select"; options: { value: string; label: string }[] };
export type NumberField = BaseField & { type: "number"; min: number; max: number; step?: number; unit?: string };
export type ToggleField = BaseField & { type: "toggle" };
export type ListField = BaseField & {
  type: "list";
  itemLabel: string;
  min: number;
  max: number;
  itemFields: (TextField | IconField | SelectField)[];
};

export type FieldDef = TextField | IconField | SelectField | NumberField | ToggleField | ListField;

export type BeatTiming = {
  /** 节奏倍率：>1 更快，<1 更慢 */
  pace: number;
  /** 最后定格停留秒数 */
  holdSec: number;
  /** 想要严格对齐口播时长时填写（秒）；填了会自动反算节奏 */
  durationSec?: number;
};

export const DEFAULT_TIMING: BeatTiming = { pace: 1, holdSec: 1.2 };

export type Beat = {
  id: string;
  /** 模板 id；"bespoke" 表示经典定制片段 */
  template: string;
  /** 分镜编号，如 B1 / B4-2 */
  code: string;
  /** 分镜标题（导出文件名会用到） */
  title: string;
  content: TemplateContent;
  timing: BeatTiming;
  /** 留空则自动生成：正上茶舍_{期数}_{编号}_{标题}.mp4 */
  exportName?: string;
  /** 单独换纸色；留空跟随整期 */
  theme?: PaperThemeId;
  /** 给剪辑/口播对照的备注，不进画面 */
  note?: string;
};

export type Episode = {
  id: string;
  /** 期数，如 20 */
  number: number;
  title: string;
  theme: PaperThemeId;
  fontScale: number;
  beats: Beat[];
  /** 经典定制期：内置，不可删字段结构 */
  classic?: boolean;
  updatedAt?: number;
};

/** 模板元信息（纯数据部分），脚本解析和表单都只依赖这一层 */
export type TemplateMeta = {
  id: string;
  name: string;
  category: string;
  desc: string;
  fields: FieldDef[];
  defaults: TemplateContent;
  /** 粘贴脚本时可识别的别名，如 "开门大字" "误区" */
  aliases?: string[];
};

export const EPISODE_FILE_VERSION = 1;

export type EpisodeFile = {
  kind: "zhengshang-episode";
  version: number;
  episode: Episode;
};

// ---------------------------------------------------------------------------
// 纯函数工具
// ---------------------------------------------------------------------------

let idCounter = 0;
export function makeId(prefix = "b"): string {
  idCounter = (idCounter + 1) % 1_000_000;
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${Date.now().toString(36)}${idCounter.toString(36)}${rand}`;
}

export function sanitizeFilePart(s: string): string {
  return s
    .replace(/[\\/:*?"<>|\s]+/g, "")
    .replace(/[·•]/g, "")
    .slice(0, 40);
}

export function defaultExportName(epNumber: number, beat: Pick<Beat, "code" | "title">): string {
  const code = sanitizeFilePart(beat.code || "B");
  const title = sanitizeFilePart(beat.title || "分镜");
  return `正上茶舍_${epNumber}_${code}_${title}.mp4`;
}

export function exportNameFor(ep: Pick<Episode, "number">, beat: Beat): string {
  const name = beat.exportName?.trim();
  if (name) return /\.(mp4|webm)$/i.test(name) ? name : `${name}.mp4`;
  return defaultExportName(ep.number, beat);
}

export function cloneContent(c: TemplateContent): TemplateContent {
  return JSON.parse(JSON.stringify(c)) as TemplateContent;
}

/** 用模板的字段定义把任意来源（JSON、脚本、旧版本）的 content 规整一遍 */
export function normalizeContent(meta: TemplateMeta, raw: unknown): TemplateContent {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: TemplateContent = {};
  for (const f of meta.fields) {
    const v = src[f.key];
    const d = meta.defaults[f.key];
    if (f.type === "list") {
      const fallback = Array.isArray(d) ? (d as ListItem[]) : [];
      let items: ListItem[] = Array.isArray(v)
        ? (v as unknown[]).map((it) => {
            if (typeof it === "string") return { [f.itemFields[0]?.key ?? "text"]: it };
            const o = it && typeof it === "object" ? (it as Record<string, unknown>) : {};
            const item: ListItem = {};
            for (const sf of f.itemFields) item[sf.key] = o[sf.key] == null ? "" : String(o[sf.key]);
            return item;
          })
        : fallback.map((x) => ({ ...x }));
      if (items.length > f.max) items = items.slice(0, f.max);
      while (items.length < f.min) {
        const seed = fallback[items.length] ?? fallback[fallback.length - 1] ?? {};
        items.push({ ...seed });
      }
      out[f.key] = items;
    } else if (f.type === "number") {
      const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
      const base = Number.isFinite(n) ? n : typeof d === "number" ? d : f.min;
      out[f.key] = Math.min(f.max, Math.max(f.min, base));
    } else if (f.type === "toggle") {
      out[f.key] = typeof v === "boolean" ? v : v === "true" || v === "是" ? true : v === "false" || v === "否" ? false : Boolean(d);
    } else if (f.type === "select") {
      const s = v == null ? "" : String(v);
      const ok = f.options.some((o) => o.value === s);
      out[f.key] = ok ? s : (f.options.find((o) => o.label === s)?.value ?? String(d ?? f.options[0]?.value ?? ""));
    } else {
      out[f.key] = v == null ? String(d ?? "") : String(v);
    }
  }
  return out;
}

export function normalizeTiming(raw: unknown): BeatTiming {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const pace = Number(o.pace);
  const hold = Number(o.holdSec);
  const dur = Number(o.durationSec);
  const t: BeatTiming = {
    pace: Number.isFinite(pace) && pace > 0 ? Math.min(3, Math.max(0.3, pace)) : DEFAULT_TIMING.pace,
    holdSec: Number.isFinite(hold) && hold >= 0 ? Math.min(10, hold) : DEFAULT_TIMING.holdSec,
  };
  if (Number.isFinite(dur) && dur > 0) t.durationSec = Math.min(120, Math.max(1, dur));
  return t;
}

const THEMES: PaperThemeId[] = ["classic", "song", "ru_green", "tea_tan", "bamboo", "dan_ochre", "dark"];

/**
 * 校验并规整一整期。metaOf 返回 undefined 的 beat 视为未知模板，会被丢弃并记入 warnings。
 * bespoke（经典定制）片段原样保留 content。
 */
export function normalizeEpisode(
  raw: unknown,
  metaOf: (id: string) => TemplateMeta | undefined,
): { episode: Episode; warnings: string[] } {
  const warnings: string[] = [];
  let src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  if (src.kind === "zhengshang-episode" && src.episode && typeof src.episode === "object") {
    src = src.episode as Record<string, unknown>;
  }
  const num = Number(src.number);
  const beatsRaw = Array.isArray(src.beats) ? (src.beats as unknown[]) : [];
  const beats: Beat[] = [];
  beatsRaw.forEach((b, i) => {
    const o = b && typeof b === "object" ? (b as Record<string, unknown>) : {};
    const tpl = String(o.template ?? "");
    const code = String(o.code ?? `B${i + 1}`);
    const title = String(o.title ?? "");
    const base = {
      id: typeof o.id === "string" && o.id ? o.id : makeId(),
      template: tpl,
      code,
      title,
      timing: normalizeTiming(o.timing),
      exportName: typeof o.exportName === "string" ? o.exportName : undefined,
      theme: THEMES.includes(o.theme as PaperThemeId) ? (o.theme as PaperThemeId) : undefined,
      note: typeof o.note === "string" ? o.note : undefined,
    };
    if (tpl === "bespoke") {
      const c = o.content && typeof o.content === "object" ? (o.content as TemplateContent) : {};
      beats.push({ ...base, content: { ...c } });
      return;
    }
    const meta = metaOf(tpl);
    if (!meta) {
      warnings.push(`第 ${i + 1} 个分镜的模板「${tpl || "空"}」不存在，已跳过`);
      return;
    }
    beats.push({ ...base, title: title || meta.name, content: normalizeContent(meta, o.content) });
  });
  // 去重 id
  const seen = new Set<string>();
  for (const b of beats) {
    if (seen.has(b.id)) b.id = makeId();
    seen.add(b.id);
  }
  const fs = Number(src.fontScale);
  const episode: Episode = {
    id: typeof src.id === "string" && src.id ? src.id : makeId("ep"),
    number: Number.isFinite(num) && num > 0 ? Math.round(num) : 1,
    title: String(src.title ?? "未命名一期"),
    theme: THEMES.includes(src.theme as PaperThemeId) ? (src.theme as PaperThemeId) : "classic",
    fontScale: Number.isFinite(fs) && fs > 0 ? Math.min(1.6, Math.max(0.6, fs)) : 1,
    beats,
    classic: src.classic === true ? true : undefined,
    updatedAt: Date.now(),
  };
  return { episode, warnings };
}

export function toEpisodeFile(ep: Episode): EpisodeFile {
  const { classic: _classic, updatedAt: _u, ...rest } = ep;
  return { kind: "zhengshang-episode", version: EPISODE_FILE_VERSION, episode: { ...rest } };
}

/** 复制一期：新 id、期数 +1、所有分镜 id 重新生成 */
export function duplicateEpisode(ep: Episode, opts: { number?: number; title?: string } = {}): Episode {
  return {
    ...ep,
    id: makeId("ep"),
    number: opts.number ?? ep.number + 1,
    title: opts.title ?? `${ep.title}（副本）`,
    classic: undefined,
    beats: ep.beats.map((b) => ({ ...b, id: makeId(), content: cloneContent(b.content), timing: { ...b.timing } })),
    updatedAt: Date.now(),
  };
}

/** 重新按顺序编号 B1..Bn（仅对形如 B数字 的编号生效，保留 B4-2 这类自定义编号） */
export function renumberBeats(beats: Beat[]): Beat[] {
  let n = 0;
  return beats.map((b) => {
    n += 1;
    if (/^B\d+$/.test(b.code) || !b.code) return { ...b, code: `B${n}` };
    return b;
  });
}
