/**
 * זיכרון-סינון בין מסכים (בקשת-בעלים 10.9 "שימור גם את הסינון כמו בחזרה, שלא ימחוק את הסינון"):
 * מצב-הסינון/המיון של רשימה (תורמים/משפחות/חוגים) נשמר בזיכרון-הסשן כשהמסך יורד
 * (מעבר ללוח/הגדרות/…) וחוזר כשהמסך עולה — כמו זיכרון-הגלילה (scrollMemory).
 * מכוון: זיכרון-בזיכרון (לא localStorage) — רענון/סשן-חדש = סינון נקי.
 */
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

const mem = new Map<string, unknown>();

/** useState שזוכר את ערכו האחרון לפי מפתח (חוצה-mount). ה-initial משמש רק בפעם הראשונה. */
export function useRemembered<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [v, setV] = useState<T>(() => (mem.has(key) ? (mem.get(key) as T) : typeof initial === 'function' ? (initial as () => T)() : initial));
  useEffect(() => {
    mem.set(key, v);
  }, [key, v]);
  return [v, setV];
}

export function recallFilter<T>(key: string): T | undefined {
  return mem.get(key) as T | undefined;
}

export function _resetFilterMemory(): void {
  mem.clear();
}
