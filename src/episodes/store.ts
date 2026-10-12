/**
 * 期数据存储：zustand + localStorage 自动保存。
 * 面板所有编辑都通过这里的 action，组件里不直接改对象。
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  cloneContent,
  DEFAULT_TIMING,
  duplicateEpisode,
  makeId,
  normalizeEpisode,
  renumberBeats,
  type Beat,
  type BeatTiming,
  type Episode,
  type FieldValue,
} from "@/templates/schema";
import { getTemplate, templateMeta } from "@/templates/registry";
import { seedEpisodes } from "./seeds";

export const STORAGE_KEY = "zs-episodes-v1";

type State = {
  episodes: Episode[];
  activeEpisodeId: string;
  activeBeatId: Record<string, string>;
  savedAt: number;
};

type Actions = {
  selectEpisode: (id: string) => void;
  selectBeat: (beatId: string) => void;
  createEpisode: (mode: "blank" | "copy", fromId?: string) => string;
  updateEpisode: (id: string, patch: Partial<Pick<Episode, "number" | "title" | "theme" | "fontScale">>) => void;
  deleteEpisode: (id: string) => void;
  importEpisode: (raw: unknown, opts?: { replaceId?: string }) => { id: string; warnings: string[] };
  addBeat: (templateId: string, afterBeatId?: string) => void;
  updateBeat: (beatId: string, patch: Partial<Omit<Beat, "id" | "content" | "timing">>) => void;
  setField: (beatId: string, key: string, value: FieldValue) => void;
  setTiming: (beatId: string, patch: Partial<BeatTiming>) => void;
  changeTemplate: (beatId: string, templateId: string) => void;
  resetBeatContent: (beatId: string) => void;
  moveBeat: (beatId: string, dir: -1 | 1) => void;
  reorderBeat: (from: number, to: number) => void;
  duplicateBeat: (beatId: string) => void;
  deleteBeat: (beatId: string) => void;
  renumber: () => void;
  restoreSeeds: () => void;
};

function initial(): State {
  const episodes = seedEpisodes();
  return { episodes, activeEpisodeId: episodes[0]?.id ?? "", activeBeatId: {}, savedAt: 0 };
}

function touch(ep: Episode): Episode {
  return { ...ep, updatedAt: Date.now() };
}

export const useEpisodes = create<State & Actions>()(
  persist(
    (set, get) => {
      /** 修改当前期 */
      const editActive = (fn: (ep: Episode) => Episode) =>
        set((s) => ({
          episodes: s.episodes.map((e) => (e.id === s.activeEpisodeId ? touch(fn(e)) : e)),
          savedAt: Date.now(),
        }));
      const editBeat = (beatId: string, fn: (b: Beat) => Beat) =>
        editActive((ep) => ({ ...ep, beats: ep.beats.map((b) => (b.id === beatId ? fn(b) : b)) }));

      return {
        ...initial(),
        selectEpisode: (id) => set({ activeEpisodeId: id }),
        selectBeat: (beatId) => set((s) => ({ activeBeatId: { ...s.activeBeatId, [s.activeEpisodeId]: beatId } })),
        createEpisode: (mode, fromId) => {
          const s = get();
          const maxNum = Math.max(0, ...s.episodes.map((e) => e.number));
          let ep: Episode;
          const src = s.episodes.find((e) => e.id === (fromId ?? s.activeEpisodeId));
          if (mode === "copy" && src) {
            ep = duplicateEpisode(src, { number: maxNum + 1, title: `${src.title.replace(/ · 经典定制$/, "")}（新一期）` });
          } else {
            const hook = getTemplate("hook-stamp");
            const close = getTemplate("closing-line");
            const beats: Beat[] = [hook, close]
              .filter((t): t is NonNullable<typeof t> => Boolean(t))
              .map((t, i) => ({
                id: makeId(),
                template: t.id,
                code: `B${i + 1}`,
                title: t.name.split(" · ")[0],
                content: cloneContent(t.defaults),
                timing: { ...DEFAULT_TIMING },
              }));
            ep = { id: makeId("ep"), number: maxNum + 1, title: "新一期", theme: src?.theme ?? "classic", fontScale: 1, beats, updatedAt: Date.now() };
          }
          set((st) => ({ episodes: [ep, ...st.episodes], activeEpisodeId: ep.id, savedAt: Date.now() }));
          return ep.id;
        },
        updateEpisode: (id, patch) =>
          set((s) => ({ episodes: s.episodes.map((e) => (e.id === id ? touch({ ...e, ...patch }) : e)), savedAt: Date.now() })),
        deleteEpisode: (id) =>
          set((s) => {
            const episodes = s.episodes.filter((e) => e.id !== id);
            return {
              episodes,
              activeEpisodeId: s.activeEpisodeId === id ? (episodes[0]?.id ?? "") : s.activeEpisodeId,
              savedAt: Date.now(),
            };
          }),
        importEpisode: (raw, opts) => {
          const { episode, warnings } = normalizeEpisode(raw, templateMeta);
          const s = get();
          if (opts?.replaceId) {
            episode.id = opts.replaceId;
            set({ episodes: s.episodes.map((e) => (e.id === opts.replaceId ? episode : e)), activeEpisodeId: episode.id, savedAt: Date.now() });
          } else {
            if (s.episodes.some((e) => e.id === episode.id)) episode.id = makeId("ep");
            set({ episodes: [episode, ...s.episodes], activeEpisodeId: episode.id, savedAt: Date.now() });
          }
          return { id: episode.id, warnings };
        },
        addBeat: (templateId, afterBeatId) => {
          const t = getTemplate(templateId);
          if (!t) return;
          const id = makeId();
          editActive((ep) => {
            const idx = afterBeatId ? ep.beats.findIndex((b) => b.id === afterBeatId) : ep.beats.length - 1;
            const beat: Beat = {
              id,
              template: t.id,
              code: `B${ep.beats.length + 1}`,
              title: t.name.split(" · ")[0],
              content: cloneContent(t.defaults),
              timing: { ...DEFAULT_TIMING },
            };
            const beats = [...ep.beats];
            beats.splice(idx + 1, 0, beat);
            return { ...ep, beats };
          });
          get().selectBeat(id);
        },
        updateBeat: (beatId, patch) => editBeat(beatId, (b) => ({ ...b, ...patch })),
        setField: (beatId, key, value) => editBeat(beatId, (b) => ({ ...b, content: { ...b.content, [key]: value } })),
        setTiming: (beatId, patch) => editBeat(beatId, (b) => {
          const timing = { ...b.timing, ...patch };
          if (patch.durationSec === undefined && "durationSec" in patch) delete timing.durationSec;
          return { ...b, timing };
        }),
        changeTemplate: (beatId, templateId) => {
          const t = getTemplate(templateId);
          if (!t) return;
          editBeat(beatId, (b) => {
            // 尽量保留同名字段的文案
            const content = cloneContent(t.defaults);
            for (const f of t.fields) {
              const old = b.content[f.key];
              if (old !== undefined && typeof old === typeof content[f.key] && !Array.isArray(old)) content[f.key] = old;
            }
            return { ...b, template: t.id, content };
          });
        },
        resetBeatContent: (beatId) =>
          editBeat(beatId, (b) => {
            const t = getTemplate(b.template);
            return t ? { ...b, content: cloneContent(t.defaults) } : b;
          }),
        moveBeat: (beatId, dir) =>
          editActive((ep) => {
            const i = ep.beats.findIndex((b) => b.id === beatId);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= ep.beats.length) return ep;
            const beats = [...ep.beats];
            [beats[i], beats[j]] = [beats[j], beats[i]];
            return { ...ep, beats };
          }),
        reorderBeat: (from, to) =>
          editActive((ep) => {
            if (from === to || from < 0 || to < 0 || from >= ep.beats.length || to >= ep.beats.length) return ep;
            const beats = [...ep.beats];
            const [b] = beats.splice(from, 1);
            beats.splice(to, 0, b);
            return { ...ep, beats };
          }),
        duplicateBeat: (beatId) => {
          const id = makeId();
          editActive((ep) => {
            const i = ep.beats.findIndex((b) => b.id === beatId);
            if (i < 0) return ep;
            const src = ep.beats[i];
            const copy: Beat = { ...src, id, code: `${src.code}′`, content: cloneContent(src.content), timing: { ...src.timing }, exportName: undefined };
            const beats = [...ep.beats];
            beats.splice(i + 1, 0, copy);
            return { ...ep, beats };
          });
          get().selectBeat(id);
        },
        deleteBeat: (beatId) => editActive((ep) => ({ ...ep, beats: ep.beats.filter((b) => b.id !== beatId) })),
        renumber: () => editActive((ep) => ({ ...ep, beats: renumberBeats(ep.beats.map((b) => ({ ...b, code: b.code.replace(/′+$/, "") || b.code }))) })),
        restoreSeeds: () =>
          set((s) => {
            const have = new Set(s.episodes.map((e) => e.id));
            const missing = seedEpisodes().filter((e) => !have.has(e.id));
            return { episodes: [...s.episodes, ...missing], savedAt: Date.now() };
          }),
      };
    },
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ episodes: s.episodes, activeEpisodeId: s.activeEpisodeId, activeBeatId: s.activeBeatId, savedAt: s.savedAt }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        if (!p.episodes || !Array.isArray(p.episodes) || !p.episodes.length) return current;
        // 存档经过 normalize，防止旧版本 / 手改坏数据导致白屏
        const episodes = p.episodes.map((raw) => normalizeEpisode(raw, templateMeta).episode);
        return {
          ...current,
          episodes,
          activeEpisodeId: episodes.some((e) => e.id === p.activeEpisodeId) ? p.activeEpisodeId! : episodes[0].id,
          activeBeatId: p.activeBeatId ?? {},
          savedAt: p.savedAt ?? 0,
        };
      },
    },
  ),
);

export function useActiveEpisode(): Episode | undefined {
  return useEpisodes((s) => s.episodes.find((e) => e.id === s.activeEpisodeId));
}
