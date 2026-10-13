/**
 * 🏡 אירוח משפחתי — "מרכז הדוחות" (BUILD-ORDER-HOSTING-2026-10-12, אשכול 3) — פורט של `buildReport` במקור.
 *
 * 6 דוחות (הכנסות · תפוסה · אורחים · מטבח · גבייה · סיכום מנהלים) × 6 טווחים (החודש · חודש שעבר · 30 יום · השנה ·
 * הכל · טווח מותאם) ⇒ KPI + עמודות + טבלה + שורות-CSV; ויציאות: טקסט (העתקה/וואטסאפ), מסמך HTML (הדפסה/הורדה).
 * בלי store/DOM/Date.now — "היום" והחותמת מוזרקים. כל ערך במסמך-ה-HTML עובר escaping.
 */
import type { HostBooking, HostMeal, HostUnit } from '../../types/domain';
import { addDaysIso, bookingBalance, bookingPaid, bookingTotal, isActive, nightsBetween } from './transitions';
import { fmtDM, money, monthBounds } from './lib';

export type HostRepType = 'revenue' | 'occupancy' | 'guests' | 'kitchen' | 'debts' | 'summary';
export type HostRepPreset = 'month' | 'prevmonth' | '30' | 'year' | 'all' | 'custom';

/** גלריית-הדוחות (`REP_TYPES`) — [מפתח, אייקון, כותרת, תיאור, צבע-סקין]. */
export const REP_TYPES: readonly (readonly [HostRepType, string, string, string, string])[] = [
  ['revenue', '💰', 'הכנסות', 'חיובים · תשלומים · יתרות', 'var(--h-good)'],
  ['occupancy', '🏠', 'תפוסה', 'לילות מכורים מול זמינים', 'var(--h-info)'],
  ['guests', '👪', 'אורחים', 'ביקורים · הוצאה · חוזרים', 'var(--h-violet)'],
  ['kitchen', '🍽️', 'מטבח', 'ארוחות · סועדים · מנות', 'var(--h-amber)'],
  ['debts', '🧾', 'גבייה', 'יתרות פתוחות לגבייה', 'var(--h-crit)'],
  ['summary', '📅', 'סיכום מנהלים', 'תמונת-על של התקופה', 'var(--h-brand)'],
];

export const REP_PRESETS: readonly (readonly [HostRepPreset, string])[] = [
  ['month', 'החודש'],
  ['prevmonth', 'חודש שעבר'],
  ['30', '30 יום'],
  ['year', 'השנה'],
  ['all', 'הכל'],
  ['custom', 'טווח מותאם'],
];

const fmtMonthYear = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthLabel = (iso: string) => fmtMonthYear.format(new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, 1)));

/** הטווח לפי ה-preset (`repRange`) — מותאם: קצה ריק ⇒ 30 יום אחורה / היום; הפוך ⇒ מוחלף. */
export function repRange(preset: HostRepPreset, from: string, to: string, today: string): { from: string; to: string; label: string } {
  if (preset === 'custom') {
    const f = from || addDaysIso(today, -30);
    const t = to || today;
    const [a, b] = f <= t ? [f, t] : [t, f];
    return { from: a, to: b, label: 'טווח מותאם · ' + fmtDM(f) + ' – ' + fmtDM(t) };
  }
  if (preset === 'prevmonth') {
    const y = +today.slice(0, 4);
    const m = +today.slice(5, 7);
    const prev = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
    const b = monthBounds(prev);
    return { from: b.from, to: b.to, label: 'חודש שעבר · ' + monthLabel(prev) };
  }
  if (preset === '30') return { from: addDaysIso(today, -29), to: today, label: '30 הימים האחרונים' };
  if (preset === 'year') return { from: today.slice(0, 4) + '-01-01', to: today.slice(0, 4) + '-12-31', label: 'שנת ' + today.slice(0, 4) };
  if (preset === 'all') return { from: '2000-01-01', to: '2999-12-31', label: 'כל הזמנים' };
  const b = monthBounds(today);
  return { from: b.from, to: b.to, label: 'החודש · ' + monthLabel(today) };
}

const inRange = (iso: string, from: string, to: string) => iso >= from && iso <= to;
/** מס׳ הימים בטווח (כולל) — `daysInRange`. */
export function daysInRange(from: string, to: string): number {
  return Math.max(1, nightsBetween(from, to) + 1);
}
/** הלילות של שהייה שבתוך הטווח — `rangeNights`. */
export function rangeNights(checkIn: string, checkOut: string, from: string, to: string): number {
  const a = checkIn > from ? checkIn : from;
  const end = addDaysIso(to, 1);
  const b = checkOut < end ? checkOut : end;
  return Math.max(0, nightsBetween(a, b));
}

