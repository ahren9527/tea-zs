#!/usr/bin/env node
/**
 * 新建一期：复制上一期的 kit/（本期共用的物件、计时、动效入口），清空口播分段与时间表，写好期标题。
 *
 *   npm run new:episode -- 23 "白茶能不能放冰箱"
 *   npm run new:episode -- 23 "标题" --from 22     # 指定从哪一期复制 kit（默认最新一期）
 *
 * 之后：把定稿按口播顺序拆段写进 kit/vo-segments.json（节拍段 key 写 b1/b2…，即梦镜头与纯口播写 "-"），
 *       npm run vo:estimate -- 23，再逐拍 npm run new:clip -- 23 B1 开门大字。
 * 每期一个分支 epNN：git switch -c ep23
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, episodeDir, listEpisodes, segmentsPath, timesPath, writeJson } from "./lib/episode.mjs";

function usage(msg) {
  if (msg) console.error(`✖ ${msg}\n`);
  console.error('用法：npm run new:episode -- <期数> "<本期标题>" [--from <期数>]');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help")) usage();
const fromIdx = args.indexOf("--from");
let from;
if (fromIdx >= 0) {
  from = Number(args[fromIdx + 1]);
  args.splice(fromIdx, 2);
}
const [nRaw, ...titleParts] = args;
const n = Number(nRaw);
const title = titleParts.join(" ").trim();
if (!Number.isInteger(n) || n <= 0) usage("期数要是正整数，例如 23");
if (!title) usage("缺少本期标题");

const dir = episodeDir(n);
if (existsSync(dir)) usage(`${relative(ROOT, dir)} 已存在`);
const prev = listEpisodes().filter((x) => x < n);
from = from ?? prev[prev.length - 1];
if (!from || !existsSync(join(episodeDir(from), "kit"))) usage(`找不到可复制的 kit（--from ${from ?? "?"}）`);

// 1) 复制 kit，把注释里的期号与录音文件名换成本期
mkdirSync(dir, { recursive: true });
const kitSrc = join(episodeDir(from), "kit");
const kitDst = join(dir, "kit");
cpSync(kitSrc, kitDst, { recursive: true });
for (const f of readdirSync(kitDst)) {
  if (!/\.(ts|tsx)$/.test(f)) continue;
  const p = join(kitDst, f);
  const src = readFileSync(p, "utf8")
    .replaceAll(`第 ${from} 期`, `第 ${n} 期`)
    .replaceAll(`第${from}期`, `第${n}期`)
    .replaceAll(`ep${from}.mp3`, `ep${n}.mp3`);
  writeFileSync(p, src);
}

// 2) 口播：分段清空，时间表清空（new:clip 会逐拍补估算，录音后 align-vo.py 整体覆盖）
writeJson(segmentsPath(n), []);
writeJson(timesPath(n), {});

// 3) 期标题
writeFileSync(
  join(dir, "episode.ts"),
  `import { defineEpisode } from "@/remotion/shared/define-clip";\n\nexport default defineEpisode({ title: ${JSON.stringify(title)} });\n`,
);

console.log(`✔ 已创建 ${relative(ROOT, dir)}/（kit 复制自第 ${from} 期）`);
console.log(`  下一步：`);
console.log(`  1. git switch -c ep${n}`);
console.log(`  2. 把定稿按口播顺序拆段写进 ${relative(ROOT, segmentsPath(n))}`);
console.log(`     [{"key":"-","text":"即梦镜头/纯口播的段落"},{"key":"b1","text":"这一拍的口播原文"}, …]`);
console.log(`  3. npm run vo:estimate -- ${n}        # 录音前按 3.6 字/秒估算时间点`);
console.log(`  4. npm run new:clip -- ${n} B1 标题    # 逐拍建文件夹，SCRIPT 自动取自 vo-segments`);
console.log(`  5. kit/objects.ts 里换成本期产品的茶饼 / 茶盒；用不到的旧物件可以删`);
