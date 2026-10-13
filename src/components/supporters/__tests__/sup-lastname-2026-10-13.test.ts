/**
 * ratchet — שם פרטי ושם משפחה בנפרד בתורמים, עם סינון ומיון (בקשת-בעלים 13.10:
 * "שם ומשפחה בנפרד שיכול לעשות סינון והכל").
 *
 * עקרונות: `name` נשאר השם-המלא הקנוני (מודפס על קבלת §46) ולא נדרס בשקט ·
 * firstName/lastName additive (חסר = לא פוצל) · תורם שעוד לא פוצל — הסינון/המיון נופלים לשם המלא.
 * 🐛 ייבוא: 'שם' תת-מחרוזת של "שם פרטי"/"שם משפחה" — עמודת-השם הכללית תפסה אחת ואיבדה את השנייה.
 */
import { describe, expect, it } from 'vitest';
import {
  composeName,
  filterSupporterList,
  mergeSupporterRow,
  newSupporterFromRow,
  parseSupporterGrid,
  planSupporterImport,
  searchTextOf,
  sortSupporterList,
  supLastNameKey,
  type SupListFilters,
} from '../lib';
import { mergeSupporterInto } from '../../../lib/dedup';
import type { Supporter } from '../../../types/domain';
import formSrc from '../SupporterForm.tsx?raw';
import viewSrc from '../SupportersView.tsx?raw';

function sp(id: string, over: Partial<Supporter> = {}): Supporter {
  return {
    id, name: 'תומך ' + id, phone: '', email: '', address: '', idNum: '',
    cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0,
    first: '', last: '', nextDate: '', donations: [], ...over,
  };
}
const F: SupListFilters = {
  dq: '', cat: 'all', purposeF: 'all', regionF: 'all', hokF: null, tierF: null, lastF: null, monthF: null,
  gaveYearF: null, periodMode: 'gave', acqYearF: null, colF: { count: '', total: '', score: '' }, nextF: false, ayinF: null,
};
const run = (list: Supporter[], f: Partial<SupListFilters>) => filterSupporterList(list, new Map(), { ...F, ...f }, '2026-10-13', 3.7, null).map((s) => s.id);

describe('🪪 עזרים טהורים', () => {
  it('composeName — פרטי+משפחה, ריקים מסוננים', () => {
    expect(composeName('ישראל', 'כהן')).toBe('ישראל כהן');
    expect(composeName(' ', 'כהן')).toBe('כהן');
    expect(composeName('', '')).toBe('');
  });

  it('supLastNameKey — השדה המפוצל; לא פוצל ⇒ השם המלא', () => {
    expect(supLastNameKey({ name: 'ישראל כהן', lastName: 'כהן' })).toBe('כהן');
    expect(supLastNameKey({ name: 'כהן ישראל' })).toBe('כהן ישראל');
  });
});

describe('🔎 סינון ומיון לפי שם-משפחה', () => {
  const list = [
    sp('a', { name: 'ישראל כהן', firstName: 'ישראל', lastName: 'כהן' }),
    sp('b', { name: 'דוד לוי', firstName: 'דוד', lastName: 'לוי' }),
    sp('c', { name: 'כהן משה' }), // עוד לא פוצל — נמצא דרך השם המלא
  ];

  it('סינון "כהן" — לפי שם-משפחה, ובתורם שלא פוצל לפי השם המלא', () => {
    expect(run(list, { lastNameF: 'כהן' })).toEqual(['a', 'c']);
  });

  it('לא תופס שם-פרטי בתורם שפוצל ("ישראל" אינו שם-משפחה של a)', () => {
    expect(run(list, { lastNameF: 'ישראל' })).toEqual([]);
  });

  it('סינון ריק/חסר ⇒ אפס-השפעה', () => {
    expect(run(list, {})).toEqual(['a', 'b', 'c']);
    expect(run(list, { lastNameF: '  ' })).toEqual(['a', 'b', 'c']);
  });

  it('מיון לפי שם-משפחה (עולה)', () => {
    expect(sortSupporterList(list, new Map(), 'lastName', 1, 3.7).map((s) => s.id)).toEqual(['a', 'c', 'b']);
  });

  it('החיפוש הכללי מוצא גם לפי השדות המפוצלים; בלי פיצול — טקסט-חיפוש ביט-זהה', () => {
    const odd = sp('x', { name: 'ר׳ ישראל', lastName: 'גולדברג' });
    expect(searchTextOf({} as never, odd)).toContain('גולדברג');
    const plain = sp('y', { name: 'דוד', email: 'd@x.com' });
    expect(searchTextOf({} as never, plain)).toBe(searchTextOf({} as never, { ...plain }));
    expect(searchTextOf({} as never, plain).endsWith(' ')).toBe(false);
  });
});

