import { useEffect, useLayoutEffect, useState } from 'react';
import { faChevronLeft, faChevronRight, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';
import { Fa } from '../components/Icon';
import { guideById, guideFeature } from '../data/guides';
import { useStore } from '../store';

/** Dims the page around the thing a guide step points at, then lets go. */
export function Spotlight() {
  const spot = useStore((s) => s.spot);
  const clear = useStore((s) => s.clearSpot);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [fading, setFading] = useState(false);

  useLayoutEffect(() => {
    setRect(null);
    setFading(false);
    if (!spot) return;
    let el: HTMLElement | null = null;
    let tries = 0;
    let raf = 0;
    let follow = 0;
    const timers: number[] = [];
    // the docked panel may be pushing the page while we scroll, so track the element every frame
    const track = () => {
      if (el) {
        const r = el.getBoundingClientRect();
        setRect((p) => (p && p.top === r.top && p.left === r.left && p.width === r.width && p.height === r.height ? p : r));
      }
      follow = requestAnimationFrame(track);
    };
    const find = () => {
      el = document.querySelector(`[data-help="${spot.target}"]`);
      if (!el) {
        if (tries++ < 90) raf = requestAnimationFrame(find);
        return;
      }
      // let the panel finish opening before scrolling
      timers.push(
        window.setTimeout(() => {
          el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          follow = requestAnimationFrame(track);
        }, 280),
      );
      timers.push(window.setTimeout(() => setFading(true), 2900));
      timers.push(window.setTimeout(clear, 3400));
    };
    timers.push(window.setTimeout(find, 40));
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(follow);
      timers.forEach(clearTimeout);
    };
  }, [spot?.n]);

  if (!spot || !rect) return null;
  const pad = 8;
  return (
    <div
      className={'spot' + (fading ? ' is-out' : '')}
      style={{ transform: `translate(${rect.left - pad}px, ${rect.top - pad}px)`, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
      onClick={clear}
    />
  );
}

export function Lightbox() {
  const lb = useStore((s) => s.lightbox);
  const close = useStore((s) => s.closeLightbox);
  const open = useStore((s) => s.openLightbox);
  useEffect(() => {
    if (!lb) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' && lb.i < lb.shots.length - 1) open(lb.shots, lb.i + 1);
      if (e.key === 'ArrowLeft' && lb.i > 0) open(lb.shots, lb.i - 1);
    };
    addEventListener('keydown', on, true);
    return () => removeEventListener('keydown', on, true);
  }, [lb]);
  if (!lb) return null;
  const s = lb.shots[lb.i];
  return (
    <div className="lb" onClick={close}>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={s.src} alt={s.alt} />
        <figcaption>
          {s.alt}
          {lb.shots.length > 1 && (
            <span>
              {lb.i + 1} / {lb.shots.length}
            </span>
          )}
        </figcaption>
      </figure>
      <button className="lb-x" onClick={close} aria-label="Close">
        <Fa icon={faXmark} size={20} />
      </button>
      {lb.i > 0 && (
        <button
          className="lb-nav is-prev"
          onClick={(e) => {
            e.stopPropagation();
            open(lb.shots, lb.i - 1);
          }}
          aria-label="Previous"
        >
          <Fa icon={faChevronLeft} size={18} />
        </button>
      )}
      {lb.i < lb.shots.length - 1 && (
        <button
          className="lb-nav is-next"
          onClick={(e) => {
            e.stopPropagation();
            open(lb.shots, lb.i + 1);
          }}
          aria-label="Next"
        >
          <Fa icon={faChevronRight} size={18} />
        </button>
      )}
    </div>
  );
}

/** The one entry point. Same label, same place, on every CMS page. */
export function HowTo() {
  const open = useStore((s) => s.help.open);
  const ctx = useStore((s) => s.ctx);
  const toggle = useStore((s) => s.toggleHelp);
  if (!ctx) return null;
  const g = guideById(ctx.guide);
  const name = g ? guideFeature(g).name : '';
  return (
    <button
      className={'h-howto' + (open ? ' is-on' : '')}
      data-help="howto"
      onClick={toggle}
      aria-expanded={open}
      aria-label={`Help for ${name}`}
      title={`Help for ${name} (?)`}
    >
      <Fa icon={faCircleQuestion} size={19} />
    </button>
  );
}
