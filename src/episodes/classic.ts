import { getDefaultTextsForClip } from "@/lib/clip-data";
import { CLIPS } from "@/remotion/catalog";
import type { Beat, Episode } from "@/templates/schema";
import { DEFAULT_TIMING } from "@/templates/schema";

const TITLES: Record<number, string> = {
  18: "白茶怎么存？",
  19: "大罐存、小罐醒",
};

/** 把原有手写的定制片段包装成「经典定制」期，保证老片段一个不丢、仍可编辑文案与导出 */
export function classicEpisode(num: number): Episode {
  const beats: Beat[] = CLIPS.filter((c) => c.episode === num).map((c) => ({
    id: `classic-${c.id}`,
    template: "bespoke",
    code: c.code,
    title: c.title,
    note: c.note,
    exportName: c.exportName,
    timing: { ...DEFAULT_TIMING },
    content: { clipId: c.id, ...getDefaultTextsForClip(c.id) },
  }));
  return {
    id: `classic-ep${num}`,
    number: num,
    title: `${TITLES[num] ?? ""} · 经典定制`,
    theme: "classic",
    fontScale: 1,
    beats,
    classic: true,
  };
}

export function classicEpisodes(): Episode[] {
  const nums = Array.from(new Set(CLIPS.map((c) => c.episode))).sort((a, b) => b - a);
  return nums.map(classicEpisode);
}
