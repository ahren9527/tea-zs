import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FONT_SONG } from "@/remotion/shared/theme";
import { usePaperColors } from "@/remotion/shared/paper";
import {
  BAG_OPEN_AT,
  CROSS_MARK,
  DROP_END_AT,
  DROP_START_AT,
  LEAF_RISE_AT,
  LENGTH,
  STAMP_AT,
  TITLE_TEXT,
  WATER_DROP_AT,
  sfxHits,
} from "./data";

export function duration(_staggerFrames: number) {
  return LENGTH;
}

type Props = {
  customTexts?: Record<string, string>;
  staggerFrames?: number;
};

export function Comp({ customTexts, staggerFrames = 0 }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = usePaperColors();

  const title = customTexts?.title ?? TITLE_TEXT;
  const crossMark = customTexts?.crossMark ?? CROSS_MARK;

  // 1. Content overall smooth entrance
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 18, mass: 0.9, stiffness: 75 },
  });
  const contentY = interpolate(enterSpring, [0, 1], [-70, 0]);
  const contentOpacity = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });

  // Subtle breathing after settled
  const breath = frame > 40 ? Math.sin((frame - 40) * 0.05) * 3.5 : 0;

  // 2. 朱砂红金石印章撞击入场 (scale 1.8 -> 1.0 at STAMP_AT = 1.0s)
  const stampProgress = spring({
    frame: frame - STAMP_AT,
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 180 },
  });
  const stampScale = interpolate(stampProgress, [0, 1], [1.8, 1.0]);
  const stampOpacity = interpolate(stampProgress, [0, 0.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stampRotate = interpolate(stampProgress, [0, 1], [14, -4]);

  // 3. 真实拉链开袋动效 (1.8s - 2.8s)
  const zipProgress = interpolate(frame, [BAG_OPEN_AT, BAG_OPEN_AT + 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 开袋微弹性抖动
  const shakeFrame = frame - BAG_OPEN_AT;
  const bagShake =
    shakeFrame >= 0 && shakeFrame < 22
      ? Math.sin(shakeFrame * 0.8) * Math.exp(-shakeFrame * 0.14) * 3.0
      : 0;

  // 4. 香气流失：单个茶叶绿芽图标（🍃）向上垂直升腾消散
  const leafFrame = frame - LEAF_RISE_AT;
  const leafLife = Math.min(1, Math.max(0, leafFrame / 46));
  const leafY = -leafLife * 230;
  const leafX = Math.sin(leafLife * Math.PI * 1.5) * 22;
  const leafOpacity =
    leafFrame < 0
      ? 0
      : interpolate(leafLife, [0, 0.2, 0.75, 1], [0, 1, 0.7, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const leafScale = interpolate(leafLife, [0, 0.3, 1], [0.5, 1.15, 1.35]);
  const leafRotate = -10 + leafLife * 30;

  // 5. 潮气入侵：袋口外侧单颗水滴图标（💧），伴随向下箭头钻入袋内
  const dropFrame = frame - WATER_DROP_AT;
  const dropLife = Math.min(1, Math.max(0, dropFrame / 32));
  const dropY = -150 + Math.pow(dropLife, 1.8) * 165;
  const dropOpacity =
    dropFrame < 0
      ? 0
      : interpolate(dropLife, [0, 0.2, 0.85, 1], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const dropScale = interpolate(dropLife, [0, 0.3, 0.9, 1], [0.4, 1.08, 0.9, 0.2]);

  // 6. 极简呼吸感仪表：进度条从 100% 缩短至 23%
  const gaugeRaw = interpolate(frame, [DROP_START_AT, DROP_END_AT], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const gaugeEased = 1 - Math.pow(1 - gaugeRaw, 3);
  const currentVal = Math.round(interpolate(gaugeEased, [0, 1], [100, 23]));

  // Color transition from bamboo green (#6D7B4E) to withered grey-brown (#8A7D70)
  const barR = Math.round(interpolate(gaugeEased, [0, 1], [109, 138]));
  const barG = Math.round(interpolate(gaugeEased, [0, 1], [123, 125]));
  const barB = Math.round(interpolate(gaugeEased, [0, 1], [78, 112]));
  const barColor = `rgb(${barR}, ${barG}, ${barB})`;

  const arrowBob = frame >= DROP_START_AT ? Math.sin(frame * 0.22) * 3 : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: 1080,
        height: 1920,
        backgroundColor: colors.paper,
        overflow: "hidden",
        fontFamily: FONT_SONG,
      }}
    >
      <SfxTrack hits={sfxHits(staggerFrames)} />

      {/* 澄心堂纸底纹 */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: 1080,
          height: 1920,
          pointerEvents: "none",
          opacity: 0.5,
          mixBlendMode: "multiply",
        }}
      >
        <filter id="bg-fiber">
          <feTurbulence type="fractalNoise" baseFrequency="0.038" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0.12" />
        </filter>
        <rect width="100%" height="100%" filter="url(#bg-fiber)" opacity="0.16" />
      </svg>

      {/* 动画直接设定在预设背景上，无方形卡片 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: contentOpacity,
          transform: `translateY(${contentY + breath}px)`,
        }}
      >
        {/* 1. 顶部核心定性：60px 宋体「频繁开大袋」 + 76px 朱砂红「✖」印章 */}
        <div
          style={{
            position: "absolute",
            top: 400,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          <span
            style={{
              fontSize: 62,
              fontWeight: 800,
              color: "#3D2A1C",
              letterSpacing: "0.14em",
              lineHeight: 1,
              textShadow: "0 4px 14px rgba(61, 42, 28, 0.18), 0 1px 3px rgba(61, 42, 28, 0.12)",
            }}
          >
            {title}
          </span>

          <div
            style={{
              transform: `scale(${stampScale}) rotate(${stampRotate}deg)`,
              transformOrigin: "center center",
              opacity: stampOpacity,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 76,
              height: 76,
              backgroundColor: "rgba(247, 243, 235, 0.95)",
              border: "3px solid #C33E32",
              borderRadius: 12,
              boxShadow:
                "0 14px 30px rgba(195, 62, 50, 0.35), 0 4px 10px rgba(61, 42, 28, 0.15), inset 0 0 0 1.5px #C33E32",
            }}
          >
            <span
              style={{
                fontSize: 62,
                fontWeight: 900,
                color: "#C33E32",
                lineHeight: 1,
                transform: "translateY(-1px)",
                display: "inline-block",
                filter: "drop-shadow(0 2px 4px rgba(195, 62, 50, 0.3))",
              }}
            >
              {crossMark}
            </span>
          </div>
        </div>

        {/* 2. 重绘白茶大铝箔立袋（参考真实福鼎白茶自立拉骨大铝箔袋写实造型） */}
        <div
          style={{
            position: "absolute",
            top: 610,
            left: (1080 - 270) / 2,
            width: 270,
            height: 330,
            transform: `rotate(${-2.0 + bagShake}deg)`,
            transformOrigin: "bottom center",
          }}
        >
          {/* 底部接地椭圆深邃阴影 */}
          <div
            style={{
              position: "absolute",
              bottom: -16,
              left: 15,
              width: 240,
              height: 42,
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse at center, rgba(40, 28, 18, 0.42) 0%, rgba(40, 28, 18, 0.16) 52%, transparent 75%)",
              filter: "blur(7px)",
              transform: "scaleY(0.65)",
              pointerEvents: "none",
            }}
          />

          {/* 真实福鼎白茶避光加厚铝箔袋高精度写实矢量 */}
          <svg
            width="270"
            height="330"
            viewBox="0 0 270 330"
            fill="none"
            style={{
              filter:
                "drop-shadow(0 26px 38px rgba(45, 30, 18, 0.28)) drop-shadow(0 8px 16px rgba(45, 30, 18, 0.16))",
            }}
          >
            <defs>
              {/* 哑光铝箔金属光泽 (Matte Brushed Aluminum Foil) */}
              <linearGradient id="pouchFoilReal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ede5d8" />
                <stop offset="22%" stopColor="#cfc2af" />
                <stop offset="45%" stopColor="#faf3e8" />
                <stop offset="68%" stopColor="#bfad97" />
                <stop offset="88%" stopColor="#ddd2c2" />
                <stop offset="100%" stopColor="#9a8772" />
              </linearGradient>

              {/* 侧风琴位阴影 (Side Gusset Shade) */}
              <linearGradient id="leftGusset" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(50, 36, 24, 0.28)" />
                <stop offset="100%" stopColor="rgba(50, 36, 24, 0)" />
              </linearGradient>
              <linearGradient id="rightGusset" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="rgba(50, 36, 24, 0.28)" />
                <stop offset="100%" stopColor="rgba(50, 36, 24, 0)" />
              </linearGradient>

              {/* 袋内银色铝箔反光 (Inner Silver Foil) */}
              <linearGradient id="innerFoil" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2a221a" />
                <stop offset="40%" stopColor="#5a4e42" />
                <stop offset="70%" stopColor="#cfd7dc" />
                <stop offset="100%" stopColor="#e8eff2" />
              </linearGradient>

              {/* 顶部热封网格压纹 (Heat-seal Crimping Texture) */}
              <pattern id="heatSealPattern" width="6" height="4" patternUnits="userSpaceOnUse">
                <rect width="6" height="2" fill="#5c4837" opacity="0.25" />
                <rect y="2" width="6" height="2" fill="#ffffff" opacity="0.35" />
              </pattern>
            </defs>

            {/* 1. 自立袋主体轮廓（立袋饱满风琴侧边与立体底座） */}
            <path
              d="M32 68 L238 68 L254 286 C254 298 244 310 226 314 L44 314 C26 310 16 298 16 286 Z"
              fill="url(#pouchFoilReal)"
              stroke="#54402F"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />

            {/* 侧边风琴折叠暗角 (Side Gusset Shading) */}
            <path d="M16 68 L36 68 L48 314 L44 314 C26 310 16 298 16 286 Z" fill="url(#leftGusset)" />
            <path d="M254 68 L234 68 L222 314 L226 314 C244 310 254 298 254 286 Z" fill="url(#rightGusset)" />

            {/* 铝箔自然挺括折痕高光与阴影 */}
            <path d="M38 68 L58 314" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.65" />
            <path d="M232 68 L212 314" stroke="#423223" strokeWidth="1.8" strokeOpacity="0.35" />
            <path d="M96 74 Q128 180 92 314" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.4" />
            <path d="M174 74 Q142 180 178 314" stroke="#423223" strokeWidth="1.2" strokeOpacity="0.25" />

            {/* 底部自立接缝弧线 (Bottom Gusset Fold Seam) */}
            <path
              d="M44 292 Q135 316 226 292"
              stroke="#4a3726"
              strokeWidth="2.0"
              strokeOpacity="0.45"
              fill="none"
            />

            {/* 2. 真实宣纸贴签（福鼎白茶 · 专用茶贴） */}
            <g transform="translate(85, 114)">
              {/* 贴签纸张微投影 */}
              <rect
                x="0"
                y="0"
                width="100"
                height="150"
                rx="4"
                fill="#F7F3E9"
                stroke="#8A705B"
                strokeWidth="1.4"
                style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.18))" }}
              />
              {/* 贴签内框细双线 */}
              <rect
                x="4"
                y="4"
                width="92"
                height="142"
                rx="2"
                fill="none"
                stroke="#8A705B"
                strokeWidth="0.8"
                strokeDasharray="4 2"
              />

              {/* 顶部小红印 */}
              <rect x="42" y="10" width="16" height="16" rx="2" fill="#C33E32" />
              <text
                x="50"
                y="22"
                fontSize="10"
                fontFamily={FONT_SONG}
                fontWeight="900"
                fill="#ffffff"
                textAnchor="middle"
              >
                正上
              </text>

              {/* 竖排标题：福鼎白茶 */}
              <text
                x="50"
                y="52"
                fontSize="18"
                fontFamily={FONT_SONG}
                fontWeight="900"
                fill="#2E2318"
                textAnchor="middle"
                letterSpacing="4"
              >
                福鼎
              </text>
              <text
                x="50"
                y="74"
                fontSize="18"
                fontFamily={FONT_SONG}
                fontWeight="900"
                fill="#2E2318"
                textAnchor="middle"
                letterSpacing="4"
              >
                白茶
              </text>

              {/* 装饰实心菱形 */}
              <text x="50" y="94" fontSize="10" fill="#8A705B" textAnchor="middle">
                ◆
              </text>

              {/* 锁香原装小字 */}
              <text
                x="50"
                y="112"
                fontSize="11"
                fontFamily={FONT_SONG}
                fontWeight="700"
                fill="#5E4C3C"
                textAnchor="middle"
                letterSpacing="1"
              >
                避光锁香
              </text>
              <text
                x="50"
                y="130"
                fontSize="10"
                fontFamily={FONT_SONG}
                fontWeight="600"
                fill="#8A705B"
                textAnchor="middle"
                letterSpacing="1"
              >
                大袋封存
              </text>
            </g>

            {/* 3. 顶部热压封口带与易撕口 (Heat Seal Strip & Tear Notches) */}
            <path
              d="M32 24 L238 24 L238 52 L32 52 Z"
              fill="url(#pouchFoilReal)"
              stroke="#54402F"
              strokeWidth="2.0"
            />
            {/* 压齿纹 */}
            <rect x="34" y="26" width="202" height="24" fill="url(#heatSealPattern)" />

            {/* 左右两侧 "U" 型易撕口 (Tear Notches) */}
            <path d="M32 38 L40 43 L32 48 Z" fill="#3D2A1C" />
            <path d="M238 38 L230 43 L238 48 Z" fill="#3D2A1C" />

            {/* 4. 自封拉骨开合部位 (Zipper Track & Open Lips) */}
            {/* 袋口内部（拉开后露出银箔与黑褐茶仓内衬） */}
            {zipProgress > 0 && (
              <path
                d={`M34 52 Q135 ${52 - zipProgress * 22} 236 52 Q135 ${52 + zipProgress * 26} 34 52 Z`}
                fill="url(#innerFoil)"
                stroke="#3D2A1C"
                strokeWidth="1.5"
              />
            )}

            {/* 拉骨轨道基底 */}
            <rect x="32" y="52" width="206" height="16" fill="#423427" rx="2" />
            <line
              x1="38"
              y1="60"
              x2="232"
              y2="60"
              stroke="#e8decb"
              strokeWidth="2.0"
              strokeDasharray="5 3"
            />

            {/* 前袋唇下翻 (Front opening lip pulled down as zipped) */}
            <path
              d={`M32 52 Q135 ${52 + zipProgress * 26} 238 52 L238 68 Q135 ${68 + zipProgress * 16} 32 68 Z`}
              fill="#524131"
              stroke="#3a2d21"
              strokeWidth="1.8"
            />

            {/* 拉链滑块 (Gold Metal Zipper Slider with realistic puller) */}
            <g transform={`translate(${38 + zipProgress * 180}, 50)`}>
              {/* Slider head */}
              <rect
                x="0"
                y="2"
                width="18"
                height="18"
                rx="3"
                fill="#d8b26e"
                stroke="#473827"
                strokeWidth="1.8"
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" }}
              />
              {/* Pull tab */}
              <path
                d="M4 18 L14 18 L16 34 L2 34 Z"
                fill="#b89352"
                stroke="#473827"
                strokeWidth="1.6"
              />
              <circle cx="9" cy="27" r="2.5" fill="#473827" />
            </g>
          </svg>

          {/* 香气流失：单个茶叶绿芽图标（🍃）向上垂直升腾消散 */}
          <div
            style={{
              position: "absolute",
              left: 110 + leafX,
              top: 40 + leafY,
              opacity: leafOpacity,
              transform: `scale(${leafScale}) rotate(${leafRotate}deg)`,
              transformOrigin: "center center",
              pointerEvents: "none",
              filter: "drop-shadow(0 14px 24px rgba(90, 115, 60, 0.45)) drop-shadow(0 4px 8px rgba(90, 115, 60, 0.25))",
            }}
          >
            <svg width="56" height="56" viewBox="0 0 46 46" fill="none">
              <path
                d="M12 36 C10 24 20 10 36 8 C36 24 24 38 12 36 Z"
                fill="#6D7B4E"
                stroke="#3E4C26"
                strokeWidth="2.2"
              />
              <path d="M14 34 Q24 22 34 10" stroke="#92B06F" strokeWidth="1.8" strokeLinecap="round" />
              <path
                d="M18 35 C12 28 16 18 24 16 C23 23 20 31 18 35 Z"
                fill="#92B06F"
                opacity="0.85"
              />
            </svg>
          </div>

          {/* 潮气入侵：袋口外侧单颗水滴图标（💧），伴随向下箭头钻入袋内 */}
          <div
            style={{
              position: "absolute",
              left: 180,
              top: 50 + dropY,
              opacity: dropOpacity,
              transform: `scale(${dropScale})`,
              transformOrigin: "center center",
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              filter: "drop-shadow(0 12px 20px rgba(50, 100, 140, 0.4)) drop-shadow(0 4px 8px rgba(50, 100, 140, 0.2))",
            }}
          >
            <svg width="44" height="54" viewBox="0 0 34 42" fill="none">
              <path
                d="M17 4 C17 4 30 18 30 26 C30 33.7 24.2 39 17 39 C9.8 39 4 33.7 4 26 C4 18 17 4 17 4 Z"
                fill="#548EAC"
                stroke="#2F5B73"
                strokeWidth="2.2"
              />
              <ellipse cx="13" cy="22" rx="3.8" ry="7.5" fill="#ffffff" opacity="0.75" transform="rotate(-20 13 22)" />
            </svg>

            {/* Down Arrow ↓ */}
            <span
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: "#2F5B73",
                lineHeight: 1,
                filter: "drop-shadow(0 2px 4px rgba(47, 91, 115, 0.3))",
              }}
            >
              ↓
            </span>
          </div>
        </div>

        {/* 3. 极简呼吸感仪表：直接悬浮在预设背景上，立体深邃 */}
        <div
          style={{
            position: "absolute",
            top: 1150,
            left: (1080 - 780) / 2,
            width: 780,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 28,
            padding: "16px 28px",
            borderRadius: 9999,
            backgroundColor: "rgba(247, 243, 235, 0.65)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(110, 83, 63, 0.18)",
            boxShadow:
              "0 18px 45px rgba(60, 42, 28, 0.12), 0 4px 14px rgba(60, 42, 28, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.8)",
          }}
        >
          {/* 左侧绿叶微标 🍃 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              filter: "drop-shadow(0 4px 8px rgba(70, 90, 45, 0.25))",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 34 34" fill="none">
              <path
                d="M8 26 C7 18 15 8 27 6 C27 18 18 28 8 26 Z"
                fill="#6D7B4E"
                stroke="#3E4C26"
                strokeWidth="1.8"
              />
              <path d="M9 25 Q17 16 25 8" stroke="#92B06F" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>

          {/* 中间细长立体进度条轨道 */}
          <div
            style={{
              position: "relative",
              flex: 1,
              height: 14,
              backgroundColor: "rgba(90, 68, 48, 0.14)",
              borderRadius: 9999,
              boxShadow: "inset 0 2px 4px rgba(45, 32, 20, 0.22), 0 1px 2px rgba(255, 255, 255, 0.6)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${currentVal}%`,
                height: "100%",
                borderRadius: 9999,
                backgroundColor: barColor,
                backgroundImage: `linear-gradient(90deg, ${barColor}, ${
                  currentVal > 60 ? "#8CA869" : "#8A7D70"
                })`,
                boxShadow: `0 0 14px ${barColor}88, inset 0 1px 2px rgba(255,255,255,0.4)`,
                transition: "none",
              }}
            />
          </div>

          {/* 右侧超大字号「23% ↓」 */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 4,
              flexShrink: 0,
              filter: "drop-shadow(0 4px 10px rgba(195, 62, 50, 0.25))",
            }}
          >
            <span
              style={{
                fontSize: 54,
                fontWeight: 900,
                color: "#C33E32",
                fontFamily: FONT_SONG,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {currentVal}
            </span>
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#C33E32",
                lineHeight: 1,
              }}
            >
              %
            </span>
            <span
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: "#C33E32",
                lineHeight: 1,
                marginLeft: 4,
                transform: `translateY(${arrowBob}px)`,
                display: "inline-block",
              }}
            >
              ↓
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
