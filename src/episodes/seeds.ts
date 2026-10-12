import { normalizeEpisode, type Episode } from "@/templates/schema";
import { templateMeta } from "@/templates/registry";
import ep18 from "./seeds/ep18.json";
import ep19 from "./seeds/ep19.json";
import { classicEpisodes } from "./classic";

/** 初始期：定制期（src/remotion/epNN 自动发现，主路径）在前，模板示例期（JSON）在后 */
export function seedEpisodes(): Episode[] {
  const tpl = [ep19, ep18].map((raw) => normalizeEpisode(raw, templateMeta).episode);
  return [...classicEpisodes(), ...tpl];
}
