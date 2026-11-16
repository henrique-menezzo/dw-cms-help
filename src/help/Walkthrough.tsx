import { useEffect, useRef, useState } from 'react';
import { faPause, faPlay, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { Fa } from '../components/Icon';

export type Frame = { src: string; caption: string };
export type Chapter = { title: string; frame: number };

const FRAME = 4.2; // seconds per screen
const ORIGINS = ['30% 30%', '70% 35%', '40% 70%', '65% 60%'];
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Stand-in for a screen recording: plays the guide's screenshots with captions.
 * Real guides would drop an MP4 in the same slot.
 */
export function Walkthrough({ frames, chapters, size = 'md', label = 'Walkthrough' }: { frames: Frame[]; chapters?: Chapter[]; size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const dur = frames.length * FRAME;
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000;
      last.current = now;
      setT((v) => {
        const nv = v + dt;
        if (nv >= dur) {
          setPlaying(false);
          return dur;
        }
        return nv;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, dur]);

  const idx = Math.min(frames.length - 1, Math.floor(t / FRAME));
  const p = Math.min(1, (t - idx * FRAME) / FRAME);
  const ended = t >= dur;
  const play = () => {
    if (ended) setT(0);
    setStarted(true);
    setPlaying(true);
  };
  const seek = (s: number) => {
    setT(Math.max(0, Math.min(dur - 0.01, s)));
    setStarted(true);
    setPlaying(true);
  };
  const chapterAt = chapters ? [...chapters].reverse().find((c) => c.frame <= idx) : undefined;

  return (
    <div className={`wt is-${size}`}>
      <div className="wt-stage">
        {frames.map((f, i) => (
          <img
            key={f.src + i}
            src={f.src}
            alt=""
            className={i === idx ? 'is-on' : ''}
            style={i === idx && started ? { transform: `scale(${1.015 + 0.045 * p})`, transformOrigin: ORIGINS[i % 4] } : undefined}
          />
        ))}
        {started && <p className="wt-cap">{frames[idx].caption}</p>}
        {!started && (
          <button className="wt-poster" onClick={play} aria-label={`Play ${label}`}>
            <span className="wt-play">
              <Fa icon={faPlay} size={size === 'sm' ? 16 : 22} />
            </span>
            <span className="wt-poster-label">
              {label} · {fmt(dur)}
            </span>
          </button>
        )}
      </div>
      <div className="wt-bar">
        <button className="wt-btn" onClick={() => (playing ? setPlaying(false) : play())} aria-label={playing ? 'Pause' : 'Play'}>
          <Fa icon={ended ? faRotateRight : playing ? faPause : faPlay} size={13} />
        </button>
        <div
          className="wt-track"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * dur);
          }}
        >
          <div className="wt-fill" style={{ width: `${(t / dur) * 100}%` }} />
          {chapters?.slice(1).map((c) => <i key={c.frame} className="wt-tick" style={{ left: `${((c.frame * FRAME) / dur) * 100}%` }} />)}
        </div>
        <span className="wt-time">
          {fmt(t)} / {fmt(dur)}
        </span>
      </div>
      {chapters && size === 'lg' && (
        <ol className="wt-chapters">
          {chapters.map((c, i) => (
            <li key={c.frame}>
              <button className={chapterAt === c ? 'is-on' : ''} onClick={() => seek(c.frame * FRAME)}>
                <span className="wt-ch-n">{i + 1}</span>
                <span className="wt-ch-t">{c.title}</span>
                <span className="wt-ch-time">{fmt(c.frame * FRAME)}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
