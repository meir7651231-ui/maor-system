/**
 * ratchet — 🏡 אירוח 3: "מרכז הדוחות" (BUILD-ORDER-HOSTING-2026-10-12) — 6 דוחות × 6 טווחים × יציאות,
 * פורט `buildReport`/`repRange`/`repPlainText`/`repHtmlDoc` של המקור; + גיבוי/שחזור (כולל גיבוי האפליקציה המקורית).
 */
import { describe, expect, it } from 'vitest';
import type { HostBooking, HostMeal, HostUnit } from '../../../types/domain';
import { buildReport, rangeNights, repRange, reportCsvRows, reportHtmlDoc, reportPlainText, REP_PRESETS, REP_TYPES, type HostReportData } from '../reports';
import { deMoji, importAppBackup, moduleBackupOf, parseHostingBackup } from '../importer';

const AT = '2026-10-12T08:00:00.000Z';
const TODAY = '2026-10-15';

function U(id: string, name: string): HostUnit {
  return { id, name, type: 'צימר', beds: 2, cap: 4, rate: 500, status: 'free', subRooms: [], createdAt: AT, updatedAt: AT };
}
function B(over: Partial<HostBooking>): HostBooking {
  return {
    id: 'b',
    guestId: 'g1',
    unitId: 'u1',
    roomIds: [],
    checkIn: '2026-10-05',
    checkOut: '2026-10-07',
    adults: 2,
    kids: 0,
    status: 'done',
    charges: [{ id: 'stay', kind: 'stay', label: 'לינה', amount: 1000 }],
    payments: [{ id: 'p1', amount: 600, date: '2026-10-05', note: '' }],
    notes: '',
    shabbat: false,
    createdAt: AT,
    updatedAt: AT,
    ...over,
  };
}
function M(over: Partial<HostMeal>): HostMeal {
  return {
    id: 'm',
    kind: 'meal',
    mealName: 'ארוחת שבת',
    bookingId: '',
    unitId: '',
    guestId: 'g1',
    diners: [],
    dinerCount: 4,
    date: '2026-10-10',
    time: '19:00',
    cook: '',
    server: '',
    clearer: '',
    tableSetter: '',
    items: [{ name: 'חלה', price: 20, qty: 2, alg: '', by: '' }],
    status: 'served',
    allergens: '',
    notes: '',
    seatPlan: { people: [], tables: [] },
    createdAt: AT,
    updatedAt: AT,
    ...over,
  };
}

const names: Record<string, string> = { g1: 'משפחת כהן', g2: 'משפחת לוי', u1: 'צימר הגפן', u2: 'וילה' };
const DATA = (bookings: HostBooking[], meals: HostMeal[] = []): HostReportData => ({
  units: [U('u1', 'צימר הגפן'), U('u2', 'וילה')],
  bookings,
  meals,
  guestName: (id) => names[id] ?? '—',
  unitName: (id) => names[id] ?? '—',
  guestWord: 'אורח',
  guestsWord: 'אורחים',
});

