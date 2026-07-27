/**
 * רצ'ט — זיהוי כפילויות ומיזוג משפחות. הבטיחות הקריטית: מיזוג לא מאבד אף בן-משפחה
 * או מסמך (השיבוצים תלויים במזהי בני-המשפחה), ממלא שדות ריקים, וממזג נכון.
 */
import { describe, expect, it } from 'vitest';
import { findDuplicateGroups, mergeFamilies, normPhone } from '../dedup';
import type { Family } from '../../types/domain';

function fam(p: Partial<Family> & { id: string }): Family {
  return {
    name: 'משפחה',
    father: '',
    fatherId: '',
    mother: '',
    motherId: '',
    phone: '',
    phone2: '',
    email: '',
    city: '',
    address: '',
    community: '',
    maritalStatus: '',
    language: '',
    tzedaka: '',
    fullSefach: false,
    discount: '',
    status: 'active',
    notes: '',
    members: [],
    docs: [],
    cred: { score: 700, log: [] },
    createdAt: '2024-01-01',
    ...p,
  };
}
const mem = (id: string, first: string) =>
  ({ id, first, gender: 'm', birth: '', idNum: '', phone: '', phone2: '', school: '', grade: '', health: '' }) as Family['members'][number];
const doc = (id: string, name: string) => ({ id, name, addedAt: '2024-01-01' });

describe('normPhone', () => {
  it('מנרמל ספרות + קידומת 972', () => {
    expect(normPhone('054-123-4567')).toBe('0541234567');
    expect(normPhone('+972541234567')).toBe('0541234567');
  });
});

describe('findDuplicateGroups', () => {
  it('מקבץ לפי טלפון משותף', () => {
    const g = findDuplicateGroups([
      fam({ id: 'a', phone: '054-1112222' }),
      fam({ id: 'b', phone: '0541112222' }),
      fam({ id: 'c', phone: '03-9999999' }),
    ]);
    expect(g.length).toBe(1);
    expect(new Set(g[0])).toEqual(new Set(['a', 'b']));
  });
  it('מקבץ לפי שם+עיר זהים', () => {
    const g = findDuplicateGroups([
      fam({ id: 'a', name: 'כהן', city: 'ירושלים' }),
      fam({ id: 'b', name: 'כהן', city: 'ירושלים' }),
      fam({ id: 'c', name: 'לוי', city: 'ירושלים' }),
    ]);
    expect(g.length).toBe(1);
    expect(new Set(g[0])).toEqual(new Set(['a', 'b']));
  });
  it('טרנזיטיביות: a~b (טלפון) + b~c (שם) → קבוצה אחת', () => {
    const g = findDuplicateGroups([
      fam({ id: 'a', name: 'כהן', city: 'י-ם', phone: '0541112222' }),
      fam({ id: 'b', name: 'כהן', city: 'י-ם', phone: '0533334444' }),
      fam({ id: 'c', name: 'אחר', phone: '0533334444' }),
    ]);
    expect(g.length).toBe(1);
    expect(new Set(g[0])).toEqual(new Set(['a', 'b', 'c']));
  });
  it('אין כפילות → אין קבוצות', () => {
    expect(findDuplicateGroups([fam({ id: 'a', phone: '0541112222' }), fam({ id: 'b', phone: '0549998888' })])).toEqual([]);
  });
});

describe('🔒 ratchet — mergeFamilies (אפס אובדן נתונים)', () => {
  it('מאחד בני-משפחה ומסמכים בלי לאבד (שיבוצים תלויים במזהים)', () => {
    const keeper = fam({ id: 'k', members: [mem('m1', 'א')], docs: [doc('d1', 'ספח')] });
    const loser = fam({ id: 'l', members: [mem('m2', 'ב'), mem('m1', 'א')], docs: [doc('d2', 'המלצה')] });
    const m = mergeFamilies(keeper, [loser]);
    expect(m.members.map((x) => x.id).sort()).toEqual(['m1', 'm2']); // דה-דופ, שניהם נשמרו
    expect(m.docs.map((x) => x.id).sort()).toEqual(['d1', 'd2']);
  });
  it('ממלא שדות ריקים בשומר מה-losers', () => {
    const keeper = fam({ id: 'k', name: 'כהן', email: '' });
    const loser = fam({ id: 'l', email: 'a@b.com', address: 'רחוב 1' });
    const m = mergeFamilies(keeper, [loser]);
    expect(m.email).toBe('a@b.com');
    expect(m.address).toBe('רחוב 1');
    expect(m.name).toBe('כהן'); // של השומר לא נדרס
  });
  it('שדה לא-ריק בשומר לא נדרס', () => {
    const m = mergeFamilies(fam({ id: 'k', email: 'keep@x.com' }), [fam({ id: 'l', email: 'other@x.com' })]);
    expect(m.email).toBe('keep@x.com');
  });
  it('phone2 מתמלא מטלפון שונה; מוני ילדים = מקסימום; ספח = OR', () => {
    const keeper = fam({ id: 'k', phone: '0541112222', kidsHome: 2, kidsMarried: 1, fullSefach: false });
    const loser = fam({ id: 'l', phone: '0533334444', kidsHome: 5, kidsMarried: 0, fullSefach: true });
    const m = mergeFamilies(keeper, [loser]);
    expect(m.phone).toBe('0541112222');
    expect(normPhone(m.phone2)).toBe('0533334444');
    expect(m.kidsHome).toBe(5);
    expect(m.kidsMarried).toBe(1);
    expect(m.fullSefach).toBe(true);
  });
  it('סטטוס = הגבוה ביותר, createdAt = המוקדם, הערות עם סמן מיזוג', () => {
    const keeper = fam({ id: 'k', status: 'inactive', createdAt: '2024-05-01', notes: 'הערה א' });
    const loser = fam({ id: 'l', name: 'כפילה', status: 'active', createdAt: '2023-01-01', notes: 'הערה ב' });
    const m = mergeFamilies(keeper, [loser]);
    expect(m.status).toBe('active');
    expect(m.createdAt).toBe('2023-01-01');
    expect(m.notes).toContain('| מוזג: כפילה');
    expect(m.notes).toContain('הערה א');
  });
  it('אינו משנה את אובייקטי הקלט (טהור)', () => {
    const keeper = fam({ id: 'k', email: '' });
    const loser = fam({ id: 'l', email: 'x@y.com' });
    mergeFamilies(keeper, [loser]);
    expect(keeper.email).toBe(''); // המקור לא זז
  });
});
