#!/usr/bin/env node
/**
 * 每期自检（静态检查，不跑浏览器）：
 *
 *   npm run check:ep -- 23     # 查一期
 *   npm run check:ep           # 查所有期
 *
 * ✖ 错误（必须修）：结构不对、id/编号不合规、SCRIPT 与口播分段不一致、缺时间表、用了 Math.random() …
 * ⚠ 提醒（自己判断）：录音文件还没放、时间表文字与 SCRIPT 不一致（估算/对齐过时）、单个字段超 12 字、疑似功效用语 …
 * 画面构图、同屏字数、音效间隔这些要看帧，仍按 docs/交接说明.md 第 7 节人工验收。
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ROOT,
  episodeDir,
  listBeats,
  listEpisodes,
  readJson,
  readScript,
  readVoKey,
  segmentsPath,
  spokenChars,
  timesPath,
} from "./lib/episode.mjs";

/** 不神化功效：画面文字里出现这些词就提醒 */
const CLAIM_WORDS = /治疗|治病|疗效|药效|降血[压糖脂]|抗癌|防癌|消炎|排毒|减肥|养生功效|包治/;

const textKeys = (dataTs) => {
  const m = /export const TEXT\s*=\s*\{([\s\S]*?)\n\};/.exec(dataTs);
  if (!m) return null;
  const out = {};
  for (const x of m[1].matchAll(/^\s*["']?([\w$]+)["']?\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)/gm)) {
    const raw = x[2];
    out[x[1]] = raw.startsWith('"') ? JSON.parse(raw) : raw.slice(1, -1);
  }
  return out;
};
const fieldKeys = (indexTs) => {
  const m = /fields:\s*\[([\s\S]*?)\]\s*,?\s*\n\s*\}\);/.exec(indexTs) ?? /fields:\s*\[([\s\S]*?)\]/.exec(indexTs);
  return m ? [...m[1].matchAll(/key:\s*["'`]([^"'`]+)["'`]/g)].map((x) => x[1]) : [];
};
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
  );

export function checkEpisode(n, seenIds = new Map()) {
  const errors = [];
  const warnings = [];
  const dir = episodeDir(n);
  const rel = (p) => relative(ROOT, p);
  if (!existsSync(join(dir, "episode.ts"))) errors.push(`缺 ${rel(join(dir, "episode.ts"))}（本期标题）`);
  const kit = join(dir, "kit");
  if (!existsSync(kit)) errors.push(`缺 ${rel(kit)}/`);
  else if (existsSync(join(kit, "index.ts"))) errors.push(`${rel(kit)}/ 里不能有 index.ts（否则面板会把它当节拍）`);

  const segments = readJson(segmentsPath(n), null);
  const times = readJson(timesPath(n), null);
  if (!segments) errors.push(`缺 ${rel(segmentsPath(n))}`);
  if (!times) errors.push(`缺 ${rel(timesPath(n))}`);
  const segKeys = (segments ?? []).map((s) => s.key).filter((k) => k !== "-");
  const dupSeg = segKeys.filter((k, i) => segKeys.indexOf(k) !== i);
  if (dupSeg.length) errors.push(`vo-segments.json 里 key 重复：${[...new Set(dupSeg)].join(", ")}`);

  // 整期不允许 Math.random（预览 ≠ 导出）
  if (existsSync(dir))
    for (const f of walk(dir).filter((p) => /\.(ts|tsx)$/.test(p)))
      if (/Math\.random\s*\(/.test(readFileSync(f, "utf8"))) errors.push(`${rel(f)} 用了 Math.random()：改用 hash01 / rng / noise`);

  const beats = listBeats(n);
  if (!beats.length) warnings.push("还没有任何节拍");
  const usedKeys = new Set();
  for (const b of beats) {
    const bdir = join(dir, b);
    const where = `${b}/`;
    const indexTs = readFileSync(join(bdir, "index.ts"), "utf8");
    const dataPath = join(bdir, "data.ts");
    const dataTs = existsSync(dataPath) ? readFileSync(dataPath, "utf8") : "";
    for (const f of ["data.ts", "draw.ts", "Comp.tsx"])
      if (!existsSync(join(bdir, f))) errors.push(`${where} 缺 ${f}`);

    const id = /\bid:\s*["'`]([^"'`]+)["'`]/.exec(indexTs)?.[1];
    const code = /\bcode:\s*["'`]([^"'`]+)["'`]/.exec(indexTs)?.[1];
    const epNum = Number(/\bepisode:\s*(\d+)/.exec(indexTs)?.[1]);
    const exportName = /\bexportName:\s*["'`]([^"'`]+)["'`]/.exec(indexTs)?.[1];
    if (!code || !/^B\d+(-\d+)?$/.test(code)) errors.push(`${where} code「${code}」要写成 B3、B4-1`);
    if (id !== `ep${n}-${(code ?? "").toLowerCase()}`) errors.push(`${where} id「${id}」应为 ep${n}-${(code ?? "?").toLowerCase()}`);
    if (epNum !== n) errors.push(`${where} episode 写的是 ${epNum}，应为 ${n}`);
    if (!exportName || !exportName.startsWith(`正上茶舍_${n}_${code}_`) || !exportName.endsWith(".mp4"))
      errors.push(`${where} exportName「${exportName}」应为 正上茶舍_${n}_${code}_标题.mp4`);
    if (id) {
      if (seenIds.has(id)) errors.push(`${where} id ${id} 与 ${seenIds.get(id)} 重复`);
      seenIds.set(id, `ep${n}/${b}`);
    }
    if (/refVo:\s*\{\s*src:\s*["'`]tea\/vo\/ep(\d+)\.mp3/.exec(indexTs)?.[1] !== String(n) && /refVo:/.test(indexTs))
      errors.push(`${where} refVo 应指向 tea/vo/ep${n}.mp3`);

    // 口播：SCRIPT ⇄ vo-segments ⇄ vo-times
    const script = readScript(dataTs);
    const key = readVoKey(dataTs);
    if (!script) errors.push(`${where} data.ts 没有 export const SCRIPT`);
    if (!key) errors.push(`${where} data.ts 没有 makeVoAtFromTimes("key", …)`);
    if (script && key) {
      usedKeys.add(key);
      const seg = (segments ?? []).find((s) => s.key === key);
      if (!seg) errors.push(`${where} vo-segments.json 里没有 key「${key}」`);
      else if (seg.text !== script) errors.push(`${where} SCRIPT 与 vo-segments.json「${key}」不一致（必须与定稿一字不差）`);
      const rec = times?.[key];
      if (!rec) errors.push(`${where} vo-times.json 里没有「${key}」：npm run vo:estimate -- ${n}（录音后跑 align-vo.py）`);
      else if (rec.chars !== spokenChars(script))
        warnings.push(`${where} vo-times.json「${key}」的文字与 SCRIPT 不一致：估算重跑 vo:estimate --all，或录音重新对齐`);
    }

    // 文案：TEXT ⇄ fields
    const text = textKeys(dataTs);
    const fields = fieldKeys(indexTs);
    if (text) {
      for (const k of fields) if (!(k in text)) errors.push(`${where} fields 里的「${k}」在 TEXT 里没有`);
      for (const k of Object.keys(text)) if (!fields.includes(k)) warnings.push(`${where} TEXT.${k} 没登记到 fields，面板改不到`);
      for (const [k, v] of Object.entries(text)) {
        const len = Array.from(v.replace(/[\s·]/g, "")).length;
        if (len > 12) warnings.push(`${where} TEXT.${k}「${v}」${len} 字，超过同屏 12 字`);
        if (CLAIM_WORDS.test(v)) warnings.push(`${where} TEXT.${k}「${v}」疑似功效用语（不神化功效）`);
      }
    }
  }
  for (const k of segKeys) if (!usedKeys.has(k)) warnings.push(`vo-segments.json 的「${k}」还没有对应节拍（即梦镜头/纯口播请把 key 写成 "-"）`);
  if (beats.length && !existsSync(join(ROOT, `public/tea/vo/ep${n}.mp3`)))
    warnings.push(`还没有 public/tea/vo/ep${n}.mp3（参考口播；收到录音后放进来并对齐）`);
  return { errors, warnings };
}

export function checkAll(eps = listEpisodes()) {
  const seen = new Map();
  return eps.map((n) => ({ n, ...checkEpisode(n, seen) }));
}

// ---- CLI ----
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = process.argv.slice(2).find((a) => /^\d+$/.test(a));
  const eps = arg ? [Number(arg)] : listEpisodes();
  if (arg && !existsSync(episodeDir(Number(arg)))) {
    console.error(`✖ 没有第 ${arg} 期`);
    process.exit(1);
  }
  let bad = 0;
  for (const { n, errors, warnings } of checkAll(eps)) {
    console.log(`\n第 ${n} 期：${errors.length ? `✖ ${errors.length} 个错误` : "✔ 结构正常"}${warnings.length ? ` · ⚠ ${warnings.length} 个提醒` : ""}`);
    for (const e of errors) console.log(`  ✖ ${e}`);
    for (const w of warnings) console.log(`  ⚠ ${w}`);
    bad += errors.length;
  }
  console.log(bad ? `\n有 ${bad} 个错误要修。` : "\n全部通过。构图、同屏字数、音效间隔仍按 docs/交接说明.md 第 7 节看帧验收。");
  process.exit(bad ? 1 : 0);
}
