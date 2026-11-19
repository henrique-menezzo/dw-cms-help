import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  faAlignLeft,
  faArrowDown,
  faArrowUp,
  faBookOpen,
  faCheck,
  faChevronDown,
  faCircleQuestion,
  faFilm,
  faGripVertical,
  faHeading,
  faImage,
  faListOl,
  faListUl,
  faLocationCrosshairs,
  faMagnifyingGlass,
  faPlus,
  faTableList,
  faTrashCan,
  faTriangleExclamation,
  faVideo,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { faLightbulb } from '@fortawesome/free-regular-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { Fa } from '../components/Icon';
import { PageBar } from '../components/Shell';
import { useAuthored, useAuthoredVersion } from '../data/authored';
import { pageLabel, readImage, readiness, spotLabel, uid } from '../data/authoring';
import { guideById, type Block, type Guide, type Section, type Shot } from '../data/guides';
import { featureBySlug, featurePath, groupById } from '../data/nav';
import { go, type Route } from '../lib/router';
import { readMinutes } from '../help/Article';
import { guideFrames } from '../help/GuideBlocks';
import { Walkthrough } from '../help/Walkthrough';
import { useStore } from '../store';

/* ---------------------------------------------------------------------------------------------
   Writing a guide in the CMS. The page looks like the guide people will read (same column, same
   type), so what you write is what they get. Outline on the left, what's left to do on the right.
   --------------------------------------------------------------------------------------------- */

