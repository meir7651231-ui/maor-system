/**
 * ratchet — מנוע-התמחור (pricing.ts). המנוע טהור: מחשב הצעת-מחיר מטבלת-מחירים
 * נתונה (נתון-בעלים), לא קובע מחיר. בסיס + מודולים-דלוקים-בתשלום + הרחבות,
 * הכל × מכפיל-גודל; הטבת-שנתי = ×10 חודשים.
 */
import { describe, expect, it } from 'vitest';
import { computeQuote, DEFAULT_PRICES, normalizePrices, shekel, type PriceTable } from '../pricing';
import type { ModuleKey } from '../../types/config';

const nameOf = (m: ModuleKey) => m; // בטסט: שם = מפתח

describe('💰 ratchet — מנוע התמחור', () => {
  it('מודול כלול-בבסיס (מחיר 0) נכנס ל-included, לא ל-lines', () => {
    const cfg = { modules: {} }; // הכל דלוק (חסר=דלוק)
    const q = computeQuote(cfg, 'small', DEFAULT_PRICES, nameOf);
    // families/calendar מחירם 0 ⇒ included
    expect(q.included.some((l) => l.key === 'families')).toBe(true);
    expect(q.lines.some((l) => l.key === 'families')).toBe(false);
    // supporters מחירו 100 ⇒ line
    expect(q.lines.some((l) => l.key === 'supporters' && l.price === 100)).toBe(true);
  });

  it('סכום חודשי = (בסיס + מודולים-בתשלום) × מכפיל-גודל, מעוגל', () => {
    const cfg = { modules: { courses: false, diary: false, tzedaka: false, shop: false, shop7: false, reports: false } };
    // דלוקים בתשלום: supporters(100). בסיס 149. small×1 ⇒ 249
    const small = computeQuote(cfg, 'small', DEFAULT_PRICES, nameOf);
    expect(small.monthly).toBe(249);
    // medium ×1.6 ⇒ round(249*1.6)=398
    const medium = computeQuote(cfg, 'medium', DEFAULT_PRICES, nameOf);
    expect(medium.monthly).toBe(Math.round(249 * 1.6));
  });

  it('הרחבות (addons) דלוקות מתווספות לפי prices.integrations', () => {
    const cfg = { modules: { courses: false, diary: false, tzedaka: false, shop: false, shop7: false, reports: false, supporters: false } };
    // רק בסיס 149; מוסיפים הרחבת ai (80) ו-receipts (40)
    const q = computeQuote(cfg, 'small', DEFAULT_PRICES, nameOf, [
      { key: 'ai', label: 'AI' },
      { key: 'receipts', label: 'קבלות' },
    ]);
    expect(q.lines.filter((l) => l.kind === 'integration').length).toBe(2);
    expect(q.monthly).toBe(149 + 80 + 40);
  });

  it('הטבת-שנתי = חודשי × 10 (חודשיים חינם); שנתי-מלא = ×12', () => {
    const q = computeQuote({ modules: {} }, 'small', DEFAULT_PRICES, nameOf);
    expect(q.yearly).toBe(q.monthly * 12);
    expect(q.yearlyDiscounted).toBe(q.monthly * 10);
  });

  it('מצב Enterprise (על הענן שלו) — חד-פעמי + תחזוקה שנתית מטבלת-המחירים', () => {
    const q = computeQuote({ modules: {} }, 'small', DEFAULT_PRICES, nameOf, [], 'enterprise');
    expect(q.mode).toBe('enterprise');
    expect(q.enterpriseOneTime).toBe(DEFAULT_PRICES.enterprise.oneTime);
    expect(q.enterpriseAnnual).toBe(DEFAULT_PRICES.enterprise.annualMaintenance);
    // ברירת-מחדל: 40000 חד-פעמי + 6000 שנתי
    expect(q.enterpriseOneTime).toBe(40000);
    expect(q.enterpriseAnnual).toBe(6000);
  });

  it('normalizePrices: מספרים שליליים/פגומים → ברירת-מחדל', () => {
    const bad = { base: -5, modules: { courses: -1 }, integrations: { ai: 'x' }, sizeMult: { small: 0 }, setup: NaN, enterprise: { oneTime: -1 } } as unknown;
    const p: PriceTable = normalizePrices(bad);
    expect(p.base).toBe(DEFAULT_PRICES.base);
    expect(p.modules.courses).toBe(DEFAULT_PRICES.modules.courses);
    expect(p.integrations.ai).toBe(DEFAULT_PRICES.integrations.ai);
    expect(p.setup).toBe(DEFAULT_PRICES.setup);
    expect(p.enterprise.oneTime).toBe(DEFAULT_PRICES.enterprise.oneTime); // שלילי → ברירת-מחדל
    expect(p.enterprise.annualMaintenance).toBe(DEFAULT_PRICES.enterprise.annualMaintenance); // חסר → ברירת-מחדל
    // sizeMult.small=0 נדחה (0 לא >= ... בעצם 0>=0 תקין) — נבדוק medium החסר → ברירת-מחדל
    expect(p.sizeMult.medium).toBe(DEFAULT_PRICES.sizeMult.medium);
  });

  it('shekel: מעצב ₪ עם מפריד-אלפים', () => {
    expect(shekel(1234)).toBe('₪' + (1234).toLocaleString('he-IL'));
    expect(shekel(149)).toBe('₪149');
  });
});
