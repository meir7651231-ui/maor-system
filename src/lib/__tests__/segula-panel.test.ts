/**
 * ratchet — פאנל-הסגולה בכרטיס (בקשת-בעלים 6.9 "תבדוק מה קורה עם הכפתור של 40 יום"):
 * אחרי הלחיצה הכפתור נעלם ונשארה שורת-מצב קטנה — בלי לראות את 5 התזכורות, בלי לסמן
 * ✓, בלי לבטל ובלי להתחיל מחדש. עכשיו: segulaStatus מחזיר reminders (ריצה נוכחית
 * בלבד) + lastEnd; cancelSegula/restartSegula/toggleEventDone בסטור; הפאנל בכרטיס.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { segulaReminders, segulaStatus, SEGULA_NOTE_PREFIX, stripSegulaNote } from '../../components/supporters/lib';
import { emptyDb } from '../../types/domain';
import type { Db, Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';

const TODAY = '2026-09-06';
const sup = (id: string, over: Partial<Supporter> = {}): Supporter =>
  ({ id, name: 'תורם ' + id, phone: '050-1', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', nextNote: '', donations: [], ...over }) as unknown as Supporter;
const evs = (spId: string, start: string, prefix = 'e') =>
  segulaReminders(start).map((r, i) => ({ id: prefix + i, spId, type: 'call', date: r.date, notes: SEGULA_NOTE_PREFIX + '40 יום · זיווג', done: i === 0 }));

describe('segulaStatus — רשימת-תזכורות, ריצה-נוכחית, סיום-קודם', () => {
  it('reminders = 5 עם id/יום/בוצע/סיום; day מחושב מההתחלה', () => {
    const st = segulaStatus(evs('s1', '2026-08-30'), 's1', TODAY);
    expect(st.active).toBe(true);
    expect(st.reminders.map((r) => r.day)).toEqual([1, 7, 21, 35, 40]);
    expect(st.reminders.map((r) => r.id)).toEqual(['e0', 'e1', 'e2', 'e3', 'e4']);
    expect(st.reminders[0].done).toBe(true);
    expect(st.reminders[4].final).toBe(true);
    expect(st.lastEnd).toBe(st.end);
  });
  it('ריצה קודמת שהסתיימה לא מזייפת את המונים של הריצה הנוכחית', () => {
    const old = evs('s1', '2026-05-01', 'o'); // הסתיימה 10.6
    const st = segulaStatus([...old, ...evs('s1', '2026-08-30')], 's1', TODAY);
    expect(st.total).toBe(5);
    expect(st.done).toBe(1);
    expect(st.reminders.every((r) => r.id.startsWith('e'))).toBe(true);
    expect(st.start).toBe('2026-08-30');
  });
  it('אחרי הסיום ⇒ לא פעילה אבל lastEnd מוצג; בלי אירועים ⇒ lastEnd ריק', () => {
    const st = segulaStatus(evs('s1', '2026-06-01'), 's1', TODAY);
    expect(st.active).toBe(false);
    expect(st.lastEnd).toBe('2026-07-11');
    expect(segulaStatus([], 's1', TODAY).lastEnd).toBe('');
  });
  it('stripSegulaNote מסיר רק את שורת-הסגולה', () => {
    expect(stripSegulaNote('🕯 סגולת 40 יום · זיווג — מ-06/09, סיום 16/10\nלדבר על החתונה')).toBe('לדבר על החתונה');
    expect(stripSegulaNote('לדבר על החתונה')).toBe('לדבר על החתונה');
    expect(stripSegulaNote('')).toBe('');
  });
});

describe('cancelSegula / restartSegula / toggleEventDone', () => {
  beforeEach(() => {
    const db: Db = { ...emptyDb(), supporters: [sup('a'), sup('b', { nextDate: '2026-12-01', nextNote: 'חתונה' })] };
    useApp.getState().setDb(() => db);
  });
  const evsOf = (id: string) => useApp.getState().db.events.filter((e) => e.spId === id);
  const spOf = (id: string) => useApp.getState().db.supporters.find((s) => s.id === id)!;

  it('ביטול: 5 האירועים יורדים, שורת-הסגולה יורדת מההערה, יעד-קשר שהיה תזכורת מתנקה', () => {
    useApp.getState().seedSegulaReminders('a', TODAY, 'זיווג');
    expect(evsOf('a').length).toBe(5);
    expect(spOf('a').nextDate).toBe('2026-09-07');
    expect(useApp.getState().cancelSegula('a')).toBe(5);
    expect(evsOf('a').length).toBe(0);
    expect(spOf('a').nextDate).toBe('');
    expect(spOf('a').nextNote).toBe('');
    // בלי סגולה ⇒ 0, שום דבר לא נגע
    expect(useApp.getState().cancelSegula('a')).toBe(0);
  });
  it('ביטול שומר יעד-קשר והערה שאינם של הסגולה', () => {
    useApp.getState().seedSegulaReminders('b', TODAY, 'זיווג');
    const b1 = spOf('b');
    expect(b1.nextDate).toBe('2026-09-07'); // 1.12 מאוחר מהתזכורת הראשונה ⇒ הוחלף
    expect(b1.nextNote).toContain('חתונה');
    useApp.getState().cancelSegula('b');
    const b2 = spOf('b');
    expect(b2.nextNote).toBe('חתונה');
    expect(b2.nextDate).toBe(''); // היעד היה תזכורת-סגולה ⇒ מתנקה (היעד המקורי 1.12 כבר הוחלף בזריעה)
  });
  it('התחלה-מחדש: 5 אירועים חדשים מהתאריך החדש בלבד; toggleEventDone הופך בוצע', () => {
    useApp.getState().seedSegulaReminders('a', '2026-08-30', 'זיווג');
    const firstId = evsOf('a')[0].id;
    useApp.getState().toggleEventDone(firstId);
    expect(evsOf('a').find((e) => e.id === firstId)!.done).toBe(true);
    useApp.getState().toggleEventDone(firstId);
    expect(evsOf('a').find((e) => e.id === firstId)!.done).toBe(false);
    expect(useApp.getState().restartSegula('a', TODAY, 'זיווג')).toBe(5);
    const after = evsOf('a');
    expect(after.length).toBe(5);
    expect(after.every((e) => e.date >= '2026-09-07')).toBe(true);
    expect(segulaStatus(useApp.getState().db.events, 'a', TODAY).start).toBe(TODAY);
    expect(spOf('a').nextDate).toBe('2026-09-07');
  });
  it('הכרטיס: פאנל עם רשימת-תזכורות, התחלה-מחדש וביטול בחימוש דו-לחיצתי; כפתור-הזריעה חוזר אחרי הסיום עם "סגולה קודמת" (הגנת-מקור)', () => {
    const src = readFileSync(new URL('../../components/supporters/SupporterDetail.tsx', import.meta.url), 'utf8');
    expect(src).toContain('segula.reminders.map((r) =>');
    expect(src).toContain('onClick={() => r.id && toggleEventDone(r.id)}');
    expect(src).toContain("segConfirm('seg-restart'");
    expect(src).toContain("segConfirm('seg-cancel'");
    expect(src).toContain("restartSegula(sp.id, isoToday(), 'זיווג')");
    expect(src).toContain('cancelSegula(sp.id)');
    expect(src).toContain("'🕯 סגולה קודמת הסתיימה ב-'");
    expect(src).toContain('{segulaOn && !segula?.active && (');
  });
});
