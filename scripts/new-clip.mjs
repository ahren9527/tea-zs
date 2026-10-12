#!/usr/bin/env node
/**
 * 新建一个定制节拍片段：
 *   npm run new:clip -- <期数> <编号> <标题> [--slug 文件夹名] [--note 说明] [--seconds 4] [--episode-title 本期标题] [--from-template <模板id>]
 * 例：
 *   npm run new:clip -- 20 B3 茶叶受潮
 *   npm run new:clip -- 20 B1 开门大字 --from-template hook-stamp
 *
 * 生成 src/remotion/ep<期数>/<slug>/{data.ts,Comp.tsx,draw.ts,index.ts}（或 template.ts + index.ts），
 * 面板通过 import.meta.glob 自动发现，不需要改任何登记文件。
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REMOTION = join(ROOT, "src/remotion");
const LIBRARY = join(ROOT, "src/templates/library");

function usage(msg) {
  if (msg) console.error(`✖ ${msg}\n`);
  console.error(
    [
      "用法：npm run new:clip -- <期数> <编号> <标题> [选项]",
      "  例：npm run new:clip -- 20 B3 茶叶受潮",
      "",
      "选项：",
      "  --slug <名>            文件夹名（默认用编号，如 b3）",
      "  --note <说明>          面板里显示的一行说明",
      "  --seconds <秒>         片段时长（默认 4）",
      "  --episode-title <标题> 本期标题（只在 epNN/episode.ts 还不存在时写入）",
      "  --from-template <id>   复制一个模板当起手代码（" + listTemplates().join(" / ") + "）",
      "  --force                文件夹已存在时覆盖",
    ].join("\n"),
  );
  process.exit(1);
}

function listTemplates() {
  try {
    return readdirSync(LIBRARY)
      .filter((f) => f.endsWith(".ts"))
      .map((f) => f.replace(/\.ts$/, ""));
  } catch {
    return [];
  }
}

// ---- 参数 ----
const args = process.argv.slice(2);
const opts = {};
const pos = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--force") opts.force = true;
  else if (a.startsWith("--")) {
    const key = a.slice(2);
    const val = args[i + 1];
    if (val === undefined || val.startsWith("--")) usage(`${a} 需要一个值`);
    opts[key] = val;
    i++;
  } else pos.push(a);
}
if (args.includes("-h") || args.includes("--help")) usage();
const [epRaw, codeRaw, ...titleParts] = pos;
const episode = Number(epRaw);
if (!Number.isInteger(episode) || episode <= 0) usage("期数要是正整数，例如 20");
if (!codeRaw) usage("缺少编号，例如 B3");
const code = codeRaw.toUpperCase();
if (!/^[A-Z0-9][A-Z0-9-]*$/.test(code)) usage(`编号「${codeRaw}」只能用字母、数字和 -，例如 B3、B4-1`);
const title = titleParts.join(" ").trim();
if (!title) usage("缺少标题，例如 茶叶受潮");
const seconds = opts.seconds ? Number(opts.seconds) : 4;
if (!(seconds > 0 && seconds < 120)) usage("--seconds 要在 0~120 之间");
const slug = (opts.slug ?? code.toLowerCase()).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
const fromTemplate = opts["from-template"];
if (fromTemplate && !listTemplates().includes(fromTemplate)) usage(`没有模板「${fromTemplate}」。可选：${listTemplates().join(", ")}`);

const epDir = join(REMOTION, `ep${episode}`);
const dir = join(epDir, slug);
const id = `ep${episode}-${code.toLowerCase()}`;

// id 不能和已有片段重复
function existingIds() {
  const ids = new Map();
  for (const ep of readdirSync(REMOTION).filter((d) => /^ep\d+$/.test(d))) {
    for (const sub of readdirSync(join(REMOTION, ep), { withFileTypes: true })) {
      if (!sub.isDirectory()) continue;
      const f = join(REMOTION, ep, sub.name, "index.ts");
      if (!existsSync(f)) continue;
      const m = /\bid:\s*["'`]([^"'`]+)["'`]/.exec(readFileSync(f, "utf8"));
      if (m) ids.set(m[1], relative(ROOT, f));
    }
  }
  return ids;
}
const ids = existingIds();
if (existsSync(dir) && !opts.force) usage(`${relative(ROOT, dir)} 已存在（加 --force 覆盖）`);
if (ids.has(id) && ids.get(id) !== relative(ROOT, join(dir, "index.ts"))) usage(`片段 id ${id} 已被 ${ids.get(id)} 使用，换个编号`);

const esc = (s) => JSON.stringify(s);
const safeName = (s) => s.replace(/[\\/:*?"<>|\s·]+/g, "");
const exportName = `正上茶舍_${episode}_${code}_${safeName(title)}.mp4`;
const note = opts.note ?? `${title} · ${seconds}秒`;

const files = {};

if (fromTemplate) {
  // 复制模板源码，改成本片段私有
  let src = readFileSync(join(LIBRARY, `${fromTemplate}.ts`), "utf8");
  src = src.replace(/from "\.\.\/(types|kit\/[\w-]+|schema)"/g, 'from "@/templates/$1"');
  const m = /export const (\w+) = defineTemplate/.exec(src);
  if (!m) usage(`模板 ${fromTemplate} 的写法不认识（找不到 export const xxx = defineTemplate）`);
  src = src.replace(/id:\s*"[^"]+"/, `id: ${esc(id)}`);
  src = `// 从模板「${fromTemplate}」复制而来，已归 ${id} 私有：改 defaults 换示例文案，改 plan / draw 定制动画。\n${src}`;
  files["template.ts"] = src;
  files["index.ts"] = `import { defineClip } from "@/remotion/shared/define-clip";
import { clipFromTemplate } from "@/remotion/shared/from-template";
import { ${m[1]} as template } from "./template";

export default defineClip({
  id: ${esc(id)},
  episode: ${episode},
  code: ${esc(code)},
  title: ${esc(title)},
  note: ${esc(note)},
  exportName: ${esc(exportName)},
  // Comp / draw / duration / sfx / fields / markers 都由 template.ts 推出来
  ...clipFromTemplate(template),
});
`;
} else {
  files["data.ts"] = `import { framesOf } from "@/remotion/shared/theme";

/** 默认文案（面板里可改） */
export const TITLE = ${esc(title)};
export const LINE = "在这里写这一拍的要点";

