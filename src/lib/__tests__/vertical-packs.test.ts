/**
 * רצ'ט — applyVerticalPack (חבילות-ורטיקל). המנוע שמאפשר להרכיב מערכת לכל
 * עסק: החלה מחליפה terms+modules+features בערכי החבילה, ושומרת את כל שאר
 * הקונפיג (firebase/adminEmails/theme). חבילה לא-מוכרת = no-op בטוח.
 * ורטיקל מסחרי מכבה פיצ'רים ייחודיים-לעמותה (COMMERCIAL_OFF) — מוסך לא מציג §46.
 */
import { describe, expect, it } from 'vitest';
import { VERTICAL_PACKS, applyVerticalPack, COMMERCIAL_OFF } from '../verticalPacks';
import { TERM_DEFS } from '../../types/features';
import { DEFAULT_CONFIG, MOTION_KEYS, type ModuleKey, type OrgConfig } from '../../types/config';
import packSrc from '../verticalPacks.ts?raw';
import appSrc from '../../App.tsx?raw';

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

  it('שומר ענן/אדמין/שם — features+עיצוב מוחלפים בפריסֶט הענף (16.8: כולל ערכה/צבע)', () => {
    const c = applyVerticalPack(base, 'clinic');
    expect(c.firebase?.projectId).toBe('p'); // ענן נשמר
    expect(c.adminEmails).toEqual(['admin@x.com']); // אדמין נשמר
    expect(c.orgName).toBe('עסק לדוגמה'); // שם נשמר
    // עיצוב מוחלף (הכרעת-בעלים 16.8 "שיחליף סגנון בשינוי וורטיקל"): base בלי
    // accentCustom ⇒ הערכה והצבע מתחלפים לערכי-הקליניקה (heichal/#123456 הישנים נעלמו).
    expect(c.theme).toBe('kehila');
    expect(c.accent).toBe('#e05a8f');
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
    for (const id of ['clinic', 'shop', 'services', 'rooms', 'fleet', 'garage', 'hospitality', 'digital', 'build', 'studio']) {
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
    const ALL_MODULES: ModuleKey[] = ['families', 'courses', 'calendar', 'diary', 'supporters', 'reports', 'tzedaka', 'shop', 'shop7'];
    const INTENTIONAL_ON: Record<string, ModuleKey[]> = {
      chesed: ['families', 'courses', 'calendar', 'diary', 'supporters', 'reports', 'tzedaka', 'shop', 'shop7'], // הלקוח החי — הכול דלוק במכוון
      clinic: ['families', 'courses', 'calendar', 'diary', 'supporters', 'reports'],
      shop: ['families', 'calendar', 'supporters', 'reports', 'shop'], // מודול החנות דלוק — מונחים קמעונאיים
      services: ['families', 'calendar', 'diary', 'supporters', 'reports'],
      rooms: ['families', 'calendar', 'diary', 'supporters', 'reports'],
      fleet: ['families', 'calendar', 'diary', 'supporters', 'reports'],
      garage: ['families', 'calendar', 'diary', 'supporters', 'reports'],
      hospitality: ['families', 'calendar', 'diary', 'supporters', 'reports'],
      gemach: [], // המטריצה המלאה מפורשת ב-modules
      tzedakot: [], // כנ"ל
      digital: ['families', 'calendar', 'supporters', 'reports'], // דיגיטל — בלי חוגים/יומן/צדקה/חנות
      build: ['families', 'calendar', 'diary', 'supporters', 'reports'], // בנייה — יומן=אתרים דלוק
      studio: ['families', 'calendar', 'diary', 'supporters', 'reports'], // משולב — כמו בנייה
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

  it('🚚 חלוקה (shop7) — דלוקה רק בחסד/גמ"ח/צדקות, כבויה במסחריות (באג 18.8: דלפה לכולן)', () => {
    // shop7 נוסף בגל SHOP7 אחרי שהחבילות הוגדרו; חוזה "מפתח-חסר=דלוק" ⇒ מודול
    // 'חלוקה' דלף לכל ורטיקל — כולל סטודיו-דיגיטל/בנייה/קליניקה, שם הוא חסר-פשר.
    // הכרעת-בעלים ("תעשה את מה שנכון"): ON רק בעמותתיות-החלוקה.
    const ON = new Set(['chesed', 'gemach', 'tzedakot']);
    for (const p of VERTICAL_PACKS) {
      const on = p.modules.shop7 !== false; // חסר-מפתח (חסד) = דלוק
      expect(on, `חבילה ${p.id} — חלוקה צריכה להיות ${ON.has(p.id) ? 'דלוקה' : 'כבויה'}`).toBe(ON.has(p.id));
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

/**
 * רצ'ט — זהות-חזותית פר-ורטיקל (16.8, הכרעת-בעלים "שיחליף אימוני וסגנון האתר
 * בשינוי וורטיקל" + "הכל מוחלף חוץ מצבע-מותאם-ידני"). החלת חבילה מלבישה גם
 * ערכת-נושא + צבע + אימוג'י-אייקון + תנועה — פרט לצבע שנבחר ידנית (accentCustom).
 */
describe('🎨 ratchet — זהות-חזותית פר-ורטיקל', () => {
  const COMMERCIAL = ['clinic', 'shop', 'services', 'rooms', 'fleet', 'garage', 'hospitality', 'digital', 'build', 'studio'];
  const NONPROFIT = ['chesed', 'gemach', 'tzedakot'];

  it('כל חבילה מגדירה ערכת-נושא; מסחרית מגדירה גם icon+accent+motion; עמותתית — לא', () => {
    for (const p of VERTICAL_PACKS) {
      expect(typeof p.theme, `חבילה ${p.id} — theme חייב`).toBe('string');
      if (p.motion) expect((MOTION_KEYS as readonly string[]).includes(p.motion), `${p.id} — motion חוקי`).toBe(true);
      if (COMMERCIAL.includes(p.id)) {
        expect(p.icon, `${p.id} מסחרי — icon חייב`).toBeTruthy();
        expect(p.accent, `${p.id} מסחרי — accent חייב`).toBeTruthy();
        expect(p.motion, `${p.id} מסחרי — motion חייב`).toBeTruthy();
      }
      if (NONPROFIT.includes(p.id)) {
        // עמותתי = מראה קלאסי (or-rishon, אות-ראשונה) — בלי icon/accent/motion (ביט-זהה ללקוח-החי)
        expect(p.theme, `${p.id} עמותתי — or-rishon`).toBe('or-rishon');
        expect(p.icon, `${p.id} עמותתי — בלי icon`).toBeUndefined();
        expect(p.accent, `${p.id} עמותתי — בלי accent`).toBeUndefined();
        expect(p.motion, `${p.id} עמותתי — בלי motion`).toBeUndefined();
      }
    }
  });

  it("בנייה: מלביש ערכה+צבע+אימוג׳י+תנועה על הקונפיג", () => {
    const c = applyVerticalPack(base, 'build');
    expect(c.theme).toBe('tsohar');
    expect(c.accent).toBe('#e8912a');
    expect(c.emoji).toBe('🏗️'); // אימוג׳י-האייקון (config.emoji) — לכותרת ו-favicon
    expect(c.motion).toBe('bold');
    expect(c.accentCustom).toBeUndefined(); // צבע נגזר-מחבילה, לא ידני
  });

  it("סטודיו-משולב: אימוג׳י 🏢 + ערכת kehila", () => {
    const c = applyVerticalPack(base, 'studio');
    expect(c.emoji).toBe('🏢');
    expect(c.theme).toBe('kehila');
  });

  it("🕊️ חסד: מראה קלאסי — or-rishon, בלי אימוג׳י/תנועה; הצבע-הלא-ידני מוסר", () => {
    const c = applyVerticalPack(base, 'chesed'); // base: theme heichal, accent #123456 (בלי accentCustom)
    expect(c.theme).toBe('or-rishon');
    expect(c.emoji).toBeUndefined(); // אין icon בחבילה ⇒ נפילה לאות-ראשונה (כמו הלקוח-החי)
    expect(c.motion).toBeUndefined();
    expect(c.accent).toBeUndefined(); // צבע-לא-ידני מוחלף → מוסר → צבע-הערכה
    expect(c.accentCustom).toBeUndefined();
  });

  it("🔒 צבע-מותאם-ידני שורד החלפת-ורטיקל — הערכה/האימוג׳י מתחלפים, הצבע נשאר", () => {
    const manual = { ...base, accent: '#abcdef', accentCustom: true as const };
    const c = applyVerticalPack(manual, 'build');
    expect(c.accent).toBe('#abcdef'); // הצבע הידני שרד
    expect(c.accentCustom).toBe(true); // הדגל נשמר
    expect(c.theme).toBe('tsohar'); // אבל הערכה כן התחלפה
    expect(c.emoji).toBe('🏗️'); // וגם האימוג׳י
  });

  it("🔒 הגנת-מקור: applyVerticalPack מזריק emoji/motion/theme; הכותרת קוראת config.emoji", () => {
    expect(packSrc).toMatch(/next\.emoji = pack\.icon/);
    expect(packSrc).toMatch(/next\.motion = pack\.motion/);
    expect(packSrc).toMatch(/if \(pack\.theme\) next\.theme = pack\.theme/);
    expect(packSrc).toMatch(/config\.accentCustom/); // שמירת צבע-ידני
    // הכותרת (side-logo) מציגה את אימוג׳י-הארגון כשקיים
    expect(appSrc).toMatch(/config\.emoji \? \(/);
    expect(appSrc).toMatch(/applyFavicon\(config\.emoji\)/);
  });
});
