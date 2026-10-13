/**
 * ratchet — 🏡 אירוח 3: המנוע הטהור — זמינות, תמחור, תיק, מצב-יחידה, לוח-בקרה, יומן, שבת/יו״ט
 * (BUILD-ORDER-HOSTING-2026-10-12). כל תיקון מול המקור (F1–F11) ננעל כאן במפורש, עם תיאור הבאג.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import type { HostBooking, HostCleanTask, HostCharge, HostMeal, HostUnit } from '../../../types/domain';
import {
  addDaysIso,
  arrivalsOn,
  arrivalWarnings,
  bookingBalance,
  bookingCounts,
  bookingParty,
  bookingPaid,
  bookingsKpis,
  bookingsView,
  bookingTotal,
  calendarBars,
  calendarMonth,
  canAddPayment,
  canSetBookingStatus,
  checkAvailability,
  checkoutTasksToClose,
  currentStay,
  dashboardOf,
  departuresOn,
  faultBlocksUnit,
  fmtDM,
  greetingOf,
  guestStats,
  guestsView,
  hostCan,
  hostSettings,
  hostTerms,
  initialsOf,
  money,
  monthPaidRevenue,
  nextFaultStatus,
  nextLocalId,
  nextStay,
  nightsBetween,
  openBalances,
  overlaps,
  priceQuote,
  revenueSeries,
  roomsLabel,
  sacredDayOf,
  shabbatPackageMeal,
  staySacredDays,
  syncMealsToParty,
  systemCharges,
  tempOk,
  unitFreeAfter,
  unitLiveStatus,
  waShareHref,
  withMealCharge,
  withSystemCharges,
} from '../lib';

const AT = '2026-10-12T08:00:00.000Z';
const S = hostSettings();

function U(over: Partial<HostUnit> = {}): HostUnit {
  return { id: 'hu1', name: 'צימר הגפן', type: 'צימר', beds: 2, cap: 4, rate: 600, status: 'free', subRooms: [], createdAt: AT, updatedAt: AT, ...over };
}
function UR(over: Partial<HostUnit> = {}): HostUnit {
  return U({
    id: 'hu2',
    name: 'בית ההארחה',
    type: 'בית הארחה',
    cap: 10,
    subRooms: [
      { id: 'r1', name: 'חדר הורים', beds: 2, rate: 300 },
      { id: 'r2', name: 'חדר ילדים', beds: 3, rate: 350 },
    ],
    ...over,
  });
}
function B(over: Partial<HostBooking> = {}): HostBooking {
  return {
    id: 'hb1',
    guestId: 'hg1',
    unitId: 'hu1',
    roomIds: [],
    checkIn: '2026-10-14',
    checkOut: '2026-10-16',
    adults: 2,
    kids: 1,
    status: 'confirmed',
    charges: [],
    payments: [],
    notes: '',
    shabbat: false,
    createdAt: AT,
    updatedAt: AT,
    ...over,
  };
}
function M(over: Partial<HostMeal> = {}): HostMeal {
  return {
    id: 'hm1',
    kind: 'meal',
    mealName: 'ארוחת ערב',
    bookingId: 'hb1',
    unitId: 'hu1',
    guestId: 'hg1',
    diners: [{ guestId: 'hg1', adults: 2, kids: 0 }],
    dinerCount: 2,
    date: '2026-10-14',
    time: '19:00',
    cook: '',
    server: '',
    clearer: '',
    tableSetter: '',
    items: [
      { name: 'עוף', price: 50, qty: 2, alg: '', by: '' },
      { name: 'יין', price: 30, qty: 5, alg: '', by: '' },
    ],
    status: 'new',
    allergens: '',
    notes: '',
    seatPlan: { people: [], tables: [] },
    createdAt: AT,
    updatedAt: AT,
    ...over,
  };
}
function T(over: Partial<HostCleanTask> = {}): HostCleanTask {
  return { id: 'hk1', kind: 'clean', unitId: 'hu1', type: 'ניקיון אחרי עזיבה', status: 'open', date: '2026-10-12', createdAt: AT, updatedAt: AT, ...over };
}

describe('🏡 תאריכים ותיק-שהייה', () => {
  it('לילות [in,out) · הוספת-ימים חוצת-חודש/שנה · חפיפה חצי-פתוחה (עזיבה = הגעה ⇒ אין חפיפה)', () => {
    expect(nightsBetween('2026-10-14', '2026-10-16')).toBe(2);
    expect(nightsBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(nightsBetween('xx', '2026-10-16')).toBe(0);
    expect(addDaysIso('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDaysIso('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysIso('garbage', 1)).toBe('');
    expect(overlaps('2026-10-14', '2026-10-16', '2026-10-16', '2026-10-18')).toBe(false);
    expect(overlaps('2026-10-14', '2026-10-17', '2026-10-16', '2026-10-18')).toBe(true);
  });

  it('סה״כ · שולם · יתרה · משתתפים', () => {
    const b = B({ charges: [{ id: 'stay', kind: 'stay', label: 'לינה', amount: 1200 }, { id: 'tax', kind: 'tax', label: 'מע״מ', amount: 230 }], payments: [{ id: 'p1', amount: 500, date: '2026-10-12', note: '' }] });
    expect(bookingTotal(b)).toBe(1430);
    expect(bookingPaid(b)).toBe(500);
    expect(bookingBalance(b)).toBe(930);
    expect(bookingParty(b)).toBe(3);
    expect(bookingParty(null)).toBe(0);
  });
});

describe('🏡 זמינות מודעת-חדרים (מניעת overbooking)', () => {
  it('יחידה שלמה: חפיפה ⇒ התנגשות; בוטלה/הושלמה לא חוסמות; עריכה מחריגה את עצמה; גב-אל-גב מותר', () => {
    const u = U();
    const list = [B()];
    expect(checkAvailability(list, u, '2026-10-15', '2026-10-17', [])).toEqual({ ok: false, reason: 'clash' });
    expect(checkAvailability(list, u, '2026-10-16', '2026-10-18', [])).toEqual({ ok: true });
    expect(checkAvailability([B({ status: 'cancelled' })], u, '2026-10-15', '2026-10-17', [])).toEqual({ ok: true });
    expect(checkAvailability([B({ status: 'done' })], u, '2026-10-15', '2026-10-17', [])).toEqual({ ok: true });
    expect(checkAvailability(list, u, '2026-10-14', '2026-10-17', [], 'hb1')).toEqual({ ok: true });
    expect(checkAvailability(list, u, '2026-10-16', '2026-10-16', [])).toEqual({ ok: false, reason: 'dates' });
  });

  it('יחידה משותפת: חדר תפוס חוסם רק אותו; הזמנה בלי חדרים חוסמת הכול; חובה לבחור חדר', () => {
    const u = UR();
    const list = [B({ unitId: 'hu2', roomIds: ['r1'] })];
    expect(checkAvailability(list, u, '2026-10-14', '2026-10-16', ['r1']).ok).toBe(false);
    expect(checkAvailability(list, u, '2026-10-14', '2026-10-16', ['r2'])).toEqual({ ok: true });
    expect(checkAvailability(list, u, '2026-10-14', '2026-10-16', [])).toEqual({ ok: false, reason: 'rooms' });
    const whole = [B({ unitId: 'hu2', roomIds: [] })];
    expect(checkAvailability(whole, u, '2026-10-14', '2026-10-16', ['r2'])).toEqual({ ok: false, reason: 'clash' });
    expect(roomsLabel(u, ['r1', 'r2'])).toBe('חדר הורים + חדר ילדים');
  });

  it('🐛 F1 — יחידה חסומה (תקלת P0/P1 / "🚫 חסום") לא ניתנת להזמנה (במקור isAvailableRooms התעלם מ-status)', () => {
    expect(checkAvailability([], U({ status: 'blocked' }), '2026-11-01', '2026-11-03', [])).toEqual({ ok: false, reason: 'blocked' });
    expect(checkAvailability([], U({ status: 'dirty' }), '2026-11-01', '2026-11-03', [])).toEqual({ ok: true });
  });
});

describe('🏡 תמחור וחיובים', () => {
  it('יחידה שלמה: מחיר×לילות + ניקיון + מע״מ מעוגל על השניים (כמו המקור)', () => {
    const q = priceQuote(U(), [], '2026-10-14', '2026-10-16', S);
    expect([q.nights, q.rate, q.stay, q.cleaning, q.tax, q.total]).toEqual([2, 600, 1200, 150, 230, 1580]);
    expect(q.stayLabel).toBe('לינה · 2 לילות');
    expect(systemCharges(q).map((c) => [c.id, c.kind, c.label, c.amount])).toEqual([
      ['stay', 'stay', 'לינה · 2 לילות', 1200],
      ['cleaning', 'cleaning', 'דמי ניקיון', 150],
      ['tax', 'tax', 'מע״מ 17%', 230],
    ]);
  });

  it('יחידה משותפת: סכום מחירי-החדרים שנבחרו + שמות-החדרים בתווית', () => {
    const q = priceQuote(UR(), ['r1', 'r2'], '2026-10-14', '2026-10-16', { ...S, cleaningFee: 100, taxPct: 0 });
    expect([q.rate, q.stay, q.tax, q.total]).toEqual([650, 1300, 0, 1400]);
    expect(q.stayLabel).toBe('לינה · 2 לילות · חדר הורים + חדר ילדים');
  });

  it('🐛 F3 — שמירת-הזמנה מחליפה רק לינה/ניקיון/מע״מ; חבילת-שבת, ארוחה וחיוב-ידני נשמרים (במקור "חבילת שבת" נמחקה)', () => {
    const old: HostCharge[] = [
      { id: 'stay', kind: 'stay', label: 'לינה · 2 לילות', amount: 1200 },
      { id: 'cleaning', kind: 'cleaning', label: 'דמי ניקיון', amount: 150 },
      { id: 'tax', kind: 'tax', label: 'מע״מ 17%', amount: 230 },
      { id: 'shabbat', kind: 'shabbat', label: 'חבילת שבת', amount: 250 },
      { id: 'meal:hm1', kind: 'meal', label: 'הזמנת מטבח (2 מנות)', amount: 250, mealId: 'hm1' },
      { id: 'c9', kind: 'extra', label: 'מיטה נוספת', amount: 80 },
    ];
    const q = priceQuote(U(), [], '2026-10-14', '2026-10-17', S);
    const next = withSystemCharges(old, q);
    expect(next.map((c) => c.id)).toEqual(['stay', 'cleaning', 'tax', 'shabbat', 'meal:hm1', 'c9']);
    expect(next[0].amount).toBe(1800);
    expect(next.find((c) => c.kind === 'shabbat')?.amount).toBe(250);
  });
});

describe('🏡 ארוחות ⇄ תיק', () => {
  it('🐛 F4 — ארוחה שבוטלה לא מחויבת (במקור הביטול השאיר את החיוב בתיק); פעילה ⇒ חיוב אחד מתחדש', () => {
    const base: HostCharge[] = [{ id: 'stay', kind: 'stay', label: 'לינה', amount: 100 }];
    const withMeal = withMealCharge(base, M());
    expect(withMeal.find((c) => c.mealId === 'hm1')).toEqual({ id: 'meal:hm1', kind: 'meal', label: 'הזמנת מטבח (2 מנות)', amount: 250, mealId: 'hm1' });
    expect(withMealCharge(withMeal, M()).filter((c) => c.mealId === 'hm1')).toHaveLength(1);
    expect(withMealCharge(withMeal, M({ status: 'cancelled' })).some((c) => c.mealId === 'hm1')).toBe(false);
    expect(withMealCharge(base, M({ items: [{ name: 'מים', price: 0, qty: 3, alg: '', by: '' }] }))).toEqual(base);
  });

  it('סנכרון לגודל-ההזמנה: סועדים ⇐ משתתפים; כמות שלא שונתה ידנית מתעדכנת; נמסרה/בוטלה — לא נוגעים', () => {
    const b = B({ adults: 3, kids: 2, charges: [] });
    const res = syncMealsToParty([M(), M({ id: 'hm2', status: 'served' }), M({ id: 'hm3', bookingId: 'hbX' })], b, AT);
    expect(res.meals.map((m) => m.id)).toEqual(['hm1']);
    const m = res.meals[0];
    expect(m.dinerCount).toBe(5);
    expect(m.items.map((i) => i.qty)).toEqual([5, 5]); // 2 (=הסועדים הקודמים) ⇒ 5; 5 (שונה ידנית) נשאר 5
    expect(res.charges).toEqual([{ id: 'meal:hm1', kind: 'meal', label: 'הזמנת מטבח (2 מנות)', amount: 50 * 5 + 30 * 5, mealId: 'hm1' }]);
  });
});

describe('🏡 מחזור-חיי-ההזמנה', () => {
  it('מעברים מותרים בלבד (אישור/צ׳ק-אין/צ׳ק-אאוט/ביטול); הושלמה/בוטלה — סופיות', () => {
    expect(canSetBookingStatus('pending', 'confirmed')).toBe(true);
    expect(canSetBookingStatus('pending', 'in')).toBe(true); // קיצור-הלוח של המקור
    expect(canSetBookingStatus('confirmed', 'in')).toBe(true);
    expect(canSetBookingStatus('in', 'done')).toBe(true);
    expect(canSetBookingStatus('confirmed', 'done')).toBe(false);
    expect(canSetBookingStatus('done', 'cancelled')).toBe(false);
    expect(canSetBookingStatus('cancelled', 'confirmed')).toBe(false);
    expect(canSetBookingStatus('in', 'cancelled')).toBe(true);
  });

  it('🐛 F6 — תשלום מותר גם אחרי צ׳ק-אאוט (החוב מופיע בדוח-הגבייה); רק בוטלה — לא', () => {
    expect(canAddPayment({ status: 'done' })).toBe(true);
    expect(canAddPayment({ status: 'in' })).toBe(true);
    expect(canAddPayment({ status: 'cancelled' })).toBe(false);
  });

  it('🐛 F9 — חבילת-שבת: הסועדים מההזמנה (לא מכרטיס-האורח), 4 פריטים, תאריך-ההגעה ושעת-הצ׳ק-אין', () => {
    const m = shabbatPackageMeal(B({ adults: 2, kids: 3 }), { ...S, checkin: '14:00' }, 'hm9', AT);
    expect([m.dinerCount, m.mealName, m.date, m.time, m.bookingId]).toEqual([5, 'חבילת שבת', '2026-10-14', '14:00', 'hb1']);
    expect(m.diners).toEqual([{ guestId: 'hg1', adults: 2, kids: 3 }]);
    expect(m.items.map((i) => i.name)).toEqual(['נרות', 'חלות', 'מיץ ענבים', 'פלטה + מיחם']);
  });
});

describe('🏡 ניקיון · תחזוקה · טמפרטורה', () => {
  it('🐛 F10 — סיום משימה משחרר יחידה מלוכלכת רק כשאין לה משימה פתוחה אחרת (במקור כל סיום שחרר)', () => {
    const recs = [T(), T({ id: 'hk2', type: 'מילוי מוצרים' }), T({ id: 'hk3', unitId: 'hu9' })];
    expect(unitFreeAfter(U({ status: 'dirty' }), recs, 'hk2')).toBe(false); // "ניקיון אחרי עזיבה" עוד פתוחה
    expect(unitFreeAfter(U({ status: 'dirty' }), [T(), T({ id: 'hk2', status: 'done' })], 'hk1')).toBe(true);
    expect(unitFreeAfter(U({ status: 'free' }), [T()], 'hk1')).toBe(false);
  });

  it('🐛 F11 — "🧹 נקייה" ידני סוגר רק את "ניקיון אחרי עזיבה" הפתוחות של אותה יחידה', () => {
    const recs = [T(), T({ id: 'hk2', type: 'מילוי מוצרים' }), T({ id: 'hk3', status: 'done' }), T({ id: 'hk4', unitId: 'hu9' })];
    expect(checkoutTasksToClose('hu1', recs)).toEqual(['hk1']);
  });

  it('P0/P1 חוסמות · פתוחה⇒בטיפול⇒טופלה · ספי בטיחות-מזון (מקרר ≤5 · מקפיא ≤−15 · חימום ≥63)', () => {
    expect([0, 1, 2, 4].map(faultBlocksUnit)).toEqual([true, true, false, false]);
    expect([nextFaultStatus('open'), nextFaultStatus('inprogress'), nextFaultStatus('done')]).toEqual(['inprogress', 'done', null]);
    expect([tempOk('מקרר', 5), tempOk('מקרר', 6), tempOk('מקפיא', -15), tempOk('מקפיא', -14), tempOk('חימום', 63), tempOk('חימום', 62)]).toEqual([true, false, true, false, true, false]);
  });

  it('מזהה-מקומי הבא (חדרים/תשלומים/הושבה) — דטרמיניסטי', () => {
    expect(nextLocalId('r', [])).toBe('r1');
    expect(nextLocalId('r', [{ id: 'r1' }, { id: 'r7' }, { id: 'rx2' }, { id: 'p9' }])).toBe('r8');
  });

  it('הרשאות 🔓: מודול כבוי ⇒ אין; מקומי בלי ענן ⇒ סמכות-מנהל; עובד/ת ⇒ רק בהדלקה', () => {
    const on: OrgConfig = { ...DEFAULT_CONFIG, modules: { hosting: true } };
    expect(hostCan({ ...DEFAULT_CONFIG, modules: {} }, null, false, 'hosting.delete')).toBe(false);
    expect(hostCan(on, null, false, 'hosting.delete')).toBe(true);
    const cfg: OrgConfig = { ...on, adminEmails: ['boss@x.org'] };
    expect(hostCan(cfg, 'emp@x.org', false, 'hosting.manage')).toBe(false);
    expect(hostCan({ ...cfg, features: { 'hosting.manage': true } }, 'emp@x.org', false, 'hosting.manage')).toBe(true);
  });
});

describe('🏡 מצב-חי · לוח-בקרה (F2/F6/F8)', () => {
  const today = '2026-10-15';

  it('🐛 F8 — יחידה עם אורח שעבר את מועד-העזיבה בלי צ׳ק-אאוט: "תפוסה" (במקור הוצגה "פנויה")', () => {
    const overstay = B({ status: 'in', checkIn: '2026-10-10', checkOut: '2026-10-13' });
    expect(unitLiveStatus(U(), [overstay], today)).toBe('occupied');
    expect(unitLiveStatus(U({ status: 'blocked' }), [overstay], today)).toBe('blocked');
    expect(unitLiveStatus(U({ status: 'dirty' }), [], today)).toBe('dirty');
    expect(unitLiveStatus(U(), [B({ status: 'confirmed' })], today)).toBe('free');
    expect(currentStay(U(), [overstay], today)?.id).toBe('hb1');
    expect(nextStay(U(), [B({ id: 'n1', checkIn: '2026-10-20', checkOut: '2026-10-22' }), B({ id: 'n2', checkIn: '2026-10-18', checkOut: '2026-10-19' })], today)?.id).toBe('n2');
  });

  it('🐛 F8 — הגעה מאוחרת ועזיבה שעבר זמנה נשארות ברשימות עם סימון (במקור נעלמו מהלוח)', () => {
    const late = B({ id: 'late', checkIn: '2026-10-13', checkOut: '2026-10-17' });
    const now = B({ id: 'now', checkIn: today, checkOut: '2026-10-17', status: 'pending' });
    const future = B({ id: 'fut', checkIn: '2026-10-20', checkOut: '2026-10-22' });
    expect(arrivalsOn([late, now, future], today).map((a) => [a.b.id, a.late])).toEqual([
      ['late', true],
      ['now', false],
    ]);
    const due = B({ id: 'due', status: 'in', checkIn: '2026-10-12', checkOut: today });
    const over = B({ id: 'over', status: 'in', checkIn: '2026-10-10', checkOut: '2026-10-13' });
    expect(departuresOn([due, over, B({ id: 'stay', status: 'in', checkOut: '2026-10-19' })], today).map((d) => [d.b.id, d.overdue])).toEqual([
      ['over', true],
      ['due', false],
    ]);
  });

  it('🐛 F2 — "הכנסות החודש" לפי חודש **ושנה** (במקור getMonth בלבד: אוקטובר-שעבר נספר)', () => {
    const pay = (amount: number) => [{ id: 'p1', amount, date: '2026-01-01', note: '' }];
    const list = [B({ id: 'now', checkIn: '2026-10-02', payments: pay(400) }), B({ id: 'last', checkIn: '2025-10-02', payments: pay(9000) }), B({ id: 'x', checkIn: '2026-10-05', status: 'cancelled', payments: pay(7) })];
    expect(monthPaidRevenue(list, today)).toBe(400);
    const series = revenueSeries(list, today, 6);
    expect(series.map((s) => s.ym)).toEqual(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
    expect(series[5].paid).toBe(400);
  });

  it('🐛 F6 — יתרות פתוחות כוללות חוב שנשאר אחרי צ׳ק-אאוט; בוטלה — לא; ממוין מהגדול', () => {
    const ch = (n: number) => [{ id: 'stay', kind: 'stay' as const, label: 'לינה', amount: n }];
    const list = [B({ id: 'a', status: 'done', charges: ch(300) }), B({ id: 'b', charges: ch(900) }), B({ id: 'c', status: 'cancelled', charges: ch(5000) })];
    expect(openBalances(list).map((b) => b.id)).toEqual(['b', 'a']);
  });

  it('לוח-הבקרה מצרף: תפוסה%, משימות-פתוחות, לניקיון, יתרות', () => {
    const units = [U(), U({ id: 'hu3', status: 'dirty' }), U({ id: 'hu4', status: 'blocked' }), U({ id: 'hu5' })];
    const bookings = [B({ status: 'in', checkIn: '2026-10-14', checkOut: '2026-10-17', charges: [{ id: 'stay', kind: 'stay', label: 'לינה', amount: 1000 }] })];
    const d = dashboardOf(units, bookings, [T({ unitId: 'hu3' }), T({ id: 'x', status: 'done' })], today);
    expect([d.unitsN, d.occN, d.occPct, d.freeN, d.blockedN, d.openTasks]).toEqual([4, 1, 25, 1, 1, 1]);
    expect(d.dirtyUnits.map((u) => u.id)).toEqual(['hu3']);
    expect(d.openBalSum).toBe(1000);
    expect(d.live.hu1).toBe('occupied');
  });
});

describe('🏡 רשימות (הזמנות · אורחים)', () => {
  const guests = new Map([
    ['hg1', { name: 'משפחת כהן', phone: '050-1111111', email: 'c@x.org' }],
    ['hg2', { name: 'משפחת לוי', phone: '052-2222222', email: '' }],
  ]);
  const units = new Map([['hu1', { name: 'צימר הגפן' }]]);

  it('הזמנות: מיון לפי הגעה (המאוחרת ראשונה) · סינון-סטטוס · חיפוש אורח/יחידה/טלפון · מונים', () => {
    const list = [B({ id: 'a', checkIn: '2026-10-01' }), B({ id: 'b', checkIn: '2026-10-20', guestId: 'hg2', status: 'pending' }), B({ id: 'c', checkIn: '2026-10-10', status: 'cancelled' })];
    expect(bookingsView(list, 'all', '', (id) => guests.get(id), (id) => units.get(id)).map((b) => b.id)).toEqual(['b', 'c', 'a']);
    expect(bookingsView(list, 'pending', '', (id) => guests.get(id), (id) => units.get(id)).map((b) => b.id)).toEqual(['b']);
    expect(bookingsView(list, 'all', '2222', (id) => guests.get(id), (id) => units.get(id)).map((b) => b.id)).toEqual(['b']);
    expect(bookingsView(list, 'all', 'הגפן', (id) => guests.get(id), (id) => units.get(id))).toHaveLength(3);
    expect(bookingCounts(list)).toEqual({ all: 3, pending: 1, confirmed: 1, in: 0, done: 0, cancelled: 1 });
  });

  it('KPI מרכז-ההזמנות: הכנסת-החודש = חיובים בטווח-החודש; לגבייה = יתרות חיוביות', () => {
    const ch = (n: number) => [{ id: 'stay', kind: 'stay' as const, label: 'לינה', amount: n }];
    const k = bookingsKpis([B({ checkIn: '2026-10-15', checkOut: '2026-10-18', charges: ch(700) }), B({ id: 'z', checkIn: '2026-09-02', checkOut: '2026-09-04', charges: ch(100), payments: [{ id: 'p', amount: 300, date: '', note: '' }] })], '2026-10-15');
    expect(k).toEqual({ arrivals: 1, departures: 0, inHouse: 0, monthCharged: 700, owed: 700 });
  });

  it('אורחים: שהיות/הוצאה/אחרון בלי ביטולים; מיון לפי הוצאה; חיפוש בטלפון/מייל', () => {
    const ch = (n: number) => [{ id: 'stay', kind: 'stay' as const, label: 'לינה', amount: n }];
    const bookings = [B({ charges: ch(500) }), B({ id: 'b2', checkIn: '2026-11-01', checkOut: '2026-11-02', charges: ch(200) }), B({ id: 'b3', guestId: 'hg2', charges: ch(900) }), B({ id: 'b4', status: 'cancelled', charges: ch(5000) })];
    expect(guestStats('hg1', bookings)).toEqual({ stays: 2, spend: 700, last: '2026-11-01' });
    const g = (id: string, name: string, phone: string, email = '') => ({ id, kind: 'guest' as const, name, phone, email, adults: 2, kids: 0, notes: '', createdAt: AT, updatedAt: AT });
    const view = guestsView([g('hg1', 'משפחת כהן', '050-1111111', 'c@x.org'), g('hg2', 'משפחת לוי', '052-2222222')], bookings, '');
    expect(view.map((x) => x.g.id)).toEqual(['hg2', 'hg1']);
    expect(guestsView([g('hg1', 'כהן', '050-1111111', 'c@x.org')], bookings, 'c@x').map((x) => x.g.id)).toEqual(['hg1']);
  });
});

describe('🏡 יומן-תפוסה מעל lib/monthGrid + שבת/יו״ט מהמנוע העברי', () => {
  it('חודש לועזי: 31 ימים, שישי-שבת מודגשים, שבתות ויו״ט מסומנים מהלוח העברי, ניווט', () => {
    const m = calendarMonth('2026-10-14', false, '2026-10-14');
    expect(m.days).toHaveLength(31);
    expect(m.label).toBe('אוקטובר 2026');
    const d17 = m.days.find((d) => d.iso === '2026-10-17')!;
    expect([d17.weekend, d17.sacred]).toEqual([true, 'שבת']);
    const d16 = m.days.find((d) => d.iso === '2026-10-16')!;
    expect([d16.weekend, d16.sacred]).toEqual([true, null]); // שישי — מודגש, לא שבת
    expect(m.days.find((d) => d.iso === '2026-10-14')!.today).toBe(true);
    expect(m.prevIso.slice(0, 7)).toBe('2026-09');
    expect(m.nextIso.slice(0, 7)).toBe('2026-11');
    expect(calendarMonth('2026-09-10', false, '2026-10-14').days.find((d) => d.iso === '2026-09-21')!.sacred).toBe('יום כיפור');
  });

  it('חודש עברי (מעבר עברי↔לועזי): החודש העברי המלא, כותרת עברית (לא "Heshvan")', () => {
    const h = calendarMonth('2026-10-14', true, '2026-10-14');
    expect(h.days[0].iso).toBe('2026-10-12'); // א׳ חשוון תשפ״ז
    expect(h.days).toHaveLength(30);
    expect(h.days[0].head).toBe('א׳');
    expect(h.label).toContain('תשפ״ז');
    expect(h.label).not.toMatch(/[A-Za-z]/);
  });

  it('sacredDayOf: שבת/יו״ט כן · תשעה באב (צום) לא · חול לא; ימי-שבת בשהייה; אזהרת צ׳ק-אין/אאוט', () => {
    expect(sacredDayOf('2026-09-13')).toBe('ראש השנה ב׳');
    expect(sacredDayOf('2026-04-02')).toBe('פסח');
    expect(sacredDayOf('2026-07-23')).toBeNull(); // ט׳ באב תשפ״ו — צום, לא יו״ט
    expect(sacredDayOf('2026-10-14')).toBeNull();
    expect(staySacredDays('2026-10-16', '2026-10-18')).toEqual([{ iso: '2026-10-17', name: 'שבת' }]);
    expect(arrivalWarnings('2026-10-17', '2026-10-19')).toEqual(['צ׳ק-אין בשבת']);
    expect(arrivalWarnings('2026-09-20', '2026-09-21')).toEqual(['צ׳ק-אאוט ביום טוב · יום כיפור']);
    expect(arrivalWarnings('2026-10-14', '2026-10-16')).toEqual([]);
  });

  it('פסים + נתיבים: חדרים חופפים ⇒ 2 נתיבים; קיטום לקצוות-החודש; בוטלה לא מוצגת; תווית = אורח · חדרים', () => {
    const days = calendarMonth('2026-10-14', false, '2026-10-14').days.map((d) => d.iso);
    const u = UR();
    const list = [
      B({ id: 'a', unitId: 'hu2', roomIds: ['r1'], checkIn: '2026-09-28', checkOut: '2026-10-03' }),
      B({ id: 'b', unitId: 'hu2', roomIds: ['r2'], checkIn: '2026-10-01', checkOut: '2026-10-04' }),
      B({ id: 'c', unitId: 'hu2', roomIds: ['r1'], checkIn: '2026-10-29', checkOut: '2026-11-04', status: 'in' }),
      B({ id: 'x', unitId: 'hu2', roomIds: ['r2'], checkIn: '2026-10-10', checkOut: '2026-10-12', status: 'cancelled' }),
    ];
    const { bars, lanes } = calendarBars([u], list, days, (id) => (id === 'hg1' ? 'כהן' : '?'));
    expect(lanes.hu2).toBe(2);
    expect(bars.map((b) => [b.id, b.start, b.span, b.lane])).toEqual([
      ['a', 0, 2, 0], // 28.9–3.10 ⇒ 1–2.10 בתוך החלון
      ['b', 0, 3, 1],
      ['c', 28, 3, 0], // 29.10 ⇒ סוף החודש
    ]);
    expect(bars[0].label).toBe('כהן · חדר הורים');
  });
});

describe('🏡 עזרי-תצוגה (נוסח המקור)', () => {
  it('כסף · תאריך · ראשי-תיבות · ברכה לפי שעה · שיתוף-וואטסאפ', () => {
    expect(money(1234.6)).toBe('₪ 1,235');
    expect(money(NaN)).toBe('₪ 0');
    expect(fmtDM('2026-10-04')).toBe('4/10');
    expect(fmtDM('')).toBe('—');
    expect(initialsOf('משה כהן')).toBe('מכ');
    expect(initialsOf('שרה')).toBe('שר');
    expect(initialsOf('')).toBe('·');
    expect([4, 11, 16, 20, 22].map((h) => greetingOf(h)[0])).toEqual(['לילה טוב', 'בוקר טוב', 'צהריים טובים', 'ערב טוב', 'לילה טוב']);
    expect(waShareHref('שלום & ברכה', false)).toBe('https://wa.me/?text=' + encodeURIComponent('שלום & ברכה'));
    expect(waShareHref('x', true)).toBe('whatsapp://send?text=x');
  });
});

describe('🏡 מונחים (מקור-אמת אחד לממשק ול-store)', () => {
  it('hostTerms: נוסח המקור; "משפחה מתארחת"/"משפחות" כשהמתג דלוק; מונח-האשף גובר על המתג', () => {
    expect(hostTerms(DEFAULT_CONFIG)).toEqual({ nav: 'אירוח משפחתי', unit: 'יחידה', units: 'יחידות', guest: 'אורח', guests: 'אורחים', booking: 'הזמנה', bookings: 'הזמנות' });
    expect(hostTerms(DEFAULT_CONFIG, { familyTerm: true })).toMatchObject({ guest: 'משפחה מתארחת', guests: 'משפחות' });
    const cfg: OrgConfig = { ...DEFAULT_CONFIG, terms: { 'entity.hostGuest': 'נופש', 'nav.hosting': 'הצימרים' } };
    expect(hostTerms(cfg, { familyTerm: true })).toMatchObject({ guest: 'נופש', guests: 'משפחות', nav: 'הצימרים' });
  });
});

describe('🏡 טוהר-המנוע (הגנת-מקור)', () => {
  const ENGINE = import.meta.glob(['../transitions.ts', '../lib.ts', '../kitchen.ts', '../seating.ts', '../reports.ts', '../importer.ts', '../model.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  it('7 קובצי-המנוע: בלי store/DOM/שעון — "היום"/"עכשיו" מוזרקים', () => {
    expect(Object.keys(ENGINE)).toHaveLength(7);
    for (const [path, src] of Object.entries(ENGINE)) {
      expect(src, path + ' — store').not.toContain('useApp');
      expect(src, path + ' — שעון').not.toMatch(/Date\.now\(|new Date\(\)/);
      expect(src, path + ' — DOM').not.toMatch(/\bdocument\.|\bwindow\.|localStorage/);
    }
  });
});