export function GuideEditor({ route, id }: { route: Route; id: string }) {
  useAuthoredVersion();
  const draft = useAuthored((s) => s.drafts[id]);
  const published = useAuthored((s) => s.published[id]);
  const savedAt = useAuthored((s) => s.savedAt[id]);
  const saveDraft = useAuthored((s) => s.saveDraft);
  const publish = useAuthored((s) => s.publish);
  const discard = useAuthored((s) => s.discardDraft);
  const setPreview = useAuthored((s) => s.setPreview);
  const setPicking = useAuthored((s) => s.setPicking);
  const openHelp = useStore((s) => s.openHelp);
  const f = featureBySlug(id);
  const [active, setActive] = useState('top');
  const [flash, setFlash] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const leaving = useRef(false);

  // Editing a guide that's already live starts a draft from it; anything else goes through New guide.
  useEffect(() => {
    if (draft || !f || leaving.current) return;
    const live = guideById(id);
    if (live && !live.sample) saveDraft(structuredClone(live));
    else go(`/help?new=1&page=${id}`);
  }, [draft, id]);

  // back from "Pick it on the page": land on that step and show what changed
  const stepParam = route.q.get('step');
  useEffect(() => {
    if (!stepParam) window.scrollTo({ top: 0 });
  }, [id]);
  useEffect(() => {
    if (!stepParam) return;
    const t = setTimeout(() => {
      document.getElementById('e-' + stepParam)?.scrollIntoView({ block: 'center' });
      setFlash(stepParam);
      setTimeout(() => setFlash(null), 1600);
    }, 80);
    return () => clearTimeout(t);
  }, [stepParam]);

  useEffect(() => {
    const on = () => {
      let cur = 'top';
      document.querySelectorAll<HTMLElement>('[data-esec]').forEach((el) => {
        if (el.getBoundingClientRect().top < 280) cur = el.dataset.esec!;
      });
      setActive(cur);
    };
    on();
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, [id, draft?.sections.length]);

  if (!draft || !f) return null;
  const g = groupById(f.group)!;
  const update = (fn: (d: Guide) => Guide) => saveDraft(fn(useAuthored.getState().drafts[id]));
  const setSec = (sid: string, fn: (s: Section) => Section) => update((d) => ({ ...d, sections: d.sections.map((s) => (s.id === sid ? fn(s) : s)) }));
  const moveSec = (from: number, to: number) =>
    update((d) => {
      const list = [...d.sections];
      const [x] = list.splice(from, 1);
      list.splice(to, 0, x);
      return { ...d, sections: list };
    });
  const addSec = () => {
    const nid = uid();
    update((d) => ({ ...d, sections: [...d.sections, { id: nid, title: '', blocks: [{ t: 'p', text: '' }], hint: 'What to do in this step.' }] }));
    setTimeout(() => {
      const el = document.getElementById('e-' + nid);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.querySelector<HTMLTextAreaElement>('.ge-step-t')?.focus({ preventScroll: true });
    }, 40);
  };
  const delSec = (sid: string) => update((d) => ({ ...d, sections: d.sections.filter((s) => s.id !== sid) }));
  const jump = (key: string) =>
    key === 'top' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : document.getElementById('e-' + key)?.scrollIntoView({ block: 'start', behavior: 'smooth' });

  const checks = readiness(draft);
  const ready = checks.every((c) => c.ok);
  const live = published ?? (guideById(id)?.sample === false ? guideById(id) : undefined);
  const { frames, chapters } = guideFrames(draft);

  const pick = (s: Section) => {
    setPicking({ guide: id, section: s.id });
    go(s.where?.to ?? featurePath(f));
  };
  const preview = () => {
    setPreview(id);
    go(featurePath(f));
    setTimeout(() => openHelp(id, null), 60);
  };
  const goLive = () => {
    leaving.current = true;
    publish(id);
    go(`/help/${id}?published=1`);
  };

  return (
    <div className="c-page">
      <PageBar
        crumbs={[{ label: 'Help Library', to: '/help' }, { label: g.name, to: `/help?cat=${g.id}` }, live ? { label: f.name, to: `/help/${id}` } : { label: f.name }, { label: live ? 'Editing' : 'New guide' }]}
        howto={false}
      >
        <SavedAt at={savedAt} />
        <button className="pb-copy" onClick={preview}>
          Preview
        </button>
        <button className="ge-publish" disabled={!ready} onClick={goLive} title={ready ? undefined : 'Finish the list on the right first'}>
          {live ? 'Publish changes' : 'Publish'}
        </button>
      </PageBar>

      <div className="docs is-editor">
        <nav className="ge-outline" aria-label="Outline">
          <p className="dt-t">Outline</p>
          <button className={'ge-o' + (active === 'top' ? ' is-on' : '')} onClick={() => jump('top')}>
            <span className="ge-o-t">Title and intro</span>
          </button>
          <Outline sections={draft.sections} active={active} onJump={jump} onMove={moveSec} />
          <button className="ge-o is-add" onClick={addSec}>
            <Fa icon={faPlus} size={11} />
            Add a step
          </button>
        </nav>

        <article className="da ge-doc">
          <div data-esec="top">
            <AutoText className="ge-title" value={draft.title} onChange={(v) => update((d) => ({ ...d, title: v }))} placeholder="Guide title" />
            <AutoText
              className="ge-lead"
              value={draft.intro}
              onChange={(v) => update((d) => ({ ...d, intro: v }))}
              placeholder={`One line on what this helps people do. For example: Everything you need to add ${f.name.toLowerCase()} and get it live.`}
            />
            <p className="da-meta">
              <span>{draft.sections.length === 1 ? '1 step' : `${draft.sections.length} steps`}</span>
              <span>{readMinutes(draft)} min read</span>
            </p>
            {frames.length > 0 ? (
              <div className="ge-walk">
                <Walkthrough frames={frames} chapters={chapters} size="md" label="Watch the whole thing" />
                <p className="ge-note">Made from the screenshots in your steps. It updates as you add them.</p>
              </div>
            ) : (
              <div className="ge-walk-empty">
                <Fa icon={faFilm} size={18} />
                <div>
                  <b>The walkthrough video makes itself</b>
                  <p>Add a screenshot to each step and they play here as a short video, one chapter per step.</p>
                </div>
              </div>
            )}
          </div>

          {draft.sections.map((s, i) => (
            <StepEditor
              key={s.id}
              s={s}
              i={i}
              count={draft.sections.length}
              flash={flash === s.id}
              onChange={(fn) => setSec(s.id, fn)}
              onMove={(dir) => moveSec(i, i + dir)}
              onDelete={() => delSec(s.id)}
              onPick={() => pick(s)}
            />
          ))}

          <button className="ge-add-step" onClick={addSec}>
            <Fa icon={faPlus} size={12} />
            Add a step
          </button>
        </article>

        <aside className="ge-rail" aria-label="Guide settings">
          <section>
            <p className="dt-t">Status</p>
            <p className="ge-status">
              <span className="ge-chip">Draft</span>
              {live ? 'The live guide stays as it is until you publish.' : 'Only you can see this until you publish.'}
            </p>
          </section>
          <section>
            <p className="dt-t">Where people find it</p>
            <ul className="ge-reach">
              <li>
                <Fa icon={faCircleQuestion} size={13} />
                The question mark on {f.name}
              </li>
              <li>
                <Fa icon={faBookOpen} size={13} />
                Help Library, in {g.name}
              </li>
              <li>
                <Fa icon={faMagnifyingGlass} size={13} />
                Search, with ⌘K
              </li>
            </ul>
          </section>
          <section>
            <p className="dt-t">Before you publish</p>
            <ul className="ge-ready">
              {checks.map((c) => (
                <li key={c.label} className={c.ok ? 'is-ok' : ''}>
                  <span className="ge-ready-dot" aria-hidden="true">
                    {c.ok && <Fa icon={faCheck} size={7} />}
                  </span>
                  {c.label}
                  {c.ok && <span className="sr-only"> (done)</span>}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <p className="dt-t">Writing tips</p>
            <ul className="ge-tips">
              <li>One thing to do per step.</li>
              <li>Start with what to click, like “Click Add New.”</li>
              <li>Select words and press ⌘B to make them bold.</li>
            </ul>
          </section>
          <section className="ge-rail-end">
            {confirmDiscard ? (
              <p className="ge-confirm">
                {live ? 'Throw away your changes?' : 'Delete this draft?'}
                <button
                  className="is-danger"
                  onClick={() => {
                    leaving.current = true;
                    discard(id);
                    go(live ? `/help/${id}` : '/help');
                  }}
                >
                  {live ? 'Throw away' : 'Delete'}
                </button>
                <button onClick={() => setConfirmDiscard(false)}>Keep</button>
              </p>
            ) : (
              <button className="ge-discard" onClick={() => setConfirmDiscard(true)}>
                {live ? 'Throw away changes' : 'Delete draft'}
              </button>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function SavedAt({ at }: { at?: number }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);
  if (!at) return null;
  const s = Math.round((Date.now() - at) / 1000);
  const label = s < 20 ? 'Saved' : s < 3600 ? `Saved ${Math.max(1, Math.round(s / 60))} min ago` : 'Saved';
  return <span className="ge-saved">{label}</span>;
}

/* ---------- outline: drag to reorder ---------- */
function Outline({ sections, active, onJump, onMove }: { sections: Section[]; active: string; onJump: (id: string) => void; onMove: (from: number, to: number) => void }) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  return (
    <>
      {sections.map((s, i) => (
        <button
          key={s.id}
          className={'ge-o is-step' + (active === s.id ? ' is-on' : '') + (drag === i ? ' is-drag' : '') + (over === i && drag !== i ? ' is-over' : '')}
          draggable
          onDragStart={(e) => {
            setDrag(i);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(i);
          }}
          onDragLeave={() => setOver((o) => (o === i ? null : o))}
          onDrop={(e) => {
            e.preventDefault();
            if (drag !== null && drag !== i) onMove(drag, i);
            setDrag(null);
            setOver(null);
          }}
          onDragEnd={() => {
            setDrag(null);
            setOver(null);
          }}
          onClick={() => onJump(s.id)}
        >
          <Fa icon={faGripVertical} size={10} className="ge-o-grip" />
          <span className={'ge-o-t' + (s.title.trim() ? '' : ' is-empty')}>
            {i + 1}. {s.title.trim() || 'Untitled step'}
          </span>
        </button>
      ))}
    </>
  );
}

/* ---------- one step ---------- */
function StepEditor({
  s,
  i,
  count,
  flash,
  onChange,
  onMove,
  onDelete,
  onPick,
}: {
  s: Section;
  i: number;
  count: number;
  flash: boolean;
  onChange: (fn: (s: Section) => Section) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onPick: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <section className="ge-step" id={'e-' + s.id} data-esec={s.id}>
      <header className="ge-step-head">
        <h2>
          <span className="ge-step-n">Step {i + 1}:</span>
          <AutoText className="ge-step-t" value={s.title} onChange={(v) => onChange((x) => ({ ...x, title: v }))} placeholder="Name this step" />
        </h2>
        <div className="ge-tools">
          {confirm ? (
            <span className="ge-confirm">
              Delete this step?
              <button className="is-danger" onClick={onDelete}>
                Delete
              </button>
              <button onClick={() => setConfirm(false)}>Keep</button>
            </span>
          ) : (
            <>
              <IconBtn icon={faArrowUp} label="Move step up" disabled={i === 0} onClick={() => onMove(-1)} />
              <IconBtn icon={faArrowDown} label="Move step down" disabled={i === count - 1} onClick={() => onMove(1)} />
              <IconBtn icon={faTrashCan} label="Delete step" onClick={() => setConfirm(true)} />
            </>
          )}
        </div>
      </header>

      <BlockList blocks={s.blocks} hint={s.hint} onChange={(blocks) => onChange((x) => ({ ...x, blocks }))} />

      <div className={'ge-where' + (flash ? ' is-flash' : '')}>
        {s.where ? (
          <>
            <span className="ge-where-pill" aria-hidden="true">
              <Fa icon={faLocationCrosshairs} size={13} />
              Take me there
            </span>
            <p>
              Opens <b>{pageLabel(s.where.to)}</b> and points at <b>{spotLabel(s.where.target)}</b>.
            </p>
            <button className="ge-link" onClick={onPick}>
              Change
            </button>
            <button className="ge-link" onClick={() => onChange((x) => ({ ...x, where: undefined }))}>
              Remove
            </button>
          </>
        ) : (
          <button className="ge-where-add" onClick={onPick}>
            <Fa icon={faLocationCrosshairs} size={13} />
            Point this step at the screen
            <span>Adds a Take me there button. You click the spot on the real page.</span>
          </button>
        )}
      </div>
    </section>
  );
}

/* ---------- blocks ---------- */
type Kind = { key: string; icon: IconDefinition; label: string; sub: string; make: () => Block };
const KINDS: Kind[] = [
  { key: 'p', icon: faAlignLeft, label: 'Text', sub: 'A paragraph', make: () => ({ t: 'p', text: '' }) },
  { key: 'steps', icon: faListOl, label: 'Numbered steps', sub: 'Click this, then that', make: () => ({ t: 'steps', items: [''] }) },
  { key: 'shots', icon: faImage, label: 'Screenshot', sub: 'Show the screen', make: () => ({ t: 'shots', shots: [] }) },
  { key: 'tip', icon: faLightbulb, label: 'Tip', sub: 'A shortcut or a nice to know', make: () => ({ t: 'callout', tone: 'tip', text: '', emoji: '💡' }) },
  { key: 'warn', icon: faTriangleExclamation, label: 'Heads up', sub: 'Something that can go wrong', make: () => ({ t: 'callout', tone: 'warn', text: '' }) },
  { key: 'video', icon: faVideo, label: 'Video', sub: 'Upload a clip', make: () => ({ t: 'video', src: '', name: '' }) },
  { key: 'defs', icon: faTableList, label: 'Field list', sub: 'A field and what goes in it', make: () => ({ t: 'defs', items: [['', '']] }) },
  { key: 'list', icon: faListUl, label: 'Bullet list', sub: 'A few things to know', make: () => ({ t: 'list', items: [''] }) },
  { key: 'h', icon: faHeading, label: 'Subheading', sub: 'Split a long step', make: () => ({ t: 'h', text: '' }) },
  { key: 'more', icon: faChevronDown, label: 'Extra detail', sub: 'Closed until someone opens it', make: () => ({ t: 'more', title: '', blocks: [{ t: 'p', text: '' }] }) },
];

function BlockList({ blocks, onChange, hint, nested }: { blocks: Block[]; onChange: (b: Block[]) => void; hint?: string; nested?: boolean }) {
  const [fresh, setFresh] = useState<number | null>(null);
  const set = (i: number, b: Block) => onChange(blocks.map((x, j) => (j === i ? b : x)));
  const move = (i: number, dir: -1 | 1) => {
    const list = [...blocks];
    const [x] = list.splice(i, 1);
    list.splice(i + dir, 0, x);
    onChange(list);
  };
  return (
    <div className="g-blocks ge-blocks">
      {blocks.map((b, i) => (
        <div key={i} className={'ge-b is-' + b.t}>
          <BlockEditor
            b={b}
            onChange={(nb) => set(i, nb)}
            autoFocus={fresh === i}
            hint={i === 0 ? hint : undefined}
            onEnter={() => {
              setFresh(i + 1);
              onChange([...blocks.slice(0, i + 1), { t: 'p', text: '' }, ...blocks.slice(i + 1)]);
            }}
          />
          <div className="ge-b-tools">
            <IconBtn icon={faArrowUp} label="Move up" disabled={i === 0} onClick={() => move(i, -1)} />
            <IconBtn icon={faArrowDown} label="Move down" disabled={i === blocks.length - 1} onClick={() => move(i, 1)} />
            <IconBtn icon={faXmark} label="Remove" onClick={() => onChange(blocks.filter((_, j) => j !== i))} />
          </div>
        </div>
      ))}
      <AddBlock
        nested={nested}
        onAdd={(b) => {
          setFresh(blocks.length);
          onChange([...blocks, b]);
        }}
      />
    </div>
  );
}

function AddBlock({ onAdd, nested }: { onAdd: (b: Block) => void; nested?: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    addEventListener('mousedown', off);
    addEventListener('keydown', esc);
    return () => {
      removeEventListener('mousedown', off);
      removeEventListener('keydown', esc);
    };
  }, [open]);
  const kinds = nested ? KINDS.filter((k) => !['more', 'h', 'video'].includes(k.key)) : KINDS;
  return (
    <div className={'ge-addb' + (open ? ' is-open' : '')} ref={box}>
      <button className="ge-addb-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Fa icon={faPlus} size={11} />
        Add
      </button>
      {open && (
        <div className="ge-menu" role="menu">
          {kinds.map((k) => (
            <button
              key={k.key}
              role="menuitem"
              className="ge-menu-i"
              onClick={() => {
                onAdd(k.make());
                setOpen(false);
              }}
            >
              <span className="ge-menu-ico">
                <Fa icon={k.icon} size={13} />
              </span>
              <span className="ge-menu-t">
                <b>{k.label}</b>
                <span>{k.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockEditor({ b, onChange, autoFocus, hint, onEnter }: { b: Block; onChange: (b: Block) => void; autoFocus?: boolean; hint?: string; onEnter?: () => void }) {
  switch (b.t) {
    case 'p':
      return (
        <RichText
          className="g-p ge-p"
          value={b.text}
          onChange={(text) => onChange({ ...b, text })}
          placeholder={hint ?? 'Write what to do here.'}
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && onEnter) {
              e.preventDefault();
              onEnter();
            }
          }}
        />
      );
    case 'h':
      return <AutoText className="g-h ge-h" value={b.text} onChange={(text) => onChange({ ...b, text })} placeholder="Subheading" autoFocus={autoFocus} />;
    case 'steps':
    case 'list':
      return <ItemsEditor ordered={b.t === 'steps'} items={b.items} onChange={(items) => onChange({ ...b, items })} autoFocus={autoFocus} />;
    case 'callout':
      return (
        <div className={`g-callout is-${b.tone} ge-callout`}>
          {b.emoji ? <span className="g-emoji">{b.emoji}</span> : <b className="ge-callout-l">Heads up.</b>}
          <RichText
            className="ge-callout-t"
            value={b.text}
            onChange={(text) => onChange({ ...b, text })}
            placeholder={b.tone === 'warn' ? 'What can go wrong, and how to avoid it.' : 'A shortcut or something nice to know.'}
            autoFocus={autoFocus}
          />
        </div>
      );
    case 'defs':
      return <DefsEditor items={b.items} onChange={(items) => onChange({ ...b, items })} autoFocus={autoFocus} />;
    case 'shots':
      return <ShotsEditor shots={b.shots} onChange={(shots) => onChange({ ...b, shots })} />;
    case 'video':
      return <VideoEditor b={b} onChange={onChange} />;
    case 'more':
      return (
        <div className="g-more ge-more">
          <div className="ge-more-head">
            <Fa icon={faChevronDown} size={10} />
            <AutoText className="ge-more-t" value={b.title} onChange={(title) => onChange({ ...b, title })} placeholder="What people will click to open it" autoFocus={autoFocus} />
          </div>
          <BlockList nested blocks={b.blocks} onChange={(blocks) => onChange({ ...b, blocks })} />
        </div>
      );
    case 'specs':
      return (
        <div className="ge-locked">
          <Fa icon={faTableList} size={13} />
          <p>
            <b>Image sizes table.</b> It comes from CMS Config, Media Sizes, so it stays right on its own.
          </p>
        </div>
      );
  }
}

function ItemsEditor({ items, ordered, onChange, autoFocus }: { items: string[]; ordered: boolean; onChange: (items: string[]) => void; autoFocus?: boolean }) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [focus, setFocus] = useState<number | null>(autoFocus ? 0 : null);
  useEffect(() => {
    if (focus === null) return;
    const el = refs.current[focus];
    if (el) focusEnd(el);
    setFocus(null);
  }, [focus, items.length]);
  const key = (i: number) => (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onChange([...items.slice(0, i + 1), '', ...items.slice(i + 1)]);
      setFocus(i + 1);
    } else if (e.key === 'Backspace' && !items[i] && items.length > 1) {
      e.preventDefault();
      onChange(items.filter((_, j) => j !== i));
      setFocus(Math.max(0, i - 1));
    }
  };
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={(ordered ? 'g-steps' : 'g-list') + ' ge-items'}>
      {items.map((it, i) => (
        <li key={i}>
          <RichText
            inputRef={(el) => (refs.current[i] = el)}
            value={it}
            onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))}
            onKeyDown={key(i)}
            placeholder={i === 0 ? (ordered ? 'Click…  (Enter adds the next one)' : 'Something to know') : ''}
          />
        </li>
      ))}
    </Tag>
  );
}

function DefsEditor({ items, onChange, autoFocus }: { items: [string, string][]; onChange: (items: [string, string][]) => void; autoFocus?: boolean }) {
  const set = (i: number, k: 0 | 1, v: string) => onChange(items.map((row, j) => (j === i ? ((k === 0 ? [v, row[1]] : [row[0], v]) as [string, string]) : row)));
  return (
    <div className="g-defs ge-defs">
      {items.map(([k, v], i) => (
        <div key={i}>
          <AutoText className="ge-def-k" value={k} onChange={(x) => set(i, 0, x)} placeholder="Field" autoFocus={autoFocus && i === 0} />
          <RichText className="ge-def-v" value={v} onChange={(x) => set(i, 1, x)} placeholder="What goes in it" />
          {items.length > 1 && <IconBtn icon={faXmark} label="Remove field" onClick={() => onChange(items.filter((_, j) => j !== i))} />}
        </div>
      ))}
      <button className="ge-link is-add" onClick={() => onChange([...items, ['', '']])}>
        <Fa icon={faPlus} size={10} />
        Add a field
      </button>
    </div>
  );
}

function Drop({ accept, onFiles, icon, title, sub, compact }: { accept: string; onFiles: (f: File[]) => void; icon: IconDefinition; title: string; sub: string; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const take = (list: FileList | null | undefined) => {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith(accept.replace('/*', '')));
    if (files.length) onFiles(files);
  };
  return (
    <div
      className={'ge-drop' + (compact ? ' is-compact' : '') + (over ? ' is-over' : '')}
      tabIndex={0}
      role="button"
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), input.current?.click())}
      onMouseEnter={(e) => e.currentTarget.focus({ preventScroll: true })}
      onPaste={(e) => take(e.clipboardData.files)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files);
      }}
    >
      <Fa icon={icon} size={18} />
      <b>{title}</b>
      <span>{sub}</span>
      <input ref={input} type="file" accept={accept} multiple={accept.startsWith('image')} hidden onChange={(e) => take(e.target.files)} />
    </div>
  );
}

