import { Fragment, type ReactNode } from 'react';
import { faArrowLeft, faArrowRight, faCheck, faHandPointer, faLocationCrosshairs } from '@fortawesome/free-solid-svg-icons';
import { faLightbulb } from '@fortawesome/free-regular-svg-icons';
import { Fa } from '../components/Icon';
import { IMAGE_SPECS, guideFeature, type Block, type Guide, type Section, type Shot } from '../data/guides';
import { groupById, slugify } from '../data/nav';
import { parse } from '../lib/router';
import { useStore } from '../store';
import { Walkthrough, type Chapter, type Frame } from './Walkthrough';

export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => (p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}

const shotsOf = (s: Section) => s.blocks.flatMap((b) => (b.t === 'shots' ? b.shots : []));
export const sectionFrames = (s: Section): Frame[] => shotsOf(s).map((x) => ({ src: x.src, caption: x.alt }));
export function guideFrames(g: Guide): { frames: Frame[]; chapters: Chapter[] } {
  const frames: Frame[] = [];
  const chapters: Chapter[] = [];
  g.sections.forEach((s) => {
    const f = sectionFrames(s);
    if (!f.length) return;
    chapters.push({ title: s.title, frame: frames.length });
    frames.push(...f);
  });
  return { frames, chapters };
}

function Shots({ shots, compact }: { shots: Shot[]; compact?: boolean }) {
  const open = useStore((s) => s.openLightbox);
  if (compact)
    return (
      <div className="g-thumbs">
        {shots.map((s, i) => (
          <button key={s.src} className="g-thumb" onClick={() => open(shots, i)} aria-label={`Enlarge: ${s.alt}`}>
            <img src={s.src} alt={s.alt} width={s.w} height={s.h} />
          </button>
        ))}
      </div>
    );
  const s0 = shots[0];
  return (
    <div className="g-shots">
      <figure style={s0.w ? { maxWidth: Math.round(s0.w / 2) } : undefined}>
        <button onClick={() => open(shots, 0)} aria-label={`Enlarge: ${s0.alt}`}>
          <img src={s0.src} alt={s0.alt} width={s0.w} height={s0.h} />
          {shots.length > 1 && <span className="g-shots-n">1 of {shots.length}</span>}
        </button>
      </figure>
    </div>
  );
}


function Specs() {
  const open = useStore((s) => s.openLightbox);
  const examples: Shot[] = IMAGE_SPECS.map((s) => ({ src: s.example, alt: `${s.name} example` }));
  return (
    <dl className="g-specs">
      {IMAGE_SPECS.map((s, i) => (
        <div key={s.key}>
          <dt>
            <button onClick={() => open(examples, i)} title={`See a ${s.name} example`}>
              {s.name}
            </button>
          </dt>
          <dd>{s.say}</dd>
        </div>
      ))}
    </dl>
  );
}

const TONE: Record<'tip' | 'warn' | 'note', string> = { tip: 'Tip', warn: 'Heads up', note: 'Good to know' };

/** `anchor` gives sub-headings ids so the page's "On this page" can point at them. */
export function Blocks({
  blocks,
  compact,
  shotsAs = compact ? 'thumbs' : 'full',
  anchor,
  secKey,
}: {
  blocks: Block[];
  compact?: boolean;
  shotsAs?: 'full' | 'thumbs' | 'none';
  anchor?: string;
  secKey?: string;
}) {
  return (
    <div className={'g-blocks' + (compact ? ' is-compact' : '')}>
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'p':
            return (
              <p key={i} className="g-p">
                <Rich text={b.text} />
              </p>
            );
          case 'h':
            return (
              <h3
                key={i}
                className="g-h"
                id={anchor ? `${anchor}--${slugify(b.text)}` : undefined}
                data-sec={anchor && secKey ? `${secKey}/${slugify(b.text)}` : undefined}
              >
                {b.text}
              </h3>
            );
          case 'steps':
            return (
              <ol key={i} className="g-steps">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Rich text={it} />
                  </li>
                ))}
              </ol>
            );
          case 'list':
            return (
              <ul key={i} className="g-list">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Rich text={it} />
                  </li>
                ))}
              </ul>
            );
          case 'defs':
            return (
              <dl key={i} className="g-defs">
                {b.items.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            );
          case 'callout':
            return (
              <div key={i} className={`g-callout is-${b.tone}`}>
                {b.emoji ? <span className="g-emoji">{b.emoji}</span> : b.tone === 'tip' && <Fa icon={faLightbulb} size={14} />}
                <p>
                  {!b.emoji && <b>{TONE[b.tone]}. </b>}
                  {b.text}
                </p>
              </div>
            );
          case 'shots':
            return shotsAs === 'none' ? null : <Shots key={i} shots={b.shots} compact={shotsAs === 'thumbs'} />;
          case 'specs':
            return <Specs key={i} />;
          case 'video':
            return b.src ? (
              <figure key={i} className="g-video">
                <video src={b.src} controls preload="metadata" />
              </figure>
            ) : null;
          case 'more':
            return (
              <details key={i} className="g-more">
                <summary>{b.title}</summary>
                <Blocks blocks={b.blocks} compact={compact} shotsAs={shotsAs} />
              </details>
            );
        }
      })}
    </div>
  );
}

