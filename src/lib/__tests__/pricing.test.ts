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
    // supporters מחירו 180 ⇒ line (מחיר-שוק ריאלי)
    expect(q.lines.some((l) => l.key === 'supporters' && l.price === 180)).toBe(true);
  });

  it('סכום חודשי = (בסיס + מודולים-בתשלום) × מכפיל-גודל, מעוגל', () => {
    const cfg = { modules: { courses: false, diary: false, tzedaka: false, shop: false, shop7: false, reports: false } };
    // דלוקים בתשלום: supporters(180). בסיס 290. small×1 ⇒ 470
    const small = computeQuote(cfg, 'small', DEFAULT_PRICES, nameOf);
    expect(small.monthly).toBe(470);
    // medium ×1.6 ⇒ round(470*1.6)=752
    const medium = computeQuote(cfg, 'medium', DEFAULT_PRICES, nameOf);
    expect(medium.monthly).toBe(Math.round(470 * 1.6));
  });

  it('הרחבות (addons) דלוקות מתווספות לפי prices.integrations', () => {
    const cfg = { modules: { courses: false, diary: false, tzedaka: false, shop: false, shop7: false, reports: false, supporters: false } };
    // רק בסיס 290; מוסיפים הרחבת ai (120) ו-receipts (60)
    const q = computeQuote(cfg, 'small', DEFAULT_PRICES, nameOf, [
      { key: 'ai', label: 'AI' },
      { key: 'receipts', label: 'קבלות' },
    ]);
    expect(q.lines.filter((l) => l.kind === 'integration').length).toBe(2);
    expect(q.monthly).toBe(290 + 120 + 60);
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
    // ברירת-מחדל (מחיר-שוק ריאלי): 55000 חד-פעמי + 9000 שנתי
    expect(q.enterpriseOneTime).toBe(55000);
    expect(q.enterpriseAnnual).toBe(9000);
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

/**
 * ratchet — 🌐 "אתר לעסק" ₪40 + מחירון-החנות ≡ מחירון-האשף (7.11.2026, אישור-בעלים).
 * 🐛 בחנות packs[key=site].price=40, אבל באשף-ההרכבה לא הייתה שורה לאתר ⇒ ההצעה מהאשף לא תאמה
 * את מה שהחנות הציגה. ובנוסף: שני המחירונים נפרדים ⇒ נעילת-שוויון לכל 12 החבילות.
 */
import STORE from '../../../public/orbit/store/data.json';
import STORE_HTML from '../../../public/orbit/store/index.html?raw';

describe('🌐 ratchet — אתר לעסק בהצעה + מחירון-החנות ≡ האשף', () => {
  const allOff = { modules: { courses: false, diary: false, tzedaka: false, shop: false, shop7: false, reports: false, supporters: false } };
  it('אתר דלוק (config.site) ⇒ שורת "אתר לעסק" ‎+₪40 בחודשי', () => {
    const without = computeQuote(allOff, 'small', DEFAULT_PRICES, nameOf);
    const withSite = computeQuote({ ...allOff, site: { enabled: true } as never }, 'small', DEFAULT_PRICES, nameOf);
    expect(withSite.lines.find((l) => l.key === 'site')).toEqual({ key: 'site', label: 'אתר לעסק', price: 40, kind: 'integration' });
    expect(withSite.monthly - without.monthly).toBe(40);
  });
  it('בלי אתר / אתר מכובה / הדגל shell.publicsite כבוי ⇒ הצעה ביט-זהה (אין שורה)', () => {
    const base = computeQuote(allOff, 'small', DEFAULT_PRICES, nameOf);
    for (const cfg of [allOff, { ...allOff, site: { enabled: false } as never }, { ...allOff, site: { enabled: true } as never, features: { 'shell.publicsite': false } }]) {
      expect(JSON.stringify(computeQuote(cfg, 'small', DEFAULT_PRICES, nameOf))).toBe(JSON.stringify(base));
    }
  });
  it('טבלת-מחירים שמורה ישנה (בלי site) ⇒ ברירת-המחדל 40', () => {
    expect(normalizePrices({ base: 290 }).site).toBe(40);
    expect(normalizePrices({ site: 55 }).site).toBe(55);
  });
  it('🔒 מחירון-החנות ≡ מחירון-האשף לכל 12 החבילות (שלא יסטו שוב)', () => {
    // מפתח-חבילה בחנות ⇒ איפה המחיר באשף
    const MAP: Record<string, (p: PriceTable) => number | undefined> = {
      donors: (p) => p.modules.supporters,
      payments: (p) => p.integrations.payments,
      receipts: (p) => p.integrations.receipts,
      courses: (p) => p.modules.courses,
      rooms: (p) => p.modules.diary,
      shop: (p) => p.modules.shop,
      dist: (p) => p.modules.shop7,
      phone: (p) => p.integrations.phone,
      msg: (p) => p.integrations.whatsapp,
      site: (p) => p.site,
      reports: (p) => p.modules.reports,
      ai: (p) => p.integrations.ai,
    };
    const packs = STORE.packs as Array<{ key: string; price: number }>;
    expect(packs.map((p) => p.key).sort()).toEqual(Object.keys(MAP).sort()); // חבילה חדשה בחנות ⇒ חייבת מיפוי כאן
    for (const pk of packs) expect(MAP[pk.key](DEFAULT_PRICES), 'חבילה ' + pk.key).toBe(pk.price);
    // גם הבסיס וההקמה בחנות (קבועים ב-index.html) ≡ האשף
    expect(STORE_HTML).toContain(`const BASE = ${DEFAULT_PRICES.base}, SETUP = ${DEFAULT_PRICES.setup};`);
  });
});
