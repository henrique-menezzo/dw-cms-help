import { FEATURES, featureBySlug } from './nav';
import { useAuthored } from './authored';
import slotLogo from '../assets/cms/slot-logo.webp';
import slotPoster from '../assets/cms/slot-poster.webp';
import slotThumb from '../assets/cms/slot-thumbnail.webp';
import slotApp from '../assets/cms/slot-appbg.webp';
import slotOtt from '../assets/cms/slot-ott.webp';
import slotWeb from '../assets/cms/slot-webbg.webp';

const files = import.meta.glob('../assets/guides/movies/*.webp', { eager: true, import: 'default' }) as Record<string, string>;
const DIMS: Record<number, [number, number]> = {
  1: [1920, 1146], 2: [1920, 1093], 3: [1920, 1092], 4: [1920, 1093], 5: [1920, 1089], 6: [1920, 1093],
  7: [1920, 1084], 8: [1920, 1096], 9: [1920, 1090], 10: [1920, 1093], 11: [1920, 1094], 12: [1920, 1090],
  13: [1920, 1092], 14: [1920, 1093], 15: [1920, 1094], 16: [1920, 1094], 17: [1150, 438], 18: [700, 646],
};
const shot = (n: number, alt: string): Shot => ({ src: files[`../assets/guides/movies/${String(n).padStart(2, '0')}.webp`], alt, w: DIMS[n][0], h: DIMS[n][1] });

export type Shot = { src: string; alt: string; w?: number; h?: number };
export type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'steps'; items: string[] }
  | { t: 'list'; items: string[] }
  | { t: 'defs'; items: [string, string][] }
  | { t: 'callout'; tone: 'tip' | 'warn' | 'note'; text: string; emoji?: string }
  | { t: 'shots'; shots: Shot[] }
  | { t: 'specs' }
  | { t: 'more'; title: string; blocks: Block[] }
  | { t: 'video'; src: string; name: string };

/** Where a step happens in the CMS. `to` is a hash path, `target` a data-help anchor on that page. */
export type Where = { to: string; target: string };

export type Section = { id: string; title: string; blocks: Block[]; where?: Where; /** editor placeholder */ hint?: string };

export type Guide = {
  id: string; // feature slug
  title: string;
  intro: string;
  covers?: string[];
  updated: string; // ISO date
  sample: boolean;
  sections: Section[];
  recap?: string[];
  outro?: { emoji: string; title: string; text: string };
  related: string[];
};

/* ---------- image specs: one source for the guide table and the hints on the upload slots ---------- */
export type ImgKey = 'logo' | 'poster' | 'thumbnail' | 'appbg' | 'ott' | 'webbg';
export type ImageSpec = {
  key: ImgKey;
  say: string;
  name: string;
  ratio: string;
  logo: boolean | null;
  web: boolean;
  app: boolean;
  tv: boolean;
  note?: string;
  example: string;
};

export const IMAGE_SPECS: ImageSpec[] = [
  { key: 'logo', say: 'Wide PNG with a transparent background and no padding.', name: 'Logo', ratio: 'Horizontal', logo: null, web: true, app: true, tv: true, note: 'PNG, transparent background, no padding', example: slotLogo },
  { key: 'thumbnail', say: '16:9, with the logo on it.', name: 'Thumbnail', ratio: '16:9', logo: true, web: true, app: true, tv: true, example: slotThumb },
  { key: 'poster', say: 'Tall 9:16, with the logo on it.', name: 'Poster', ratio: '9:16', logo: true, web: true, app: true, tv: true, example: slotPoster },
  { key: 'webbg', say: 'Wide 8:3 for the website. No logo, subject on the right.', name: 'Web Background', ratio: '8:3 (large)', logo: false, web: true, app: false, tv: false, note: 'Subject in the right two-thirds', example: slotWeb },
  { key: 'ott', say: '16:9 for the TV apps. No logo, subject on the right.', name: 'TV Background', ratio: '16:9 (large)', logo: false, web: false, app: false, tv: true, note: 'Subject in the right two-thirds', example: slotOtt },
  { key: 'appbg', say: '3:4 for the phone app. No logo, subject near the top.', name: 'App Background', ratio: '3:4', logo: false, web: false, app: true, tv: false, note: 'Future use. Subject centered in the top half', example: slotApp },
];

