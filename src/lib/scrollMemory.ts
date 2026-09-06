/**
 * זיכרון-גלילה (בקשת-בעלים 5.9 "כפתור חוזר שיחזור בדיוק למיקום הקודם ולא לתחילת העמוד"):
 * רשימה→כרטיס→חזרה מחזירה את הגלילה של הרשימה; מעבר בין מסכים (↩ חזרה) מחזיר את גלילת
 * המסך הקודם. הליבה טהורה (מפה בזיכרון); ה-hooks עוטפים window בלבד. הגלילה של האתר
 * היא על ה-window/body (אין מכולה גוללת פנימית).
 */
import { useEffect, useRef } from 'react';

const mem = new Map<string, number>();

export function rememberScroll(key: string, y: number): void {
  mem.set(key, Math.max(0, Math.round(y)));
}
export function recallScroll(key: string): number | undefined {
  return mem.get(key);
}
export function forgetScroll(key: string): void {
  mem.delete(key);
}
/** לבדיקות בלבד. */
export function _resetScrollMemory(): void {
  mem.clear();
}

function restoreTo(y: number): void {
  // שתי מסגרות: הרשימה נטענת (lazy/וירטואלית) ורק אז יש גובה לגלול אליו.
  requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior })));
}

/**
 * רשימה⇄כרטיס: כל עוד אנחנו ברשימה — עוקבים אחרי הגלילה; ברגע שנפתח כרטיס — שומרים
 * את המיקום האחרון (לפני שהדפדפן "מקצץ" אותו כי הכרטיס קצר יותר); בחזרה — משחזרים.
 */
export function useListScrollRestore(key: string, inDetail: boolean): void {
  const lastY = useRef(0);
  const wasDetail = useRef(inDetail);
  useEffect(() => {
    if (inDetail) return;
    const onScroll = () => { lastY.current = window.scrollY; };
    lastY.current = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [inDetail, key]);
  useEffect(() => {
    if (inDetail && !wasDetail.current) rememberScroll(key, lastY.current);
    if (!inDetail && wasDetail.current) {
      const y = recallScroll(key);
      if (y !== undefined) restoreTo(y);
    }
    wasDetail.current = inDetail;
  }, [inDetail, key]);
}

/** מסך⇄מסך (view של ה-store): שומר את גלילת המסך שעוזבים ומשחזר את זו של המסך שחוזרים אליו. */
export function useViewScrollMemory(view: string): void {
  const prev = useRef(view);
  const lastY = useRef(0);
  useEffect(() => {
    const onScroll = () => { lastY.current = window.scrollY; };
    lastY.current = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [view]);
  useEffect(() => {
    if (prev.current !== view) {
      rememberScroll('view:' + prev.current, lastY.current);
      const y = recallScroll('view:' + view);
      restoreTo(y ?? 0);
      prev.current = view;
    }
  }, [view]);
}