function ShotsEditor({ shots, onChange }: { shots: Shot[]; onChange: (s: Shot[]) => void }) {
  const add = async (files: File[]) => {
    const read = await Promise.all(files.map((f) => readImage(f)));
    onChange([...shots, ...read]);
  };
  return (
    <div className="ge-shots">
      {shots.map((s, i) => (
        <figure key={i} className="ge-shot">
          <div className="ge-shot-img" style={s.w ? { maxWidth: Math.round(s.w / 2) } : undefined}>
            <img src={s.src} alt={s.alt} width={s.w} height={s.h} />
            <IconBtn icon={faXmark} label="Remove screenshot" onClick={() => onChange(shots.filter((_, j) => j !== i))} />
          </div>
          <AutoText className="ge-cap" value={s.alt} onChange={(alt) => onChange(shots.map((x, j) => (j === i ? { ...x, alt } : x)))} placeholder="Say what this shows. It’s also the caption in the video." />
        </figure>
      ))}
      {shots.length === 0 ? (
        <Drop accept="image/*" onFiles={add} icon={faImage} title="Add a screenshot" sub="Drop it here, paste it with ⌘V, or click to choose" />
      ) : (
        <Drop compact accept="image/*" onFiles={add} icon={faPlus} title="Add another screenshot" sub="or drop one here" />
      )}
    </div>
  );
}

