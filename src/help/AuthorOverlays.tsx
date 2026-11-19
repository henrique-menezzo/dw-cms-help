import { useEffect, useLayoutEffect, useState } from 'react';
import { faLocationCrosshairs } from '@fortawesome/free-solid-svg-icons';
import { Fa } from '../components/Icon';
import { useAuthored } from '../data/authored';
import { spotLabel } from '../data/authoring';
import { featureBySlug, featurePath } from '../data/nav';
import { go, parse } from '../lib/router';
import { useStore } from '../store';

const OWN = '.ap-bar, .ap-hl';

/**
 * "Point this step at the screen": the real CMS page, where every spot a step can point at lights up under the
 * mouse. Clicking one links the step; clicking anything else works as usual, so you can get to the right screen first.
 */
export function SpotPicker() {
  const picking = useAuthored((s) => s.picking);
  const setPicking = useAuthored((s) => s.setPicking);
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!picking) return;
    useStore.getState().closeHelp();
    const finish = () => {
      setPicking(null);
      setEl(null);
      go(`/help/write/${picking.guide}?step=${picking.section}`);
    };
    const find = (t: EventTarget | null) => {
      const node = t as Element | null;
      if (!node?.closest || node.closest(OWN)) return null;
      return node.closest<HTMLElement>('[data-help]');
    };
    const move = (e: MouseEvent) => setEl(find(e.target));
    const click = (e: MouseEvent) => {
      const hit = find(e.target);
      if (!hit) return;
      e.preventDefault();
      e.stopPropagation();
      const r = parse(location.hash);
      const qs = r.q.toString();
      const where = { to: r.path + (qs ? '?' + qs : ''), target: hit.dataset.help! };
      const a = useAuthored.getState();
      const d = a.drafts[picking.guide];
      if (d) a.saveDraft({ ...d, sections: d.sections.map((s) => (s.id === picking.section ? { ...s, where } : s)) });
      finish();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setPicking(null);
        go(`/help/write/${picking.guide}?step=${picking.section}`);
      }
    };
    addEventListener('mousemove', move, true);
    addEventListener('click', click, true);
    addEventListener('keydown', key, true);
    document.documentElement.classList.add('is-picking');
    return () => {
      removeEventListener('mousemove', move, true);
      removeEventListener('click', click, true);
      removeEventListener('keydown', key, true);
      document.documentElement.classList.remove('is-picking');
    };
  }, [picking?.guide, picking?.section]);

  // follow the element if the page scrolls or the layout moves
  useLayoutEffect(() => {
    if (!el) return setRect(null);
    let raf = 0;
    const track = () => {
      const r = el.getBoundingClientRect();
      setRect((p) => (p && p.top === r.top && p.left === r.left && p.width === r.width && p.height === r.height ? p : r));
      raf = requestAnimationFrame(track);
    };
    track();
    return () => cancelAnimationFrame(raf);
  }, [el]);

  if (!picking) return null;
  const pad = 6;
  return (
    <>
      {rect && el && (
        <div className="ap-hl" style={{ transform: `translate(${rect.left - pad}px, ${rect.top - pad}px)`, width: rect.width + pad * 2, height: rect.height + pad * 2 }}>
          <span className="ap-hl-l">{spotLabel(el.dataset.help!)}</span>
        </div>
      )}
      <div className="ap-bar" role="status">
        <Fa icon={faLocationCrosshairs} size={13} />
        <span>
          <b>Click the spot this step is about.</b> Somewhere else? Go there first, then click.
        </span>
        <button
          onClick={() => {
            setPicking(null);
            go(`/help/write/${picking.guide}?step=${picking.section}`);
          }}
        >
          Cancel
        </button>
      </div>
    </>
  );
}

/** While a draft is being previewed: the same guide people will get, on the page and in the library. */
export function PreviewBar() {
  const id = useAuthored((s) => s.preview);
  const setPreview = useAuthored((s) => s.setPreview);
  const openHelp = useStore((s) => s.openHelp);
  const [, force] = useState(0);
  useEffect(() => {
    const on = () => force((n) => n + 1);
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  if (!id) return null;
  const f = featureBySlug(id);
  if (!f) return null;
  const r = parse(location.hash);
  const onFull = r.parts[0] === 'help' && r.parts[1] === id;
  return (
    <div className="ap-bar is-preview" role="status">
      <span>
        <b>Preview of your draft</b>
      </span>
      <span className="ap-seg">
        <button
          className={onFull ? '' : 'is-on'}
          onClick={() => {
            go(featurePath(f));
            setTimeout(() => openHelp(id, null), 60);
          }}
        >
          On the page
        </button>
        <button className={onFull ? 'is-on' : ''} onClick={() => go(`/help/${id}`)}>
          Full guide
        </button>
      </span>
      <button
        className="ap-back"
        onClick={() => {
          setPreview(null);
          go(`/help/write/${id}`);
        }}
      >
        Back to editing
      </button>
    </div>
  );
}
