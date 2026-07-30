/**
 * פער 21 (P2 ב׳) — מיזוג שדה-שדה, לגאסי dupFieldMerge.
 *
 * ratchet מול knowledge/legacy/legacy-main-script.js:1643-1671:
 * - 18 שדות עם תוויות verbatim (dupFields, שורות 1644-1653).
 * - לכל שדה: edit ידני גובר; אחרת pick; אחרת הרשומה הראשונה שיש לה ערך.
 * - kidsHome/kidsMarried: '' ⇒ 0, אחרת מספר.
 * שדרוג מתועד מעל הלגאסי (אפס אובדן): members מאוחדים לפי id בסמנטיקת
 * mergeFamilies — לא דה-דופ first|birth שהיה מייתם שיבוצים.
 */
import { describe, expect, it } from 'vitest';
import type { Family, Member } from '../../types/domain';
import { DUP_FIELDS, dupFieldValue, mergeFamiliesByFields } from '../dedup';

function fam(p: Partial<Family>): Family {
  return {
    id: p.id ?? 'f1', name: p.name ?? 'כהן', father: '', mother: '', fatherId: '', motherId: '',
    phone: '', phone2: '', email: '', address: '', city: '', community: '', language: '',
    maritalStatus: '', tzedaka: '', status: 'active', notes: '', createdAt: '2026-01-01',
    members: [], docs: [], ...p,
  } as Family;
}

const member = (id: string, first: string): Member =>
  ({ id, first, isParent: false } as unknown as Member);

describe('פער 21 — מיזוג שדה-שדה (לגאסי dupFieldMerge:1654-1671)', () => {
  it('18 השדות קיימים עם התוויות מהלגאסי', () => {
    expect(DUP_FIELDS).toHaveLength(18);
    expect(DUP_FIELDS.map((d) => d.label)).toContain('ילדים בבית');
    expect(DUP_FIELDS.map((d) => d.key)).toEqual(
      expect.arrayContaining(['name', 'mother', 'father', 'phone', 'phone2', 'email', 'city', 'address', 'motherId', 'fatherId', 'community', 'language', 'maritalStatus', 'status', 'kidsHome', 'kidsMarried', 'createdAt', 'notes']),
    );
  });

  it('ברירת מחדל: הרשומה הראשונה שיש לה ערך; pick גובר; edit גובר על הכול', () => {
    const a = fam({ id: 'a', city: '' });
    const b = fam({ id: 'b', city: 'ביתר עילית' });
    const cityDef = DUP_FIELDS.find((d) => d.key === 'city')!;
    expect(dupFieldValue([a, b], cityDef, {}, {})).toBe('ביתר עילית'); // הראשונה עם ערך
    expect(dupFieldValue([a, b], cityDef, { city: 0 }, {})).toBe(''); // pick מפורש
    expect(dupFieldValue([a, b], cityDef, { city: 1 }, { city: 'צפת' })).toBe('צפת'); // edit גובר
  });

  it('kidsHome: מחרוזת ריקה הופכת ל-0, ערך מספרי נשמר (לגאסי שורה 1663)', () => {
    const a = fam({ id: 'a' });
    const b = fam({ id: 'b', kidsHome: 7 });
    const merged0 = mergeFamiliesByFields([a, b], { kidsHome: 0 }, {});
    expect(merged0.kidsHome).toBe(0);
    const merged7 = mergeFamiliesByFields([a, b], { kidsHome: 1 }, {});
    expect(merged7.kidsHome).toBe(7);
  });

  it('שדרוג אפס-אובדן: בני משפחה מאוחדים לפי id — לא נופלים בדה-דופ שם|לידה', () => {
    // בלגאסי שני "רוני" בלי תאריך לידה היו מתמזגים לאחד ומייתמים שיבוץ; אצלנו שניהם נשמרים
    const a = fam({ id: 'a', members: [member('m1', 'רוני')] });
    const b = fam({ id: 'b', members: [member('m2', 'רוני')] });
    const merged = mergeFamiliesByFields([a, b], {}, {});
    expect(merged.members.map((m) => m.id).sort()).toEqual(['m1', 'm2']);
  });

  it('שדות סקלריים נבחרים בלי לגעת במבנה: הבסיס הוא fams[0]', () => {
    const a = fam({ id: 'a', name: 'כהן', phone: '050-1', notes: 'ישן' });
    const b = fam({ id: 'b', name: 'כהן-לוי', phone: '050-2', notes: 'חדש' });
    const merged = mergeFamiliesByFields([a, b], { name: 1, notes: 1 }, {});
    expect(merged.id).toBe('a');
    expect(merged.name).toBe('כהן-לוי');
    expect(merged.notes).toBe('חדש');
    expect(merged.phone).toBe('050-1'); // ברירת מחדל — הראשונה עם ערך
  });
});
