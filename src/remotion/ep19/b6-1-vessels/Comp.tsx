import { useEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import gsap from "gsap";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FONT_SONG } from "@/remotion/shared/theme";
import { useFontSizeScale, useCustomTexts } from "@/remotion/shared/paper";
import {
  sfxHits,
  TITLE_DEFAULT,
  STAMP_DEFAULT,
} from "./data";

export interface Props {
  staggerFrames?: number;
  fontScale?: number;
  customTexts?: Record<string, string>;
}

// 预设微小金色圆形粒子坐标与动画参数（散落于深茶褐夜空区域）
export const GOLDEN_STARS = [
  { x: 80, y: 120, r: 1.8, dur: 1.2, delay: 0.1 },
  { x: 140, y: 280, r: 1.2, dur: 1.8, delay: 0.5 },
  { x: 210, y: 160, r: 2.2, dur: 1.4, delay: 0.9 },
  { x: 270, y: 90, r: 1.5, dur: 2.1, delay: 0.3 },
  { x: 330, y: 240, r: 1.2, dur: 1.0, delay: 0.7 },
  { x: 420, y: 140, r: 2.5, dur: 1.6, delay: 0.2 },
  { x: 490, y: 280, r: 1.4, dur: 1.9, delay: 0.8 },
  { x: 560, y: 90, r: 2.0, dur: 1.3, delay: 0.4 },
  { x: 620, y: 200, r: 1.3, dur: 2.2, delay: 1.1 },
  { x: 690, y: 120, r: 2.2, dur: 1.5, delay: 0.6 },
  { x: 760, y: 260, r: 1.6, dur: 1.7, delay: 0.0 },
  { x: 830, y: 80, r: 1.2, dur: 2.0, delay: 0.8 },
  { x: 910, y: 160, r: 2.4, dur: 1.1, delay: 0.3 },
  { x: 970, y: 240, r: 1.5, dur: 1.8, delay: 1.0 },
  { x: 120, y: 420, r: 2.0, dur: 1.5, delay: 0.5 },
  { x: 190, y: 560, r: 1.4, dur: 2.3, delay: 0.2 },
  { x: 740, y: 440, r: 1.8, dur: 1.3, delay: 0.7 },
  { x: 810, y: 520, r: 2.2, dur: 1.6, delay: 0.4 },
  { x: 890, y: 400, r: 1.3, dur: 1.9, delay: 0.9 },
  { x: 960, y: 560, r: 1.7, dur: 1.2, delay: 0.1 },
  { x: 160, y: 700, r: 1.5, dur: 2.0, delay: 0.6 },
  { x: 720, y: 640, r: 1.4, dur: 1.7, delay: 0.3 },
  { x: 820, y: 720, r: 2.0, dur: 1.4, delay: 0.8 },
  { x: 900, y: 680, r: 1.6, dur: 2.1, delay: 0.5 },
  { x: 260, y: 380, r: 1.2, dur: 1.5, delay: 0.4 },
  { x: 640, y: 360, r: 2.0, dur: 1.8, delay: 0.7 },
  { x: 530, y: 460, r: 1.4, dur: 1.3, delay: 0.2 },
  { x: 440, y: 600, r: 1.8, dur: 2.2, delay: 0.9 },
];

