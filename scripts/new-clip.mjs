#!/usr/bin/env node
/**
 * 新建一个节拍（kit 写法：只写 draw.ts，Comp.tsx 一行调用它，预览 = 导出）：
 *
 *   npm run new:clip -- 23 B1 开门大字
 *   npm run new:clip -- 23 B4-1 避光密封 --slug b4-1
 *   npm run new:clip -- 23 B9 收尾 --script "这一拍的口播原文"   # vo-segments 里还没有这一段时，追加到末尾
 *
 * 生成 src/remotion/ep23/<slug>/{data.ts, draw.ts, Comp.tsx, index.ts}，面板自动发现，不用登记。
 * SCRIPT 取自 kit/vo-segments.json 里 key = slug 的那一段（必须与定稿一字不差）；
 * kit/vo-times.json 里没有这一拍时，按估算语速补上（录音后 align-vo.py 会整体覆盖）。
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
  ROOT,
  REMOTION,
  episodeDir,
  estimateTimes,
  readJson,
  segmentsPath,
  timesPath,
  voAudioPath,
  writeJson,
} from "./lib/episode.mjs";

function usage(msg) {
  if (msg) console.error(`✖ ${msg}\n`);
  console.error(
    [
      "用法：npm run new:clip -- <期数> <编号> <标题> [选项]",
      "  例：npm run new:clip -- 23 B3 茶叶受潮",
      "",
      "选项：",
      "  --slug <名>     文件夹名，也是 vo-segments 里的 key（默认用编号小写，如 b3）",
      "  --script <文>   这一拍的口播原文；vo-segments 里没有这一段时追加",
      "  --force         文件夹已存在时覆盖",
    ].join("\n"),
  );
  process.exit(1);
}

// ---- 参数 ----
const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help")) usage();
const opts = {};
const pos = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--force") opts.force = true;
  else if (a.startsWith("--")) {
    const val = args[i + 1];
    if (val === undefined || val.startsWith("--")) usage(`${a} 需要一个值`);
    opts[a.slice(2)] = val;
    i++;
  } else pos.push(a);
}
const [epRaw, codeRaw, ...titleParts] = pos;
const episode = Number(epRaw);
if (!Number.isInteger(episode) || episode <= 0) usage("期数要是正整数，例如 23");
if (!codeRaw) usage("缺少编号，例如 B3");
const code = codeRaw.toUpperCase();
if (!/^B[0-9]+(-[0-9]+)?$/.test(code)) usage(`编号「${codeRaw}」要写成 B3、B4-1 这样`);
const title = titleParts.join(" ").trim();
if (!title) usage("缺少标题，例如 茶叶受潮");
const slug = (opts.slug ?? code.toLowerCase()).replace(/[^a-z0-9-]/gi, "-").toLowerCase();

const epDir = episodeDir(episode);
if (!existsSync(join(epDir, "kit"))) usage(`第 ${episode} 期还没有 kit/：先 npm run new:episode -- ${episode} "本期标题"`);
const dir = join(epDir, slug);
const id = `ep${episode}-${code.toLowerCase()}`;
if (existsSync(dir) && !opts.force) usage(`${relative(ROOT, dir)} 已存在（加 --force 覆盖）`);

// id 不能和已有片段重复
for (const ep of readdirSync(REMOTION).filter((d) => /^ep\d+$/.test(d))) {
  for (const sub of readdirSync(join(REMOTION, ep), { withFileTypes: true })) {
    const f = join(REMOTION, ep, sub.name, "index.ts");
    if (!sub.isDirectory() || !existsSync(f) || f === join(dir, "index.ts")) continue;
    const m = /\bid:\s*["'`]([^"'`]+)["'`]/.exec(readFileSync(f, "utf8"));
    if (m?.[1] === id) usage(`片段 id ${id} 已被 ${relative(ROOT, f)} 使用，换个编号`);
  }
}

// ---- 口播：分段 + 时间表 ----
const segments = readJson(segmentsPath(episode), []);
let seg = segments.find((s) => s.key === slug);
if (!seg) {
  if (!opts.script) usage(`${relative(ROOT, segmentsPath(episode))} 里没有 key 为「${slug}」的段落：先写进去，或加 --script "口播原文"`);
  seg = { key: slug, text: opts.script.trim() };
  segments.push(seg);
  writeJson(segmentsPath(episode), segments);
  console.log(`✔ 已把这一拍追加到 vo-segments.json 末尾（顺序不对的话手动挪到正确位置，再 npm run vo:estimate -- ${episode} --all）`);
} else if (opts.script && opts.script.trim() !== seg.text) {
  usage(`--script 与 vo-segments.json 里「${slug}」的文字不一致，以定稿为准改其中一处`);
}
const times = readJson(timesPath(episode), {});
if (!times[slug]) {
  if (existsSync(voAudioPath(episode)))
    console.warn(`⚠ 已有录音但 vo-times.json 里没有「${slug}」：重跑 align-vo.py 对齐（先用估算值顶上）`);
  writeJson(timesPath(episode), estimateTimes(segments, { keep: times }), false);
}

// ---- 生成文件 ----
const esc = (s) => JSON.stringify(s);
const safeName = (s) => s.replace(/[\\/:*?"<>|\s·]+/g, "");
const exportName = `正上茶舍_${episode}_${code}_${safeName(title)}.mp4`;
const firstWord = Array.from(seg.text.replace(/[^\u4e00-\u9fff0-9A-Za-z]/g, "")).slice(0, 2).join("");

const files = {};
files["data.ts"] = `import { mg } from "@/remotion/shared/sfx-lib";
import { makeVoAtFromTimes } from "../kit/vo";

/**
 * 第 ${episode} 期 ${code}「${title}」
 * TODO：一句话写清这一拍的画面（什么物件、字在哪、跟着哪几个词出现）。
 */
