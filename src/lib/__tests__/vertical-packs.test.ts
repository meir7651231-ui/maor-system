/**
 * רצ'ט — applyVerticalPack (חבילות-ורטיקל). המנוע שמאפשר להרכיב מערכת לכל
 * עסק: החלה מחליפה terms+modules+features בערכי החבילה, ושומרת את כל שאר
 * הקונפיג (firebase/adminEmails/theme). חבילה לא-מוכרת = no-op בטוח.
 * ורטיקל מסחרי מכבה פיצ'רים ייחודיים-לעמותה (COMMERCIAL_OFF) — מוסך לא מציג §46.
 */
import { describe, expect, it } from 'vitest';
import { VERTICAL_PACKS, applyVerticalPack, COMMERCIAL_OFF } from '../verticalPacks';
import { TERM_DEFS } from '../../types/features';
import { DEFAULT_CONFIG, type ModuleKey, type OrgConfig } from '../../types/config';

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

  it('שומר ענן/אדמין/ערכה — אך features מוחלף בפריסֶט הענף (לא נשמר)', () => {
    const c = applyVerticalPack(base, 'clinic');
    expect(c.firebase?.projectId).toBe('p');
    expect(c.adminEmails).toEqual(['admin@x.com']);
    expect(c.theme).toBe('heichal');
    expect(c.accent).toBe('#123456');
    expect(c.orgName).toBe('עסק לדוגמה');
    // features הישן (courses.punch:false) הוחלף — עכשיו זה פריסֶט-הקליניקה
    expect(c.features!['courses.punch']).toBeUndefined();
  });

  it('חסד = ברירות מחדל (מונחים/מודולים/יכולות ריקים = הכל דלוק)', () => {
    const c = applyVerticalPack(base, 'chesed');
    expect(c.terms).toEqual({});
    expect(c.modules).toEqual({});
    expect(c.features).toEqual({}); // עמותה — כל הפיצ'רים דלוקים
  });

  it('ורטיקל מסחרי מכבה פיצרים ייחודיים-לעמותה — מוסך/חנות לא מציגים §46', () => {
    for (const id of ['clinic', 'shop', 'services', 'rooms', 'fleet', 'garage', 'hospitality']) {
      const c = applyVerticalPack(base, id);
      expect(c.features!['core.taxreceipt'], `${id} — §46 חייב להיות כבוי`).toBe(false);
      expect(c.features!['families.cred'], `${id} — מדד-אמינות כבוי`).toBe(false);
      expect(c.features!['shell.privacy'], `${id} — מצב-צנעה כבוי`).toBe(false);
    }
  });

  it('🕊️ ורטיקל עמותתי (חסד/גמ"ח/התרמה) — §46 נשאר דלוק (features ריק)', () => {
    for (const id of ['chesed', 'gemach', 'tzedakot']) {
      const c = applyVerticalPack(base, id);
      expect(c.features!['core.taxreceipt'], `${id} — §46 דלוק`).toBeUndefined();
    }
  });

  it('COMMERCIAL_OFF מכיל רק ערכי false (כיבוי בלבד, בלי הדלקה מפתיעה)', () => {
    for (const v of Object.values(COMMERCIAL_OFF)) expect(v).toBe(false);
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

  it('🔒 אשף 3 — כיסוי-מלא: לכל pack, לכל ModuleKey — עמדה מוגדרת (הבאג של 30.7 — מוסך עם קופות צדקה — לא חוזר)', () => {
    // חוזה הדגלים "חסר=דלוק" הפך מודול חדש לדלוק-בשקט בכל ורטיקל. מעתה: כל
    // מודול חייב עמדה — או מפתח מפורש ב-modules, או רישום כאן כ-ON-מכוון.
    // ⇒ המודול הבא שיתווסף ל-ModuleKey ישבור את הבדיקה עד שכל ורטיקל יכריע.
    const ALL_MODULES: ModuleKey[] = ['families', 'courses', 'calendar', 'diary', 'supporters', 'reports', 'tzedaka', 'shop'];
    const INTENTIONAL_ON: Record<string, ModuleKey[]> = {
      chesed: ['families', 'courses', 'calendar', 'diary', 'supporters', 'reports', 'tzedaka', 'shop'], // הלקוח החי — הכול דלוק במכוון
      clinic: ['families', 'courses', 'calendar', 'diary', 'supporters', 'reports'],
      shop: ['families', 'calendar', 'supporters', 'reports', 'shop'], // מודול החנות דלוק — מונחים קמעונאיים
      services: ['families', 'calendar', 'diary', 'supporters', 'reports'],
      rooms: ['families', 'calendar', 'diary', 'supporters', 'reports'],
      fleet: ['families', 'calendar', 'diary', 'supporters', 'reports'],
      garage: ['families', 'calendar', 'diary', 'supporters', 'reports'],
      hospitality: ['families', 'calendar', 'diary', 'supporters', 'reports'],
      gemach: [], // המטריצה המלאה מפורשת ב-modules
      tzedakot: [], // כנ"ל
    };
    for (const p of VERTICAL_PACKS) {
      const on = INTENTIONAL_ON[p.id];
      expect(on, `חבילה ${p.id} — חסרה רשומת INTENTIONAL_ON`).toBeDefined();
      for (const m of ALL_MODULES) {
        const stated = m in p.modules || on.includes(m);
        expect(stated, `חבילה ${p.id} — למודול ${m} אין עמדה (לא ב-modules ולא ב-INTENTIONAL_ON)`).toBe(true);
      }
    }
  });

  it('🔒 אשף 3 — מונחי nav לעמודות דלוקות: pack מתייג שמדליק shop/tzedaka חייב שם-עמודה (לא מסך ריק-שם)', () => {
    for (const p of VERTICAL_PACKS) {
      // חבילת ברירות-המחדל (terms ריק = מונחי מאור עצמם) פטורה — ה-fallback הוא השם
      if (Object.keys(p.terms).length === 0) continue;
      if (p.modules.shop !== false) expect(p.terms['nav.shop'], `חבילה ${p.id} — shop דלוק בלי nav.shop`).toBeTruthy();
      if (p.modules.tzedaka !== false) expect(p.terms['nav.tzedaka'], `חבילה ${p.id} — tzedaka דלוק בלי nav.tzedaka`).toBeTruthy();
    }
  });

  it('אשף 2 — גמ"ח ומבצעי-התרמה: המנוע הנכון דלוק, המונחים נטענים', () => {
    const g = applyVerticalPack(base, 'gemach');
    expect(g.modules.shop).toBe(true);
    expect(g.modules.tzedaka).toBe(false);
    expect(g.modules.courses).toBe(false);
    expect(g.modules.diary).toBe(false);
    expect(g.terms!['nav.shop']).toBe('גמ"ח');
    expect(g.terms!['entity.shopAssignment']).toBe('השאלה');
    const t = applyVerticalPack(base, 'tzedakot');
    expect(t.modules.tzedaka).toBe(true);
    expect(t.modules.shop).toBe(false);
    expect(t.terms!['nav.tzedaka']).toBe('מבצעים');
    expect(t.terms!['entity.tzBox']).toBe('קופה');
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
