import { describe, it, expect } from 'vitest';
import { featureOn, termOf } from '../config';
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
