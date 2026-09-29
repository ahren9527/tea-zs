import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Paper, usePaperColors, useFontSizeScale, useCustomText } from "@/remotion/shared/paper";
import { POP_SPRING, breathOffset, popTransform } from "@/remotion/shared/breath";
import { SfxTrack } from "@/remotion/shared/sfx";
import { BIG_AT, FLOW_AT, FOOT_AT, LENGTH, SMALL_AT, TITLE_AT, sfxHits } from "./data";

// Unified classical Songti font family for pristine typographic harmony
const FONT_SONG = '"Noto Serif SC", "Songti SC", "Source Han Serif SC", STSong, serif';

// Authentic Hand-drawn Tea Leaf Sprout (一芽一叶)
function TeaSprout({
  x,
  y,
  scale = 1,
  rotation = 0,
  inkColor = "#2b261c",
}: {
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  inkColor?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
      {/* Tea stem (茶梗) */}
      <path
        d="M 0 16 Q 3 24 6 28"
        fill="none"
        stroke={inkColor}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Tender Bud (一芽 / 雀舌嫩芽) */}
      <path
        d="M -1 14 C -8 10 -15 2 -14 -12 C -10 -7 -4 3 -1 14 Z"
        fill="#5a804a"
        stroke={inkColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M -1 12 Q -8 3 -13 -10"
        fill="none"
        stroke="#334d28"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Main Tea Leaf (主展嫩叶) */}
      <path
        d="M 0 16 C -12 4 -12 -12 2 -26 C 14 -12 12 4 0 16 Z"
        fill="#446838"
        stroke={inkColor}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Main leaf central vein (主叶脉) */}
      <path
        d="M 0 16 Q 2 0 2 -24"
        fill="none"
        stroke="#283e20"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Side veins (侧叶脉) */}
      <path
        d="M 1 6 Q -4 1 -7 0"
        fill="none"
        stroke="#283e20"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 1 0 Q 5 -4 8 -5"
        fill="none"
        stroke="#283e20"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 2 -8 Q -2 -13 -5 -15"
        fill="none"
        stroke="#283e20"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Delicate leaf sheen/highlight */}
      <path
        d="M -3 10 C -8 2 -7 -8 0 -20"
        fill="none"
        stroke="#7ca868"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </g>
  );
}

// Graceful Single Tea Leaf (单片舒展茶叶)
function SingleTeaLeaf({
  x,
  y,
  scale = 1,
  rotation = 0,
  inkColor = "#2b261c",
}: {
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  inkColor?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
      {/* Stem */}
      <path
        d="M 0 14 Q 2 20 4 23"
        fill="none"
        stroke={inkColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Leaf Body */}
      <path
        d="M 0 14 C -10 3 -10 -10 1 -22 C 10 -10 9 3 0 14 Z"
        fill="#4d723e"
        stroke={inkColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Main Vein */}
      <path
        d="M 0 14 Q 1 0 1 -20"
        fill="none"
        stroke="#283e20"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Side Veins */}
      <path
        d="M 1 4 Q -3 0 -5 -1"
        fill="none"
        stroke="#283e20"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M 1 -3 Q 4 -7 6 -8"
        fill="none"
        stroke="#283e20"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </g>
  );
}

export function duration(_staggerFrames: number) {
  return LENGTH;
}

