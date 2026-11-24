/**
 * 每期工作流脚本共用的小工具（Node 原生，无依赖）。
 * 目录约定：src/remotion/epNN/{episode.ts, kit/, bX/}，kit/vo-segments.json 是整条口播定稿，
 * kit/vo-times.json 是每个节拍每个字的开口时刻（录音前估算，录音后 align-vo.py 对齐）。
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const REMOTION = join(ROOT, "src/remotion");

/** 录音前估算用的语速（字/秒）。ep20–22 实测马老师每拍 3.0–4.0，平均约 3.6 */
export const ESTIMATE_CPS = 3.6;
/** 估算时段落之间留的换气（秒） */
export const ESTIMATE_GAP_SEC = 0.6;

/** 与 align-vo.py 的 ok() 一致：只保留汉字、数字、字母 */
export const spokenChars = (text) => Array.from(text).filter((c) => /[\u4e00-\u9fff0-9A-Za-z]/.test(c)).join("");

export function episodeDir(n) {
  return join(REMOTION, `ep${n}`);
}

/** 现有的期号（升序） */
export function listEpisodes() {
  if (!existsSync(REMOTION)) return [];
  return readdirSync(REMOTION)
    .map((d) => /^ep(\d+)$/.exec(d))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

/** 某期的节拍文件夹（有 index.ts 的子目录；kit/ 没有 index.ts，不算） */
export function listBeats(n) {
  const dir = episodeDir(n);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, "index.ts")))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

export function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, data, pretty = true) {
  writeFileSync(path, JSON.stringify(data, null, pretty ? 2 : 0) + "\n");
}

export const segmentsPath = (n) => join(episodeDir(n), "kit/vo-segments.json");
export const timesPath = (n) => join(episodeDir(n), "kit/vo-times.json");
export const voAudioPath = (n) => join(ROOT, `public/tea/vo/ep${n}.mp3`);

/**
 * 按估算语速给口播分段排时间（与 align-vo.py 输出同一格式），key 为 "-" 的段落占时间但不输出。
 * keep：已有的条目原样保留（只给新段落补估算），用于录音前逐拍新建。
 */
export function estimateTimes(segments, { cps = ESTIMATE_CPS, gap = ESTIMATE_GAP_SEC, keep = {} } = {}) {
  const out = {};
  let t = 0.5;
  for (const seg of segments) {
    const chars = spokenChars(seg.text);
    const times = Array.from(chars, (_, i) => Math.round((t + i / cps) * 1000) / 1000);
    if (seg.key !== "-") out[seg.key] = keep[seg.key] ?? { script: seg.text, chars, times };
    t += chars.length / cps + gap;
  }
  return out;
}

/** 从 data.ts 里读 SCRIPT 字符串（支持 "…" 与 `…`，以及多段 + 拼接） */
export function readScript(dataTs) {
  const m = /export const SCRIPT\s*=\s*([\s\S]*?);\s*\n/.exec(dataTs);
  if (!m) return undefined;
  const parts = [...m[1].matchAll(/"((?:[^"\\]|\\.)*)"|`([^`]*)`/g)].map((x) =>
    x[1] !== undefined ? JSON.parse(`"${x[1]}"`) : x[2],
  );
  return parts.length ? parts.join("") : undefined;
}

/** data.ts 里 makeVoAtFromTimes("b3", …) 的 key */
export function readVoKey(dataTs) {
  return /makeVoAtFromTimes\(\s*["'`]([^"'`]+)["'`]/.exec(dataTs)?.[1];
}
