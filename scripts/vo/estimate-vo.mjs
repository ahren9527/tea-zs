#!/usr/bin/env node
/**
 * 录音前：按估算语速给 kit/vo-segments.json 排时间，写 kit/vo-times.json（与 align-vo.py 同一格式）。
 *
 *   npm run vo:estimate -- 23            # 只给还没有时间的节拍补估算，已有的不动
 *   npm run vo:estimate -- 23 --all      # 全部重新估算（改过分段文字后用）
 *   npm run vo:estimate -- 23 --cps 3.4  # 换估算语速
 *
 * 录音到了以后不要再用它：改跑 scripts/vo/align-vo.py（见 docs/交接说明.md 第 5 节），
 * 所以 public/tea/vo/epNN.mp3 已存在时会拒绝 --all，除非加 --force。
 */
import { existsSync } from "node:fs";
import { relative } from "node:path";
import {
  ESTIMATE_CPS,
  ROOT,
  episodeDir,
  estimateTimes,
  readJson,
  segmentsPath,
  timesPath,
  voAudioPath,
  writeJson,
} from "../lib/episode.mjs";

const args = process.argv.slice(2);
const flag = (k) => args.includes(`--${k}`);
const opt = (k) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const n = Number(args.find((a) => /^\d+$/.test(a)));
if (!Number.isInteger(n) || n <= 0) {
  console.error("用法：npm run vo:estimate -- <期数> [--all] [--cps 3.6] [--force]");
  process.exit(1);
}
if (!existsSync(episodeDir(n))) {
  console.error(`✖ 没有第 ${n} 期（先 npm run new:episode）`);
  process.exit(1);
}
const segments = readJson(segmentsPath(n), []);
if (!segments.length) {
  console.error(`✖ ${relative(ROOT, segmentsPath(n))} 是空的：先把定稿按口播顺序拆段写进去`);
  process.exit(1);
}
const bad = segments.filter((s) => !s || typeof s.key !== "string" || typeof s.text !== "string" || !s.text.trim());
if (bad.length) {
  console.error("✖ 每一段都要有 key 和 text：", bad);
  process.exit(1);
}
const keys = segments.map((s) => s.key).filter((k) => k !== "-");
const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
if (dup.length) {
  console.error(`✖ 分段 key 重复：${[...new Set(dup)].join(", ")}`);
  process.exit(1);
}

const all = flag("all");
if (all && existsSync(voAudioPath(n)) && !flag("force")) {
  console.error(`✖ 已有录音 ${relative(ROOT, voAudioPath(n))}：请用 align-vo.py 对齐；确实要覆盖成估算值加 --force`);
  process.exit(1);
}
const cps = Number(opt("cps") ?? ESTIMATE_CPS);
const prev = readJson(timesPath(n), {});
const next = estimateTimes(segments, { cps, keep: all ? {} : prev });
writeJson(timesPath(n), next, false);

const added = Object.keys(next).filter((k) => !(k in prev) || all);
const dropped = Object.keys(prev).filter((k) => !(k in next));
console.log(`✔ ${relative(ROOT, timesPath(n))}：${Object.keys(next).length} 拍（${all ? "全部重估" : `新估 ${added.length} 拍`}，${cps} 字/秒）`);
if (dropped.length) console.log(`  已移除分段里没有的：${dropped.join(", ")}`);
