import { useEffect, useState, type ReactNode } from 'react';
import { faBookOpen, faChevronDown, faChevronLeft, faChevronRight, faHouse } from '@fortawesome/free-solid-svg-icons';
import { faStar } from '@fortawesome/free-regular-svg-icons';
import { Fa, Logo } from './Icon';
import { GROUPS, featurePath } from '../data/nav';
import type { Route } from '../lib/router';
import { HowTo } from '../help/Overlays';

export function Shell({ route, children, panel }: { route: Route; children: ReactNode; panel?: ReactNode }) {
  const inHelp = route.parts[0] === 'help';
  const current = inHelp ? null : route.parts[0];
  const [open, setOpen] = useState<Record<string, boolean>>(() => (current ? { [current]: true } : {}));
  useEffect(() => {
    if (current) setOpen((o) => ({ ...o, [current]: true }));
  }, [current]);

  return (
    <div className={'c-app' + (panel ? ' has-panel' : '') + (inHelp ? ' is-docs' : '')}>
      <nav className="c-top">
        <a className="c-top-logo" href="#/content/movies" aria-label="DailyWire CMS">
          <Logo />
        </a>
        <div className="c-user">
          <span className="c-avatar">H</span>
          <span>Henrique Menezzo</span>
          <Fa icon={faChevronDown} size={20} className="c-user-chev" />
        </div>
      </nav>
      <aside className="c-side">
        <div className="c-side-list">
          <a className="c-side-row">
            <Fa icon={faHouse} size={20} className="c-side-ico" />
            <span>Home</span>
          </a>
          <hr />
          <a className="c-side-row">
            <Fa icon={faStar} size={20} className="c-side-ico is-star" />
            <span>Favorites</span>
            <Fa icon={faChevronRight} size={12} className="c-side-chev" />
          </a>
          <hr />
          {GROUPS.map((g) => (
            <div key={g.id}>
              <button className={'c-side-row' + (open[g.id] ? ' is-open' : '')} onClick={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))} aria-expanded={!!open[g.id]}>
                <Fa icon={g.icon} size={20} className="c-side-ico" />
                <span>{g.name}</span>
                <Fa icon={open[g.id] ? faChevronDown : faChevronRight} size={12} className="c-side-chev" />
              </button>
              {open[g.id] &&
                g.features.map((f) => {
                  const on = route.parts[0] === g.id && route.parts[1] === f.slug;
                  return (
                    <a key={f.slug} className={'c-side-sub' + (on ? ' is-on' : '')} href={'#' + featurePath(f)}>
                      {f.name}
                    </a>
                  );
                })}
            </div>
          ))}
        </div>
        <div className="c-side-foot">
          <a className={'c-side-row c-side-help' + (inHelp ? ' is-here' : '')} href="#/help">
            <Fa icon={faBookOpen} size={18} className="c-side-ico" />
            <span>Help Library</span>
          </a>
          <button className="c-side-collapse">
            <Fa icon={faChevronLeft} size={16} />
            <span>Collapse</span>
          </button>
        </div>
      </aside>
      <main className="c-main">{children}</main>
      {panel}
    </div>
  );
}

export type Crumb = { label: string; to?: string };

export function PageBar({ crumbs, howto = true, children }: { crumbs: Crumb[]; howto?: boolean; children?: ReactNode }) {
  return (
    <div className="h-pagebar">
      <nav className="h-crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={i} className="h-crumb">
            {i > 0 && <Fa icon={faChevronRight} size={10} className="h-crumb-sep" />}
            {c.to ? <a href={'#' + c.to}>{c.label}</a> : <b>{c.label}</b>}
          </span>
        ))}
      </nav>
      <div className="h-pagebar-end">
        {children}
        {howto && <HowTo />}
      </div>
    </div>
  );
}