function VideoEditor({ b, onChange }: { b: Extract<Block, { t: 'video' }>; onChange: (b: Block) => void }) {
  const [broken, setBroken] = useState(false);
  if (!b.src || broken)
    return (
      <Drop
        accept="video/*"
        onFiles={([f]) => {
          setBroken(false);
          onChange({ ...b, src: URL.createObjectURL(f), name: f.name });
        }}
        icon={faVideo}
        title={broken ? 'Add the video again' : 'Add a video'}
        sub={broken ? 'Videos are only kept until the page reloads in this prototype' : 'MP4 or MOV. Drop it here or click to choose'}
      />
    );
  return (
    <figure className="g-video ge-video">
      <video src={b.src} controls preload="metadata" onError={() => setBroken(true)} />
      <figcaption>
        {b.name}
        <button className="ge-link" onClick={() => onChange({ ...b, src: '', name: '' })}>
          Remove
        </button>
      </figcaption>
    </figure>
  );
}

/* ---------- small parts ---------- */
function IconBtn({ icon, label, onClick, disabled }: { icon: IconDefinition; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button className="ge-ib" onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      <Fa icon={icon} size={11} />
    </button>
  );
}

/** A textarea that grows with its text. `rich` lets ⌘B wrap the selection in **bold**. */
function AutoText({
  value,
  onChange,
  placeholder,
  className = '',
  rich,
  autoFocus,
  onKeyDown,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  rich?: boolean;
  autoFocus?: boolean;
  onKeyDown?: (e: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
  inputRef?: (el: HTMLTextAreaElement | null) => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = el.scrollHeight + 'px';
  };
  useLayoutEffect(fit, [value]);
  useEffect(() => {
    const ro = new ResizeObserver(fit);
    if (ref.current) ro.observe(ref.current);
    if (autoFocus) ref.current?.focus();
    return () => ro.disconnect();
  }, []);
  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        inputRef?.(el);
      }}
      rows={1}
      className={'ge-text ' + className}
      value={value}
      placeholder={placeholder}
      spellCheck
      onChange={(e) => onChange(e.target.value.replace(/\n{2,}/g, '\n'))}
      onKeyDown={(e) => {
        if (rich && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
          e.preventDefault();
          const el = e.currentTarget;
          const a = el.selectionStart;
          const z = el.selectionEnd;
          if (a === z) return;
          onChange(value.slice(0, a) + '**' + value.slice(a, z) + '**' + value.slice(z));
          requestAnimationFrame(() => el.setSelectionRange(a + 2, z + 2));
          return;
        }
        onKeyDown?.(e);
      }}
    />
  );
}

