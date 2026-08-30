/**
 * ratchet — לוח התרומות: שורות הלוח האישי והכלל-ארגוני (P1.4).
 *
 * מקור האמת: legacy-main-script.js:2928-2944 — supCalAll אוסף מכל התומכות את
 * supDonEvents + אירועי המעקב (🧿 רישומי log, 📞 תשובות, 🔁 לדבר שוב) עם
 * name/spId לניווט; supCalMine מוסיף בלוח האישי גם 🎯 תאריך יעד. שורת סיכום
 * החודש (monthLine, legacy:1530): 'N תרומות החודש · ₪X + $Y' / הודעת ריק.
 */
import { describe, expect, it } from 'vitest';
import { donCalMonthLine, orgCalEntries, personalCalEntries } from '../lib';
import { emptyAyin, type Supporter } from '../../../types/domain';
import donCalSrc from '../DonationCalendar.tsx?raw';

function sup(over: Partial<Supporter>): Supporter {
  return {
    id: 'sp1', name: 'גולדשטיין', phone: '', email: '', address: '', idNum: '', cat: '',
    forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '',
    donations: [], ...over,
  };
}

const RICH = sup({
  donations: [{ rid: 'D-1', date: '2026-07-10', amount: 500, cur: '₪', cat: '' }],
  hist: [{ d: '2025-02-01', a: 200, c: '$' }],
  nextDate: '2026-08-01',
  ayin: {
    ...emptyAyin(),
    nextTalk: '2026-08-03',
    log: [{ date: '2026-07-12', eyes: 3, name: 'לאה בת חנה' }],
    answers: [{ date: '2026-07-15', note: 'תשובה טובה' }],
  },
});

describe('🗓 ratchet — personalCalEntries (legacy supCalMine)', () => {
  it('תרומות+hist+🎯 יעד+🧿 log+📞 תשובות+🔁 לדבר שוב — כולם נכנסים', () => {
    const e = personalCalEntries(RICH);
    const srcs = e.map((x) => x.src);
    expect(srcs).toContain('קבלה D-1');
    expect(srcs).toContain('מהקובץ ההיסטורי');
    expect(srcs).toContain('🎯 תאריך יעד לקשר הבא');
    expect(srcs).toContain('🧿 3 — לאה בת חנה');
    expect(srcs).toContain('📞 תשובה: תשובה טובה');
    expect(srcs).toContain('🔁 לדבר שוב');
    expect(e).toHaveLength(6);
  });

  it('תומכת בלי ayin ובלי יעד — רק התרומות; אין רשומות בלי תאריך', () => {
    const e = personalCalEntries(sup({ donations: [{ rid: 'D-2', date: '2026-01-01', amount: 100, cur: '₪', cat: '' }] }));
    expect(e).toHaveLength(1);
    expect(e.every((x) => !!x.date)).toBe(true);
  });
});

describe('🗓 ratchet — orgCalEntries (legacy supCalAll)', () => {
  it('אוסף מכל התומכות עם name/spId לניווט; 🎯 יעד-קשר-הבא מחווט גם כאן (בקשת-בעלים 30.8)', () => {
    const other = sup({ id: 'sp2', name: 'ברגר', donations: [{ rid: 'D-9', date: '2026-07-20', amount: 50, cur: '₪', cat: '' }] });
    const e = orgCalEntries([RICH, other]);
    expect(e.every((x) => !!x.spId && !!x.name)).toBe(true);
    expect(e.filter((x) => x.spId === 'sp2')).toHaveLength(1);
    // 🎯 יעד-קשר-הבא (nextDate) עכשיו מחווט ללוח-התורמים הכלל-ארגוני, עם spId לניווט
    const goal = e.find((x) => x.src.startsWith('🎯'));
    expect(goal).toBeTruthy();
    expect(goal!.spId).toBe('sp1');
    expect(goal!.date).toBe('2026-08-01'); // ה-nextDate של RICH
    // sp1: קבלה + hist + log + תשובה + לדבר-שוב + 🎯 יעד = 6
    expect(e.filter((x) => x.spId === 'sp1')).toHaveLength(6);
  });
});

describe('🗓 ratchet — donCalMonthLine (legacy:1530)', () => {
  const entries = orgCalEntries([RICH]);
  const july = (iso: string) => iso.startsWith('2026-07');
  it('סופר את כל רשומות החודש ומסכם ₪/$ בנפרד', () => {
    // ביולי: קבלה ₪500 + 🧿 + 📞 = 3 רשומות
    expect(donCalMonthLine(entries, july)).toBe('3 תרומות החודש · ₪500');
  });
  it('חודש בלי רשומות — הודעת ריק כמו בלגאסי', () => {
    expect(donCalMonthLine(entries, (iso) => iso.startsWith('2020-01'))).toBe('אין תרומות מתועדות בחודש זה');
  });
  it('רק רשומות מהקובץ ההיסטורי (סכום $) — מציג את ה-$', () => {
    expect(donCalMonthLine(entries, (iso) => iso.startsWith('2025-02'))).toBe('1 תרומות החודש · $200');
  });

  // בקשת-בעלים 30.8: "לוח תורמים תצוגה יומי שבועי חודשי"
  it('🛡 לוח-התורמים: בורר יומי/שבועי/חודשי + offset-לפי-יחידה + פאנל-יום על העוגן', () => {
    expect(donCalSrc).toContain('<CalViewTabs');
    expect(donCalSrc).toContain("const [mode, setMode] = useState<CalViewMode>('month')");
    expect(donCalSrc).toContain("if (mode === 'day')");
    expect(donCalSrc).toContain("if (mode === 'week')");
    // ביום — הרשימה על התא-היחיד (activeDay), לא רק על תא-שנלחץ
    expect(donCalSrc).toContain("mode === 'day' ? view.cells[0]?.iso ?? null : dayIso");
  });
});