describe('📈 טווחים', () => {
  it('6 הטווחים של המקור: החודש · חודש שעבר · 30 יום · השנה · הכל · מותאם (קצה ריק/הפוך)', () => {
    expect(REP_PRESETS.map((p) => p[1])).toEqual(['החודש', 'חודש שעבר', '30 יום', 'השנה', 'הכל', 'טווח מותאם']);
    expect(repRange('month', '', '', TODAY)).toEqual({ from: '2026-10-01', to: '2026-10-31', label: 'החודש · אוקטובר 2026' });
    expect(repRange('prevmonth', '', '', TODAY)).toEqual({ from: '2026-09-01', to: '2026-09-30', label: 'חודש שעבר · ספטמבר 2026' });
    expect(repRange('prevmonth', '', '', '2026-01-10').from).toBe('2025-12-01');
    expect(repRange('30', '', '', TODAY)).toMatchObject({ from: '2026-09-16', to: TODAY });
    expect(repRange('year', '', '', TODAY)).toMatchObject({ from: '2026-01-01', to: '2026-12-31', label: 'שנת 2026' });
    expect(repRange('all', '', '', TODAY).label).toBe('כל הזמנים');
    expect(repRange('custom', '2026-10-20', '2026-10-01', TODAY)).toMatchObject({ from: '2026-10-01', to: '2026-10-20' });
    expect(repRange('custom', '', '', TODAY).from).toBe('2026-09-15');
  });

  it('לילות-בטווח: רק הלילות שבתוך [from, to]', () => {
    expect(rangeNights('2026-09-29', '2026-10-03', '2026-10-01', '2026-10-31')).toBe(2);
    expect(rangeNights('2026-10-30', '2026-11-03', '2026-10-01', '2026-10-31')).toBe(2);
    expect(rangeNights('2026-11-01', '2026-11-03', '2026-10-01', '2026-10-31')).toBe(0);
  });
});