export interface HostReportKpi {
  kc: string;
  lab: string;
  val: string;
  sub: string;
}
export interface HostReport {
  key: HostRepType;
  title: string;
  sub: string;
  kc: string;
  kpis: HostReportKpi[];
  cols: string[];
  rows: string[][];
  viz: { max: number; items: { name: string; val: number; disp: string }[] };
  csvHead: string[];
  csvRows: (string | number)[][];
}

export interface HostReportData {
  units: readonly HostUnit[];
  bookings: readonly HostBooking[];
  meals: readonly HostMeal[];
  guestName: (id: string) => string;
  unitName: (id: string) => string;
  /** מונח-האורח (termOf + "משפחה מתארחת"). */
  guestWord: string;
  guestsWord: string;
  /** מונחי-היחידה וההזמנה (termOf — אשף) — חסר = "יחידה/יחידות", "הזמנה/הזמנות" של המקור. */
  unitWord?: string;
  unitsWord?: string;
  bookingWord?: string;
  bookingsWord?: string;
}

const vmaxOf = (items: { val: number }[]) => items.reduce((m, x) => Math.max(m, x.val), 0);

/** תאריך-הארוחה: התאריך שלה, ואם אין — הגעת-ההזמנה (כמו במקור). */
function mealDate(m: HostMeal, bookings: readonly HostBooking[]): string {
  return m.date || bookings.find((b) => b.id === m.bookingId)?.checkIn || '';
}

