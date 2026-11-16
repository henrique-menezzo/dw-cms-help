import { useEffect } from 'react';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { Fa } from '../components/Icon';
import { PageBar } from '../components/Shell';
import type { Feature as F, Group } from '../data/nav';
import { useStore } from '../store';

/** Any other CMS section. Same page bar, same How to, so the entry point never moves. */
export function Feature({ feature, group }: { feature: F; group: Group }) {
  const setCtx = useStore((s) => s.setCtx);
  useEffect(() => setCtx(feature.slug, null), [feature.slug]);
  return (
    <div className="c-page">
      <PageBar crumbs={[{ label: group.name }, { label: feature.name }]} />
      <section className="ft">
        <div className="ft-head">
          <h1>{feature.name}</h1>
          <button className="mv-add is-sm">Add New</button>
        </div>
        <label className="mv-search">
          <Fa icon={faMagnifyingGlass} size={18} />
          <input placeholder={`Search ${feature.name}`} />
        </label>
        <div className="ft-table" aria-hidden>
          <div className="ft-row is-head">
            <span>Name</span>
            <span>Status</span>
            <span>Updated</span>
            <span>By</span>
          </div>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="ft-row">
              <i style={{ width: `${48 + ((i * 37) % 40)}%` }} />
              <i style={{ width: '56px' }} />
              <i style={{ width: '88px' }} />
              <i style={{ width: '72px' }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
