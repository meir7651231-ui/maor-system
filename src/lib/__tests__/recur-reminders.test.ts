/**
 * ratchet — 🔁 בחירת-חזרה בכפתור ה-40 יום (בקשת-בעלים 16.9 "בחירה האם חזרה יומי שבועי חודשי או 40 יום"):
 * recurDates (יומי/שבועי/חודשי-עם-קיצוץ-סוף-חודש) · recurStatus פר-סדרה (תחילית-הערה) · הסטור
 * זורע/מבטל לפי mode בלי לגעת בסגולה · הכרטיס: בורר-חזרה + כמות + פאנל לכל סדרה פעילה.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { RECUR_MODES, recurDates, recurDef, recurStatus, segulaStatus, stripRecurNote } from '../../components/supporters/lib';
import { emptyDb } from '../../types/domain';
import type { Db, Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';

const TODAY = '2026-09-16';
const sup = (id: string): Supporter =>
  ({ id, name: 'תורם ' + id, phone: '050-1', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', nextNote: '', donations: [] }) as unknown as Supporter;

describe('recurDates — דטרמיניסטי', () => {
  it('ארבעה מצבים; סגולה = 1·7·21·35·40; יומי ×3 = 3 ימים עוקבים; שבועי ×2 = +7,+14', () => {
    expect(RECUR_MODES.map((m) => m.key)).toEqual(['segula', 'daily', 'weekly', 'monthly']);
    expect(recurDates(TODAY, 'segula').map((r) => r.day)).toEqual([1, 7, 21, 35, 40]);
    expect(recurDates(TODAY, 'daily', 3).map((r) => r.date)).toEqual(['2026-09-17', '2026-09-18', '2026-09-19']);
    expect(recurDates(TODAY, 'weekly', 2).map((r) => r.date)).toEqual(['2026-09-23', '2026-09-30']);
    expect(recurDates(TODAY, 'weekly', 2)[1].final).toBe(true);
  });
  it('חודשי: 31.1 ⇒ 28.2 ⇒ 31.3 (קיצוץ לסוף-חודש בלי גלישה); ברירות-מחדל 30/12/12; cap 365', () => {
    expect(recurDates('2026-01-31', 'monthly', 3).map((r) => r.date)).toEqual(['2026-02-28', '2026-03-31', '2026-04-30']);
    expect(recurDates(TODAY, 'daily').length).toBe(30);
    expect(recurDates(TODAY, 'weekly').length).toBe(12);
    expect(recurDates(TODAY, 'monthly').length).toBe(12);
    expect(recurDates(TODAY, 'daily', 9999).length).toBe(365);
    expect(recurDef('weekly').prefix).toBe('חזרה שבועית');
  });
});

describe('recurStatus — סדרות נפרדות לפי תחילית', () => {
  const ev = (id: string, date: string, notes: string, done = false) => ({ id, spId: 'a', type: 'call', date, notes, done });
  const evs = [ev('w1', '2026-09-09', 'חזרה שבועית ×2 · זיווג · 050', true), ev('w2', '2026-09-23', 'חזרה שבועית ×2 · זיווג · 050'), ev('s1', '2026-09-17', 'סגולת 40 יום · זיווג')];
  it('שבועי: 2 תזכורות, 1 בוצעה, הבאה 23.9 (תזכורת 2 מתוך 2); הסגולה לא נספרת ולהפך', () => {
    const st = recurStatus(evs, 'a', TODAY, 'weekly');
    expect(st.active).toBe(true);
    expect(st.total).toBe(2);
    expect(st.done).toBe(1);
    expect(st.next).toBe('2026-09-23');
    expect(st.day).toBe(2);
    expect(segulaStatus(evs, 'a', TODAY).total).toBe(1);
    expect(recurStatus(evs, 'a', TODAY, 'daily').active).toBe(false);
    expect(recurStatus(evs, 'a', TODAY, 'segula')).toEqual(segulaStatus(evs, 'a', TODAY));
  });
  it('stripRecurNote מסיר רק את שורת-המצב', () => {
    expect(stripRecurNote('📆 חזרה שבועית ×2 · זיווג — מ-16/09, סיום 30/09\nחתונה', 'weekly')).toBe('חתונה');
    expect(stripRecurNote('🕯 סגולת 40 יום · זיווג — מ-16/09, סיום 26/10\nחתונה', 'weekly')).toContain('סגולת');
  });
});

describe('store — זריעה/ביטול לפי mode, הסגולה לא נפגעת', () => {
  beforeEach(() => {
    const db: Db = { ...emptyDb(), supporters: [sup('a')] };
    useApp.getState().setDb(() => db);
  });
  const evsOf = () => useApp.getState().db.events.filter((e) => e.spId === 'a');
  it('שבועי ×4 ⇒ 4 אירועים עם תחילית "חזרה שבועית", nextDate = הראשונה, שורת-קשר-הבא; זריעה כפולה = 0', () => {
    expect(useApp.getState().seedSegulaReminders('a', TODAY, 'זיווג', 'weekly', 4)).toBe(4);
    const evs = evsOf();
    expect(evs.length).toBe(4);
    expect(evs.every((e) => e.notes.startsWith('חזרה שבועית ×4'))).toBe(true);
    expect(evs.some((e) => e.title.includes('📆 תזכורת שבועית — תורם a · 1/4'))).toBe(true);
    const a = useApp.getState().db.supporters[0];
    expect(a.nextDate).toBe('2026-09-23');
    expect(a.nextNote).toContain('חזרה שבועית ×4');
    expect(useApp.getState().seedSegulaReminders('a', TODAY, 'זיווג', 'weekly', 4)).toBe(0);
  });
  it('סגולה + יומי חיים במקביל; ביטול היומי לא נוגע בסגולה; ברירת-מחדל mode = segula', () => {
    expect(useApp.getState().seedSegulaReminders('a', TODAY, 'זיווג')).toBe(5);
    expect(useApp.getState().seedSegulaReminders('a', TODAY, 'זיווג', 'daily', 3)).toBe(3);
    expect(evsOf().length).toBe(8);
    expect(useApp.getState().cancelSegula('a', 'daily')).toBe(3);
    expect(evsOf().length).toBe(5);
    expect(segulaStatus(useApp.getState().db.events, 'a', TODAY).active).toBe(true);
    expect(useApp.getState().db.supporters[0].nextNote).toContain('סגולת 40 יום');
    expect(useApp.getState().db.supporters[0].nextNote).not.toContain('חזרה יומית');
  });
  it('restart במצב חודשי מחליף את הסדרה (12 ⇒ 6)', () => {
    useApp.getState().seedSegulaReminders('a', TODAY, 'זיווג', 'monthly');
    expect(evsOf().length).toBe(12);
    expect(useApp.getState().restartSegula('a', TODAY, 'זיווג', 'monthly', 6)).toBe(6);
    expect(evsOf().length).toBe(6);
  });
});

describe('הגנת-מקור — הכרטיס', () => {
  const src = readFileSync(new URL('../../components/supporters/SupporterDetail.tsx', import.meta.url), 'utf8');
  it('בורר-חזרה עם 4 צ׳יפים + כמות; פאנל לכל סדרה פעילה; כפתור-זריעה למצב הנבחר; הסגולה נשארת', () => {
    expect(src).toContain("const [recurMode, setRecurMode] = useState<RecurMode>('segula');");
    expect(src).toContain('{RECUR_MODES.map((m) => (');
    expect(src).toContain('aria-label="כמות תזכורות"');
    expect(src).toContain('{recurActive.map(({ def, st }) => (');
    expect(src).toContain("seedSegulaReminders(sp.id, isoToday(), 'זיווג', recurMode, recurSelCount)");
    expect(src).toContain("cancelSegula(sp.id, def.key)");
    expect(src).toContain("seedSegulaReminders(sp.id, isoToday(), 'זיווג')}");
    expect(src).toContain("{recurMode === 'segula' && (");
  });
});
