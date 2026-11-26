import type { Block, Section, Shot } from './guides';
import { uid } from './authoring';

/* -------------------------------------------------------------------------------------------------
   A doc someone already wrote (Google Docs, Word, Notion, Confluence, Slack, plain text) pasted into
   a guide. It keeps what the guide format knows: headings, paragraphs, numbered and bullet lists,
   bold, images, simple two-column tables, and "Tip:" / "Heads up:" lines. Everything else is text.
   ------------------------------------------------------------------------------------------------- */

const isBold = (el: HTMLElement) => {
  const w = el.style.fontWeight;
  if (w === 'normal' || (w && Number(w) < 600)) return false; // Google Docs wraps everything in <b style="font-weight:normal">
  return el.tagName === 'B' || el.tagName === 'STRONG' || w === 'bold' || Number(w) >= 600;
};

/** Inline text with **bold**, links as their text. */
function inline(node: Node): string {
  let out = '';
  node.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent ?? '';
    else if (n instanceof HTMLElement) {
      if (n.tagName === 'BR') return void (out += ' ');
      if (n.tagName === 'IMG' || n.tagName === 'STYLE' || n.tagName === 'SCRIPT') return;
      const t = inline(n);
      if (isBold(n) && t.trim() && !t.includes('**')) out += t.match(/^\s*/)![0] + '**' + t.trim() + '**' + t.match(/\s*$/)![0];
      else out += t;
    }
  });
  return out;
}
const clean = (s: string) => s.replace(/ /g, ' ').replace(/\s+/g, ' ').replace(/\*\*\s*\*\*/g, '').trim();
const plain = (s: string) => s.replace(/\*\*/g, '');

const TIP = /^(tip|note|good to know)\s*[:.-]\s*/i;
const WARN = /^(heads up|warning|important|careful|caution)\s*[:.!-]\s*/i;
const STEP = /^step\s*\d+\s*[:.)\-–]?\s*/i;

/** A paragraph that is really a heading: "Step 3: Add media", or a short line that's bold all the way through. */
function asHeading(text: string): string | null {
  const p = plain(text).trim();
  if (STEP.test(p) && p.length < 90) return p.replace(STEP, '').trim() || p;
  if (/^\*\*[^*]+\*\*:?$/.test(text.trim()) && p.length < 70 && !/[.!?]$/.test(p)) return p.replace(/:$/, '');
  return null;
}

function para(text: string): Block | null {
  const t = clean(text);
  if (!t) return null;
  const h = asHeading(t);
  if (h) return { t: 'h', text: h };
  const p = plain(t);
  const cap = (x: string) => x.replace(/^(\**)(\w)/, (_, a: string, c: string) => a + c.toUpperCase());
  if (TIP.test(p)) return { t: 'callout', tone: 'tip', text: cap(t.replace(/^\**/, '').replace(TIP, '').replace(/^\*\*\s*/, '')), emoji: '💡' };
  if (WARN.test(p)) return { t: 'callout', tone: 'warn', text: cap(t.replace(/^\**/, '').replace(WARN, '').replace(/^\*\*\s*/, '')) };
  return { t: 'p', text: t };
}

const items = (list: Element) =>
  [...list.children]
    .filter((li) => li.tagName === 'LI')
    .map((li) => {
      // a nested list reads as part of its item
      const copy = li.cloneNode(true) as HTMLElement;
      copy.querySelectorAll('ol, ul').forEach((x) => x.replaceWith(' ' + [...x.querySelectorAll('li')].map((y) => clean(inline(y))).join('; ')));
      return clean(inline(copy));
    })
    .filter(Boolean);

