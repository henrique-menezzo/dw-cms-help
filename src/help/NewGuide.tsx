import { useState } from 'react';
import { CmsModal, Hint } from '../components/CmsModal';
import { useAuthored } from '../data/authored';
import { starterGuide, type Start } from '../data/authoring';
import { guideById } from '../data/guides';
import { GROUPS, featureBySlug } from '../data/nav';
import { go } from '../lib/router';

const STARTS: { key: Start; title: string; sub: string }[] = [
  { key: 'outline', title: 'A basic outline', sub: 'Four steps to fill in: open the page, add one, fill in the details, publish.' },
  { key: 'blank', title: 'A blank guide', sub: 'One empty step. Add the rest as you go.' },
  { key: 'paste', title: 'Paste a doc', sub: 'Already written somewhere? Paste it as it is. Steps are optional.' },
];

/** Same window as the CMS's own Create Movie: pick the page, name the guide, choose how to start. */
export function NewGuide({ page, onClose }: { page?: string | null; onClose: () => void }) {
  const saveDraft = useAuthored((s) => s.saveDraft);
  const drafts = useAuthored((s) => s.drafts);
  const [slug, setSlug] = useState(page && featureBySlug(page) ? page : '');
  const [title, setTitle] = useState('');
  const [touched, setTouched] = useState(false);
  const [start, setStart] = useState<Start>('outline');
  const f = slug ? featureBySlug(slug) : undefined;
  const existing = slug ? guideById(slug) : undefined;
  // the library already names every page's guide ("Build a Carousel"), so start from that
  const shownTitle = touched ? title : existing?.title ?? (f ? `Manage ${f.name}` : '');
  const hasGuide = !!existing && !existing.sample;
  const hasDraft = !!drafts[slug];

  const create = () => {
    if (!f) return;
    if (!hasGuide && !hasDraft) saveDraft(starterGuide(f, shownTitle.trim(), start));
    go(`/help/write/${f.slug}`);
  };

  return (
    <CmsModal
      title="New Guide"
      sub="Pick the CMS page this guide is for. The question mark on that page will open it."
      onClose={onClose}
      width={780}
      foot={
        <>
          <button className="cb is-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="cb is-dark" disabled={!f || (!hasGuide && !hasDraft && !shownTitle.trim())} onClick={create}>
            {hasGuide ? 'Edit Guide' : hasDraft ? 'Open Draft' : 'Create Guide'}
          </button>
        </>
      }
    >
      <label className="f-field">
        <span className="f-label">
          CMS page <i>*</i>
        </span>
        <select className="f-input ng-select" value={slug} onChange={(e) => setSlug(e.target.value)} autoFocus={!page}>
          <option value="" disabled>
            Choose a page
          </option>
          {GROUPS.map((g) => (
            <optgroup key={g.id} label={g.name}>
              {g.features.map((x) => {
                const live = guideById(x.slug);
                return (
                  <option key={x.slug} value={x.slug}>
                    {x.name}
                    {live && !live.sample ? '  (has a guide)' : drafts[x.slug] ? '  (draft)' : ''}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>
        {hasGuide ? (
          <Hint>{f?.name} already has a guide. You’ll edit that one, and it stays live until you publish your changes.</Hint>
        ) : hasDraft ? (
          <Hint>There’s already a draft for {f?.name}. You’ll pick up where it was left.</Hint>
        ) : (
          <Hint>One guide per page, so people always know where to look.</Hint>
        )}
      </label>

      {!hasGuide && !hasDraft && (
        <>
          <label className="f-field">
            <span className="f-label">
              Title <i>*</i>
            </span>
            <input
              className="f-input"
              value={shownTitle}
              onChange={(e) => {
                setTouched(true);
                setTitle(e.target.value);
              }}
              placeholder="Manage…"
              autoFocus={!!page}
            />
            <Hint>Say what people will get done, like “Manage Movies.”</Hint>
          </label>

          <div className="f-field">
            <span className="f-label">Start with</span>
            <div className="ng-starts" role="radiogroup">
              {STARTS.map((o) => (
                <button key={o.key} role="radio" aria-checked={start === o.key} className={'ng-start' + (start === o.key ? ' is-on' : '')} onClick={() => setStart(o.key)}>
                  <span className="ng-radio" aria-hidden="true" />
                  <span>
                    <b>{o.title}</b>
                    <span>{o.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </CmsModal>
  );
}
