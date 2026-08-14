/**
 * ratchet (הגנת-מקור) — נחיל-עמוק פאזה-0 (14.8): הקשחת platformLeads מפני spam.
 * ה-create הציבורי (בלי חשבון) חייב לתחום את גודל השדות, אחרת מסמך-ענק/הצפת-לידים
 * = וקטור-עלות. rate-limit אמיתי נשאר App Check/function (תשתית-בעלים).
 */
import { describe, expect, it } from 'vitest';
import rules from '../../../firestore.rules?raw';

describe('firestore.rules — platformLeads מוקשח', () => {
  it('שם-קשר ותאריך תחומים בגודל', () => {
    expect(rules).toContain('request.resource.data.contactName.size() <= 100');
    expect(rules).toContain('request.resource.data.phone.size() <= 30');
  });
  it('שדות אופציונליים (notes/preferredTime/at) תחומים בגודל', () => {
    expect(rules).toContain('request.resource.data.notes is string && request.resource.data.notes.size() <= 500');
    expect(rules).toContain('request.resource.data.preferredTime is string && request.resource.data.preferredTime.size() <= 60');
    expect(rules).toContain("request.resource.data.at is string && request.resource.data.at.size() <= 40");
  });
  it('עדיין רק 5 השדות המותרים (hasOnly)', () => {
    expect(rules).toContain("hasOnly(['contactName', 'phone', 'preferredTime', 'notes', 'at'])");
  });
});
