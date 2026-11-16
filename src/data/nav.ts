import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faCheckToSlot, faFilm, faNewspaper, faScrewdriverWrench, faTableColumns, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { faBillboard } from '../components/Icon';

export type Feature = { slug: string; name: string; group: string };
export type Group = { id: string; name: string; icon: IconDefinition; features: Feature[]; blurb: string; tint: [string, string] };

const raw: [string, string, IconDefinition, string[]][] = [
  ['content', 'Content', faFilm, ['Extras', 'Hosts', 'Movies', 'Resource Tags', 'Shop Items', 'Shorts', 'Shows', 'Chat']],
  ['editorial', 'Editorial', faNewspaper, ['Cards', 'Embedded Videos', 'Live Blogs']],
  ['election', 'Election', faCheckToSlot, ['Candidates', 'Races', 'Prediction Sources', 'Surveys', 'Duplicate Candidates', 'Election Games']],
  [
    'page-management',
    'Page Management',
    faTableColumns,
    ['Breaking News Banners', 'Carousels', 'External Links', 'Global Banners', 'Image Overrides', 'Modular Pages', 'Website Page Overrides'],
  ],
  [
    'ads-and-lifecycle',
    'Ads and Lifecycle',
    faBillboard,
    ['Dynamic Benefits', 'Lifecycle Management', 'Modular Ads', 'Promo Items', 'Preroll Ads', 'Newsletters', 'Membership CTAs', 'Email Preferences'],
  ],
  ['cms-admin', 'CMS Admin', faUserShield, ['User Management', 'CMS Users', 'Roles & Permissions', 'Promo Plans', 'Gift Coupon Codes']],
  [
    'cms-config',
    'CMS Config',
    faScrewdriverWrench,
    ['Auto Fills', 'FAST Channels', 'Media Sizes', 'Parsely', 'Render Types', 'Resource Types', 'Apple Broadcast Channels'],
  ],
];

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const INFO: Record<string, [string, [string, string]]> = {
  content: ['Movies, shows, shorts, extras and the people in them.', ['#fdecea', '#c8322e']],
  editorial: ['Cards, embedded videos and live blogs for the newsroom.', ['#e8f0fb', '#2f5fa8']],
  election: ['Candidates, races, predictions and election games.', ['#efe9fb', '#6a46b8']],
  'page-management': ['Banners, carousels and the pages that hold them.', ['#e7f4ec', '#2f7a4a']],
  'ads-and-lifecycle': ['Offers, promos, ads and member messaging.', ['#fdf1e1', '#a8620d']],
  'cms-admin': ['Users, roles, promo plans and gift codes.', ['#eceef1', '#4a5361']],
  'cms-config': ['Media sizes, channels and the settings behind the scenes.', ['#e5f3f3', '#23746f']],
};

export const GROUPS: Group[] = raw.map(([id, name, icon, feats]) => ({
  id,
  name,
  icon,
  blurb: INFO[id][0],
  tint: INFO[id][1],
  features: feats.map((f) => ({ slug: slugify(f), name: f, group: id })),
}));

export const FEATURES: Feature[] = GROUPS.flatMap((g) => g.features);

export const featureBySlug = (slug: string) => FEATURES.find((f) => f.slug === slug);
export const groupById = (id: string) => GROUPS.find((g) => g.id === id);
export const featurePath = (f: Feature) => `/${f.group}/${f.slug}`;