export const specByKey = (k: ImgKey) => IMAGE_SPECS.find((s) => s.key === k)!;

export function specHint(s: ImageSpec) {
  const where = [s.web && 'Web', s.app && 'App', s.tv && 'TV'].filter(Boolean).join(', ');
  const logo = s.logo === true ? 'With logo' : s.logo === false ? 'No logo' : null;
  return { line: [logo, where].filter(Boolean).join(' · '), note: s.note };
}

/* ---------- the Movies guide, moved from the Slack canvas "How To: Manage Movies in the DW CMS" ---------- */
const DRAFT = '/content/movies/am-i-racist-hd';

const movies: Guide = {
  id: 'movies',
  title: 'Manage Movies',
  intro: 'Everything you need to add a movie to DW+ and get it live.',
  covers: [
    'Create a new movie entry',
    'Add media files and artwork',
    'Link extras, hosts, related titles and products',
    'Control who can watch and when',
    'Publish with confidence',
  ],
  updated: '2026-11-13',
  sample: false,
  related: ['extras', 'hosts', 'shows', 'shop-items'],
  sections: [
    {
      id: 'start',
      title: 'Start with Add New Movie',
      where: { to: '/content/movies', target: 'add-movie' },
      blocks: [
        {
          t: 'steps',
          items: ['Open **Movies** in the sidebar, or go straight to cms-prod.dailywire.com/movies.', 'Click **Add New Movie** in the top-right corner.'],
        },
        { t: 'callout', tone: 'note', text: 'This is where your movie officially begins.', emoji: '🪄' },
        { t: 'shots', shots: [shot(1, 'Movies: Add New Movie sits in the top-right corner.')] },
      ],
    },
    {
      id: 'basics',
      title: 'Fill out the basics',
      where: { to: '/content/movies?new=1', target: 'create-title' },
      blocks: [
        { t: 'p', text: 'A **Create Movie** window opens. Fill in three things:' },
        {
          t: 'defs',
          items: [
            ['Title', 'The movie’s name, exactly as people will see it on DW+.'],
            ['Description', 'One or two short sentences about the movie.'],
            ['Slug', 'The end of the page’s web address. It fills in from the title, so you can usually leave it.'],
          ],
        },
        { t: 'p', text: 'Click **Save**. You now have a draft.' },
        { t: 'callout', tone: 'tip', text: 'Short, punchy descriptions outperform paragraphs.', emoji: '🎯' },
        { t: 'shots', shots: [shot(2, 'Create Movie: title, description and slug.')] },
      ],
    },
    {
      id: 'details',
      title: 'Explore the movie details page',
      where: { to: `${DRAFT}?tab=media`, target: 'movie-tabs' },
      blocks: [
        { t: 'p', text: 'After you save, the movie’s page opens. Everything you add from here on lives in the **tabs along the top**.' },
        { t: 'p', text: 'The panel on the left shows the movie’s details and who can watch it. **Publish Now** is in the top-right corner.' },
        { t: 'callout', tone: 'warn', text: 'Delete removes the movie for good. There’s no undo.' },
        { t: 'shots', shots: [shot(3, 'The movie editor. Details on the left, tabs on the right.')] },
      ],
    },
    {
      id: 'media',
      title: 'Add media',
      where: { to: `${DRAFT}?tab=media`, target: 'images' },
      blocks: [
        { t: 'p', text: 'Every movie needs six images and the video file.' },
        { t: 'callout', tone: 'warn', text: 'If any image is missing, the movie won’t pass QA.', emoji: '🧩' },
        { t: 'h', text: 'Images' },
        { t: 'p', text: 'Click an empty box on the **Media** tab and pick the file. Each box needs a different shape:' },
        { t: 'specs' },
        { t: 'shots', shots: [shot(4, 'Media tab: one box per image.')] },
        { t: 'h', text: 'Video' },
        {
          t: 'steps',
          items: [
            'Click the box under **Movie Video**.',
            'Leave the first screen as it is and click **Next**.',
            'Drop in the video file (MP4, 16:9) and wait for it to finish processing.',
            'Add the subtitles file (.vtt) if you have one, then click **Finish**.',
          ],
        },
        {
          t: 'more',
          title: 'What the upload options mean',
          blocks: [
            {
              t: 'defs',
              items: [
                ['Media size', 'Leave it on Movie Widescreen.'],
                ['Video static rendition', 'Turn it on so members can download the movie to watch offline.'],
                ['Audio static rendition', 'You won’t need it for movies.'],
                ['Auto generate subtitles', 'Turn it on if you don’t have a subtitles file.'],
                ['Playback policy', 'Leave it on Signed. Choose DRM only for movies licensed from a studio.'],
                ['Media rating', 'Optional. TV-MA asks viewers to confirm their age before playing.'],
              ],
            },
          ],
        },
        { t: 'shots', shots: [shot(5, 'Upload Primary Video, first screen.')] },
      ],
    },
    {
      id: 'schedule',
      title: 'Schedule & restrictions',
      where: { to: `${DRAFT}?tab=schedule`, target: 'schedule' },
      blocks: [
        { t: 'p', text: 'From this tab you can:' },
        {
          t: 'list',
          items: [
            'Set an auto-publish date and time. Media has to be uploaded first.',
            'Add a media rating (TV-PG, TV-MA and so on).',
            'Add a location restriction by continent or country.',
          ],
        },
        { t: 'callout', tone: 'tip', text: 'Perfect for pre-scheduled releases and premieres.', emoji: '📆' },
        { t: 'shots', shots: [shot(6, 'Schedule & Restrictions: schedule, media rating and countries.')] },
      ],
    },
    {
      id: 'cast',
      title: 'Cast & hosts',
      where: { to: `${DRAFT}?tab=cast`, target: 'tab-panel' },
      blocks: [
        {
          t: 'steps',
          items: [
            'Open the **Cast & Hosts** tab.',
            'Click **Add Cast**.',
            'Choose an existing person or add a new one.',
            'Add their name, role (Director, Writer, Actor and so on) and a square 1:1 image.',
          ],
        },
        { t: 'p', text: 'For hosts, click **Add Host**, pick from the Host dropdown and, if it applies, mark them as **Primary Host**.' },
        { t: 'callout', tone: 'note', text: 'Each person becomes a card with a photo, name and role.', emoji: '🎬' },
        {
          t: 'shots',
          shots: [
            shot(7, 'Cast & Hosts: Add Cast and Add Host.'),
            shot(8, 'Add Host: pick from the list and mark the primary host.'),
            shot(9, 'Each host becomes a card with photo, name and role.'),
          ],
        },
      ],
    },
    {
      id: 'extras',
      title: 'Related extras',
      where: { to: `${DRAFT}?tab=extras`, target: 'tab-panel' },
      blocks: [
        { t: 'p', text: 'Attach extras like trailers or behind-the-scenes clips.' },
        {
          t: 'steps',
          items: [
            'Go to **Related Extras**.',
            'Click **Add Extra**.',
            'Pick from the dropdown list.',
            'Check **Main Trailer** if it’s the primary preview.',
            'Click **Add Extra**.',
          ],
        },
        { t: 'callout', tone: 'tip', text: 'The main trailer shows up first on DW+.', emoji: '💡' },
        {
          t: 'shots',
          shots: [
            shot(10, 'Related Extras: Add Extra.'),
            shot(11, 'Add Extra: pick the extra and mark it as the main trailer.'),
            shot(12, 'The main trailer is tagged Primary Trailer.'),
          ],
        },
      ],
    },
    {
      id: 'more',
      title: 'More like this',
      where: { to: `${DRAFT}?tab=more`, target: 'tab-panel' },
      blocks: [
        { t: 'p', text: 'Help people find their next favorite show or movie.' },
        { t: 'steps', items: ['Click **Add New**.', 'Select the shows and movies to display under More Like This.'] },
        { t: 'shots', shots: [shot(13, 'More Like This: Add New.')] },
      ],
    },
    {
      id: 'shop',
      title: 'Shop items',
      where: { to: `${DRAFT}?tab=shop`, target: 'tab-panel' },
      blocks: [
        { t: 'p', text: 'Show off related merch.' },
        { t: 'h', text: 'Add an existing product' },
        { t: 'steps', items: ['Open **Shop Items** and click **Add Item**.', 'Pick from the dropdown.', 'Click **Add Shop Item**.'] },
        { t: 'h', text: 'Create a new one' },
        {
          t: 'steps',
          items: [
            'In the dropdown, scroll to **Create Shop Item**.',
            'Fill in the image URL, item URL, name, price or discount, description and rating.',
            'Click **Create Shop Item**.',
          ],
        },
        { t: 'callout', tone: 'note', text: 'Linked items show up as cards under your movie.', emoji: '🛒' },
        {
          t: 'shots',
          shots: [
            shot(14, 'Shop Items: Add Item.'),
            shot(15, 'Create New Shop Item: image, link, name and price.'),
            shot(16, 'Linked items show up as cards under the movie.'),
          ],
        },
      ],
    },
    {
      id: 'access',
      title: 'Membership access',
      where: { to: `${DRAFT}?tab=media`, target: 'membership' },
      blocks: [
        { t: 'p', text: 'In the panel on the left, tick who can watch. **All** opens it to everyone. Or pick one or more plans: Free, Readers Pass, Insider, Insider Plus, All Access.' },
        { t: 'callout', tone: 'tip', text: 'You can select more than one.', emoji: '✅' },
        { t: 'shots', shots: [shot(17, 'Membership Access: one tier or several.')] },
      ],
    },
    {
      id: 'publish',
      title: 'Publish',
      where: { to: `${DRAFT}?tab=media`, target: 'publish' },
      blocks: [
        { t: 'p', text: 'The CMS saves as you work. When you’re ready:' },
        { t: 'steps', items: ['Review every tab.', 'Make sure the images and the video are uploaded.', 'Click **Publish Now**.'] },
        { t: 'p', text: 'The movie goes live on web, mobile and TV at once.' },
        { t: 'callout', tone: 'note', text: 'Instantly published. No code deployment needed.', emoji: '🔥' },
        { t: 'shots', shots: [shot(18, 'Published. Live on web, mobile and TV.')] },
      ],
    },
  ],
  recap: [
    'Create a new movie',
    'Add title, description and slug',
    'Upload images and video',
    'Set schedule, rating and location limits',
    'Add cast and hosts',
    'Link extras and trailers',
    'Link related movies and shows',
    'Add or create shop items',
    'Choose access tiers',
    'Review and publish',
  ],
  outro: {
    emoji: '🎉',
    title: 'You’re done!',
    text: 'Your movie is live, polished and ready for DailyWire+ audiences. Now cue the applause and move on to the next masterpiece.',
  },
};

