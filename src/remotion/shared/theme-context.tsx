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

/** 参数仅为兼容旧片段的调用写法（第 19 期 Comp 传了 props），实际一律取 Context */
export function useFontSizeScale(_legacyOverride?: number): number {
  return useContext(FontSizeContext) || 1;
}

export function useScaledFontSize(baseSize: number): number {
  const scale = useFontSizeScale();
  return Math.round(baseSize * scale);
}

export function useCustomTexts(_legacyOverride?: Record<string, string>): Record<string, string> {
  return useContext(CustomTextContext) || {};
}

export function useCustomText(key: string, fallback: string = ""): string {
  const texts = useCustomTexts();
  const val = texts[key];
  return val !== undefined && val.trim() !== "" ? val : fallback;
}