export function Comp(props: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fontScale = useFontSizeScale(props.fontScale);
  const custom = useCustomTexts(props.customTexts);

  const titleText = custom.title ?? TITLE_DEFAULT;
  const stampText = custom.stamp ?? STAMP_DEFAULT;

  const rootRef = useRef<HTMLDivElement>(null);
  const masterTlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const masterTl = gsap.timeline({
        paused: true,
        defaults: { ease: "none" },
      });

      // ----------------------------------------------------
      // 时间轴 1：居中压轴主标（0.4s 砸落横幅）
      // ----------------------------------------------------
      masterTl.fromTo(
        "#central-banner",
        { scale: 2.2, opacity: 0, y: -80, rotation: -6 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          rotation: 0,
          duration: 0.55,
          ease: "back.out(1.8)",
        },
        0.4
      );

      masterTl.fromTo(
        "#central-stamp",
        { scale: 1.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.25, ease: "power2.out" },
        0.52
      );

      // ----------------------------------------------------
      // 时间轴 2：上半屏【幽暗茶仓 · GSAP 循环星光闪烁与残月】
      // ----------------------------------------------------
      // 残月微光呼吸
      masterTl.fromTo(
        "#crescent-moon",
        { opacity: 0.55, scale: 0.95 },
        { opacity: 0.95, scale: 1.05, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" },
        0
      );

      // GSAP 金色微小圆形粒子不规则循环闪烁
      GOLDEN_STARS.forEach((star, idx) => {
        masterTl.fromTo(
          `#golden-star-${idx}`,
          { opacity: 0.15, scale: 0.6 },
          {
            opacity: 1.0,
            scale: 1.35,
            duration: star.dur,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          },
          star.delay
        );
      });

      // 大陶瓮沉睡飘起「Zzz」
      const zItems = ["#sleep-z-1", "#sleep-z-2", "#sleep-z-3"];
      zItems.forEach((sel, idx) => {
        masterTl.fromTo(
          sel,
          { opacity: 0, y: 0, x: 0, scale: 0.6 },
          {
            opacity: 0.82,
            y: -32 - idx * 24,
            x: 14 + idx * 8,
            scale: 1.0,
            duration: 1.3,
            ease: "sine.out",
          },
          0.7 + idx * 0.26
        ).to(
          sel,
          {
            opacity: 0,
            y: -58 - idx * 26,
            x: 22 + idx * 10,
            duration: 0.8,
            ease: "sine.in",
          },
          1.8 + idx * 0.26
        );
      });

      // ----------------------------------------------------
      // 时间轴 3：下半屏【晨曦案头 · 暖阳升起、晨光与香气茶芽】
      // ----------------------------------------------------
      // 晨曦暖阳金色光晕呼吸 (0.7s 起幅)
      masterTl.fromTo(
        "#morning-sun-group",
        { opacity: 0, scale: 0.7 },
        { opacity: 1, scale: 1.0, duration: 1.2, ease: "power2.out" },
        0.7
      );

      // 晨光斜照渐显 (0.8s - 2.0s)
      masterTl.fromTo(
        "#sunbeam-ray",
        { opacity: 0, scaleX: 0.7 },
        { opacity: 0.88, scaleX: 1.0, duration: 1.2, ease: "power2.out" },
        0.8
      );

      // 罐口荡漾出 3 层淡金竹青色茶香光晕 (1.0s - 2.8s)
      const rings = ["#aroma-ring-1", "#aroma-ring-2", "#aroma-ring-3"];
      rings.forEach((rSel, idx) => {
        masterTl.fromTo(
          rSel,
          { opacity: 0, scale: 0.4, y: 0 },
          {
            opacity: 0.85,
            scale: 1.35,
            y: -36 - idx * 16,
            duration: 1.1,
            ease: "power1.out",
          },
          1.0 + idx * 0.3
        ).to(
          rSel,
          {
            opacity: 0,
            scale: 1.7,
            y: -68 - idx * 20,
            duration: 0.7,
            ease: "sine.in",
          },
          1.8 + idx * 0.3
        );
      });

      // 嫩绿茶叶（🍃）在敞口晨曦光束中聚香飞旋 (1.0s - 2.8s)
      masterTl.fromTo(
        "#swirling-leaf-group",
        { opacity: 0, scale: 0.4, rotation: -20, y: 20 },
        {
          opacity: 1,
          scale: 1.1,
          rotation: 12,
          y: -24,
          duration: 0.9,
          ease: "power2.out",
        },
        1.0
      ).to(
        "#swirling-leaf-group",
        {
          y: -38,
          rotation: -8,
          scale: 0.98,
          duration: 1.3,
          ease: "sine.inOut",
        },
        1.9
      );

      masterTlRef.current = masterTl;

      if (typeof window !== "undefined") {
        window.__timelines = window.__timelines || {};
        window.__timelines["b6_1"] = masterTl;
      }
    }, rootRef);

    return () => {
      ctx.revert();
      if (typeof window !== "undefined" && window.__timelines) {
        delete window.__timelines["b6_1"];
      }
    };
  }, []);

  // Frame seek 绝对幂等同步
  useEffect(() => {
    if (masterTlRef.current) {
      const timeInSeconds = frame / fps;
      masterTlRef.current.seek(timeInSeconds, false);
    }
  }, [frame, fps]);

  return (
    <div
      ref={rootRef}
      id="root"
      data-composition-id="b6_1"
      data-start="0"
      data-duration="4.5"
      data-width="1080"
      data-height="1920"
      style={{
        width: 1080,
        height: 1920,
        overflow: "hidden",
        fontFamily: FONT_SONG,
        userSelect: "none",
        position: "relative",
      }}
    >
      <SfxTrack hits={sfxHits(props.staggerFrames ?? 0)} />

      {/* ---------------------------------------------------- */}
      {/* 1. 上半屏：暗仓夜境（深茶褐底色 + 星光 + 残月 + 大瓮） */}
      {/* ---------------------------------------------------- */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      >
        <defs>
          <linearGradient id="nightSkyBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#18110D" />
            <stop offset="60%" stopColor="#2A201A" />
            <stop offset="100%" stopColor="#3A2D23" />
          </linearGradient>

          <radialGradient id="nightVignette" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#3E3025" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#1C140E" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#120C08" stopOpacity="0.98" />
          </radialGradient>

          <linearGradient id="moonGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF9C4" />
            <stop offset="60%" stopColor="#FFD54F" />
            <stop offset="100%" stopColor="#FFB300" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="nightUrnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3A281E" />
            <stop offset="35%" stopColor="#4D3629" />
            <stop offset="70%" stopColor="#2E1F16" />
            <stop offset="100%" stopColor="#1A110C" />
          </linearGradient>

          <radialGradient id="goldenStarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFDE7" stopOpacity="1" />
            <stop offset="45%" stopColor="#FFE082" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FFB300" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 上半夜境主底色（沿斜杠精准填充，无生硬遮罩） */}
        <path d="M 0 0 L 1080 0 L 1080 840 L 0 1040 Z" fill="url(#nightSkyBg)" />
        <path d="M 0 0 L 1080 0 L 1080 840 L 0 1040 Z" fill="url(#nightVignette)" />

        {/* GSAP 驱动的微小金色圆形粒子星光集群 */}
        <g id="golden-stars-cluster">
          {GOLDEN_STARS.map((star, idx) => (
            <g
              key={idx}
              id={`golden-star-${idx}`}
              transform={`translate(${star.x}, ${star.y})`}
              opacity="0.3"
            >
              <circle cx="0" cy="0" r={star.r * 2.6} fill="url(#goldenStarGlow)" />
              <circle cx="0" cy="0" r={star.r} fill="#FFE082" />
            </g>
          ))}
        </g>

        {/* 细线金色残月 (🌙 cx: 860, cy: 190) */}
        <g id="crescent-moon" transform="translate(860, 190)">
          <ellipse cx="0" cy="0" rx="38" ry="38" fill="url(#moonGlowGrad)" style={{ filter: "blur(8px)" }} opacity="0.35" />
          <path
            d="M 18 -32 C 34 -14 34 14 18 32 C 8 18 8 -18 18 -32 Z"
            fill="#FFE082"
            stroke="#FFD54F"
            strokeWidth="0.8"
          />
        </g>

        {/* 大陶瓮侧影沉睡（安放于左中侧 X: 340, Y: 500） */}
        <g id="night-urn-group" transform="translate(340, 500)">
          <ellipse cx="0" cy="225" rx="100" ry="18" fill="rgba(10, 6, 4, 0.75)" style={{ filter: "blur(8px)" }} />
          <path
            d="M -54 -20 C -90 25 -104 105 -96 175 C -88 220 -64 230 -44 230 L 44 230 C 64 230 88 220 96 175 C 104 105 90 25 54 -20 Z"
            fill="url(#nightUrnGrad)"
            stroke="#150E09"
            strokeWidth="3"
          />
          <path
            d="M -48 -18 C -78 28 -90 100 -84 165"
            stroke="rgba(255, 235, 205, 0.14)"
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M -55 -20 Q 0 -38 55 -20 L 58 6 Q 0 -4 -58 6 Z"
            fill="#8C7456"
            stroke="#3D2E20"
            strokeWidth="2.0"
          />
          <ellipse cx="0" cy="-24" rx="48" ry="13" fill="#A8906F" stroke="#4A3828" strokeWidth="1.5" />
          <ellipse cx="0" cy="-6" rx="52" ry="8" fill="none" stroke="#C33E32" strokeWidth="3.4" />
          <ellipse cx="0" cy="-2" rx="53" ry="8" fill="none" stroke="#8E1C12" strokeWidth="3.0" />
          <ellipse cx="0" cy="2" rx="52" ry="8" fill="none" stroke="#C33E32" strokeWidth="3.0" />
          <path d="M 12 6 Q 20 40 26 64" stroke="#C33E32" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M 16 6 Q 10 32 6 60" stroke="#8E1C12" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <g transform="translate(20, 60)">
            <rect x="-11" y="0" width="22" height="38" rx="2" fill="#C33E32" stroke="#8E1C12" strokeWidth="1" />
            <text x="0" y="25" fontSize="14" fontFamily={FONT_SONG} fontWeight="900" fill="#FAF5EE" textAnchor="middle">
              封
            </text>
          </g>
          <g id="night-zzz-group" style={{ pointerEvents: "none" }}>
            <text id="sleep-z-1" x="20" y="-45" fontSize="34" fontFamily={FONT_SONG} fontWeight="900" fill="#D7C4A5" opacity="0">
              Z
            </text>
            <text id="sleep-z-2" x="38" y="-78" fontSize="26" fontFamily={FONT_SONG} fontWeight="900" fill="#BFAF95" opacity="0">
              z
            </text>
            <text id="sleep-z-3" x="52" y="-108" fontSize="20" fontFamily={FONT_SONG} fontWeight="900" fill="#9E8F7A" opacity="0">
              z
            </text>
          </g>
        </g>
      </svg>

      {/* ---------------------------------------------------- */}
      {/* 2. 下半屏：晨曦案头（米白底色 + 暖阳 ☀️ + 晨光束 + 小瓷罐） */}
      {/* ---------------------------------------------------- */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0, zIndex: 2 }}
      >
        <defs>
          {/* 晨曦暖阳光球渐变 */}
          <radialGradient id="morningSunGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF9C4" />
            <stop offset="40%" stopColor="#FFE082" />
            <stop offset="70%" stopColor="#FFA726" />
            <stop offset="100%" stopColor="#FB8C00" />
          </radialGradient>

          {/* 暖阳外圈柔和光晕 */}
          <radialGradient id="morningSunAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE082" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#FFCC80" stopOpacity="0.45" />
            <stop offset="85%" stopColor="#FFE082" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FAF7F0" stopOpacity="0" />
          </radialGradient>

          {/* 晨光斜照金束渐变 */}
          <linearGradient id="sunbeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 236, 179, 0.45)" />
            <stop offset="55%" stopColor="rgba(255, 248, 225, 0.18)" />
            <stop offset="100%" stopColor="rgba(250, 247, 240, 0)" />
          </linearGradient>

          {/* 墨绿瓷罐翡翠釉面渐变 */}
          <linearGradient id="celadonMorningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3827" />
            <stop offset="30%" stopColor="#2E523A" />
            <stop offset="60%" stopColor="#457052" />
            <stop offset="85%" stopColor="#2A4A34" />
            <stop offset="100%" stopColor="#162B1D" />
          </linearGradient>

          <linearGradient id="sunGlint" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <radialGradient id="innerAromaLight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE082" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#A5D6A7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#2E4D38" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="morningRingGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE082" stopOpacity="0.8" />
            <stop offset="55%" stopColor="#81C784" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#66BB6A" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="leafGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#81C784" />
            <stop offset="50%" stopColor="#4CAF50" />
            <stop offset="100%" stopColor="#2E7D32" />
          </linearGradient>
        </defs>

        {/* 案头晨曦米白底色（精确沿着斜杠 X: 0, Y: 1040 ➔ X: 1080, Y: 840 填充） */}
        <path d="M 0 1040 L 1080 840 L 1080 1920 L 0 1920 Z" fill="#FAF7F0" />

        {/* ☀️ 晨曦暖阳 (位于案头左上方 X: 220, Y: 1140，清晰可见) */}
        <g id="morning-sun-group" transform="translate(220, 1140)">
          <circle cx="0" cy="0" r="140" fill="url(#morningSunAura)" />
          <circle cx="0" cy="0" r="80" fill="url(#morningSunAura)" opacity="0.8" />

          {/* 暖阳光束射线 */}
          <g opacity="0.6">
            <line x1="0" y1="-70" x2="0" y2="-96" stroke="#FFE082" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="49" y1="-49" x2="68" y2="-68" stroke="#FFE082" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="70" y1="0" x2="96" y2="0" stroke="#FFE082" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="49" y1="49" x2="68" y2="68" stroke="#FFE082" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="0" y1="70" x2="0" y2="96" stroke="#FFE082" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-49" y1="49" x2="-68" y2="68" stroke="#FFE082" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-70" y1="0" x2="-96" y2="0" stroke="#FFE082" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-49" y1="-49" x2="-68" y2="-68" stroke="#FFE082" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* 暖阳核心圆轮 */}
          <circle cx="0" cy="0" r="50" fill="url(#morningSunGrad)" stroke="#FFA000" strokeWidth="1.5" />
          <circle cx="-12" cy="-12" r="16" fill="#FFFFFF" opacity="0.4" style={{ filter: "blur(4px)" }} />
        </g>

        {/* 晨光斜照金束 (从暖阳朝右下方向小瓷罐倾泻) */}
        <polygon
          id="sunbeam-ray"
          points="220,1140 1080,1260 1080,1780 460,1920"
          fill="url(#sunbeamGrad)"
          style={{ mixBlendMode: "multiply" }}
        />

        {/* 小瓷罐特写（X: 680, Y: 1390） */}
        <g id="day-jar-group" transform="translate(680, 1390)">
          {/* 罐底案头投影 */}
          <ellipse cx="0" cy="195" rx="76" ry="14" fill="rgba(70, 50, 35, 0.22)" style={{ filter: "blur(6px)" }} />

          {/* 墨绿瓷罐主体 */}
          <path
            d="M -44 -10 C -72 30 -78 105 -70 165 C -64 195 -46 195 -32 195 L 32 195 C 46 195 64 195 70 165 C 78 105 72 30 44 -10 Z"
            fill="url(#celadonMorningGrad)"
            stroke="#15291C"
            strokeWidth="2.8"
          />

          {/* 莹润翡翠釉面高光 */}
          <path
            d="M -36 24 C -54 66 -56 115 -48 160"
            stroke="url(#sunGlint)"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />

          {/* 莹白敞开瓷罐口 */}
          <ellipse cx="0" cy="-10" rx="44" ry="12" fill="#FAF7F0" stroke="#7A8F80" strokeWidth="2.0" />
          {/* 敞口露出的淡金茶香内膛 */}
          <ellipse cx="0" cy="-9" rx="38" ry="9" fill="url(#innerAromaLight)" />

          {/* 瓷盖安放于罐体右侧案头（避免遮挡茶叶，位置舒适自然） */}
          <g id="day-jar-lid" transform="translate(108, 172) rotate(16)">
            {/* 盖子在案头上的自然投影 */}
            <ellipse cx="0" cy="14" rx="44" ry="10" fill="rgba(70, 50, 35, 0.22)" style={{ filter: "blur(4px)" }} />
            {/* 盖身 */}
            <ellipse cx="0" cy="0" rx="42" ry="12" fill="url(#celadonMorningGrad)" stroke="#15291C" strokeWidth="2.2" />
            <path
              d="M -42 0 C -42 -14 42 -14 42 0 Z"
              fill="url(#celadonMorningGrad)"
              stroke="#15291C"
              strokeWidth="2.2"
            />
            {/* 瓷盖顶钮 */}
            <ellipse cx="0" cy="-16" rx="9" ry="6" fill="#4E785C" stroke="#15291C" strokeWidth="1.6" />
            <circle cx="-2" cy="-18" r="2.2" fill="#FFFFFF" opacity="0.75" />
          </g>

          {/* 3 层淡金竹青色茶香光晕波纹 (1.0s - 2.8s，从敞开口中顺畅升腾) */}
          <g id="aroma-rings-group" style={{ pointerEvents: "none" }}>
            <ellipse
              id="aroma-ring-1"
              cx="0"
              cy="-18"
              rx="52"
              ry="22"
              fill="url(#morningRingGrad)"
              stroke="#C5A059"
              strokeWidth="1.5"
              opacity="0"
            />
            <ellipse
              id="aroma-ring-2"
              cx="0"
              cy="-25"
              rx="62"
              ry="26"
              fill="url(#morningRingGrad)"
              stroke="#81C784"
              strokeWidth="1.4"
              opacity="0"
            />
            <ellipse
              id="aroma-ring-3"
              cx="0"
              cy="-32"
              rx="72"
              ry="30"
              fill="url(#morningRingGrad)"
              stroke="#C5A059"
              strokeWidth="1.2"
              opacity="0"
            />
          </g>

          {/* 嫩绿茶叶（🍃）聚香飞旋 (1.0s - 2.8s，视野开阔无任何遮挡) */}
          <g id="swirling-leaf-group" transform="translate(0, -22)" opacity="0" style={{ pointerEvents: "none" }}>
            <path
              d="M 0 0 C -10 -18 -5 -36 5 -46 C 10 -30 14 -14 0 0 Z"
              fill="url(#leafGreenGrad)"
              stroke="#1B5E20"
              strokeWidth="1.2"
            />
            <path d="M 0 0 Q 3 -22 5 -46" stroke="#C8E6C9" strokeWidth="0.8" fill="none" />
            <path
              d="M 2 -10 C 14 -16 20 -30 18 -40 C 12 -30 5 -18 2 -10 Z"
              fill="url(#leafGreenGrad)"
              stroke="#1B5E20"
              strokeWidth="1"
            />
            <circle cx="3" cy="-32" r="2.2" fill="#FFE082" />
            <circle cx="-12" cy="-22" r="1.5" fill="#FFE082" opacity="0.8" />
            <circle cx="16" cy="-14" r="1.5" fill="#A5D6A7" opacity="0.8" />
          </g>
        </g>
      </svg>

      {/* ---------------------------------------------------- */}
      {/* 3. 中间分割线：纯净利落的金色与朱砂双线【斜杠】(无突兀阴影涂抹) */}
      {/* ---------------------------------------------------- */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}
      >
        <defs>
          {/* 斜杠分割线金光渐变 */}
          <linearGradient id="slashGoldGrad" x1="0" y1="1040" x2="1080" y2="840" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C5A059" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#FFE082" stopOpacity="1" />
            <stop offset="100%" stopColor="#C5A059" stopOpacity="0.85" />
          </linearGradient>

          {/* 斜杠自然光晕 */}
          <linearGradient id="slashAuraGrad" x1="0" y1="1040" x2="1080" y2="840" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255, 224, 130, 0)" />
            <stop offset="35%" stopColor="rgba(255, 224, 130, 0.35)" />
            <stop offset="65%" stopColor="rgba(195, 62, 50, 0.25)" />
            <stop offset="100%" stopColor="rgba(255, 224, 130, 0)" />
          </linearGradient>
        </defs>

        {/* 斜杠主光晕 (20px) */}
        <line
          x1="0"
          y1="1040"
          x2="1080"
          y2="840"
          stroke="url(#slashAuraGrad)"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* 斜杠金色主线 (3.5px) */}
        <line
          x1="-10"
          y1="1042"
          x2="1090"
          y2="838"
          stroke="url(#slashGoldGrad)"
          strokeWidth="3.5"
          strokeLinecap="square"
        />

        {/* 斜杠朱砂红细线 (1.5px) */}
        <line
          x1="-10"
          y1="1046"
          x2="1090"
          y2="842"
          stroke="#C33E32"
          strokeWidth="1.5"
          opacity="0.85"
        />
      </svg>

      {/* ---------------------------------------------------- */}
      {/* 4. 居中交界处压轴主标（画面唯一文字，破空砸落横幅） */}
      {/* ---------------------------------------------------- */}
      <div
        id="central-banner"
        style={{
          position: "absolute",
          top: 875,
          left: (1080 - 760) / 2, // 160px
          width: 760,
          height: 96,
          background: "#FAF5EE",
          border: "2.8px solid #C33E32",
          borderRadius: 8,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.45)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          zIndex: 30,
          opacity: 0,
        }}
      >
        {/* 内嵌古典金色细边线 */}
        <div
          style={{
            position: "absolute",
            inset: 3,
            border: "1px solid #C5A059",
            borderRadius: 5,
            pointerEvents: "none",
          }}
        />

        {/* 主标题文字：大罐睡觉 · 小罐上班 */}
        <h1
          style={{
            fontFamily: FONT_SONG,
            fontSize: 54 * fontScale,
            fontWeight: 700,
            letterSpacing: 4,
            color: "#4A3425",
            margin: 0,
            whiteSpace: "nowrap",
            zIndex: 2,
          }}
        >
          {titleText}
        </h1>

        {/* 朱砂红印章 [准则] */}
        <div
          id="central-stamp"
          style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            width: 56 * fontScale,
            height: 56 * fontScale,
            border: "2.5px solid #C33E32",
            background: "rgba(195, 62, 50, 0.08)",
            borderRadius: 8,
            color: "#C33E32",
            fontSize: 22 * fontScale,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: 1,
            zIndex: 2,
          }}
        >
          {stampText}
        </div>
      </div>

      {/* 四角古典 L 型细线框 */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 50,
          width: 36,
          height: 36,
          borderTop: "1.5px solid rgba(255, 235, 205, 0.6)",
          borderLeft: "1.5px solid rgba(255, 235, 205, 0.6)",
          pointerEvents: "none",
          zIndex: 40,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 50,
          right: 50,
          width: 36,
          height: 36,
          borderTop: "1.5px solid rgba(255, 235, 205, 0.6)",
          borderRight: "1.5px solid rgba(255, 235, 205, 0.6)",
          pointerEvents: "none",
          zIndex: 40,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 50,
          width: 36,
          height: 36,
          borderBottom: "1.5px solid rgba(110, 83, 63, 0.4)",
          borderLeft: "1.5px solid rgba(110, 83, 63, 0.4)",
          pointerEvents: "none",
          zIndex: 40,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 50,
          right: 50,
          width: 36,
          height: 36,
          borderBottom: "1.5px solid rgba(110, 83, 63, 0.4)",
          borderRight: "1.5px solid rgba(110, 83, 63, 0.4)",
          pointerEvents: "none",
          zIndex: 40,
        }}
      />
    </div>
  );
}
