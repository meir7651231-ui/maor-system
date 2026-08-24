/**
 * ☁️🔐 ratchet — הצפנת-ענן פר-מנהל-ארגון (הכרעת-בעלים 24.8).
 *
 * "הצפנה תשאיר למנהל פלטפורמת-ענן, כל אחד והארגון שלו — רק שיהיה אופציה קיימת":
 * הסעיף היה מגודר isSuperAdmin בלבד ⇒ כל ארגון תלוי בבעלים. עכשיו נפתח גם
 * ל-cloud.isManager (הסשן שלו מנותב לנתיבי-ארגונו; ה-Rules מתירים ל-orgManager
 * לכתוב orgs/{slug}/_enc). עובד/ת רגיל/ה עדיין רואים null.
 */
import { describe, expect, it } from 'vitest';
import secSrc from '../CloudEncryptionSection.tsx?raw';

describe('☁️🔐 cloud-encryption-manager — פתוח למנהל-ארגון', () => {
  it('הגידור-העצמי מתיר מייל-על או מנהל-ארגון; חוסם עובד רגיל', () => {
    expect(secSrc).toContain('const isManager = useApp((s) => s.cloud.isManager)');
    expect(secSrc).toContain('if (!isSuperAdmin(cloudUser?.email) && !isManager) return null;');
  });
  it('לא נשאר הגידור-הישן (מייל-על בלבד)', () => {
    expect(secSrc).not.toContain('if (!isSuperAdmin(cloudUser?.email)) return null;');
  });
});
