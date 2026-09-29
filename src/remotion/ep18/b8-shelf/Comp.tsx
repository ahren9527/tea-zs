import { AbsoluteFill, interpolate } from "remotion";
import { Paper, usePaperColors, useFontSizeScale, useCustomText } from "@/remotion/shared/paper";
import { popTransform } from "@/remotion/shared/breath";
import { SfxTrack } from "@/remotion/shared/sfx";
import { FONT } from "@/remotion/shared/theme";
import { useAppear } from "@/remotion/ep18/shared/appear";
import { FLOOR_AT, LENGTH, SCENE_AT, SHELF_AT, WALL_AT, sfxHits } from "./data";

export function duration(_staggerFrames: number) {
  return LENGTH;
}

const WALL_X = 90;
const WALL_W = 70;
const WALL_TOP = 320;
const GAP_W = 150;
const CAB_X = WALL_X + WALL_W + GAP_W;
const CAB_W = 560;
const FLOOR_Y = 1580;
const LEG_H = 110;
const CAB_BOT = FLOOR_Y - LEG_H;
const CAB_TOP = 430;
const CAB_H = CAB_BOT - CAB_TOP;
const BOX_W = 260;
const BOX_H = 150;
const BOX_X = CAB_X + (CAB_W - BOX_W) / 2;
const BOX_Y = 770;

export function Comp({ staggerFrames }: { staggerFrames: number }) {
  const colors = usePaperColors();
  const fontScale = useFontSizeScale();
  const rule1 = useCustomText("rule1", "离墙一尺");
  const rule2 = useCustomText("rule2", "离地半尺");
  const action = useCustomText("action", useCustomText("reason", "架起来放"));
  const scene = useAppear(SCENE_AT, 20);
  const wall = useAppear(WALL_AT, 18);
  const floor = useAppear(FLOOR_AT, 18);
  const shelf = useAppear(SHELF_AT, 16);
  const wallGrow = interpolate(wall.enter, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const floorGrow = interpolate(floor.enter, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const boxPulse = interpolate(shelf.enter, [0, 1], [1, 1.06], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Paper />
      <svg
        viewBox="0 0 1080 1920"
        width={1080}
        height={1920}
        style={{ position: "absolute", inset: 0, opacity: scene.opacity }}
      >
        <Floor />
        <Wall />
        <Cabinet />
        <rect
          x={WALL_X + WALL_W}
          y={CAB_TOP}
          width={GAP_W * wallGrow}
          height={CAB_H}
          fill={colors.seal}
          opacity={0.2 * wall.opacity}
        />
        <rect
          x={WALL_X + WALL_W + 4}
          y={CAB_TOP + 4}
          width={Math.max(0, GAP_W * wallGrow - 8)}
          height={CAB_H - 8}
          fill="none"
          stroke={colors.seal}
          strokeWidth="4"
          strokeDasharray="14 12"
          opacity={wall.opacity}
        />
        <rect
          x={CAB_X}
          y={FLOOR_Y - LEG_H * floorGrow}
          width={CAB_W}
          height={LEG_H * floorGrow}
          fill={colors.seal}
          opacity={0.2 * floor.opacity}
        />
        <rect
          x={CAB_X + 4}
          y={FLOOR_Y - LEG_H * floorGrow + 4}
          width={CAB_W - 8}
          height={Math.max(0, LEG_H * floorGrow - 8)}
          fill="none"
          stroke={colors.seal}
          strokeWidth="4"
          strokeDasharray="14 12"
          opacity={floor.opacity}
        />
        <g
          transform={`translate(${BOX_X + BOX_W / 2} ${BOX_Y + BOX_H / 2}) scale(${boxPulse}) translate(${-(BOX_X + BOX_W / 2)} ${-(BOX_Y + BOX_H / 2)})`}
        >
          <TeaBox glow={shelf.opacity} />
        </g>
        <HBrace x={WALL_X + WALL_W} y={980} w={GAP_W} opacity={wall.opacity} />
        <VBrace x={CAB_X + 86} y={CAB_BOT} h={LEG_H} opacity={floor.opacity} />
      </svg>
      <Chip left={WALL_X + WALL_W + GAP_W / 2} top={900} label={rule1} appear={wall} />
      <Chip left={CAB_X + CAB_W / 2} top={FLOOR_Y + 36} label={rule2} appear={floor} shiftY={0} />
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 120,
          textAlign: "center",
          opacity: shelf.opacity,
          transform: popTransform(shelf.enter, shelf.breath, 16, -2),
        }}
      >
        <span
          style={{
            display: "inline-block",
            background: colors.paper,
            color: colors.seal,
            padding: "14px 40px",
            borderRadius: 16,
            fontFamily: FONT,
            fontSize: Math.round(72 * fontScale),
            fontWeight: 600,
            letterSpacing: "0.22em",
            boxShadow: "0 4px 18px rgba(43,38,28,0.14)",
          }}
        >
          {action}
        </span>
      </div>
      <SfxTrack hits={sfxHits(staggerFrames)} />
    </AbsoluteFill>
  );
}

function Floor() {
  const colors = usePaperColors();
  return (
    <g>
      <line x1="70" y1={FLOOR_Y} x2="1010" y2={FLOOR_Y} stroke={colors.ink} strokeWidth="8" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={90 + i * 220}
          y1={FLOOR_Y}
          x2={40 + i * 220}
          y2="1760"
          stroke={colors.ink}
          strokeWidth="3"
          opacity="0.22"
        />
      ))}
      <text x="540" y="1810" textAnchor="middle" fill={colors.ink} opacity="0.5" fontFamily={FONT} fontSize="32" letterSpacing="0.28em">
        地
      </text>
    </g>
  );
}

