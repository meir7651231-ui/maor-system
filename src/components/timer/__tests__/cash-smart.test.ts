/**
 * ratchet — 🛒 הקלדה-חכמה בעגלת-הקופה (17.8, בקשת-בעלים "על מה משלמים —
 * שיהיה הקלדה חכמה, אם זה תשלום על משהו קיים שיציג אותו"). מציע חוגים
 * קיימים (שם+מחיר); בחירה ממלאת שם+סכום. מנוע טהור.
 */
import { describe, expect, it } from 'vitest';
import { cashSuggestions, filterCashSuggest, payerSuggestions } from '../cashLib';
import registerSrc from '../CashRegister.tsx?raw';

describe('🛒 ratchet — הקלדה-חכמה בקופה', () => {
  it('מקורות-ההצעה: חוגים (שם+מחיר), דדופ לפי שם', () => {
    const s = cashSuggestions([
      { name: 'התעמלות', price: 120 },
      { name: 'שחייה', price: 0 },
      { name: 'התעמלות', price: 999 }, // כפול — מסונן
      { name: '', price: 50 }, // ריק — מסונן
    ]);
    expect(s.map((x) => x.name)).toEqual(['התעמלות', 'שחייה']);
    expect(s[0]).toEqual({ name: 'התעמלות', amount: 120, hint: 'חוג' });
    expect(s[1].amount).toBe(0);
  });

  it('סינון רב-מילתי; ריק ⇒ אין הצעות', () => {
    const list = cashSuggestions([{ name: 'חוג אמנות בוקר', price: 80 }, { name: 'ריקוד', price: 90 }]);
    expect(filterCashSuggest(list, '').length).toBe(0);
    expect(filterCashSuggest(list, 'אמנות בוקר').map((x) => x.name)).toEqual(['חוג אמנות בוקר']);
    expect(filterCashSuggest(list, 'בוקר אמנות').length).toBe(1); // לא-תלוי-סדר
    expect(filterCashSuggest(list, 'xyz').length).toBe(0);
  });

  it('🛡 הגנת-מקור: השדה "על מה משלמים" מציע חוג-קיים וממלא שם+מחיר', () => {
    expect(registerSrc).toContain('cashSuggestions(db.courses)');
    expect(registerSrc).toContain('filterCashSuggest(suggestions, itemName)');
    // בחירה ממלאת שם + סכום
    expect(registerSrc).toMatch(/setItemName\(s\.name\);\s*if \(s\.amount > 0\) setItemAmt/);
  });

  it('🧑 "על מי משלמים": מציע משפחות ואז תורמים, דדופ, פרט-זיהוי (עיר/טלפון)', () => {
    const p = payerSuggestions(
      [
        { name: 'משפחת כהן', city: 'ירושלים', phone: '050-1' },
        { name: 'משפחת לוי', phone: '052-2' }, // בלי עיר ⇒ טלפון
        { name: '', city: 'x' }, // ריק — מסונן
      ],
      [
        { name: 'תורם נדיב', city: 'בני-ברק' },
        { name: 'משפחת כהן', city: 'אחר' }, // כפול-שם למשפחה — מסונן
      ],
    );
    expect(p.map((x) => x.name)).toEqual(['משפחת כהן', 'משפחת לוי', 'תורם נדיב']);
    expect(p[0]).toEqual({ name: 'משפחת כהן', hint: 'משפחה', sub: 'ירושלים' });
    expect(p[1].sub).toBe('052-2'); // נפילה לטלפון
    expect(p[2].hint).toBe('תורם');
  });

  it('בני-משפחה: כל ילד/הורה מוצע בשם-פרטי + שם-משפחה, מקובץ תחת המשפחה', () => {
    const p = payerSuggestions([
      {
        name: 'משפחת כהן',
        city: 'ירושלים',
        members: [
          { first: 'יוסי' },
          { first: 'שרה', isParent: true },
          { first: '' }, // ריק — מסונן
        ],
      },
    ]);
    expect(p.map((x) => x.name)).toEqual(['משפחת כהן', 'יוסי משפחת כהן', 'שרה משפחת כהן']);
    expect(p[1]).toEqual({ name: 'יוסי משפחת כהן', hint: 'ילד', sub: 'משפחת כהן' });
    expect(p[2].hint).toBe('הורה'); // isParent
  });

  it('סינון-המשלם רב-מילתי ומשתמש באותו מנוע-סינון גנרי', () => {
    const p = payerSuggestions([{ name: 'משפחת אברהם כהן', city: 'צפת' }]);
    expect(filterCashSuggest(p, '').length).toBe(0);
    expect(filterCashSuggest(p, 'כהן אברהם').map((x) => x.name)).toEqual(['משפחת אברהם כהן']);
    expect(filterCashSuggest(p, 'לוי').length).toBe(0);
  });

  it('🛡 הגנת-מקור: שדה-הלקוח מציע משפחה/תורם וממלא שם-בלבד', () => {
    expect(registerSrc).toContain('payerSuggestions(db.families, db.supporters)');
    expect(registerSrc).toContain('filterCashSuggest(payerSug, client)');
    // בחירה ממלאת את שם-הלקוח בלבד (כלי-ספירה — אפס נגיעה ברשומות)
    expect(registerSrc).toMatch(/setClient\(p\.name\);\s*setSuppressPayer\(true\)/);
  });
});