/** 时间点（帧）：Comp 与 draw 共用，保证预览 = 导出 */
export const LENGTH = framesOf(${seconds});
export const TITLE_AT = framesOf(0.3);
export const LINE_AT = framesOf(1.2);

/** 音效：文件在 public/tea/sfx/ */
export function sfxHits(_staggerFrames: number) {
  return [
    { src: "tea/sfx/wood.wav", at: TITLE_AT, volume: 0.44 },
    { src: "tea/sfx/paper.wav", at: LINE_AT, volume: 0.35 },
  ];
}
`;
  files["Comp.tsx"] = `import { AbsoluteFill } from "remotion";
import { useAppear } from "@/remotion/shared/appear";
import { popTransform } from "@/remotion/shared/breath";
import { Paper, useCustomText, useFontSizeScale, usePaperColors } from "@/remotion/shared/paper";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FONT } from "@/remotion/shared/theme";
import { LINE, LINE_AT, TITLE, TITLE_AT, sfxHits } from "./data";

/** 预览用（Remotion）。改动画时记得同步改 draw.ts（导出用），两边读同一份 data.ts。 */
export function Comp({ staggerFrames = 0 }: { staggerFrames?: number }) {
  const colors = usePaperColors();
  const fontScale = useFontSizeScale();
  const title = useCustomText("title", TITLE);
  const line = useCustomText("line", LINE);
  const a = useAppear(TITLE_AT, 20);
  const b = useAppear(LINE_AT, 18);

  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 56 }}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: Math.round(120 * fontScale),
            color: colors.ink,
            opacity: a.opacity,
            transform: popTransform(a.enter, a.breath),
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 500,
            fontSize: Math.round(54 * fontScale),
            color: colors.seal,
            opacity: b.opacity,
            transform: \`translateY(\${(1 - b.enter) * 24}px)\`,
          }}
        >
          {line}
        </div>
      </AbsoluteFill>
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}
`;
  files["draw.ts"] = `import { fillPaper } from "@/remotion/shared/draw-paper";
import { FONT, FPS, PAPER_THEMES, easeOutCubic, type AnimParams } from "@/remotion/shared/theme";
import { LINE, LINE_AT, TITLE, TITLE_AT } from "./data";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** 导出用（逐帧画到 1080×1920 画布）。与 Comp.tsx 保持同样的时间点和版式。 */
export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);
  const colors = PAPER_THEMES[params.paperTheme ?? "classic"] ?? PAPER_THEMES.classic;
  const fontScale = params.fontScale ?? 1;
  const title = params.customTexts?.title?.trim() || TITLE;
  const line = params.customTexts?.line?.trim() || LINE;
  const frame = (elapsed / 1000) * FPS;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const ta = clamp01((frame - TITLE_AT) / 8);
  if (ta > 0) {
    const p = easeOutCubic(clamp01((frame - TITLE_AT) / 20));
    ctx.save();
    ctx.globalAlpha = ta;
    // 与 Comp 的 popTransform 一致：上浮 30px、0.9→1 放大、-5.5° 回正
    ctx.translate(540, 900 + (1 - p) * 30);
    ctx.rotate(((1 - p) * -5.5 * Math.PI) / 180);
    ctx.scale(0.9 + 0.1 * p, 0.9 + 0.1 * p);
    ctx.fillStyle = colors.ink;
    ctx.font = \`700 \${Math.round(120 * fontScale)}px \${FONT}\`;
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }

  const la = clamp01((frame - LINE_AT) / 8);
  if (la > 0) {
    const p = easeOutCubic(clamp01((frame - LINE_AT) / 18));
    ctx.globalAlpha = la;
    ctx.fillStyle = colors.seal;
    ctx.font = \`500 \${Math.round(54 * fontScale)}px \${FONT}\`;
    ctx.fillText(line, 540, 1040 + (1 - p) * 24);
  }
  ctx.restore();
}
`;
  files["index.ts"] = `import { defineClip } from "@/remotion/shared/define-clip";
import { LENGTH, LINE, LINE_AT, TITLE, TITLE_AT, sfxHits } from "./data";
import { Comp } from "./Comp";
import { draw } from "./draw";
import { FPS } from "@/remotion/shared/theme";

const sec = (f: number) => Math.round((f / FPS) * 100) / 100;

export default defineClip({
  id: ${esc(id)},
  episode: ${episode},
  code: ${esc(code)},
  title: ${esc(title)},
  note: ${esc(note)},
  exportName: ${esc(exportName)},
  Comp,
  draw,
  duration: () => LENGTH,
  sfx: sfxHits,
  // 时间轴上的关键帧标记
  markers: [
    { frame: TITLE_AT, timeSec: sec(TITLE_AT), label: "标题入场", tag: "入场", type: "intro" },
    { frame: LINE_AT, timeSec: sec(LINE_AT), label: "要点出现", tag: "要点", type: "punchline" },
  ],
  // 面板右侧可改的文案（key 与 Comp/draw 里读取的一致）
  fields: [
    { key: "title", label: "标题", default: TITLE, placeholder: TITLE },
    { key: "line", label: "要点", default: LINE, placeholder: LINE },
  ],
});
`;
}

mkdirSync(dir, { recursive: true });
for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);

const created = [];
const epFile = join(epDir, "episode.ts");
if (!existsSync(epFile)) {
  const epTitle = opts["episode-title"] ?? `第${episode}期`;
  writeFileSync(
    epFile,
    `import { defineEpisode } from "@/remotion/shared/define-clip";\n\nexport default defineEpisode({ title: ${esc(epTitle)} });\n`,
  );
  created.push(relative(ROOT, epFile));
}

console.log(`✔ 已创建 ${relative(ROOT, dir)}/  (${Object.keys(files).join(", ")})`);
for (const f of created) console.log(`✔ 已创建 ${f}（本期标题，可随时改）`);
console.log(`  片段 id：${id}   导出名：${exportName}`);
console.log(`  打开面板 → 期下拉框「定制期」→ 第${episode}期，就能看到 ${code}。`);
console.log(fromTemplate ? `  下一步：改 template.ts 里的 defaults / plan / draw。` : `  下一步：在 Comp.tsx（预览）和 draw.ts（导出）里写这一拍的动画，时间点放 data.ts。`);