describe('📈 ששת הדוחות', () => {
  const bookings = [
    B({ id: 'a' }),
    B({ id: 'b2', guestId: 'g2', unitId: 'u2', checkIn: '2026-10-08', checkOut: '2026-10-11', charges: [{ id: 'stay', kind: 'stay', label: 'לינה', amount: 3000 }], payments: [] }),
    B({ id: 'c', checkIn: '2026-10-20', checkOut: '2026-10-21', status: 'confirmed', charges: [{ id: 'stay', kind: 'stay', label: 'לינה', amount: 400 }], payments: [{ id: 'p', amount: 400, date: '', note: '' }] }),
    B({ id: 'x', status: 'cancelled', charges: [{ id: 'stay', kind: 'stay', label: 'לינה', amount: 99999 }] }),
    B({ id: 'old', checkIn: '2026-09-01', checkOut: '2026-09-02' }),
  ];
  const { from, to } = repRange('month', '', '', TODAY);

  it('💰 הכנסות: הזמנות שהגיעו בטווח (בלי ביטולים), חיובים/תקבולים/יתרה, פילוח-יחידות', () => {
    const r = buildReport('revenue', from, to, DATA(bookings));
    expect(r.title).toBe('דוח הכנסות');
    expect(r.sub).toBe('3 הזמנות');
    expect(r.kpis.map((k) => k.val)).toEqual(['₪ 4,400', '₪ 1,000', '₪ 3,400', '₪ 1,467']);
    expect(r.rows[0]).toEqual(['משפחת כהן', 'צימר הגפן', '20/10–21/10', '1', '₪ 400', '₪ 400', '₪ 0']);
    expect(r.viz.items.map((i) => i.name)).toEqual(['וילה', 'צימר הגפן']);
    expect(reportCsvRows(r)[0]).toEqual(['אורח', 'יחידה', 'צק_אין', 'צק_אאוט', 'לילות', 'חיוב', 'שולם', 'יתרה']);
  });

  it('מונחי-האשף (יחידה/הזמנה) עוברים לכותרות, לתת-הכותרות ולכותרות-ה-CSV — לא "יחידה/הזמנות" קבועים', () => {
    const words = { unitWord: 'צימר', unitsWord: 'צימרים', bookingWord: 'שריון', bookingsWord: 'שריונים' };
    const r = buildReport('revenue', from, to, { ...DATA(bookings), ...words });
    expect(r.sub).toBe('3 שריונים');
    expect(r.cols[1]).toBe('צימר');
    expect(r.kpis[3].lab).toBe('ממוצע לשריון');
    expect(reportCsvRows(r)[0].slice(0, 2)).toEqual(['אורח', 'צימר']);
    const o = buildReport('occupancy', from, to, { ...DATA(bookings), ...words });
    expect(o.sub).toBe('2 צימרים · 31 ימים');
    expect(o.cols[0]).toBe('צימר');
    const sm = buildReport('summary', from, to, { ...DATA(bookings), ...words });
    expect(sm.rows[0][0]).toBe('שריונים בתקופה');
    expect(sm.kpis[0].sub).toBe('3 שריונים');
    expect(buildReport('debts', from, to, { ...DATA(bookings), ...words }).cols[1]).toBe('צימר');
  });

  it('🏠 תפוסה: לילות-מכורים מול זמינים פר-יחידה, הכנסה יחסית ללילות שבטווח, RevPAN', () => {
    const r = buildReport('occupancy', from, to, DATA(bookings));
    expect(r.sub).toBe('2 יחידות · 31 ימים');
    expect(r.rows).toEqual([
      ['צימר הגפן', '3', '31', '10%', '₪ 1,400'],
      ['וילה', '3', '31', '10%', '₪ 3,000'],
    ]);
    expect(r.kpis[0]).toMatchObject({ val: '10%', sub: '6 / 62 לילות' });
  });

  it('👪 אורחים · 🧾 גבייה (כל הזמנים, בלי ביטולים) · 🍽️ מטבח · 📅 סיכום', () => {
    const g = buildReport('guests', from, to, DATA(bookings));
    expect(g.rows.map((r) => [r[0], r[1]])).toEqual([
      ['משפחת לוי', '1'],
      ['משפחת כהן', '2'],
    ]);
    expect(g.kpis[1].val).toBe('1'); // חוזרים
    const d = buildReport('debts', from, to, DATA(bookings));
    expect(d.rows.map((r) => [r[0], r[5]])).toEqual([
      ['משפחת לוי', '₪ 3,000'],
      ['משפחת כהן', '₪ 400'],
      ['משפחת כהן', '₪ 400'],
    ]);
    expect(d.kpis[3].val).toBe(Math.round((1600 / 5400) * 100) + '%');
    const meals = [M({ id: 'm1' }), M({ id: 'm2', status: 'cancelled' }), M({ id: 'm3', date: '', bookingId: 'b2', mealName: '' })];
    const k = buildReport('kitchen', from, to, DATA(bookings, meals));
    expect(k.sub).toBe('2 ארוחות');
    expect(k.rows.map((r) => [r[0], r[1]])).toEqual([
      ['ארוחת שבת', '10/10'],
      ['משפחת כהן', '8/10'], // בלי תאריך ⇒ הגעת-ההזמנה; בלי שם ⇒ שם-האורח
    ]);
    expect(k.viz.items).toEqual([{ name: 'חלה', val: 4, disp: '4×' }]);
    const s = buildReport('summary', from, to, DATA(bookings, meals));
    expect(s.rows.map((r) => r[0])).toEqual(['הזמנות בתקופה', 'חיובים', 'תקבולים', 'תפוסה', 'אורחים ייחודיים', 'ארוחות מטבח', 'הכנסת מטבח', 'יתרות פתוחות (כולל)']);
    expect(s.rows[0][1]).toBe('3');
  });

  it('יציאות: טקסט (העתקה/וואטסאפ) · HTML עם escaping מלא ובלי סקריפט · גלריה של 6', () => {
    expect(REP_TYPES.map((t) => t[2])).toEqual(['הכנסות', 'תפוסה', 'אורחים', 'מטבח', 'גבייה', 'סיכום מנהלים']);
    const evil = [B({ id: 'e', guestId: 'g9', checkIn: '2026-10-09', checkOut: '2026-10-10' })];
    const r = buildReport('revenue', from, to, { ...DATA(evil), guestName: () => '<img src=x onerror=alert(1)>' });
    const txt = reportPlainText(r, 'החודש', 'צימרי הגליל');
    expect(txt.split('\n').slice(0, 4)).toEqual(['צימרי הגליל · דוח הכנסות', 'החודש', '', '• סה״כ חיובים: ₪ 1,000']);
    const html = reportHtmlDoc(r, 'החודש', 'צימרי <b>הגליל</b>', '15.10.2026');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<b>הגליל');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain('dir="rtl"');
  });
});

