import type { TemplateMeta } from "./schema";
import type { TemplateDef } from "./types";
import { categoryGrid } from "./library/category-grid";
import { closingLine } from "./library/closing-line";
import { dangerZone } from "./library/danger-zone";
import { duel } from "./library/duel";
import { hookStamp } from "./library/hook-stamp";
import { lawPoints } from "./library/law-points";
import { layerSteps } from "./library/layer-steps";
import { poll } from "./library/poll";
import { ruleCards } from "./library/rule-cards";
import { sealRow } from "./library/seal-row";
import { splitPair } from "./library/split-pair";

/**
 * 模板库（顺序 = 模板选择器里的顺序，大致按一期节目的结构：开场 → 要点 → 方法 → 对比 → 警示 → 互动 → 收尾）。
 * 新增模板：在 library/ 下写一个 defineTemplate，然后加到这里。
 */
export const TEMPLATES: TemplateDef[] = [
  hookStamp,
  ruleCards,
  lawPoints,
  categoryGrid,
  layerSteps,
  duel,
  splitPair,
  dangerZone,
  poll,
  sealRow,
  closingLine,
];

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string): TemplateDef | undefined {
  return BY_ID.get(id);
}

export function templateMeta(id: string): TemplateMeta | undefined {
  return BY_ID.get(id);
}

/** 按名称 / 别名 / id 模糊查找（粘贴脚本时用） */
export function findTemplate(name: string): TemplateDef | undefined {
  const q = name.trim().toLowerCase();
  if (!q) return undefined;
  return (
    BY_ID.get(q) ??
    TEMPLATES.find((t) => t.name === name.trim()) ??
    TEMPLATES.find((t) => t.aliases?.some((a) => a.toLowerCase() === q)) ??
    TEMPLATES.find((t) => t.name.includes(name.trim()) || t.aliases?.some((a) => q.includes(a.toLowerCase())))
  );
}