/* ---------- every other feature gets a sample entry so the library shows the real shape ---------- */
const SAMPLE_TITLES: Record<string, string> = {
  extras: 'Add Extras and trailers',
  hosts: 'Manage Hosts',
  'resource-tags': 'Tag content with Resource Tags',
  'shop-items': 'Create Shop Items',
  shorts: 'Publish Shorts',
  shows: 'Manage Shows and episodes',
  chat: 'Moderate Chat',
  cards: 'Build Cards',
  'embedded-videos': 'Embed a video in an article',
  'live-blogs': 'Run a Live Blog',
  candidates: 'Add Candidates',
  races: 'Set up a Race',
  'prediction-sources': 'Add Prediction Sources',
  surveys: 'Create a Survey',
  'duplicate-candidates': 'Merge Duplicate Candidates',
  'election-games': 'Launch an Election Game',
  'breaking-news-banners': 'Post a Breaking News Banner',
  carousels: 'Build a Carousel',
  'external-links': 'Add External Links',
  'global-banners': 'Schedule a Global Banner',
  'image-overrides': 'Override an image',
  'modular-pages': 'Build a Modular Page',
  'website-page-overrides': 'Override a website page',
  'dynamic-benefits': 'Set up Dynamic Benefits',
  'lifecycle-management': 'Manage Lifecycle offers',
  'modular-ads': 'Create Modular Ads',
  'promo-items': 'Create Promo Items',
  'preroll-ads': 'Schedule Preroll Ads',
  newsletters: 'Manage Newsletters',
  'membership-ctas': 'Edit Membership CTAs',
  'email-preferences': 'Manage Email Preferences',
  'user-management': 'Manage users',
  'cms-users': 'Add CMS users',
  'roles-and-permissions': 'Set roles and permissions',
  'promo-plans': 'Create Promo Plans',
  'gift-coupon-codes': 'Generate gift coupon codes',
  'auto-fills': 'Configure Auto Fills',
  'fast-channels': 'Manage FAST Channels',
  'media-sizes': 'Add Media Sizes',
  parsely: 'Connect Parse.ly',
  'render-types': 'Manage Render Types',
  'resource-types': 'Manage Resource Types',
  'apple-broadcast-channels': 'Set up Apple Broadcast Channels',
};

