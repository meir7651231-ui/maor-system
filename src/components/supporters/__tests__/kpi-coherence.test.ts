/**
 * ratchet — קוהרנטיות מונה↔קליק במסכי-התורמים (swarm-audit 21.8).
 *
 * **כלל-הקוהרנטיות:** אריח/צ'יפ קליקי מציג את **אותה אוכלוסייה** שהקליק פותח.
 *
 * 🐛 באג א' — אריח "בסיכון נטישה" (KpiStrip) ו"₪ בסכנה" (Intel) הציגו את
 * portfolio.atRiskCount (churn≥60) אבל הקליק סינן לסגמנט 'atrisk' = cockpitAtRisk
 * (שקט 60+ יום בלי יעד) — אוכלוסייה אחרת ⇒ המספר לא תאם את הרשימה שנפתחה.
 * התיקון: האריחים הקליקיים מונים cockpitAtRisk; atRiskCount נשאר לאנליטיקה.
 *
 * 🐛 באג ב' — צ'יפ "⏳ טרם נרשמו החודש" נמנה לפי hokDue (hokEffectivelyActive —
 * הו"ק-נדרים ששתקה >2 חודשים מוחרגת) אבל המסנן השתמש ב-hok?.active הגולמי ⇒
 * מונה ≠ שורות ≠ אוכלוסיית HokBulkModal. התיקון: המסנן באותו-כלל.
 *
 * 🐛 באג ג' — cockpitKpis ו-KpiStrip קראו hokMonthlyTotal **בלי todayIso** ⇒
 * נפילה ל-hok.active הגולמי: "צפוי מהו״ק" כלל הו"ק-נדרים שפגה שהתור כבר מחריג.
 *
 * 🐛 באג ד' — דגל ה"מסונן" ("N מתוך M" בכותרת) לא כלל hokF/purposeF אף שהם
 * מצמצמים את הרשימה.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';
import kpiSrc from '../SupportersKpiStrip.tsx?raw';
import intelViewSrc from '../SupportersIntel.tsx?raw';
import cockpitEngineSrc from '../cockpit.ts?raw';
import cockpitViewSrc from '../SupportersCockpit.tsx?raw';
import { cockpitKpis } from '../cockpit';
import { hokDue, hokEffectivelyActive, hokMonthlyTotal, hokRecordedThisMonth } from '../lib';
import type { Supporter } from '../../../types/domain';

const TODAY = '2026-08-21';

function sup(id: string, over: Partial<Supporter> = {}): Supporter {
  return {
    id, name: 'תורם ' + id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
  };
}

/** הו"ק מנוהלת-נדרים שפגה: kevaId + חיוב-נדרים אחרון לפני 4 חודשים. */
function lapsedNedarimHok(id: string): Supporter {
  return sup(id, {
    hok: { amount: 100, cur: '₪', day: 5, method: 'card', note: '', active: true, startedAt: '2025-01-05', kevaId: 'k-' + id },
    hist: [{ d: '2026-04-05', a: 100, c: '₪', clearer: 'נדרים' }],
  });
}

/** הו"ק ידנית חיה שטרם נרשמה החודש. */
function liveManualHok(id: string): Supporter {
  return sup(id, {
    hok: { amount: 250, cur: '₪', day: 10, method: 'bank', note: '', active: true, startedAt: '2025-01-10' },
  });
}

describe('🛡 באג א — אריח קליקי מציג את האוכלוסייה שהוא פותח (cockpitAtRisk)', () => {
  it('KpiStrip: האריח הקליקי מונה cockpitAtRisk, לא את portfolio.atRiskCount', () => {
    expect(kpiSrc).toContain('cockpitAtRisk(props.supporters, today).length');
    expect(kpiSrc).toContain('value={String(atRiskClickCount)}');
    expect(kpiSrc).not.toContain('value={String(portfolio.atRiskCount)}');
  });

  it('Intel: המונה על אריח "₪ בסכנה" (קליקי ⇒ atrisk) בא מ-cockpitAtRisk', () => {
    expect(intelViewSrc).toContain('cockpitAtRisk(props.supporters, today).length');
    expect(intelViewSrc).toContain('atRiskClickCount');
    // האנליטיקה הלא-קליקית (₪ בסכנה עצמו) נשארת churn-based — לא מוחקים יכולת
    expect(intelViewSrc).toContain('portfolio.atRiskMoney');
  });

  it('הקוקפיט עצמו כבר קוהרנטי (kpis.atRisk = cockpitAtRisk) — נשאר כך', () => {
    expect(cockpitEngineSrc).toContain('atRisk: cockpitAtRisk(supporters, todayIso).length');
    expect(cockpitViewSrc).toContain('value={String(kpis.atRisk)}');
  });
});

describe("🛡 באג ב — סינון-הו״ק 'due' באותו-כלל כמו הצ'יפ (hokDue)", () => {
  it('המסנן במסך משתמש ב-hokEffectivelyActive + !hokRecordedThisMonth', () => {
    expect(viewSrc).toContain("hokF === 'due' && !(hokEffectivelyActive(sp, today) && !hokRecordedThisMonth(sp, today))");
  });

  it('כלל-המסנן ≡ חברות ב-hokDue — גם על הו"ק-נדרים שפגה', () => {
    const data = [lapsedNedarimHok('lapsed'), liveManualHok('live')];
    const due = new Set(hokDue(data, TODAY).map((s) => s.id));
    for (const sp of data) {
      const filterRule = hokEffectivelyActive(sp, TODAY) && !hokRecordedThisMonth(sp, TODAY);
      expect(filterRule).toBe(due.has(sp.id));
    }
    expect(due.has('live')).toBe(true);
    expect(due.has('lapsed')).toBe(false); // פגה — לא בצ'יפ, לא ברשימה, לא ב-HokBulkModal
  });
});

describe('🛡 באג ג — hokMonthlyTotal מקבל todayIso בכל משטחי-הקוקפיט', () => {
  it('cockpit.ts ו-KpiStrip מעבירים את היום (הו"ק-שפגה מנוכה)', () => {
    expect(cockpitEngineSrc).toContain('hokMonthlyTotal(supporters as Supporter[], rate, todayIso)');
    expect(kpiSrc).toContain('hokMonthlyTotal(props.supporters, rate, today)');
  });

  it('cockpitKpis: הו"ק-נדרים שפגה לא נספרת ב"צפוי מהו״ק" (עקבי עם התור)', () => {
    const data = [lapsedNedarimHok('lapsed'), liveManualHok('live')];
    const kpis = cockpitKpis(data, TODAY);
    expect(kpis.expectedHok).toBe(250); // רק ההו"ק החיה
    // בלי היום (הנפילה הישנה) המספר היה מנופח — זה בדיוק הבאג
    expect(hokMonthlyTotal(data, 3.7)).toBe(350);
  });
});

describe('🛡 באג ד — דגל ה״מסונן״ כולל את כל המסננים שמצמצמים', () => {
  it('hokF ו-purposeF נספרים בכותרת "N מתוך M"', () => {
    expect(viewSrc).toMatch(/const filtered =[\s\S]{0,220}!!hokF/);
    expect(viewSrc).toMatch(/const filtered =[\s\S]{0,220}purposeF !== 'all'/);
  });
});
