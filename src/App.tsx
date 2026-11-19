import { useEffect, useRef } from 'react';
import { Shell } from './components/Shell';
import { featureBySlug, groupById } from './data/nav';
import { HelpPanel } from './help/HelpPanel';
import { Lightbox, Spotlight } from './help/Overlays';
import { CommandPalette } from './help/CommandPalette';
import { useRoute } from './lib/router';
import { Feature } from './pages/Feature';
import { GuidePage } from './pages/Guide';
import { GuideEditor } from './pages/GuideEditor';
import { PreviewBar, SpotPicker } from './help/AuthorOverlays';
import { Library } from './pages/Library';
import { MovieDetail } from './pages/MovieDetail';
import { Movies } from './pages/Movies';
import { useStore } from './store';

export function App() {
  const route = useRoute();
  const help = useStore((s) => s.help);
  const [a, b, c] = route.parts;
  const inHelp = a === 'help';
  const lastPath = useRef(route.path);

  // Leaving for the library closes the quick help: the library is the full version of it.
  useEffect(() => {
    if (inHelp) {
      useStore.getState().clearCtx();
      useStore.getState().closeHelp();
    }
  }, [inHelp]);

  useEffect(() => {
    if (lastPath.current !== route.path && !(a === 'help' && b)) window.scrollTo({ top: 0 });
    lastPath.current = route.path;
  }, [route.path]);

  // ?how=<step> opens the help already on that step (handy for sharing a state)
  useEffect(() => {
    const how = route.q.get('how');
    if (!how) return;
    const t = setTimeout(() => useStore.getState().openHelp(undefined, how === 'overview' ? null : how), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const s = useStore.getState();
      if (s.lightbox) return;
      const typing = (e.target as Element | null)?.closest?.('input, textarea, select, [contenteditable]');
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        s.setPalette(!s.palette);
        return;
      }
      if (s.palette) return;
      if (e.key === 'Escape' && s.help.open) {
        s.closeHelp();
        e.stopImmediatePropagation();
      } else if (e.key === '?' && !typing && s.ctx) {
        e.preventDefault();
        s.toggleHelp();
      }
    };
    addEventListener('keydown', on, true);
    return () => removeEventListener('keydown', on, true);
  }, []);

  let page;
  if (inHelp) page = b === 'write' && c ? <GuideEditor route={route} id={c} /> : b ? <GuidePage route={route} id={b} /> : <Library route={route} />;
  else if (a === 'content' && b === 'movies') page = c ? <MovieDetail route={route} id={c} /> : <Movies route={route} />;
  else {
    const g = groupById(a);
    const f = featureBySlug(b);
    page = g && f && f.group === g.id ? <Feature feature={f} group={g} /> : <Movies route={route} />;
  }

  const panel = help.open && !inHelp ? <HelpPanel /> : undefined;
  return (
    <>
      <Shell route={route} panel={panel}>
        {page}
      </Shell>
      <Spotlight />
      <Lightbox />
      <CommandPalette />
      <SpotPicker />
      <PreviewBar />
    </>
  );
}
