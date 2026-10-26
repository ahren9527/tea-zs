import { FxBeat } from "../kit/FxBeat";
import { sfxHits } from "./data";
import { allTexts, draw } from "./draw";

/** 预览（Remotion）：直接调用 draw.ts 的同一个 draw()，预览 = 导出 */
export function Comp({ staggerFrames = 0 }: { staggerFrames?: number }) {
  return <FxBeat draw={draw} allTexts={allTexts} hits={sfxHits(staggerFrames)} />;
}
