/** בדיקות מנוע הביקורת — כל קטגוריה עם fixture ייעודי. */
import { describe, expect, it } from 'vitest';
import { runAudit, phoneIssue } from '../audit';
import { emptyDb, emptyFamily } from '../../types/domain';
import type { Db, Family } from '../../types/domain';

function fam(over: Partial<Omit<Family, 'createdAt'>>): Family {
  return { ...emptyFamily(), createdAt: '2020-01-01', id: over.id ?? 'f' + Math.random().toString(36).slice(2, 7), ...over };
}
function db(families: Family[], extra: Partial<Db> = {}): Db {
  return { ...emptyDb(), families, ...extra };
}
const cats = (db_: Db) => new Set(runAudit(db_).map((i) => i.cat));

describe('phoneIssue', () => {
  it('תקין: 10 ספרות עם 0', () => expect(phoneIssue('050-1234567')).toBeNull());
  it('חסר 0 מוביל (8 ספרות)', () => expect(phoneIssue('52123456')).toMatch(/0 מובילה/));
  it('לא מתחיל ב-0 (9 ספרות)', () => expect(phoneIssue('521234567')).toMatch(/לא מתחיל/));
  it('קצר מדי', () => expect(phoneIssue('12345')).toMatch(/קצר/));
  it('ריק לא בעיה', () => expect(phoneIssue('')).toBeNull());
});

describe('runAudit — קטגוריות', () => {
  it('כפילות שם+אם', () => {
    const d = db([
      fam({ id: 'a', name: 'כהן', mother: 'רבקה', phone: '050-1111111', city: 'בני ברק', address: 'רח 1' }),
      fam({ id: 'b', name: 'כהן', mother: 'רבקה', phone: '050-2222222', city: 'בני ברק', address: 'רח 2' }),
    ]);
    expect(cats(d).has('כפילות')).toBe(true);
  });

  it('כפילות טלפון משותף', () => {
    const d = db([
      fam({ id: 'a', name: 'לוי', phone: '050-9999999', city: 'ק', address: 'א' }),
      fam({ id: 'b', name: 'מזרחי', phone: '050-9999999', city: 'ק', address: 'ב' }),
    ]);
    expect(runAudit(d).some((i) => i.cat === 'כפילות' && i.title.includes('טלפון'))).toBe(true);
  });

  it('ת"ז לא תקינה', () => {
    const d = db([fam({ name: 'א', fatherId: '123456789', phone: '050-1234567', city: 'ק', address: 'א' })]);
    expect(cats(d).has('ת"ז')).toBe(true);
  });

  it('טלפון חסר 0', () => {
    const d = db([fam({ name: 'ב', phone: '521234567', city: 'ק', address: 'א' })]);
    expect(cats(d).has('טלפון')).toBe(true);
  });

  it('אימייל לא תקין', () => {
    const d = db([fam({ name: 'ג', phone: '050-1234567', email: 'not-an-email', city: 'ק', address: 'א' })]);
    expect(cats(d).has('אימייל')).toBe(true);
  });

  it('כתובת חסרה (משפחה פעילה בלי עיר)', () => {
    const d = db([fam({ name: 'ד', phone: '050-1234567', status: 'active', city: '' })]);
    expect(cats(d).has('כתובת')).toBe(true);
  });

  it('לוגיקה: תשלום יתר', () => {
    const f = fam({ id: 'p', name: 'פרץ', phone: '050-1234567', city: 'ק', address: 'א' });
    f.members = [{ ...f.members[0] } as never].length ? f.members : f.members;
    const mId = 'm1';
    f.members = [{ id: mId, first: 'רוני', isParent: false, gender: 'm', birth: '2015-01-01', idNum: '', phone: '', phone2: '', school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false, mPhotos: false, mVideo: false } as never];
    const d = db([f], {
      enrollments: [{ id: 'e1', memberId: mId, courseId: 'c1', plan: 'monthly', status: 'active', enrolledAt: '2024-01-01', group: '', totalDue: 100, purchased: 0, used: 0, payments: [{ rid: 'R-1', amount: 200, date: '2024-02-01', method: 'מזומן' }], absences: [] } as never],
    });
    expect(runAudit(d).some((i) => i.cat === 'לוגיקה' && i.title.includes('יותר'))).toBe(true);
  });

  it('ילדים: חסר תאריך לידה', () => {
    const f = fam({ name: 'ה', phone: '050-1234567', city: 'ק', address: 'א' });
    f.members = [{ id: 'k1', first: 'יוסי', isParent: false, gender: 'm', birth: '', idNum: '', phone: '', phone2: '', school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false, mPhotos: false, mVideo: false } as never];
    expect(cats(db([f])).has('ילדים')).toBe(true);
  });

  it('קשר: אין שום פרט', () => {
    const d = db([fam({ name: 'ו', phone: '', phone2: '', email: '', city: 'ק', address: 'א' })]);
    expect(cats(d).has('קשר')).toBe(true);
  });

  it('נתונים תקינים → אין ממצאים', () => {
    const d = db([fam({ name: 'תקין', phone: '050-1234567', email: 'a@b.com', city: 'ק', address: 'רח 1', maritalStatus: 'נשואים', father: 'משה', mother: 'שרה' })]);
    expect(runAudit(d).length).toBe(0);
  });
});