export function blocksFromHtml(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out: Block[] = [];
  let buffer = '';
  const flush = () => {
    const b = para(buffer);
    if (b) out.push(b);
    buffer = '';
  };
  const shot = (img: HTMLImageElement): Shot | null => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('file:')) return null;
    const w = Number(img.getAttribute('width')) || undefined;
    const h = Number(img.getAttribute('height')) || undefined;
    return { src, alt: img.getAttribute('alt') ?? '', w: w && w * 2, h: h && h * 2 };
  };
  const pushShots = (imgs: HTMLImageElement[]) => {
    const shots = imgs.map(shot).filter((s): s is Shot => !!s);
    if (!shots.length) return;
    const last = out[out.length - 1];
    if (last?.t === 'shots') last.shots.push(...shots);
    else out.push({ t: 'shots', shots });
  };

  const walk = (node: Node) => {
    node.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        buffer += n.textContent ?? '';
        return;
      }
      if (!(n instanceof HTMLElement)) return;
      const tag = n.tagName;
      if (['STYLE', 'SCRIPT', 'META', 'TITLE', 'HEAD'].includes(tag)) return;
      if (/^H[1-6]$/.test(tag)) {
        flush();
        const t = clean(plain(inline(n))).replace(STEP, '');
        if (t) out.push({ t: 'h', text: t, level: Number(tag[1]) });
        pushShots([...n.querySelectorAll('img')]);
        return;
      }
      if (tag === 'OL' || tag === 'UL') {
        flush();
        const list = items(n);
        if (list.length) out.push({ t: tag === 'OL' ? 'steps' : 'list', items: list });
        pushShots([...n.querySelectorAll('img')]);
        return;
      }
      if (tag === 'IMG') {
        flush();
        pushShots([n as HTMLImageElement]);
        return;
      }
      if (tag === 'TABLE') {
        flush();
        const rows = [...n.querySelectorAll('tr')].map((tr) => [...tr.children].map((td) => clean(inline(td))));
        if (rows.length && rows.every((r) => r.length === 2)) out.push({ t: 'defs', items: rows.filter((r) => r[0] || r[1]) as [string, string][] });
        else rows.forEach((r) => r.some(Boolean) && out.push({ t: 'p', text: r.filter(Boolean).join(' · ') }));
        return;
      }
      if (tag === 'P' || tag === 'LI' || tag === 'BLOCKQUOTE' || tag === 'PRE') {
        flush();
        buffer = inline(n);
        flush();
        pushShots([...n.querySelectorAll('img')]);
        return;
      }
      if (tag === 'BR') {
        flush();
        return;
      }
      if (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE' || tag === 'MAIN' || tag === 'BODY' || tag === 'HEADER' || tag === 'FOOTER') {
        flush();
        walk(n);
        flush();
        return;
      }
      // inline wrappers (span, b, a, font…): keep collecting text, but a wrapper can hold whole paragraphs (Google Docs)
      if (n.querySelector('p, h1, h2, h3, h4, h5, h6, ol, ul, table, div, img')) {
        walk(n);
        return;
      }
      buffer += inline(wrap(n));
    });
  };
  // inline() reads children, so give it the element itself as a child
  const wrap = (n: HTMLElement) => {
    const d = document.createElement('span');
    d.appendChild(n.cloneNode(true));
    return d;
  };
  walk(doc.body);
  flush();
  return merge(out);
}

/** Plain text, Markdown included: blank lines split paragraphs, "1." starts numbered steps, "-" bullets, "#" headings. */
export function blocksFromText(text: string): Block[] {
  const out: Block[] = [];
  let para_: string[] = [];
  const flush = () => {
    const b = para(para_.join(' ').replace(/\*\*(.+?)\*\*/g, '**$1**'));
    if (b) out.push(b);
    para_ = [];
  };
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const h = line.match(/^#{1,6}\s+(.*)$/);
    const n = line.match(/^\d+[.)]\s+(.*)$/);
    const u = line.match(/^[-•*–]\s+(.*)$/);
    if (h || (STEP.test(line) && line.length < 90)) {
      flush();
      out.push({ t: 'h', text: (h ? h[1] : line).replace(STEP, '').trim() || line, level: h ? line.indexOf(' ') : 3 });
    } else if (n || u) {
      flush();
      const kind = n ? 'steps' : 'list';
      const last = out[out.length - 1];
      const item = (n ?? u)![1];
      if (last && last.t === kind) last.items.push(item);
      else out.push({ t: kind, items: [item] } as Block);
    } else para_.push(line);
  }
  flush();
  return merge(out);
}

/** Two numbered lists split only by an empty line read as one. */
function merge(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (last && (b.t === 'steps' || b.t === 'list') && last.t === b.t) last.items.push(...b.items);
    else out.push(b);
  }
  return out;
}

/** What the clipboard holds, as guide blocks. Prefers the formatted version when there is one. */
export function blocksFromClipboard(data: DataTransfer): Block[] {
  const html = data.getData('text/html');
  const text = data.getData('text/plain');
  if (html) {
    const b = blocksFromHtml(html);
    if (b.length) return b;
  }
  return text ? blocksFromText(text) : [];
}

/** A doc's own title: a top-level heading at the very start, when nothing else in the doc is top level. */
export function takeTitle(blocks: Block[]): { title: string | null; blocks: Block[] } {
  const [first, ...rest] = blocks;
  if (first?.t === 'h' && first.level === 1 && !rest.some((b) => b.t === 'h' && b.level === 1)) return { title: first.text, blocks: rest };
  return { title: null, blocks };
}

/** Headings are where steps start. Two or more means the doc already reads as steps. */
export const headingCount = (blocks: Block[]) => blocks.filter((b) => b.t === 'h').length;

export function splitIntoSteps(blocks: Block[]): { before: Block[]; sections: Section[] } {
  const first = blocks.findIndex((b) => b.t === 'h');
  const before = first < 0 ? blocks : blocks.slice(0, first);
  const sections: Section[] = [];
  blocks.slice(Math.max(first, 0)).forEach((b) => {
    if (b.t === 'h') sections.push({ id: uid(), title: b.text.replace(/^\d+[.)]\s+/, '').replace(STEP, '').trim() || b.text, blocks: [] });
    else if (sections.length) sections[sections.length - 1].blocks.push(b);
  });
  sections.forEach((s) => s.blocks.length === 0 && s.blocks.push({ t: 'p', text: '' }));
  return { before, sections };
}
