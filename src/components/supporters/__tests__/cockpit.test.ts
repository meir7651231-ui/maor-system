/**
 * ratchet — מנוע חלון-העבודה (הקוקפיט). כל בדיקה מתעדת יכולת של שכבת-ההעצמה:
 * המערכת מסדרת את היום מתוך נתונים קיימים בלבד (אפס שינוי-סכמה). היום מוזרק —
 * המנוע דטרמיניסטי (בניגוד ל-supScore שנשען על Date.now).
 */
import { describe, expect, it } from 'vitest';
import {
  COCKPIT_SILENT_DAYS,
  cockpitAtRisk,
  cockpitCalls,
  cockpitCollectedThisMonth,
  cockpitHokTasks,
  cockpitKpis,
  cockpitProgress,
  cockpitQueue,
  cockpitThanks,
  daysSince,
} from '../cockpit';
import { HOK_CAT } from '../lib';
import type { Donation, Hok, Supporter } from '../../../types/domain';

const TODAY = '2026-08-19';

function don(over: Partial<Donation>): Donation {
  return { rid: 'D-1', date: '2026-08-01', amount: 100, cur: '₪', cat: '', ...over };
}
function hok(over: Partial<Hok>): Hok {
  return { amount: 200, cur: '₪', day: 5, method: 'bank', note: '', active: true, startedAt: '2026-01-01', ...over };
}
function sup(over: Partial<Supporter>): Supporter {
  return {
    id: 's' + Math.random().toString(36).slice(2, 7),
    name: 'תורם', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
    count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
  };
}