// deterministic spread of sample dates across 2026
const sampleDate = (i: number) => {
  const d = new Date(Date.UTC(2026, 0, 6) + ((i * 97) % 300) * 86400000);
  return d.toISOString().slice(0, 10);
};

export const GUIDES: Guide[] = FEATURES.map((f, i) => {
  if (f.slug === 'movies') return movies;
  const siblings = FEATURES.filter((x) => x.group === f.group && x.slug !== f.slug).slice(0, 3);
  return {
    id: f.slug,
    title: SAMPLE_TITLES[f.slug] ?? `Manage ${f.name}`,
    intro: `How to create and manage ${f.name} in the DW CMS.`,
    updated: sampleDate(i + 3),
    sample: true,
    sections: [],
    related: siblings.map((s) => s.slug),
  };
});

/** Built-in guides, then what was written in the editor: a published guide replaces its sample,
 *  and while a draft is being previewed, the draft stands in for it everywhere. */
export const guideById = (id: string): Guide | undefined => {
  const a = useAuthored.getState();
  if (a.preview === id && a.drafts[id]) return a.drafts[id];
  return a.published[id] ?? GUIDES.find((g) => g.id === id);
};
export const allGuides = (): Guide[] => GUIDES.map((g) => guideById(g.id)!);
export const sectionIndex = (g: Guide, id: string | null) => Math.max(0, g.sections.findIndex((s) => s.id === id));
export const guideFeature = (g: Guide) => featureBySlug(g.id)!;

