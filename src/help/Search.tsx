import { forwardRef } from 'react';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Fa } from '../components/Icon';
import { guideFeature, type Hit } from '../data/guides';

export const SearchBox = forwardRef<HTMLInputElement, { value: string; onChange: (v: string) => void; placeholder?: string; size?: 'md' | 'lg' }>(
  function SearchBox({ value, onChange, placeholder = 'Search all guides', size = 'md' }, ref) {
    return (
      <label className={`h-search is-${size}`}>
        <Fa icon={faMagnifyingGlass} size={size === 'lg' ? 18 : 14} />
        <input ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} spellCheck={false} />
        {value && (
          <button onClick={() => onChange('')} aria-label="Clear search">
            <Fa icon={faXmark} size={14} />
          </button>
        )}
      </label>
    );
  },
);

export function Mark({ text, q }: { text: string; q: string }) {
  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!tokens.length) return <>{text}</>;
  const re = new RegExp(`(${tokens.join('|')})`, 'gi');
  return (
    <>
      {text.split(re).map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>))}
    </>
  );
}

export function Results({ hits, q, onPick, dense }: { hits: Hit[]; q: string; onPick: (h: Hit) => void; dense?: boolean }) {
  if (!hits.length)
    return (
      <div className="h-noresults">
        <p>
          Nothing matches “<b>{q}</b>”.
        </p>
        <p>Try a feature name like Movies or Modular Pages, or a word from the screen, like “trailer”.</p>
      </div>
    );
  return (
    <ul className={'h-results' + (dense ? ' is-dense' : '')}>
      {hits.map((h) => {
        const f = guideFeature(h.guide);
        const n = h.section ? h.guide.sections.indexOf(h.section) + 1 : 0;
        return (
          <li key={h.guide.id + (h.section?.id ?? '')}>
            <button onClick={() => onPick(h)}>
              <span className="h-res-where">
                {f.name}
                {h.section ? ` · Step ${n}` : ' · Guide'}
              </span>
              <span className="h-res-title">
                <Mark text={h.section ? h.section.title : h.guide.title} q={q} />
              </span>
              <span className="h-res-snip">
                <Mark text={h.snippet} q={q} />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
