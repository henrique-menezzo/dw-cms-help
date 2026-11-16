import { useState } from 'react';
import { faCheck, faHashtag, faThumbsDown, faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import { Fa } from '../components/Icon';
import { blockText, fmtDate, guideById, guideFeature, type Guide } from '../data/guides';
import { groupById, type Group } from '../data/nav';
import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { useStore } from '../store';
import { Blocks, WhereButton, guideFrames } from './GuideBlocks';
import { Walkthrough } from './Walkthrough';

export const readMinutes = (g: Guide) =>
  Math.max(1, Math.round(g.sections.flatMap((s) => s.blocks.map(blockText)).join(' ').split(/\s+/).length / 200));

export function TopicIcon({ g, size = 44, icon }: { g: Group; size?: number; icon?: IconDefinition }) {
  return (
    <span className="lib-ico" style={{ width: size, height: size }}>
      <Fa icon={icon ?? g.icon} size={Math.round(size * 0.42)} />
    </span>
  );
}

export function useDone(guide: string) {
  return useStore((s) => s.done[guide]) ?? [];
}

export function DoneToggle({ guide, section }: { guide: string; section: string }) {
  const done = useDone(guide).includes(section);
  const toggle = useStore((s) => s.toggleDone);
  return (
    <button className={'g-done' + (done ? ' is-done' : '')} onClick={() => toggle(guide, section)} aria-pressed={done}>
      <span className="g-done-box">{done && <Fa icon={faCheck} size={10} />}</span>
      {done ? 'Done' : 'Mark step as done'}
    </button>
  );
}

export function Progress({ guide }: { guide: Guide }) {
  const done = useDone(guide.id).filter((id) => guide.sections.some((s) => s.id === id)).length;
  const total = guide.sections.length;
  if (!done) return <p className="g-prog-meta">{`${total} steps · ${readMinutes(guide)} min read`}</p>;
  return (
    <div className="g-prog">
      <p>{done === total ? 'All steps done. Nice work.' : `${done} of ${total} steps done`}</p>
      <span className="g-prog-bar">
        <i style={{ width: `${(done / total) * 100}%` }} />
      </span>
    </div>
  );
}

const REASONS = ['Something’s out of date', 'A step is missing', 'Hard to follow', 'Something else'];

/** Yes / Not really. Either can be undone or switched; a "Not really" asks why. */
export function Feedback({ compact }: { compact?: boolean }) {
  const [vote, setVote] = useState<'yes' | 'no' | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const choose = (v: 'yes' | 'no') => {
    setVote((cur) => (cur === v ? null : v));
    setSent(false);
  };
  return (
    <div className={'fb' + (compact ? ' is-compact' : '')}>
      <div className="fb-row">
        <p className="fb-q">{vote === 'yes' ? 'Thanks for telling us 🙌' : sent ? 'Thanks. The CMS team will take a look 🙏' : 'Did this guide help?'}</p>
        <div className="fb-btns" role="group" aria-label="Rate this guide">
          <button className={vote === 'yes' ? 'is-on' : ''} aria-pressed={vote === 'yes'} onClick={() => choose('yes')}>
            <Fa icon={faThumbsUp} size={13} /> Yes
          </button>
          <button className={vote === 'no' ? 'is-on' : ''} aria-pressed={vote === 'no'} onClick={() => choose('no')}>
            <Fa icon={faThumbsDown} size={13} /> Not really
          </button>
        </div>
      </div>
      {vote === 'no' && !sent && (
        <div className="fb-why">
          <p>What went wrong?</p>
          <div className="fb-chips">
            {REASONS.map((r) => (
              <button key={r} className={picked.includes(r) ? 'is-on' : ''} onClick={() => setPicked((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]))}>
                {r}
              </button>
            ))}
          </div>
          <textarea placeholder="Tell us more (optional)" rows={3} />
          <button className="cb is-dark is-sm" onClick={() => setSent(true)}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}

export function StillStuck({ compact }: { compact?: boolean }) {
  return (
    <p className={'stuck-line' + (compact ? ' is-compact' : '')}>
      Still stuck?
      <button>
        <Fa icon={faHashtag} size={11} />
        Ask in #cms-help
      </button>
    </p>
  );
}

/** The whole guide in one scroll: video, steps, a closing line. Nothing that repeats what the index already says. */
export function GuideArticle({ guide, idPrefix, here }: { guide: Guide; variant?: 'page' | 'modal'; idPrefix: string; here?: string | null; onPick?: (id: string) => void }) {
  const { frames, chapters } = guideFrames(guide);
  return (
    <div className="ga is-page">
      {frames.length > 0 && (
        <div className="ga-video">
          <Walkthrough frames={frames} chapters={chapters} size="md" label="Watch the whole thing" />
        </div>
      )}
      {guide.sections.map((s, i) => (
        <section key={s.id} id={`${idPrefix}-${s.id}`} data-sec={s.id} className={'gp-sec' + (here === s.id ? ' is-here' : '')}>
          <header className="ga-head">
            {here === s.id && <p className="ga-here">You’re on this screen</p>}
            <h2>
              Step {i + 1}: {s.title}
            </h2>
          </header>
          <Blocks blocks={s.blocks} anchor={`${idPrefix}-${s.id}`} secKey={s.id} />
          {s.where && (
            <div className="ga-acts">
              <WhereButton guide={guide} section={s} variant="text" />
            </div>
          )}
        </section>
      ))}
      {guide.outro && (
        <div className="ga-outro" id={`${idPrefix}-done`} data-sec="done">
          <span>{guide.outro.emoji}</span>
          <div>
            <b>{guide.outro.title}</b>
            <p>{guide.outro.text}</p>
          </div>
        </div>
      )}
      <div className="ga-end">
        <Feedback />
        <StillStuck />
      </div>
    </div>
  );
}
