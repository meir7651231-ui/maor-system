/**
 * 📒 פרנסה׳לע — העדפות-הצופה של המקור (עיצוב 1): "אותיות גדולות", "מצב לילה/יום", "צלילים" — **פר-אדם**
 * (כמו הנגישות של אורביט, maor_ui_scale/maor_acc), ו"חיוג מהיר" (★ מועדפים + אחרונים) — **פר-ארגון** (nsLsKey:
 * מזהי-עסקים שייכים לארגון). localStorage בלבד, עטוף try/catch: חלון-פרטי/אחסון חסום ⇒ ברירות-המחדל, בלי שבירה.
 * אף אחד מאלה אינו מידע עסקי — לא נכנס ל-DB, לא לענן ולא לגיבוי (נוחות-צופה, כמו במקור).
 */
import { useCallback, useEffect, useState } from 'react';
import { nsLsKey } from '../../store/persist';

export type PnTheme = 'light' | 'dark';

const K = { theme: 'maor_pn_theme', big: 'maor_pn_big', mute: 'maor_pn_mute', favs: 'maor_pn_favs', recents: 'maor_pn_recents' } as const;

function lsGet(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, v: string | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, v);
  } catch {
    /* אחסון חסום — נוחות בלבד */
  }
}

export function readTheme(): PnTheme | null {
  const v = lsGet(K.theme);
  return v === 'dark' || v === 'light' ? v : null;
}
export function readBig(): boolean {
  return lsGet(K.big) === '1';
}
export function readMute(): boolean {
  return lsGet(K.mute) === '1';
}

/** מזהי-עסקים מאוחסנים (★ / אחרונים) — רשימת-מחרוזות תקינה בלבד, מקוצצת לתקרה. */
function readIds(base: string, cap: number): string[] {
  try {
    const v = JSON.parse(lsGet(nsLsKey(base)) ?? '[]') as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length < 80).slice(0, cap) : [];
  } catch {
    return [];
  }
}

/** ★ מועדפים (≤20) ואחרונים (≤10) — כמו favs/recents במקור. */
export const FAV_CAP = 20;
export const RECENT_CAP = 10;

/** הוספה/הסרה מ-★ (חדש ⇒ בראש) — טהור. */
export function toggledFavs(favs: readonly string[], id: string): string[] {
  return favs.includes(id) ? favs.filter((x) => x !== id) : [id, ...favs].slice(0, FAV_CAP);
}
/** נגיעה באחרונים (בראש, בלי כפילות) — טהור. */
export function touchedRecents(recents: readonly string[], id: string): string[] {
  return [id, ...recents.filter((x) => x !== id)].slice(0, RECENT_CAP);
}

/** מצב-התצוגה של הצופה + מתגים (מתעדכן מיד; נשמר במכשיר). */
export function useSkinPrefs(): {
  theme: PnTheme | null;
  big: boolean;
  mute: boolean;
  setTheme: (t: PnTheme | null) => void;
  setBig: (on: boolean) => void;
  setMute: (on: boolean) => void;
} {
  const [theme, setThemeS] = useState<PnTheme | null>(null);
  const [big, setBigS] = useState(false);
  const [mute, setMuteS] = useState(false);
  // נקרא אחרי העלייה (לא ברינדור) — רינדור-שרת/בדיקות נשארים דטרמיניסטיים
  useEffect(() => {
    setThemeS(readTheme());
    setBigS(readBig());
    setMuteS(readMute());
  }, []);
  const setTheme = useCallback((t: PnTheme | null) => {
    setThemeS(t);
    lsSet(K.theme, t);
  }, []);
  const setBig = useCallback((on: boolean) => {
    setBigS(on);
    lsSet(K.big, on ? '1' : null);
  }, []);
  const setMute = useCallback((on: boolean) => {
    setMuteS(on);
    lsSet(K.mute, on ? '1' : null);
  }, []);
  return { theme, big, mute, setTheme, setBig, setMute };
}

/** ★ + אחרונים של הארגון הנוכחי. */
export function useQuickDial(): { favs: string[]; recents: string[]; toggleFav: (id: string) => boolean; touch: (id: string) => void } {
  const [favs, setFavs] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  useEffect(() => {
    setFavs(readIds(K.favs, FAV_CAP));
    setRecents(readIds(K.recents, RECENT_CAP));
  }, []);
  const toggleFav = useCallback((id: string): boolean => {
    const next = toggledFavs(readIds(K.favs, FAV_CAP), id);
    lsSet(nsLsKey(K.favs), JSON.stringify(next));
    setFavs(next);
    return next.includes(id);
  }, []);
  const touch = useCallback((id: string): void => {
    if (!id) return;
    const next = touchedRecents(readIds(K.recents, RECENT_CAP), id);
    lsSet(nsLsKey(K.recents), JSON.stringify(next));
    setRecents(next);
  }, []);
  return { favs, recents, toggleFav, touch };
}

/** ערכת-המכשיר (prefers-color-scheme) — מנוי חי, לתווית "מצב לילה/מצב יום". */
export function useDeviceDark(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = (): void => setDark(mq.matches);
    on();
    try {
      mq.addEventListener('change', on);
      return () => mq.removeEventListener('change', on);
    } catch {
      return undefined;
    }
  }, []);
  return dark;
}

/** תנועה-מופחתת (prefers-reduced-motion) — מנוי חי. */
export function useReducedMotion(): boolean {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = (): void => setRm(mq.matches);
    on();
    try {
      mq.addEventListener('change', on);
      return () => mq.removeEventListener('change', on);
    } catch {
      return undefined;
    }
  }, []);
  return rm;
}

/** רמזי-השימוש (נגיעה/לחיצה-ארוכה, החלקה) — רק בשלושת הביקורים הראשונים (המקור: ביקור = סשן-דפדפן). */
export function useHintsOff(): boolean {
  const [off, setOff] = useState(false);
  useEffect(() => {
    let n = 0;
    try {
      const seen = sessionStorage.getItem('maor_pn_hv');
      if (!seen) {
        n = (Number(lsGet('maor_pn_hints')) || 0) + 1;
        lsSet('maor_pn_hints', String(n));
        sessionStorage.setItem('maor_pn_hv', String(n));
      } else n = Number(seen) || 0;
    } catch {
      n = 0;
    }
    setOff(n > 3);
  }, []);
  return off;
}