/* ---------- rich text: bold shows as bold while you write, stored as **bold** ---------- */
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const toHtml = (md: string) => esc(md).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
function toMd(node: Node): string {
  let out = '';
  node.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent ?? '';
    else if (n instanceof HTMLElement) {
      const inner = toMd(n);
      const bold = n.tagName === 'B' || n.tagName === 'STRONG' || Number(n.style.fontWeight) >= 600 || n.style.fontWeight === 'bold';
      if (n.tagName === 'BR') out += ' ';
      else if (bold && inner.trim()) out += inner.match(/^\s*/)![0] + '**' + inner.trim() + '**' + inner.match(/\s*$/)![0];
      else out += inner;
    }
  });
  return out.replace(/\u00a0/g, ' ').replace(/\*\*\*\*/g, '');
}
function focusEnd(el: HTMLElement) {
  el.focus();
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(false);
  const sel = getSelection();
  sel?.removeAllRanges();
  sel?.addRange(r);
}

function RichText({
  value,
  onChange,
  placeholder,
  className = '',
  autoFocus,
  onKeyDown,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: ReactKeyboardEvent<HTMLElement>) => void;
  inputRef?: (el: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const last = useRef<string | null>(null);
  // only rewrite the DOM when the value changed from outside, so the caret never jumps
  useLayoutEffect(() => {
    if (!ref.current || value === last.current) return;
    ref.current.innerHTML = toHtml(value);
    last.current = value;
  }, [value]);
  useEffect(() => {
    if (autoFocus && ref.current) focusEnd(ref.current);
  }, []);
  return (
    <div
      ref={(el) => {
        ref.current = el;
        inputRef?.(el);
      }}
      className={'ge-text ge-rich ' + className}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="false"
      aria-label={placeholder}
      data-placeholder={placeholder}
      spellCheck
      onInput={() => {
        const el = ref.current!;
        if (!el.textContent) el.innerHTML = '';
        const md = toMd(el);
        last.current = md;
        onChange(md);
      }}
      onKeyDown={(e) => {
        const mod = e.metaKey || e.ctrlKey;
        if (mod && e.key.toLowerCase() === 'b') {
          e.preventDefault();
          document.execCommand('bold');
          return;
        }
        if (mod && ['i', 'u'].includes(e.key.toLowerCase())) e.preventDefault();
        onKeyDown?.(e);
        if (e.key === 'Enter' && !e.defaultPrevented) e.preventDefault();
      }}
      onPaste={(e) => {
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain').replace(/\s*\n\s*/g, ' '));
      }}
    />
  );
}
