import { useEffect, useState } from 'react';
import { faArrowRight, faCheck, faLink, faPen } from '@fortawesome/free-solid-svg-icons';
import { useAuthored, useAuthoredVersion } from '../data/authored';
import { Fa } from '../components/Icon';
import { PageBar } from '../components/Shell';
import { fmtDate, guideById, guideFeature } from '../data/guides';
import { featurePath, groupById } from '../data/nav';
import { go, type Route } from '../lib/router';
import { GuideArticle, StillStuck, readMinutes } from '../help/Article';
import { SampleNote } from '../help/GuideBlocks';
import { DocsNav } from './DocsNav';

/** One guide, laid out like a Linear Docs article: docs nav, a 650px reading column, "On this page". */
export function GuidePage({ route, id }: { route: Route; id: string }) {
  useAuthoredVersion();
  const guide = guideById(id);
  const hasDraft = useAuthored((s) => !!s.drafts[id]);
  const previewing = useAuthored((s) => s.preview === id);
  const justPublished = route.q.get('published') === '1';
  const target = route.parts[2];
  const [active, setActive] = useState<string>('top');
  const [copied, setCopied] = useState(false);

  // one dot per part of the guide; the black one is where you are
  const keys = guide ? ['top', ...guide.sections.map((s) => s.id), ...(guide.outro ? ['done'] : [])] : [];

  useEffect(() => {
    if (!target) {
      window.scrollTo({ top: 0 });
      return;
    }
    const t = setTimeout(() => document.getElementById('s-' + target)?.scrollIntoView({ block: 'start' }), 60);
    return () => clearTimeout(t);
  }, [id, target]);

  useEffect(() => {
    const on = () => {
      let cur = 'top';
      document.querySelectorAll<HTMLElement>('.da [data-sec]').forEach((el) => {
        if (el.getBoundingClientRect().top < 160) cur = el.dataset.sec!.split('/')[0];
      });
      // the last part is too short to reach the reading line: at the bottom of the page, you're on it
      const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      if (atEnd && keys.length) cur = keys[keys.length - 1];
      setActive(cur);
    };
    on();
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, [id]);

  if (!guide) {
    go('/help');
    return null;
  }
  const f = guideFeature(guide);
  const g = groupById(f.group)!;
  const jumpTo = (key: string) => {
    if (key === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
    else document.getElementById('s-' + key)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const labels: Record<string, string> = { top: 'Overview', done: 'You’re done' };
  guide.sections.forEach((s, i) => (labels[s.id] = `${i + 1}. ${s.title}`));

  return (
    <div className="c-page">
      <PageBar crumbs={[{ label: 'Help Library', to: '/help' }, { label: g.name, to: `/help?cat=${g.id}` }, { label: f.name }]} howto={false}>
        {!guide.sample && !previewing && (
          <button className="pb-copy" onClick={() => go(`/help/write/${id}`)}>
            <Fa icon={faPen} size={11} />
            {hasDraft ? 'Edit draft' : 'Edit'}
          </button>
        )}
        <button
          className="pb-copy"
          onClick={() => {
            navigator.clipboard?.writeText(location.href).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
        >
          <Fa icon={copied ? faCheck : faLink} size={11} />
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </PageBar>
      <div className={'docs is-article' + (guide.sample ? ' is-sample' : '')}>
        <DocsNav active={id} />

        <article className="da">
          <h1>{guide.title}</h1>
          <p className="da-lead">{guide.intro}</p>
          <p className="da-meta">
            <span>Updated {fmtDate(guide.updated)}</span>
            {!guide.sample && (
              <>
                <span>{guide.sections.length} steps</span>
                <span>{readMinutes(guide)} min read</span>
              </>
            )}
            <button className="da-open" onClick={() => go(featurePath(f))}>
              Open {f.name}
              <Fa icon={faArrowRight} size={10} />
            </button>
          </p>
          {guide.sample ? (
            <>
              <SampleNote guide={guide} onExample={() => go('/help/movies')}>
                <button className="g-sample-write" onClick={() => go(hasDraft ? `/help/write/${id}` : `/help?new=1&page=${id}`)}>
                  <Fa icon={faPen} size={11} />
                  {hasDraft ? 'Keep writing this guide' : 'Write this guide'}
                </button>
              </SampleNote>
              <StillStuck />
            </>
          ) : (
            <GuideArticle guide={guide} variant="page" idPrefix="s" />
          )}
        </article>
        {justPublished && <Toast>Live now. The question mark on {f.name} opens this guide.</Toast>}

        {!guide.sample && (
          <aside className="dt" aria-label="On this page">
            <p className="dt-t">On this page</p>
            <ul>
              {keys.map((k) => {
                const on = active === k;
                return (
                  <li key={k}>
                    <button className={on ? 'is-on' : ''} aria-current={on ? 'step' : undefined} onClick={() => jumpTo(k)}>
                      <span className="dt-dot" aria-hidden="true" />
                      <span className="dt-l">{labels[k]}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}

function Toast({ children }: { children: React.ReactNode }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOn(false), 4200);
    return () => clearTimeout(t);
  }, []);
  return on ? (
    <p className="ge-toast" role="status">
      <Fa icon={faCheck} size={11} />
      {children}
    </p>
  ) : null;
}
