/**
 * ⚡ מנוי-DB ממוקד (VISION-LIGHT ‏#14, 23.8.2026) — `useApp((s) => s.db)`
 * מתרנדר על **כל** שינוי-DB (גם כתיבת-audit של פעולה במסך אחר), כי אובייקט
 * ה-db מוחלף בכל setDb. ‏useDbWatch מחזיר את אותו db מלא (אפס שינוי בגוף
 * הרכיב — כל ה-`db.x` ממשיכים לעבוד), אבל מתרנדר **רק כשמפתח-צפייה השתנה**.
 *
 * מימוש על useSyncExternalStore של React (בלי zustand/traditional — מושך
 * את use-sync-external-store שאינו מותקן; לקח: נפל רק בדפדפן, ‏71 כשלי-e2e).
 * ‏getSnapshot מחזיר את ה-db-המוטמן כל עוד מפתחות-הצפייה לא השתנו — רפרנס
 * זהה ⇒ React מדלג על הרינדור.
 *
 * ⚠️ החוזה (ננעל ב-ratchet db-watch): רכיב שמשתמש ב-useDbWatch חייב
 * (1) לרשום כל מפתח שהוא קורא (`db.<key>` ⊆ הרשימה) — מפתח חסר = UI-עומד;
 * (2) לא להעביר את `db` השלם הלאה לפונקציה (שקוראת מפתחות לא-נצפים).
 * רכיב שמזין מנוע-שלם (careCounts/calLib) נשאר על המנוי-המלא במכוון.
 */
import { useCallback, useRef, useSyncExternalStore } from 'react';
import { useApp } from './useApp';
import type { Db } from '../types/domain';

export function useDbWatch(...keys: (keyof Db)[]): Db {
  const keysRef = useRef(keys);
  keysRef.current = keys;
  const cache = useRef<Db | null>(null);
  const getSnapshot = useCallback(() => {
    const cur = useApp.getState().db;
    const prev = cache.current;
    if (prev === null || prev === cur) {
      cache.current = cur;
      return cur;
    }
    if (keysRef.current.some((k) => !Object.is(prev[k], cur[k]))) cache.current = cur;
    return cache.current ?? cur;
  }, []);
  const subscribe = useCallback((cb: () => void) => useApp.subscribe(cb), []);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