/** "Take me there" when the step lives on another screen, "Show me" when it's on this one. */
export function WhereButton({ guide, section, variant = 'light' }: { guide: Guide; section: Section; variant?: 'light' | 'dark' | 'text' }) {
  const goThere = useStore((s) => s.goThere);
  if (!section.where) return null;
  const here = parse(location.hash);
  const to = parse('#' + section.where.to);
  const same = here.path === to.path && (to.q.get('tab') ?? 'media') === (here.q.get('tab') ?? 'media') && !to.q.get('new');
  return (
    <button className={`g-where is-${variant}`} onClick={() => goThere(section.where!, guide.id, section.id)}>
      <Fa icon={same ? faHandPointer : faLocationCrosshairs} size={13} />
      {same ? 'Show me on this screen' : 'Take me there'}
    </button>
  );
}

export function SectionView({ guide, section, variant, onNav, aside, here }: { guide: Guide; section: Section; variant: 'panel' | 'modal'; onNav: (id: string) => void; aside?: ReactNode; here?: boolean }) {
  const i = guide.sections.indexOf(section);
  const prev = guide.sections[i - 1];
  const next = guide.sections[i + 1];
  const frames = sectionFrames(section);
  return (
    <article className={`g-sec is-${variant}`}>
      <header className="g-sec-head">
        <span className="g-sec-n">{i + 1}</span>
        <div>
          {here && <span className="ga-here">You’re on this screen</span>}
          <h3>{section.title}</h3>
        </div>
      </header>
      {aside}
      {frames.length > 0 && <Walkthrough key={guide.id + section.id} frames={frames} size={variant === 'panel' ? 'sm' : 'md'} label="Watch" />}
      <Blocks blocks={section.blocks} compact={variant === 'panel'} shotsAs={variant === 'modal' && frames.length === 1 ? 'none' : 'thumbs'} />
      <WhereButton guide={guide} section={section} variant={variant === 'modal' ? 'dark' : 'light'} />
      <nav className="g-pn">
        {prev ? (
          <button onClick={() => onNav(prev.id)}>
            <Fa icon={faArrowLeft} size={12} />
            <span>
              <small>Previous</small>
              {prev.title}
            </span>
          </button>
        ) : (
          <span />
        )}
        {next && (
          <button className="is-next" onClick={() => onNav(next.id)}>
            <span>
              <small>Next</small>
              {next.title}
            </span>
            <Fa icon={faArrowRight} size={12} />
          </button>
        )}
      </nav>
    </article>
  );
}

export function Overview({ guide, onNav, size }: { guide: Guide; onNav: (id: string) => void; size: 'sm' | 'md' }) {
  const { frames, chapters } = guideFrames(guide);
  return (
    <div className="g-over">
      <p className="g-lead">{guide.intro}</p>
      {frames.length > 0 && <Walkthrough frames={frames} chapters={chapters} size={size} label="Full walkthrough" />}
      <ol className="g-over-list">
        {guide.sections.map((s, i) => (
          <li key={s.id}>
            <button onClick={() => onNav(s.id)}>
              <span className="g-sec-n is-sm">{i + 1}</span>
              {s.title}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SampleNote({ guide, children, onExample }: { guide: Guide; children?: ReactNode; onExample: () => void }) {
  const f = guideFeature(guide);
  const g = groupById(f.group)!;
  return (
    <div className="g-sample">
      <p className="g-sample-t">Sample entry</p>
      <p>
        Only the Movies guide was moved over for this prototype. The {f.name} guide would live here, in {g.name}, with the same steps, screenshots and video.
      </p>
      <button className="g-sample-go" onClick={onExample}>
        See the Movies guide
        <Fa icon={faArrowRight} size={11} />
      </button>
      {children}
    </div>
  );
}
