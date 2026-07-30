/**
 * ratchet — יצירת משפחה מתוך שיבוץ (P1.10, feature courses.enroll.inlinecreate).
 *
 * מקור האמת: legacy saveEnrollNew (legacy-main-script.js:1318-1339) +
 * הצעת '__new' (legacy:2188): "＋ משפחה חדשה" מוצעת רק לשאילתה ≥2 תווים בלי
 * התאמת שם מדויקת; שם חדש שכבר קיים (normName) לא יוצר כפילות — משתמשים
 * בקיימת; מגדר ברירת המחדל של הילד/ה החדש/ה: 'f' (כמו f.gender || 'f').
 */
import { describe, expect, it } from 'vitest';
import { ENROLL_NEW_FAMILY, offerNewFamily, resolveEnrollFamily } from '../lib';
import enrollSrc from '../EnrollModal.tsx?raw';

const FAMS = [
  { id: 'f1', name: 'כהן' },
  { id: 'f2', name: 'לוי  רוזן' },
];

describe('👨‍👩‍👧 ratchet — offerNewFamily (legacy:2188)', () => {
  it('שאילתה ≥2 תווים בלי התאמה מדויקת → מציעים; שם קיים → לא', () => {
    expect(offerNewFamily(FAMS, 'פרידמן')).toBe(true);
    expect(offerNewFamily(FAMS, 'כהן')).toBe(false);
    expect(offerNewFamily(FAMS, ' כהן ')).toBe(false); // נרמול רווחים
    expect(offerNewFamily(FAMS, 'לוי רוזן')).toBe(false); // ריבוי רווחים מנורמל
  });
  it('שאילתה קצרה מ-2 תווים → לא מציעים', () => {
    expect(offerNewFamily(FAMS, 'א')).toBe(false);
    expect(offerNewFamily(FAMS, '')).toBe(false);
  });
});

describe('👨‍👩‍👧 ratchet — resolveEnrollFamily (legacy:1321-1327)', () => {
  it('id קיים → הקיימת, בלי יצירה', () => {
    expect(resolveEnrollFamily(FAMS, 'f1', '')).toEqual({ fam: FAMS[0], create: false });
  });
  it("'__new' עם שם שכבר קיים (normName) → דה-דופ לקיימת", () => {
    expect(resolveEnrollFamily(FAMS, ENROLL_NEW_FAMILY, ' כהן ')).toEqual({ fam: FAMS[0], create: false });
  });
  it("'__new' עם שם חדש → create=true; בלי שם → כלום", () => {
    expect(resolveEnrollFamily(FAMS, ENROLL_NEW_FAMILY, 'פרידמן')).toEqual({ fam: null, create: true });
    expect(resolveEnrollFamily(FAMS, ENROLL_NEW_FAMILY, '  ')).toEqual({ fam: null, create: false });
    expect(resolveEnrollFamily(FAMS, '', '')).toEqual({ fam: null, create: false });
  });
});

describe('🛡 הגנות-מקור — EnrollModal', () => {
  it('הסקשן מגודר בדגל courses.enroll.inlinecreate; מגדר ברירת מחדל f; דה-דופ דרך resolveEnrollFamily', () => {
    expect(enrollSrc).toMatch(/featureOn\(cfg, 'courses\.enroll\.inlinecreate'\)/);
    expect(enrollSrc).toMatch(/useState<'m' \| 'f'>\('f'\)/);
    expect(enrollSrc).toMatch(/resolveEnrollFamily\(/);
    expect(enrollSrc).toMatch(/offerNewFamily\(/);
  });
});
