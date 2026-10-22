/**
 * 🔐 ראוּת-ייעוד לקופות (22.10) — ה-db שכל מסכי-הקופות קוראים: לעובד/ת שהמנהל הגביל/ה לייעודים
 * (cloud.allowedDesignations, אותה רשימה כמו התורמים) — רק קופות בייעוד, הרכזים שלהן והאירועים שלהן.
 * מנהל/בעלים/עבודה-מקומית ⇒ ה-db כמו-שהוא. הגבלה ברמת-הממשק (כמו visibleSupportersForDesignations).
 */
import { useMemo } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import type { Db } from '../../types/domain';
import { visibleTzForDesignations } from './lib';

/** רשימת-הייעודים המגבילה את הקופות, או null (בלי הגבלה). */
export function useTzDesigLimit(): string[] | null {
  const config = useApp((s) => s.config);
  const allowed = useApp((s) => s.cloud.allowedDesignations ?? null);
  return featureOn(config, 'supporters.purpose') && featureOn(config, 'tzedaka.designation') ? allowed : null;
}

/** db נתון ⇒ אותו db עם מערכי-הקופות המסוננים לייעוד (ממומאז). */
export function useTzVisible(db: Db): Db {
  const limit = useTzDesigLimit();
  return useMemo(() => (limit ? { ...db, ...visibleTzForDesignations(db, limit) } : db), [db, limit]);
}

/** ה-db המלא של ה-store, מסונן לייעוד. */
export function useTzDb(): Db {
  return useTzVisible(useApp((s) => s.db));
}
