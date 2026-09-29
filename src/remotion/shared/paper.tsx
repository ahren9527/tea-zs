import { AbsoluteFill } from "remotion";
import { usePaperColors, useFontSizeScale, useScaledFontSize, useCustomText, useCustomTexts } from "./theme-context";
import { PAPER_THEMES, type PaperThemeKey } from "./theme";

export { usePaperColors, useFontSizeScale, useScaledFontSize, useCustomText, useCustomTexts };

export function Paper({ themeOverride }: { themeOverride?: PaperThemeKey }) {
  const contextColors = usePaperColors();
  const colors = themeOverride && PAPER_THEMES[themeOverride] ? PAPER_THEMES[themeOverride] : contextColors;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper, transition: "background-color 0.25s ease" }}>
      {/* Authentic Xuan paper fibers */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none" }}>
        {Array.from({ length: 64 }, (_, i) => (
          <rect
            key={i}
            x={(i * 137 + (i % 3) * 73) % 1080}
            y={(i * 251 + (i % 5) * 41) % 1920}
            width={i % 2 === 0 ? 1.5 : 2.5}
            height={i % 3 === 0 ? 28 : 16}
            transform={`rotate(${(i * 37) % 360} ${(i * 137) % 1080} ${(i * 251) % 1920})`}
            fill={colors.paperDeep}
          />
        ))}
        {/* Classical Song-style bookplate double inner margin rules (文人木刻版心内线) */}
        <rect
          x="36"
          y="48"
          width="1008"
          height="1824"
          fill="none"
          stroke={colors.ink}
          strokeWidth="1.2"
          opacity="0.12"
        />
        <rect
          x="44"
          y="56"
          width="992"
          height="1808"
          fill="none"
          stroke={colors.ink}
          strokeWidth="0.6"
          opacity="0.08"
        />
        {/* Four Corner Accents (四角如意/折角云纹装饰) */}
        <path d="M 32 68 L 32 44 L 56 44" fill="none" stroke={colors.ink} strokeWidth="2" opacity="0.2" />
        <path d="M 1048 68 L 1048 44 L 1024 44" fill="none" stroke={colors.ink} strokeWidth="2" opacity="0.2" />
        <path d="M 32 1852 L 32 1876 L 56 1876" fill="none" stroke={colors.ink} strokeWidth="2" opacity="0.2" />
        <path d="M 1048 1852 L 1048 1876 L 1024 1876" fill="none" stroke={colors.ink} strokeWidth="2" opacity="0.2" />
      </svg>
      {/* Classic subtle vignette framing */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          boxShadow: `inset 0 0 180px ${colors.paperDeep}aa`,
        }}
      />
    </AbsoluteFill>
  );
}
