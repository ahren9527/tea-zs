import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FONT_SONG } from "@/remotion/shared/theme";
import { usePaperColors, useFontSizeScale, useCustomTexts } from "@/remotion/shared/paper";
import {
  AROMA_BURST_AT,
  LID_START_AT,
  LIGHT_IMPACT_AT,
  LIGHT_START_AT,
  REFRACT_PARTICLES,
  SILICONE_TOUCH_AT,
  STAMP_LIGHT_AT,
  STAMP_LIGHT_TEXT,
  STAMP_SEAL_AT,
  STAMP_SEAL_TEXT,
  sfxHits,
} from "./data";

type Props = {
  customTexts?: Record<string, string>;
  staggerFrames?: number;
  fontScale?: number;
};

// Corner L-frames for traditional bookplate style
function CornerLBrackets({ strokeColor = "#2b261c" }: { strokeColor?: string }) {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        width: 1080,
        height: 1920,
      }}
    >
      {/* Outer bookplate border */}
      <rect
        x="44"
        y="56"
        width="992"
        height="1808"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.2"
        opacity="0.14"
      />
      <rect
        x="52"
        y="64"
        width="976"
        height="1792"
        fill="none"
        stroke={strokeColor}
        strokeWidth="0.6"
        opacity="0.08"
      />
      {/* Four classical Song-style L-brackets */}
      <path d="M 38 80 L 38 50 L 68 50" fill="none" stroke={strokeColor} strokeWidth="2.4" opacity="0.32" />
      <path d="M 1042 80 L 1042 50 L 1012 50" fill="none" stroke={strokeColor} strokeWidth="2.4" opacity="0.32" />
      <path d="M 38 1840 L 38 1870 L 68 1870" fill="none" stroke={strokeColor} strokeWidth="2.4" opacity="0.32" />
      <path d="M 1042 1840 L 1042 1870 L 1012 1870" fill="none" stroke={strokeColor} strokeWidth="2.4" opacity="0.32" />
    </svg>
  );
}

