import { useEffect, useState } from 'react';
import { faArrowLeft, faArrowRight, faCheck, faGlobe, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { faImage } from '@fortawesome/free-regular-svg-icons';
import { Fa } from '../components/Icon';
import { PageBar } from '../components/Shell';
import { CmsModal, Hint } from '../components/CmsModal';
import { slugify } from '../data/nav';
import { go, setParam, type Route } from '../lib/router';
import { useStore, type Movie } from '../store';

export function StatusChip({ status }: { status: Movie['status'] }) {
  return status === 'published' ? (
    <span className="st is-pub">
      <Fa icon={faCheck} size={12} />
      Published
    </span>
  ) : (
    <span className="st is-draft">
      <Fa icon={faGlobe} size={12} />
      Unpublished
    </span>
  );
}

export function Movies({ route }: { route: Route }) {
  const movies = useStore((s) => s.movies);
  const setCtx = useStore((s) => s.setCtx);
  const creating = route.q.get('new') === '1';
  useEffect(() => setCtx('movies', creating ? 'basics' : 'start'), [creating]);

  return (
    <div className="c-page">
      <PageBar crumbs={[{ label: 'Content' }, { label: 'Movies' }]} />
      <section className="mv">
        <div className="mv-tools">
          <label className="mv-search">
            <Fa icon={faMagnifyingGlass} size={18} />
            <input placeholder="Search" />
          </label>
          <button className="mv-add" data-help="add-movie" onClick={() => setParam('new', '1')}>
            Add New Movie
          </button>
        </div>
        <div className="mv-grid">
          {movies.map((m) => (
            <a key={m.id} className="mv-item" href={`#/content/movies/${m.id}?tab=media`}>
              <div className="mv-thumb">
                {m.thumb || m.images.thumbnail ? (
                  <img src={m.thumb ?? m.images.thumbnail} alt="" />
                ) : (
                  <span className="mv-thumb-empty">
                    <Fa icon={faImage} size={28} />
                  </span>
                )}
                <span className="mv-chip">
                  <StatusChip status={m.status} />
                </span>
              </div>
              <p>{m.title}</p>
            </a>
          ))}
        </div>
        <div className="mv-pager">
          <button>
            <Fa icon={faArrowLeft} size={14} /> Previous
          </button>
          <b>1 of 2</b>
          <button>
            Next <Fa icon={faArrowRight} size={14} />
          </button>
        </div>
      </section>
      {creating && <CreateMovie onClose={() => setParam('new', null)} />}
    </div>
  );
}

function CreateMovie({ onClose }: { onClose: () => void }) {
  const add = useStore((s) => s.addMovie);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const shownSlug = slugTouched ? slug : slugify(title);
  const len = desc.trim().length;

  const save = () => {
    const id = (shownSlug || 'untitled') + '-' + Math.floor(Math.random() * 900 + 100);
    const now = new Date();
    add({
      id,
      title: title.trim(),
      desc: desc.trim(),
      status: 'draft',
      images: {},
      video: 'none',
      access: [],
      cast: [],
      created: `Created: ${now.toISOString().slice(0, 10)}, ${now.toTimeString().slice(0, 5)}`,
      by: 'Henrique Menezzo',
    });
    go(`/content/movies/${id}?tab=media`);
  };

  return (
    <CmsModal
      title="Create Movie"
      sub="Lets get started! Add the basic info for your movie, you can upload videos and set details on the next screen."
      onClose={onClose}
      help={{ guide: 'movies', section: 'basics' }}
      foot={
        <>
          <button className="cb is-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="cb is-dark" disabled={!title.trim()} onClick={save}>
            Save
          </button>
        </>
      }
    >
      <label className="f-field" data-help="create-title">
        <span className="f-label">
          Title <i>*</i>
        </span>
        <input className="f-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a title" autoFocus />
        <Hint>Exactly how it’ll appear on DW+.</Hint>
      </label>
      <label className="f-field">
        <span className="f-label">
          Description
          <span className={'f-count' + (len > 300 ? ' is-over' : len >= 50 ? ' is-ok' : '')}>{len} / 300</span>
        </span>
        <textarea className="f-input is-area" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Add a description" />
        <Hint>A 1–2 sentence teaser, 50 to 300 characters. Short and punchy beats a paragraph.</Hint>
      </label>
      <label className="f-field">
        <span className="f-label">Slug</span>
        <input
          className="f-input"
          value={shownSlug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder="Slug for your movie"
        />
        <Hint>Fills in from the title. Change it only if you have to.</Hint>
      </label>
    </CmsModal>
  );
}
