/**
 * 定制片段目录：自动发现 src/remotion/epNN/<节拍>/index.ts，
 * 新增一期 / 一个节拍不需要改这里。
 */
import type { ClipModule, EpisodeMeta } from "./shared/define-clip";

const clipModules = import.meta.glob<{ default: ClipModule }>("./ep*/*/index.ts", { eager: true });
const episodeModules = import.meta.glob<{ default: EpisodeMeta }>("./ep*/episode.ts", { eager: true });

function episodeFromPath(path: string): number | undefined {
  const m = /\/ep(\d+)\//.exec(path);
  return m ? Number(m[1]) : undefined;
}

function compareCode(a: string, b: string) {
  return a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });
}

function discoverClips(): ClipModule[] {
  const out: ClipModule[] = [];
  const seen = new Set<string>();
  for (const [path, mod] of Object.entries(clipModules)) {
    const def = mod.default;
    if (!def || typeof def !== "object" || !def.id || !def.Comp) {
      console.warn(`[catalog] ${path} 没有 export default defineClip({...})，已跳过`);
      continue;
    }
    if (seen.has(def.id)) {
      console.warn(`[catalog] 片段 id 重复：${def.id}（${path}），已跳过`);
      continue;
    }
    seen.add(def.id);
    const folder = def.folder || `src/remotion/${path.replace(/^\.\//, "").replace(/\/index\.ts$/, "")}`;
    const episode = Number.isFinite(def.episode) ? def.episode : (episodeFromPath(path) ?? 0);
    out.push({ ...def, folder, episode });
  }
  // 新的期在前；同期按 order，再按 code 自然排序
  return out.sort(
    (a, b) =>
      b.episode - a.episode ||
      (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
      compareCode(a.code, b.code),
  );
}

export const CLIPS: ClipModule[] = discoverClips();

const EPISODE_META: Record<number, EpisodeMeta> = {};
for (const [path, mod] of Object.entries(episodeModules)) {
  const meta = mod.default;
  const num = meta?.number ?? episodeFromPath(path);
  if (meta && num !== undefined) EPISODE_META[num] = { ...meta, number: num };
}

/** 有定制片段的期号（新→旧） */
export const EPISODE_NUMBERS: number[] = Array.from(new Set(CLIPS.map((c) => c.episode))).sort((a, b) => b - a);

export function getEpisodeMeta(num: number): EpisodeMeta {
  return EPISODE_META[num] ?? { number: num, title: `第${num}期` };
}

export function getClip(id: string): ClipModule {
  return CLIPS.find((c) => c.id === id) ?? CLIPS[0];
}

export function findClip(id: string): ClipModule | undefined {
  return CLIPS.find((c) => c.id === id);
}
