/**
 * 面板状态：当前期 / 当前节拍 / 每个节拍改过的文案。zustand + localStorage 自动保存。
 * 只存「改过的文案」，期和节拍列表永远来自代码（src/remotion/catalog.ts 自动发现）。
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FontChoice } from "@/remotion/shared/fonts";

export const STORAGE_KEY = "zs-panel-v2";
/** 旧版面板（模板期 + 定制期）的存档，首次打开新版时把定制期的改字迁移过来 */
const LEGACY_KEY = "zs-episodes-v1";

type State = {
  /** 当前期号；0 = 还没选过（默认最新一期） */
  episode: number;
  /** 每期上次选中的节拍 id */
  activeClip: Record<number, string>;
  /** 节拍 id → { 文案 key → 改过的文字 } */
  texts: Record<string, Record<string, string>>;
  /** 每期的整体字号倍数（0.8–1.3，默认 1） */
  fontScale: Record<number, number>;
  /** 每期的字体选择（不存 = 默认楷 / 宋） */
  fonts: Record<number, FontChoice>;
  savedAt: number;
};

type Actions = {
  selectEpisode: (n: number) => void;
  selectClip: (episode: number, clipId: string) => void;
  setText: (clipId: string, key: string, value: string) => void;
  resetText: (clipId: string, key: string) => void;
  resetClip: (clipId: string) => void;
  setFontScale: (episode: number, scale: number) => void;
  setFonts: (episode: number, patch: Partial<FontChoice> | null) => void;
};

/** 从旧存档里捞出定制节拍的改字（与默认值相同的不算） */
function legacyTexts(): Record<string, Record<string, string>> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as { state?: { episodes?: unknown[] } };
    const out: Record<string, Record<string, string>> = {};
    for (const ep of data.state?.episodes ?? []) {
      const beats = (ep as { beats?: unknown[] })?.beats ?? [];
      for (const b of beats) {
        const beat = b as { template?: string; content?: Record<string, unknown> };
        if (beat.template !== "bespoke" || !beat.content) continue;
        const clipId = String(beat.content.clipId ?? "");
        if (!clipId) continue;
        const map: Record<string, string> = {};
        for (const [k, v] of Object.entries(beat.content)) if (k !== "clipId" && typeof v === "string") map[k] = v;
        if (Object.keys(map).length) out[clipId] = map;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export const usePanel = create<State & Actions>()(
  persist(
    (set) => {
      const touch = () => ({ savedAt: Date.now() });
      return {
        episode: 0,
        activeClip: {},
        texts: {},
        fontScale: {},
        fonts: {},
        savedAt: 0,
        selectEpisode: (n) => set({ episode: n }),
        selectClip: (episode, clipId) =>
          set((s) => ({ episode, activeClip: { ...s.activeClip, [episode]: clipId } })),
        setText: (clipId, key, value) =>
          set((s) => ({ texts: { ...s.texts, [clipId]: { ...s.texts[clipId], [key]: value } }, ...touch() })),
        resetText: (clipId, key) =>
          set((s) => {
            const next = { ...s.texts[clipId] };
            delete next[key];
            return { texts: { ...s.texts, [clipId]: next }, ...touch() };
          }),
        setFontScale: (episode, scale) =>
          set((s) => ({ fontScale: { ...s.fontScale, [episode]: Math.min(1.3, Math.max(0.8, scale)) }, ...touch() })),
        setFonts: (episode, patch) =>
          set((s) => {
            const next = { ...s.fonts };
            if (patch === null) delete next[episode];
            else next[episode] = { ...(s.fonts[episode] ?? { body: "kai", title: "song" }), ...patch };
            return { fonts: next, ...touch() };
          }),
        resetClip: (clipId) =>
          set((s) => {
            const next = { ...s.texts };
            delete next[clipId];
            return { texts: next, ...touch() };
          }),
      };
    },
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ episode: s.episode, activeClip: s.activeClip, texts: s.texts, fontScale: s.fontScale, fonts: s.fonts, savedAt: s.savedAt }),
      merge: (persisted, current) => {
        const p = (persisted ?? null) as Partial<State> | null;
        if (!p) return { ...current, texts: legacyTexts() };
        return {
          ...current,
          episode: typeof p.episode === "number" ? p.episode : 0,
          activeClip: p.activeClip && typeof p.activeClip === "object" ? p.activeClip : {},
          texts: p.texts && typeof p.texts === "object" ? p.texts : {},
          fontScale: p.fontScale && typeof p.fontScale === "object" ? p.fontScale : {},
          fonts: p.fonts && typeof p.fonts === "object" ? p.fonts : {},
          savedAt: typeof p.savedAt === "number" ? p.savedAt : 0,
        };
      },
    },
  ),
);

/** 等本机存档读完再渲染，避免首屏闪一下默认值 */
export function rehydratePanel(onDone: () => void): () => void {
  const unsub = usePanel.persist.onFinishHydration(onDone);
  void usePanel.persist.rehydrate();
  if (usePanel.persist.hasHydrated()) onDone();
  return unsub;
}
