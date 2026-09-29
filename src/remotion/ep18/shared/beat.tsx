import { popTransform } from "@/remotion/shared/breath";
import { usePaperColors, useFontSizeScale } from "@/remotion/shared/paper";
import { FONT, SEAL_FONT } from "@/remotion/shared/theme";
import { LawIcon } from "./icons";
import { useAppear, useFadeOut } from "./appear";

type Kind = "damp" | "smell" | "camphor" | "fridge" | "foil" | "bag" | "box";

export function SoloWord({
  at,
  until,
  text,
  size = 96,
  color,
  stamp = false,
  kind,
}: {
  at: number;
  until?: number;
  text: string;
  size?: number;
  color?: string;
  stamp?: boolean;
  kind?: Kind;
}) {
  const colors = usePaperColors();
  const fontScale = useFontSizeScale();
  const activeColor = color ?? colors.ink;
  const { enter, opacity, breath } = useAppear(at);
  const hide = useFadeOut(until ?? 100_000, 8);
  const vis = opacity * hide;
  if (vis <= 0.01) return null;

  if (stamp) {
    const chars = text.split("");
    const box = chars.length > 2 ? 280 : 260;
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: vis,
          transform: popTransform(enter, breath, 16, -8),
        }}
      >
        <div
          style={{
            width: box,
            height: box,
            borderRadius: 8,
            border: `9px solid ${colors.seal}`,
            boxShadow: `inset 0 0 0 5px ${colors.seal}`,
            backgroundColor: colors.paper,
            color: colors.seal,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SEAL_FONT,
            fontSize: Math.round((chars.length > 2 ? 64 : 88) * fontScale),
            fontWeight: 900,
            lineHeight: 1.1,
          }}
        >
          {chars.map((ch) => (
            <span key={ch}>{ch}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        opacity: vis,
        transform: popTransform(enter, breath, 20, -3),
      }}
    >
      {kind ? <LawIcon kind={kind} /> : null}
      <div
        style={{
          fontFamily: FONT,
          fontSize: Math.round(size * fontScale),
          fontWeight: 600,
          color: activeColor,
          letterSpacing: "0.16em",
          textAlign: "center",
          lineHeight: 1.15,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function CenterStack({
  until,
  gap = 36,
  children,
}: {
  until?: number;
  gap?: number;
  children: React.ReactNode;
}) {
  const hide = useFadeOut(until ?? 100_000, 8);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap,
        opacity: hide,
      }}
    >
      {children}
    </div>
  );
}

export function CenterRow({
  until,
  gap = 28,
  children,
}: {
  until?: number;
  gap?: number;
  children: React.ReactNode;
}) {
  const hide = useFadeOut(until ?? 100_000, 8);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap,
        opacity: hide,
      }}
    >
      {children}
    </div>
  );
}

export function StackLine({
  at,
  text,
  size = 80,
  color,
}: {
  at: number;
  text: string;
  size?: number;
  color?: string;
}) {
  const colors = usePaperColors();
  const fontScale = useFontSizeScale();
  const activeColor = color ?? colors.ink;
  const { enter, opacity, breath } = useAppear(at);
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: Math.round(size * fontScale),
        fontWeight: 600,
        color: activeColor,
        letterSpacing: "0.16em",
        opacity,
        transform: popTransform(enter, breath, 18, -2),
      }}
    >
      {text}
    </div>
  );
}

export function MarkCard({
  at,
  label,
  kind,
}: {
  at: number;
  label: string;
  kind: Kind;
}) {
  const colors = usePaperColors();
  const fontScale = useFontSizeScale();
  const { enter, opacity, breath } = useAppear(at);
  return (
    <div
      style={{
        width: 300,
        height: 420,
        borderRadius: 32,
        backgroundColor: `${colors.seal}14`,
        border: `3px solid ${colors.seal}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        fontFamily: FONT,
        opacity,
        transform: popTransform(enter, breath, 22, -3),
      }}
    >
      <LawIcon kind={kind} size={148} />
      <div
        style={{
          fontSize: Math.round(48 * fontScale),
          fontWeight: 600,
          color: colors.seal,
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function SealChip({ at, text }: { at: number; text: string }) {
  const colors = usePaperColors();
  const fontScale = useFontSizeScale();
  const { enter, opacity, breath } = useAppear(at);
  return (
    <div
      style={{
        width: 240,
        height: 240,
        borderRadius: 12,
        border: `7px solid ${colors.seal}`,
        boxShadow: `inset 0 0 0 4px ${colors.seal}`,
        backgroundColor: colors.paper,
        color: colors.seal,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: SEAL_FONT,
        fontSize: Math.round(72 * fontScale),
        fontWeight: 900,
        letterSpacing: "0.08em",
        opacity,
        transform: popTransform(enter, breath, 22, -6),
      }}
    >
      {text}
    </div>
  );
}
