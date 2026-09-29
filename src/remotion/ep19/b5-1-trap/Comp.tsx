import { useEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import gsap from "gsap";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FONT_SONG } from "@/remotion/shared/theme";
import { useFontSizeScale, useCustomTexts } from "@/remotion/shared/paper";
import {
  CLOUD_PUFFS,
  sfxHits,
  STAMP_DEFAULT,
  TITLE_DEFAULT,
} from "./data";

export interface Props {
  staggerFrames?: number;
  fontScale?: number;
  customTexts?: Record<string, string>;
}

export function Comp(props: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fontScale = useFontSizeScale(props.fontScale);
  const custom = useCustomTexts(props.customTexts);

  const titleText = custom.title ?? TITLE_DEFAULT;
  const stampText = custom.stamp ?? STAMP_DEFAULT;

  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // GSAP 确定性时间线构建
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power2.out" },
      });

      // 0.0s - 0.6s: 标题淡入上浮
      tl.fromTo(
        "#title-clip",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6 },
        0
      );

      // 0.4s: 印章落印（严格 56x56px，scale: 2.0 -> 1，严禁盖字）
      tl.fromTo(
        "#stamp",
        { scale: 2.0, opacity: 0, rotation: -12 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.35, ease: "back.out(2)" },
        0.4
      );

      // ----------------------------------------------------
      // 0.65s - 3.5s: 纯团状油烟系统（无任何线条！纯粹的蓬松云团与团团翻滚）
      // ----------------------------------------------------
      tl.fromTo(
        "#smoke-container",
        { opacity: 0 },
        { opacity: 1, duration: 0.35 },
        0.65
      );

      // 锅口温热翻滚底云 (Wok Base Plumes)
      tl.fromTo(
        "#wok-base-cloud-1",
        { scale: 0.3, opacity: 0, y: 10 },
        { scale: 1.25, opacity: 0.65, y: -20, duration: 0.8, ease: "power1.out" },
        0.65
      ).to(
        "#wok-base-cloud-1",
        { scale: 1.6, opacity: 0.25, x: 20, y: -45, duration: 1.4, ease: "sine.inOut" },
        1.45
      );

      tl.fromTo(
        "#wok-base-cloud-2",
        { scale: 0.25, opacity: 0, y: 15 },
        { scale: 1.35, opacity: 0.58, y: -30, duration: 0.9, ease: "power1.out" },
        0.75
      ).to(
        "#wok-base-cloud-2",
        { scale: 1.7, opacity: 0.20, x: 30, y: -60, duration: 1.5, ease: "sine.inOut" },
        1.65
      );

      // 24 组团状翻滚烟雾（三阶段平滑运动：锅口膨胀 -> 空中翻滚 -> 茶罐沉降 / 高空漫散）
      CLOUD_PUFFS.forEach((p) => {
        const s1 = p.duration * 0.30;
        const s2 = p.duration * 0.40;
        const s3 = p.duration * 0.30;

        tl.fromTo(
          `#cloud-puff-${p.id}`,
          {
            attr: { cx: p.x0, cy: p.y0, r: p.r0 },
            opacity: 0,
          },
          {
            attr: { cx: p.x1, cy: p.y1, r: p.r1 },
            opacity: p.maxOpacity,
            duration: s1,
            ease: "power2.out",
          },
          p.startTime
        )
          .to(
            `#cloud-puff-${p.id}`,
            {
              attr: { cx: p.x2, cy: p.y2, r: p.r2 },
              opacity: p.maxOpacity * 0.88,
              duration: s2,
              ease: "sine.inOut",
            },
            p.startTime + s1
          )
          .to(
            `#cloud-puff-${p.id}`,
            {
              attr: { cx: p.x3, cy: p.y3, r: p.r3 },
              opacity: 0,
              duration: s3,
              ease: "power2.in",
            },
            p.startTime + s1 + s2
          );
      });

      // 茶罐口上方温润聚集的受纳烟团 (Jar Intake Billow)
      tl.fromTo(
        "#jar-intake-billow",
        { scale: 0.2, opacity: 0 },
        { scale: 1.2, opacity: 0.55, duration: 0.8, ease: "power1.out" },
        1.35
      ).to(
        "#jar-intake-billow",
        { scale: 0.6, opacity: 0.1, y: 25, duration: 1.2, ease: "power2.in" },
        2.15
      );

      // ----------------------------------------------------
      // 1.4s - 3.0s: 茶叶物理受烟熏变质褪色 + 视窗淡油烟蒙翳
      // ----------------------------------------------------
      tl.to(
        "#tea-leaves path",
        {
          fill: "#8C7355", // 氧化焦黄凋谢色
          filter: "brightness(0.78) saturate(0.5) sepia(0.5)",
          duration: 1.5,
          ease: "power2.inOut",
        },
        1.4
      );

      // 视窗油烟微熏蒙翳（透明度控制在 0.22，茶叶清晰辨识）
      tl.fromTo(
        "#smoke-window-haze",
        { opacity: 0 },
        { opacity: 0.24, duration: 1.5, ease: "power1.inOut" },
        1.4
      );

      // 2.4s: 罐底居中垂直红色细虚线向下生长
      tl.fromTo(
        "#leader-line",
        { scaleY: 0 },
        { scaleY: 1, duration: 0.4, ease: "power2.out" },
        2.4
      );

      // 2.5s: 正下方弹性弹出米白底红框标牌「避开厨房油烟 ✖」
      tl.fromTo(
        "#warning-card",
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)" },
        2.5
      );

      tlRef.current = tl;

      if (typeof window !== "undefined") {
        window.__timelines = window.__timelines || {};
        window.__timelines["b5_1"] = tl;
      }
    }, rootRef);

    return () => {
      ctx.revert();
      if (typeof window !== "undefined" && window.__timelines) {
        delete window.__timelines["b5_1"];
      }
    };
  }, []);

  // Frame seek synchronization with GSAP timeline
  useEffect(() => {
    if (tlRef.current) {
      const timeInSeconds = frame / fps;
      tlRef.current.seek(timeInSeconds, false);
    }
  }, [frame, fps]);

  return (
    <div
      ref={rootRef}
      id="root"
      data-composition-id="b5_1"
      data-start="0"
      data-duration="5"
      data-width="1080"
      data-height="1920"
      style={{
        width: 1080,
        height: 1920,
        overflow: "hidden",
        backgroundColor: "#F7F4EB",
        fontFamily: FONT_SONG,
        color: "#4A3425",
        userSelect: "none",
        position: "relative",
      }}
    >
      <SfxTrack hits={sfxHits(props.staggerFrames ?? 0)} />

      {/* 四角古典 L 型细线框 */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 60,
          width: 36,
          height: 36,
          borderTop: "1.5px solid rgba(110, 83, 63, 0.4)",
          borderLeft: "1.5px solid rgba(110, 83, 63, 0.4)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 60,
          width: 36,
          height: 36,
          borderTop: "1.5px solid rgba(110, 83, 63, 0.4)",
          borderRight: "1.5px solid rgba(110, 83, 63, 0.4)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 60,
          width: 36,
          height: 36,
          borderBottom: "1.5px solid rgba(110, 83, 63, 0.4)",
          borderLeft: "1.5px solid rgba(110, 83, 63, 0.4)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 60,
          width: 36,
          height: 36,
          borderBottom: "1.5px solid rgba(110, 83, 63, 0.4)",
          borderRight: "1.5px solid rgba(110, 83, 63, 0.4)",
          pointerEvents: "none",
        }}
      />

      {/* 顶部主标区（Flex 居中横向排版，间距 gap: 24px） */}
      <div
        id="title-clip"
        style={{
          position: "absolute",
          top: 200,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          zIndex: 30,
        }}
      >
        <h1
          style={{
            fontFamily: FONT_SONG,
            fontSize: 54 * fontScale,
            fontWeight: 700,
            letterSpacing: 4,
            color: "#4A3425",
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          {titleText}
        </h1>
        <div
          id="stamp"
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
            fontSize: 36 * fontScale,
            fontWeight: 900,
            lineHeight: 1,
            transformOrigin: "center center",
          }}
        >
          ✖
        </div>
      </div>

      {/* 主舞台区域：容器高度 800px，宽度 920px */}
      <div
        style={{
          position: "absolute",
          top: 480,
          left: (1080 - 920) / 2, // 80px
          width: 920,
          height: 800,
          zIndex: 20,
        }}
      >
        <svg
          width="920"
          height="800"
          viewBox="0 0 920 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <defs>
            {/* 蓬松团状烟雾深层柔化滤镜 */}
            <filter id="smoke-cloud-soft-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="18" />
            </filter>

            {/* 蓬松自然烟团径向渐变（暖焦灰 -> 柔和外延 -> 完全透明） */}
            <radialGradient id="smoke-cloud-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4E3C2F" stopOpacity="0.55" />
              <stop offset="42%" stopColor="#7B6655" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#A89585" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="smoke-cloud-grad-soft" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#635142" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#8C7767" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#B3A293" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. 地下灶台底座（稳固落于实木桌面上，去掉了火苗） */}
          <g id="stove-base">
            <ellipse cx="205" cy="710" rx="68" ry="11" fill="#282421" stroke="#1A1816" strokeWidth="2.5" />
            <path d="M 150 708 L 160 686" stroke="#332E2A" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 260 708 L 250 686" stroke="#332E2A" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 205 710 L 205 690" stroke="#332E2A" strokeWidth="5.5" strokeLinecap="round" />
          </g>

          {/* 2. 左侧铁锅（产生源，居中 X: 205，尺寸 220x92px，深黑铸铁质感） */}
          <g id="wok-group" transform="translate(95, 565)">
            {/* 锅体外壳 */}
            <path
              d="M 5 66 C 35 142 185 142 215 66 Z"
              fill="#2C2827"
              stroke="#1C1A19"
              strokeWidth="4"
            />
            {/* 木质锅柄 */}
            <rect
              x="-50"
              y="60"
              width="60"
              height="12"
              rx="6"
              fill="#6B4D36"
              transform="rotate(-15)"
            />
            {/* 锅内热油反光面 */}
            <ellipse cx="110" cy="74" rx="78" ry="18" fill="#4E3D31" />
            <ellipse cx="114" cy="72" rx="48" ry="9" fill="rgba(240, 160, 60, 0.32)" />
          </g>

          {/* 3. 纯团状油烟系统（彻底无任何线条！纯蓬松云团） */}
          <g id="smoke-container" opacity="0">
            <g id="smoke-clouds-group" filter="url(#smoke-cloud-soft-blur)" style={{ mixBlendMode: "multiply" }}>
              {/* 锅口温热翻滚基础烟团 */}
              <ellipse
                id="wok-base-cloud-1"
                cx="205"
                cy="610"
                rx="42"
                ry="24"
                fill="url(#smoke-cloud-grad)"
                style={{ transformOrigin: "205px 610px" }}
              />
              <ellipse
                id="wok-base-cloud-2"
                cx="220"
                cy="602"
                rx="48"
                ry="28"
                fill="url(#smoke-cloud-grad-soft)"
                style={{ transformOrigin: "220px 602px" }}
              />

              {/* 24 组团状翻滚烟雾云球 */}
              {CLOUD_PUFFS.map((p) => (
                <circle
                  key={p.id}
                  id={`cloud-puff-${p.id}`}
                  cx={p.x0}
                  cy={p.y0}
                  r={p.r0}
                  fill={p.id % 2 === 0 ? "url(#smoke-cloud-grad)" : "url(#smoke-cloud-grad-soft)"}
                  opacity={0}
                />
              ))}

              {/* 茶罐口上方温润聚集的受纳烟团 */}
              <ellipse
                id="jar-intake-billow"
                cx="680"
                cy="440"
                rx="52"
                ry="24"
                fill="url(#smoke-cloud-grad)"
                style={{ transformOrigin: "680px 440px" }}
                opacity="0"
              />
            </g>
          </g>

          {/* 4. 右侧小瓷罐 (尺寸 240x315px，墨绿微透视小瓷罐) */}
          <g id="jar-group" transform="translate(558, 395)">
            {/* 罐体外壁 (240x315px) */}
            <path
              d="M 22 75 C 22 42 52 27 128 27 C 202 27 232 42 232 75 L 240 255 C 240 297 210 315 128 315 C 45 315 15 297 15 255 Z"
              fill="#264836"
              stroke="#1B3527"
              strokeWidth="4.5"
            />
            {/* 釉面温润反光弧 */}
            <path
              d="M 35 85 C 35 55 58 40 128 40"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />

            {/* 微透视视窗（观察内部茶叶） */}
            <path
              d="M 38 82 C 38 54 63 42 128 42 C 192 42 218 54 218 82 L 222 248 C 222 282 195 300 128 300 C 60 300 33 282 33 248 Z"
              fill="#F4EFE6"
              opacity="0.92"
            />

            {/* 正宗福鼎白牡丹“两叶一芽”形态 */}
            <g id="tea-leaves">
              {/* 芽尖 */}
              <path
                d="M 128 210 Q 132 142 128 112 Q 124 142 128 210 Z"
                fill="#6D7B4E"
              />
              {/* 白毫茸毛微光 */}
              <path
                d="M 127 118 Q 130 155 128 200"
                stroke="#edf5ea"
                strokeWidth="2.5"
                fill="none"
                opacity="0.9"
              />
              {/* 左展开叶片 */}
              <path
                d="M 128 202 Q 90 172 75 135 Q 108 147 128 202 Z"
                fill="#5B6A3E"
              />
              {/* 右舒展叶片 */}
              <path
                d="M 128 202 Q 165 168 180 132 Q 150 147 128 202 Z"
                fill="#637443"
              />
              {/* 侧底平卧稳重叶片 */}
              <path
                d="M 90 218 Q 60 202 48 180 Q 82 183 98 213 Z"
                fill="#4E5D32"
              />
              <path
                d="M 158 218 Q 188 202 208 183 Q 172 188 152 213 Z"
                fill="#536436"
              />
            </g>

            {/* 油烟渗入微熏薄雾（半透明 0.24，茶叶依然清晰辨识） */}
            <path
              id="smoke-window-haze"
              d="M 38 82 C 38 54 63 42 128 42 C 192 42 218 54 218 82 L 222 248 C 222 282 195 300 128 300 C 60 300 33 282 33 248 Z"
              fill="#5A4739"
              opacity="0"
              style={{ mixBlendMode: "multiply" }}
            />

            {/* 罐颈口与阴影深邃圈 */}
            <ellipse
              cx="128"
              cy="45"
              rx="90"
              ry="18"
              fill="none"
              stroke="#1B3527"
              strokeWidth="4.5"
            />

            {/* 卸下的瓷罐盖（斜搁在旁） */}
            <g transform="translate(-45, 275) rotate(-18)">
              <ellipse cx="0" cy="0" rx="46" ry="16" fill="#264836" stroke="#1B3527" strokeWidth="3" />
              <rect x="-12" y="-18" width="24" height="14" rx="4" fill="#6B4D36" />
              <ellipse cx="0" cy="-18" rx="12" ry="5" fill="#8A6445" />
            </g>
          </g>
        </svg>

        {/* 统一实木桌面（高度 26px，bottom: 90px，双物象同置于其上） */}
        <div
          style={{
            position: "absolute",
            bottom: 90,
            left: 0,
            width: "100%",
            height: 26,
            background: "linear-gradient(180deg, #8A6D56 0%, #634C3A 100%)",
            borderRadius: 6,
            boxShadow: "0 14px 28px rgba(74, 52, 37, 0.18)",
          }}
        />

        {/* 罐底居中垂直引线（自茶罐中心 686px 垂直引出，高度 110px） */}
        <div
          id="leader-line"
          style={{
            position: "absolute",
            bottom: -20,
            left: 686,
            width: 2.5,
            height: 110,
            borderLeft: "2.5px dashed #C33E32",
            transformOrigin: "top center",
          }}
        />

        {/* 正下方居中弹出警示标牌「避开厨房油烟 ✖」 */}
        <div
          id="warning-card"
          style={{
            position: "absolute",
            bottom: -95,
            left: 510,
            padding: "16px 36px",
            background: "#FAF7F0",
            border: "2px solid #C33E32",
            borderRadius: 8,
            boxShadow: "0 10px 24px rgba(195, 62, 50, 0.15)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 34 * fontScale,
            fontWeight: 700,
            color: "#C33E32",
            whiteSpace: "nowrap",
          }}
        >
          <span>{stampText}</span>
        </div>
      </div>
    </div>
  );
}
