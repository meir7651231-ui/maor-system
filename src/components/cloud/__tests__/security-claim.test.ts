/**
 * ratchet — טענת-אבטחה אמיתית בעמוד-הכניסה (6.11.2026).
 * 🐛 הפוטר של LoginScreen (האתר החי) הציג "מוצפן מקצה לקצה · הצפנה במנוחה" — אבל
 * ההצפנה המקומית (הגדרות ← הצפנת נתונים) והצפנת-הענן (CloudEncryptionSection) שתיהן
 * opt-in; כברירת-מחדל אין הצפנה ⇒ הטענה לא נכונה. גם פריט-החנות "סנכרון וגיבוי בענן"
 * טען "מוצפנים" כברירת-מחדל. ננעל: ניסוח מדויק, ושום "מקצה לקצה" במשטחים-הציבוריים.
 */
import { describe, expect, it } from 'vitest';
import loginSrc from '../LoginScreen.tsx?raw';
import storeData from '../../../../public/orbit/store/data.json?raw';
import storeHtml from '../../../../public/orbit/store/index.html?raw';

describe('🛡 טענת-אבטחה בעמוד-הכניסה ובחנות', () => {
  it('הפוטר: "שלוש שכבות גיבוי · הצפנה לפי בחירה"', () => {
    expect(loginSrc).toContain('שלוש שכבות גיבוי · הצפנה לפי בחירה');
  });
  it('אין טענת "הצפנה מקצה לקצה" במשטחים הציבוריים (מקצה-לקצה במובן-מוצר — מותר)', () => {
    for (const src of [loginSrc, storeData, storeHtml]) {
      expect(src).not.toMatch(/(מוצפן|מוצפנים|הצפנה|מצפין)[^.",]{0,20}מקצה[ -]לקצה|end-to-end encrypt/i);
    }
    expect(loginSrc).not.toContain('הצפנה במנוחה');
  });
  it('פריט-החנות "סנכרון וגיבוי בענן" לא טוען שהנתונים מוצפנים כברירת-מחדל', () => {
    expect(storeData).not.toContain('מוצפנים ומעודכנים');
    expect(storeData).toContain('בחיבור מאובטח');
  });
});
