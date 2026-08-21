/**
 * ratchet · ביקורת-איכות (נחיל 21.8) — נעילת התיקונים שהנחיל חשף.
 * 1) כל מסכי-התורמים משתמשים ב-isoToday() (מקומי) ולא toISOString (UTC) — הבאג
 *    היה off-by-one סמוך-לחצות בישראל, מול הטבלה הראשית. 2) cockpitKpis מעביר
 *    todayIso ל-hokMonthlyTotal (מנכה הו״ק-נדרים שפגה). 3) hit-test בקנבס מבוסס
 *    קואורדינטות-אירוע (תמיכת-מגע).
 */
import { describe, expect, it } from 'vitest';
import cockpitSrc from '../SupportersCockpit.tsx?raw';
import galaxySrc from '../SupportersGalaxy.tsx?raw';
import intelSrc from '../SupportersIntel.tsx?raw';
import kpiSrc from '../SupportersKpiStrip.tsx?raw';
import cardSrc from '../SupporterCard.tsx?raw';
import uniSrc from '../SupportersUniverse3D.tsx?raw';
import cockpitEngineSrc from '../cockpit.ts?raw';

const VIEWS: [string, string][] = [
  ['SupportersCockpit', cockpitSrc], ['SupportersGalaxy', galaxySrc], ['SupportersIntel', intelSrc],
  ['SupportersKpiStrip', kpiSrc], ['SupporterCard', cardSrc], ['SupportersUniverse3D', uniSrc],
];

describe('🛡 ratchet — ביקורת-איכות הנחיל (21.8)', () => {
  it('כל מסכי-התורמים: today דרך isoToday() ולא toISOString (UTC) — עקביות עם הטבלה', () => {
    for (const [name, src] of VIEWS) {
      expect(src, name + ' עדיין משתמש ב-toISOString ל-today (באג UTC)').not.toMatch(/const today = new Date\(\)\.toISOString\(\)/);
      expect(src, name + ' חייב const today = isoToday()').toContain('const today = isoToday()');
    }
  });

  it('cockpitKpis מעביר todayIso ל-hokMonthlyTotal (מנכה הו״ק-נדרים שפגה)', () => {
    expect(cockpitEngineSrc).toContain('hokMonthlyTotal(supporters as Supporter[], rate, todayIso)');
  });

  it('hit-test בקנבס (גלקסיה+יקום) מבוסס קואורדינטות-אירוע-הלחיצה (תמיכת-מגע)', () => {
    for (const src of [galaxySrc, uniSrc]) {
      expect(src).toContain('const onClick = (e: MouseEvent) =>');
      expect(src).toMatch(/const mx = e\.clientX - r\.left, my = e\.clientY - r\.top;/);
    }
  });
});