export const fmtDate = (iso: string) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/* ---------- search ---------- */
const strip = (s: string) => s.replace(/\*\*/g, '');
export function blockText(b: Block): string {
  switch (b.t) {
    case 'p':
    case 'h':
    case 'callout':
      return strip(b.text);
    case 'steps':
    case 'list':
      return b.items.map(strip).join(' ');
    case 'defs':
      return b.items.map(([a, c]) => `${a}: ${c}`).join(' ');
    case 'shots':
      return b.shots.map((s) => s.alt).join(' ');
    case 'specs':
      return IMAGE_SPECS.map((s) => `${s.name} ${s.ratio} ${s.say}`).join(' ');
    case 'more':
      return `${b.title} ${b.blocks.map(blockText).join(' ')}`;
    case 'video':
      return b.name;
  }
}

export type Hit = { guide: Guide; section?: Section; snippet: string; score: number };

export function search(q: string): Hit[] {
  const tokens = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  if (!tokens.length) return [];
  const hits: Hit[] = [];
  for (const g of allGuides()) {
    const f = guideFeature(g);
    const head = `${g.title} ${f.name} ${g.intro}`.toLowerCase();
    if (tokens.every((t) => head.includes(t))) {
      hits.push({ guide: g, snippet: g.intro, score: 3 + (g.title.toLowerCase().includes(tokens[0]) ? 1 : 0) });
    }
    for (const s of g.sections) {
      const body = s.blocks.map(blockText).join(' ');
      const all = `${s.title} ${body} ${f.name}`.toLowerCase();
      if (!tokens.every((t) => all.includes(t))) continue;
      const lower = body.toLowerCase();
      const at = lower.indexOf(tokens[0]);
      let from = Math.max(0, at - 50);
      if (from > 0) from = body.indexOf(' ', from) + 1 || from;
      const snippet = (from > 0 ? '…' : '') + body.slice(from, from + 150).trim() + (from + 150 < body.length ? '…' : '');
      hits.push({ guide: g, section: s, snippet: at < 0 ? body.slice(0, 150) + '…' : snippet, score: s.title.toLowerCase().includes(tokens[0]) ? 2 : 1 });
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 24);
}

export const SUGGESTIONS = ['Subtitles', 'Main trailer', 'Poster', 'Age gate', 'Schedule'];
