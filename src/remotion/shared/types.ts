import type { ComponentType } from "react";
import type { AnimParams } from "./theme";
import type { SfxHit } from "./sfx";

export type SceneLine = {
  id: string;
  kind: "title" | "item";
  text: string;
  year?: boolean;
  kicker?: string;
};

export type ClipDef = {
  id: string;
  episode: number;
  code: string;
  title: string;
  note: string;
  folder: string;
  exportName: string;
  Comp: ComponentType<any>;
  duration: (staggerFrames: number) => number;
  draw: (ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) => void;
  /** 可选：音效列表（定制片段写在 index.ts，模板片段由 plan 生成） */
  sfx?: (staggerFrames: number) => SfxHit[];
  /** 可选：导出前的准备（如按需加载字体分片），params 含本次的自定义文案 */
  prepare?: (params?: AnimParams) => Promise<void>;
};