describe('💾 גיבוי ושחזור', () => {
  it('גיבוי-המודול ⇒ שחזור — אותם נתונים (round-trip)', () => {
    const bk = moduleBackupOf({ hostUnits: [U('u1', 'צימר')], hostBookings: [B({ id: 'a' })], hostRecords: [], prefs: { cleaningFee: 120 } }, AT);
    const back = parseHostingBackup(JSON.parse(JSON.stringify(bk)), AT);
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(back.data.source).toBe('orbit');
    expect(back.data.units[0].name).toBe('צימר');
    expect(back.data.bookings[0].id).toBe('a');
    expect(back.data.prefs).toEqual({ cleaningFee: 120 });
    expect(parseHostingBackup({ format: 'orbit-hosting', hostUnits: [] }, AT)).toEqual({ ok: false, error: 'קובץ גיבוי פגום — חסרים אוספים' });
    expect(parseHostingBackup([1, 2], AT).ok).toBe(false);
    expect(parseHostingBackup({ families: [] }, AT)).toEqual({ ok: false, error: 'קובץ לא תקין — לא גיבוי של האירוח' });
  });

  it('ריפוי-הקידוד של המקור (deMoji): עברית שנפגעה ב-Windows-1255 חוזרת; עברית תקינה/אנגלית — ללא שינוי', () => {
    const good = 'צימר הגפן';
    const broken = new TextDecoder('windows-1255').decode(new TextEncoder().encode(good));
    expect(broken).not.toBe(good);
    expect(deMoji(broken)).toBe(good);
    expect(deMoji(good)).toBe(good);
    expect(deMoji('Villa 3')).toBe('Villa 3');
  });

  it('גיבוי האפליקציה המקורית (hosp_pms_v1) ⇒ 3 האוספים + הגדרות; קישורים נשמרים; חיובים מסווגים; דגלים כבויים מדווחים', () => {
    const src = {
      org: { name: 'צימרי הגליל', checkin: '14:00', checkout: '11:00', cleaningFee: 120, taxPct: 17, currency: '₪', familyTerm: true, orderLeadDays: 3 },
      units: [{ id: 'u1', name: 'וילה', type: 'וילה', beds: 4, cap: 8, rate: 900, status: 'dirty', rooms: [{ id: 'r1', name: 'חדר הורים', beds: 2, rate: 450 }] }],
      guests: [{ id: 'g1', name: 'כהן', phone: '050-1', email: '', adults: 2, kids: 3, notes: '' }],
      reservations: [
        {
          id: 'res1', guest: 'g1', unit: 'u1', rooms: ['r1'], in: '2026-10-16', out: '2026-10-18', adults: 2, kids: 3, status: 'confirmed', notes: '', shabbat: true,
          charges: [{ label: 'לינה · 2 לילות · חדר הורים', amount: 900 }, { label: 'דמי ניקיון', amount: 120 }, { label: 'מע״מ 17%', amount: 173 }, { label: 'חבילת שבת', amount: 250 }, { label: 'הזמנת מטבח (1 מנות)', amount: 80, ko: 'ko1' }],
          payments: [{ amount: 500, date: '2026-10-12', note: 'מקדמה' }],
        },
      ],
      tasks: [{ id: 't1', unit: 'u1', type: 'ניקיון אחרי עזיבה', status: 'open', created: '2026-10-12' }],
      menu: [{ id: 'd1', name: 'חלה', type: 'פרווה', price: 20, ingredients: ['קמח · 1 ק״ג'], steps: [], baseServings: 4, defBy: 's1' }],
      korders: [{ id: 'ko1', mealName: '', res: 'res1', unit: 'u1', guest: 'g1', dinerGuests: ['g1'], diners: 5, date: '2026-10-16', time: '19:00', assignee: 's1', items: [{ name: 'חלה', price: 20, alg: '', qty: 4, by: '' }], status: 'new', allergens: '', seatPlan: { people: [{ id: 'p1', name: 'כהן · מבוגר 1', kind: 'adult', gid: 'g1' }], tables: [] } }],
      staff: [{ id: 's1', name: 'רחל', role: 'טבח', phone: '' }],
      supplies: [{ id: 'sp1', name: 'קולה', cat: 'שתייה', qty: '6', bought: false }],
      tableset: [{ id: 'ts1', name: 'צלחת', perGuest: 1 }],
      templog: [{ id: 'tl1', device: 'מקרר', temp: 4, ok: true, at: '2026-10-12' }],
      shabbat: { mode: 'prep', candle: '17:30', havdalah: '18:30', level: 'מהדרין', mashgiach: 'הרב לוי' },
      assets: [{ id: 'a1', name: 'דוד', category: 'חימום/דוד', unit: 'u1', crit: 'גבוה', next: '2026-11-01' }],
      mreq: [{ id: 'mr1', unit: 'u1', asset: 'a1', category: 'מים', priority: 1, desc: 'נזילה', status: 'open', safety: false, blocked: true }],
      pm: [{ id: 'pm1', task: 'ניקוי מסננים', asset: 'a1', freq: 'חודשי', due: '2026-11-01' }],
      flags: { kitchen: true, shabbat: false, maint: true },
      ui: { shopGot: { 'ing:קמח': true }, shopEmoji: { 'sup:sp1': '🍾' } },
    };
    const d = importAppBackup(src, AT);
    expect(d.source).toBe('app');
    expect(d.units[0]).toMatchObject({ id: 'u1', status: 'dirty', subRooms: [{ id: 'r1', name: 'חדר הורים', beds: 2, rate: 450 }] });
    const b = d.bookings[0];
    expect([b.guestId, b.unitId, b.roomIds, b.checkIn, b.checkOut, b.shabbat]).toEqual(['g1', 'u1', ['r1'], '2026-10-16', '2026-10-18', true]);
    expect(b.charges.map((c) => [c.id, c.kind])).toEqual([
      ['stay', 'stay'],
      ['cleaning', 'cleaning'],
      ['tax', 'tax'],
      ['shabbat', 'shabbat'],
      ['meal:ko1', 'meal'],
    ]);
    expect(b.payments).toEqual([{ id: 'p1', amount: 500, date: '2026-10-12', note: 'מקדמה' }]);
    const byKind = (k: string) => d.records.filter((r) => r.kind === k);
    expect(['guest', 'clean', 'dish', 'meal', 'staff', 'supply', 'tableItem', 'temp', 'asset', 'fault', 'plan'].map((k) => byKind(k).length)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    const meal = byKind('meal')[0] as HostMeal;
    expect([meal.bookingId, meal.cook, meal.dinerCount, meal.items[0].dishId, meal.items[0].qty]).toEqual(['res1', 's1', 5, 'd1', 4]);
    expect(meal.diners).toEqual([{ guestId: 'g1', adults: 2, kids: 3 }]);
    expect(meal.seatPlan.people[0]).toEqual({ id: 'p1', name: 'כהן · מבוגר 1', kind: 'adult', guestId: 'g1' });
    expect(d.prefs).toMatchObject({ businessName: 'צימרי הגליל', checkin: '14:00', cleaningFee: 120, orderLeadDays: 3, familyTerm: true, shabbat: { mode: 'prep', candle: '17:30', mashgiach: 'הרב לוי' }, shopGot: { 'ing:קמח': true } });
    expect(d.flagsOff).toEqual(['hosting.shabbat']);
    // שם-ברירת-המחדל של המקור לא דורס את שם-הארגון
    expect(importAppBackup({ ...src, org: { ...src.org, name: 'אירוח משפחתי' } }, AT).prefs.businessName).toBeUndefined();
    const parsed = parseHostingBackup(src, AT);
    expect(parsed.ok && parsed.data.source).toBe('app');
  });
});
