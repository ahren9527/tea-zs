import { AbsoluteFill } from "remotion";
import { COLORS } from "./theme";

export function Paper() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.035 }}>
        {Array.from({ length: 28 }, (_, i) => (
          <rect
            key={i}
            x={(i * 167) % 1080}
            y={(i * 311) % 1920}
            width="1.5"
            height="16"
            fill="#6b4e31"
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
}
