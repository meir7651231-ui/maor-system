/**
 * ratchet — SHOP8 מנוע מקדים-הצורך. הצעות נגזרות (לא פעולות): גיל בית-ספר,
 * תינוק, כרטיסייה נגמרת, חג מתקרב. ביטול דרך attnDone. אפס נגיעה בכסף.
 */
import { describe, expect, it } from 'vitest';
import { emptyDb } from '../../../types/domain';
import type { Db, Enrollment, Family } from '../../../types/domain';
import { liveSuggestions, suggestions } from '../lib';
import libSrc from '../lib.ts?raw';

const fam = (id: string, name: string, members: Array<{ id: string; first: string; birth: string; isParent?: boolean }>): Family =>
  ({ id, name, status: 'active', members: members.map((m) => ({ ...m, isParent: m.isParent ?? false })) }) as unknown as Family;

const enr = (id: string, memberId: string, courseId: string, purchased: number, used: number): Enrollment =>
  ({ id, memberId, courseId, plan: 'punch', purchased, used, status: 'active' }) as unknown as Enrollment;

const TODAY = '2026-11-15';

function baseDb(): Db {
  return {
    ...emptyDb(),
    families: [
      fam('fA', 'כהן', [
        { id: 'm6', first: 'יוסי', birth: '2020-05-01' }, // גיל 6 → בית-ספר
        { id: 'm0', first: 'תינוק', birth: '2026-05-01' }, // גיל 0 → תינוק
        { id: 'mp', first: 'אבא', birth: '1990-01-01', isParent: true }, // הורה — מדולג
      ]),
    ],
    courses: [{ id: 'c1', name: 'התעמלות' }] as unknown as Db['courses'],
    enrollments: [enr('e1', 'm6', 'c1', 10, 9)], // נותר 1 → חידוש
  };
}

const byPrefix = <T extends { key: string }>(list: T[], p: string): T[] => list.filter((s) => s.key.startsWith(p));

describe('💡 ratchet — SHOP8 מנוע מקדים-הצורך', () => {
  it('גיל בית-ספר (6) → הצעת ערכת-בית-ספר', () => {
    const s = byPrefix(suggestions(baseDb(), TODAY), 'sug:school:');
    expect(s).toHaveLength(1);
    expect(s[0].key).toBe('sug:school:m6');
    expect(s[0].act).toBe('families');
  });

  it('תינוק (גיל 0) → הצעת ערכת-תינוק', () => {
    const s = byPrefix(suggestions(baseDb(), TODAY), 'sug:baby:');
    expect(s).toHaveLength(1);
    expect(s[0].key).toBe('sug:baby:m0');
  });

  it('כרטיסייה שנותר בה ≤2 → הצעת חידוש (act=courses)', () => {
    const s = byPrefix(suggestions(baseDb(), TODAY), 'sug:renew:');
    expect(s).toHaveLength(1);
    expect(s[0].act).toBe('courses');
    expect(s[0].detail).toContain('נותרו 1');
  });

  it('הורה מדולג; משפחה לא-פעילה לא מייצרת הצעות', () => {
    const db = baseDb();
    db.families[0] = { ...db.families[0], status: 'paused' } as unknown as Family;
    expect(byPrefix(suggestions(db, TODAY), 'sug:school:')).toHaveLength(0);
    expect(byPrefix(suggestions(db, TODAY), 'sug:baby:')).toHaveLength(0);
  });

  it('ביטול דרך attnDone — הצעה שסומנה "טופל" יוצאת מ-liveSuggestions', () => {
    const db = baseDb();
    db.attnDone = { 'sug:school:m6': '2026-11-15' };
    const live = liveSuggestions(db, TODAY);
    expect(live.some((s) => s.key === 'sug:school:m6')).toBe(false);
    expect(live.some((s) => s.key === 'sug:baby:m0')).toBe(true); // אחרים נשארים
  });

  it('🛡 בידוד — המנוע לא נוגע בכסף/קבלות', () => {
    for (const kw of ['receiptSeq', 'donationSeq', 'shopReceiptSeq', 'setDb', 'upsert']) {
      expect(libSrc).not.toContain(kw);
    }
  });
});
