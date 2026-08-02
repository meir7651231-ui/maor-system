/**
 * ratchet — אצוות/תפוגה (SHOP10). קליטה מתכלה עם תאריך-תפוגה: פגה/עומדת-לפוג
 * (≤7 ימים) נכנסת ל-needsCare (מונע חלוקת מוצר פג). additive — קליטה בלי
 * תפוגה לא מושפעת. אפס נגיעה בכסף.
 */
import { describe, expect, it } from 'vitest';
import { emptyDb } from '../../../types/domain';
import type { Db } from '../../../types/domain';
import { expiringIntakes, needsCare } from '../lib';
import stockSrc from '../StockModal.tsx?raw';

const TODAY = '2026-08-01';

function db(): Db {
  return {
    ...emptyDb(),
    shopItems: [{ id: 'i1', name: 'חלב', active: true } as Db['shopItems'][number]],
    shopIntakes: [
      { id: 'n1', itemId: 'i1', date: '', qty: 10, kind: 'buy', source: '', cost: 0, note: '', expiry: '2026-07-25' } as Db['shopIntakes'][number], // פג
      { id: 'n2', itemId: 'i1', date: '', qty: 5, kind: 'buy', source: '', cost: 0, note: '', expiry: '2026-08-05' } as Db['shopIntakes'][number], // עומד לפוג (בתוך 7)
      { id: 'n3', itemId: 'i1', date: '', qty: 3, kind: 'buy', source: '', cost: 0, note: '', expiry: '2026-09-30' } as Db['shopIntakes'][number], // רחוק
      { id: 'n4', itemId: 'i1', date: '', qty: 2, kind: 'buy', source: '', cost: 0, note: '' } as Db['shopIntakes'][number], // בלי תפוגה
    ],
  };
}

describe('⏳ ratchet — אצוות/תפוגה (SHOP10)', () => {
  it('expiringIntakes — רק פג/≤7 ימים; ממויין לפי תפוגה', () => {
    const x = expiringIntakes(db(), TODAY);
    expect(x.map((e) => e.intake.id)).toEqual(['n1', 'n2']); // n3 רחוק, n4 בלי תפוגה
    expect(x[0].expired).toBe(true); // n1 פג
    expect(x[1].expired).toBe(false); // n2 עומד לפוג
    expect(x[0].itemName).toBe('חלב');
  });

  it('needsCare כולל פריטי expiring (פג/עומד-לפוג)', () => {
    const care = needsCare(db(), TODAY).filter((c) => c.kind === 'expiring');
    expect(care).toHaveLength(2);
    expect(care.some((c) => c.label.includes('פג תוקף'))).toBe(true);
    expect(care.some((c) => c.label.includes('עומד לפוג'))).toBe(true);
  });

  it('הגנת-מקור: StockModal מעביר expiry (רשות)', () => {
    expect(stockSrc).toContain('setExpiry');
    expect(stockSrc).toMatch(/expiry \? \{ expiry \} : \{\}/);
  });
});
