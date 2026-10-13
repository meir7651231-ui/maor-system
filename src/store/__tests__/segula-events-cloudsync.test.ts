/**
 * ratchet — 5.10.2026 (חקירת "40 יום לא עובד", תרחיש ב׳ — הענן): אירועי-הסגולה (5 תזכורות-לוח:
 * type 'call' · spId · הערה "סגולת 40 יום…") חייבים לשרוד את חיבור-הענן: (א) נזרעו במכשיר לפני/בלי סנכרון
 * ⇒ בלחיצת-היד הם "תוספת-מקומית" שנשמרת ונדחפת לענן **עם** notes/spId/type (מה ש-segulaStatus מזהה);
 * (ב) ענן-מנצח בהתנגשות-id לא נוגע באירוע בלי מתחרה; (ג) מצבה (delLog) על אירוע שבוטל ⇒ לא קם לתחייה.
 * ../lib/cloud ממוקק (אין firebase/רשת) — כמו cloud-firstconnect.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDb, type Db, type OrgEvent, type Supporter } from '../../types/domain';
import type { DbDiff } from '../../lib/cloud-diff';
import { segulaStatus } from '../../components/supporters/lib';

const pushed: DbDiff[] = [];
let cloudReturn: Db | null = null;

vi.mock('../../lib/cloud', () => ({
  pullAll: () => Promise.resolve(cloudReturn),
  pushDiff: (d: DbDiff) => { pushed.push(d); return Promise.resolve(); },
  subscribeAll: () => () => {},
  donationSplitActive: () => false,
  supEnforceActive: () => false,
  pushDonations: () => Promise.resolve(),
  pullAuditRing: () => Promise.resolve(null),
  pushAuditRing: () => Promise.resolve(),
  auditWriterEmail: () => '',
  initCloud: () => {},
  resetPassword: () => Promise.resolve(),
  signIn: () => Promise.resolve(),
  signOutCloud: () => Promise.resolve(),
  watchAuth: () => () => {},
}));

const { startCloudSync, stopCloudSync } = await import('../cloudSync');

const sup = (id: string): Supporter => ({ id, name: 'תורם', phone: '050', donations: [], hist: [] } as unknown as Supporter);
const SEG_DAYS = [1, 7, 21, 35, 40];
const ev = (i: number): OrgEvent => ({
  id: 'ev' + i, title: '🕯 סגולה — תורם · יום ' + SEG_DAYS[i] + '/40', date: '2026-10-' + String(5 + SEG_DAYS[i]).padStart(2, '0').replace(/^(4\d)$/, '31'),
  time: '', type: 'call', customType: '', notes: 'סגולת 40 יום · זיווג · 050', price: 0, roomId: '', famId: '', spId: 's1', priority: i === 4 ? 'orange' : 'green', done: false,
} as unknown as OrgEvent);
// תאריכים אמיתיים לסגולה מ-2026-10-05 (ימים 1·7·21·35·40)
const DATES = ['2026-10-06', '2026-10-12', '2026-10-26', '2026-11-09', '2026-11-14'];
const segEvents = (): OrgEvent[] => SEG_DAYS.map((_, i) => ({ ...ev(i), date: DATES[i] }));

beforeEach(() => { pushed.length = 0; cloudReturn = null; stopCloudSync(); });

async function connect(local: Db): Promise<Db> {
  let current = local;
  await startCloudSync({ getDb: () => current, setDbFromRemote: (d) => { current = d; }, toast: () => {}, setStatus: () => {} });
  return current;
}

describe('☁️ 🕯 אירועי-סגולה שורדים את הענן', () => {
  it('(א) נזרעו מקומית לפני החיבור ⇒ נשמרים אחרי לחיצת-היד ונדחפים לענן עם notes/spId/type', async () => {
    const local: Db = { ...emptyDb(), supporters: [sup('s1')], events: segEvents() };
    cloudReturn = { ...emptyDb(), supporters: [sup('s1')] }; // בענן: התומך, בלי אירועים
    const merged = await connect(local);
    expect(merged.events.map((e) => e.id).sort()).toEqual(['ev0', 'ev1', 'ev2', 'ev3', 'ev4']);
    const st = segulaStatus(merged.events, 's1', '2026-10-07');
    expect(st.active).toBe(true);
    expect(st.total).toBe(5);
    expect(st.end).toBe('2026-11-14');
    // נדחפו 5 מסמכי-events עם השדות שמזהים סגולה
    const sets = pushed.flatMap((d) => d.sets).filter((s) => s.col === 'events');
    expect(sets.length).toBe(5);
    for (const s of sets) {
      const data = s.data as OrgEvent;
      expect(data.type).toBe('call');
      expect(data.spId).toBe('s1');
      expect(data.notes.startsWith('סגולת 40 יום')).toBe(true);
    }
    expect(pushed.flatMap((d) => d.deletes).length).toBe(0);
  });

  it('(ב) ענן עם אירועים זרים ⇒ איחוד: גם של הענן וגם של הסגולה המקומית; "הענן מנצח" רק באותו id', async () => {
    const local: Db = { ...emptyDb(), supporters: [sup('s1')], events: [...segEvents()] };
    const foreign = { ...ev(0), id: 'evX', notes: 'פגישה', type: 'reminder', spId: '' } as unknown as OrgEvent;
    cloudReturn = { ...emptyDb(), supporters: [sup('s1')], events: [foreign, { ...ev(0), date: DATES[0], done: true }] }; // ev0 כבר בענן (סומן בוצע במכשיר אחר)
    const merged = await connect(local);
    expect(merged.events.length).toBe(6);
    expect(merged.events.find((e) => e.id === 'ev0')!.done).toBe(true); // הענן מנצח ב-ev0
    expect(segulaStatus(merged.events, 's1', '2026-10-07').done).toBe(1);
    expect(segulaStatus(merged.events, 's1', '2026-10-07').total).toBe(5);
  });

  it('(ג) מצבה על סגולה שבוטלה בענן ⇒ האירועים לא קמים לתחייה מהמכשיר-האופליין', async () => {
    const local: Db = { ...emptyDb(), supporters: [sup('s1')], events: segEvents() };
    cloudReturn = { ...emptyDb(), supporters: [sup('s1')], delLog: SEG_DAYS.map((_, i) => ({ col: 'events', id: 'ev' + i, at: '2026-10-05T10:00:00.000Z' })) } as Db;
    const merged = await connect(local);
    expect(merged.events.length).toBe(0);
    expect(segulaStatus(merged.events, 's1', '2026-10-07').active).toBe(false);
    expect(pushed.flatMap((d) => d.sets).filter((s) => s.col === 'events').length).toBe(0);
  });
});