/** בניית הדוח (`buildReport`). */
export function buildReport(type: HostRepType, from: string, to: string, d: HostReportData): HostReport {
  const uW = d.unitWord || 'יחידה';
  const usW = d.unitsWord || 'יחידות';
  const bW = d.bookingWord || 'הזמנה';
  const bsW = d.bookingsWord || 'הזמנות';
  const active = d.bookings.filter(isActive);
  const rN = (a: string, b: string) => rangeNights(a, b, from, to);

  if (type === 'occupancy') {
    const days = daysInRange(from, to);
    let soldT = 0;
    let revT = 0;
    const rows: string[][] = [];
    const csvRows: (string | number)[][] = [];
    const items: { name: string; val: number; disp: string }[] = [];
    for (const u of d.units) {
      let sold = 0;
      let rev = 0;
      for (const b of active) {
        if (b.unitId !== u.id) continue;
        const rn = rN(b.checkIn, b.checkOut);
        if (rn <= 0) continue;
        sold += rn;
        rev += bookingTotal(b) * (rn / Math.max(1, nightsBetween(b.checkIn, b.checkOut)));
      }
      const occ = days ? Math.round((sold / days) * 100) : 0;
      soldT += sold;
      revT += rev;
      rows.push([u.name, String(sold), String(days), occ + '%', money(rev)]);
      csvRows.push([u.name, sold, days, occ, Math.round(rev)]);
      items.push({ name: u.name, val: occ, disp: occ + '%' });
    }
    const availT = d.units.length * days;
    const occAll = availT ? Math.round((soldT / availT) * 100) : 0;
    const revpan = availT ? revT / availT : 0;
    return {
      key: 'occupancy',
      title: 'דוח תפוסה',
      sub: d.units.length + ' ' + usW + ' · ' + days + ' ימים',
      kc: 'var(--h-info)',
      kpis: [
        { kc: 'var(--h-info)', lab: 'תפוסה כוללת', val: occAll + '%', sub: soldT + ' / ' + availT + ' לילות' },
        { kc: 'var(--h-brand)', lab: 'לילות מכורים', val: String(soldT), sub: 'room-nights' },
        { kc: 'var(--h-good)', lab: 'הכנסה בתקופה', val: money(revT), sub: '' },
        { kc: 'var(--h-violet)', lab: 'הכנסה ללילה זמין', val: money(revpan), sub: 'RevPAN' },
      ],
      cols: [uW, 'מכורים', 'זמינים', 'תפוסה', 'הכנסה'],
      rows,
      viz: { max: vmaxOf(items) || 100, items },
      csvHead: [uW, 'לילות_מכורים', 'זמינים', 'תפוסה_אחוז', 'הכנסה'],
      csvRows,
    };
  }

  if (type === 'guests') {
    const map = new Map<string, { stays: number; nights: number; spend: number; last: string }>();
    for (const b of active) {
      if (!inRange(b.checkIn, from, to)) continue;
      const g = map.get(b.guestId) ?? { stays: 0, nights: 0, spend: 0, last: '' };
      g.stays++;
      g.nights += Math.max(0, nightsBetween(b.checkIn, b.checkOut));
      g.spend += bookingTotal(b);
      if (b.checkIn > g.last) g.last = b.checkIn;
      map.set(b.guestId, g);
    }
    const arr = [...map.entries()].map(([id, s]) => ({ name: d.guestName(id), s })).sort((a, b) => b.s.spend - a.s.spend);
    const repeat = arr.filter((x) => x.s.stays > 1).length;
    const total = arr.reduce((s, x) => s + x.s.spend, 0);
    const items = arr.slice(0, 8).map((x) => ({ name: x.name, val: x.s.spend, disp: money(x.s.spend) }));
    return {
      key: 'guests',
      title: 'דוח ' + d.guestsWord,
      sub: arr.length + ' ' + d.guestsWord + ' פעילים',
      kc: 'var(--h-violet)',
      kpis: [
        { kc: 'var(--h-violet)', lab: d.guestsWord, val: String(arr.length), sub: 'שהו בתקופה' },
        { kc: 'var(--h-brand)', lab: 'חוזרים', val: String(repeat), sub: '2+ ביקורים' },
        { kc: 'var(--h-good)', lab: 'הוצאה כוללת', val: money(total), sub: '' },
        { kc: 'var(--h-info)', lab: 'הוצאה ממוצעת', val: money(arr.length ? total / arr.length : 0), sub: 'ל' + d.guestWord },
      ],
      cols: [d.guestWord, 'ביקורים', 'לילות', 'הוצאה', 'ביקור אחרון'],
      rows: arr.map((x) => [x.name, String(x.s.stays), String(x.s.nights), money(x.s.spend), x.s.last ? fmtDM(x.s.last) : '—']),
      viz: { max: vmaxOf(items), items },
      csvHead: [d.guestWord, 'ביקורים', 'לילות', 'הוצאה', 'ביקור_אחרון'],
      csvRows: arr.map((x) => [x.name, x.s.stays, x.s.nights, Math.round(x.s.spend), x.s.last || '']),
    };
  }

  const kitchenMeals = () =>
    d.meals
      .filter((m) => m.status !== 'cancelled')
      .map((m) => ({ m, date: mealDate(m, d.bookings) }))
      .filter((x) => x.date && inRange(x.date, from, to));
  const mealSum = (m: HostMeal) => m.items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);

  if (type === 'kitchen') {
    const ko = kitchenMeals().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    let diners = 0;
    let rev = 0;
    const dish = new Map<string, number>();
    const rows: string[][] = [];
    const csvRows: (string | number)[][] = [];
    for (const { m, date } of ko) {
      const t = mealSum(m);
      diners += m.dinerCount || 0;
      rev += t;
      for (const it of m.items) dish.set(it.name, (dish.get(it.name) ?? 0) + (it.qty || 1));
      const title = m.mealName || d.guestName(m.guestId) || '—';
      rows.push([title, date ? fmtDM(date) : '—', String(m.dinerCount || 0), String(m.items.length), money(t)]);
      csvRows.push([title, date, m.dinerCount || 0, m.items.length, Math.round(t)]);
    }
    const items = [...dish.entries()]
      .map(([name, val]) => ({ name, val, disp: val + '×' }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 8);
    return {
      key: 'kitchen',
      title: 'דוח מטבח',
      sub: ko.length + ' ארוחות',
      kc: 'var(--h-amber)',
      kpis: [
        { kc: 'var(--h-amber)', lab: 'ארוחות', val: String(ko.length), sub: '' },
        { kc: 'var(--h-brand)', lab: 'סועדים', val: String(diners), sub: 'מנות-סועד' },
        { kc: 'var(--h-good)', lab: 'הכנסת מטבח', val: money(rev), sub: '' },
        { kc: 'var(--h-info)', lab: 'ממוצע לארוחה', val: money(ko.length ? rev / ko.length : 0), sub: '' },
      ],
      cols: ['ארוחה', 'תאריך', 'סועדים', 'מנות', 'סכום'],
      rows,
      viz: { max: vmaxOf(items), items },
      csvHead: ['ארוחה', 'תאריך', 'סועדים', 'מנות', 'סכום'],
      csvRows,
    };
  }

  if (type === 'debts') {
    const open = active.filter((b) => bookingBalance(b) > 0).sort((a, b) => bookingBalance(b) - bookingBalance(a));
    const totOut = open.reduce((s, b) => s + bookingBalance(b), 0);
    const totChg = active.reduce((s, b) => s + bookingTotal(b), 0);
    const totPaid = active.reduce((s, b) => s + bookingPaid(b), 0);
    const items = open.slice(0, 8).map((b) => ({ name: d.guestName(b.guestId), val: bookingBalance(b), disp: money(bookingBalance(b)) }));
    return {
      key: 'debts',
      title: 'דוח גבייה · יתרות פתוחות',
      sub: open.length + ' חייבים',
      kc: 'var(--h-crit)',
      kpis: [
        { kc: 'var(--h-crit)', lab: 'לגבייה', val: money(totOut), sub: 'סה״כ פתוח' },
        { kc: 'var(--h-warn)', lab: 'חייבים', val: String(open.length), sub: '' },
        { kc: 'var(--h-good)', lab: 'נגבה (הכל)', val: money(totPaid), sub: '' },
        { kc: 'var(--h-info)', lab: 'שיעור גבייה', val: (totChg ? Math.round((totPaid / totChg) * 100) : 0) + '%', sub: '' },
      ],
      cols: [d.guestWord, uW, 'תאריכים', 'חיוב', 'שולם', 'יתרה'],
      rows: open.map((b) => [d.guestName(b.guestId), d.unitName(b.unitId), fmtDM(b.checkIn) + '–' + fmtDM(b.checkOut), money(bookingTotal(b)), money(bookingPaid(b)), money(bookingBalance(b))]),
      viz: { max: vmaxOf(items), items },
      csvHead: [d.guestWord, uW, 'צק_אין', 'צק_אאוט', 'חיוב', 'שולם', 'יתרה'],
      csvRows: open.map((b) => [d.guestName(b.guestId), d.unitName(b.unitId), b.checkIn, b.checkOut, Math.round(bookingTotal(b)), Math.round(bookingPaid(b)), Math.round(bookingBalance(b))]),
    };
  }

  const inR = active.filter((b) => inRange(b.checkIn, from, to));

  if (type === 'summary') {
    const charged = inR.reduce((s, b) => s + bookingTotal(b), 0);
    const paid = inR.reduce((s, b) => s + bookingPaid(b), 0);
    const days = daysInRange(from, to);
    let sold = 0;
    for (const u of d.units) for (const b of active) if (b.unitId === u.id) sold += rN(b.checkIn, b.checkOut);
    const availT = d.units.length * days;
    const occAll = availT ? Math.round((sold / availT) * 100) : 0;
    const guests = new Set(inR.map((b) => b.guestId)).size;
    const ko = kitchenMeals();
    const koRev = ko.reduce((s, x) => s + mealSum(x.m), 0);
    const outAll = active.reduce((s, b) => s + Math.max(0, bookingBalance(b)), 0);
    const rows = [
      [bsW + ' בתקופה', String(inR.length)],
      ['חיובים', money(charged)],
      ['תקבולים', money(paid)],
      ['תפוסה', occAll + '%'],
      [d.guestsWord + ' ייחודיים', String(guests)],
      ['ארוחות מטבח', String(ko.length)],
      ['הכנסת מטבח', money(koRev)],
      ['יתרות פתוחות (כולל)', money(outAll)],
    ];
    const per = new Map<string, number>();
    for (const b of inR) per.set(d.unitName(b.unitId), (per.get(d.unitName(b.unitId)) ?? 0) + bookingTotal(b));
    const items = [...per.entries()].map(([name, val]) => ({ name, val, disp: money(val) })).sort((a, b) => b.val - a.val);
    return {
      key: 'summary',
      title: 'סיכום מנהלים',
      sub: 'תמונת-על',
      kc: 'var(--h-brand)',
      kpis: [
        { kc: 'var(--h-good)', lab: 'הכנסות', val: money(charged), sub: inR.length + ' ' + bsW },
        { kc: 'var(--h-info)', lab: 'תפוסה', val: occAll + '%', sub: sold + ' לילות' },
        { kc: 'var(--h-amber)', lab: 'מטבח', val: money(koRev), sub: ko.length + ' ארוחות' },
        { kc: 'var(--h-crit)', lab: 'לגבייה', val: money(outAll), sub: '' },
      ],
      cols: ['מדד', 'ערך'],
      rows,
      viz: { max: vmaxOf(items), items },
      csvHead: ['מדד', 'ערך'],
      csvRows: rows.map((r) => [r[0], r[1]]),
    };
  }

  // revenue (ברירת-המחדל)
  const sorted = inR.slice().sort((a, b) => (a.checkIn < b.checkIn ? 1 : a.checkIn > b.checkIn ? -1 : 0));
  let charged = 0;
  let paid = 0;
  const per = new Map<string, number>();
  const rows: string[][] = [];
  const csvRows: (string | number)[][] = [];
  for (const b of sorted) {
    const t = bookingTotal(b);
    const p = bookingPaid(b);
    charged += t;
    paid += p;
    const un = d.unitName(b.unitId);
    per.set(un, (per.get(un) ?? 0) + t);
    const n = nightsBetween(b.checkIn, b.checkOut);
    rows.push([d.guestName(b.guestId), un, fmtDM(b.checkIn) + '–' + fmtDM(b.checkOut), String(n), money(t), money(p), money(t - p)]);
    csvRows.push([d.guestName(b.guestId), un, b.checkIn, b.checkOut, n, Math.round(t), Math.round(p), Math.round(t - p)]);
  }
  const items = [...per.entries()].map(([name, val]) => ({ name, val, disp: money(val) })).sort((a, b) => b.val - a.val);
  return {
    key: 'revenue',
    title: 'דוח הכנסות',
    sub: sorted.length + ' ' + bsW,
    kc: 'var(--h-good)',
    kpis: [
      { kc: 'var(--h-good)', lab: 'סה״כ חיובים', val: money(charged), sub: '' },
      { kc: 'var(--h-brand)', lab: 'תקבולים', val: money(paid), sub: '' },
      { kc: 'var(--h-crit)', lab: 'יתרה', val: money(charged - paid), sub: 'טרם שולם' },
      { kc: 'var(--h-info)', lab: 'ממוצע ל' + bW, val: money(sorted.length ? charged / sorted.length : 0), sub: '' },
    ],
    cols: [d.guestWord, uW, 'תאריכים', 'לילות', 'חיוב', 'שולם', 'יתרה'],
    rows,
    viz: { max: vmaxOf(items), items },
    csvHead: [d.guestWord, uW, 'צק_אין', 'צק_אאוט', 'לילות', 'חיוב', 'שולם', 'יתרה'],
    csvRows,
  };
}

