import { useEffect, useState } from 'react';

export type Route = { path: string; parts: string[]; q: URLSearchParams };

export function parse(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/content/movies';
  const [path, query = ''] = raw.split('?');
  return { path, parts: path.split('/').filter(Boolean), q: new URLSearchParams(query) };
}

export function useRoute(): Route {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return parse(hash);
}

export function go(to: string) {
  const next = to.startsWith('#') ? to : '#' + to;
  if (location.hash !== next) location.hash = next;
}

/** Change one query param without adding a history entry. */
export function setParam(key: string, value: string | null) {
  const r = parse(location.hash);
  if (value === null) r.q.delete(key);
  else r.q.set(key, value);
  const qs = r.q.toString();
  history.replaceState(null, '', '#' + r.path + (qs ? '?' + qs : ''));
  dispatchEvent(new HashChangeEvent('hashchange'));
}

export const samePath = (to: string) => parse('#' + to).path === parse(location.hash).path;
