import type { ComponentType } from "react";
import type { AnimParams } from "./theme";

export type SceneLine = {
  id: string;
  kind: "title" | "item";
  text: string;
  year?: boolean;
  kicker?: string;
};

export type ClipDef = {
  id: string;
  episode: 16 | 17 | 18 | 19;
  code: string;
  title: string;
  note: string;
  folder: string;
  exportName: string;
  Comp: ComponentType<any>;
  duration: (staggerFrames: number) => number;
  draw: (ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) => void;
};
