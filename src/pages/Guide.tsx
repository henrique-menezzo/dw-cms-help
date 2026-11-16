import { useEffect, useRef, useState } from 'react';
import { faArrowRight, faCheck, faLink } from '@fortawesome/free-solid-svg-icons';
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
  const guide = guideById(id);
  const target = route.parts[2];
  const [active, setActive] = useState<string>('top');
  const [copied, setCopied] = useState(false);

  // steps you read past get a check. Jumps from the list or a link don't count: you skipped those.
  const [read, setRead] = useState<Set<string>>(new Set());
  const jumping = useRef(false);
  const prev = useRef('top');
  const keys = guide ? ['top', ...guide.sections.map((s) => s.id), ...(guide.outro ? ['done'] : [])] : [];

  const holdWhileJumping = () => {
    jumping.current = true;
    const end = () => {
      jumping.current = false;
      clearTimeout(t);
      removeEventListener('scrollend', end);
    };
    const t = setTimeout(end, 1200);
    addEventListener('scrollend', end, { once: true });
  };

  useEffect(() => {
    setRead(new Set());
    prev.current = 'top';
    if (!target) {
      window.scrollTo({ top: 0 });
      return;
    }
    holdWhileJumping();
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
      const from = keys.indexOf(prev.current);
      const to = keys.indexOf(cur);
      if (!jumping.current && to > from && from >= 0) {
        setRead((r) => {
          const n = new Set(r);
          keys.slice(from, to).forEach((k) => n.add(k));
          if (cur === 'done') n.add('done');
          return n;
        });
      }
      prev.current = cur;
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
    holdWhileJumping();
    if (key === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
    else document.getElementById('s-' + key)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const labels: Record<string, string> = { top: 'Overview', done: 'You’re done' };
  guide.sections.forEach((s, i) => (labels[s.id] = `${i + 1}. ${s.title}`));

  return (
    <div className="c-page">
      <PageBar crumbs={[{ label: 'Help Library', to: '/help' }, { label: g.name, to: `/help?cat=${g.id}` }, { label: f.name }]} howto={false}>
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
              <SampleNote guide={guide} onExample={() => go('/help/movies')} />
              <StillStuck />
            </>
          ) : (
            <GuideArticle guide={guide} variant="page" idPrefix="s" />
          )}
        </article>

        {!guide.sample && (
          <aside className="dt" aria-label="On this page">
            <p className="dt-t">On this page</p>
            <ul>
              {keys.map((k) => {
                const on = active === k;
                const done = read.has(k) && (!on || k === 'done');
                return (
                  <li key={k}>
                    <button className={(on ? 'is-on' : '') + (done ? ' is-read' : '')} aria-current={on ? 'step' : undefined} onClick={() => jumpTo(k)}>
                      <span className="dt-dot" aria-hidden="true">
                        <Fa icon={faCheck} size={7} />
                      </span>
                      <span className="dt-l">
                        {labels[k]}
                        {done && <span className="sr-only"> (read)</span>}
                      </span>
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
