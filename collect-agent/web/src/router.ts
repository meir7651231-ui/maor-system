import { useEffect, useState } from 'react';
export type Route = 'landing' | 'signup' | 'dashboard' | 'invoices' | 'inbox' | 'settings';
const parse = (h: string): Route => {
  const r = h.replace(/^#\/?/, '');
  return (['signup', 'dashboard', 'invoices', 'inbox', 'settings'] as Route[]).includes(r as Route) ? (r as Route) : 'landing';
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
