import { getDefaultTextsForClip } from "@/lib/clip-data";
import { CLIPS, EPISODE_NUMBERS, getEpisodeMeta } from "@/remotion/catalog";
import { PAPER_THEMES } from "@/remotion/shared/theme";
import type { Beat, Episode, PaperThemeId } from "@/templates/schema";
import { DEFAULT_TIMING } from "@/templates/schema";

/** 定制期的 id 由期号决定，存档合并时靠它对上 */
export const customEpisodeId = (num: number) => `classic-ep${num}`;
export const customBeatId = (clipId: string) => `classic-${clipId}`;

export function customBeat(clipId: string): Beat {
  const c = CLIPS.find((x) => x.id === clipId)!;
  return {
    id: customBeatId(c.id),
    template: "bespoke",
    code: c.code,
    title: c.title,
    note: c.note,
    exportName: c.exportName,
    timing: { ...DEFAULT_TIMING },
    content: { clipId: c.id, ...getDefaultTextsForClip(c.id) },
  };
}

/**
 * 把 src/remotion/epNN/ 下自动发现的定制片段包装成一期（定制期）。
 * 动画在代码里，面板只改文案、导出；期标题来自可选的 epNN/episode.ts。
 */
export function classicEpisode(num: number): Episode {
  const meta = getEpisodeMeta(num);
  const theme = meta.theme && meta.theme in PAPER_THEMES ? (meta.theme as PaperThemeId) : "classic";
  return {
    id: customEpisodeId(num),
    number: num,
    title: meta.title,
    theme,
    fontScale: 1,
    beats: CLIPS.filter((c) => c.episode === num).map((c) => customBeat(c.id)),
    classic: true,
  };
}

export function classicEpisodes(): Episode[] {
  return EPISODE_NUMBERS.map(classicEpisode);
}

/**
 * 本机存档 ⇄ 代码里的定制片段对齐：
 * - 新加的期 / 新加的片段自动出现（追加到对应定制期末尾）
 * - 文件夹已删除的片段从定制期里移除，没有片段的定制期一并移除
 * - 已有分镜的文案、顺序、时长等本机修改保持不动
 * `known` 是上次见过的片段 id；用户在面板里删掉的旧片段不会被加回来。
 */
export function syncCustomEpisodes(episodes: Episode[], known: string[] | undefined): Episode[] {
  const live = new Set(CLIPS.map((c) => c.id));
  const seen = new Set(known ?? []);
  if (!known) {
    // 旧存档没有记录：以存档里已出现的片段为准
    for (const e of episodes) for (const b of e.beats) if (b.template === "bespoke") seen.add(String(b.content.clipId ?? ""));
  }
  const fresh = CLIPS.filter((c) => !seen.has(c.id));

  let out = episodes
    .map((e) => {
      if (!e.classic) return e;
      const beats = e.beats.filter((b) => b.template !== "bespoke" || live.has(String(b.content.clipId ?? "")));
      const title = e.title.replace(/ · 经典定制$/, "");
      return beats.length === e.beats.length && title === e.title ? e : { ...e, beats, title };
    })
    .filter((e) => !e.classic || e.beats.length > 0);

  for (const c of fresh) {
    const id = customEpisodeId(c.episode);
    const idx = out.findIndex((e) => e.id === id);
    if (idx < 0) {
      // 整期都是新的：直接按代码生成，放在最前
      const ep = classicEpisode(c.episode);
      out = [ep, ...out];
      continue;
    }
    const ep = out[idx];
    if (ep.beats.some((b) => b.content.clipId === c.id)) continue;
    out = out.map((e, i) => (i === idx ? { ...e, beats: [...e.beats, customBeat(c.id)] } : e));
  }
  return out;
}

export const allClipIds = () => CLIPS.map((c) => c.id);