/** טקסט-הדוח (העתקה / וואטסאפ) — `repPlainText`. */
export function reportPlainText(rep: HostReport, rangeLabel: string, bizName: string): string {
  const L = [bizName + ' · ' + rep.title, rangeLabel, ''];
  for (const k of rep.kpis) L.push('• ' + k.lab + ': ' + k.val);
  L.push('');
  L.push(rep.cols.join(' | '));
  for (const r of rep.rows) L.push(r.join(' | '));
  return L.join('\n');
}

/** שורות-ה-CSV (כותרת + נתונים) — ליציאה דרך downloadCsv (BOM + הגנת-נוסחאות של אורביט). */
export function reportCsvRows(rep: HostReport): (string | number)[][] {
  return [rep.csvHead, ...rep.csvRows];
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

/** מסמך-HTML להדפסה/הורדה — `repHtmlDoc` במקור (escaping מלא; בלי סקריפט). */
export function reportHtmlDoc(rep: HostReport, rangeLabel: string, bizName: string, stamp: string): string {
  const th = rep.cols.map((x) => '<th>' + esc(x) + '</th>').join('');
  const tr = rep.rows.map((r) => '<tr>' + r.map((x) => '<td>' + esc(x) + '</td>').join('') + '</tr>').join('');
  const kp = rep.kpis.map((k) => '<div class="k"><b>' + esc(k.val) + '</b><span>' + esc(k.lab) + '</span></div>').join('');
  return (
    '<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>' +
    esc(rep.title) +
    '</title><style>body{font-family:Arial,Helvetica,sans-serif;direction:rtl;padding:26px;color:#111}h1{margin:0 0 4px;font-size:22px}.s{color:#666;margin-bottom:18px}.kp{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px}.k{border:1px solid #ddd;border-radius:10px;padding:10px 14px;min-width:120px}.k b{display:block;font-size:22px}.k span{font-size:12px;color:#666}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:7px 10px;text-align:right;font-size:13px}th{background:#f3f3f3}.ft{margin-top:20px;color:#999;font-size:11px}</style></head><body><h1>' +
    esc(bizName) +
    ' · ' +
    esc(rep.title) +
    '</h1><div class="s">' +
    esc(rangeLabel) +
    ' · ' +
    esc(rep.sub) +
    '</div><div class="kp">' +
    kp +
    '</div><table><thead><tr>' +
    th +
    '</tr></thead><tbody>' +
    tr +
    '</tbody></table><div class="ft">הופק ב-' +
    esc(stamp) +
    ' · אירוח משפחתי</div></body></html>'
  );
}
