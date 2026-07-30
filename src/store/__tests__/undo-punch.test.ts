/**
 * ratchet — undoPunch מחזיר את הדלתא המדויקת (P1.8).
 *
 * מקור האמת: legacy-main-script.js:3372 (mgUndo) — הביטול מאתר את רשומת
 * ה-Check-in החיובית האחרונה בלוג האמינות (delta>0, reason מתחיל
 * 'נוכחות (Check-in)' — כולל רשומות שהוגדלו במקדם מגמה), מסיר אותה, מוריד את
 * הציון ב-delta בפועל ורושם החזר -delta. אין רשומה כזו → נפילה ל-‎-5 (addCred).
 * הבאג שנעול: ה-React הניח ‎-5 קבוע גם כשהניקוב זיכה +8 (מקדם מגמה).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb, emptyFamily } from '../../types/domain';
import type { CredLogEntry, Db, Enrollment, Member } from '../../types/domain';

function member(id: string): Member {
  return {
    id, first: 'רוני', gender: 'm', birth: '', idNum: '', phone: '', phone2: '',
    school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false,
    mPhotos: false, mVideos: false, notes: '',
  };
}
function enr(used: number): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'punch', purchased: 10, used, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '',
    enrolledAt: '2026-01-01',
  };
}

function seed(log: CredLogEntry[], used = 3): Db {
  return {
    ...emptyDb(),
    families: [{ ...emptyFamily(), id: 'f1', createdAt: '2026-01-01', name: 'כהן', members: [member('m1')], cred: { score: 700, log } }],
    enrollments: [enr(used)],
  };
}

beforeEach(() => {
  useApp.getState().setDb(() => seed([]));
});

describe('↩ ratchet — undoPunch (legacy:3372 mgUndo)', () => {
  it('מחזיר את הדלתא בפועל (8, מקדם מגמה) — לא הנחת ‎-5; הרשומה מוסרת ונרשם החזר', () => {
    useApp.getState().setDb(() => seed([
      { date: '2026-07-29', delta: 8, reason: 'נוכחות (Check-in) (מקדם מגמה 1.6)' },
      { date: '2026-07-20', delta: 5, reason: 'נוכחות (Check-in)' },
    ]));
    useApp.getState().undoPunch('e1');
    const db = useApp.getState().db;
    expect(db.enrollments[0].used).toBe(2);
    const f = db.families[0];
    expect(f.cred.score).toBe(692); // ‎700-8, לא 695
    expect(f.cred.log[0].delta).toBe(-8);
    expect(f.cred.log[0].reason).toBe('ביטול ניקוב — החזר מדויק של ניקוד הנוכחות');
    // הרשומה שהוסרה היא ה-Check-in הראשונה; השנייה נשארת
    expect(f.cred.log.filter((l) => l.reason.startsWith('נוכחות (Check-in)'))).toHaveLength(1);
    expect(f.cred.log[1].delta).toBe(5);
  });

  it('אין רשומת Check-in בלוג → נפילה ל-‎-5 (כמו בלגאסי)', () => {
    useApp.getState().setDb(() => seed([{ date: '2026-07-01', delta: 15, reason: 'פעולה קהילתית (תרומה/עזרה)' }]));
    useApp.getState().undoPunch('e1');
    const db = useApp.getState().db;
    expect(db.enrollments[0].used).toBe(2);
    expect(db.families[0].cred.score).toBe(695);
    expect(db.families[0].cred.log[0].delta).toBe(-5);
    // רשומת הפעולה הקהילתית לא נגעה
    expect(db.families[0].cred.log.some((l) => l.delta === 15)).toBe(true);
  });

  it('אין ניקוב לביטול (used=0) → כלום לא משתנה', () => {
    useApp.getState().setDb(() => seed([{ date: '2026-07-29', delta: 5, reason: 'נוכחות (Check-in)' }], 0));
    useApp.getState().undoPunch('e1');
    const db = useApp.getState().db;
    expect(db.enrollments[0].used).toBe(0);
    expect(db.families[0].cred.score).toBe(700);
    expect(db.families[0].cred.log).toHaveLength(1);
  });
});
