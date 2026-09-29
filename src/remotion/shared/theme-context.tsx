import { createContext, useContext } from "react";
import { PAPER_THEMES, type PaperThemeKey } from "./theme";

export const PaperThemeContext = createContext<PaperThemeKey>("classic");
export const FontSizeContext = createContext<number>(1);
export const CustomTextContext = createContext<Record<string, string>>({});

export function usePaperTheme(): PaperThemeKey {
  return useContext(PaperThemeContext);
}

export function usePaperColors() {
  const key = usePaperTheme();
  return PAPER_THEMES[key] ?? PAPER_THEMES.classic;
}

export function useFontSizeScale(): number {
  return useContext(FontSizeContext) || 1;
}

export function useScaledFontSize(baseSize: number): number {
  const scale = useFontSizeScale();
  return Math.round(baseSize * scale);
}

export function useCustomTexts(): Record<string, string> {
  return useContext(CustomTextContext) || {};
}

export function useCustomText(key: string, fallback: string = ""): string {
  const texts = useCustomTexts();
  const val = texts[key];
  return val !== undefined && val.trim() !== "" ? val : fallback;
}
