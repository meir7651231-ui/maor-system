/**
 * ratchet — פאנל "הקרובים" (P2 פער 25, feature calendar.upcoming).
 *
 * upcomingItems טהורה: 30 יום מ-now (מוזרק), אירועים כולל חוזרים לפי
 * התאריך העברי + שכבות נגזרות (ימי הולדת), בלי מפגשי חוגים (רעש שבועי);
 * ימים ריקים לא מוחזרים. הסינון לפי הפילטרים בתצוגה (allowItem) —
 * מימוש הכרעה 6 (צ׳יפ famId נבדק בהגנת-מקור).
 */
import { describe, expect, it } from 'vitest';
import { allowItem, DEFAULT_FILTERS, hpOf, isoOf, upcomingItems } from '../calLib';
import { hebAnnualEq } from '../../../lib/hebrew';
import calViewSrc from '../CalendarView.tsx?raw';
import { emptyDb, emptyFamily, emptyMember, type Db, type OrgEvent } from '../../../types/domain';

const NOW = new Date('2026-07-30T12:00:00');

function ev(over: Partial<OrgEvent>): OrgEvent {
  return {
    id: over.id ?? 'e' + Math.random().toString(36).slice(2, 6),
    title: '',
    date: '',
    time: '',
    type: 'org',
    customType: '',
    notes: '',
    price: 0,
    roomId: '',
    famId: '',
    priority: 'green',
    done: false,
    ...over,
  };
}

describe('📅 ratchet — upcomingItems (פער 25)', () => {
  it('טווח 30 יום: אירוע ביום 5 נכנס, ביום 31 לא; ימים ריקים לא מוחזרים', () => {
    const in5 = isoOf(new Date(2026, 7 - 1 + 0, 30 + 5));
    const in31 = isoOf(new Date(2026, 6, 30 + 31));
    const db: Db = {
      ...emptyDb(),
      events: [ev({ id: 'a', title: 'בטווח', date: in5 }), ev({ id: 'b', title: 'מחוץ', date: in31 })],
    };
    const days = upcomingItems(db, NOW);
    expect(days).toHaveLength(1);
    expect(days[0].iso).toBe(in5);
    expect(days[0].items.some((it) => it.ev?.id === 'a')).toBe(true);
    expect(days[0].dayGem).not.toBe('');
    expect(days[0].weekday.startsWith('יום ')).toBe(true);
  });

  it('אזכרה חוזרת בעברי מופיעה ביום העברי הנכון בתוך הטווח', () => {
    // מאתרים את היום בטווח שבו חל התאריך העברי של אירוע מלפני שנתיים —
    // ואז מוודאים ש-upcomingItems מציבה אותו בדיוק שם (אותו דין hebAnnualEq
    // כמו הלוח והבית)
    const orig = '2024-08-10';
    let target = '';
    for (let i = 0; i < 400 && !target; i++) {
      const d = new Date(2026, 6, 30 + i);
      if (hebAnnualEq(hpOf(orig), hpOf(isoOf(d), d))) target = isoOf(d);
    }
    expect(target).not.toBe('');
    const db: Db = { ...emptyDb(), events: [ev({ id: 'mm', title: 'אזכרה', date: orig, type: 'memorial', famId: 'f1' })] };
    const days = upcomingItems(db, NOW, 400);
    const hit = days.find((day) => day.items.some((it) => it.ev?.id === 'mm'));
    expect(hit?.iso).toBe(target);
  });

  it('יום הולדת (שכבה נגזרת) נכנס עם famId; כיבוי שכבת bdays בפילטרים מסיר אותו', () => {
    const fam = {
      ...emptyFamily(),
      id: 'f1',
      createdAt: '2020-01-01',
      name: 'כהן',
      members: [{ ...emptyMember(), id: 'm1', first: 'רבקה', birth: '2018-08-05' }],
    };
    const db: Db = { ...emptyDb(), families: [fam] };
    const days = upcomingItems(db, NOW, 30);
    const bdayItems = days.flatMap((d) => d.items).filter((it) => it.layer === 'bday');
    expect(bdayItems.length).toBeGreaterThan(0);
    expect(bdayItems[0].famId).toBe('f1');
    // מכבד את הפילטרים — bdays=false מסנן את הפריט (allowItem, כמו בתצוגה)
    expect(bdayItems.every((it) => allowItem(it, { ...DEFAULT_FILTERS, bdays: false }))).toBe(false);
  });

  it('הגנת-מקור: צ׳יפ famId לחיץ פותח כרטיס משפחה, עם fallback לצבע-הסוג (הכרעה 6)', () => {
    expect(calViewSrc).toMatch(/it\.famId \? \(/);
    expect(calViewSrc).toMatch(/selectFamily\(it\.famId!\)/);
    expect(calViewSrc).toContain("featureOn(config, 'calendar.upcoming')");
  });
});
