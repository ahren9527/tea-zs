import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FONT_SONG } from "@/remotion/shared/theme";
import { usePaperColors, useFontSizeScale, useCustomTexts } from "@/remotion/shared/paper";
import {
  AROMA_LEAK_START,
  AROMA_SEAL_START,
  LEADER_LINE_START,
  LEAF_WITHER_FULL,
  LEAF_WITHER_START,
  LEFT_DEFLECT_PARTICLES,
  LEFT_STAMP_DEFAULT,
  LIGHT_IMPACT_AT,
  LIGHT_START_AT,
  RIGHT_AROMA_LEAK_PARTICLES,
  RIGHT_STAMP_DEFAULT,
  STAMP_POP_AT,
  sfxHits,
} from "./data";

type Props = {
  customTexts?: Record<string, string>;
  staggerFrames?: number;
  fontScale?: number;
};

// Four Corner L-Brackets in Classical Song Dynasty Bookplate Style
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
      {/* Outer bookplate borders */}
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
      {/* Classical Song-style L-brackets */}
      <path d="M 38 80 L 38 50 L 68 50" fill="none" stroke={strokeColor} strokeWidth="2.4" opacity="0.32" />
      <path d="M 1042 80 L 1042 50 L 1012 50" fill="none" stroke={strokeColor} strokeWidth="2.4" opacity="0.32" />
      <path d="M 38 1840 L 38 1870 L 68 1870" fill="none" stroke={strokeColor} strokeWidth="2.4" opacity="0.32" />
      <path d="M 1042 1840 L 1042 1870 L 1012 1870" fill="none" stroke={strokeColor} strokeWidth="2.4" opacity="0.32" />
    </svg>
  );
}

