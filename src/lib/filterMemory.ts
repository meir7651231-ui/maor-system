/**
 * זיכרון-סינון בין מסכים (בקשת-בעלים 10.9 "שימור גם את הסינון כמו בחזרה, שלא ימחוק את הסינון"):
 * מצב-הסינון/המיון של רשימה (תורמים/משפחות/חוגים) נשמר בזיכרון-הסשן כשהמסך יורד
 * (מעבר ללוח/הגדרות/…) וחוזר כשהמסך עולה — כמו זיכרון-הגלילה (scrollMemory).
 * מכוון: זיכרון-בזיכרון (לא localStorage) — רענון/סשן-חדש = סינון נקי.
 */
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { nsLsKey } from '../store/persist';

const mem = new Map<string, unknown>();

/** useState שזוכר את ערכו האחרון לפי מפתח (חוצה-mount). ה-initial משמש רק בפעם הראשונה. */
export function useRemembered<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [v, setV] = useState<T>(() => (mem.has(key) ? (mem.get(key) as T) : typeof initial === 'function' ? (initial as () => T)() : initial));
  useEffect(() => {
    mem.set(key, v);
  }, [key, v]);
  return [v, setV];
}

/**
 * כמו useRemembered — אבל שורד גם רענון-דף (בקשת-בעלים 13.10 על לוח-השנה: "לשמור גם אחרי רענון").
 * localStorage ממורחב-שמות (nsLsKey, פר-ארגון) תחת `maor_keep:<key>`. סדר-עדיפות: זיכרון-סשן → המכשיר → initial.
 * `sanitize` מקבל את הערך-הגולמי מהמכשיר ומחזיר ערך תקין או undefined (ערך פגום/ישן ⇒ initial, לא קריסה).
 * כל גישה ל-storage ב-try/catch (מצב-פרטי/חסום ⇒ מתנהג בדיוק כמו useRemembered).
 */
export function usePersisted<T>(key: string, initial: T | (() => T), sanitize: (raw: unknown) => T | undefined): [T, Dispatch<SetStateAction<T>>] {
  const lsKey = 'maor_keep:' + key;
  const [v, setV] = useState<T>(() => {
    if (mem.has(key)) return mem.get(key) as T;
    try {
      const raw = localStorage.getItem(nsLsKey(lsKey));
      if (raw != null) {
        const ok = sanitize(JSON.parse(raw));
        if (ok !== undefined) return ok;
      }
    } catch { /* פגום/חסום ⇒ initial */ }
    return typeof initial === 'function' ? (initial as () => T)() : initial;
  });
  useEffect(() => {
    mem.set(key, v);
    try {
      localStorage.setItem(nsLsKey(lsKey), JSON.stringify(v));
    } catch { /* מכסה/חסום — נשאר זיכרון-סשן */ }
  }, [key, lsKey, v]);
  return [v, setV];
}

export function recallFilter<T>(key: string): T | undefined {
  return mem.get(key) as T | undefined;
}

export function _resetFilterMemory(): void {
  mem.clear();
}
