import { useEffect, useState } from 'react';
export type Route = 'landing' | 'signup' | 'login' | 'dashboard' | 'invoices' | 'inbox' | 'settings';
const parse = (h: string): Route => {
  // הפעלה 164: פרמטרים אחרי ? (למשל #/invoices?f=drift) לא משנים את המסך
  const r = h.replace(/^#\/?/, '').split('?')[0];
  return (['signup', 'login', 'dashboard', 'invoices', 'inbox', 'settings'] as Route[]).includes(r as Route) ? (r as Route) : 'landing';
};
export function useRoute(): Route {
  const [r, setR] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => { setR(parse(location.hash)); window.scrollTo(0, 0); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return r;
}
export const go = (r: Route) => { location.hash = r === 'landing' ? '' : `/${r}`; };
/** פרמטר מה-hash: «#/invoices?f=drift» ⇒ hashParam(h, 'f') === 'drift'. */
export const hashParam = (h: string, k: string): string | null => {
  const q = h.indexOf('?');
  return q < 0 ? null : new URLSearchParams(h.slice(q + 1)).get(k);
};