export const SCRIPT = ${esc(seg.text)};

export const VO = makeVoAtFromTimes(${esc(slug)}, { script: SCRIPT });
export const voAt = VO.voAt;

/** 画面上的字（面板可改；同屏 ≤ 12 字） */
export const TEXT = {
  line: ${esc(title)},
};
export type TextKey = keyof typeof TEXT;

export const END_HOLD_SEC = 1.2;
export const LENGTH = VO.lengthOf(END_HOLD_SEC);
export const FILM_NOTE = VO.filmNote(END_HOLD_SEC);

// 时间点一律写成 voAt("词") ± 帧，提前 2–10 帧落定；不要写死秒数
export const LINE_AT = voAt(${esc(firstWord)}) - 4;

/** 只给主动作配音，间隔 ≥ 15 帧；品牌声 brandSignature() 只用于口诀落印和收尾金句 */
export function sfxHits(_staggerFrames: number) {
  return [mg("dingD5", LINE_AT + 2, { volume: 0.46 })];
}
`;
files["draw.ts"] = `/**
 * 第 ${episode} 期 ${code}「${title}」逐帧画布（1080×1920）。预览和导出都调用这一个 draw()。
 */
import { cameraAt, easeOutCubic, progress, type FxPalette } from "../kit/fx";
import { type AnimParams } from "@/remotion/shared/theme";
import { allTextsOf, beginFrame, inkText, KAI, renderLayers, textOf } from "../kit/draw-kit";
import { LENGTH, LINE_AT, TEXT, type TextKey } from "./data";

const t = (p: AnimParams, k: TextKey) => textOf(p, TEXT, k);

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const { frame, pal, fontScale } = beginFrame(ctx, elapsed, params);
  const cam = cameraAt(frame, LENGTH, { from: 1, to: 1.04, drift: 4 });
  renderLayers(ctx, frame, pal, cam, {
    leaves: 3,
    subject: (p) => drawSubject(ctx, frame, p, params, fontScale),
  });
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  frame: number,
  pal: FxPalette,
  params: AnimParams,
  fontScale: number,
) {
  // TODO 主体：用 kit/objects.ts 里的物件讲事（茶饼、茶盒、紫砂罐…），字出现时主体带回弹右让（字左物右）
  // 大字：口播说到时水墨显现；底部 300px 留给字幕（SAFE_BOTTOM）
  const p = easeOutCubic(progress(frame, LINE_AT, LINE_AT + 18));
  inkText(ctx, t(params, "line"), 540, 900, 132 * fontScale, p, 7, {
    color: pal.ink,
    font: KAI,
    weight: 700,
  });
}

/** 预览 / 导出前按需加载字体分片：本拍所有可能出现的字 */
export function allTexts(params?: AnimParams) {
  return allTextsOf(TEXT, params);
}
`;
files["Comp.tsx"] = `import { FxBeat } from "../kit/FxBeat";
import { sfxHits } from "./data";
import { allTexts, draw } from "./draw";

const HITS = sfxHits(0);

export function Comp() {
  return <FxBeat draw={draw} allTexts={allTexts} hits={HITS} />;
}
`;
files["index.ts"] = `import { defineClip } from "@/remotion/shared/define-clip";
import { ensureFonts } from "@/remotion/shared/fonts";
import { sec } from "../kit/draw-kit";
import { FILM_NOTE, LENGTH, LINE_AT, TEXT, VO, sfxHits } from "./data";
import { Comp } from "./Comp";
import { allTexts, draw } from "./draw";

export default defineClip({
  id: ${esc(id)},
  episode: ${episode},
  code: ${esc(code)},
  title: ${esc(title)},
  note: ${esc(`${title} · `)} + FILM_NOTE,
  exportName: ${esc(exportName)},
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  refVo: { src: ${esc(`tea/vo/ep${episode}.mp3`)}, startSec: VO.startSec },
  prepare: (params) => ensureFonts(allTexts(params)),
  // 时间轴上的关键帧标记
  markers: [{ frame: LINE_AT, timeSec: sec(LINE_AT), label: TEXT.line, tag: "大字", type: "punchline" }],
  // 面板右侧可改的文案：key 与 TEXT 一一对应
  fields: [{ key: "line", label: "大字", default: TEXT.line, placeholder: TEXT.line }],
});
`;

mkdirSync(dir, { recursive: true });
for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);

console.log(`✔ 已创建 ${relative(ROOT, dir)}/  (${Object.keys(files).join(", ")})`);
console.log(`  片段 id：${id}   导出名：${exportName}`);
console.log(`  下一步：在 draw.ts 里写这一拍的画面，时间点和文案放 data.ts；面板里选第 ${episode} 期就能预览。`);
console.log(`  写完跑 npm run check:ep -- ${episode}`);