describe('📥 ייבוא — עמודות שם פרטי/משפחה', () => {
  it('🐛 שתי העמודות נקלטות (קודם — "שם" תפס אחת ואיבד את השנייה), והשם המלא מצורף', () => {
    const rows = parseSupporterGrid([['שם פרטי', 'שם משפחה', 'טלפון'], ['ישראל', 'כהן', '050-1234567']]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: 'ישראל כהן', firstName: 'ישראל', lastName: 'כהן', phone: '050-1234567' });
  });

  it('עמודת "שם" מלאה + פרטי/משפחה — השם המלא מהעמודה, השדות המפוצלים נשמרים', () => {
    const rows = parseSupporterGrid([['שם', 'שם פרטי', 'שם משפחה'], ['כהן ישראל', 'ישראל', 'כהן']]);
    expect(rows[0]).toMatchObject({ name: 'כהן ישראל', firstName: 'ישראל', lastName: 'כהן' });
  });

  it('קובץ רגיל (עמודת שם אחת) — בלי שדות מפוצלים (ביט-זהה)', () => {
    const rows = parseSupporterGrid([['שם', 'טלפון'], ['כהן ישראל', '050']]);
    expect('firstName' in rows[0]).toBe(false);
    expect('lastName' in rows[0]).toBe(false);
  });

  it('התאמה לתורם קיים בסדר הפוך — מעדכן ולא יוצר כפיל, והשם-על-הקבלה הקיים נשמר', () => {
    const existing = [sp('k', { name: 'כהן ישראל' })];
    const plan = planSupporterImport([{ name: 'ישראל כהן', firstName: 'ישראל', lastName: 'כהן', phone: '', email: '', idNum: '', address: '', cat: '', forWho: '' }], existing);
    expect(plan.inserts).toHaveLength(0);
    expect(plan.updates).toHaveLength(1);
    const merged = mergeSupporterRow(existing[0], plan.updates[0].row);
    expect(merged.name).toBe('כהן ישראל'); // לא נהפך
    expect(merged).toMatchObject({ firstName: 'ישראל', lastName: 'כהן' });
  });

  it('תורם חדש מהייבוא — השדות המפוצלים נשמרים', () => {
    const s = newSupporterFromRow('n1', { name: 'ישראל כהן', firstName: 'ישראל', lastName: 'כהן', phone: '', email: '', idNum: '', address: '', cat: '', forWho: '' });
    expect(s).toMatchObject({ firstName: 'ישראל', lastName: 'כהן' });
  });
});

describe('🔗 מיזוג כפולים — השם המפוצל לא נבלע', () => {
  it('לשומר אין, לנמחק יש ⇒ עובר לשומר', () => {
    const m = mergeSupporterInto(sp('k', { name: 'כהן' }), sp('d', { firstName: 'ישראל', lastName: 'כהן' }));
    expect(m).toMatchObject({ firstName: 'ישראל', lastName: 'כהן' });
  });
  it('לאף אחד אין ⇒ המפתחות לא נוצרים (ביט-זהה)', () => {
    const m = mergeSupporterInto(sp('k'), sp('d'));
    expect('firstName' in m || 'lastName' in m).toBe(false);
  });
});

describe('🛡 הגנות-מקור — הטופס לא דורס את השם-על-הקבלה, והמסך מחווט', () => {
  it('הקלדת פרטי/משפחה ממלאת את השם המלא רק כשהוא ריק או עדיין הצירוף הקודם', () => {
    expect(formSrc).toContain('const follows = !p.name.trim() || p.name.trim() === composeName(p.firstName, p.lastName);');
  });
  it('המפתחות נכתבים רק כשיש ערך', () => {
    expect(formSrc).toContain('...(fn ? { firstName: fn } : {}), ...(ln ? { lastName: ln } : {})');
  });
  it('עמודה + סינון בשורת-הסינון + מיון, מגודר supporters.lastname', () => {
    expect(viewSrc).toContain("const lastNameOn = featureOn(config, 'supporters.lastname');");
    expect(viewSrc).toContain("{lastNameOn && <td>{sp.lastName || '—'}</td>}");
    expect(viewSrc).toContain('aria-label="סינון לפי שם משפחה"');
    expect(viewSrc).toContain("(lastNameOn && h.key === 'lastName')");
  });
});
