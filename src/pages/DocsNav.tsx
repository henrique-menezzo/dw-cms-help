import { faBookOpen, faChevronDown, faChevronRight, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { Fa } from '../components/Icon';
import { GROUPS, featureBySlug } from '../data/nav';
import { useStore } from '../store';

/** Docs navigation, after Linear's: small gray group labels, one row per guide, search on top. */
export function DocsNav({ active }: { active?: string }) {
  const setPalette = useStore((s) => s.setPalette);
  // only the topic you're in is open; the others are one line each
  const openGroup = active?.startsWith('cat:') ? active.slice(4) : active ? featureBySlug(active)?.group : undefined;
  return (
    <nav className="dn" aria-label="Help Library">
      <button className="dn-search" onClick={() => setPalette(true)}>
        <Fa icon={faMagnifyingGlass} size={13} />
        <span>Search guides</span>
        <kbd>⌘K</kbd>
      </button>
      <a className={'dn-item is-home' + (active === 'home' ? ' is-on' : '')} href="#/help">
        <Fa icon={faBookOpen} size={13} />
        Overview
      </a>
      {GROUPS.map((g) => (
        <div key={g.id} className={'dn-group' + (openGroup === g.id ? ' is-open' : '')}>
          <a className={'dn-item dn-topic' + (active === 'cat:' + g.id ? ' is-on' : '')} href={`#/help?cat=${g.id}`}>
            <Fa icon={g.icon} size={13} />
            <span>{g.name}</span>
            <Fa icon={openGroup === g.id ? faChevronDown : faChevronRight} size={9} className="dn-chev" />
          </a>
          {openGroup === g.id &&
            g.features.map((f) => (
              <a key={f.slug} className={'dn-item dn-sub' + (active === f.slug ? ' is-on' : '')} href={`#/help/${f.slug}`}>
                {f.name}
              </a>
            ))}
        </div>
      ))}
    </nav>
  );
}
