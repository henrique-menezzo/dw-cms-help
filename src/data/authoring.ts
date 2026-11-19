import type { Block, Guide, Section, Shot } from './guides';
import { featureBySlug, groupById, type Feature } from './nav';
import { parse } from '../lib/router';

export const uid = () => 'step-' + Math.random().toString(36).slice(2, 7);

/** A new guide. The outline gives a non-writer the usual shape of a CMS task to fill in. */
export function starterGuide(f: Feature, title: string, outline: boolean): Guide {
  const g = groupById(f.group)!;
  const step = (t: string, hint: string): Section => ({ id: uid(), title: t, blocks: [{ t: 'p', text: '' }], hint });
  return {
    id: f.slug,
    title,
    intro: '',
    updated: new Date().toISOString().slice(0, 10),
    sample: false,
    related: [],
    sections: outline
      ? [
          step(`Open ${f.name}`, `Where to find it. For example: in the sidebar, open ${g.name} and click ${f.name}.`),
          step('Add a new one', 'What to click to start, and what opens.'),
          step('Fill in the details', 'Which fields matter and what goes in each one.'),
          step('Publish', 'How to make it live, and how to check it worked.'),
        ]
      : [step('', 'What to do in this step.')],
  };
}

/** Plain names for the spots a step can point at (the `data-help` marks on CMS screens). */
const SPOTS: Record<string, string> = {
  'add-movie': 'Add New Movie button',
  'create-title': 'Title field',
  'movie-tabs': 'Tabs along the top',
  images: 'Images',
  schedule: 'Schedule & Restrictions',
  'tab-panel': 'Tab content',
  membership: 'Membership Access',
  publish: 'Publish Now button',
  'details-card': 'Movie Details',
  'feature-add': 'Add New button',
  'feature-search': 'Search bar',
  'feature-list': 'List of items',
  howto: 'Help button',
};
export const spotLabel = (target: string) => SPOTS[target] ?? target.replace(/-/g, ' ');

const TABS: Record<string, string> = { media: 'Media', schedule: 'Schedule & Restrictions', cast: 'Cast & Hosts', extras: 'Related Extras', more: 'More Like This', shop: 'Shop Items' };

/** "Movies", "Create Movie window", "Movie page · Media tab", or the feature's name. */
export function pageLabel(to: string): string {
  const r = parse('#' + to);
  const [a, b, c] = r.parts;
  if (a === 'content' && b === 'movies') {
    if (c) return `Movie page · ${TABS[r.q.get('tab') ?? 'media'] ?? 'Media'} tab`;
    return r.q.get('new') ? 'Create Movie window' : 'Movies';
  }
  return featureBySlug(b ?? '')?.name ?? 'CMS';
}

const filled = (b: Block): boolean => {
  switch (b.t) {
    case 'p':
    case 'h':
    case 'callout':
      return !!b.text.trim();
    case 'steps':
    case 'list':
      return b.items.some((x) => x.trim());
    case 'defs':
      return b.items.some(([k, v]) => k.trim() && v.trim());
    case 'shots':
      return b.shots.length > 0;
    case 'video':
      return !!b.src;
    case 'more':
      return b.blocks.some(filled);
    case 'specs':
      return true;
  }
};
export const stepHasContent = (s: Section) => s.blocks.some(filled);

/** What has to be true before a guide can go live. */
export function readiness(g: Guide) {
  return [
    { label: 'A title', ok: !!g.title.trim() },
    { label: 'A one-line description', ok: !!g.intro.trim() },
    { label: 'At least one step', ok: g.sections.length > 0 },
    { label: 'Every step has a title', ok: g.sections.length > 0 && g.sections.every((s) => s.title.trim()) },
    { label: 'Every step says what to do', ok: g.sections.length > 0 && g.sections.every(stepHasContent) },
  ];
}

/** Screenshots are kept as data URLs so a draft survives a reload. Capped at 2400px wide (a 2x screen at 1200). */
export function readImage(file: File | Blob, alt = ''): Promise<Shot> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 2400 / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      // 1x screenshots would show at half size (the guide assumes 2x captures), so count them double
      const retina = img.naturalWidth >= 1600;
      resolve({ src: c.toDataURL('image/webp', 0.85), alt, w: retina ? w : w * 2, h: retina ? h : h * 2 });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('not an image'));
    };
    img.src = url;
  });
}
