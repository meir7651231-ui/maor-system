/**
 * ratchet — סגולת 40 יום (בקשת-בעלים 3.9 "למה לא מופיע 40 יום"): הכפתור זרע 5 תזכורות
 * ליומן בלבד — "קשר הבא" בכרטיס לא השתנה ושום מצב לא הוצג ⇒ נראה כאילו לא קרה כלום.
 * עכשיו: (א) segulaStatus נגזר מאירועי-הלוח ומוצג בכרטיס; (ב) הזריעה רושמת יעד+הערה
 * בקשר-הבא; (ג) סגולה פעילה לא נזרעת פעמיים. וגם: ayinOnBoard — 'הושלם' יורד מהלוח.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { segulaReminders, segulaStatus, SEGULA_NOTE_PREFIX } from '../../components/supporters/lib';
import { ayinOnBoard, ayinActive } from '../ayin';
import { emptyAyin, emptyDb } from '../../types/domain';
import type { Db, Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';

const TODAY = '2026-09-03';
const sup = (id: string, over: Partial<Supporter> = {}): Supporter =>
  ({ id, name: 'תורם ' + id, phone: '050-1', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', nextNote: '', donations: [], ...over }) as unknown as Supporter;

describe('ayinOnBoard — הושלם יורד מהלוח (הכרעת-בעלים 3.9)', () => {
  it("'done' פעיל אך לא בלוח; שלבים אחרים בלוח; ריק/חסר לא", () => {
    expect(ayinActive({ ...emptyAyin(), stage: 'done' })).toBe(true);
    expect(ayinOnBoard({ ...emptyAyin(), stage: 'done' })).toBe(false);
    expect(ayinOnBoard({ ...emptyAyin(), stage: 'lead' })).toBe(true);
    expect(ayinOnBoard({ ...emptyAyin(), stage: 'new', names: [{ id: 'n', name: 'א', eyes: '', done: false }] })).toBe(true);
    expect(ayinOnBoard(emptyAyin())).toBe(false);
    expect(ayinOnBoard(undefined)).toBe(false);
  });
  it('הלוח והמונה בכותרת משתמשים ב-ayinOnBoard; סינון "הושלם" עדיין מציג', () => {
    const board = readFileSync(new URL('../../components/supporters/AyinBoard.tsx', import.meta.url), 'utf8');
    const view = readFileSync(new URL('../../components/supporters/SupportersView.tsx', import.meta.url), 'utf8');
    expect(board).toContain('const active = visible.filter((sp) => ayinOnBoard(sp.ayin));');
    expect(board).toContain("filter === 'done' ? visible.filter((sp) => ayinActive(sp.ayin) && (sp.ayin!.stage || 'new') === 'done')");
    expect(view).toContain('visibleBase.filter((sp) => ayinOnBoard(sp.ayin)).length');
  });
});

describe('segulaStatus — מצב-הסגולה כנגזרת מאירועי-הלוח', () => {
  const evs = (spId: string, start: string) =>
    segulaReminders(start).map((r, i) => ({ id: 'e' + i, spId, type: 'call', date: r.date, notes: SEGULA_NOTE_PREFIX + '40 יום · זיווג', done: i === 0 }));
  it('בלי אירועים ⇒ לא פעילה', () => {
    expect(segulaStatus([], 's1', TODAY).active).toBe(false);
  });
  it('סגולה שהתחילה לפני 10 ימים ⇒ פעילה, יום 10/40, הבא = יום 21, סיום = יום 40, 1 בוצעה', () => {
    const st = segulaStatus(evs('s1', '2026-08-24'), 's1', TODAY);
    expect(st.active).toBe(true);
    expect(st.day).toBe(10);
    expect(st.start).toBe('2026-08-24');
    expect(st.end).toBe('2026-10-03');
    expect(st.next).toBe('2026-09-14');
    expect(st.done).toBe(1);
    expect(st.total).toBe(5);
  });
  it('אחרי הסיום ⇒ לא פעילה; אירועי תומך אחר לא נספרים', () => {
    expect(segulaStatus(evs('s1', '2026-06-01'), 's1', TODAY).active).toBe(false);
    expect(segulaStatus(evs('s2', '2026-08-24'), 's1', TODAY).active).toBe(false);
  });
});

describe('seedSegulaReminders — נרשם בקשר-הבא ולא נזרע פעמיים', () => {
  beforeEach(() => {
    const db: Db = { ...emptyDb(), supporters: [sup('a'), sup('b', { nextDate: '2026-09-02', nextNote: 'לדבר על החתונה' })] };
    useApp.getState().setDb(() => db);
  });
  it('זריעה ראשונה: 5 אירועים + nextDate = תזכורת ראשונה + שורת-הערה; זריעה שנייה = 0 ובלי כפל', () => {
    const n = useApp.getState().seedSegulaReminders('a', TODAY, 'זיווג');
    expect(n).toBe(5);
    const a = useApp.getState().db.supporters.find((s) => s.id === 'a')!;
    expect(a.nextDate).toBe('2026-09-04');
    expect(a.nextNote).toContain('סגולת 40 יום · זיווג');
    expect(useApp.getState().db.events.filter((e) => e.spId === 'a').length).toBe(5);
    expect(useApp.getState().seedSegulaReminders('a', TODAY, 'זיווג')).toBe(0);
    expect(useApp.getState().db.events.filter((e) => e.spId === 'a').length).toBe(5);
  });
  it('יעד-קשר קיים מוקדם-יותר ועתידי נשמר; ההערה הקיימת לא נמחקת', () => {
    // nextDate 2026-09-02 < today ⇒ לא "עתידי" ⇒ מוחלף בתזכורת הראשונה; ההערה נשמרת אחרי שורת-הסגולה
    useApp.getState().seedSegulaReminders('b', TODAY, 'זיווג');
    const b = useApp.getState().db.supporters.find((s) => s.id === 'b')!;
    expect(b.nextDate).toBe('2026-09-04');
    expect(b.nextNote).toContain('לדבר על החתונה');
    expect((b.nextNote ?? '').startsWith('🕯 סגולת 40 יום')).toBe(true);
  });
  it('הכרטיס מציג מצב-סגולה ומסתיר את כפתור-הזריעה כשהיא פעילה (הגנת-מקור)', () => {
    const src = readFileSync(new URL('../../components/supporters/SupporterDetail.tsx', import.meta.url), 'utf8');
    expect(src).toContain("segulaStatus(events, sp.id, isoToday())");
    expect(src).toContain("'🕯 סגולה פעילה · יום '");
    expect(src).toContain('{segulaOn && !segula?.active && (');
  });
});
