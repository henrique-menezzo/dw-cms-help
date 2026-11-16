import { create } from 'zustand';
import type { ImgKey, Shot, Where } from './data/guides';
import { go } from './lib/router';
import slotLogo from './assets/cms/slot-logo.webp';
import slotPoster from './assets/cms/slot-poster.webp';
import slotThumb from './assets/cms/slot-thumbnail.webp';
import slotApp from './assets/cms/slot-appbg.webp';
import slotOtt from './assets/cms/slot-ott.webp';
import slotWeb from './assets/cms/slot-webbg.webp';

const thumbs = import.meta.glob('./assets/cms/thumb-*.webp', { eager: true, import: 'default' }) as Record<string, string>;
const thumb = (id: string) => thumbs[`./assets/cms/thumb-${id}.webp`];

export const SAMPLE_UPLOADS: Record<ImgKey, string> = {
  logo: slotLogo,
  poster: slotPoster,
  thumbnail: slotThumb,
  appbg: slotApp,
  ott: slotOtt,
  webbg: slotWeb,
};

export type Person = { name: string; role: string; primary?: boolean };
export type Movie = {
  id: string;
  title: string;
  desc: string;
  status: 'published' | 'draft';
  thumb?: string;
  images: Partial<Record<ImgKey, string>>;
  video: 'none' | 'ready';
  access: string[];
  host?: string;
  cast: Person[];
  created: string;
  by: string;
};

const published = (id: string, title: string): Movie => ({
  id,
  title,
  desc: '',
  status: 'published',
  thumb: thumb(id),
  images: { logo: thumb(id), poster: thumb(id), thumbnail: thumb(id), appbg: thumb(id), ott: thumb(id), webbg: thumb(id) },
  video: 'ready',
  access: ['All'],
  cast: [],
  created: 'Created: 2024-10-02, 09:12',
  by: 'Paul Snyder',
});

const MOVIES: Movie[] = [
  published('am-i-racist', 'Am I Racist?'),
  {
    id: 'am-i-racist-hd',
    title: 'Am I Racist? [HD]',
    desc: 'Matt Walsh goes undercover in the world of DEI to answer one question.',
    status: 'draft',
    thumb: thumb('am-i-racist-hd'),
    images: { logo: slotLogo, poster: slotPoster, thumbnail: slotThumb },
    video: 'none',
    access: [],
    host: 'Matt Walsh',
    cast: [],
    created: 'Created: 2026-11-12, 14:02',
    by: 'Paul Snyder',
  },
  published('newfoundland', 'A Tribute to Newfoundland'),
  published('choosing-life', 'Choosing Life [Beyond the Legacy of Roe]'),
  published('created-equal', 'Created Equal: Clarence Thomas in His Own Words'),
  published('identity-crisis', 'Identity Crisis'),
  published('lady-ballers', 'Lady Ballers'),
  published('lady-ballers-hd', 'Lady Ballers [HD]'),
];

type Ctx = { guide: string; section: string | null } | null;

/** What the help panel shows: its home, one topic, or one guide open on a step. */
export type HelpView = { open: boolean; guide: string | null; section: string | null; topic: string | null };

type State = {
  movies: Movie[];
  ctx: Ctx;
  help: HelpView;
  palette: boolean;
  setPalette: (open: boolean) => void;
  spot: { target: string; n: number } | null;
  pinned: number;
  done: Record<string, string[]>;
  toggleDone: (guide: string, section: string) => void;
  lightbox: { shots: Shot[]; i: number } | null;
  setCtx: (guide: string, section: string | null) => void;
  clearCtx: () => void;
  openHelp: (guide?: string | null, section?: string | null) => void;
  helpHome: () => void;
  openTopic: (topic: string) => void;
  toggleHelp: () => void;
  closeHelp: () => void;
  setSection: (id: string | null) => void;
  goThere: (w: Where, guide: string, section: string) => void;
  spotlight: (target: string) => void;
  clearSpot: () => void;
  openLightbox: (shots: Shot[], i: number) => void;
  closeLightbox: () => void;
  updateMovie: (id: string, patch: Partial<Movie>) => void;
  addMovie: (m: Movie) => void;
};

export const useStore = create<State>((set, get) => ({
  movies: MOVIES,
  ctx: null,
  help: { open: false, guide: null, section: null, topic: null },
  palette: false,
  setPalette: (palette) => set({ palette }),
  spot: null,
  pinned: 0,
  done: (() => {
    try {
      return JSON.parse(localStorage.getItem('dwhelp.done') ?? '{}');
    } catch {
      return {};
    }
  })(),
  toggleDone: (guide, section) => {
    const cur = get().done[guide] ?? [];
    const next = { ...get().done, [guide]: cur.includes(section) ? cur.filter((x) => x !== section) : [...cur, section] };
    try {
      localStorage.setItem('dwhelp.done', JSON.stringify(next));
    } catch {
      /* private mode */
    }
    set({ done: next });
  },
  lightbox: null,

  // The page tells the help where the person is. If the panel is showing this page's guide, it follows along.
  setCtx: (guide, section) => {
    const { help, ctx: prev } = get();
    if (prev && prev.guide === guide && prev.section === section) return;
    set({ ctx: { guide, section } });
    // a step picked on purpose ("Take me there", the publish checklist) wins over the screen it lands on
    if (Date.now() - get().pinned < 1200) return;
    if (help.open && help.guide && prev && help.guide === prev.guide) set({ help: { ...help, guide, section, topic: null } });
  },
  clearCtx: () => set({ ctx: null }),

  openHelp: (guide, section) => {
    const ctx = get().ctx;
    const g = guide !== undefined ? guide : ctx?.guide ?? null;
    const sec = section !== undefined ? section : g && g === ctx?.guide ? ctx.section : null;
    set({ help: { open: true, guide: g, section: sec, topic: null } });
  },
  helpHome: () => set((s) => ({ help: { ...s.help, guide: null, section: null, topic: null } })),
  openTopic: (topic) => set((s) => ({ help: { ...s.help, guide: null, section: null, topic } })),
  toggleHelp: () => (get().help.open ? get().closeHelp() : get().openHelp()),
  closeHelp: () => set((s) => ({ help: { ...s.help, open: false } })),
  setSection: (id) => set((s) => ({ help: { ...s.help, section: id } })),

  goThere: (w, guide, section) => {
    set({ pinned: Date.now() });
    go(w.to);
    set({ help: { open: true, guide, section, topic: null } });
    set({ spot: { target: w.target, n: Date.now() } });
  },
  spotlight: (target) => set({ spot: { target, n: Date.now() } }),
  clearSpot: () => set({ spot: null }),

  openLightbox: (shots, i) => set({ lightbox: { shots, i } }),
  closeLightbox: () => set({ lightbox: null }),

  updateMovie: (id, patch) => set((s) => ({ movies: s.movies.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
  addMovie: (m) => set((s) => ({ movies: [m, ...s.movies] })),
}));

export const isReady = (m: Movie) => ({
  desc: m.desc.trim().length > 0,
  images: (['logo', 'poster', 'thumbnail', 'appbg', 'ott', 'webbg'] as ImgKey[]).filter((k) => m.images[k]).length,
  video: m.video === 'ready',
  access: m.access.length > 0,
});
