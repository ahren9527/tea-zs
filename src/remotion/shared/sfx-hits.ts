// Ep 19
import { sfxHits as e19b1 } from "@/remotion/ep19/b1-hook/data";
import { sfxHits as e19b4_1 } from "@/remotion/ep19/b4-1-defense/data";
import { sfxHits as e19b4_2 } from "@/remotion/ep19/b4-2-duel/data";
import { sfxHits as e19b5_1 } from "@/remotion/ep19/b5-1-trap/data";

// Ep 18
import { sfxHits as b1 } from "@/remotion/ep18/b1-hook/data";
import { sfxHits as b2 } from "@/remotion/ep18/b2-three/data";
import { sfxHits as b3 } from "@/remotion/ep18/b3-dry/data";
import { sfxHits as b4 } from "@/remotion/ep18/b4-seal/data";
import { sfxHits as b5 } from "@/remotion/ep18/b5-clean/data";
import { sfxHits as b6 } from "@/remotion/ep18/b6-six/data";
import { sfxHits as b7 } from "@/remotion/ep18/b7-poll/data";
import { sfxHits as b8 } from "@/remotion/ep18/b8-shelf/data";
import { sfxHits as b9 } from "@/remotion/ep18/b9-close/data";
import { sfxHits as b10 } from "@/remotion/ep18/b10-jar/data";

import type { SfxHit } from "./sfx";

export function hitsFor(clipId: string, staggerFrames: number): SfxHit[] {
  switch (clipId) {
    case "ep19-b1":
      return e19b1(staggerFrames);
    case "ep19-b4-1":
      return e19b4_1(staggerFrames);
    case "ep19-b4-2":
      return e19b4_2(staggerFrames);
    case "ep19-b5-1":
      return e19b5_1(staggerFrames);
    case "ep18-b1":
      return b1(staggerFrames);
    case "ep18-b2":
      return b2(staggerFrames);
    case "ep18-b3":
      return b3(staggerFrames);
    case "ep18-b4":
      return b4(staggerFrames);
    case "ep18-b5":
      return b5(staggerFrames);
    case "ep18-b6":
      return b6(staggerFrames);
    case "ep18-b7":
      return b7(staggerFrames);
    case "ep18-b8":
      return b8(staggerFrames);
    case "ep18-b9":
      return b9(staggerFrames);
    case "ep18-b10":
      return b10(staggerFrames);
    default:
      return [];
  }
}
