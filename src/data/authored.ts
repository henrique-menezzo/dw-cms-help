import { create } from 'zustand';
import type { Guide } from './guides';

/**
 * Guides written in the prototype's editor. Front only: drafts and published guides live in this browser
 * (localStorage), and `guideById` reads from here before the built-in guides.
 */
type Picking = { guide: string; section: string };

type Authored = {
  drafts: Record<string, Guide>;
  published: Record<string, Guide>;
  savedAt: Record<string, number>;
  /** the guide whose draft is being previewed in the CMS */
  preview: string | null;
  /** "Pick it on the page": which step is waiting for a spot */
  picking: Picking | null;
  v: number;
  saveDraft: (g: Guide) => void;
  publish: (id: string) => void;
  discardDraft: (id: string) => void;
  setPreview: (id: string | null) => void;
  setPicking: (p: Picking | null) => void;
};

const KEY = 'dwhelp.authored';
const read = (): Pick<Authored, 'drafts' | 'published' | 'savedAt'> => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { drafts: raw.drafts ?? {}, published: raw.published ?? {}, savedAt: raw.savedAt ?? {} };
  } catch {
    return { drafts: {}, published: {}, savedAt: {} };
  }
};

let timer: ReturnType<typeof setTimeout> | undefined;
const persist = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const { drafts, published, savedAt } = useAuthored.getState();
    try {
      localStorage.setItem(KEY, JSON.stringify({ drafts, published, savedAt }));
    } catch {
      /* too big for localStorage (lots of screenshots): it still works until the page reloads */
    }
  }, 400);
};

export const useAuthored = create<Authored>((set, get) => ({
  ...read(),
  preview: null,
  picking: null,
  v: 0,
  saveDraft: (g) => {
    set({ drafts: { ...get().drafts, [g.id]: g }, savedAt: { ...get().savedAt, [g.id]: Date.now() }, v: get().v + 1 });
    persist();
  },
  publish: (id) => {
    const d = get().drafts[id];
    if (!d) return;
    const drafts = { ...get().drafts };
    delete drafts[id];
    const live: Guide = { ...d, sample: false, updated: new Date().toISOString().slice(0, 10) };
    set({ drafts, published: { ...get().published, [id]: live }, preview: null, v: get().v + 1 });
    persist();
  },
  discardDraft: (id) => {
    const drafts = { ...get().drafts };
    delete drafts[id];
    set({ drafts, preview: get().preview === id ? null : get().preview, v: get().v + 1 });
    persist();
  },
  setPreview: (id) => set({ preview: id, v: get().v + 1 }),
  setPicking: (p) => set({ picking: p }),
}));

/** Re-render when anything authored changes. */
export const useAuthoredVersion = () => useAuthored((s) => s.v);
