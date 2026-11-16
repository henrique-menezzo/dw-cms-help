import { faChevronRight, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { Fa } from '../components/Icon';
import { PageBar } from '../components/Shell';
import { GUIDES, fmtDate, guideById, guideFeature } from '../data/guides';
import { GROUPS, groupById, type Group } from '../data/nav';
import { setParam, type Route } from '../lib/router';
import { DocsNav } from './DocsNav';

const POPULAR = ['movies', 'modular-pages', 'promo-items', 'lifecycle-management'];

function GuideRows({ ids }: { ids: string[] }) {
  return (
    <ul className="dh-rows">
      {ids.map((id) => {
        const guide = guideById(id)!;
        const f = guideFeature(guide);
        return (
          <li key={id}>
            <a href={`#/help/${id}`}>
              <span className="dh-row-t">
                <b>{guide.title}</b>
                <span>{f.name}</span>
              </span>
              <span className="dh-row-date">Updated {fmtDate(guide.updated)}</span>
              <Fa icon={faChevronRight} size={10} className="dh-row-chev" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function AskLine() {
  return (
    <p className="dh-ask">
      Can’t find what you need?
      <button>
        <Fa icon={faHashtag} size={11} />
        Ask in #cms-help
      </button>
    </p>
  );
}

/** Help Library home and topic pages, laid out like Linear Docs: one white surface, docs nav, cards. */
export function Library({ route }: { route: Route }) {
  const cat = route.q.get('cat');
  const group = cat ? groupById(cat) : undefined;
  return (
    <div className="c-page">
      <PageBar crumbs={group ? [{ label: 'Help Library', to: '/help' }, { label: group.name }] : [{ label: 'Help Library' }]} howto={false} />
      <div className="docs">
        <DocsNav active={group ? 'cat:' + group.id : 'home'} />
        <div className="dh">{group ? <Topic g={group} /> : <Home />}</div>
      </div>
    </div>
  );
}

function Home() {
  const recent = [...GUIDES].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 4);
  return (
    <>
      <header className="dh-head">
        <h1>Help Library</h1>
        <p>How-to guides for every part of the CMS. The question mark at the top of each page opens the same guides.</p>
      </header>
      <section className="dh-sec">
        <h2>Popular</h2>
        <div className="dh-cards">
          {POPULAR.map((id) => {
            const guide = guideById(id)!;
            const g = groupById(guideFeature(guide).group)!;
            return (
              <a key={id} className="dc" href={`#/help/${id}`}>
                <span className="dc-top">
                  <Fa icon={g.icon} size={18} />
                </span>
                <span className="dc-body">
                  <b>{guide.title}</b>
                  <span>{guide.sample ? `${guideFeature(guide).name} · ${g.name}` : guide.intro}</span>
                </span>
              </a>
            );
          })}
        </div>
      </section>
      <section className="dh-sec">
        <h2>Browse by topic</h2>
        <div className="dh-cards">
          {GROUPS.map((g) => (
            <button key={g.id} className="dc" onClick={() => setParam('cat', g.id)}>
              <span className="dc-top">
                <Fa icon={g.icon} size={18} />
              </span>
              <span className="dc-body">
                <b>{g.name}</b>
                <span>{g.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="dh-sec">
        <h2>Recently updated</h2>
        <GuideRows ids={recent.map((g) => g.id)} />
      </section>
      <AskLine />
    </>
  );
}

function Topic({ g }: { g: Group }) {
  return (
    <>
      <header className="dh-head">
        <p className="dh-kicker">
          <Fa icon={g.icon} size={13} />
          {g.features.length} guides
        </p>
        <h1>{g.name}</h1>
        <p>{g.blurb}</p>
      </header>
      <section className="dh-sec is-first">
        <GuideRows ids={g.features.map((f) => f.slug)} />
      </section>
      <AskLine />
    </>
  );
}