describe('💛 ratchet — מנוע הקוקפיט', () => {
  it('daysSince: הפרש-ימים מהיום המוזרק; ריק = Infinity', () => {
    expect(daysSince('2026-08-09', TODAY)).toBe(10);
    expect(daysSince(TODAY, TODAY)).toBe(0);
    expect(daysSince('', TODAY)).toBe(Infinity);
  });

  it('cockpitAtRisk: נתן-בעבר + שקט מעל הסף + בלי יעד-קשר; לא כפול עם השיחות', () => {
    const gaveSilent = sup({ id: 'a', count: 3, last: '2026-05-01' }); // ~110 יום שקט, בלי יעד
    const gaveRecent = sup({ id: 'b', count: 2, last: '2026-08-10' }); // 9 יום — לא בסיכון
    const gaveWithTarget = sup({ id: 'c', count: 3, last: '2026-05-01', nextDate: '2026-09-01' }); // יש יעד
    const neverGave = sup({ id: 'd', count: 0, last: '' }); // לא תרם מעולם
    const risk = cockpitAtRisk([gaveSilent, gaveRecent, gaveWithTarget, neverGave], TODAY);
    expect(risk.map((s) => s.id)).toEqual(['a']);
  });

  it('הסף עריך: silentDays נמוך יותר תופס גם שקט קצר', () => {
    const s = sup({ id: 'a', count: 2, last: '2026-08-01' }); // 18 יום
    expect(cockpitAtRisk([s], TODAY).length).toBe(0); // מתחת ל-60
    expect(cockpitAtRisk([s], TODAY, 14).length).toBe(1); // מעל 14
    expect(COCKPIT_SILENT_DAYS).toBe(60);
  });

  it('cockpitCalls: יעד-שעבר קודם לשקט; כל תורם פעם-אחת; ממוין לפי דחיפות', () => {
    const overdue = sup({ id: 'o', name: 'עבר', count: 1, last: '2026-01-01', nextDate: '2026-08-05' });
    const churn = sup({ id: 'c', name: 'שקט', count: 5, last: '2026-04-01' });
    const calls = cockpitCalls([churn, overdue], TODAY);
    // היעד-שעבר תמיד ראשון (sort מיליון+), השקט אחריו
    expect(calls.map((t) => t.supId)).toEqual(['o', 'c']);
    expect(calls[0].severity).toBe('due');
    expect(calls[0].reason).toContain('יעד-קשר עבר');
    expect(calls[1].severity).toBe('risk');
    expect(calls[1].reason).toContain('שקט/ה');
    // אפס כפילות: מזהי-משימה ייחודיים
    expect(new Set(calls.map((t) => t.id)).size).toBe(calls.length);
  });

  it('cockpitCalls: יעד להיום = "יעד-קשר להיום"', () => {
    const t = cockpitCalls([sup({ id: 'x', nextDate: TODAY })], TODAY);
    expect(t[0].reason).toBe('יעד-קשר להיום');
  });

  it('cockpitCalls: תזכורת-האג\'נדה (nextNote) נכנסת לסיבת-המשימה — "על מה לדבר"', () => {
    const withNote = cockpitCalls([sup({ id: 'n', nextDate: '2026-08-05', nextNote: 'לבקש חידוש הו״ק' })], TODAY);
    expect(withNote[0].reason).toContain('יעד-קשר עבר');
    expect(withNote[0].reason).toContain('📝 לבקש חידוש הו״ק');
    // בלי תזכורת — אין 📝 (ביט-זהה לקודם)
    expect(cockpitCalls([sup({ id: 'p', nextDate: TODAY })], TODAY)[0].reason).not.toContain('📝');
  });

  it('cockpitThanks: תרומה בתוך חלון-התודות בלבד, מהחדש לישן', () => {
    const todayGift = sup({ id: 't', count: 1, last: TODAY, donations: [don({ date: TODAY, amount: 500 })] });
    const twoDays = sup({ id: 'u', count: 1, donations: [don({ date: '2026-08-17', amount: 90 })] });
    const old = sup({ id: 'v', count: 1, donations: [don({ date: '2026-08-01' })] }); // 18 יום — מחוץ
    const thanks = cockpitThanks([old, twoDays, todayGift], TODAY);
    expect(thanks.map((x) => x.supId)).toEqual(['t', 'u']);
    expect(thanks[0].reason).toContain('היום');
    expect(thanks[0].reason).toContain('₪500');
  });

  it('cockpitThanks: תרומה מ-hist נכללת גם היא (לא רק קבלות)', () => {
    const s = sup({ id: 'h', count: 0, hist: [{ d: '2026-08-18', a: 300, c: '₪' }] as Supporter['hist'] });
    const thanks = cockpitThanks([s], TODAY);
    expect(thanks.length).toBe(1);
    expect(thanks[0].reason).toContain('₪300');
  });

  it('cockpitHokTasks: הו״ק פעילה שטרם-נרשמה = משימה; שנרשמה = לא', () => {
    const due = sup({ id: 'due', hok: hok({ amount: 250, day: 3 }) });
    const recorded = sup({
      id: 'rec',
      hok: hok({ amount: 250, day: 3 }),
      donations: [don({ date: '2026-08-05', cat: HOK_CAT, amount: 250 })],
    });
    const tasks = cockpitHokTasks([recorded, due], TODAY);
    expect(tasks.map((t) => t.supId)).toEqual(['due']);
    expect(tasks[0].kind).toBe('hok');
    expect(tasks[0].reason).toContain('₪250');
    expect(tasks[0].reason).toContain('טרם נרשם');
  });

  it('cockpitCollectedThisMonth: קבלות+hist בחודש-הנוכחי; $ לפי שער', () => {
    const s = sup({
      id: 'm',
      donations: [
        don({ date: '2026-08-02', amount: 100, cur: '₪' }),
        don({ date: '2026-08-10', amount: 50, cur: '$' }), // 50×4 = 200
        don({ date: '2026-07-30', amount: 999, cur: '₪' }), // חודש שעבר — לא
      ],
      hist: [{ d: '2026-08-15', a: 40, c: '₪' }] as Supporter['hist'],
    });
    expect(cockpitCollectedThisMonth([s], TODAY, 4)).toBe(340); // 100 + 200 + 40
  });

  it('cockpitKpis: total/collected/expectedHok/atRisk', () => {
    const donor = sup({ id: 'k1', count: 1, last: TODAY, donations: [don({ date: TODAY, amount: 1000, cur: '₪' })] });
    const hokActive = sup({ id: 'k2', hok: hok({ amount: 300, cur: '₪', active: true }) });
    const risky = sup({ id: 'k3', count: 4, last: '2026-01-01' }); // שקט ~230 יום
    const k = cockpitKpis([donor, hokActive, risky], TODAY, 3.7);
    expect(k.total).toBe(3);
    expect(k.collected).toBe(1000);
    expect(k.expectedHok).toBe(300);
    expect(k.atRisk).toBe(1); // רק risky
  });

  it('cockpitQueue + cockpitProgress: איחוד שלוש-הקבוצות + התקדמות מול Set', () => {
    const overdue = sup({ id: 'o', nextDate: '2026-08-01' });
    const thankIt = sup({ id: 't', count: 1, donations: [don({ date: TODAY, amount: 80 })] });
    const hokDueSup = sup({ id: 'h', hok: hok({ amount: 120, day: 2 }) });
    const q = cockpitQueue([overdue, thankIt, hokDueSup], TODAY);
    expect(q.total).toBe(3);
    expect(q.tasks.map((t) => t.kind)).toEqual(['call', 'thanks', 'hok']); // סדר-ההצגה
    const prog = cockpitProgress(q, new Set(['call:o']));
    expect(prog).toEqual({ done: 1, total: 3 });
  });

  it('אפס-אובדן/יציבות: אותם קלטים ⇒ אותה תוצאה (דטרמיניסטי, בלי שעון)', () => {
    const data = [
      sup({ id: 'a', count: 3, last: '2026-04-01' }),
      sup({ id: 'b', nextDate: '2026-08-01' }),
      sup({ id: 'c', hok: hok({}) }),
    ];
    expect(JSON.stringify(cockpitQueue(data, TODAY))).toBe(JSON.stringify(cockpitQueue(data, TODAY)));
  });
});
