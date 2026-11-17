import { useEffect, useRef, useState } from 'react';
import {
  faArrowUpRightFromSquare,
  faMinus,
  faPlus,
  faChevronLeft,
  faChevronRight,
  faHashtag,
  faMagnifyingGlass,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { Fa } from '../components/Icon';
import { guideById, guideFeature, search, type Guide, type Hit } from '../data/guides';
import { GROUPS, groupById, type Group } from '../data/nav';
import { go } from '../lib/router';
import { useStore } from '../store';
import { Feedback, StillStuck, TopicIcon, readMinutes } from './Article';
import { Blocks, SampleNote, WhereButton, sectionFrames } from './GuideBlocks';
import { Results, SearchBox } from './Search';
import { Walkthrough } from './Walkthrough';

/**
 * The one in-context help surface. Docked on the right so the screen stays visible.
 * Home (search, this page, quick answers, topics) → topic → guide, with a back arrow, like Slack and Xero.
 */
export function HelpPanel() {
  const help = useStore((s) => s.help);
  const close = useStore((s) => s.closeHelp);
  const home = useStore((s) => s.helpHome);
  const setPalette = useStore((s) => s.setPalette);
  const scroller = useRef<HTMLDivElement>(null);
  const guide = help.guide ? guideById(help.guide) : undefined;
  const topic = help.topic ? groupById(help.topic) : undefined;
  const view = guide ? 'guide' : topic ? 'topic' : 'home';

  useEffect(() => {
    if (view !== 'guide') scroller.current?.scrollTo({ top: 0 });
  }, [view, help.topic]);

  return (
    <aside className="hp" aria-label="Help">
      <header className="hp-top">
        {view === 'home' ? (
          <h2 className="hp-top-t">Help</h2>
        ) : (
          <button className="hp-back" onClick={home}>
            <Fa icon={faChevronLeft} size={12} />
            Help
          </button>
        )}
        <div className="hp-top-acts">
          <button className="hp-icon" onClick={() => setPalette(true)} aria-label="Search everything" title="Search everything  ⌘K">
            <Fa icon={faMagnifyingGlass} size={14} />
          </button>
          <button className="hp-icon" onClick={close} aria-label="Close help">
            <Fa icon={faXmark} size={16} />
          </button>
        </div>
      </header>
      <div className="hp-scroll" ref={scroller}>
        {view === 'home' && <PanelHome />}
        {view === 'topic' && topic && <PanelTopic g={topic} />}
        {view === 'guide' && guide && <PanelGuide guide={guide} scroller={scroller} />}
      </div>
      <footer className="hp-foot">
        <button className="hp-foot-ask">
          <Fa icon={faHashtag} size={12} />
          Ask in #cms-help
        </button>
        <button
          className="hp-foot-open"
          onClick={() => {
            go(guide ? `/help/${guide.id}${help.section ? '/' + help.section : ''}` : topic ? `/help?cat=${topic.id}` : '/help');
            close();
          }}
        >
          {guide ? 'Open full guide' : 'Help Library'}
          <Fa icon={faArrowUpRightFromSquare} size={11} />
        </button>
      </footer>
    </aside>
  );
}

function Row({ icon, title, sub, onClick }: { icon: IconDefinition; title: string; sub?: string; onClick: () => void }) {
  return (
    <li>
      <button className="ph-row" onClick={onClick}>
        <span className="ph-ico">
          <Fa icon={icon} size={13} />
        </span>
        <span className="ph-row-t">
          <b>{title}</b>
          {sub && <span>{sub}</span>}
        </span>
        <Fa icon={faChevronRight} size={10} className="ph-chev" />
      </button>
    </li>
  );
}

function PanelHome() {
  const ctx = useStore((s) => s.ctx);
  const openHelp = useStore((s) => s.openHelp);
  const openTopic = useStore((s) => s.openTopic);
  const [q, setQ] = useState('');
  const here = ctx ? guideById(ctx.guide) : undefined;
  const hereStep = here && ctx?.section ? here.sections.find((s) => s.id === ctx.section) : undefined;
  const hereGroup = here ? groupById(guideFeature(here).group)! : undefined;

  return (
    <div className="ph">
      <SearchBox value={q} onChange={setQ} placeholder="How can we help?" />
      {q.trim().length > 1 ? (
        <Results hits={search(q)} q={q} onPick={(h: Hit) => openHelp(h.guide.id, h.section?.id ?? null)} dense />
      ) : (
        <>
          {here && hereGroup && (
            <section>
              <p className="ph-label">For this page</p>
              <button className="ph-here" onClick={() => openHelp(here.id, ctx?.section ?? null)}>
                <TopicIcon g={hereGroup} size={40} />
                <span className="ph-row-t">
                  <b>{hereStep ? hereStep.title : here.title}</b>
                  <span>
                    {hereStep ? `${here.title} · Step ${here.sections.indexOf(hereStep) + 1} of ${here.sections.length}` : `${guideFeature(here).name} guide`}
                  </span>
                </span>
                <Fa icon={faChevronRight} size={10} className="ph-chev" />
              </button>
            </section>
          )}
          <section>
            <p className="ph-label">Browse topics</p>
            <ul className="ph-list">
              {GROUPS.map((g) => (
                <Row key={g.id} icon={g.icon} title={g.name} sub={`${g.features.length} guides`} onClick={() => openTopic(g.id)} />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function PanelTopic({ g }: { g: Group }) {
  const openHelp = useStore((s) => s.openHelp);
  return (
    <div className="ph">
      <div className="pt-head">
        <TopicIcon g={g} size={44} />
        <div>
          <h2>{g.name}</h2>
          <p>{g.blurb}</p>
        </div>
      </div>
      <ul className="ph-list">
        {g.features.map((f) => {
          const guide = guideById(f.slug)!;
          return (
            <li key={f.slug}>
              <button className="ph-row is-plain" onClick={() => openHelp(f.slug, null)}>
                <span className="ph-row-t">
                  <b>{guide.title}</b>
                  <span>{guide.sample ? f.name : `${f.name} · ${guide.sections.length} steps · Video`}</span>
                </span>
                <Fa icon={faChevronRight} size={10} className="ph-chev" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A guide as a list of steps; the one for this screen is open. */
function PanelGuide({ guide, scroller }: { guide: Guide; scroller: React.RefObject<HTMLDivElement | null> }) {
  const help = useStore((s) => s.help);
  const ctx = useStore((s) => s.ctx);
  const setSection = useStore((s) => s.setSection);
  const openHelp = useStore((s) => s.openHelp);
  const f = guideFeature(guide);
  const g = groupById(f.group)!;
  const here = ctx?.guide === guide.id ? ctx.section : null;

  // keep the guide's title in view when the open step is near the top; otherwise bring the step up
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const r = requestAnimationFrame(() => {
      const el = help.section ? root.querySelector<HTMLElement>(`[data-acc="${help.section}"]`) : null;
      if (!el) return root.scrollTo({ top: 0, behavior: 'smooth' });
      const top = el.offsetTop;
      const visible = top >= root.scrollTop && top < root.scrollTop + root.clientHeight * 0.45;
      if (!visible) root.scrollTo({ top: top < root.clientHeight * 0.45 ? 0 : top - 64, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(r);
  }, [guide.id, help.section]);

  return (
    <div className="pg">
      <div className="pg-head">
        <span className="pg-topic">
          <Fa icon={g.icon} size={11} />
          {g.name} · {f.name}
        </span>
        <h2>{guide.title}</h2>
        {!guide.sample && <p className="pg-meta">{guide.sections.length} steps · {readMinutes(guide)} min read</p>}
      </div>
      {guide.sample ? (
        <SampleNote guide={guide} onExample={() => openHelp('movies', null)} />
      ) : (
        <>
          <ol className="acc">
            {guide.sections.map((s, i) => {
              const open = help.section === s.id;
              const frames = sectionFrames(s);
              return (
                <li key={s.id} data-acc={s.id} className={'acc-i' + (open ? ' is-open' : '')}>
                  <button className="acc-row" onClick={() => setSection(open ? null : s.id)} aria-expanded={open}>
                    <span className="acc-n">{i + 1}</span>
                    <span className="acc-t">
                      {s.title}
                      {here === s.id && <span className="acc-here">You’re on this screen</span>}
                    </span>
                    <Fa icon={open ? faMinus : faPlus} size={13} className="acc-chev" />
                  </button>
                  {open && (
                    <div className="acc-body">
                      {frames.length > 0 && <Walkthrough key={s.id} frames={frames} size="sm" label="Watch" />}
                      <Blocks blocks={s.blocks} compact shotsAs="none" />
                      {s.where && (
                        <div className="acc-acts">
                          <WhereButton guide={guide} section={s} variant="text" />
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="pg-end">
            <Feedback compact />
          </div>
        </>
      )}
    </div>
  );
}
