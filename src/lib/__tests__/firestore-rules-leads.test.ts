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
    expect(rules).toContain("!(col in ['donations', 'supporters', 'events', 'auditlog', 'incomingPayments', 'smsOutbox', 'mailOutbox'])");
  });
  it('מאץ׳ ייעודי לאוסף-התרומות — קריאה פר-pkey · עדכון/מחיקה=מנהל בלבד', () => {
    expect(rules).toContain('match /orgs/{slug}/donations/{id}');
    expect(rules).toContain("memberSeesPurpose(slug, resource.data.get('pkey', '_shared_'))");
    // לולאת-האמון 8 (24.8) מחליפה את אכיפת-canWriteKeyed בהגנת-קבלות מלאה:
    // חבר-מוגבל יכול היה לעדכן/למחוק קבלת-§46 בייעוד-שלו. עכשיו עדכון/מחיקה =
    // מנהל/מייל-על בלבד (סימטרי ל-create). red-team 63/63 מאמת מול אמולטור.
    const donBlock = rules.slice(rules.indexOf('match /orgs/{slug}/donations/{id}'));
    const block = donBlock.slice(0, donBlock.indexOf('}'));
    expect(block).toContain('allow update: if superAdmin() || orgManager(slug);');
    expect(block).toContain('allow delete: if superAdmin() || orgManager(slug);');
    expect(block).not.toContain('canWriteKeyed');
    expect(block).not.toContain('allow update: if canWriteKeyed');
  });
  it('memberSeesPurpose — בלי-הגבלה / משותף / ייעוד-מותר', () => {
    expect(rules).toContain("pkey == '_shared_'");
    expect(rules).toContain('pkey in memberDesignations(slug)');
    expect(rules).toContain('memberDesignations(slug).size() == 0');
  });
  it('הקליינט מסנן את שאילתת-התרומות לעובד/ת מוגבל/ת (Rules דוחים list לא-מסוננת)', () => {
    // נחיל 16.8 (#17): אותו חיטוי כמו התומכים — donAllowedKeys (dedup/trim/cap29+shared),
    // סימטרי ל-supAllowedKeys; לא slice-inline (שלא ניקה כפולים/רווחים).
    expect(cloudSrc).toContain("query(donRef, where('pkey', 'in', donAllowedKeys(allowedPurposes)))");
  });
});

describe('מסלול-B P4 — מיגרציה (הגנת-מקור)', () => {
  it('migrateDonationsToCollection מפרק הכל (prev ריק) ואינו נוגע ב-donationSeq', () => {
    expect(cloudSrc).toContain('export async function migrateDonationsToCollection');
    expect(cloudSrc).toContain('donationPartitionDiff([], supporters)');
    // הפונקציה לא מזכירה donationSeq בכלל (רצף §46 לא נגע)
    const fn = cloudSrc.slice(cloudSrc.indexOf('export async function migrateDonationsToCollection'));
    expect(fn.slice(0, fn.indexOf('}')).includes('donationSeq')).toBe(false);
  });
});
