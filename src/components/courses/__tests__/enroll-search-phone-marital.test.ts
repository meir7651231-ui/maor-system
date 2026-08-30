/**
 * 🔎 ratchet — טלפון + מצב-משפחתי בשיבוץ-לחוג (בקשת-בעלים 25.8).
 * שורת-החיפוש בשיבוץ מציגה טלפון (תמיד) ומצב-משפחתי (מגודר families.marital,
 * רגיש בחלק מהענפים), ושניהם נכנסים ל-terms של החיפוש החכם.
 */
import { describe, expect, it } from 'vitest';
import src from '../EnrollModal.tsx?raw';

describe('🔎 enroll-search — טלפון + מצב-משפחתי', () => {
  it('המצב-המשפחתי מגודר families.marital', () => {
    expect(src).toContain("const maritalOn = featureOn(cfg, 'families.marital')");
    expect(src).toContain('const marital = maritalOn ? (fam?.maritalStatus || \'\') : \'\';');
  });
  it('טלפון+מצב-משפחתי נכנסים לחיפוש (terms) ומוצגים בשורה', () => {
    expect(src).toContain("m.idNum, marital].filter(Boolean)");
    expect(src).toContain("o.phone ? '📞 ' + formatIsraeliPhone(o.phone)");
    expect(src).toContain('o.marital');
  });
  it('נפילה לטלפון-המשפחה כשלבן-המשפחה אין משלו', () => {
    expect(src).toContain('const phone = m.phone || fam?.phone');
  });
});
