/**
 * ratchet — מסלולי-תזכורת עם תאריך-התחלה נבחר (בקשת-בעלים 13.10:
 * "בחירת יום לפי מנגנון 40 · 7 · 1 · כל ראש חודש · דו-חודשי · שנתי — בתזכורת עברי/לועזי"
 * + "אני רוצה לבחור את התאריך הראשוני ואז את המסלול").
 *
 * עקרונות: בלי opts ⇒ ההתנהגות הקודמת בדיוק (התזכורת הראשונה צעד אחרי ההתחלה, לועזי) — הלוח
 * וסדרות קיימות לא זזים · firstOnStart ⇒ התאריך שנבחר הוא התזכורת הראשונה · עברי = אותו יום
 * בחודש העברי (שנה מעוברת נספרת טבעית), כלל ל׳ (חודש בלי ל׳ ⇒ א׳ בחודש הבא) · ראש-חודש = כל א׳.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildRecurIndex,
  recurDates,
  RECUR_MODES,
  recurStatus,
  stripRecurNote,
} from '../../components/supporters/lib';
import { hebPartsOfIso } from '../hebrew';
import { emptyDb, type Db, type Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';

const dates = (r: { date: string }[]) => r.map((x) => x.date);
const FIRST = { firstOnStart: true } as const;
const HEB = { cal: 'heb', firstOnStart: true } as const;

describe('ביט-זהה בלי opts', () => {
  it('חודשי/שבועי/יומי — הראשונה צעד אחרי ההתחלה (כמו 16.9)', () => {
    expect(dates(recurDates('2026-09-16', 'monthly', 2))).toEqual(['2026-10-16', '2026-11-16']);
    expect(dates(recurDates('2026-09-16', 'weekly', 2))).toEqual(['2026-09-23', '2026-09-30']);
    expect(dates(recurDates('2026-09-16', 'daily', 2))).toEqual(['2026-09-17', '2026-09-18']);
  });
  it('סגולה לא מושפעת מ-firstOnStart — ההתחלה היא יום 0', () => {
    expect(recurDates('2026-10-13', 'segula', undefined, FIRST)).toEqual(recurDates('2026-10-13', 'segula'));
  });
});

describe('📅 התאריך שנבחר = התזכורת הראשונה (לועזי)', () => {
  it('שבועי/יומי', () => {
    expect(dates(recurDates('2026-10-13', 'weekly', 3, FIRST))).toEqual(['2026-10-13', '2026-10-20', '2026-10-27']);
    expect(dates(recurDates('2026-10-13', 'daily', 2, FIRST))).toEqual(['2026-10-13', '2026-10-14']);
  });
  it('דו-חודשי ושנתי; 29.2 ⇒ 28.2 בשנה פשוטה', () => {
    expect(dates(recurDates('2026-10-13', 'bimonthly', 3, FIRST))).toEqual(['2026-10-13', '2026-12-13', '2027-02-13']);
    expect(dates(recurDates('2026-10-13', 'yearly', 3, FIRST))).toEqual(['2026-10-13', '2027-10-13', '2028-10-13']);
    expect(dates(recurDates('2028-02-29', 'yearly', 2, FIRST))).toEqual(['2028-02-29', '2029-02-28']);
  });
  it('עברי מתעלם ממצבים בלי בחירת-לוח (יומי/שבועי)', () => {
    expect(recurDates('2026-10-13', 'weekly', 3, HEB)).toEqual(recurDates('2026-10-13', 'weekly', 3, FIRST));
  });
  it('תקרות: שנתי 50, השאר 365', () => {
    expect(recurDates('2026-10-13', 'yearly', 999, FIRST)).toHaveLength(50);
    expect(recurDates('2026-10-13', 'daily', 999, FIRST)).toHaveLength(365);
  });
});

describe('🕍 עברי', () => {
  it('חודשי: ב׳ חשוון ⇒ ב׳ בכל חודש, כולל אדר א׳ ואדר ב׳ בשנה מעוברת (תשפ״ז)', () => {
    const r = dates(recurDates('2026-10-13', 'monthly', 6, HEB));
    expect(r).toEqual(['2026-10-13', '2026-11-12', '2026-12-12', '2027-01-10', '2027-02-09', '2027-03-11']);
    expect(r.map((d) => hebPartsOfIso(d).day)).toEqual([2, 2, 2, 2, 2, 2]);
    expect(new Set(r.map((d) => hebPartsOfIso(d).month)).size).toBe(6); // 6 חודשים שונים — אדר א׳≠אדר ב׳
  });
  it('דו-חודשי: כל חודש עברי שני', () => {
    expect(dates(recurDates('2026-10-13', 'bimonthly', 4, HEB))).toEqual(['2026-10-13', '2026-12-12', '2027-02-09', '2027-04-09']);
  });
  it('שנתי: אותו תאריך עברי כל שנה', () => {
    const r = dates(recurDates('2026-10-13', 'yearly', 3, HEB));
    expect(r).toEqual(['2026-10-13', '2027-11-02', '2028-10-22']);
    expect(r.every((d) => hebPartsOfIso(d).day === 2 && hebPartsOfIso(d).month === hebPartsOfIso('2026-10-13').month)).toBe(true);
  });
  it('כלל ל׳: עוגן ל׳ חשוון ⇒ בחודש בלי ל׳ (טבת) — א׳ בחודש הבא', () => {
    expect(hebPartsOfIso('2026-11-10').day).toBe(30);
    const r = dates(recurDates('2026-11-10', 'monthly', 3, HEB));
    expect(r).toEqual(['2026-11-10', '2026-12-10', '2027-01-09']);
    expect(hebPartsOfIso('2027-01-09').day).toBe(1);
  });
  it('ראש-חודש: כל א׳ בחודש; ההתחלה נכללת רק אם היא עצמה ראש-חודש', () => {
    const r = dates(recurDates('2026-10-13', 'roshchodesh', 4, FIRST));
    expect(r[0]).toBe('2026-11-11');
    expect(r.every((d) => hebPartsOfIso(d).day === 1)).toBe(true);
    expect(dates(recurDates('2026-11-11', 'roshchodesh', 2, FIRST))).toEqual(['2026-11-11', '2026-12-11']);
    expect(dates(recurDates('2026-11-11', 'roshchodesh', 1))).toEqual(['2026-12-11']); // בלי opts — הבא אחרי
  });
});

describe('🔎 זיהוי-סדרה — תחיליות זרות', () => {
  it('אף תחילית אינה תחילית/תת-מחרוזת של אחרת', () => {
    for (const a of RECUR_MODES) for (const b of RECUR_MODES) if (a !== b) expect(b.prefix.includes(a.prefix), a.key + '⊂' + b.key).toBe(false);
  });
  it('חודשי לא תופס דו-חודשי ולהפך; האינדקס מכיר את המצבים החדשים', () => {
    const evs = [
      { id: 'm', spId: 's', type: 'call', date: '2026-11-01', notes: 'חזרה חודשית ×12' },
      { id: 'b', spId: 's', type: 'call', date: '2026-11-02', notes: 'חזרה דו-חודשית עברי ×6' },
      { id: 'r', spId: 's', type: 'call', date: '2026-11-11', notes: 'חזרה ראש-חודש ×12' },
      { id: 'y', spId: 's', type: 'call', date: '2027-11-02', notes: 'חזרה שנתית ×5' },
    ];
    expect(recurStatus(evs, 's', '2026-10-13', 'monthly').reminders.map((r) => r.id)).toEqual(['m']);
    expect(recurStatus(evs, 's', '2026-10-13', 'bimonthly').reminders.map((r) => r.id)).toEqual(['b']);
    expect(buildRecurIndex(evs).get('s')).toHaveLength(4);
    expect(stripRecurNote('🗓 חזרה חודשית ×12\n🔂 חזרה דו-חודשית ×6', 'monthly')).toBe('🔂 חזרה דו-חודשית ×6');
  });
});

describe('store — זריעה מתאריך נבחר, עברי מסומן בהערה', () => {
  const sup = (id: string): Supporter =>
    ({ id, name: 'תורם ' + id, phone: '050-1', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', nextNote: '', donations: [] }) as unknown as Supporter;
  beforeEach(() => {
    const db: Db = { ...emptyDb(), supporters: [sup('a')] };
    useApp.getState().setDb(() => db);
  });
  it('חודשי עברי מ-13.10: 3 אירועים, הראשון ביום שנבחר, ההערה "חזרה חודשית עברי"', () => {
    expect(useApp.getState().seedSegulaReminders('a', '2026-10-13', 'זיווג', 'monthly', 3, HEB)).toBe(3);
    const evs = useApp.getState().db.events.filter((e) => e.spId === 'a').sort((x, y) => x.date.localeCompare(y.date));
    expect(evs.map((e) => e.date)).toEqual(['2026-10-13', '2026-11-12', '2026-12-12']);
    expect(evs.every((e) => (e.notes || '').startsWith('חזרה חודשית עברי ×3'))).toBe(true);
    expect(recurStatus(useApp.getState().db.events, 'a', '2026-10-13', 'monthly').total).toBe(3);
    expect(useApp.getState().db.supporters[0].nextDate).toBe('2026-10-13');
  });
  it('בלי opts — אותה הערה כמו קודם (בלי "עברי")', () => {
    useApp.getState().seedSegulaReminders('a', '2026-10-13', 'זיווג', 'monthly', 2);
    expect(useApp.getState().db.events.every((e) => (e.notes || '').startsWith('חזרה חודשית ×2'))).toBe(true);
  });
});
