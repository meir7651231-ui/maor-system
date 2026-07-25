/**
 * רצ'ט — applyVerticalPack (חבילות-ורטיקל). המנוע שמאפשר להרכיב מערכת לכל
 * עסק: החלה מחליפה terms+modules בערכי החבילה, ושומרת את כל שאר הקונפיג
 * (firebase/adminEmails/theme/features). חבילה לא-מוכרת = no-op בטוח.
 */
import { describe, expect, it } from 'vitest';
import { VERTICAL_PACKS, applyVerticalPack } from '../verticalPacks';
import { TERM_DEFS } from '../../types/features';
import { DEFAULT_CONFIG, type OrgConfig } from '../../types/config';

const base: OrgConfig = {
  ...DEFAULT_CONFIG,
  orgName: 'עסק לדוגמה',
  theme: 'heichal',
  accent: '#123456',
  firebase: { apiKey: 'k', authDomain: 'a', projectId: 'p', appId: 'x' },
  adminEmails: ['admin@x.com'],
  features: { 'courses.punch': false },
  terms: { 'nav.families': 'ישן' },
  modules: { reports: false },
};

describe('🏢 ratchet — applyVerticalPack (פאס-8)', () => {
  it('קליניקה: מחליף מונחים למונחי הענף', () => {
    const c = applyVerticalPack(base, 'clinic');
    expect(c.terms!['nav.families']).toBe('מטופלים');
    expect(c.terms!['ayin.stage.new']).toBe('ייעוץ');
    expect(c.terms!['nav.families']).not.toBe('ישן'); // המונח הישן הוחלף
  });

  it('חנות: מכבה מודולים שלא רלוונטיים (חוגים/יומן)', () => {
    const c = applyVerticalPack(base, 'shop');
    expect(c.modules.courses).toBe(false);
    expect(c.modules.diary).toBe(false);
    expect(c.terms!['entity.cred']).toBe('נקודות נאמנות');
  });

  it('שומר את שאר הקונפיג — ענן, אדמין, ערכה, יכולות', () => {
    const c = applyVerticalPack(base, 'clinic');
    expect(c.firebase?.projectId).toBe('p');
    expect(c.adminEmails).toEqual(['admin@x.com']);
    expect(c.theme).toBe('heichal');
    expect(c.accent).toBe('#123456');
    expect(c.features!['courses.punch']).toBe(false);
    expect(c.orgName).toBe('עסק לדוגמה');
  });

  it('חסד = ברירות מחדל (מונחים ומודולים ריקים = הכל דלוק)', () => {
    const c = applyVerticalPack(base, 'chesed');
    expect(c.terms).toEqual({});
    expect(c.modules).toEqual({});
  });

  it('חבילה לא-מוכרת → no-op בטוח (מחזיר את הקונפיג כמות שהוא)', () => {
    expect(applyVerticalPack(base, 'no-such-pack')).toBe(base);
  });

  it('כל חבילה מוגדרת עם id/label/terms/modules תקינים', () => {
    for (const p of VERTICAL_PACKS) {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(typeof p.terms).toBe('object');
      expect(typeof p.modules).toBe('object');
    }
  });

  it('מזהי החבילות ייחודיים', () => {
    const ids = VERTICAL_PACKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('🔒 כל מפתח-מונח בכל חבילה קיים ב-TERM_DEFS (אין תיוג ל"מפתח מת")', () => {
    const known = new Set(TERM_DEFS.map((t) => t.key));
    for (const p of VERTICAL_PACKS) {
      for (const key of Object.keys(p.terms)) {
        expect(known.has(key), `חבילה ${p.id} — מפתח לא מוכר: ${key}`).toBe(true);
      }
    }
  });

  it('חבילות חדשות: חדרים/צי-רכב/מוסך/אירוח — מכבות חוגים ומתייגות את מנוע ההזמנות', () => {
    for (const id of ['rooms', 'fleet', 'garage', 'hospitality']) {
      const c = applyVerticalPack(base, id);
      expect(c.modules.courses, `${id} — חוגים צריכים להיות כבויים`).toBe(false);
      // מנוע ה-diary (נכס-להזמנה) הוא הליבה בכל הארבע — חובה תיוג חדר
      expect(c.terms!['entity.room'], `${id} — entity.room חייב תיוג`).toBeTruthy();
      // מנוע ה-ayin ממופה ל-pipeline של הענף — שלב אחרון מוגדר
      expect(c.terms!['ayin.stage.done'], `${id} — שלב סיום חייב תיוג`).toBeTruthy();
      // שמירת firebase/admin גם בחבילות החדשות
      expect(c.firebase?.projectId).toBe('p');
      expect(c.adminEmails).toEqual(['admin@x.com']);
    }
  });
});
