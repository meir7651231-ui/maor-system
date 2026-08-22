/**
 * ratchet — swarm-audit (21.8.2026), מודול המשפחות מול רשימת-ההמתנה + מחיקה חמושה:
 *
 * 1. עמודת/ציר "חוגים" ספרו כל שיבוץ — כולל 'ended' (כבר לא משתתף) ו-'wait'
 *    (עדיין לא משתתף) — ומשפחה עם היסטוריה-בלבד הוצגה כ"משתתפות". התיקון:
 *    famLiveEnrollments (active+paused בלבד) לציר ה-finder, ואותו סינון במונה
 *    של FamiliesView (עמודה/סינון/מיון).
 * 2. תדפיס-המשפחה וההיסטוריה הציגו שיבוץ-'wait' כרישום רגיל — נוסף '· ברשימת-המתנה'
 *    (כמו ההערות מוקפא/הסתיים).
 * 3. DedupModal 🗑 (dupDrop) מחק משפחה שלמה — כולל שיבוצים, תשלומים ורשומות קבלה —
 *    בשתי לחיצות חשופות בלי timeout ובלי אזהרה, בתוך דיאלוג שמבטיח "אין מחיקת
 *    נתונים". התיקון: useArmed (חלון 3.5ש׳ + פקיעה) + אזהרה עברית מפורשת שמפרטת
 *    מה יימחק + תווית חמושה ייעודית.
 */
import { describe, expect, it } from 'vitest';
import type { Db, Enrollment, Family } from '../../../types/domain';
import { emptyDb, emptyFamily } from '../../../types/domain';
import { famEnrollments, famLiveEnrollments, famHistoryOf, finderAxisValue } from '../lib';
import dedupSrc from '../DedupModal.tsx?raw';
import famViewSrc from '../FamiliesView.tsx?raw';
import famPanelsSrc from '../FamilyPanels.tsx?raw';

function enr(over: Partial<Enrollment>): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01', ...over,
  };
}

function fam(): Family {
  return {
    ...emptyFamily(),
    id: 'f1',
    name: 'כהן',
    createdAt: '2026-01-01',
    members: [{ id: 'm1', first: 'דנה' }] as never,
  } as Family;
}

function db(enrollments: Enrollment[]): Db {
  const d = { ...emptyDb(), enrollments };
  d.families = [fam()];
  return d;
}

describe('👪 ratchet — השתתפות-חיה בלבד (active+paused) בעמודת/ציר החוגים', () => {
  it("famLiveEnrollments: מחריג 'ended' ו-'wait', משאיר active+paused", () => {
    const d = db([
      enr({ id: 'a', status: 'active' }),
      enr({ id: 'p', status: 'paused' }),
      enr({ id: 'x', status: 'ended' }),
      enr({ id: 'w', status: 'wait' }),
    ]);
    expect(famEnrollments(d, d.families[0]).length).toBe(4); // הגולמי נשאר מלא (היסטוריה/דוחות)
    expect(famLiveEnrollments(d, d.families[0]).map((e) => e.id).sort()).toEqual(['a', 'p']);
  });
  it("ציר-finder 'enrolled': משפחה עם שיבוץ-'wait' בלבד ⇒ 'לא משתתפות'", () => {
    // הבאג: famEnrollments.length ספר גם המתנה/הסתיים ⇒ "משתתפות" בשקר
    const waiting = db([enr({ id: 'w', status: 'wait' })]);
    expect(finderAxisValue(waiting, waiting.families[0], 'enrolled')).toBe('לא משתתפות');
    const ended = db([enr({ id: 'x', status: 'ended' })]);
    expect(finderAxisValue(ended, ended.families[0], 'enrolled')).toBe('לא משתתפות');
    const live = db([enr({ id: 'a', status: 'active' })]);
    expect(finderAxisValue(live, live.families[0], 'enrolled')).toBe('משתתפות בחוגים');
  });
  it("FamiliesView (הגנת-מקור): מונה-החוגים מדלג על 'ended' ו-'wait'", () => {
    expect(famViewSrc).toContain("if (e.status === 'ended' || e.status === 'wait') continue;");
  });
});

describe('🖨 ratchet — שיבוץ-בהמתנה מסומן בתדפיס ובהיסטוריה', () => {
  it("famHistoryOf: רשומת-שיבוץ 'wait' נושאת '· ברשימת-המתנה'", () => {
    const d = { ...db([enr({ id: 'w', status: 'wait' })]) };
    d.courses = [{ id: 'c1', name: 'ציור' } as never];
    const entry = famHistoryOf(d, d.families[0]).find((h) => h.text.includes('נרשמ/ה'));
    expect(entry?.text).toContain('ברשימת-המתנה');
  });
  it("דוח-המשפחה (הגנת-מקור): 'wait' מוער כמו מוקפא/הסתיים", () => {
    expect(famPanelsSrc).toContain("e.status === 'wait' ? ' · ברשימת-המתנה'");
  });
});

describe('🛡 ratchet — DedupModal: מחיקת-רשומה (dupDrop) חמושה דרך useArmed', () => {
  it('useArmed + confirmTwice עם אזהרה מפורשת — לא שתי-לחיצות-חשופות בלי timeout', () => {
    expect(dedupSrc).toContain("import { useArmed } from '../useArmed'");
    expect(dedupSrc).toContain("confirmDrop('drop-' + f.id");
    // האזהרה מפרטת מה נמחק בפועל (שיבוצים+תשלומים) — לא "לאשר מחיקה?" סתמי
    expect(dedupSrc).toContain('🗑 בטוח? ימחקו גם שיבוצים ותשלומים');
    expect(dedupSrc).toContain('יימחקו גם ה');
    // הדפוס הישן — state ידני בלי פקיעה — לא קיים יותר
    expect(dedupSrc).not.toContain('setDropArmed');
  });
});
