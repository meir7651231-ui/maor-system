/**
 * ratchet — 🛒 הקלדה-חכמה בעגלת-הקופה (17.8, בקשת-בעלים "על מה משלמים —
 * שיהיה הקלדה חכמה, אם זה תשלום על משהו קיים שיציג אותו"). מציע חוגים
 * קיימים (שם+מחיר); בחירה ממלאת שם+סכום. מנוע טהור.
 */
import { describe, expect, it } from 'vitest';
import { cashSuggestions, filterCashSuggest } from '../cashLib';
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
});
