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
  it('גיל בית-ספר (6) → הצעת ערכת-בית-ספר; הגיל במפתח (ביטול פר-שנת-גיל)', () => {
    const s = byPrefix(suggestions(baseDb(), TODAY), 'sug:school:');
    expect(s).toHaveLength(1);
    expect(s[0].key).toBe('sug:school:m6:6');
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
    db.attnDone = { 'sug:school:m6:6': '2026-11-15' };
    const live = liveSuggestions(db, TODAY);
    expect(live.some((s) => s.key === 'sug:school:m6:6')).toBe(false);
    expect(live.some((s) => s.key === 'sug:baby:m0')).toBe(true); // אחרים נשארים
  });

  // ratchet — הבאג: מפתחות 'sug:' פטורים מגיזום-30-הימים (useApp postLoad), ולכן
  // מפתח בלי רכיב-מחזוריות קבר ביטול חד-פעמי לנצח: "מתנת-חג · פסח" שבוטלה פעם לא
  // חזרה בשום שנה; ביטול-חידוש-כרטיסייה לא חזר אחרי מילוי; ומפתח-בית-ספר יחיד
  // כיסה גם גיל 5 וגם גיל 6.
  describe('🔁 ratchet — מחזוריות במפתחות הביטול (הפטור-מגיזום של sug:)', () => {
    it('חג: השנה העברית במפתח — ביטול חנוכה תשפ"ז לא מסתיר את חנוכה תשפ"ח', () => {
      const db = baseDb();
      // 2026-11-15 → חנוכה ה׳תשפ"ז בתוך 30 יום; 2027-12-01 → חנוכה ה׳תשפ"ח
      const y1 = byPrefix(suggestions(db, '2026-11-15'), 'sug:holiday:');
      const y2 = byPrefix(suggestions(db, '2027-12-01'), 'sug:holiday:');
      expect(y1).toHaveLength(1);
      expect(y2).toHaveLength(1);
      expect(y1[0].key).toMatch(/^sug:holiday:.+:\d{4}$/);
      expect(y1[0].key).not.toBe(y2[0].key); // אותו חג — שנה עברית אחרת = מפתח אחר
      db.attnDone = { [y1[0].key]: '2026-11-15' };
      expect(liveSuggestions(db, '2027-12-01').some((s) => s.key === y2[0].key)).toBe(true);
    });

    it('בית-ספר: ביטול בגיל 5 לא מסתיר את ההצעה בגיל 6', () => {
      const db = baseDb();
      db.families = [fam('fB', 'לוי', [{ id: 'mk', first: 'דניאל', birth: '2021-05-01' }])];
      db.enrollments = [];
      const at5 = byPrefix(suggestions(db, '2026-11-15'), 'sug:school:');
      expect(at5[0].key).toBe('sug:school:mk:5');
      db.attnDone = { 'sug:school:mk:5': '2026-11-15' };
      const liveAt6 = liveSuggestions(db, '2027-11-15');
      expect(liveAt6.some((s) => s.key === 'sug:school:mk:6')).toBe(true);
    });

    it('חידוש כרטיסייה: purchased במפתח — אחרי מילוי, כשנגמרת שוב, ההצעה חוזרת', () => {
      const db = baseDb();
      const k1 = byPrefix(suggestions(db, TODAY), 'sug:renew:')[0].key;
      expect(k1).toBe('sug:renew:e1:10');
      db.attnDone = { [k1]: TODAY }; // המשרד ביטל את ההצעה הראשונה
      // הכרטיסייה חודשה (purchased 10→20) ונגמרה שוב (used 19) — מפתח חדש
      db.enrollments = [enr('e1', 'm6', 'c1', 20, 19)];
      const live = byPrefix(liveSuggestions(db, TODAY), 'sug:renew:');
      expect(live).toHaveLength(1);
      expect(live[0].key).toBe('sug:renew:e1:20');
    });
  });

  it('🛡 בידוד — המנוע לא נוגע בכסף/קבלות', () => {
    for (const kw of ['receiptSeq', 'donationSeq', 'shopReceiptSeq', 'setDb', 'upsert']) {
      expect(libSrc).not.toContain(kw);
    }
  });
});
