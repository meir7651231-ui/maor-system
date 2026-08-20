/**
 * ratchet · אשף 2.0 (20.8.2026, בקשת-בעלים "פירוט למקסימום אבל יעיל"):
 *
 * 1. wizardDiff — דוח-שינויים מול ברירת-המחדל: false מפורש = שינוי; opt-in
 *    שהודלק (true) = שינוי; דגל-רגיל חסר = לא-שינוי; מונח-דריסה = שינוי רק
 *    כשהוא שונה מברירת-המחדל; הרחבה דלוקה = תמיד שינוי (חסר=כבוי).
 * 2. filterFeatureRows — סינון דלוקות/כבויות מכבד את סמנטיקת-ה-opt-in
 *    (optIn חסר ⇒ נספר "כבוי"), ו"שונו" מסנן בדיוק לפי הדוח.
 * 3. groupFeatures — קיבוץ יציב לפי קידומת-משנה; קבוצה-של-אחת לא נפתחת
 *    (נשארת ברצף הכללי); הרצף הכללי תמיד ראשון.
 * 4. integrationMatches — החיפוש מוצא הרחבות בעברית ("וואטסאפ") — הפער
 *    שנמצא בביקורת-הדפדפן 20.8 (חיפוש כיסה רק יכולות ומונחים).
 * 5. הגנות-מקור: האשף מחווט לצ'יפי-הסינון, לביטול (snap/undo) ולחיפוש-ההרחבות.
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import type { FeatureDef, TermDef } from '../../../types/features';
import { FEATURES } from '../../../types/features';
import {
  diffCount,
  filterFeatureRows,
  groupFeatures,
  integrationMatches,
  wizardDiff,
} from '../wizardLib';
import wizardSrc from '../BuilderWizard.tsx?raw';

const F = (key: string, optIn?: boolean): FeatureDef => ({ key, label: key, desc: '', module: 'courses', ...(optIn ? { optIn } : {}) });
const T = (key: string, fallback: string): TermDef => ({ key, label: key, fallback });

function cfg(over: Partial<OrgConfig>): OrgConfig {
  return { ...DEFAULT_CONFIG, modules: {}, features: {}, terms: {}, integrations: {}, ...over };
}

describe('wizardDiff — דוח-שינויים מול ברירת-המחדל', () => {
  const feats = [F('courses.a'), F('courses.cockpit', true)];
  const terms = [T('nav.courses', 'חוגים')];

  it('קונפיג נקי = אפס שינויים', () => {
    expect(diffCount(wizardDiff(cfg({}), feats, terms))).toBe(0);
  });

  it('false מפורש = שינוי; opt-in שהודלק = שינוי; דגל-רגיל חסר = לא', () => {
    const d = wizardDiff(cfg({ features: { 'courses.a': false, 'courses.cockpit': true } }), feats, terms);
    expect(d.features.sort()).toEqual(['courses.a', 'courses.cockpit']);
  });

  it('מונח: דריסה-שונה = שינוי; דריסה-זהה-לברירת-המחדל = לא', () => {
    expect(wizardDiff(cfg({ terms: { 'nav.courses': 'שיעורים' } }), feats, terms).terms).toEqual(['nav.courses']);
    expect(wizardDiff(cfg({ terms: { 'nav.courses': 'חוגים' } }), feats, terms).terms).toEqual([]);
  });

  it('מודול-כבוי והרחבה-דלוקה נספרים', () => {
    const d = wizardDiff(
      cfg({ modules: { shop: false }, integrations: { whatsapp: { enabled: true } } }),
      feats,
      terms,
    );
    expect(d.modulesOff).toEqual(['shop']);
    expect(d.integrationsOn).toEqual(['whatsapp']);
    expect(diffCount(d)).toBe(2);
  });
});

describe('filterFeatureRows — סינון-מצב מכבד opt-in', () => {
  const feats = [F('courses.a'), F('courses.cockpit', true)];
  const terms: TermDef[] = [];

  it("'דלוקות' בקונפיג נקי: הרגיל דלוק, ה-opt-in לא (חסר=כבוי)", () => {
    const c = cfg({});
    const d = wizardDiff(c, feats, terms);
    expect(filterFeatureRows(c, feats, 'on', d).map((f) => f.key)).toEqual(['courses.a']);
    expect(filterFeatureRows(c, feats, 'off', d).map((f) => f.key)).toEqual(['courses.cockpit']);
  });

  it("'opt-in' מחזיר רק דגלי-opt-in; 'שונו' בדיוק לפי הדוח", () => {
    const c = cfg({ features: { 'courses.a': false } });
    const d = wizardDiff(c, feats, terms);
    expect(filterFeatureRows(c, feats, 'optin', d).map((f) => f.key)).toEqual(['courses.cockpit']);
    expect(filterFeatureRows(c, feats, 'changed', d).map((f) => f.key)).toEqual(['courses.a']);
  });
});

describe('groupFeatures — קיבוץ-משנה יציב', () => {
  it('שתי יכולות-punch נפתחות כקבוצה; יחידה נשארת ברצף הכללי; הכללי ראשון', () => {
    const gs = groupFeatures([F('courses.x'), F('courses.punch.buy'), F('courses.punch.undo'), F('courses.receipt.summary')]);
    expect(gs[0].label).toBeNull();
    expect(gs[0].items.map((f) => f.key)).toEqual(['courses.x', 'courses.receipt.summary']);
    expect(gs[1].label).toContain('כרטיסיות');
    expect(gs[1].items.map((f) => f.key)).toEqual(['courses.punch.buy', 'courses.punch.undo']);
  });

  it('על ה-FEATURES האמיתי: אף יכולת לא הולכת לאיבוד בקיבוץ', () => {
    const courses = FEATURES.filter((f) => f.module === 'courses');
    const total = groupFeatures(courses).reduce((t, g) => t + g.items.length, 0);
    expect(total).toBe(courses.length);
  });
});

describe('integrationMatches — חיפוש-הרחבות בעברית', () => {
  const labels = { whatsapp: '💬 וואטסאפ', maps: '🗺️ מפות', gcal: '📅 יומן Google' };
  it('"וואטסאפ" נמצא (הפער מביקורת 20.8); מחרוזת-ריקה = כלום', () => {
    expect(integrationMatches('וואטסאפ', labels)).toEqual(['whatsapp']);
    expect(integrationMatches('Google', labels)).toEqual(['gcal']);
    expect(integrationMatches('  ', labels)).toEqual([]);
  });
});

describe('הגנות-מקור — אשף 2.0 מחווט בפועל', () => {
  it('צ׳יפי-הסינון, המחסנית (snap/undo), הקיבוץ וחיפוש-ההרחבות בשימוש', () => {
    expect(wizardSrc).toContain('ROW_FILTER_LABELS');
    expect(wizardSrc).toContain('filterFeatureRows(config, searched, rowFilter, diff)');
    expect(wizardSrc).toContain('const snap = () => setHist(');
    expect(wizardSrc).toContain('const undo = ()');
    expect(wizardSrc).toContain('groupFeatures(visFeats)');
    expect(wizardSrc).toContain('integrationMatches(q, INTEGRATION_LABELS)');
    // ההרחבות מוצגות גם בזמן חיפוש — לא רק כשאין חיפוש
    expect(wizardSrc).toContain('(!searching || intMatches.length > 0) && (');
  });
});
