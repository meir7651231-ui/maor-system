/**
 * 🔨 נתוני-המד של המפרק (ATOMS-DECOMPOSE, 14.10.2026) — לא קובץ-בדיקה.
 * שני ארגונים: הדמו הציבורי (`public/demo.json`, "עכשיו" = רגע-השמירה שלו) והארגון של המרכזייה + התצוגות
 * (אירוח + פרנסה׳לע, `previewsFixture.richDb`, "עכשיו" = רביעי 14.10.2026 12:00 ישראל).
 */
import demo from '../../../../../public/demo.json';
import type { Db } from '../../../../types/domain';
import { NOW_MS, richDb } from '../../__tests__/previewsFixture';
import type { GenericCtx } from '../genericPreview';

export const DEMO_DB = demo as unknown as Db;
export const DEMO_NOW = Date.parse((demo as { savedAt: string }).savedAt);
export { NOW_MS };

export function meterCtxs(privacyMode = false): GenericCtx[] {
  return [
    { db: DEMO_DB, nowMs: DEMO_NOW, privacyMode },
    { db: richDb(), nowMs: NOW_MS, privacyMode },
  ];
}
