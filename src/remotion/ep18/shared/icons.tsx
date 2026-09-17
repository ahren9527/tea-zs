import { COLORS } from "@/remotion/shared/theme";

export type Kind = "damp" | "smell" | "camphor" | "fridge" | "foil" | "bag" | "box";

const S = COLORS.seal;

export function LawIcon({ kind, size = 128 }: { kind: Kind; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden xmlns="http://www.w3.org/2000/svg">
      {kind === "smell" && <OilSmoke />}
      {kind === "damp" && <Damp />}
      {kind === "camphor" && <Camphor />}
      {kind === "fridge" && (
        <>
          <rect x="18" y="10" width="36" height="52" rx="6" fill={S} opacity="0.12" stroke={S} strokeWidth="4" />
          <line x1="18" y1="32" x2="54" y2="32" stroke={S} strokeWidth="4" />
          <line x1="46" y1="18" x2="46" y2="26" stroke={S} strokeWidth="4" strokeLinecap="round" />
          <line x1="46" y1="38" x2="46" y2="48" stroke={S} strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {kind === "foil" && (
        <rect x="12" y="22" width="48" height="28" rx="4" fill={S} opacity="0.12" stroke={S} strokeWidth="4" />
      )}
      {kind === "bag" && (
        <>
          <path d="M22 20 L50 20 L54 54 L18 54 Z" fill={S} opacity="0.12" stroke={S} strokeWidth="4" strokeLinejoin="round" />
          <path d="M28 20 C28 12 44 12 44 20" fill="none" stroke={S} strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {kind === "box" && (
        <>
          <path d="M12 28 L36 16 L60 28 L36 40 Z" fill={S} opacity="0.16" stroke={S} strokeWidth="4" strokeLinejoin="round" />
          <path d="M12 28 L12 48 L36 60 L36 40 Z" fill={S} opacity="0.08" stroke={S} strokeWidth="4" strokeLinejoin="round" />
          <path d="M60 28 L60 48 L36 60 L36 40 Z" fill="none" stroke={S} strokeWidth="4" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

function OilSmoke() {
  return (
    <>
      <path d="M20 30 C16 20 24 16 22 8" fill="none" stroke={S} strokeWidth="3.6" strokeLinecap="round" />
      <path d="M36 26 C30 14 42 12 38 4" fill="none" stroke={S} strokeWidth="4.2" strokeLinecap="round" />
      <path d="M52 30 C56 20 48 16 50 8" fill="none" stroke={S} strokeWidth="3.6" strokeLinecap="round" />
      <circle cx="22" cy="6" r="2.4" fill={S} />
      <circle cx="38" cy="3" r="2.8" fill={S} />
      <circle cx="50" cy="6" r="2.4" fill={S} />
      <path d="M8 44 L64 44" stroke={S} strokeWidth="4.2" strokeLinecap="round" />
      <path
        d="M14 44 C18 58 54 58 58 44"
        fill={S}
        opacity="0.14"
        stroke={S}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M6 42 L12 44" stroke={S} strokeWidth="4" strokeLinecap="round" />
      <path d="M66 42 L60 44" stroke={S} strokeWidth="4" strokeLinecap="round" />
      <path
        d="M28 62 C28 54 33 52 34 58 C36 52 42 54 38 64 C36 68 30 68 28 62Z"
        fill={S}
        opacity="0.28"
        stroke={S}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M40 63 C40 56 44 54 45 60 C47 54 52 56 48 66 C46 69 42 69 40 63Z"
        fill={S}
        opacity="0.18"
        stroke={S}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </>
  );
}

function Damp() {
  return (
    <>
      <path
        d="M20 30 C14 30 12 24 18 22 C18 14 28 12 32 18 C36 12 50 14 50 22 C58 22 60 30 52 32 Z"
        fill={S}
        opacity="0.14"
        stroke={S}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M22 42 C22 42 14 54 14 60 C14 66 18 70 22 70 C26 70 30 66 30 60 C30 54 22 42 22 42Z"
        fill={S}
        opacity="0.18"
        stroke={S}
        strokeWidth="3.6"
        strokeLinejoin="round"
      />
      <path
        d="M36 38 C36 38 26 54 26 62 C26 68 30 72 36 72 C42 72 46 68 46 62 C46 54 36 38 36 38Z"
        fill={S}
        opacity="0.22"
        stroke={S}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M50 44 C50 44 44 54 44 60 C44 65 47 69 50 69 C53 69 56 65 56 60 C56 54 50 44 50 44Z"
        fill={S}
        opacity="0.16"
        stroke={S}
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
    </>
  );
}

function Camphor() {
  return (
    <>
      <ellipse cx="36" cy="58" rx="24" ry="7" fill={S} opacity="0.1" stroke={S} strokeWidth="3.4" />
      <path d="M14 52 C16 46 20 42 36 42 C52 42 56 46 58 52" fill={S} opacity="0.08" stroke={S} strokeWidth="3.4" />
      <circle cx="24" cy="34" r="10" fill={S} opacity="0.16" stroke={S} strokeWidth="3.8" />
      <circle cx="36" cy="24" r="12" fill={S} opacity="0.2" stroke={S} strokeWidth="4" />
      <circle cx="48" cy="35" r="9" fill={S} opacity="0.16" stroke={S} strokeWidth="3.6" />
      <circle cx="21" cy="30" r="2.2" fill={COLORS.paper} />
      <circle cx="32" cy="20" r="2.6" fill={COLORS.paper} />
      <circle cx="45" cy="32" r="2" fill={COLORS.paper} />
    </>
  );
}

export function drawLawIcon(
  ctx: CanvasRenderingContext2D,
  kind: Kind,
  cx: number,
  cy: number,
  size: number,
) {
  const s = size / 72;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(s, s);
  ctx.strokeStyle = S;
  ctx.fillStyle = S;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (kind === "smell") {
    stroke(ctx, "M20 30 C16 20 24 16 22 8", 3.6);
    stroke(ctx, "M36 26 C30 14 42 12 38 4", 4.2);
    stroke(ctx, "M52 30 C56 20 48 16 50 8", 3.6);
    dot(ctx, 22, 6, 2.4, 1);
    dot(ctx, 38, 3, 2.8, 1);
    dot(ctx, 50, 6, 2.4, 1);
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(8, 44);
    ctx.lineTo(64, 44);
    ctx.stroke();
    fillStroke(ctx, "M14 44 C18 58 54 58 58 44", 4, 0.14);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(6, 42);
    ctx.lineTo(12, 44);
    ctx.moveTo(66, 42);
    ctx.lineTo(60, 44);
    ctx.stroke();
    fillStroke(ctx, "M28 62 C28 54 33 52 34 58 C36 52 42 54 38 64 C36 68 30 68 28 62Z", 2.6, 0.28);
    fillStroke(ctx, "M40 63 C40 56 44 54 45 60 C47 54 52 56 48 66 C46 69 42 69 40 63Z", 2.4, 0.18);
  } else if (kind === "damp") {
    fillStroke(ctx, "M20 30 C14 30 12 24 18 22 C18 14 28 12 32 18 C36 12 50 14 50 22 C58 22 60 30 52 32 Z", 4, 0.14);
    fillStroke(ctx, "M22 42 C22 42 14 54 14 60 C14 66 18 70 22 70 C26 70 30 66 30 60 C30 54 22 42 22 42Z", 3.6, 0.18);
    fillStroke(ctx, "M36 38 C36 38 26 54 26 62 C26 68 30 72 36 72 C42 72 46 68 46 62 C46 54 36 38 36 38Z", 4, 0.22);
    fillStroke(ctx, "M50 44 C50 44 44 54 44 60 C44 65 47 69 50 69 C53 69 56 65 56 60 C56 54 50 44 50 44Z", 3.4, 0.16);
  } else if (kind === "camphor") {
    ctx.lineWidth = 3.4;
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.ellipse(36, 58, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(36, 58, 24, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    fillStroke(ctx, "M14 52 C16 46 20 42 36 42 C52 42 56 46 58 52", 3.4, 0.08);
    ball(ctx, 24, 34, 10, 0.16, 3.8);
    ball(ctx, 36, 24, 12, 0.2, 4);
    ball(ctx, 48, 35, 9, 0.16, 3.6);
    ctx.fillStyle = COLORS.paper;
    dot(ctx, 21, 30, 2.2, 1);
    dot(ctx, 32, 20, 2.6, 1);
    dot(ctx, 45, 32, 2, 1);
  }

  ctx.restore();
}

function stroke(ctx: CanvasRenderingContext2D, d: string, w: number) {
  ctx.lineWidth = w;
  ctx.stroke(new Path2D(d));
}

function fillStroke(ctx: CanvasRenderingContext2D, d: string, w: number, a: number) {
  const p = new Path2D(d);
  ctx.lineWidth = w;
  ctx.globalAlpha = a;
  ctx.fill(p);
  ctx.globalAlpha = 1;
  ctx.stroke(p);
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  ctx.globalAlpha = a;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function ball(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, w: number) {
  ctx.lineWidth = w;
  ctx.globalAlpha = a;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}
