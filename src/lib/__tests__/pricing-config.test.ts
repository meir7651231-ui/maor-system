/**
 * ratchet — מחירון-הפלטפורמה נגזר-קונפיג (מחשבון-הלקוח).
 * המחירים עברו מ-localStorage-של-הבעלים ל-config.prices (נגזר-ארגון, נראה ללקוח),
 * מחוטא ב-normalizeConfig דרך normalizePrices. חסר ⇒ נמחק (ביט-זהה להיום).
 */
import { describe, expect, it } from 'vitest';
import { normalizeConfig } from '../config';
import { DEFAULT_PRICES } from '../pricing';
import calcSrc from '../../components/cloud/PricingModal.tsx?raw';
import loginSrc from '../../components/cloud/LoginScreen.tsx?raw';

const base = { slug: 'x', orgName: 'X', theme: 'or-rishon', modules: {} };

describe('💰 ratchet — מחירון נגזר-קונפיג + מחשבון-הלקוח', () => {
  it('אין prices ⇒ המפתח נמחק (ביט-זהה להיום)', () => {
    const c = normalizeConfig({ ...base }) as { prices?: unknown };
    expect('prices' in c).toBe(false);
  });

  it('prices תקין ⇒ מנורמל ונשמר; מספר שלילי/לא-תקין → ברירת-מחדל', () => {
    const c = normalizeConfig({ ...base, prices: { base: 250, modules: { supporters: -5 }, integrations: { whatsapp: 33 } } }) as {
      prices?: typeof DEFAULT_PRICES;
    };
    expect(c.prices?.base).toBe(250); // נשמר
    expect(c.prices?.modules.supporters).toBe(DEFAULT_PRICES.modules.supporters); // שלילי → ברירת-מחדל
    expect(c.prices?.integrations.whatsapp).toBe(33); // נשמר
    expect(c.prices?.sizeMult.medium).toBe(DEFAULT_PRICES.sizeMult.medium); // חסר → ברירת-מחדל
  });

  it('prices לא-אובייקט ⇒ נמחק', () => {
    expect('prices' in (normalizeConfig({ ...base, prices: 'oops' as never }) as object)).toBe(false);
    expect('prices' in (normalizeConfig({ ...base, prices: [1, 2] as never }) as object)).toBe(false);
  });

  it('🛡 המחשבון = צרכן-דק של המנוע הקיים (אפס לוגיקת-תמחור חדשה)', () => {
    expect(calcSrc).toContain('computeQuote'); // אותו חישוב של הבעלים
    expect(calcSrc).toContain('config.prices ?? DEFAULT_PRICES'); // נגזר-קונפיג
    // רק הרחבות 'live' מוצגות — אי-אפשר "למכור" מה שלא קיים
    expect(calcSrc).toContain("INTEGRATION_STATUS[k] === 'live'");
    // אין ₪ קשיח חדש בקומפוננטה (המחירים מגיעים מהטבלה)
    expect(calcSrc).not.toMatch(/₪\s*\d/);
  });

  it('🔌 הכפתור מחווט במסך-ההרשמה', () => {
    expect(loginSrc).toContain('PricingModal');
    expect(loginSrc).toContain('כמה יעלה לי');
  });
});
