import { useEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import gsap from "gsap";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FONT_SONG } from "@/remotion/shared/theme";
import { useFontSizeScale, useCustomTexts } from "@/remotion/shared/paper";
import {
  FAR_RAIN_STREAKS,
  MID_RAIN_STREAKS,
  NEAR_RAIN_STREAKS,
  MOISTURE_DROPS,
  sfxHits,
  teaAudio,
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
  const masterTlRef = useRef<gsap.core.Timeline | null>(null);

  // GSAP 确定性三层纵深雨景时间轴架构
  useEffect(() => {
    const ctx = gsap.context(() => {
      const masterTl = gsap.timeline({
        paused: true,
        defaults: { ease: "none" },
      });

      // ----------------------------------------------------
      // 时间轴 1：远景微细雨丝层 (缓慢、细腻、朦胧)
      // ----------------------------------------------------
      const farRainTl = gsap.timeline({ defaults: { ease: "none" } });
      FAR_RAIN_STREAKS.forEach((streak) => {
        const fallCycles = Math.ceil(5.0 / streak.speed) + 1;
        for (let c = 0; c < fallCycles; c++) {
          const tStart = streak.delay + c * streak.speed;
          if (tStart >= 5.0) break;
          const dur = Math.min(streak.speed, 5.0 - tStart);

          farRainTl.fromTo(
            `#far-rain-${streak.id}`,
            { attr: { y1: -100, y2: -100 + streak.length }, opacity: 0 },
            {
              attr: { y1: 2000, y2: 2000 + streak.length },
              opacity: streak.opacity,
              duration: dur,
            },
            tStart
          );
        }
      });

      // ----------------------------------------------------
      // 时间轴 2：中景连绵细雨丝层 (适中速度、清秀骨架)
      // ----------------------------------------------------
      const midRainTl = gsap.timeline({ defaults: { ease: "none" } });
      MID_RAIN_STREAKS.forEach((streak) => {
        const fallCycles = Math.ceil(5.0 / streak.speed) + 1;
        for (let c = 0; c < fallCycles; c++) {
          const tStart = streak.delay + c * streak.speed;
          if (tStart >= 5.0) break;
          const dur = Math.min(streak.speed, 5.0 - tStart);

          midRainTl.fromTo(
            `#mid-rain-${streak.id}`,
            { attr: { y1: -150, y2: -150 + streak.length }, opacity: 0 },
            {
              attr: { y1: 2050, y2: 2050 + streak.length },
              opacity: streak.opacity,
              duration: dur,
            },
            tStart
          );
        }
      });

      // ----------------------------------------------------
      // 时间轴 3：近景特写雨滴与雨丝 (小巧精致、疾速划过)
      // ----------------------------------------------------
      const nearRainTl = gsap.timeline({ defaults: { ease: "none" } });
      NEAR_RAIN_STREAKS.forEach((streak) => {
        const fallCycles = Math.ceil(5.0 / streak.speed) + 1;
        for (let c = 0; c < fallCycles; c++) {
          const tStart = streak.delay + c * streak.speed;
          if (tStart >= 5.0) break;
          const dur = Math.min(streak.speed, 5.0 - tStart);

          nearRainTl.fromTo(
            `#near-rain-${streak.id}`,
            { y: -250, opacity: 0 },
            {
              y: 2200,
              opacity: streak.opacity,
              duration: dur,
            },
            tStart
          );
        }
      });

      // ----------------------------------------------------
      // 时间轴 4：自然风偏微幅摇曳
      // ----------------------------------------------------
      const swayTl = gsap.timeline({ defaults: { ease: "sine.inOut" } });
      const swayKeyframes = [
        { time: 0.8, x: -16, rot: -5.0 },
        { time: 1.7, x: 20, rot: -3.0 },
        { time: 2.6, x: -10, rot: -5.5 },
        { time: 3.5, x: 15, rot: -3.5 },
        { time: 4.4, x: -8, rot: -4.5 },
      ];

      swayKeyframes.forEach((kf) => {
        swayTl.to(
          "#far-rain-layer",
          { x: kf.x * 0.4, rotation: kf.rot * 0.9, duration: 0.9 },
          kf.time - 0.8
        );
        swayTl.to(
          "#mid-rain-layer",
          { x: kf.x * 0.75, rotation: kf.rot, duration: 0.9 },
          kf.time - 0.8
        );
        swayTl.to(
          "#near-rain-layer",
          { x: kf.x * 1.15, rotation: kf.rot * 1.1, duration: 0.9 },
          kf.time - 0.8
        );
      });

      // ----------------------------------------------------
      // 时间轴 5：主舞台核心剧情演进
      // ----------------------------------------------------
      const storyTl = gsap.timeline({ defaults: { ease: "power2.out" } });

      // 0.0s - 0.6s: 顶部标题淡入上浮
      storyTl.fromTo(
        "#title-clip",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6 },
        0
      );

      // 0.4s: 印章落印
      storyTl.fromTo(
        "#stamp",
        { scale: 2.0, opacity: 0, rotation: -12 },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.35,
          ease: "back.out(2)",
          onStart: () => teaAudio.playStampWood(),
        },
        0.4
      );

      // 0.6s - 1.4s: 放大版中式湿度计指针自转（标准绝对定位旋转，杜绝任何位移或消失）
      storyTl.fromTo(
        "#hygrometer-needle",
        { rotation: -22 },
        {
          rotation: 62,
          duration: 0.55,
          ease: "back.out(1.8)",
          onStart: () => teaAudio.playAbacusTick(),
        },
        0.8
      );

      // 湿度计高湿警示标签跃现
      storyTl.fromTo(
        "#hygro-badge",
        { opacity: 0, scale: 0.85, x: -10 },
        { opacity: 1, scale: 1, x: 0, duration: 0.45, ease: "back.out(1.5)" },
        0.85
      );

      // 1.0s - 2.8s: 真实物理水汽瀑布倾泻
      storyTl.fromTo(
        "#moisture-stream-group",
        { opacity: 0, scaleY: 0.3 },
        { opacity: 0.88, scaleY: 1, duration: 0.8, ease: "power1.out" },
        1.0
      ).to(
        "#moisture-stream-group",
        { opacity: 0.42, duration: 1.2, ease: "sine.inOut" },
        2.2
      );

      // 36 颗精巧水滴垂直加速下落直灌入袋口 (1.05s ~ 2.65s)
      MOISTURE_DROPS.forEach((d) => {
        storyTl.fromTo(
          `#moisture-drop-${d.id}`,
          { y: 0, opacity: 0 },
          {
            y: d.y1 - d.y0,
            opacity: d.opacity,
            duration: d.duration,
            ease: "power2.in",
          },
          d.startTime
        ).to(
          `#moisture-drop-${d.id}`,
          {
            opacity: 0,
            duration: 0.08,
          },
          d.startTime + d.duration
        );
      });

      // 1.4s - 3.2s: 袋内白茶受潮物理形变与深墨绿暗化
      storyTl.fromTo(
        "#pouch-tea-leaves",
        { scaleY: 1 },
        {
          scaleY: 0.88,
          duration: 1.6,
          ease: "power1.inOut",
        },
        1.4
      );

      storyTl.to(
        "#pouch-tea-leaves path",
        {
          fill: "#3E4D38",
          filter: "brightness(0.72) saturate(0.65) sepia(0.35)",
          duration: 1.6,
          ease: "power2.inOut",
        },
        1.4
      );

      // 铝箔袋外壁浮现半透明冷凝水雾蒙版
      storyTl.fromTo(
        "#foil-condense-mist",
        { opacity: 0 },
        { opacity: 0.45, duration: 1.5, ease: "power1.inOut" },
        1.45
      );

      // 2.4s: 铝箔袋底垂直红色细虚线向下生长
      storyTl.fromTo(
        "#leader-line",
        { scaleY: 0 },
        { scaleY: 1, duration: 0.4, ease: "power2.out" },
        2.4
      );

      // 2.4s: 正下方弹性弹出米白底红框标牌「梅雨忌大开补茶 ✖」
      storyTl.fromTo(
        "#warning-card",
        { opacity: 0, y: 20, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "back.out(1.6)",
          onStart: () => teaAudio.playWoodSnap(),
        },
        2.4
      );

      // 组装主时间轴 (Master Timeline)
      masterTl
        .add(farRainTl, 0)
        .add(midRainTl, 0)
        .add(nearRainTl, 0)
        .add(swayTl, 0)
        .add(storyTl, 0);

      masterTlRef.current = masterTl;

      if (typeof window !== "undefined") {
        window.__timelines = window.__timelines || {};
        window.__timelines["b5_2"] = masterTl;
      }
    }, rootRef);

    return () => {
      ctx.revert();
      if (typeof window !== "undefined" && window.__timelines) {
        delete window.__timelines["b5_2"];
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
      data-composition-id="b5_2"
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

      {/* ---------------------------------------------------- */}
      {/* 1. 背景层：远景微雨丝 + 中景连绵细雨丝 (纯净底，无任何团状暗浊阴影) */}
      {/* ---------------------------------------------------- */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}
      >
        <defs>
          <linearGradient id="farRainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#CFD8DC" stopOpacity="0" />
            <stop offset="60%" stopColor="#90A4AE" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#78909C" stopOpacity="0.80" />
          </linearGradient>
          <linearGradient id="midRainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B0BEC5" stopOpacity="0.1" />
            <stop offset="60%" stopColor="#607D8B" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#455A64" stopOpacity="0.90" />
          </linearGradient>
        </defs>

        {/* 远景 60 根微细雨丝 */}
        <g id="far-rain-layer" style={{ transformOrigin: "540px 960px" }} transform="rotate(-4.5)">
          {FAR_RAIN_STREAKS.map((r) => (
            <line
              key={r.id}
              id={`far-rain-${r.id}`}
              x1={r.x}
              y1="-100"
              x2={r.x}
              y2={-100 + r.length}
              stroke="url(#farRainGrad)"
              strokeWidth={r.strokeWidth}
              strokeLinecap="round"
              opacity={0}
            />
          ))}
        </g>

        {/* 中景 42 根细雨丝 */}
        <g id="mid-rain-layer" style={{ transformOrigin: "540px 960px" }} transform="rotate(-5.0)">
          {MID_RAIN_STREAKS.map((r) => (
            <line
              key={r.id}
              id={`mid-rain-${r.id}`}
              x1={r.x}
              y1="-150"
              x2={r.x}
              y2={-150 + r.length}
              stroke="url(#midRainGrad)"
              strokeWidth={r.strokeWidth}
              strokeLinecap="round"
              opacity={0}
            />
          ))}
        </g>
      </svg>

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
          zIndex: 10,
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
          zIndex: 10,
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
          zIndex: 10,
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
          zIndex: 10,
        }}
      />

      {/* 2. 顶部主标区（Flex 居中横向排版，间距 gap: 24px，严禁覆盖） */}
      <div
        id="title-clip"
        style={{
          position: "absolute",
          top: 220,
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

      {/* 3. 主舞台区域：top: 660px 黄金中心，宽度 860px 居中 */}
      <div
        style={{
          position: "absolute",
          top: 660,
          left: (1080 - 860) / 2, // 110px
          width: 860,
          height: 820,
          zIndex: 20,
        }}
      >
        <svg
          width="860"
          height="820"
          viewBox="0 0 860 820"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <defs>
            {/* 哑光铝箔金属光泽 (Matte Brushed Aluminum Foil) */}
            <linearGradient id="foilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ede5d8" />
              <stop offset="22%" stopColor="#cfc2af" />
              <stop offset="45%" stopColor="#faf3e8" />
              <stop offset="68%" stopColor="#bfad97" />
              <stop offset="88%" stopColor="#ddd2c2" />
              <stop offset="100%" stopColor="#9a8772" />
            </linearGradient>

            {/* 侧风琴位阴影 */}
            <linearGradient id="foilGussetLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(50, 36, 24, 0.28)" />
              <stop offset="100%" stopColor="rgba(50, 36, 24, 0)" />
            </linearGradient>
            <linearGradient id="foilGussetRight" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="rgba(50, 36, 24, 0.28)" />
              <stop offset="100%" stopColor="rgba(50, 36, 24, 0)" />
            </linearGradient>

            {/* 袋口内衬银暗反光 */}
            <linearGradient id="innerFoilMouth" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2A221A" />
              <stop offset="40%" stopColor="#4A3F34" />
              <stop offset="70%" stopColor="#A8B4BC" />
              <stop offset="100%" stopColor="#DCE5EA" />
            </linearGradient>

            {/* 水汽羽化滤镜 */}
            <filter id="moisture-mist-blur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" />
            </filter>

            {/* 湿气水流线性渐变 */}
            <linearGradient id="mistStreamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#B0BEC5" stopOpacity="0.1" />
              <stop offset="40%" stopColor="#90A4AE" stopOpacity="0.48" />
              <stop offset="85%" stopColor="#78909C" stopOpacity="0.70" />
              <stop offset="100%" stopColor="#607D8B" stopOpacity="0.2" />
            </linearGradient>

            {/* 晶莹小水滴立体渐变 */}
            <radialGradient id="waterDropGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="30%" stopColor="#E1F5FE" />
              <stop offset="70%" stopColor="#039BE5" />
              <stop offset="100%" stopColor="#01579B" />
            </radialGradient>

            {/* 中式青铜表盘渐变 */}
            <radialGradient id="hygroBronzeGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#DFD8C8" />
              <stop offset="70%" stopColor="#B3A792" />
              <stop offset="100%" stopColor="#786B58" />
            </radialGradient>
          </defs>

          {/* 4. 上方悬挂环境指示：放大版中式湿度计与警戒标签 (直径 140px，居中 X: 430, Y: 110) */}
          <g id="hygrometer-group" transform="translate(430, 110)">
            {/* 悬挂古铜链绳 */}
            <line x1="0" y1="-110" x2="0" y2="-72" stroke="#8A735E" strokeWidth="3" strokeDasharray="5 4" />
            <circle cx="0" cy="-72" r="7" fill="#5C4D3E" />

            {/* 表盘外圈（外圈 r: 70px，直径 140px） */}
            <circle cx="0" cy="0" r="70" fill="url(#hygroBronzeGrad)" stroke="#4A382A" strokeWidth="4.5" />
            <circle cx="0" cy="0" r="60" fill="#F7F4EB" stroke="#8C7965" strokeWidth="2" />

            {/* 70%~100% 红色危险警戒区弧段 */}
            <path
              d="M 38 -38 A 54 54 0 0 1 54 0"
              stroke="#C33E32"
              strokeWidth="6.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* 常态安全区弧段 */}
            <path
              d="M -38 38 A 54 54 0 0 1 32 -43"
              stroke="#8A9A7B"
              strokeWidth="4"
              fill="none"
            />

            {/* 主要刻度线 */}
            <line x1="-38" y1="0" x2="-48" y2="0" stroke="#7A6856" strokeWidth="2.5" />
            <line x1="0" y1="-38" x2="0" y2="-48" stroke="#7A6856" strokeWidth="2.5" />
            <line x1="38" y1="0" x2="48" y2="0" stroke="#C33E32" strokeWidth="3.5" />
            <line x1="0" y1="38" x2="0" y2="48" stroke="#7A6856" strokeWidth="2.5" />

            {/* 表盘刻度文本 */}
            <text x="0" y="-20" fontSize="15" fontFamily={FONT_SONG} fill="#7A6856" textAnchor="middle" fontWeight="bold">
              环境湿度
            </text>
            <text x="-28" y="16" fontSize="13" fontFamily={FONT_SONG} fill="#7A6856" textAnchor="middle" fontWeight="bold">
              50%
            </text>
            <text x="30" y="-14" fontSize="14" fontFamily={FONT_SONG} fill="#C33E32" textAnchor="middle" fontWeight="900">
              85%
            </text>

            {/* 右侧悬浮警示红标：85% RH 梅雨高湿 */}
            <g id="hygro-badge" transform="translate(86, -26)" opacity="0">
              <rect
                x="0"
                y="0"
                width="168"
                height="52"
                rx="8"
                fill="#FAF5EE"
                stroke="#C33E32"
                strokeWidth="2.2"
                style={{ filter: "drop-shadow(0 6px 16px rgba(195, 62, 50, 0.25))" }}
              />
              <text x="16" y="32" fontSize="22" fontFamily={FONT_SONG} fontWeight="900" fill="#C33E32">
                85% RH
              </text>
              <text x="108" y="33" fontSize="14" fontFamily={FONT_SONG} fontWeight="700" fill="#75523E">
                梅雨高湿
              </text>
            </g>
          </g>

          {/* 5. 物理水汽羽化瀑布倾泻流 (1.0s - 2.8s 直灌入敞开袋口) */}
          <g id="moisture-stream-group" filter="url(#moisture-mist-blur)" opacity="0" style={{ transformOrigin: "430px 170px" }}>
            <path
              d="M 390 185 C 400 250 370 340 355 450 L 505 450 C 490 340 460 250 470 185 Z"
              fill="url(#mistStreamGrad)"
            />
          </g>

          {/* 6. 核心主体：大铝箔自封袋 (袋口平齐“大敞大开”) */}
          <g id="foil-pouch-group" transform="translate(320, 430)">
            {/* 铝箔袋自立阴影 */}
            <ellipse
              cx="110"
              cy="316"
              rx="110"
              ry="16"
              fill="rgba(40, 28, 18, 0.32)"
              style={{ filter: "blur(6px)" }}
            />

            {/* 1. 自立袋主体轮廓 */}
            <path
              d="M 22 55 L 198 55 L 214 290 C 214 304 200 314 182 318 L 38 318 C 20 314 6 304 6 290 Z"
              fill="url(#foilGrad)"
              stroke="#54402F"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />

            {/* 侧边风琴折叠暗角 */}
            <path d="M 6 55 L 26 55 L 38 318 L 34 318 C 18 314 6 304 6 290 Z" fill="url(#foilGussetLeft)" />
            <path d="M 214 55 L 194 55 L 182 318 L 186 318 C 202 314 214 304 214 290 Z" fill="url(#foilGussetRight)" />

            {/* 铝箔金属折皱立体挺括高光 */}
            <path d="M 28 55 L 48 318" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.65" />
            <path d="M 192 55 L 172 318" stroke="#423223" strokeWidth="1.8" strokeOpacity="0.35" />
            <path d="M 76 60 Q 105 180 72 318" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.4" />
            <path d="M 144 60 Q 115 180 148 318" stroke="#423223" strokeWidth="1.2" strokeOpacity="0.25" />

            {/* 底部自立接缝弧线 */}
            <path
              d="M 38 296 Q 110 318 182 296"
              stroke="#4a3726"
              strokeWidth="2.0"
              strokeOpacity="0.45"
              fill="none"
            />

            {/* 2. 正上茶舍 · 福鼎白茶 专用宣纸贴签 */}
            <g transform="translate(68, 105)">
              <rect
                x="0"
                y="0"
                width="84"
                height="136"
                rx="4"
                fill="#F7F3E9"
                stroke="#8A705B"
                strokeWidth="1.4"
                style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.16))" }}
              />
              <rect x="3" y="3" width="78" height="130" rx="2" fill="none" stroke="#8A705B" strokeWidth="0.8" strokeDasharray="4 2" />
              <rect x="34" y="9" width="16" height="16" rx="2" fill="#C33E32" />
              <text x="42" y="21" fontSize="10" fontFamily={FONT_SONG} fontWeight="900" fill="#ffffff" textAnchor="middle">
                正上
              </text>
              <text x="42" y="50" fontSize="16" fontFamily={FONT_SONG} fontWeight="900" fill="#2E2318" textAnchor="middle" letterSpacing="3">
                福鼎
              </text>
              <text x="42" y="70" fontSize="16" fontFamily={FONT_SONG} fontWeight="900" fill="#2E2318" textAnchor="middle" letterSpacing="3">
                白茶
              </text>
              <text x="42" y="88" fontSize="10" fill="#8A705B" textAnchor="middle">
                ◆
              </text>
              <text x="42" y="106" fontSize="10" fontFamily={FONT_SONG} fontWeight="700" fill="#5E4C3C" textAnchor="middle">
                原装大袋
              </text>
              <text x="42" y="122" fontSize="9" fontFamily={FONT_SONG} fontWeight="600" fill="#8A705B" textAnchor="middle">
                防潮锁香
              </text>
            </g>

            {/* 3. 关键状态：袋口平齐“大敞大开”口唇部与银箔内仓 */}
            <path
              d="M 22 24 C 60 4 160 4 198 24 L 198 52 C 160 32 60 32 22 52 Z"
              fill="#2A221A"
              stroke="#54402F"
              strokeWidth="2.0"
            />

            <ellipse cx="110" cy="38" rx="88" ry="24" fill="url(#innerFoilMouth)" stroke="#3D2A1C" strokeWidth="1.5" />

            {/* 4. 袋内白茶叶条索（受潮软化深墨绿塌陷） */}
            <g id="pouch-tea-leaves" style={{ transformOrigin: "110px 52px" }}>
              <path d="M 110 52 Q 112 28 110 18 Q 106 28 110 52 Z" fill="#6D7B4E" />
              <path d="M 110 48 Q 90 32 76 18 Q 96 26 110 48 Z" fill="#5B6A3E" />
              <path d="M 110 48 Q 130 32 144 18 Q 124 26 110 48 Z" fill="#637443" />
              <path d="M 85 54 Q 65 42 50 30 Q 75 38 88 52 Z" fill="#506135" />
              <path d="M 135 54 Q 155 42 170 30 Q 145 38 132 52 Z" fill="#546537" />
              <path d="M 98 52 Q 78 48 64 42 Q 88 47 100 52 Z" fill="#5C6D3F" />
              <path d="M 122 52 Q 142 48 156 42 Q 132 47 120 52 Z" fill="#617242" />
            </g>

            {/* 袋口大敞下翻前唇 */}
            <path
              d="M 20 42 C 60 62 160 62 200 42 L 198 58 C 160 76 60 76 22 58 Z"
              fill="url(#foilGrad)"
              stroke="#54402F"
              strokeWidth="2.0"
            />

            {/* 铝箔袋表面冷凝水雾蒙版 */}
            <path
              id="foil-condense-mist"
              d="M 22 55 L 198 55 L 214 290 C 214 304 200 314 182 318 L 38 318 C 20 314 6 304 6 290 Z"
              fill="rgba(176, 190, 197, 0.45)"
              opacity="0"
              style={{ mixBlendMode: "screen" }}
            />
          </g>

          {/* 7. 36 颗晶莹小水滴直灌入敞开袋口 */}
          <g id="moisture-drops-group">
            {MOISTURE_DROPS.map((d) => (
              <g key={d.id} id={`moisture-drop-${d.id}`} opacity="0">
                <ellipse
                  cx={d.x0}
                  cy={d.y0}
                  rx={d.r * 0.8}
                  ry={d.r * 1.4}
                  fill="url(#waterDropGrad)"
                  stroke="#01579B"
                  strokeWidth="0.8"
                />
                <circle cx={d.x0 - d.r * 0.25} cy={d.y0 - d.r * 0.45} r={d.r * 0.35} fill="#FFFFFF" opacity="0.95" />
              </g>
            ))}
          </g>
        </svg>

        {/* 4.1 独立绝对定位指针层 (left: 430, top: 110，以此中心严格纯 CSS 旋转，彻底免疫任何 SVG viewBox 干扰) */}
        <div
          id="hygrometer-needle"
          style={{
            position: "absolute",
            left: 430,
            top: 110,
            width: 0,
            height: 0,
            pointerEvents: "none",
            zIndex: 25,
          }}
        >
          <svg
            width="160"
            height="160"
            viewBox="-80 -80 160 160"
            style={{
              position: "absolute",
              left: -80,
              top: -80,
              overflow: "visible",
            }}
          >
            {/* 针尖微弱立体投影 */}
            <line x1="0" y1="12" x2="0" y2="-48" stroke="rgba(0,0,0,0.25)" strokeWidth="6" strokeLinecap="round" />
            {/* 赤红醒目粗壮指针主体 */}
            <line x1="0" y1="10" x2="0" y2="-48" stroke="#C33E32" strokeWidth="4.8" strokeLinecap="round" />
            <polygon points="0,-56 -7,-42 7,-42" fill="#C33E32" />
            {/* 双层立体中心固定铜轴 */}
            <circle cx="0" cy="0" r="8" fill="#4A3425" stroke="#7A6856" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="4" fill="#FAF5EE" />
          </svg>
        </div>

        {/* 单层实木案台 */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 0,
            width: "100%",
            height: 18,
            background: "linear-gradient(180deg, #8A6D56 0%, #634C3A 100%)",
            borderRadius: 5,
            boxShadow: "0 12px 24px rgba(74, 52, 37, 0.2)",
          }}
        />

        {/* 铝箔袋底部垂直红色细虚线 */}
        <div
          id="leader-line"
          style={{
            position: "absolute",
            bottom: -30,
            left: 430,
            width: 2,
            height: 90,
            borderLeft: "2px dashed #C33E32",
            transformOrigin: "top center",
          }}
        />

        {/* 正下方弹性弹出米白底红框标牌「梅雨忌大开补茶 ✖」 */}
        <div
          id="warning-card"
          style={{
            position: "absolute",
            bottom: -105,
            left: 250,
            padding: "16px 36px",
            background: "#FAF7F0",
            border: "2px solid #C33E32",
            borderRadius: 8,
            boxShadow: "0 10px 24px rgba(195, 62, 50, 0.16)",
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

      {/* ---------------------------------------------------- */}
      {/* 2. 前景层：24 根特写雨滴与雨丝 (小巧精致、自然雅致) */}
      {/* ---------------------------------------------------- */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 35 }}
      >
        <defs>
          <linearGradient id="nearRainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#78909C" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#37474F" stopOpacity="0.80" />
            <stop offset="100%" stopColor="#263238" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        <g id="near-rain-layer" style={{ transformOrigin: "540px 960px" }} transform="rotate(-5.5)">
          {NEAR_RAIN_STREAKS.map((r) => (
            <g key={r.id} id={`near-rain-${r.id}`} opacity={0}>
              {/* 高反差粗雨丝主体 */}
              <line
                x1={r.x}
                y1={0}
                x2={r.x}
                y2={r.length}
                stroke="url(#nearRainGrad)"
                strokeWidth={r.strokeWidth}
                strokeLinecap="round"
              />
              {/* 雨丝末端自然精致小水珠头 */}
              <ellipse
                cx={r.x}
                cy={r.length}
                rx={r.dropRadius ?? 2.4}
                ry={(r.dropRadius ?? 2.4) * 1.4}
                fill="#0288D1"
                stroke="#01579B"
                strokeWidth="0.8"
              />
              <circle
                cx={r.x - (r.dropRadius ?? 2.4) * 0.25}
                cy={r.length - (r.dropRadius ?? 2.4) * 0.35}
                r={(r.dropRadius ?? 2.4) * 0.35}
                fill="#FFFFFF"
                opacity="0.9"
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
