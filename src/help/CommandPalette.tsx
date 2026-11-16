import { useEffect, useMemo, useRef, useState } from 'react';
import { faArrowRight, faBookOpen, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { Fa } from '../components/Icon';
import { guideById, guideFeature, search } from '../data/guides';
import { FEATURES, featureBySlug, featurePath, groupById } from '../data/nav';
import { go } from '../lib/router';
import { useStore } from '../store';
import { Mark } from './Search';

type Item = { key: string; group: string; icon: IconDefinition; tint?: [string, string]; title: string; sub: string; run: () => void };

const JUMP = ['movies', 'modular-pages', 'promo-items', 'lifecycle-management'];

/** ⌘K from anywhere: CMS pages and guide steps in one list, like Vanta and Square. */
export function CommandPalette() {
  const open = useStore((s) => s.palette);
  const setPalette = useStore((s) => s.setPalette);
  const ctx = useStore((s) => s.ctx);
  const openHelp = useStore((s) => s.openHelp);
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setI(0);
      requestAnimationFrame(() => input.current?.focus());
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const close = () => setPalette(false);
    const page = (slug: string, group: string): Item => {
      const f = featureBySlug(slug)!;
      const g = groupById(f.group)!;
      return { key: 'p-' + slug, group, icon: g.icon, tint: g.tint, title: f.name, sub: g.name, run: () => (go(featurePath(f)), close()) };
    };
    const tokens = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    if (!tokens.length) {
      const out: Item[] = [];
      const here = ctx ? guideById(ctx.guide) : undefined;
      if (here) {
        const step = ctx?.section ? here.sections.find((s) => s.id === ctx.section) : undefined;
        out.push({
          key: 'here',
          group: 'For this page',
          icon: faBookOpen,
          title: step ? step.title : here.title,
          sub: step ? `${here.title} · Step ${here.sections.indexOf(step) + 1}` : `${guideFeature(here).name} guide`,
          run: () => (openHelp(here.id, ctx?.section ?? null), close()),
        });
      }
      JUMP.forEach((slug) => out.push(page(slug, 'Go to')));
      return out;
    }
    const pages = FEATURES.filter((f) => tokens.every((t) => `${f.name} ${groupById(f.group)!.name}`.toLowerCase().includes(t)))
      .slice(0, 5)
      .map((f) => page(f.slug, 'Pages'));
    const help = search(q)
      .slice(0, 8)
      .map<Item>((h) => ({
        key: 'h-' + h.guide.id + (h.section?.id ?? ''),
        group: 'Help',
        icon: faBookOpen,
        title: h.section ? h.section.title : h.guide.title,
        sub: h.section ? `${guideFeature(h.guide).name} · Step ${h.guide.sections.indexOf(h.section) + 1}` : `${guideFeature(h.guide).name} guide`,
        run: () => (openHelp(h.guide.id, h.section?.id ?? null), close()),
      }));
    return [...pages, ...help];
  }, [q, ctx, open]);

  useEffect(() => setI(0), [q]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [i]);

  if (!open) return null;
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setI((v) => Math.min(items.length - 1, v + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setI((v) => Math.max(0, v - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[i]?.run();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setPalette(false);
    }
  };

  let lastGroup = '';
  return (
    <div className="cp-scrim" onMouseDown={() => setPalette(false)}>
      <div className="cp" role="dialog" aria-modal="true" aria-label="Search the CMS and help" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <label className="cp-input">
          <Fa icon={faMagnifyingGlass} size={16} />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages and guides…" spellCheck={false} />
          <kbd>esc</kbd>
        </label>
        <div className="cp-list" ref={list}>
          {items.length === 0 && (
            <p className="cp-empty">
              Nothing for “{q}”. Try a page like <b>Modular Pages</b> or a word from a guide like <b>trailer</b>.
            </p>
          )}
          {items.map((it, n) => {
            const head = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <div key={it.key}>
                {head && <p className="cp-group">{head}</p>}
                <button className={'cp-item' + (n === i ? ' is-on' : '')} data-i={n} onMouseMove={() => setI(n)} onClick={it.run}>
                  <span className="cp-ico">
                    <Fa icon={it.icon} size={12} />
                  </span>
                  <span className="cp-t">
                    <b>
                      <Mark text={it.title} q={q} />
                    </b>
                    <span>{it.sub}</span>
                  </span>
                  <Fa icon={faArrowRight} size={11} className="cp-go" />
                </button>
              </div>
            );
          })}
        </div>
        <footer className="cp-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> to move
          </span>
          <span>
            <kbd>↵</kbd> to open
          </span>
          <span className="cp-foot-end">
            <kbd>?</kbd> help for this page
          </span>
        </footer>
      </div>
    </div>
  );
}
