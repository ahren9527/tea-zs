import { normalizeEpisode, type Episode } from "@/templates/schema";
import { templateMeta } from "@/templates/registry";
import ep18 from "./seeds/ep18.json";
import ep19 from "./seeds/ep19.json";
import { classicEpisodes } from "./classic";

/** 示例期：模板版第 18/19 期（JSON）+ 经典定制第 18/19 期（原手写片段） */
export function seedEpisodes(): Episode[] {
  const tpl = [ep19, ep18].map((raw) => normalizeEpisode(raw, templateMeta).episode);
  return [...tpl, ...classicEpisodes()];
}
