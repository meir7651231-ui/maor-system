/**
 * ratchet — "היום" מקומי, לא UTC (swarm-audit 21.8).
 *
 * 🐛 הבאג: שישה רכיבי-תורמים חישבו את "היום" עם new Date().toISOString().slice(0, 10)
 * — זה תאריך **UTC**: בישראל (UTC+2/+3) בין חצות מקומי ל-02:00/03:00 המסך חי
 * ב"אתמול" (הו"ק-להיום, תודות, בסיכון, KPI — כולם מוזזים יום). התיקון: isoToday()
 * מ-lib/date-util (מוסכמת-הפרויקט: "isoToday מ-date-util ולא toISOString").
 *
 * 🐛 באג-אח: שלושת המנועים (intel/portfolio/timemachine) הזיזו תאריכים דרך
 * new Date(ms).toISOString().slice(0, 10) — round-trip דרך UTC. הוחלף ב-shiftIso
 * משותף (חשבון-לוח מקומי, פורמט ידני) ב-intel.ts.
 */
import { describe, expect, it } from 'vitest';
import cardSrc from '../SupporterCard.tsx?raw';
import cockpitSrc from '../SupportersCockpit.tsx?raw';
import galaxySrc from '../SupportersGalaxy.tsx?raw';
import intelViewSrc from '../SupportersIntel.tsx?raw';
import kpiSrc from '../SupportersKpiStrip.tsx?raw';
import universeSrc from '../SupportersUniverse3D.tsx?raw';
import intelSrc from '../intel.ts?raw';
import portfolioSrc from '../portfolio.ts?raw';
import timemachineSrc from '../timemachine.ts?raw';
import { shiftIso } from '../intel';

// הדפוס האסור — כפי שישב בקוד (כולל הרווח של ה-formatter). הערות-התיעוד כותבות
// אותו בלי רווח, כך שהמשמר תופס קוד ולא תיעוד.
const UTC_TODAY = /toISOString\(\)\.slice\(0, 10\)/;

const COMPONENTS: [string, string][] = [
  ['SupporterCard', cardSrc],
  ['SupportersCockpit', cockpitSrc],
  ['SupportersGalaxy', galaxySrc],
  ['SupportersIntel', intelViewSrc],
  ['SupportersKpiStrip', kpiSrc],
  ['SupportersUniverse3D', universeSrc],
];

describe('🛡 ratchet — הרכיבים מחשבים "היום" עם isoToday, לא toISOString (UTC)', () => {
  for (const [name, src] of COMPONENTS) {
    it(name + ': בלי toISOString().slice(0, 10); עם isoToday()', () => {
      expect(src).not.toMatch(UTC_TODAY);
      expect(src).toContain('isoToday()');
    });
  }
});

describe('🛡 ratchet — המנועים מזיזים תאריכים עם shiftIso מקומי, לא round-trip דרך UTC', () => {
  for (const [name, src] of [
    ['intel', intelSrc],
    ['portfolio', portfolioSrc],
    ['timemachine', timemachineSrc],
  ] as const) {
    it(name + '.ts: בלי toISOString().slice(0, 10)', () => {
      expect(src).not.toMatch(UTC_TODAY);
      expect(src).toContain('shiftIso');
    });
  }

  it('shiftIso: חשבון-לוח מקומי נכון — חודש/שנה/מעוברת/אחורה, פורמט מרופד', () => {
    expect(shiftIso('2026-08-21', 0)).toBe('2026-08-21');
    expect(shiftIso('2026-08-21', 30)).toBe('2026-09-20'); // חציית-חודש
    expect(shiftIso('2026-12-25', 10)).toBe('2027-01-04'); // חציית-שנה
    expect(shiftIso('2024-02-28', 1)).toBe('2024-02-29'); // שנה מעוברת
    expect(shiftIso('2026-01-05', -10)).toBe('2025-12-26'); // אחורה
    expect(shiftIso('2026-08-21', 0.6)).toBe('2026-08-22'); // ימים-שבריים (קצב-נתינה) מעוגלים
  });
});
