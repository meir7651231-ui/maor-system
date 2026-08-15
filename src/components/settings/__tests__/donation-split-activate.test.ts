/**
 * ratchet — מסלול-B פאזה-5: הדלקת-פיצול-התרומות בקליק (חלון-בעלים).
 * הבעלים לא עורך Firestore ידנית — כפתור בהגדרות←אבטחה כותב `donationSplit:true`
 * לקונפיג-הענן (merge, בלי לדרוס שדות-אחים) + מפעיל את שכבת-הסנכרון מיד.
 *
 * האינווריאנטים:
 * 1. פעולת-ה-store `enableDonationSplit` כותבת `{ config: { donationSplit: true } }`
 *    דרך writeOrgCloudDoc (merge-עומק) — לא writeOrgCloudConfig שדורס את כל הקונפיג.
 * 2. שער-בטיחות: אתר-השורש (cloudRoot) ואתר-default נחסמים (פטורים מהפיצול).
 * 3. תוקף-מיידי: setDonationSplit(true) נקרא אחרי הכתיבה, וגם ב-applyCloudDoc החי
 *    (donationSplitOn(eff)) ⇒ הדלקה אצל הבעלים מגיעה לצד-הדוחף בלי רענון.
 * 4. הרכיב מחווט את הכפתור ל-enableDonationSplit ומגודר מייל-על (isSuperAdmin).
 */
import { describe, expect, it } from 'vitest';
import storeSrc from '../../../store/useApp.ts?raw';
import secSrc from '../DonationSplitSection.tsx?raw';
import wizSrc from '../../builder/BuilderWizard.tsx?raw';

describe('🔀 ratchet — הדלקת-פיצול בקליק (מסלול-B פאזה-5)', () => {
  it('enableDonationSplit — כתיבת-merge של donationSplit:true בלבד (לא דריסת-קונפיג)', () => {
    const m = storeSrc.match(/async enableDonationSplit\(\)[\s\S]*?\n {4}\},/);
    expect(m).toBeTruthy();
    const body = m![0];
    expect(body).toContain("writeOrgCloudDoc(slug, { config: { donationSplit: true } })");
    // לא דורסים את כל הקונפיג (writeOrgCloudConfig מוחלף במפה-מלאה)
    expect(body).not.toContain('writeOrgCloudConfig');
  });

  it('שער-בטיחות: שורש/default נחסמים; תוקף-מיידי setDonationSplit(true)', () => {
    const body = storeSrc.match(/async enableDonationSplit\(\)[\s\S]*?\n {4}\},/)![0];
    expect(body).toContain("cfg.cloudRoot === true");
    expect(body).toContain("slug === 'default'");
    expect(body).toContain('mod.setDonationSplit(true)');
  });

  it('applyCloudDoc החי מיישם את מתג-הפיצול (donationSplitOn) ⇒ בלי רענון', () => {
    expect(storeSrc).toContain('mod.setDonationSplit(donationSplitOn(eff))');
  });

  it('הרכיב מחווט כפתור ל-enableDonationSplit ומגודר מייל-על', () => {
    expect(secSrc).toContain('s.enableDonationSplit');
    expect(secSrc).toContain('void turnOn()');
    expect(secSrc).toContain('await enableSplit()');
    expect(secSrc).toContain("if (!isSuperAdmin(cloudUser?.email)) return null;");
  });

  it('אשף-ההרכבה מציג טוגל donationSplit במקטע התורמים (דגל-קונפיג, לא features)', () => {
    // מוצג רק במקטע התורמים
    expect(wizSrc).toContain("sec.id === 'supporters'");
    // כותב לדגל-הקונפיג ברמת-השורש (patch({ donationSplit })), לא ל-config.features
    expect(wizSrc).toContain('checked={config.donationSplit === true}');
    expect(wizSrc).toContain('patch({ donationSplit: e.target.checked ? true : undefined })');
  });
});
