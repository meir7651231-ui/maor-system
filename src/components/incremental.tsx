/**
 * ⚡ רינדור-מדורג לרשימות-ענק (VISION-LIGHT ‏#15, 23.8.2026).
 *
 * הבאג: רשימות התורמים/המשפחות מציירות את **כל** השורות — נמדד 23.7 שניות
 * רינדור ו-57K צמתי-DOM על 3,000 תורמים בטאבלט (CPU ×4). התיקון: מציירים
 * את המסך-הראשון בלבד (INC_CHUNK) וסמן-תצפית (IntersectionObserver) מרחיב
 * את החלון כשגוללים — 600px לפני הסוף, אז הגלילה מרגישה רציפה.
 *
 * חוזה: **הלוגיקה נשארת על הרשימה המלאה** — סינון/מיון/בחירה-מרובה/CSV/
 * סיכומים מחושבים על הרשימה השלמה; רק ה-map של הציור עובר על החלון.
 * ⇒ אפס אובדן-יכולת (ratchet bundle-light).
 *
 * ה-hook מנותק מהרשימה בכוונה (rules-of-hooks: הסינון מחושב בגוף-הרכיב אחרי
 * early-returns): קוראים useIncCap(resetKey) עם המצבים למעלה, וחותכים בציור:
 *   const inc = useIncCap(JSON.stringify([q, filters…, view]));
 *   const shown = incSlice(list, inc.cap);
 *   {shown.map(…)}
 *   <IncMoreRow shown={shown.length} total={list.length} refCb={inc.ref} colSpan={9} />
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/** גודל חלון-הפתיחה והצמיחה — מסך-וחצי של שורות גם בטאבלט גדול. */
export const INC_CHUNK = 120;

export interface IncCap {
  /** כמה שורות מציירים כרגע. */
  cap: number;
  /** ref לסנטינל שבתחתית הרשימה — כשנכנס לתצוגה החלון גדל. */
  ref: (el: Element | null) => void;
}

export function useIncCap(resetKey: string, chunk = INC_CHUNK): IncCap {
  const [cap, setCap] = useState(chunk);
  // שינוי חיפוש/סינון/תצוגה ⇒ החלון חוזר להתחלה — ההקלדה נשארת זולה גם אחרי
  // שגללו פעם עד סוף-הרשימה (אחרת cap ענק היה נגרר לכל רינדור).
  useEffect(() => {
    setCap(chunk);
  }, [resetKey, chunk]);

  const obsRef = useRef<IntersectionObserver | null>(null);
  const ref = useCallback(
    (el: Element | null) => {
      obsRef.current?.disconnect();
      obsRef.current = null;
      if (!el || typeof IntersectionObserver === 'undefined') return;
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) setCap((c) => c + chunk);
        },
        { rootMargin: '600px' },
      );
      io.observe(el);
      obsRef.current = io;
    },
    [chunk],
  );
  useEffect(() => () => obsRef.current?.disconnect(), []);

  return { cap, ref };
}

/** חיתוך-הציור — הרשימה המלאה נשארת אצל ה-caller לכל הלוגיקה. */
export function incSlice<T>(list: readonly T[], cap: number): readonly T[] {
  return list.length <= cap ? list : list.slice(0, cap);
}

/**
 * שורת-סנטינל לטבלה (colSpan רחב). ה-key משתנה עם shown ⇒ האלמנט מתמחזר
 * בכל צמיחה ⇒ observe טרי ⇒ המשך-טעינה גם כשהסנטינל עדיין על המסך.
 */
export function IncMoreRow(props: { shown: number; total: number; refCb: (el: Element | null) => void; colSpan: number }) {
  if (props.shown >= props.total) return null;
  return (
    <tr key={'inc' + props.shown} ref={props.refCb as (el: HTMLTableRowElement | null) => void}>
      <td colSpan={props.colSpan} style={{ textAlign: 'center', color: 'var(--ink-faint)', fontSize: 12, padding: 10 }}>
        ⏳ מוצגות {props.shown} מתוך {props.total} — גללו להמשך
      </td>
    </tr>
  );
}

/** סנטינל לגריד-כרטיסים — תופס שורה מלאה בגריד. */
export function IncMoreCard(props: { shown: number; total: number; refCb: (el: Element | null) => void }) {
  if (props.shown >= props.total) return null;
  return (
    <div
      key={'inc' + props.shown}
      ref={props.refCb as (el: HTMLDivElement | null) => void}
      style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 12, padding: 10 }}
    >
      ⏳ מוצגות {props.shown} מתוך {props.total} — גללו להמשך
    </div>
  );
}