// Large Classical Seal Stamp Component with Dynamic Font Scale
function LargeSealStamp({
  x,
  y,
  text,
  visibleProgress,
  fontScale = 1,
}: {
  x: number;
  y: number;
  text: string;
  visibleProgress: number;
  fontScale?: number;
}) {
  if (visibleProgress <= 0.01) return null;

  const baseScale = interpolate(visibleProgress, [0, 0.7, 1], [1.38, 0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(visibleProgress, [0, 0.35, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 1. 题跋文字“墨化出场”动效 (Ink-Bleed Text Transition: 墨迹由扩散浸润收敛至凝聚清晰)
  const textBlur = interpolate(visibleProgress, [0.1, 0.85], [4.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textOpacity = interpolate(visibleProgress, [0.08, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textLetterSpacing = interpolate(visibleProgress, [0.1, 0.85], [0.24, 0.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const effectiveScale = baseScale * fontScale;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${effectiveScale})`,
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 50,
        // 2. 澄心堂纸与印泥的正片叠底融合 (Multiply blending with Xuan paper)
        mixBlendMode: "multiply",
      }}
    >
      <div
        style={{
          border: "3.5px solid #a33226",
          borderRadius: 10,
          padding: "16px 36px",
          backgroundColor: "#fdfbf6",
          // 剔除漂浮高投影，转为微弱压纸印痕与印泥边缘浸润
          boxShadow:
            "inset 0 0 16px rgba(163, 50, 38, 0.16), 0 1px 3px rgba(163, 50, 38, 0.22)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {/* Paper micro-grain & fiber texture overlay (纸张微杂色与宣纸纤维层) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              radial-gradient(rgba(140, 40, 25, 0.14) 1px, transparent 0),
              radial-gradient(rgba(70, 50, 30, 0.1) 1px, transparent 0),
              linear-gradient(45deg, transparent 48%, rgba(163, 50, 38, 0.06) 50%, transparent 52%)
            `,
            backgroundSize: "6px 6px, 11px 11px, 22px 22px",
            backgroundPosition: "0 0, 3px 5px, 0 0",
            opacity: 0.85,
            pointerEvents: "none",
            mixBlendMode: "multiply",
          }}
        />

        {/* Cinnabar ink pad pressure gradient (印泥中央受力微晕) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(163, 50, 38, 0.08) 0%, transparent 75%)",
            pointerEvents: "none",
          }}
        />

        {/* Inner thin decorative dashed border */}
        <div
          style={{
            position: "absolute",
            inset: 4,
            border: "1px dashed rgba(163, 50, 38, 0.5)",
            borderRadius: 6,
            pointerEvents: "none",
          }}
        />

        {/* Text with Ink-Bleed Transition (墨化出场) */}
        <span
          style={{
            fontFamily: FONT_SONG,
            fontSize: 48,
            fontWeight: 700,
            color: "#a33226",
            letterSpacing: `${textLetterSpacing.toFixed(3)}em`,
            textShadow: "0 1px 3px rgba(163, 50, 38, 0.22)",
            position: "relative",
            zIndex: 2,
            filter: textBlur > 0.05 ? `blur(${textBlur.toFixed(2)}px)` : "none",
            opacity: textOpacity,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// REAL WHITE TEA VECTOR COMPONENTS (真实白茶：白毫银针与白牡丹)
// ----------------------------------------------------

// 1. Single Silver Needle (白毫银针：如针挺拔，密披白毫，针尖锐利)
function RealSilverNeedleSvg({
  x,
  y,
  rot = 0,
  scale = 1,
}: {
  x: number;
  y: number;
  rot?: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${scale})`}>
      {/* Tender green-grey bud body */}
      <path
        d="M 0 -24 C 3.5 -13 3 5 0 16 C -3 5 -3.5 -13 0 -24 Z"
        fill="#4d6741"
        stroke="#283a21"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      {/* Thick white downy pekoe fur highlight (白毫银光) */}
      <path
        d="M -0.5 -21 Q 0.5 -4 0.5 12"
        stroke="#edf5ea"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        opacity="0.92"
      />
      {/* Fine fuzzy edge highlights */}
      <path
        d="M -1.8 -16 Q -2 -2 -1 8"
        stroke="#dcead8"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.75"
      />
      {/* Needle sharp apex tip */}
      <circle cx="0" cy="-23" r="0.8" fill="#ffffff" />
    </g>
  );
}

// 2. Withered White Peony Leaf (白牡丹自然萎凋干茶叶：微蜷曲，双面色，干瘪质感)
function RealPeonyLeafSvg({
  x,
  y,
  rot = 0,
  scale = 1,
  color = "#4c6340",
  curlColor = "#bacfb1",
  dryTip = false,
}: {
  x: number;
  y: number;
  rot?: number;
  scale?: number;
  color?: string;
  curlColor?: string;
  dryTip?: boolean;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${scale})`}>
      {/* Withered, undulating natural leaf blade */}
      <path
        d="M -22 6 C -28 -3 -22 -18 -10 -22 C 2 -26 18 -16 22 -3 C 16 10 2 15 -14 12 C -18 10 -20 8 -22 6 Z"
        fill={color}
        stroke="#27391f"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      {/* Natural leaf central vein (主叶脉) */}
      <path
        d="M -20 6 Q 0 -6 20 -4"
        fill="none"
        stroke="#334629"
        strokeWidth="0.9"
        opacity="0.85"
      />
      {/* Silvery downy underside curl (叶背白毫银卷) */}
      <path
        d="M -16 -18 C -4 -13 8 -6 18 -1 C 12 4 2 2 -8 -6 Z"
        fill={curlColor}
        stroke="#27391f"
        strokeWidth="0.6"
        opacity="0.9"
      />
      {/* Withered brownish oxidized leaf tip (萎凋黄褐枯尖) */}
      {dryTip && (
        <path
          d="M 18 -6 C 22 -3 21 2 17 4 Z"
          fill="#6b5336"
          stroke="#42311c"
          strokeWidth="0.6"
        />
      )}
    </g>
  );
}

// 3. Dry Tea Stem / Twig (细干茶梗)
function RealTeaStemSvg({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="#685437"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.85"
    />
  );
}

export function Comp(props: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = usePaperColors();

  // Dynamic context and props binding for inspector controls
  const contextFontScale = useFontSizeScale();
  const fontScale = props.fontScale ?? contextFontScale ?? 1;

  const contextTexts = useCustomTexts();
  const lightStampText =
    props.customTexts?.lightStamp ?? contextTexts?.lightStamp ?? STAMP_LIGHT_TEXT;
  const sealStampText =
    props.customTexts?.sealStamp ?? contextTexts?.sealStamp ?? STAMP_SEAL_TEXT;

  // Center coordinate of the jar cross section: Y = 42% of 1920 = 806.4px
  const cx = 540;
  const cy = 806;

  // ----------------------------------------------------
  // Part 1: Punchy Elastic Jar Bounce on Light Beam Impact (撞击放大与回弹)
  // ----------------------------------------------------
  const impactDelta = frame - LIGHT_IMPACT_AT;
  let jarScaleX = 1.0;
  let jarScaleY = 1.0;
  let jarRecoilX = 0.0;

  if (impactDelta >= 0) {
    const decay = Math.exp(-impactDelta * 0.13);
    // Punchy pop impulse peaking at delta ≈ 2.2 frames (~1.085 scale)
    const pop = Math.exp(-Math.pow(impactDelta - 2.2, 2) / 8.0) * 0.078;
    // Harmonic oscillation for elastic rebound and tactile settling
    const osc = Math.sin(impactDelta * 0.42) * 0.048 * decay;

    jarScaleX = 1.0 + pop + osc;
    jarScaleY = 1.0 + pop * 0.82 - osc * 0.6;
    jarRecoilX = Math.sin(impactDelta * 0.46) * 4.6 * decay;
  }

  // 3 Primary impact centers along the left glaze boundary
  const hitOrigins = [
    { x: 414, y: 735 }, // Upper jar shoulder
    { x: 405, y: 778 }, // Jar belly apex
    { x: 410, y: 822 }, // Lower jar belly
  ];

  // ----------------------------------------------------
  // Stage 1: Light Beams & Refraction Calculation
  // ----------------------------------------------------
  const impactProgress = spring({
    frame: frame - LIGHT_IMPACT_AT,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Stage 1 Stamp progress (Bottom Stamp)
  const stampLightProgress = spring({
    frame: frame - STAMP_LIGHT_AT,
    fps,
    config: { damping: 15, stiffness: 140 },
  });

  // ----------------------------------------------------
  // Stage 2: Lid Descent, Silicone Compression & Aroma
  // ----------------------------------------------------
  const lidProgress = spring({
    frame: frame - LID_START_AT,
    fps,
    config: { damping: 17, stiffness: 55 },
  });
  const lidYOffset = interpolate(lidProgress, [0, 1], [-180, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Silicone compression: starts at SILICONE_TOUCH_AT, finishes at LID_LOCKED_AT
  const siliconeCompressProgress = spring({
    frame: frame - SILICONE_TOUCH_AT,
    fps,
    config: { damping: 16, stiffness: 75 },
  });
  // scaleY: 1.0 -> 0.4, scaleX: 1.0 -> 1.24
  const siliconeScaleY = interpolate(siliconeCompressProgress, [0, 1], [1.0, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const siliconeScaleX = interpolate(siliconeCompressProgress, [0, 1], [1.0, 1.24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Aroma sphere expansion & slow breathing
  const aromaProgress = spring({
    frame: frame - AROMA_BURST_AT,
    fps,
    config: { damping: 18, stiffness: 60 },
  });
  const breathingCycle = Math.sin((frame - AROMA_BURST_AT) * 0.08);
  const aromaScale = interpolate(aromaProgress, [0, 1], [0.2, 1.0]) * (1 + breathingCycle * 0.04);
  const aromaOpacity = interpolate(aromaProgress, [0, 0.3, 1], [0, 0.85, 0.72]) * (1 + breathingCycle * 0.12);

  // Stage 2 Stamp progress (Top Stamp)
  const stampSealProgress = spring({
    frame: frame - STAMP_SEAL_AT,
    fps,
    config: { damping: 15, stiffness: 140 },
  });

  // Positions for Top & Bottom Stamps
  const topStampPos = { x: 540, y: 410 };
  const bottomStampPos = { x: 540, y: 1210 };

  return (
    <div
      style={{
        position: "relative",
        width: 1080,
        height: 1920,
        overflow: "hidden",
        backgroundColor: colors.paper,
        fontFamily: FONT_SONG,
      }}
    >
      <SfxTrack hits={sfxHits(props.staggerFrames ?? 0)} />

      {/* Classical Paper Fiber Noise */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.06,
          pointerEvents: "none",
          width: "100%",
          height: "100%",
        }}
      >
        {Array.from({ length: 72 }, (_, i) => (
          <rect
            key={i}
            x={(i * 149 + (i % 5) * 59) % 1080}
            y={(i * 277 + (i % 7) * 43) % 1920}
            width={i % 2 === 0 ? 1.5 : 2.5}
            height={i % 3 === 0 ? 30 : 18}
            transform={`rotate(${(i * 41) % 360} ${(i * 149) % 1080} ${(i * 277) % 1920})`}
            fill={colors.paperDeep}
          />
        ))}
      </svg>

      {/* Four Classical L-Brackets */}
      <CornerLBrackets strokeColor={colors.ink} />

      {/* Main Composition Canvas Area */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <defs>
          {/* Ceramic Outer Glaze Gradient: Celadon warm jade tone */}
          <linearGradient id="celadonGlaze" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d1e3db" />
            <stop offset="25%" stopColor="#e2efe8" />
            <stop offset="65%" stopColor="#c5dbd1" />
            <stop offset="100%" stopColor="#b4cdc2" />
          </linearGradient>

          {/* Porcelain Clay Biscuit Cross-Section: Warm ivory clay */}
          <linearGradient id="clayBiscuit" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f5f0e6" />
            <stop offset="50%" stopColor="#ece4d3" />
            <stop offset="100%" stopColor="#dfd5c1" />
          </linearGradient>

          {/* Interior Cool Dark Tea Chamber: Zero-light sanctuary */}
          <radialGradient id="coolShadowSanctuary" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#222b26" />
            <stop offset="65%" stopColor="#151b18" />
            <stop offset="100%" stopColor="#0c100e" />
          </radialGradient>

          {/* Wooden Lid Natural Grain */}
          <linearGradient id="woodLidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7a5230" />
            <stop offset="35%" stopColor="#966842" />
            <stop offset="70%" stopColor="#845a35" />
            <stop offset="100%" stopColor="#684424" />
          </linearGradient>

          {/* Golden Sun Light Beam Gradient */}
          <linearGradient id="sunBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 245, 170, 0.98)" />
            <stop offset="70%" stopColor="rgba(255, 195, 45, 0.95)" />
            <stop offset="100%" stopColor="rgba(255, 255, 230, 1)" />
          </linearGradient>

          {/* High-Impact Reflected Deflected Beam Gradient */}
          <linearGradient id="reflectedBeamGrad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 250, 180, 1)" />
            <stop offset="40%" stopColor="rgba(255, 210, 60, 0.9)" />
            <stop offset="85%" stopColor="rgba(255, 180, 30, 0.5)" />
            <stop offset="100%" stopColor="rgba(255, 180, 30, 0)" />
          </linearGradient>

          {/* Golden Aroma Qi Glow Sphere */}
          <radialGradient id="aromaQiGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(250, 220, 120, 0.9)" />
            <stop offset="45%" stopColor="rgba(235, 190, 75, 0.45)" />
            <stop offset="80%" stopColor="rgba(215, 160, 45, 0.15)" />
            <stop offset="100%" stopColor="rgba(215, 160, 45, 0)" />
          </radialGradient>

          {/* 80% Full White Tea Bed Gradient (Organic dry tea depth) */}
          <linearGradient id="realWhiteTeaBedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#32442c" />
            <stop offset="35%" stopColor="#24331f" />
            <stop offset="75%" stopColor="#1b2518" />
            <stop offset="100%" stopColor="#121a10" />
          </linearGradient>

          {/* Subtle jar contact shadow */}
          <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(43, 38, 28, 0.28)" />
            <stop offset="70%" stopColor="rgba(43, 38, 28, 0.08)" />
            <stop offset="100%" stopColor="rgba(43, 38, 28, 0)" />
          </radialGradient>

          {/* Clip path of the ceramic jar's inner cavity */}
          <clipPath id="innerJarCavityClip">
            <path
              d={`
                M 472 660
                L 472 696
                C 472 730 422 755 422 820
                C 422 890 440 954 540 954
                C 640 954 658 890 658 820
                C 658 755 608 730 608 696
                L 608 660
                Z
              `}
            />
          </clipPath>
        </defs>

        {/* ---------------------------------------------------- */}
        {/* Contact Shadow Under the Jar (dynamically scales and shifts with bounce) */}
        {/* ---------------------------------------------------- */}
        <ellipse
          cx={cx + jarRecoilX * 0.7}
          cy={cy + 178}
          rx={160 * jarScaleX}
          ry={22 * jarScaleY}
          fill="url(#groundShadow)"
          opacity={0.28 * (1 + (jarScaleX - 1) * 0.7)}
        />

        {/* ---------------------------------------------------- */}
        {/* CERAMIC JAR LONGITUDINAL CROSS-SECTION (纵剖面) */}
        {/* Scaled with Punchy Elastic Bounce Physics (放大与回弹) */}
        {/* Center: (cx, cy) = (540, 806) */}
        {/* ---------------------------------------------------- */}
        <g
          id="ceramicJarCrossSection"
          transform={`translate(${cx + jarRecoilX}, ${cy}) scale(${jarScaleX}, ${jarScaleY}) translate(${-cx}, ${-cy})`}
        >
          {/* A. Jar Deep Cool Interior Cavity (剖开后内部暗调避光内膛) */}
          <path
            d={`
              M 472 660
              L 472 696
              C 472 730 422 755 422 820
              C 422 890 440 954 540 954
              C 640 954 658 890 658 820
              C 658 755 608 730 608 696
              L 608 660
              Z
            `}
            fill="url(#coolShadowSanctuary)"
            stroke="#1a1f1d"
            strokeWidth="1.5"
          />

          {/* ---------------------------------------------------- */}
          {/* A2. REAL WHITE TEA (真实白茶 · 严禁填满 · 精准 8分满) */}
          {/* Base at Y: 954; Top loose crest at Y: ~765. */}
          {/* The top 105px (Y: 660 to 765) is EMPTY AIR HEADSPACE! */}
          {/* ---------------------------------------------------- */}
          <g id="realWhiteTeaEightTenthsFull" clipPath="url(#innerJarCavityClip)">
            {/* 1. Base Organic Tea Bed Shading (From Y: 765 down to Y: 954) */}
            <path
              d="M 400 765 Q 470 758 540 762 Q 610 756 680 768 L 680 960 L 400 960 Z"
              fill="url(#realWhiteTeaBedGrad)"
            />

            {/* Stratum shading line */}
            <path
              d="M 410 825 Q 475 815 540 820 Q 605 812 670 828 L 670 960 L 410 960 Z"
              fill="rgba(16, 24, 14, 0.45)"
            />
            <path
              d="M 415 880 Q 480 870 540 876 Q 600 868 665 882 L 665 960 L 415 960 Z"
              fill="rgba(10, 16, 8, 0.55)"
            />

            {/* Dry tea stems (木质干茶梗) */}
            <RealTeaStemSvg x1={455} y1={910} x2={485} y2={895} />
            <RealTeaStemSvg x1={530} y1={860} x2={565} y2={845} />
            <RealTeaStemSvg x1={600} y1={890} x2={625} y2={870} />
            <RealTeaStemSvg x1={480} y1={815} x2={510} y2={800} />
            <RealTeaStemSvg x1={570} y1={810} x2={605} y2={795} />

            {/* 2. Embedded Withered Peony Leaves (自然干瘪蜷曲的白牡丹干茶叶) */}
            {/* Deep Layer */}
            <RealPeonyLeafSvg x={485} y={920} rot={-20} scale={0.95} color="#3d5137" curlColor="#a6bc9f" />
            <RealPeonyLeafSvg x={555} y={925} rot={25} scale={1.05} color="#455c3d" curlColor="#b2c6aa" dryTip />
            <RealPeonyLeafSvg x={615} y={905} rot={-32} scale={0.9} color="#384a32" curlColor="#9fb398" />
            <RealPeonyLeafSvg x={445} y={895} rot={38} scale={0.88} color="#40553a" curlColor="#a8bda1" />

            {/* Mid Stratum */}
            <RealPeonyLeafSvg x={515} y={875} rot={-12} scale={1.12} color="#4e6544" curlColor="#bfd3b7" dryTip />
            <RealPeonyLeafSvg x={580} y={865} rot={45} scale={0.98} color="#3f5338" curlColor="#a3b79c" />
            <RealPeonyLeafSvg x={460} y={845} rot={-26} scale={1.05} color="#526b48" curlColor="#c5dac0" />
            <RealPeonyLeafSvg x={625} y={840} rot={-18} scale={0.95} color="#475f3f" curlColor="#adc2a6" dryTip />
            <RealPeonyLeafSvg x={540} y={830} rot={16} scale={1.18} color="#496340" curlColor="#b5cbb0" />

            {/* Upper Stratum (under 80% surface) */}
            <RealPeonyLeafSvg x={475} y={795} rot={28} scale={1.0} color="#58734e" curlColor="#cbdec5" />
            <RealPeonyLeafSvg x={565} y={788} rot={-22} scale={1.15} color="#516b47" curlColor="#c0d5ba" dryTip />
            <RealPeonyLeafSvg x={615} y={795} rot={22} scale={0.92} color="#48603e" curlColor="#b1c5ab" />
            <RealPeonyLeafSvg x={505} y={778} rot={-8} scale={1.2} color="#5d7b53" curlColor="#d2e6cd" />

            {/* 3. Real Silver Needles in Bed (白毫银针 · 银毫密被 · 挺拔尖挺) */}
            {/* Deep needles */}
            <RealSilverNeedleSvg x={510} y={915} rot={-18} scale={0.95} />
            <RealSilverNeedleSvg x={575} y={905} rot={22} scale={1.0} />
            <RealSilverNeedleSvg x={468} y={870} rot={34} scale={1.05} />
            <RealSilverNeedleSvg x={542} y={855} rot={-10} scale={1.1} />
            <RealSilverNeedleSvg x={608} y={865} rot={-28} scale={0.98} />

            {/* Mid-height needles */}
            <RealSilverNeedleSvg x={482} y={825} rot={16} scale={1.15} />
            <RealSilverNeedleSvg x={532} y={810} rot={-15} scale={1.2} />
            <RealSilverNeedleSvg x={588} y={820} rot={26} scale={1.1} />
            <RealSilverNeedleSvg x={448} y={785} rot={-30} scale={1.08} />
            <RealSilverNeedleSvg x={622} y={780} rot={18} scale={1.12} />

            {/* 4. PROTRUDING TOP SILVER NEEDLES (8分满顶面探出的挺拔白毫银针) */}
            {/* These needle tips extend gracefully into the empty headspace up to Y: 740 */}
            <RealSilverNeedleSvg x={438} y={766} rot={-24} scale={1.25} />
            <RealSilverNeedleSvg x={472} y={758} rot={-12} scale={1.3} />
            <RealSilverNeedleSvg x={506} y={752} rot={8} scale={1.35} />
            <RealSilverNeedleSvg x={540} y={748} rot={-4} scale={1.38} />
            <RealSilverNeedleSvg x={574} y={754} rot={15} scale={1.32} />
            <RealSilverNeedleSvg x={608} y={760} rot={-20} scale={1.28} />
            <RealSilverNeedleSvg x={638} y={770} rot={26} scale={1.2} />

            {/* Undulating airy fluffy surface of the white tea crest */}
            <path
              d="M 420 772 Q 450 758 480 762 Q 510 752 540 756 Q 570 750 600 758 Q 630 754 660 774"
              fill="none"
              stroke="#7da36e"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.8"
            />
          </g>

          {/* E. Pulsing Golden Aroma Qi Sphere (After AROMA_BURST_AT) */}
          {frame >= AROMA_BURST_AT && (
            <g id="aromaQiSphere" transform={`translate(${cx}, ${cy + 25}) scale(${aromaScale})`}>
              <circle cx="0" cy="0" r="145" fill="url(#aromaQiGlow)" opacity={aromaOpacity} />
              <circle
                cx="0"
                cy="0"
                r={105 + breathingCycle * 8}
                fill="none"
                stroke="rgba(255, 230, 130, 0.55)"
                strokeWidth="2.2"
                opacity={aromaOpacity * 0.7}
              />
              <circle
                cx="0"
                cy="0"
                r={68 + breathingCycle * 5}
                fill="none"
                stroke="rgba(255, 240, 160, 0.7)"
                strokeWidth="1.8"
                opacity={aromaOpacity * 0.85}
              />
            </g>
          )}

          {/* B. Porcelain Clay Biscuit Cross-Section (致密陶胎截面) */}
          {/* Left Biscuit Wall */}
          <path
            d={`
              M 454 660
              L 472 660
              L 472 696
              C 472 730 422 755 422 820
              C 422 890 440 954 540 954
              L 540 974
              C 445 974 402 910 402 820
              C 402 745 454 720 454 696
              Z
            `}
            fill="url(#clayBiscuit)"
            stroke="#2b261c"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Right Biscuit Wall */}
          <path
            d={`
              M 626 660
              L 608 660
              L 608 696
              C 608 730 658 755 658 820
              C 658 890 640 954 540 954
              L 540 974
              C 635 974 678 910 678 820
              C 678 745 626 720 626 696
              Z
            `}
            fill="url(#clayBiscuit)"
            stroke="#2b261c"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* C. Outer Celadon Glaze Outer Border (粉青/天青釉外壁轮廓与光泽) */}
          {/* Left Glazed Outer Lip & Belly */}
          <path
            d={`
              M 454 660
              L 454 696
              C 454 720 402 745 402 820
              C 402 910 445 974 540 974
            `}
            fill="none"
            stroke="#5c7a6e"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          {/* Right Glazed Outer Lip & Belly */}
          <path
            d={`
              M 626 660
              L 626 696
              C 626 720 678 745 678 820
              C 678 910 635 974 540 974
            `}
            fill="none"
            stroke="#5c7a6e"
            strokeWidth="3.4"
            strokeLinecap="round"
          />

          {/* Ceramic Rim Top Lip Hatching Lines (断面微纹理) */}
          <line x1="454" y1="660" x2="472" y2="660" stroke="#b0a592" strokeWidth="2" />
          <line x1="608" y1="660" x2="626" y2="660" stroke="#b0a592" strokeWidth="2" />

          {/* Foot Ring (宋代玉璧底/圈足) */}
          <rect
            x="465"
            y="974"
            width="150"
            height="10"
            rx="2"
            fill="#d2c7b5"
            stroke="#2b261c"
            strokeWidth="1.5"
          />
        </g>

        {/* ---------------------------------------------------- */}
        {/* MOVABLE WOODEN LID & SILICONE SEAL GASKET ASSEMBLY */}
        {/* Descends into the empty headspace at frame 54-80 */}
        {/* ---------------------------------------------------- */}
        <g id="movableLidAssembly" transform={`translate(0, ${lidYOffset})`}>
          {/* 1. Wooden Plug Lower Body (插入罐颈内部的木塞下半部) */}
          <rect
            x="475"
            y="654"
            width="130"
            height="36"
            rx="3"
            fill="#734d2c"
            stroke="#2b261c"
            strokeWidth="1.6"
          />

          {/* 2. White Food-Grade Silicone Sealing Gasket (白色硅胶密封圈) */}
          {/* Left silicone ring cross-section (centered at X: 474, Y: 672) */}
          <g
            transform={`translate(474, 672) scale(${siliconeScaleX}, ${siliconeScaleY})`}
          >
            <ellipse
              cx="0"
              cy="0"
              rx="9"
              ry="11"
              fill="#ffffff"
              stroke="#b5bcc0"
              strokeWidth="1.5"
            />
            <ellipse cx="-2" cy="-3" rx="4" ry="5" fill="#f8fafc" />
          </g>

          {/* Right silicone ring cross-section (centered at X: 606, Y: 672) */}
          <g
            transform={`translate(606, 672) scale(${siliconeScaleX}, ${siliconeScaleY})`}
          >
            <ellipse
              cx="0"
              cy="0"
              rx="9"
              ry="11"
              fill="#ffffff"
              stroke="#b5bcc0"
              strokeWidth="1.5"
            />
            <ellipse cx="-2" cy="-3" rx="4" ry="5" fill="#f8fafc" />
          </g>

          {/* 3. Wooden Lid Overhanging Cap (覆碗形微拱实木盖顶) */}
          <path
            d={`
              M 440 656
              C 440 648 480 634 540 634
              C 600 634 640 648 640 656
              L 640 662
              L 440 662
              Z
            `}
            fill="url(#woodLidGrad)"
            stroke="#2b261c"
            strokeWidth="2.0"
            strokeLinejoin="round"
          />
          <path
            d="M 458 650 Q 540 642 622 650"
            fill="none"
            stroke="#5c3818"
            strokeWidth="1.2"
            opacity="0.6"
          />
          <path
            d="M 474 656 Q 540 648 606 656"
            fill="none"
            stroke="#5c3818"
            strokeWidth="1.0"
            opacity="0.5"
          />

          {/* 4. Wooden Knob on Top (顶部实木珠钮) */}
          <ellipse
            cx={cx}
            cy="622"
            rx="16"
            ry="14"
            fill="url(#woodLidGrad)"
            stroke="#2b261c"
            strokeWidth="1.8"
          />
          <rect
            x={cx - 5}
            y="632"
            width="10"
            height="5"
            fill="#5c3818"
            stroke="#2b261c"
            strokeWidth="1"
          />
        </g>

        {/* ---------------------------------------------------- */}
        {/* STAGE 1: 3 GOLDEN LIGHT BEAMS & HIGH-IMPACT DEFLECTION */}
        {/* ---------------------------------------------------- */}
        {frame >= LIGHT_START_AT && (
          <g id="lightRefractionStage">
            {/* Three Incoming Beams */}
            {[
              { startX: 110, startY: 440, hitX: 414, hitY: 735, delay: 0 },
              { startX: 85, startY: 495, hitX: 405, hitY: 778, delay: 2 },
              { startX: 110, startY: 555, hitX: 410, hitY: 822, delay: 1 },
            ].map((beam, idx) => {
              const bProg = spring({
                frame: frame - LIGHT_START_AT - beam.delay,
                fps,
                config: { damping: 16, stiffness: 100 },
              });
              const curX = interpolate(bProg, [0, 1], [beam.startX, beam.hitX], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const curY = interpolate(bProg, [0, 1], [beam.startY, beam.hitY], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

              return (
                <g key={idx}>
                  <line
                    x1={beam.startX}
                    y1={beam.startY}
                    x2={curX}
                    y2={curY}
                    stroke="rgba(255, 215, 60, 0.45)"
                    strokeWidth="20"
                    strokeLinecap="round"
                  />
                  <line
                    x1={beam.startX}
                    y1={beam.startY}
                    x2={curX}
                    y2={curY}
                    stroke="url(#sunBeamGrad)"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

            {/* Impact Flash & HIGH-DRAMA Reflected Beams (Triggered at LIGHT_IMPACT_AT) */}
            {impactProgress > 0.05 && (
              <g id="reflectedScatterBeams">
                {[
                  { hitX: 414, hitY: 735, refX: 65, refY: 385 },
                  { hitX: 405, hitY: 778, refX: 40, refY: 510 },
                  { hitX: 410, hitY: 822, refX: 75, refY: 635 },
                ].map((ref, idx) => {
                  const refProg = interpolate(impactProgress, [0, 0.85], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  });
                  const endX = interpolate(refProg, [0, 1], [ref.hitX, ref.refX]);
                  const endY = interpolate(refProg, [0, 1], [ref.hitY, ref.refY]);
                  const refAlpha = interpolate(impactProgress, [0, 0.25, 1], [0, 1, 0.9]);

                  return (
                    <g key={`ref-${idx}`} opacity={refAlpha}>
                      {/* Wide ambient golden beam glow */}
                      <line
                        x1={ref.hitX}
                        y1={ref.hitY}
                        x2={endX}
                        y2={endY}
                        stroke="rgba(255, 225, 100, 0.42)"
                        strokeWidth="24"
                        strokeLinecap="round"
                      />
                      {/* Rich golden gradient deflected beam */}
                      <line
                        x1={ref.hitX}
                        y1={ref.hitY}
                        x2={endX}
                        y2={endY}
                        stroke="url(#reflectedBeamGrad)"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      {/* Intense white-hot central core line */}
                      <line
                        x1={ref.hitX}
                        y1={ref.hitY}
                        x2={endX}
                        y2={endY}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        opacity={0.88}
                      />
                      {/* Primary impact halo */}
                      <circle
                        cx={ref.hitX}
                        cy={ref.hitY}
                        r={interpolate(impactProgress, [0, 0.35, 1], [0, 38, 20])}
                        fill="none"
                        stroke="rgba(255, 240, 160, 0.88)"
                        strokeWidth="2.5"
                      />
                      {/* Glaze surface hotspot */}
                      <circle
                        cx={ref.hitX}
                        cy={ref.hitY}
                        r={interpolate(impactProgress, [0, 0.25, 1], [0, 22, 14])}
                        fill="rgba(255, 255, 220, 0.96)"
                      />
                      {/* Diamond star flare rotating on impact */}
                      <path
                        d={`
                          M ${ref.hitX} ${ref.hitY - 26}
                          Q ${ref.hitX} ${ref.hitY} ${ref.hitX + 26} ${ref.hitY}
                          Q ${ref.hitX} ${ref.hitY} ${ref.hitX} ${ref.hitY + 26}
                          Q ${ref.hitX} ${ref.hitY} ${ref.hitX - 26} ${ref.hitY}
                          Z
                        `}
                        fill="rgba(255, 255, 255, 0.95)"
                        transform={`rotate(${idx * 30 + frame * 3.5} ${ref.hitX} ${ref.hitY}) scale(${interpolate(
                          impactProgress,
                          [0, 0.28, 1],
                          [0, 1.25, 0.7]
                        )})`}
                      />
                    </g>
                  );
                })}

                {/* Concentric Optical Refraction Shockwaves radiating off the glazed porcelain */}
                {hitOrigins.map((pt, sIdx) => {
                  const sDelta = frame - LIGHT_IMPACT_AT - sIdx * 1.5;
                  if (sDelta < 0 || sDelta > 20) return null;
                  const ringP = sDelta / 20;
                  const ringR1 = ringP * 54;
                  const ringR2 = ringP * 30;
                  const ringAlpha = (1 - ringP) * 0.82;
                  return (
                    <g key={`shock-${sIdx}`}>
                      <ellipse
                        cx={pt.x}
                        cy={pt.y}
                        rx={ringR1}
                        ry={ringR1 * 0.85}
                        fill="none"
                        stroke="rgba(255, 245, 180, 0.9)"
                        strokeWidth={Math.max(0.5, (1 - ringP) * 3)}
                        opacity={ringAlpha}
                      />
                      <ellipse
                        cx={pt.x}
                        cy={pt.y}
                        rx={ringR2}
                        ry={ringR2 * 0.85}
                        fill="none"
                        stroke="rgba(255, 215, 60, 0.7)"
                        strokeWidth={1.4}
                        opacity={ringAlpha}
                      />
                    </g>
                  );
                })}

                {/* 28 Dynamic, Curved Ballistic Refraction Particles with trails and star glints */}
                {REFRACT_PARTICLES.map((pt) => {
                  const pFrame = frame - LIGHT_IMPACT_AT - pt.delay;
                  if (pFrame < 0 || pFrame > pt.life) return null;

                  const prog = pFrame / pt.life;
                  // Explosive impulse onset with smooth fluid deceleration
                  const easeProg = 1 - Math.pow(1 - prog, 2.3);
                  // Ballistic arc (graceful parabolic curvature)
                  const arc = Math.sin(prog * Math.PI);
                  // Dynamic atmospheric turbulence / wavy drift
                  const wobbleX = Math.sin(prog * pt.wobbleFreq) * pt.wobbleAmp;
                  const wobbleY = Math.cos(prog * pt.wobbleFreq) * (pt.wobbleAmp * 0.65);

                  const origin = hitOrigins[pt.originIdx];
                  const curX = origin.x + pt.vx * easeProg + pt.curveX * arc + wobbleX;
                  const curY = origin.y + pt.vy * easeProg + pt.curveY * arc + wobbleY;

                  // Luminous motion streak tail
                  const tailProg = Math.max(0, prog - 0.16);
                  const tailEase = 1 - Math.pow(1 - tailProg, 2.3);
                  const tailArc = Math.sin(tailProg * Math.PI);
                  const tailX = origin.x + pt.vx * tailEase + pt.curveX * tailArc;
                  const tailY = origin.y + pt.vy * tailEase + pt.curveY * tailArc;

                  // Dynamic alpha fade & twinkle
                  const alpha =
                    Math.min(1, prog / 0.14) *
                    Math.max(0, 1 - Math.pow(prog, 2.6)) *
                    (0.85 + 0.15 * Math.sin(pFrame * 1.6));

                  const curR =
                    pt.size *
                    interpolate(prog, [0, 0.25, 0.8, 1], [0.8, 1.25, 0.9, 0.35], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });

                  return (
                    <g key={`ref-pt-${pt.id}`} opacity={alpha}>
                      {/* 1. Motion streak comet trail */}
                      {pt.hasTrail && (
                        <line
                          x1={tailX}
                          y1={tailY}
                          x2={curX}
                          y2={curY}
                          stroke={pt.color}
                          strokeWidth={Math.max(1, curR * 0.75)}
                          strokeLinecap="round"
                          opacity={0.8}
                        />
                      )}

                      {/* 2. Soft luminous outer halo */}
                      <circle cx={curX} cy={curY} r={curR * 2.2} fill={pt.glowColor} />

                      {/* 3. Core glowing spark */}
                      <circle cx={curX} cy={curY} r={curR} fill={pt.color} />

                      {/* 4. White-hot diamond spark center */}
                      <circle cx={curX} cy={curY} r={curR * 0.45} fill="#ffffff" />

                      {/* 5. 4-pointed diamond star flare for high-energy sparkles */}
                      {pt.isStar && (
                        <path
                          d={`
                            M ${curX} ${curY - curR * 2.5}
                            Q ${curX} ${curY} ${curX + curR * 2.5} ${curY}
                            Q ${curX} ${curY} ${curX} ${curY + curR * 2.5}
                            Q ${curX} ${curY} ${curX - curR * 2.5} ${curY}
                            Z
                          `}
                          fill="#ffffff"
                          opacity={0.92}
                          transform={`rotate(${pFrame * 7 + pt.id * 32} ${curX} ${curY})`}
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        )}

        {/* ---------------------------------------------------- */}
        {/* LEADER CONNECTING LINES (标引连接线) */}
        {/* ---------------------------------------------------- */}

        {/* 1. TOP LEADER LINE: From Top Stamp down to Silicone Sealing Gaskets */}
        {stampSealProgress > 0.05 && (
          <g id="topSealLeaderLine" opacity={interpolate(stampSealProgress, [0, 0.4, 1], [0, 1, 1])}>
            <line
              x1={topStampPos.x}
              y1={topStampPos.y + 44 * fontScale}
              x2={topStampPos.x}
              y2={636 + lidYOffset * 0.3}
              stroke="#a33226"
              strokeWidth="2.2"
              strokeDasharray="4 3"
            />
            <line
              x1={474}
              y1={636 + lidYOffset * 0.3}
              x2={606}
              y2={636 + lidYOffset * 0.3}
              stroke="#a33226"
              strokeWidth="2.0"
            />
            <line
              x1={474}
              y1={636 + lidYOffset * 0.3}
              x2={474}
              y2={665 + lidYOffset}
              stroke="#a33226"
              strokeWidth="2.0"
            />
            <line
              x1={606}
              y1={636 + lidYOffset * 0.3}
              x2={606}
              y2={665 + lidYOffset}
              stroke="#a33226"
              strokeWidth="2.0"
            />
            <circle cx="474" cy={665 + lidYOffset} r="4.5" fill="#a33226" />
            <circle cx="474" cy={665 + lidYOffset} r="8.0" fill="none" stroke="#a33226" strokeWidth="1.2" />
            <circle cx="606" cy={665 + lidYOffset} r="4.5" fill="#a33226" />
            <circle cx="606" cy={665 + lidYOffset} r="8.0" fill="none" stroke="#a33226" strokeWidth="1.2" />
          </g>
        )}

        {/* 2. BOTTOM LEADER LINE: From Bottom Stamp up to Jar Light Deflection Wall */}
        {stampLightProgress > 0.05 && (
          <g id="bottomLightLeaderLine" opacity={interpolate(stampLightProgress, [0, 0.4, 1], [0, 1, 1])}>
            <path
              d={`
                M ${bottomStampPos.x} ${bottomStampPos.y - 44 * fontScale}
                L ${bottomStampPos.x} 1060
                L 410 880
                L 405 780
              `}
              fill="none"
              stroke="#a33226"
              strokeWidth="2.4"
              strokeDasharray="5 3"
            />
            <circle cx="405" cy="780" r="5" fill="#a33226" />
            <circle cx="405" cy="780" r="9.5" fill="none" stroke="#a33226" strokeWidth="1.4" />
          </g>
        )}
      </svg>

      {/* ---------------------------------------------------- */}
      {/* VERTICAL LARGE STAMPS (排在上下，随字号滑块实时动态缩放) */}
      {/* ---------------------------------------------------- */}

      {/* TOP STAMP: 密封 ✔ (Stage 2 @ 2.8s) */}
      <LargeSealStamp
        x={topStampPos.x}
        y={topStampPos.y}
        text={sealStampText}
        visibleProgress={stampSealProgress}
        fontScale={fontScale}
      />

      {/* BOTTOM STAMP: 避光 ✔ (Stage 1 @ 1.25s) */}
      <LargeSealStamp
        x={bottomStampPos.x}
        y={bottomStampPos.y}
        text={lightStampText}
        visibleProgress={stampLightProgress}
        fontScale={fontScale}
      />
    </div>
  );
}
