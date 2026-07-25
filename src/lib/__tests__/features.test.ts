import { describe, it, expect } from 'vitest';
import { featureOn, isAdminUser, termOf } from '../config';
import { DEFAULT_CONFIG, type OrgConfig } from '../../types/config';
import { FEATURES, TERM_DEFS } from '../../types/features';

/** קונפיגורציה לבדיקה — DEFAULT_CONFIG עם דריסות נקודתיות. */
function cfg(partial: Partial<OrgConfig> = {}): OrgConfig {
  return { ...DEFAULT_CONFIG, ...partial };
}

describe('featureOn', () => {
  it('missing key = on (ברירת מחדל פעיל)', () => {
    expect(featureOn(cfg(), 'families.cred')).toBe(true);
    expect(featureOn(cfg(), 'core.daygate')).toBe(true);
    expect(featureOn(cfg({ features: {} }), 'courses.punch')).toBe(true);
  });

  it('explicit false = off', () => {
    const c = cfg({ features: { 'families.cred': false } });
    expect(featureOn(c, 'families.cred')).toBe(false);
    // מפתחות אחרים לא מושפעים
    expect(featureOn(c, 'families.docs')).toBe(true);
  });

  it('explicit true = on', () => {
    expect(featureOn(cfg({ features: { 'home.digest': true } }), 'home.digest')).toBe(true);
  });

  it('module off cascades to its child features', () => {
    const c = cfg({ modules: { families: false } });
    expect(featureOn(c, 'families.cred')).toBe(false);
    expect(featureOn(c, 'families.report')).toBe(false);
    // מודולים אחרים לא מושפעים
    expect(featureOn(c, 'courses.punch')).toBe(true);
  });

  it('module off wins even when the feature is explicitly true', () => {
    const c = cfg({ modules: { supporters: false }, features: { 'supporters.rfm': true } });
    expect(featureOn(c, 'supporters.rfm')).toBe(false);
  });

  it('core/home/settings keys are unaffected by module toggles', () => {
    const c = cfg({
      modules: {
        families: false,
        courses: false,
        calendar: false,
        diary: false,
        supporters: false,
        reports: false,
      },
    });
    expect(featureOn(c, 'core.receipts')).toBe(true);
    expect(featureOn(c, 'core.daygate')).toBe(true);
    expect(featureOn(c, 'home.digest')).toBe(true);
    expect(featureOn(c, 'settings.export')).toBe(true);
    // אבל כיבוי מפורש עדיין עובד עליהם
    expect(featureOn(cfg({ features: { 'core.daygate': false } }), 'core.daygate')).toBe(false);
  });
});

describe('termOf', () => {
  it('returns fallback when there is no override', () => {
    expect(termOf(cfg(), 'nav.courses', 'חוגים')).toBe('חוגים');
    expect(termOf(cfg({ terms: {} }), 'nav.courses', 'חוגים')).toBe('חוגים');
  });

  it('returns the override when set', () => {
    const c = cfg({ terms: { 'nav.courses': 'שיעורים' } });
    expect(termOf(c, 'nav.courses', 'חוגים')).toBe('שיעורים');
  });

  it('trims the override', () => {
    const c = cfg({ terms: { 'entity.family': '  בית אב  ' } });
    expect(termOf(c, 'entity.family', 'משפחה')).toBe('בית אב');
  });

  it('empty / whitespace-only override falls back', () => {
    expect(termOf(cfg({ terms: { 'nav.diary': '' } }), 'nav.diary', 'יומן חדרים')).toBe('יומן חדרים');
    expect(termOf(cfg({ terms: { 'nav.diary': '   ' } }), 'nav.diary', 'יומן חדרים')).toBe('יומן חדרים');
  });
});

describe('FEATURES registry sanity', () => {
  it('every key is unique', () => {
    const keys = FEATURES.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every feature's module matches its key prefix", () => {
    for (const f of FEATURES) {
      expect(f.key.split('.')[0]).toBe(f.module);
    }
  });

  it('every entry has a non-empty Hebrew label and desc', () => {
    for (const f of FEATURES) {
      expect(f.label.trim().length).toBeGreaterThan(0);
      expect(f.desc.trim().length).toBeGreaterThan(0);
    }
  });

  it('TERM_DEFS keys are unique with non-empty fallbacks', () => {
    const keys = TERM_DEFS.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const t of TERM_DEFS) {
      expect(t.fallback.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('🔒 ratchet — isAdminUser (גישת אשף/נושא לפי מייל, פאס-8)', () => {
  it('adminEmails מוגדר → רק המייל ברשימה הוא אדמין (case-insensitive)', () => {
    const c = cfg({ adminEmails: ['meir7651231@gmail.com'] });
    expect(isAdminUser(c, 'meir7651231@gmail.com')).toBe(true);
    expect(isAdminUser(c, 'MEIR7651231@Gmail.com')).toBe(true); // אותיות רישיות
    expect(isAdminUser(c, 'someone@else.com')).toBe(false); // לקוח אחר — לא אדמין
    expect(isAdminUser(c, null)).toBe(false); // ללא מייל מול רשימה מוגדרת
    expect(isAdminUser(c, undefined)).toBe(false);
  });
  it('adminEmails ריק/חסר → אין הגבלה (כל אחד אדמין, תאימות-אחורה)', () => {
    expect(isAdminUser(cfg(), 'anyone@x.com')).toBe(true);
    expect(isAdminUser(cfg({ adminEmails: [] }), null)).toBe(true);
  });
});

describe('🔒 ratchet — פיצול calendar.blocking לשני תת-דגלים עצמאיים', () => {
  // הגייט בקומפוננטות הוא: featureOn(parent) && featureOn(child).
  const gate = (c: OrgConfig, child: string) =>
    featureOn(c, 'calendar.blocking') && featureOn(c, 'calendar.blocking.' + child);

  it('ברירת מחדל — שתי היכולות פעילות', () => {
    expect(gate(cfg(), 'roomclash')).toBe(true);
    expect(gate(cfg(), 'shabbat')).toBe(true);
  });

  it('כיבוי roomclash לא נוגע ב-shabbat (עצמאות)', () => {
    const c = cfg({ features: { 'calendar.blocking.roomclash': false } });
    expect(gate(c, 'roomclash')).toBe(false);
    expect(gate(c, 'shabbat')).toBe(true);
  });

  it('כיבוי shabbat לא נוגע ב-roomclash (עצמאות)', () => {
    const c = cfg({ features: { 'calendar.blocking.shabbat': false } });
    expect(gate(c, 'shabbat')).toBe(false);
    expect(gate(c, 'roomclash')).toBe(true);
  });

  it('כיבוי ההורה calendar.blocking מכבה את שני הילדים (תאימות-אחורה)', () => {
    const c = cfg({ features: { 'calendar.blocking': false } });
    expect(gate(c, 'roomclash')).toBe(false);
    expect(gate(c, 'shabbat')).toBe(false);
  });

  it('כיבוי מודול calendar מכבה את שני הילדים', () => {
    const c = cfg({ modules: { calendar: false } });
    expect(gate(c, 'roomclash')).toBe(false);
    expect(gate(c, 'shabbat')).toBe(false);
  });
});
