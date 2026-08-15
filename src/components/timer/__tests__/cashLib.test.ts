/**
 * ratchet — קופה רושמת גל-1: מנוע פירוט-העודף (החזרת שטרות/מטבעות).
 */
import { describe, expect, it } from 'vitest';
import { CASH_DENOMS, changeBreakdown, denomTint } from '../cashLib';

describe('💵 changeBreakdown — פירוט-עודף חמדני', () => {
  it('סכום 0 / שלילי ⇒ ריק', () => {
    expect(changeBreakdown(0)).toEqual([]);
    expect(changeBreakdown(-5)).toEqual([]);
  });

  it('₪37 = 20 + 10 + 5 + 2', () => {
    expect(changeBreakdown(37)).toEqual([
      { denom: 20, count: 1 },
      { denom: 10, count: 1 },
      { denom: 5, count: 1 },
      { denom: 2, count: 1 },
    ]);
  });

  it('₪263.50 = 200 + 50 + 10 + 2 + 1 + 0.5', () => {
    expect(changeBreakdown(263.5)).toEqual([
      { denom: 200, count: 1 },
      { denom: 50, count: 1 },
      { denom: 10, count: 1 },
      { denom: 2, count: 1 },
      { denom: 1, count: 1 },
      { denom: 0.5, count: 1 },
    ]);
  });

  it('אגורות בלי float-drift: ₪0.30 = 0.1 ×3', () => {
    expect(changeBreakdown(0.3)).toEqual([{ denom: 0.1, count: 3 }]);
  });

  it('הסכום המפורט שווה תמיד לסכום המקורי (עיגול-אגורה)', () => {
    for (const amt of [0.1, 1.7, 37, 88.9, 263.5, 999.9]) {
      const sum = changeBreakdown(amt).reduce((a, x) => a + x.denom * x.count, 0);
      expect(Math.round(sum * 100)).toBe(Math.round(amt * 100));
    }
  });

  it('CASH_DENOMS ממוין מהגדול לקטן (תנאי לחמדנות)', () => {
    for (let i = 1; i < CASH_DENOMS.length; i++) expect(CASH_DENOMS[i]).toBeLessThan(CASH_DENOMS[i - 1]);
  });

  it('denomTint מחזיר צבע לכל ערך (בלי לזרוק)', () => {
    for (const d of CASH_DENOMS) {
      const t = denomTint(d);
      expect(t.bg).toMatch(/^#/);
      expect(t.ink).toMatch(/^#/);
    }
  });
});
