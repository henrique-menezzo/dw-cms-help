import { useEffect, useRef, useState, type ReactNode } from 'react';
import { faCheck, faChevronDown, faChevronRight, faClosedCaptioning, faEllipsisVertical, faPlay, faVideo } from '@fortawesome/free-solid-svg-icons';
import { faCircleQuestion, faImage, faStar, faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { Fa } from '../components/Icon';
import { PageBar } from '../components/Shell';
import { CmsModal, Hint } from '../components/CmsModal';
import { specByKey, specHint, type ImgKey } from '../data/guides';
import { go, setParam, type Route } from '../lib/router';
import { SAMPLE_UPLOADS, isReady, useStore, type Movie } from '../store';
import { StatusChip } from './Movies';
import trailerThumb from '../assets/cms/thumb-am-i-racist.webp';

const TABS: [string, string, string][] = [
  ['media', 'Media', 'media'],
  ['schedule', 'Schedule & Restrictions', 'schedule'],
  ['cast', 'Cast & Hosts', 'cast'],
  ['extras', 'Related Extras', 'extras'],
  ['more', 'More Like This', 'more'],
  ['shop', 'Shop Items', 'shop'],
];

const SLOTS: [ImgKey, string, string][] = [
  ['logo', 'Logo', 'any'],
  ['poster', 'Poster', '9:16'],
  ['thumbnail', 'Thumbnail', '16:9'],
  ['appbg', 'App Background', '3:4'],
  ['ott', 'OTT Background', '3360x2160'],
  ['webbg', 'Web Background', '16:9'],
];
const SLOT_FILE: Record<ImgKey, string> = {
  logo: 'Movie Logo',
  poster: 'Movie Poster',
  thumbnail: 'Movie Thumbnail',
  appbg: 'Movie App Background',
  ott: 'Movie OTT Background',
  webbg: 'Movie Web Background',
};
const TIERS = ['All', 'Free', 'Readers Pass', 'Insider', 'Insider Plus', 'All Access'];

export function MovieDetail({ route, id }: { route: Route; id: string }) {
  const movie = useStore((s) => s.movies.find((m) => m.id === id));
  const update = useStore((s) => s.updateMovie);
  const setCtx = useStore((s) => s.setCtx);
  const tab = route.q.get('tab') ?? 'media';
  const [videoOpen, setVideoOpen] = useState(false);
  useEffect(() => setCtx('movies', TABS.find((t) => t[0] === tab)?.[2] ?? 'details'), [tab]);
  if (!movie) {
    go('/content/movies');
    return null;
  }
  const r = isReady(movie);
  const allReady = r.desc && r.images === 6 && r.video && r.access;
  const set = (patch: Partial<Movie>) => update(movie.id, patch);

  return (
    <div className="c-page">
      <PageBar crumbs={[{ label: 'Content' }, { label: 'Movies', to: '/content/movies' }, { label: movie.title }]} />
      <section className="md">
        <header className="md-head">
          <div className="md-art">{movie.images.thumbnail ? <img src={movie.images.thumbnail} alt="" /> : <Fa icon={faImage} size={22} />}</div>
          <div className="md-title">
            <StatusChip status={movie.status} />
            <h1>{movie.title}</h1>
            <p className="md-meta">
              <Fa icon={faStar} size={14} /> {movie.created} | By {movie.by}
            </p>
          </div>
          <div className="md-publish" data-help="publish">
            {movie.status === 'draft' && <Readiness movie={movie} />}
            {movie.status === 'draft' ? (
              <button className="cb is-dark md-pub" disabled={!allReady} onClick={() => set({ status: 'published' })}>
                Publish Now
              </button>
            ) : (
              <button className="cb is-outline md-pub" onClick={() => set({ status: 'draft' })}>
                Unpublish
              </button>
            )}
          </div>
        </header>
        <div className="md-grid">
          <div className="md-left">
            <div className="md-card" data-help="details-card">
              <div className="md-card-head">
                <div>
                  <h3>Movie Details</h3>
                  <p>View and update the main info for this movie</p>
                </div>
                <button className="cb is-outline is-sm">Edit</button>
              </div>
              <div className="md-fields">
                <div>
                  <h5>Title</h5>
                  <p>{movie.title}</p>
                </div>
                <div>
                  <h5>Primary Host</h5>
                  <p>{movie.host ?? '-'}</p>
                </div>
              </div>
              <div className="md-field">
                <h5>Description</h5>
                <p>{movie.desc || '-'}</p>
              </div>
              <div className="md-field">
                <h5>URL</h5>
                <p>https://www.dailywire.com/videos/{movie.id}</p>
              </div>
            </div>
            <div className="md-card" data-help="membership">
              <h3>Membership Access</h3>
              <p className="md-card-sub">Select one or more membership levels, or choose “All” to make it available to everyone.</p>
              <div className="md-checks">
                {TIERS.map((t) => (
                  <label key={t} className="md-check">
                    <input
                      type="checkbox"
                      checked={movie.access.includes(t)}
                      onChange={(e) => set({ access: e.target.checked ? [...movie.access, t] : movie.access.filter((x) => x !== t) })}
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <button className="md-delete">
              <Fa icon={faTrashCan} size={16} />
              Delete
            </button>
          </div>
          <div className="md-right">
            <nav className="md-tabs" data-help="movie-tabs">
              {TABS.map(([k, label]) => (
                <button key={k} className={k === tab ? 'is-on' : ''} onClick={() => setParam('tab', k)}>
                  {label}
                </button>
              ))}
            </nav>
            <div data-help="tab-panel">
              {tab === 'media' && <MediaTab movie={movie} set={set} onVideo={() => setVideoOpen(true)} />}
              {tab === 'schedule' && <ScheduleTab ready={r.images === 6 && r.video} />}
              {tab === 'cast' && <CastTab movie={movie} set={set} />}
              {tab === 'extras' && <ExtrasTab />}
              {tab === 'more' && <SimpleTab title="More Like This" sub="Manage content that is similar to this movie." button="Add New" />}
              {tab === 'shop' && <SimpleTab title="Shop Items" sub="Connect shop items related to this movie so they can be featured alongside its content." button="Add Item" />}
            </div>
          </div>
        </div>
      </section>
      {videoOpen && (
        <VideoUpload
          onClose={() => setVideoOpen(false)}
          onDone={() => {
            set({ video: 'ready' });
            setVideoOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Card({ title, sub, action, children, help }: { title: string; sub: string; action?: ReactNode; children?: ReactNode; help?: string }) {
  return (
    <div className="md-card" data-help={help}>
      <div className="md-card-head">
        <div>
          <h3>{title}</h3>
          <p>{sub}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function MediaTab({ movie, set, onVideo }: { movie: Movie; set: (p: Partial<Movie>) => void; onVideo: () => void }) {
  const openHelp = useStore((s) => s.openHelp);
  return (
    <>
      <Card
        title="Images"
        sub="Upload images for each media size of this movie."
        help="images"
        action={
          <button className="md-specs" onClick={() => openHelp('movies', 'media')}>
            <Fa icon={faCircleQuestion} size={14} />
            Image specs
          </button>
        }
      >
        <div className="md-slots">
          {SLOTS.map(([k, name, ratio]) => {
            const src = movie.images[k];
            const h = specHint(specByKey(k));
            return (
              <div key={k} className="md-slot">
                <p className="md-slot-label">
                  <span>
                    {name} <i>*</i>
                  </span>
                  <span>{ratio}</span>
                </p>
                {src ? (
                  <div className="md-slot-box is-filled">
                    <img src={src} alt="" />
                    <button className="md-kebab" onClick={() => set({ images: { ...movie.images, [k]: undefined } })} aria-label={`Remove ${name}`}>
                      <Fa icon={faEllipsisVertical} size={16} />
                    </button>
                  </div>
                ) : (
                  <button className="md-slot-box is-empty" onClick={() => set({ images: { ...movie.images, [k]: SAMPLE_UPLOADS[k] } })} aria-label={`Upload ${name}`}>
                    <Fa icon={faImage} size={22} />
                  </button>
                )}
                {src && (
                  <p className="md-slot-file">
                    {movie.title} | {SLOT_FILE[k]}
                  </p>
                )}
                <Hint>
                  {h.line}
                  {h.note && <span className="f-hint-2">{h.note}</span>}
                </Hint>
              </div>
            );
          })}
        </div>
      </Card>
      <Card title="Movie Video" sub="Upload video file for the movie." help="video">
        {movie.video === 'ready' ? (
          <div className="md-video is-ready">
            <div className="md-video-art">
              <img src={SAMPLE_UPLOADS.ott} alt="" />
              <span>
                <Fa icon={faPlay} size={16} />
              </span>
            </div>
            <div>
              <p className="md-video-name">movie_widescreen_4k.mp4</p>
              <p className="md-video-meta">Ready · Signed · Subtitles: English (.vtt)</p>
            </div>
          </div>
        ) : (
          <>
            <button className="md-video is-empty" onClick={onVideo} aria-label="Upload movie video">
              <Fa icon={faVideo} size={22} />
            </button>
            <Hint>16:9, 4K or HD, MP4. Have a .vtt file ready for subtitles.</Hint>
          </>
        )}
      </Card>
    </>
  );
}

function Switch({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button className={'sw' + (on ? ' is-on' : '')} role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)}>
      <i />
    </button>
  );
}

function ScheduleTab({ ready }: { ready: boolean }) {
  const [sched, setSched] = useState(false);
  const [rating, setRating] = useState(true);
  const [pick, setPick] = useState('');
  return (
    <>
      <div className="md-card" data-help="schedule">
        <div className="md-card-head">
          <div>
            <h3>Schedule</h3>
            <p>Choose a date and time to publish this movie automatically.</p>
            {!ready && <Hint>Upload every image and the movie video first. Scheduling needs them.</Hint>}
          </div>
          <Switch on={sched && ready} onChange={setSched} disabled={!ready} />
        </div>
        {sched && ready && (
          <div className="md-sched">
            <input type="datetime-local" className="f-input" defaultValue="2026-11-20T20:00" />
            <Hint>Perfect for premieres. The movie goes live on its own at this time.</Hint>
          </div>
        )}
      </div>
      <div className="md-card">
        <div className="md-card-head">
          <div>
            <h3>Media Rating</h3>
            <p>Select the age rating to inform viewers about the movie content.</p>
          </div>
          <Switch on={rating} onChange={setRating} />
        </div>
        {rating && (
          <>
            <div className="md-radios">
              {['TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA', 'G', 'PG', 'PG-13', 'R'].map((x) => (
                <label key={x}>
                  <input type="radio" name="rating" checked={pick === x} onChange={() => setPick(x)} />
                  {x}
                </label>
              ))}
            </div>
            <Hint>{pick === 'TV-MA' ? 'TV-MA shows an age gate before playback.' : 'TV-MA adds an age gate before playback.'}</Hint>
          </>
        )}
      </div>
      <Card title="Location Restrictions" sub="Select the countries where this movie can be viewed." action={<button className="cb is-black is-sm">Add Countries</button>}>
        <Hint>Restrict by continent or by country.</Hint>
      </Card>
    </>
  );
}

function CastTab({ movie, set }: { movie: Movie; set: (p: Partial<Movie>) => void }) {
  const hasDirector = movie.cast.some((c) => c.name === 'Justin Folk');
  return (
    <>
      <Card
        title="Cast & Crew"
        sub="Add the people involved in this movie and define their roles on screen."
        action={
          <button className="cb is-black is-sm" onClick={() => !hasDirector && set({ cast: [...movie.cast, { name: 'Justin Folk', role: 'Director' }] })}>
            Add Cast
          </button>
        }
      >
        {movie.cast.length > 0 && (
          <div className="md-people">
            {movie.cast.map((c) => (
              <Person key={c.name} name={c.name} role={c.role} />
            ))}
          </div>
        )}
      </Card>
      <Card
        title="Hosts"
        sub="Add the primary and secondary hosts involved in this movie."
        action={
          <button className="cb is-black is-sm" onClick={() => !movie.host && set({ host: 'Matt Walsh' })}>
            Add Host
          </button>
        }
      >
        {movie.host && (
          <div className="md-people">
            <Person name={movie.host} role="Primary Host" />
          </div>
        )}
      </Card>
    </>
  );
}

function Person({ name, role }: { name: string; role: string }) {
  return (
    <div className="md-person">
      <span className="md-person-img">
        {name
          .split(' ')
          .map((w) => w[0])
          .join('')}
      </span>
      <b>{name}</b>
      <span>{role}</span>
    </div>
  );
}

function ExtrasTab() {
  const [added, setAdded] = useState(false);
  return (
    <Card
      title="Extras"
      sub="Link existing extras to this movie and choose which one will appear as the main trailer"
      action={
        <button className="cb is-black is-sm" onClick={() => setAdded(true)}>
          Add Extra
        </button>
      }
    >
      <Hint>The one marked Main Trailer shows up first on DW+.</Hint>
      {added && (
        <div className="md-extra">
          <img src={trailerThumb} alt="" />
          <b>Am I Racist? | Official Trailer</b>
          <span>Primary Trailer</span>
        </div>
      )}
    </Card>
  );
}

function SimpleTab({ title, sub, button }: { title: string; sub: string; button: string }) {
  return <Card title={title} sub={sub} action={<button className="cb is-black is-sm">{button}</button>} />;
}

/* ---------- publish checklist: the guide's "won't pass QA" rule, shown where you publish ---------- */
function Readiness({ movie }: { movie: Movie }) {
  const goThere = useStore((s) => s.goThere);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const on = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    addEventListener('mousedown', on);
    return () => removeEventListener('mousedown', on);
  }, [open]);
  const r = isReady(movie);
  const base = `/content/movies/${movie.id}?tab=media`;
  const items = [
    { label: 'Description', done: r.desc, detail: r.desc ? 'Added' : 'Add a 1–2 sentence teaser', target: 'details-card', section: 'basics' },
    { label: 'Images', done: r.images === 6, detail: `${r.images} of 6 uploaded`, target: 'images', section: 'media' },
    { label: 'Movie video', done: r.video, detail: r.video ? 'Ready' : 'Not uploaded yet', target: 'video', section: 'media' },
    { label: 'Membership access', done: r.access, detail: r.access ? movie.access.join(', ') : 'Pick who can watch', target: 'membership', section: 'access' },
  ];
  const left = items.filter((i) => !i.done).length;
  return (
    <div className="rd" ref={ref}>
      <button className={'rd-btn' + (left ? '' : ' is-ready')} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="rd-ring" style={{ ['--p' as string]: (items.length - left) / items.length }} />
        {left ? `${left} left before publishing` : 'Ready to publish'}
        <Fa icon={faChevronDown} size={10} />
      </button>
      {open && (
        <div className="rd-pop">
          <p className="rd-pop-t">Before you publish</p>
          <ul>
            {items.map((i) => (
              <li key={i.label}>
                <button
                  onClick={() => {
                    setOpen(false);
                    goThere({ to: base, target: i.target }, 'movies', i.section);
                  }}
                >
                  <span className={'rd-check' + (i.done ? ' is-done' : '')}>{i.done && <Fa icon={faCheck} size={10} />}</span>
                  <span className="rd-item">
                    <b>{i.label}</b>
                    <span>{i.detail}</span>
                  </span>
                  {!i.done && <Fa icon={faChevronRight} size={10} className="rd-go" />}
                </button>
              </li>
            ))}
          </ul>
          <p className="rd-pop-f">From the Movies guide. Missing artwork won’t pass QA.</p>
        </div>
      )}
    </div>
  );
}

/* ---------- Upload Primary Video, with the guide's notes next to each option ---------- */
function VideoUpload({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [opts, setOpts] = useState({ audio: false, video: false, subs: false });
  const [policy, setPolicy] = useState<'signed' | 'drm'>('signed');
  const [up, setUp] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');
  const [pct, setPct] = useState(0);
  const [vtt, setVtt] = useState(false);

  useEffect(() => {
    if (up !== 'uploading') return;
    const t = setInterval(() => setPct((p) => (p >= 100 ? 100 : p + 7)), 90);
    return () => clearInterval(t);
  }, [up]);
  useEffect(() => {
    if (pct >= 100 && up === 'uploading') {
      setUp('processing');
      setTimeout(() => setUp('done'), 1100);
    }
  }, [pct, up]);

  const steps = ['Add Info', 'Upload Video', 'Add Subtitles'];
  return (
    <CmsModal
      title="Upload Primary Video"
      sub="Upload a video and set its details"
      onClose={onClose}
      help={{ guide: 'movies', section: 'media' }}
      width={900}
      foot={
        <>
          <button className="cb is-outline" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < 3 ? (
            <button className="cb is-outline" disabled={step === 2 && up !== 'done'} onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button className="cb is-dark" onClick={onDone}>
              Finish
            </button>
          )}
        </>
      }
    >
      <ol className="vu-steps">
        {steps.map((s, i) => (
          <li key={s} className={i + 1 === step ? 'is-on' : i + 1 < step ? 'is-done' : ''}>
            <span>{i + 1 < step ? <Fa icon={faCheck} size={9} /> : i + 1}</span>
            {s}
            {i < 2 && <Fa icon={faChevronRight} size={10} className="vu-sep" />}
          </li>
        ))}
      </ol>
      {step === 1 && (
        <>
          <div className="f-field">
            <span className="f-label">
              Select Media Size <i>*</i>
            </span>
            <div className="f-input vu-select">
              <span className="vu-tag">Movie Widescreen ×</span>
              <Fa icon={faChevronDown} size={14} />
            </div>
            <Hint>Movie Widescreen is the default for movies.</Hint>
          </div>
          {(
            [
              ['audio', 'Generate audio static rendition:', 'Rarely needed for movies.'],
              ['video', 'Generate video static rendition (for downloads)', 'Turn on to let members download the movie for offline viewing.'],
              ['subs', 'Auto generate subtitles', 'Use it when you don’t have a custom .vtt file.'],
            ] as const
          ).map(([k, label, hint]) => (
            <div key={k} className="vu-opt">
              <div>
                <b>{label}</b>
                <Hint>{hint}</Hint>
              </div>
              <Switch on={opts[k]} onChange={(v) => setOpts({ ...opts, [k]: v })} />
            </div>
          ))}
          <div className="f-field">
            <span className="f-label">Playback Policy</span>
            <div className="md-radios">
              <label>
                <input type="radio" checked={policy === 'signed'} onChange={() => setPolicy('signed')} /> Signed
              </label>
              <label>
                <input type="radio" checked={policy === 'drm'} onChange={() => setPolicy('drm')} /> DRM
              </label>
            </div>
            <Hint>Signed is the standard. Use DRM for studio-licensed content.</Hint>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <button className={'vu-drop' + (up !== 'idle' ? ' is-busy' : '')} onClick={() => up === 'idle' && setUp('uploading')} disabled={up !== 'idle'}>
            {up === 'idle' && (
              <>
                <Fa icon={faVideo} size={24} />
                <b>Drop the video here or click to browse</b>
                <span>16:9, 4K or HD, MP4</span>
              </>
            )}
            {up !== 'idle' && (
              <>
                <b>movie_widescreen_4k.mp4</b>
                <span className="vu-bar">
                  <i style={{ width: `${up === 'uploading' ? pct : 100}%` }} />
                </span>
                <span>{up === 'uploading' ? `Uploading… ${Math.min(pct, 100)}%` : up === 'processing' ? 'Processing…' : 'Uploaded and processed'}</span>
              </>
            )}
          </button>
          <div className="f-field">
            <span className="f-label">Media Rating (optional)</span>
            <div className="f-input vu-select">
              <span>Select a rating</span>
              <Fa icon={faChevronDown} size={14} />
            </div>
            <Hint>TV-MA shows an age gate before playback.</Hint>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <button className={'vu-drop' + (vtt ? ' is-busy' : '')} onClick={() => setVtt(true)}>
            {vtt ? (
              <>
                <b>captions_en.vtt</b>
                <span>English · added</span>
              </>
            ) : (
              <>
                <Fa icon={faClosedCaptioning} size={24} />
                <b>Upload a .vtt captions file</b>
                <span>Optional. Skip it if you turned on auto subtitles.</span>
              </>
            )}
          </button>
        </>
      )}
    </CmsModal>
  );
}
