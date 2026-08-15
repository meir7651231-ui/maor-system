/**
 * ratchet (הגנת-מקור) — נחיל-עמוק פאזה-0 (14.8): הקשחת platformLeads מפני spam.
 * ה-create הציבורי (בלי חשבון) חייב לתחום את גודל השדות, אחרת מסמך-ענק/הצפת-לידים
 * = וקטור-עלות. rate-limit אמיתי נשאר App Check/function (תשתית-בעלים).
 */
import { describe, expect, it } from 'vitest';
import rules from '../../../firestore.rules?raw';
import cloudSrc from '../cloud.ts?raw';

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

describe('firestore.rules — מסלול-B: אכיפת-ייעוד על אוסף-התרומות (P3)', () => {
  it('אוסף-התרומות מוחרג מקריאת-הגנרי (אחרת ה-OR של Firestore עוקף)', () => {
    expect(rules).toContain("allow read: if (superAdmin() || orgMember(slug)) && col != 'donations'");
  });
  it('מאץ׳ ייעודי לאוסף-התרומות — קריאה פר-pkey', () => {
    expect(rules).toContain('match /orgs/{slug}/donations/{id}');
    expect(rules).toContain('memberSeesPurpose(slug, resource.data.pkey)');
  });
  it('memberSeesPurpose — בלי-הגבלה / משותף / ייעוד-מותר', () => {
    expect(rules).toContain("pkey == '_shared_'");
    expect(rules).toContain('pkey in memberDesignations(slug)');
    expect(rules).toContain('memberDesignations(slug).size() == 0');
  });
  it('הקליינט מסנן את שאילתת-התרומות לעובד/ת מוגבל/ת (Rules דוחים list לא-מסוננת)', () => {
    expect(cloudSrc).toContain("query(donRef, where('pkey', 'in', [...allowedPurposes.slice(0, 29), SHARED_PURPOSE_KEY]))");
  });
});
