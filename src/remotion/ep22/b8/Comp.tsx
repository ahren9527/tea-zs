import { FxBeat } from "../kit/FxBeat";
import { sfxHits } from "./data";
import { allTexts, draw } from "./draw";

const HITS = sfxHits(0);

export function Comp() {
  return <FxBeat draw={draw} allTexts={allTexts} hits={HITS} />;
}