export function Comp({ staggerFrames }: { staggerFrames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = usePaperColors();
  const fontScale = useFontSizeScale();

  const titleText = useCustomText("title", "大罐存 · 小罐醒");
  const bigLabel = useCustomText("bigLabel", "大罐长期封存");
  const smallLabel = useCustomText("smallLabel", "小罐日常慢醒");
  const footText = useCustomText("foot", "分工明确 · 滋味常新");

  // Title spring
  const tLocal = frame - TITLE_AT;
  const tEnter = spring({ frame: tLocal, fps, config: POP_SPRING, durationInFrames: 18 });
  const tOp = interpolate(tLocal, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Big jar initial entrance (centered at first, matching reference)
  const bLocal = frame - BIG_AT;
  const bEnter = spring({ frame: bLocal, fps, config: POP_SPRING, durationInFrames: 20 });
  const bOp = interpolate(bLocal, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Small jar entrance / Transition to two-jar layout
  const sLocal = frame - SMALL_AT;
  const sEnter = spring({ frame: sLocal, fps, config: POP_SPRING, durationInFrames: 20 });
  const sOp = interpolate(sLocal, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Smooth slide from centered (X=540) to dual-layout (X=320)
  const shiftProgress = spring({
    frame: sLocal,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 65 },
    durationInFrames: 24,
  });
  const bigJarX = interpolate(shiftProgress, [0, 1], [540, 310]);
  const bigJarScale = interpolate(shiftProgress, [0, 1], [1.02, 0.92]);

  // Flow arrow spring
  const flLocal = frame - FLOW_AT;
  const flEnter = spring({ frame: flLocal, fps, config: POP_SPRING, durationInFrames: 16 });
  const flOp = interpolate(flLocal, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Footer punchline spring
  const ftLocal = frame - FOOT_AT;
  const ftEnter = spring({ frame: ftLocal, fps, config: POP_SPRING, durationInFrames: 18 });
  const ftOp = interpolate(ftLocal, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const breath = breathOffset(frame, fps);

  // Dynamic flow & tea leaf fluttering parameters
  const flowDashOffset = -frame * 2.2;
  const leafFlutter1 = Math.sin(frame * 0.16) * 10;
  const leafFlutter2 = Math.cos(frame * 0.14) * 8;
  const leafFlutter3 = Math.sin((frame + 12) * 0.18) * 12;
  const leafFloatY1 = Math.sin(frame * 0.12) * 4;
  const leafFloatY2 = Math.cos(frame * 0.15) * 5;
  const leafFloatY3 = Math.sin((frame + 20) * 0.13) * 4;

  // Bottom card interpolation: When centered vs when split
  const bigCardX = interpolate(shiftProgress, [0, 1], [540 - 270, 60]);
  const bigCardW = interpolate(shiftProgress, [0, 1], [540, 460]);

  return (
    <AbsoluteFill>
      <Paper />

      {/* Top Main Title Box - Classical Bookplate Title Plaque */}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 170,
          textAlign: "center",
          opacity: Math.max(0, tOp),
          transform: popTransform(Math.max(0, tEnter), breathOffset(tLocal, fps), 16, -2),
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: colors.paperDeep,
            color: colors.ink,
            padding: "16px 54px",
            borderRadius: 16,
            border: `3px solid ${colors.ink}`,
            fontFamily: FONT_SONG,
            fontSize: Math.round(64 * fontScale),
            fontWeight: 800,
            letterSpacing: "0.24em",
            textIndent: "0.24em",
            boxShadow: "0 8px 24px rgba(43,38,28,0.1), inset 0 0 0 3px rgba(43,38,28,0.06)",
          }}
        >
          {titleText}
        </div>
      </div>

      {/* Hand-drawn Tea Jars & SVG Scene */}
      <svg
        viewBox="0 0 1080 1920"
        width={1080}
        height={1920}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <defs>
          {/* Terracotta / Purple clay gradient for Big Jar (大罐·主仓) */}
          <linearGradient id="bigJarClay" x1="15%" y1="0%" x2="90%" y2="0%">
            <stop offset="0%" stopColor="#7a3618" />
            <stop offset="28%" stopColor="#b4633b" />
            <stop offset="68%" stopColor="#9a4f29" />
            <stop offset="100%" stopColor="#63260e" />
          </linearGradient>

          {/* Lid gradient for Big Jar */}
          <linearGradient id="bigLidClay" x1="20%" y1="0%" x2="85%" y2="0%">
            <stop offset="0%" stopColor="#692d13" />
            <stop offset="35%" stopColor="#9c4e25" />
            <stop offset="100%" stopColor="#541f0a" />
          </linearGradient>

          {/* Glaze gradient for Small Jar (小罐·醒茶) */}
          <linearGradient id="smallJarClay" x1="15%" y1="0%" x2="90%" y2="0%">
            <stop offset="0%" stopColor="#554235" />
            <stop offset="30%" stopColor="#7e6554" />
            <stop offset="70%" stopColor="#6b5343" />
            <stop offset="100%" stopColor="#443226" />
          </linearGradient>

          {/* Filter for subtle hand-drawn ceramic softness */}
          <filter id="clayShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
            <feOffset dx="0" dy="12" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.16" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ================= BIG JAR (手绘大陶罐 - 主仓存茶) ================= */}
        <g
          opacity={bOp}
          transform={`translate(${bigJarX} 910) scale(${Math.max(0, bEnter) * bigJarScale})`}
        >
          {/* Ground Soft Cast Shadow - Multi-tiered for realism */}
          <ellipse cx="0" cy="270" rx="190" ry="24" fill={colors.ink} opacity="0.08" />
          <ellipse cx="0" cy="270" rx="135" ry="16" fill={colors.ink} opacity="0.16" />

          {/* Jar Outer Body - Hand-drawn organic curved vase contour */}
          <path
            d="M -88 -190 C -135 -145 -188 -35 -188 75 C -188 175 -135 250 0 250 C 135 250 188 175 188 75 C 188 -35 135 -145 88 -190 Z"
            fill="url(#bigJarClay)"
            stroke={colors.ink}
            strokeWidth="6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Hand-drawn Left Shoulder Highlight Curve (陶罐自然高光反光) */}
          <path
            d="M -138 -50 C -156 15 -150 85 -118 170"
            fill="none"
            stroke="#f0b695"
            strokeWidth="9"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M -126 -30 C -140 25 -136 78 -110 145"
            fill="none"
            stroke="#fff2e8"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.35"
          />

          {/* Jar Neck / Collar */}
          <path
            d="M -92 -190 L -90 -210 Q 0 -216 90 -210 L 92 -190 Z"
            fill="#692d13"
            stroke={colors.ink}
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* Jar Lid Rim (Lip extending slightly over neck) */}
          <rect
            x="-106"
            y="-228"
            width="212"
            height="22"
            rx="7"
            fill="url(#bigLidClay)"
            stroke={colors.ink}
            strokeWidth="5"
          />

          {/* Jar Lid Dome (拱形手绘罐盖) */}
          <path
            d="M -98 -224 Q 0 -264 98 -224 Z"
            fill="url(#bigLidClay)"
            stroke={colors.ink}
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Jar Lid Knob (罐顶圆润提钮) */}
          <path
            d="M -9 -256 Q 0 -262 9 -256 L 7 -266 L -7 -266 Z"
            fill="#4a1c09"
            stroke={colors.ink}
            strokeWidth="3.5"
          />
          <circle
            cx="0"
            cy="-278"
            r="16"
            fill="#4a1c09"
            stroke={colors.ink}
            strokeWidth="4.5"
          />
          {/* Knob Highlight */}
          <path
            d="M -6 -285 A 10 10 0 0 1 2 -291"
            fill="none"
            stroke="#eab897"
            strokeWidth="2.8"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Traditional Cinnabar Seal '存' (朱红古朴印章) */}
          <g transform="translate(0 32)">
            <rect
              x="-64"
              y="-64"
              width="128"
              height="128"
              rx="14"
              fill={colors.seal}
              stroke="#faf6ee"
              strokeWidth="2.5"
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="#faf6ee"
              fontFamily={FONT_SONG}
              fontSize="72"
              fontWeight="900"
              letterSpacing="0.04em"
            >
              存
            </text>
          </g>

          {/* Scholar's Tea Label '主仓 · 封存' (传统文人茶签) */}
          <g transform="translate(0 135)">
            <rect
              x="-92"
              y="-19"
              width="184"
              height="40"
              rx="6"
              fill={colors.ink}
              opacity="0.1"
            />
            <rect
              x="-92"
              y="-21"
              width="184"
              height="40"
              rx="6"
              fill="#fbf9f4"
              stroke={colors.ink}
              strokeWidth="2.5"
            />
            <rect
              x="-87"
              y="-16"
              width="174"
              height="30"
              rx="3"
              fill="none"
              stroke={colors.ink}
              strokeWidth="0.8"
              opacity="0.3"
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill={colors.ink}
              fontFamily={FONT_SONG}
              fontSize="23"
              fontWeight="700"
              letterSpacing="0.14em"
            >
              主仓 · 封存
            </text>
          </g>
        </g>

        {/* Dynamic Transition Flow: Connecting Curved Arrow & Tea Leaves */}
        {shiftProgress > 0.05 && (
          <g opacity={flOp * shiftProgress}>
            {/* Subtle tea aroma wisp */}
            <path
              d="M 470 790 C 510 740, 560 740, 650 795"
              fill="none"
              stroke="#5a704e"
              strokeWidth="1.8"
              strokeDasharray="5 7"
              strokeDashoffset={flowDashOffset * 0.8}
              strokeLinecap="round"
              opacity="0.4"
            />

            <path
              d="M 450 820 C 530 730, 610 740, 670 820"
              fill="none"
              stroke={colors.seal}
              strokeWidth="5"
              strokeDasharray="14 10"
              strokeDashoffset={flowDashOffset}
              strokeLinecap="round"
            />
            <polygon
              points="672,822 654,804 676,798"
              fill={colors.seal}
              transform={`scale(${Math.max(0, flEnter)})`}
              style={{ transformOrigin: "672px 822px" }}
            />

            {/* Realistic Hand-drawn Tea Leaves flowing from Big Jar to Small Jar with living sway */}
            <g
              transform={`scale(${Math.max(0, flEnter)})`}
              style={{ transformOrigin: "560px 760px" }}
            >
              <SingleTeaLeaf
                x={482}
                y={788 + leafFloatY1}
                scale={0.76}
                rotation={-46 + leafFlutter1}
                inkColor={colors.ink}
              />
              <TeaSprout
                x={526}
                y={754 + leafFloatY2}
                scale={1.02}
                rotation={-24 + leafFlutter2}
                inkColor={colors.ink}
              />
              <SingleTeaLeaf
                x={610}
                y={766 + leafFloatY3}
                scale={0.9}
                rotation={20 + leafFlutter3}
                inkColor={colors.ink}
              />
            </g>

            {/* Middle Label '按周匀取' - Classical bracket slip */}
            <g transform="translate(560 706)">
              <rect
                x="-64"
                y="-18"
                width="128"
                height="36"
                rx="6"
                fill={colors.paper}
                stroke={colors.seal}
                strokeWidth="2.2"
              />
              <rect
                x="-60"
                y="-14"
                width="120"
                height="28"
                rx="3"
                fill="none"
                stroke={colors.seal}
                strokeWidth="0.8"
                opacity="0.35"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill={colors.seal}
                fontFamily={FONT_SONG}
                fontSize="21"
                fontWeight="700"
                letterSpacing="0.14em"
              >
                按周匀取
              </text>
            </g>
          </g>
        )}

        {/* ================= SMALL JAR (手绘小醒茶罐 - 案头慢醒) ================= */}
        {shiftProgress > 0.02 && (
          <g
            opacity={sOp * shiftProgress}
            transform={`translate(770 945) scale(${Math.max(0, sEnter) * 0.94})`}
          >
            {/* Ground Shadow */}
            <ellipse cx="0" cy="240" rx="135" ry="18" fill={colors.ink} opacity="0.08" />
            <ellipse cx="0" cy="240" rx="95" ry="13" fill={colors.ink} opacity="0.14" />

            {/* Small Jar Body - Refined petite ceramic caddy */}
            <path
              d="M -64 -155 C -105 -120 -132 -30 -132 50 C -132 150 -88 220 0 220 C 88 220 132 150 132 50 C 132 -30 105 -120 64 -155 Z"
              fill="url(#smallJarClay)"
              stroke={colors.ink}
              strokeWidth="5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Small Jar Highlight */}
            <path
              d="M -94 -40 C -108 15 -100 70 -76 145"
              fill="none"
              stroke="#cfb7a5"
              strokeWidth="6.5"
              strokeLinecap="round"
              opacity="0.45"
            />

            {/* Small Jar Neck & Lid Rim */}
            <path
              d="M -66 -155 L -65 -170 Q 0 -176 65 -170 L 66 -155 Z"
              fill="#443226"
              stroke={colors.ink}
              strokeWidth="3.5"
            />
            <rect
              x="-76"
              y="-186"
              width="152"
              height="18"
              rx="6"
              fill="#6b5343"
              stroke={colors.ink}
              strokeWidth="4"
            />

            {/* Small Jar Lid Dome */}
            <path
              d="M -70 -182 Q 0 -214 70 -182 Z"
              fill="#5e4839"
              stroke={colors.ink}
              strokeWidth="4"
              strokeLinejoin="round"
            />

            {/* Small Jar Knob */}
            <circle
              cx="0"
              cy="-224"
              r="12"
              fill="#36261c"
              stroke={colors.ink}
              strokeWidth="3.5"
            />

            {/* Seal '醒' on Small Jar */}
            <g transform="translate(0 25)">
              <rect
                x="-50"
                y="-50"
                width="100"
                height="100"
                rx="12"
                fill={colors.seal}
                stroke="#faf6ee"
                strokeWidth="2.2"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="#faf6ee"
                fontFamily={FONT_SONG}
                fontSize="56"
                fontWeight="900"
                letterSpacing="0.04em"
              >
                醒
              </text>
            </g>

            {/* Scholar's Tea Label '随取 · 唤醒' */}
            <g transform="translate(0 115)">
              <rect
                x="-76"
                y="-16"
                width="152"
                height="34"
                rx="5"
                fill={colors.ink}
                opacity="0.1"
              />
              <rect
                x="-76"
                y="-18"
                width="152"
                height="34"
                rx="5"
                fill="#fbf9f4"
                stroke={colors.ink}
                strokeWidth="2.2"
              />
              <rect
                x="-71"
                y="-13"
                width="142"
                height="24"
                rx="3"
                fill="none"
                stroke={colors.ink}
                strokeWidth="0.7"
                opacity="0.3"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill={colors.ink}
                fontFamily={FONT_SONG}
                fontSize="21"
                fontWeight="700"
                letterSpacing="0.12em"
              >
                随取 · 唤醒
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* ================= Descriptive Cards Below Jars ================= */}
      {/* Big Jar Card: Position shifts gracefully from center to left column */}
      <div
        style={{
          position: "absolute",
          left: bigCardX,
          width: bigCardW,
          top: 1240,
          textAlign: "center",
          opacity: bOp,
          transform: popTransform(Math.max(0, bEnter), breath, 10, -1),
        }}
      >
        <div
          style={{
            background: colors.paperDeep,
            borderRadius: 16,
            padding: shiftProgress > 0.5 ? "24px 16px" : "26px 32px",
            border: `2.5px solid ${colors.ink}`,
            boxShadow: "0 8px 24px rgba(43,38,28,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            position: "relative",
          }}
        >
          {/* Inner fine border for antique woodblock feel */}
          <div
            style={{
              position: "absolute",
              inset: 4,
              borderRadius: 11,
              border: `1px solid ${colors.ink}24`,
              pointerEvents: "none",
            }}
          />
          {/* Mini cinnabar chop mark '藏' */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: colors.seal,
              color: "#faf6ee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT_SONG,
              fontSize: 18,
              fontWeight: 900,
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(155,45,42,0.25)",
            }}
          >
            藏
          </div>
          <div
            style={{
              fontFamily: FONT_SONG,
              fontSize: Math.round((shiftProgress > 0.5 ? 40 : 46) * fontScale),
              fontWeight: 700,
              color: colors.ink,
              letterSpacing: "0.12em",
            }}
          >
            {bigLabel}
          </div>
        </div>
      </div>

      {/* Small Jar Card: Fades in on the right column when transitioning */}
      {shiftProgress > 0.1 && (
        <div
          style={{
            position: "absolute",
            right: 60,
            width: 460,
            top: 1240,
            textAlign: "center",
            opacity: sOp * shiftProgress,
            transform: popTransform(Math.max(0, sEnter), breath, 10, -1),
          }}
        >
          <div
            style={{
              background: colors.paperDeep,
              borderRadius: 16,
              padding: "24px 16px",
              border: `2.5px solid ${colors.ink}`,
              boxShadow: "0 8px 24px rgba(43,38,28,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 4,
                borderRadius: 11,
                border: `1px solid ${colors.ink}24`,
                pointerEvents: "none",
              }}
            />
            {/* Mini cinnabar chop mark '醒' */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: colors.seal,
                color: "#faf6ee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_SONG,
                fontSize: 18,
                fontWeight: 900,
                flexShrink: 0,
                boxShadow: "0 2px 6px rgba(155,45,42,0.25)",
              }}
            >
              醒
            </div>
            <div
              style={{
                fontFamily: FONT_SONG,
                fontSize: Math.round(40 * fontScale),
                fontWeight: 700,
                color: colors.ink,
                letterSpacing: "0.12em",
              }}
            >
              {smallLabel}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Punchline Banner - Auspicious Classical Mounting Scroll */}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 1520,
          textAlign: "center",
          opacity: ftOp,
          transform: popTransform(Math.max(0, ftEnter), breath, 14, -2),
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: colors.paper,
            color: colors.seal,
            padding: "18px 46px",
            borderRadius: 16,
            border: `3px double ${colors.seal}`,
            boxShadow: "0 10px 32px rgba(155,45,42,0.18)",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 20, opacity: 0.7 }}>◆</span>
          <span
            style={{
              fontFamily: FONT_SONG,
              fontSize: Math.round(56 * fontScale),
              fontWeight: 800,
              letterSpacing: "0.24em",
              textIndent: "0.24em",
            }}
          >
            {footText}
          </span>
          <span style={{ fontSize: 20, opacity: 0.7 }}>◆</span>
        </div>
      </div>

      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}
