#!/usr/bin/env node
/**
 * 重新生成 src/remotion/shared/sfx-durations.ts：public/tea/sfx/*.wav 每个文件的时长（秒）。
 * 预览（SfxTrack）靠它让单次音效播完就卸载，免得 <Audio> 越积越多撞上 Remotion 的共享音频标签上限。
 * 加了 / 换了音效文件后跑一次：node scripts/sfx/durations.mjs（scripts/sfx-lib.test.mjs 会检查是否同步）。
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR = join(ROOT, "public/tea/sfx");

/** 读 RIFF/WAVE 头算时长（只看 fmt 与 data 块） */
export function wavSeconds(buf) {
  let off = 12;
  let byteRate = 0;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") byteRate = buf.readUInt32LE(off + 16);
    if (id === "data") return byteRate ? size / byteRate : 0;
    off += 8 + size + (size & 1);
  }
  return 0;
}

const entries = readdirSync(DIR)
  .filter((f) => f.endsWith(".wav"))
  .sort()
  .map((f) => [
    f.replace(/\.wav$/, ""),
    Math.round(wavSeconds(readFileSync(join(DIR, f))) * 1000) / 1000,
  ]);

const body = entries.map(([k, v]) => `  ${JSON.stringify(k)}: ${v},`).join("\n");
writeFileSync(
  join(ROOT, "src/remotion/shared/sfx-durations.ts"),
  `/**
 * public/tea/sfx/*.wav 的时长（秒）。自动生成，勿手改：node scripts/sfx/durations.mjs
 * 预览音效轨用它让单次音效播完即卸载（见 sfx.tsx / sfx-lib.ts oneShotFrames）。
 */
export const SFX_DURATIONS: Record<string, number> = {
${body}
};
`,
);
console.log(`sfx-durations.ts：${entries.length} 个文件`);