// Classical Seal Stamp Component with Leader Line Anchor
function DuelStampBadge({
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

  const baseScale = interpolate(visibleProgress, [0, 0.7, 1], [1.36, 0.95, 1], {
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
  const textLetterSpacing = interpolate(visibleProgress, [0.1, 0.85], [0.14, 0.08], {
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
          border: "3px solid #a33226",
          borderRadius: 8,
          padding: "12px 24px",
          backgroundColor: "#fdfbf6",
          // 剔除漂浮高投影，转为微弱压纸印痕与印泥边缘浸润
          boxShadow:
            "inset 0 0 14px rgba(163, 50, 38, 0.16), 0 1px 3px rgba(163, 50, 38, 0.22)",
          display: "flex",
          alignItems: "center",
          gap: 8,
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
            inset: 3.5,
            border: "1px dashed rgba(163, 50, 38, 0.5)",
            borderRadius: 5,
            pointerEvents: "none",
          }}
        />

        {/* Text with Ink-Bleed Transition (墨化出场) */}
        <span
          style={{
            fontFamily: FONT_SONG,
            fontSize: 38,
            fontWeight: 700,
            color: "#a33226",
            letterSpacing: `${textLetterSpacing.toFixed(3)}em`,
            textShadow: "0 1px 2px rgba(163, 50, 38, 0.22)",
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
// VECTOR TEA LEAVES (支持色值由嫩绿渐变至焦黄灰褐)
// ----------------------------------------------------

// 1. Single Silver Needle (白毫银针)
function SilverNeedleLeaf({
  x,
  y,
  rot = 0,
  scale = 1,
  bodyColor = "#4d6741",
  furColor = "#edf5ea",
  strokeColor = "#283a21",
}: {
  x: number;
  y: number;
  rot?: number;
  scale?: number;
  bodyColor?: string;
  furColor?: string;
  strokeColor?: string;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${scale})`}>
      <path
        d="M 0 -22 C 3.2 -12 2.8 5 0 15 C -2.8 5 -3.2 -12 0 -22 Z"
        fill={bodyColor}
        stroke={strokeColor}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d="M -0.4 -19 Q 0.4 -4 0.4 11"
        stroke={furColor}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="0" cy="-21" r="0.7" fill="#ffffff" />
    </g>
  );
}

// 2. White Peony Leaf Blade (白牡丹自然叶片)
function PeonyLeafBlade({
  x,
  y,
  rot = 0,
  scale = 1,
  bodyColor = "#4c6340",
  veinColor = "#334629",
  curlColor = "#bacfb1",
  witherTipColor = "#6b5336",
}: {
  x: number;
  y: number;
  rot?: number;
  scale?: number;
  bodyColor?: string;
  veinColor?: string;
  curlColor?: string;
  witherTipColor?: string;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${scale})`}>
      <path
        d="M -20 5 C -25 -3 -20 -16 -9 -20 C 2 -24 16 -15 20 -3 C 15 9 2 14 -13 11 C -16 9 -18 7 -20 5 Z"
        fill={bodyColor}
        stroke="#27391f"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d="M -18 5 Q 0 -5 18 -3"
        fill="none"
        stroke={veinColor}
        strokeWidth="0.8"
        opacity="0.85"
      />
      <path
        d="M -15 -16 C -4 -12 7 -5 16 -1 C 11 3 2 1 -7 -5 Z"
        fill={curlColor}
        stroke="#27391f"
        strokeWidth="0.5"
        opacity="0.9"
      />
      <path
        d="M 16 -5 C 20 -2 19 2 15 4 Z"
        fill={witherTipColor}
        stroke="#42311c"
        strokeWidth="0.5"
      />
    </g>
  );
}

// Linear color interpolation helper between two hex colors
function lerpHex(hex1: string, hex2: string, t: number): string {
  const clampedT = Math.max(0, Math.min(1, t));
  const parse = (c: string) => {
    const raw = c.replace("#", "");
    return [
      parseInt(raw.substring(0, 2), 16),
      parseInt(raw.substring(2, 4), 16),
      parseInt(raw.substring(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  const r = Math.round(r1 + (r2 - r1) * clampedT);
  const g = Math.round(g1 + (g2 - g1) * clampedT);
  const b = Math.round(b1 + (b2 - b1) * clampedT);
  return `rgb(${r}, ${g}, ${b})`;
}

export function Comp(props: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const colors = usePaperColors();
  const fontScale = useFontSizeScale(props.fontScale);
  const customTexts = useCustomTexts(props.customTexts);

  const leftStampText = customTexts.leftStamp || LEFT_STAMP_DEFAULT;
  const rightStampText = customTexts.rightStamp || RIGHT_STAMP_DEFAULT;

  // ----------------------------------------------------
  // Stage 1 Physics: Light & Gas Dual Test
  // ----------------------------------------------------
  const lightProgress = spring({
    frame: frame - LIGHT_START_AT,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  const impactDelta = frame - LIGHT_IMPACT_AT;
  const impactProgress = spring({
    frame: impactDelta,
    fps,
    config: { damping: 16, stiffness: 140 },
  });

  // Left Jar Elastic Bounce on impact (轻微回弹)
  let leftJarScaleX = 1.0;
  let leftJarScaleY = 1.0;
  let leftJarRecoilX = 0.0;
  if (impactDelta >= 0) {
    const decay = Math.exp(-impactDelta * 0.14);
    const pop = Math.exp(-Math.pow(impactDelta - 2.0, 2) / 7.5) * 0.07;
    const osc = Math.sin(impactDelta * 0.44) * 0.04 * decay;
    leftJarScaleX = 1.0 + pop + osc;
    leftJarScaleY = 1.0 + pop * 0.8 - osc * 0.55;
    leftJarRecoilX = Math.sin(impactDelta * 0.46) * 3.8 * decay;
  }

  // Right Jar Leaves Wither Progress (#6D7B4E -> #8A7258)
  const witherProgress = interpolate(
    frame,
    [LEAF_WITHER_START, LEAF_WITHER_FULL],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const rightLeafBodyColor = lerpHex("#6D7B4E", "#8A7258", witherProgress);
  const rightLeafVeinColor = lerpHex("#46552f", "#5c4832", witherProgress);
  const rightLeafCurlColor = lerpHex("#b5c9a9", "#a8967f", witherProgress);
  const rightNeedleFurColor = lerpHex("#edf5ea", "#cfbfab", witherProgress);

  // Left Jar Aroma Protective Dome Breathing
  const sealDelta = frame - AROMA_SEAL_START;
  const sealBreath = sealDelta > 0 ? Math.sin(sealDelta * 0.08) : 0;
  const sealDomeScale = 1.0 + sealBreath * 0.045;
  const sealDomeOpacity =
    sealDelta < 0
      ? 0
      : Math.min(0.72, (sealDelta / 15) * 0.72) * (1 + sealBreath * 0.1);

  // Stage 2: Leader Lines & Stamp Badges
  const leaderProgress = spring({
    frame: frame - LEADER_LINE_START,
    fps,
    config: { damping: 18, stiffness: 130 },
  });

  const stampProgress = spring({
    frame: frame - STAMP_POP_AT,
    fps,
    config: { damping: 14, stiffness: 140 },
  });

  // Coordinates
  const leftJar = { cx: 330, cy: 890, rx: 90, ry: 125 };
  const rightJar = { cx: 750, cy: 890, rx: 90, ry: 125 };

  // Impact points
  const leftImpact = { x: 242, y: 852 };
  const rightImpact = { x: 662, y: 852 };

  // Sunbeam start points
  const leftBeamStart = { x: 90, y: 620 };
  const rightBeamStart = { x: 510, y: 620 };

  // Stamp badge positions: staggered vertically (左高右低) to guarantee zero overlap for any text length
  const leftStampPos = { x: 330, y: 1220 };
  const rightStampPos = { x: 750, y: 1375 };

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

      {/* Main Vector Scene */}
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
          {/* Ground Soft Shadows */}
          <radialGradient id="jarShadowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(43, 38, 28, 0.28)" />
            <stop offset="70%" stopColor="rgba(43, 38, 28, 0.08)" />
            <stop offset="100%" stopColor="rgba(43, 38, 28, 0)" />
          </radialGradient>

          {/* Left Jar: Deep Green Solid Outer Glaze (深绿坚实外壁) */}
          <linearGradient id="deepGreenGlaze" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#193725" />
            <stop offset="25%" stopColor="#2c5c40" />
            <stop offset="55%" stopColor="#224832" />
            <stop offset="85%" stopColor="#183624" />
            <stop offset="100%" stopColor="#0f2418" />
          </linearGradient>

          {/* Left Jar Porcelain Biscuit (致密胎体) */}
          <linearGradient id="porcelainBiscuit" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#eee8dc" />
            <stop offset="50%" stopColor="#ded5c5" />
            <stop offset="100%" stopColor="#cfc4b0" />
          </linearGradient>

          {/* Left Jar Dark Sanctuary Cavity (内部避光内膛) */}
          <radialGradient id="leftDarkCavity" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#1a251f" />
            <stop offset="70%" stopColor="#101713" />
            <stop offset="100%" stopColor="#080c0a" />
          </radialGradient>

          {/* Left Jar Protective Aroma Glow Dome (淡绿锁香能量光罩) */}
          <radialGradient id="aromaDomeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(142, 212, 162, 0.65)" />
            <stop offset="60%" stopColor="rgba(102, 185, 126, 0.32)" />
            <stop offset="90%" stopColor="rgba(80, 160, 105, 0.12)" />
            <stop offset="100%" stopColor="rgba(60, 140, 85, 0)" />
          </radialGradient>

          {/* Left Jar Lid Brass / Dense Wood */}
          <linearGradient id="leftLidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4a3726" />
            <stop offset="35%" stopColor="#694e36" />
            <stop offset="75%" stopColor="#553f2c" />
            <stop offset="100%" stopColor="#3d2c1e" />
          </linearGradient>

          {/* Right Jar Glass Wall Gradient (半透明磨砂玻璃) */}
          <linearGradient id="glassWallGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(215, 205, 190, 0.45)" />
            <stop offset="25%" stopColor="rgba(245, 240, 230, 0.22)" />
            <stop offset="55%" stopColor="rgba(215, 205, 190, 0.15)" />
            <stop offset="85%" stopColor="rgba(235, 225, 210, 0.35)" />
            <stop offset="100%" stopColor="rgba(200, 190, 175, 0.55)" />
          </linearGradient>

          {/* Right Jar Purple Clay Collar & Base (紫砂微孔质感) */}
          <linearGradient id="purpleClayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#623b2e" />
            <stop offset="40%" stopColor="#845242" />
            <stop offset="75%" stopColor="#704335" />
            <stop offset="100%" stopColor="#522f24" />
          </linearGradient>

          {/* Sunbeam Light Gradient */}
          <linearGradient id="sunbeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 245, 170, 0.98)" />
            <stop offset="60%" stopColor="rgba(255, 215, 80, 0.85)" />
            <stop offset="100%" stopColor="rgba(255, 185, 40, 0.72)" />
          </linearGradient>

          {/* Reflected Beam Gradient (Deflected upward-left from Left Jar) */}
          <linearGradient id="deflectBeamGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 220, 0.98)" />
            <stop offset="40%" stopColor="rgba(255, 220, 100, 0.88)" />
            <stop offset="100%" stopColor="rgba(255, 190, 40, 0.15)" />
          </linearGradient>

          {/* Penetrating Scorching Light Glow Inside Right Jar */}
          <radialGradient id="scorchingLightGrad" cx="40%" cy="45%" r="65%">
            <stop offset="0%" stopColor="rgba(255, 248, 190, 0.85)" />
            <stop offset="45%" stopColor="rgba(255, 200, 80, 0.5)" />
            <stop offset="85%" stopColor="rgba(220, 140, 40, 0.22)" />
            <stop offset="100%" stopColor="rgba(180, 100, 20, 0)" />
          </radialGradient>
        </defs>

        {/* ---------------------------------------------------- */}
        {/* 1. CONTACT SHADOWS UNDER THE TWO JARS */}
        {/* ---------------------------------------------------- */}
        <ellipse
          cx={leftJar.cx + leftJarRecoilX * 0.7}
          cy={leftJar.cy + leftJar.ry + 8}
          rx={leftJar.rx * 1.05 * leftJarScaleX}
          ry={18 * leftJarScaleY}
          fill="url(#jarShadowGrad)"
          opacity={0.32 * (1 + (leftJarScaleX - 1) * 0.6)}
        />
        <ellipse
          cx={rightJar.cx}
          cy={rightJar.cy + rightJar.ry + 8}
          rx={rightJar.rx * 1.05}
          ry={18}
          fill="url(#jarShadowGrad)"
          opacity={0.28}
        />

        {/* ---------------------------------------------------- */}
        {/* 2. LEFT JAR: 内釉瓷罐 / 铁罐 (深绿坚实外壁，质感致密) */}
        {/* ---------------------------------------------------- */}
        <g
          id="leftCanister"
          transform={`translate(${leftJar.cx + leftJarRecoilX}, ${leftJar.cy}) scale(${leftJarScaleX}, ${leftJarScaleY}) translate(${-leftJar.cx}, ${-leftJar.cy})`}
        >
          {/* A. Outer Solid Deep Green Glazed Body (深绿坚实外壁) */}
          <path
            d={`
              M ${leftJar.cx - 72} ${leftJar.cy - 110}
              L ${leftJar.cx + 72} ${leftJar.cy - 110}
              C ${leftJar.cx + 94} ${leftJar.cy - 70}, ${leftJar.cx + 96} ${leftJar.cy + 50}, ${leftJar.cx + 78} ${leftJar.cy + 115}
              L ${leftJar.cx - 78} ${leftJar.cy + 115}
              C ${leftJar.cx - 96} ${leftJar.cy + 50}, ${leftJar.cx - 94} ${leftJar.cy - 70}, ${leftJar.cx - 72} ${leftJar.cy - 110}
              Z
            `}
            fill="url(#deepGreenGlaze)"
            stroke="#0b1b11"
            strokeWidth="2.5"
          />

          {/* B. Dense Porcelain Biscuit Layer (剖面显露致密白瓷/铁体胎骨) */}
          <path
            d={`
              M ${leftJar.cx - 62} ${leftJar.cy - 104}
              L ${leftJar.cx + 62} ${leftJar.cy - 104}
              C ${leftJar.cx + 80} ${leftJar.cy - 65}, ${leftJar.cx + 82} ${leftJar.cy + 45}, ${leftJar.cx + 66} ${leftJar.cy + 104}
              L ${leftJar.cx - 66} ${leftJar.cy + 104}
              C ${leftJar.cx - 82} ${leftJar.cy + 45}, ${leftJar.cx - 80} ${leftJar.cy - 65}, ${leftJar.cx - 62} ${leftJar.cy - 104}
              Z
            `}
            fill="url(#porcelainBiscuit)"
            stroke="#3a4f40"
            strokeWidth="1.2"
          />

          {/* C. Inner Dark Tea Cavity (避光内膛，零光线泄入) */}
          <path
            d={`
              M ${leftJar.cx - 52} ${leftJar.cy - 96}
              L ${leftJar.cx + 52} ${leftJar.cy - 96}
              C ${leftJar.cx + 68} ${leftJar.cy - 60}, ${leftJar.cx + 70} ${leftJar.cy + 40}, ${leftJar.cx + 56} ${leftJar.cy + 94}
              L ${leftJar.cx - 56} ${leftJar.cy + 94}
              C ${leftJar.cx - 70} ${leftJar.cy + 40}, ${leftJar.cx - 68} ${leftJar.cy - 60}, ${leftJar.cx - 52} ${leftJar.cy - 96}
              Z
            `}
            fill="url(#leftDarkCavity)"
          />

          {/* D. Glaze Specular Highlight on Left Canister */}
          <path
            d={`
              M ${leftJar.cx - 78} ${leftJar.cy - 60}
              C ${leftJar.cx - 86} ${leftJar.cy - 10}, ${leftJar.cx - 84} ${leftJar.cy + 40}, ${leftJar.cx - 70} ${leftJar.cy + 85}
            `}
            fill="none"
            stroke="rgba(255, 255, 255, 0.42)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* E. Protected Fresh White Tea Leaves Inside (嫩绿饱满白茶) */}
          <g id="leftJarLeaves">
            <PeonyLeafBlade x={leftJar.cx - 18} y={leftJar.cy + 52} rot={-22} scale={0.95} />
            <PeonyLeafBlade x={leftJar.cx + 15} y={leftJar.cy + 56} rot={28} scale={0.9} />
            <PeonyLeafBlade x={leftJar.cx - 4} y={leftJar.cy + 68} rot={6} scale={1.05} />
            <SilverNeedleLeaf x={leftJar.cx - 28} y={leftJar.cy + 36} rot={-38} scale={1.05} />
            <SilverNeedleLeaf x={leftJar.cx + 26} y={leftJar.cy + 38} rot={42} scale={1.0} />
            <SilverNeedleLeaf x={leftJar.cx - 2} y={leftJar.cy + 22} rot={-8} scale={1.15} />
          </g>

          {/* F. Protective Soft Green Aroma Energy Dome (淡绿锁香能量光罩) */}
          {sealDomeOpacity > 0.01 && (
            <ellipse
              cx={leftJar.cx}
              cy={leftJar.cy + 45}
              rx={52 * sealDomeScale}
              ry={50 * sealDomeScale}
              fill="url(#aromaDomeGrad)"
              opacity={sealDomeOpacity}
            />
          )}

          {/* G. Tight Silicone Gasket Ring (严密压实密封圈) */}
          <rect
            x={leftJar.cx - 52}
            y={leftJar.cy - 103}
            width={104}
            height={9}
            rx={4.5}
            fill="#d8e8dc"
            stroke="#4e6f57"
            strokeWidth="1.2"
          />
          {/* Compressed silicone bead indicators */}
          <circle cx={leftJar.cx - 42} cy={leftJar.cy - 98.5} r={3} fill="#a7c9b2" />
          <circle cx={leftJar.cx + 42} cy={leftJar.cy - 98.5} r={3} fill="#a7c9b2" />

          {/* H. Solid Heavy Canister Lid */}
          <rect
            x={leftJar.cx - 76}
            y={leftJar.cy - 126}
            width={152}
            height={24}
            rx={6}
            fill="url(#leftLidGrad)"
            stroke="#1c140d"
            strokeWidth="2.0"
          />
          {/* Lid brass knob */}
          <ellipse
            cx={leftJar.cx}
            cy={leftJar.cy - 132}
            rx={16}
            ry={8}
            fill="#a6844b"
            stroke="#5c4521"
            strokeWidth="1.4"
          />
        </g>

        {/* ---------------------------------------------------- */}
        {/* 3. RIGHT JAR: 紫砂 / 透明玻璃复合罐 (微孔半透明，跑香见光) */}
        {/* ---------------------------------------------------- */}
        <g id="rightCanister">
          {/* A. Internal Tea Chamber Background (微灰半透) */}
          <path
            d={`
              M ${rightJar.cx - 70} ${rightJar.cy - 110}
              L ${rightJar.cx + 70} ${rightJar.cy - 110}
              C ${rightJar.cx + 92} ${rightJar.cy - 70}, ${rightJar.cx + 94} ${rightJar.cy + 50}, ${rightJar.cx + 76} ${rightJar.cy + 115}
              L ${rightJar.cx - 76} ${rightJar.cy + 115}
              C ${rightJar.cx - 94} ${rightJar.cy + 50}, ${rightJar.cx - 92} ${rightJar.cy - 70}, ${rightJar.cx - 70} ${rightJar.cy - 110}
              Z
            `}
            fill="rgba(58, 48, 42, 0.45)"
          />

          {/* B. Scorching Sunbeam Penetration Zone inside Right Jar */}
          {impactProgress > 0.05 && (
            <g opacity={Math.min(1, impactProgress * 1.2)}>
              <polygon
                points={`
                  ${rightImpact.x},${rightImpact.y - 18}
                  ${rightImpact.x + 130},${rightImpact.y + 40}
                  ${rightImpact.x + 105},${rightImpact.y + 80}
                  ${rightImpact.x},${rightImpact.y + 22}
                `}
                fill="url(#scorchingLightGrad)"
              />
              {/* Internal direct ray beam path */}
              <line
                x1={rightImpact.x}
                y1={rightImpact.y}
                x2={rightImpact.x + 115}
                y2={rightImpact.y + 56}
                stroke="rgba(255, 235, 120, 0.65)"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <line
                x1={rightImpact.x}
                y1={rightImpact.y}
                x2={rightImpact.x + 115}
                y2={rightImpact.y + 56}
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity={0.85}
              />
            </g>
          )}

          {/* C. Withered Tea Leaves inside Right Jar (嫩绿 -> 焦黄枯萎灰褐) */}
          <g id="rightJarLeaves">
            <PeonyLeafBlade
              x={rightJar.cx - 18}
              y={rightJar.cy + 52}
              rot={-22}
              scale={0.95}
              bodyColor={rightLeafBodyColor}
              veinColor={rightLeafVeinColor}
              curlColor={rightLeafCurlColor}
            />
            <PeonyLeafBlade
              x={rightJar.cx + 15}
              y={rightJar.cy + 56}
              rot={28}
              scale={0.9}
              bodyColor={rightLeafBodyColor}
              veinColor={rightLeafVeinColor}
              curlColor={rightLeafCurlColor}
            />
            <PeonyLeafBlade
              x={rightJar.cx - 4}
              y={rightJar.cy + 68}
              rot={6}
              scale={1.05}
              bodyColor={rightLeafBodyColor}
              veinColor={rightLeafVeinColor}
              curlColor={rightLeafCurlColor}
            />
            <SilverNeedleLeaf
              x={rightJar.cx - 28}
              y={rightJar.cy + 36}
              rot={-38}
              scale={1.05}
              bodyColor={rightLeafBodyColor}
              furColor={rightNeedleFurColor}
            />
            <SilverNeedleLeaf
              x={rightJar.cx + 26}
              y={rightJar.cy + 38}
              rot={42}
              scale={1.0}
              bodyColor={rightLeafBodyColor}
              furColor={rightNeedleFurColor}
            />
            <SilverNeedleLeaf
              x={rightJar.cx - 2}
              y={rightJar.cy + 22}
              rot={-8}
              scale={1.15}
              bodyColor={rightLeafBodyColor}
              furColor={rightNeedleFurColor}
            />
          </g>

          {/* D. Translucent Frosted Glass Outer Wall (半透明玻璃外壁) */}
          <path
            d={`
              M ${rightJar.cx - 70} ${rightJar.cy - 110}
              L ${rightJar.cx + 70} ${rightJar.cy - 110}
              C ${rightJar.cx + 92} ${rightJar.cy - 70}, ${rightJar.cx + 94} ${rightJar.cy + 50}, ${rightJar.cx + 76} ${rightJar.cy + 115}
              L ${rightJar.cx - 76} ${rightJar.cy + 115}
              C ${rightJar.cx - 94} ${rightJar.cy + 50}, ${rightJar.cx - 92} ${rightJar.cy - 70}, ${rightJar.cx - 70} ${rightJar.cy - 110}
              Z
            `}
            fill="url(#glassWallGrad)"
            stroke="rgba(180, 160, 140, 0.65)"
            strokeWidth="2.0"
          />

          {/* Glass edge specular reflection line */}
          <path
            d={`
              M ${rightJar.cx - 76} ${rightJar.cy - 50}
              C ${rightJar.cx - 82} ${rightJar.cy}, ${rightJar.cx - 80} ${rightJar.cy + 50}, ${rightJar.cx - 68} ${rightJar.cy + 95}
            `}
            fill="none"
            stroke="rgba(255, 255, 255, 0.55)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />

          {/* E. Purple Clay Micro-Pore Accents on Jar Rim & Collar (紫砂细微磨砂微孔) */}
          <path
            d={`
              M ${rightJar.cx - 72} ${rightJar.cy - 114}
              L ${rightJar.cx + 72} ${rightJar.cy - 114}
              L ${rightJar.cx + 70} ${rightJar.cy - 100}
              L ${rightJar.cx - 70} ${rightJar.cy - 100}
              Z
            `}
            fill="url(#purpleClayGrad)"
            stroke="#47261c"
            strokeWidth="1.2"
          />

          {/* Stippled micro-pores in the clay */}
          {Array.from({ length: 18 }, (_, idx) => {
            const px = rightJar.cx - 60 + idx * 7;
            const py = rightJar.cy - 107 + (idx % 3) * 3;
            return <circle key={`pore-${idx}`} cx={px} cy={py} r={1.0} fill="#3d2017" opacity={0.7} />;
          })}

          {/* F. Purple Clay Unglazed Lid (无致密胶圈，孔隙粗大) */}
          <rect
            x={rightJar.cx - 74}
            y={rightJar.cy - 126}
            width={148}
            height={20}
            rx={5}
            fill="url(#purpleClayGrad)"
            stroke="#47261c"
            strokeWidth="2.0"
          />
          <ellipse
            cx={rightJar.cx}
            cy={rightJar.cy - 131}
            rx={14}
            ry={7}
            fill="#522f24"
            stroke="#3a1d15"
            strokeWidth="1.2"
          />

          {/* G. Continuous Aroma Leakage ("跑香"烟雾与微粒逸散动效) */}
          {frame >= AROMA_LEAK_START && (
            <g id="aromaLeakWisps">
              {/* Wafting smoke curves escaping through clay pores & lid junction */}
              {[
                { x: rightJar.cx - 62, y: rightJar.cy - 108, dir: -1, phase: 0 },
                { x: rightJar.cx + 60, y: rightJar.cy - 108, dir: 1, phase: 2 },
                { x: rightJar.cx - 30, y: rightJar.cy - 124, dir: -1, phase: 4 },
                { x: rightJar.cx + 32, y: rightJar.cy - 124, dir: 1, phase: 1 },
              ].map((wisp, wIdx) => {
                const wDelta = frame - AROMA_LEAK_START + wisp.phase * 5;
                const wCycle = (wDelta % 45) / 45;
                const waftY = -wCycle * 110;
                const waftX = wisp.dir * Math.sin(wCycle * Math.PI * 2) * 24;
                const wAlpha = (1 - wCycle) * 0.75 * Math.min(1, (frame - AROMA_LEAK_START) / 12);

                return (
                  <path
                    key={`wisp-${wIdx}`}
                    d={`
                      M ${wisp.x} ${wisp.y}
                      Q ${wisp.x + waftX * 0.5} ${wisp.y + waftY * 0.5} ${wisp.x + waftX} ${wisp.y + waftY}
                    `}
                    fill="none"
                    stroke="rgba(142, 198, 152, 0.7)"
                    strokeWidth={2.4 * (1 - wCycle * 0.6)}
                    strokeLinecap="round"
                    opacity={wAlpha}
                  />
                );
              })}

              {/* Escaping drifting aroma particles */}
              {RIGHT_AROMA_LEAK_PARTICLES.map((pt) => {
                const leakDelta = frame - AROMA_LEAK_START + pt.phase * 6;
                if (leakDelta < 0) return null;
                const pProg = (leakDelta % 40) / 40;
                const curX =
                  rightJar.cx +
                  pt.originX +
                  pt.driftX * pProg +
                  Math.sin(leakDelta * pt.wobbleSpeed) * pt.wobbleAmp;
                const curY = rightJar.cy + pt.originY + pt.riseY * pProg;
                const pAlpha =
                  Math.min(1, pProg / 0.15) *
                  Math.max(0, 1 - Math.pow(pProg, 1.8)) *
                  0.75;
                const curR = pt.size * (0.8 + pProg * 0.6);

                return (
                  <g key={`leak-pt-${pt.id}`} opacity={pAlpha}>
                    <circle cx={curX} cy={curY} r={curR * 1.8} fill="rgba(160, 215, 175, 0.3)" />
                    <circle cx={curX} cy={curY} r={curR} fill="rgba(125, 190, 142, 0.7)" />
                    <circle cx={curX} cy={curY} r={curR * 0.4} fill="#ffffff" />
                  </g>
                );
              })}
            </g>
          )}
        </g>

        {/* ---------------------------------------------------- */}
        {/* 4. DUAL SUNBEAMS (0.5s - 2.5s) */}
        {/* ---------------------------------------------------- */}
        {lightProgress > 0.01 && (
          <g id="dualSunbeams">
            {/* --- Beam 1: Shoots toward Left Jar --- */}
            {(() => {
              const curX =
                leftBeamStart.x +
                (leftImpact.x - leftBeamStart.x) * Math.min(1, lightProgress);
              const curY =
                leftBeamStart.y +
                (leftImpact.y - leftBeamStart.y) * Math.min(1, lightProgress);

              return (
                <g id="leftIncomingBeam">
                  {/* Wide ambient gold glow */}
                  <line
                    x1={leftBeamStart.x}
                    y1={leftBeamStart.y}
                    x2={curX}
                    y2={curY}
                    stroke="rgba(255, 225, 100, 0.35)"
                    strokeWidth="26"
                    strokeLinecap="round"
                  />
                  {/* Searing beam core */}
                  <line
                    x1={leftBeamStart.x}
                    y1={leftBeamStart.y}
                    x2={curX}
                    y2={curY}
                    stroke="url(#sunbeamGrad)"
                    strokeWidth="8.5"
                    strokeLinecap="round"
                  />
                  {/* White-hot center line */}
                  <line
                    x1={leftBeamStart.x}
                    y1={leftBeamStart.y}
                    x2={curX}
                    y2={curY}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                </g>
              );
            })()}

            {/* --- Beam 2: Shoots toward Right Jar --- */}
            {(() => {
              const curX =
                rightBeamStart.x +
                (rightImpact.x - rightBeamStart.x) * Math.min(1, lightProgress);
              const curY =
                rightBeamStart.y +
                (rightImpact.y - rightBeamStart.y) * Math.min(1, lightProgress);

              return (
                <g id="rightIncomingBeam">
                  <line
                    x1={rightBeamStart.x}
                    y1={rightBeamStart.y}
                    x2={curX}
                    y2={curY}
                    stroke="rgba(255, 225, 100, 0.35)"
                    strokeWidth="26"
                    strokeLinecap="round"
                  />
                  <line
                    x1={rightBeamStart.x}
                    y1={rightBeamStart.y}
                    x2={curX}
                    y2={curY}
                    stroke="url(#sunbeamGrad)"
                    strokeWidth="8.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={rightBeamStart.x}
                    y1={rightBeamStart.y}
                    x2={curX}
                    y2={curY}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                </g>
              );
            })()}
          </g>
        )}

        {/* ---------------------------------------------------- */}
        {/* 5. LEFT JAR DEFLECTION & SCATTER (B4-1 极效折射系统) */}
        {/* ---------------------------------------------------- */}
        {impactProgress > 0.02 && (
          <g id="leftDeflectionSystem">
            {/* Deflected Beam Shooting Upward-Left */}
            {(() => {
              const defEndX = leftImpact.x + (-170) * impactProgress;
              const defEndY = leftImpact.y + (-130) * impactProgress;

              return (
                <g id="deflectedRay">
                  <line
                    x1={leftImpact.x}
                    y1={leftImpact.y}
                    x2={defEndX}
                    y2={defEndY}
                    stroke="rgba(255, 225, 100, 0.42)"
                    strokeWidth="24"
                    strokeLinecap="round"
                  />
                  <line
                    x1={leftImpact.x}
                    y1={leftImpact.y}
                    x2={defEndX}
                    y2={defEndY}
                    stroke="url(#deflectBeamGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <line
                    x1={leftImpact.x}
                    y1={leftImpact.y}
                    x2={defEndX}
                    y2={defEndY}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity={0.88}
                  />
                </g>
              );
            })()}

            {/* Concentric Glaze Shockwaves */}
            {impactDelta >= 0 && impactDelta < 22 && (
              <g id="glazeShockwaves">
                <ellipse
                  cx={leftImpact.x}
                  cy={leftImpact.y}
                  rx={(impactDelta / 22) * 50}
                  ry={(impactDelta / 22) * 44}
                  fill="none"
                  stroke="rgba(255, 245, 180, 0.88)"
                  strokeWidth={Math.max(0.5, (1 - impactDelta / 22) * 2.8)}
                  opacity={1 - impactDelta / 22}
                />
                <ellipse
                  cx={leftImpact.x}
                  cy={leftImpact.y}
                  rx={(impactDelta / 22) * 28}
                  ry={(impactDelta / 22) * 24}
                  fill="none"
                  stroke="rgba(255, 215, 60, 0.68)"
                  strokeWidth="1.4"
                  opacity={1 - impactDelta / 22}
                />
              </g>
            )}

            {/* Glaze Hotspot & Diamond Star Flare */}
            <circle
              cx={leftImpact.x}
              cy={leftImpact.y}
              r={interpolate(impactProgress, [0, 0.25, 1], [0, 20, 13])}
              fill="rgba(255, 255, 220, 0.96)"
            />
            <path
              d={`
                M ${leftImpact.x} ${leftImpact.y - 24}
                Q ${leftImpact.x} ${leftImpact.y} ${leftImpact.x + 24} ${leftImpact.y}
                Q ${leftImpact.x} ${leftImpact.y} ${leftImpact.x} ${leftImpact.y + 24}
                Q ${leftImpact.x} ${leftImpact.y} ${leftImpact.x - 24} ${leftImpact.y}
                Z
              `}
              fill="rgba(255, 255, 255, 0.95)"
              transform={`rotate(${frame * 3.5} ${leftImpact.x} ${leftImpact.y}) scale(${interpolate(
                impactProgress,
                [0, 0.28, 1],
                [0, 1.25, 0.72]
              )})`}
            />

            {/* 22 Dynamic Ballistic Refraction Particles */}
            {LEFT_DEFLECT_PARTICLES.map((pt) => {
              const pFrame = frame - LIGHT_IMPACT_AT - pt.delay;
              if (pFrame < 0 || pFrame > pt.life) return null;

              const prog = pFrame / pt.life;
              const easeProg = 1 - Math.pow(1 - prog, 2.3);
              const arc = Math.sin(prog * Math.PI);
              const wobbleX = Math.sin(prog * pt.wobbleFreq) * pt.wobbleAmp;
              const wobbleY = Math.cos(prog * pt.wobbleFreq) * (pt.wobbleAmp * 0.65);

              const curX = leftImpact.x + pt.vx * easeProg + pt.curveX * arc + wobbleX;
              const curY = leftImpact.y + pt.vy * easeProg + pt.curveY * arc + wobbleY;

              const tailProg = Math.max(0, prog - 0.16);
              const tailEase = 1 - Math.pow(1 - tailProg, 2.3);
              const tailArc = Math.sin(tailProg * Math.PI);
              const tailX = leftImpact.x + pt.vx * tailEase + pt.curveX * tailArc;
              const tailY = leftImpact.y + pt.vy * tailEase + pt.curveY * tailArc;

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
                <g key={`deflect-pt-${pt.id}`} opacity={alpha}>
                  {/* Motion streak comet trail */}
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
                  {/* Soft luminous outer halo */}
                  <circle cx={curX} cy={curY} r={curR * 2.2} fill={pt.glowColor} />
                  {/* Core glowing spark */}
                  <circle cx={curX} cy={curY} r={curR} fill={pt.color} />
                  {/* White-hot center */}
                  <circle cx={curX} cy={curY} r={curR * 0.45} fill="#ffffff" />
                  {/* 4-pointed diamond star flare */}
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

        {/* ---------------------------------------------------- */}
        {/* 6. LEADER CONNECTING DASHED LINES (红细虚线引线动效) */}
        {/* ---------------------------------------------------- */}
        {leaderProgress > 0.02 && (
          <g id="leaderLines" opacity={interpolate(leaderProgress, [0, 0.4, 1], [0, 1, 1])}>
            {/* Left Leader Line: From base of Left Canister down to Stamp Badge */}
            {(() => {
              const startX = leftJar.cx;
              const startY = leftJar.cy + leftJar.ry - 8;
              const targetY = leftStampPos.y - 32 * fontScale;
              const curY = startY + (targetY - startY) * leaderProgress;

              return (
                <g id="leftLeader">
                  <line
                    x1={startX}
                    y1={startY}
                    x2={startX}
                    y2={curY}
                    stroke="#a33226"
                    strokeWidth="2.4"
                    strokeDasharray="5 3.5"
                  />
                  {/* Top anchor circle on jar bottom */}
                  <circle cx={startX} cy={startY} r={4.5} fill="#a33226" />
                  <circle cx={startX} cy={startY} r={8.0} fill="none" stroke="#a33226" strokeWidth="1.2" />
                </g>
              );
            })()}

            {/* Right Leader Line: From base of Right Canister down to Stamp Badge */}
            {(() => {
              const startX = rightJar.cx;
              const startY = rightJar.cy + rightJar.ry - 8;
              const targetY = rightStampPos.y - 32 * fontScale;
              const curY = startY + (targetY - startY) * leaderProgress;

              return (
                <g id="rightLeader">
                  <line
                    x1={startX}
                    y1={startY}
                    x2={startX}
                    y2={curY}
                    stroke="#a33226"
                    strokeWidth="2.4"
                    strokeDasharray="5 3.5"
                  />
                  {/* Top anchor circle on jar bottom */}
                  <circle cx={startX} cy={startY} r={4.5} fill="#a33226" />
                  <circle cx={startX} cy={startY} r={8.0} fill="none" stroke="#a33226" strokeWidth="1.2" />
                </g>
              );
            })()}
          </g>
        )}
      </svg>

      {/* ---------------------------------------------------- */}
      {/* 7. DUAL STAMP BADGES (阶段二：米白底红框标牌，无裂纹，高低错落零重叠) */}
      {/* ---------------------------------------------------- */}

      {/* Left Stamp Badge: 「瓷·铁 锁香 ✔」 */}
      <DuelStampBadge
        x={leftStampPos.x}
        y={leftStampPos.y}
        text={leftStampText}
        visibleProgress={stampProgress}
        fontScale={fontScale}
      />

      {/* Right Stamp Badge: 「砂·玻 见光死 ✖」 */}
      <DuelStampBadge
        x={rightStampPos.x}
        y={rightStampPos.y}
        text={rightStampText}
        visibleProgress={stampProgress}
        fontScale={fontScale}
      />
    </div>
  );
}