function Wall() {
  const colors = usePaperColors();
  return (
    <g>
      <rect x={WALL_X} y={WALL_TOP} width={WALL_W} height={FLOOR_Y - WALL_TOP} fill={colors.paperDeep} stroke={colors.ink} strokeWidth="6" />
      <rect x={WALL_X + 12} y={540} width={46} height="220" fill="none" stroke={colors.ink} strokeWidth="3.5" />
      <line x1={WALL_X + 12} y1="650" x2={WALL_X + 58} y2="650" stroke={colors.ink} strokeWidth="3" />
      <line x1={WALL_X + 35} y1="540" x2={WALL_X + 35} y2="760" stroke={colors.ink} strokeWidth="3" />
      <text
        x={WALL_X + WALL_W / 2}
        y={WALL_TOP + 52}
        textAnchor="middle"
        dominantBaseline="central"
        fill={colors.ink}
        fontFamily={FONT}
        fontSize="34"
        fontWeight="600"
        letterSpacing="0.28em"
      >
        墙
      </text>
    </g>
  );
}

function Cabinet() {
  const colors = usePaperColors();
  const shelfYs = [640, 920, 1200];
  return (
    <g>
      <rect x={CAB_X} y={CAB_TOP} width={CAB_W} height={CAB_H} rx="10" fill="#c4a574" stroke={colors.ink} strokeWidth="6" />
      <rect x={CAB_X + 18} y={CAB_TOP + 18} width={CAB_W - 36} height={CAB_H - 36} rx="6" fill="#e2cba0" stroke={colors.ink} strokeWidth="3" opacity="0.95" />
      {shelfYs.map((y) => (
        <rect key={y} x={CAB_X + 28} y={y} width={CAB_W - 56} height="22" rx="3" fill="#8a6840" stroke={colors.ink} strokeWidth="2.5" />
      ))}
      <rect x={CAB_X + 36} y={CAB_BOT} width="44" height={LEG_H} rx="4" fill="#6d5236" stroke={colors.ink} strokeWidth="4" />
      <rect x={CAB_X + CAB_W - 80} y={CAB_BOT} width="44" height={LEG_H} rx="4" fill="#6d5236" stroke={colors.ink} strokeWidth="4" />
    </g>
  );
}

function TeaBox({ glow }: { glow: number }) {
  const colors = usePaperColors();
  return (
    <g>
      <rect
        x={BOX_X - 8}
        y={BOX_Y - 8}
        width={BOX_W + 16}
        height={BOX_H + 16}
        rx="10"
        fill={colors.seal}
        opacity={0.22 * glow}
      />
      <rect x={BOX_X} y={BOX_Y} width={BOX_W} height={BOX_H} rx="8" fill="#5a3720" stroke={colors.ink} strokeWidth="5" />
      <rect x={BOX_X + 16} y={BOX_Y + 16} width={BOX_W - 32} height={BOX_H - 32} rx="4" fill="none" stroke="#d8c39a" strokeWidth="3" />
      <text
        x={BOX_X + BOX_W / 2}
        y={BOX_Y + BOX_H / 2 + 18}
        textAnchor="middle"
        fill="#f3ecdc"
        fontFamily={FONT}
        fontSize="56"
        fontWeight="600"
        letterSpacing="0.2em"
      >
        茶
      </text>
    </g>
  );
}

function HBrace({ x, y, w, opacity }: { x: number; y: number; w: number; opacity: number }) {
  const colors = usePaperColors();
  return (
    <g opacity={opacity} stroke={colors.seal} strokeWidth="6" strokeLinecap="round" fill="none">
      <line x1={x} y1={y - 22} x2={x} y2={y + 22} />
      <line x1={x + w} y1={y - 22} x2={x + w} y2={y + 22} />
      <line x1={x} y1={y} x2={x + w} y2={y} />
    </g>
  );
}

function VBrace({ x, y, h, opacity }: { x: number; y: number; h: number; opacity: number }) {
  const colors = usePaperColors();
  return (
    <g opacity={opacity} stroke={colors.seal} strokeWidth="6" strokeLinecap="round" fill="none">
      <line x1={x - 22} y1={y} x2={x + 22} y2={y} />
      <line x1={x - 22} y1={y + h} x2={x + 22} y2={y + h} />
      <line x1={x} y1={y} x2={x} y2={y + h} />
    </g>
  );
}

function Chip({
  left,
  top,
  label,
  appear,
  shiftX = 0,
  shiftY = -86,
}: {
  left: number;
  top: number;
  label: string;
  appear: ReturnType<typeof useAppear>;
  shiftX?: number;
  shiftY?: number;
}) {
  const colors = usePaperColors();
  const fontScale = useFontSizeScale();
  if (appear.opacity <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: left + shiftX,
        top: top + shiftY,
        transform: `translateX(-50%) ${popTransform(appear.enter, appear.breath, 10, -2)}`,
        background: colors.paper,
        color: colors.seal,
        padding: "10px 22px",
        borderRadius: 14,
        fontFamily: FONT,
        fontSize: Math.round(44 * fontScale),
        fontWeight: 600,
        letterSpacing: "0.14em",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 18px rgba(43,38,28,0.14)",
        opacity: appear.opacity,
      }}
    >
      {label}
    </div>
  );
}
