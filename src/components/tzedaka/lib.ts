/**
 * מנוע קופות הצדקה — טהור בלבד (בלי store/DOM); BUILD-ORDER-TZEDAKA-2026-07-30.
 *
 * בידוד (הכרעת בעלים 30.7): כל החישובים על tzBoxes/tzCoordinators/tzCampaigns/
 * tzEvents בלבד — אין תלות ב-db.events/supporters/enrollments.
 * Reuse טהור מ-calLib (lib→lib מותר): isoOf/hpOf/DAY_NAMES/FULL_HOLIDAYS.
 */
import type { Db, IsoDate, TzBox, TzCampaign, TzCoordinator, TzEvent } from '../../types/domain';
import { DAY_NAMES, FULL_HOLIDAYS, hpOf, isoOf } from '../calendar/calLib';
import { gem, gemYear, holidayOf } from '../../lib/hebrew';

/* ---------- ניקוד גיימיפיקציה ---------- */

/**
 * כללי הניקוד — ברירות-מחדל של הארכיטקט (הבעלים רשאי לכוון — מקום אחד):
 * ריקון ‎+10 · ‎+1 לכל 50₪ שלמים · בונוס רצף ‎+5 אם הריקון בתוך 60 יום
 * מהריקון הקודם באותה קופה.
 */
export const TZ_SCORE_RULES = { emptyPts: 10, ilsPerPoint: 50, streakDays: 60, streakPts: 5 } as const;

/** הריקון האחרון של קופה — '' כשאין. */
export function lastCollectionIso(box: TzBox): IsoDate | '' {
  let last: IsoDate | '' = '';
  for (const c of box.collections) if (c.date > last) last = c.date;
  return last;
}

/** דלתת הניקוד על ריקון — לפני הוספת הריקון לקופה (הרצף נמדד מול הקודם). */
export function collectionScoreDelta(
  box: TzBox,
  date: IsoDate,
  amount: number,
  rules = TZ_SCORE_RULES,
): number {
  let pts = rules.emptyPts + Math.floor(amount / rules.ilsPerPoint);
  const prev = lastCollectionIso(box);
  if (prev) {
    const days = Math.round(
      (new Date(date + 'T12:00:00').getTime() - new Date(prev + 'T12:00:00').getTime()) / 86400000,
    );
    if (days >= 0 && days <= rules.streakDays) pts += rules.streakPts;
  }
  return pts;
}

/* ---------- סכומים ---------- */

export function boxTotal(box: TzBox): number {
  return box.collections.reduce((a, c) => a + (Number.isFinite(c.amount) ? c.amount : 0), 0);
}

export function coordinatorBoxes(boxes: readonly TzBox[], coordId: string): TzBox[] {
  return boxes.filter((b) => b.coordinatorId === coordId);
}

export function coordinatorTotal(boxes: readonly TzBox[], coordId: string): number {
  return coordinatorBoxes(boxes, coordId).reduce((a, b) => a + boxTotal(b), 0);
}

export function grandTotal(boxes: readonly TzBox[]): number {
  return boxes.reduce((a, b) => a + boxTotal(b), 0);
}

export function campaignTotal(boxes: readonly TzBox[], campaignId: string): number {
  let sum = 0;
  for (const b of boxes)
    for (const c of b.collections) if (c.campaignId === campaignId) sum += Number.isFinite(c.amount) ? c.amount : 0;
  return sum;
}

/* ---------- דורש טיפול ---------- */

export const TZ_STALE_DAYS = 90;

/** קופות אצל משפחות שלא רוקנו ≥N יום (או מעולם — לפי since). */
export function staleBoxes(boxes: readonly TzBox[], todayIso: IsoDate, days = TZ_STALE_DAYS): TzBox[] {
  const cutoff = new Date(todayIso + 'T12:00:00');
  cutoff.setDate(cutoff.getDate() - days);
  const cut = isoOf(cutoff);
  return boxes.filter((b) => {
    if (b.status !== 'home') return false;
    const last = lastCollectionIso(b) || b.since;
    return !!last && last <= cut;
  });
}

export interface TzCareItem {
  kind: 'stale' | 'lost' | 'inactiveCoord' | 'campaignEnding';
  id: string;
  label: string;
  hint: string;
}

/** רשימת הטיפול המשרדי — ממוינת לפי סוג (ישנות → אבודות → רכזים → מבצעים). */
export function needsCare(db: Db, todayIso: IsoDate): TzCareItem[] {
  const out: TzCareItem[] = [];
  for (const b of staleBoxes(db.tzBoxes, todayIso)) {
    const last = lastCollectionIso(b);
    out.push({
      kind: 'stale',
      id: b.id,
      label: 'קופה ' + b.num + ' לא רוקנה מזמן',
      hint: last ? 'ריקון אחרון: ' + last : 'מעולם לא רוקנה (מאז ' + (b.since || '—') + ')',
    });
  }
  for (const b of db.tzBoxes.filter((x) => x.status === 'lost'))
    out.push({ kind: 'lost', id: b.id, label: 'קופה ' + b.num + ' מסומנת כאבודה', hint: 'לברר או להוציא משימוש' });
  for (const c of db.tzCoordinators.filter((x) => !x.active)) {
    const holding = coordinatorBoxes(db.tzBoxes, c.id).filter((b) => b.status === 'home').length;
    if (holding)
      out.push({
        kind: 'inactiveCoord',
        id: c.id,
        label: c.name + ' אינו פעיל אך עדיין עם ' + holding + ' קופות בבתים',
        hint: 'להעביר לרכז אחר או להחזיר למשרד',
      });
  }
  const soon = new Date(todayIso + 'T12:00:00');
  soon.setDate(soon.getDate() + 14);
  const soonIso = isoOf(soon);
  for (const p of db.tzCampaigns.filter((x) => x.active && x.end && x.end >= todayIso && x.end <= soonIso))
    out.push({ kind: 'campaignEnding', id: p.id, label: 'המבצע "' + p.name + '" מסתיים ב-' + p.end, hint: 'לסכם ולסגור' });
  return out;
}

/* ---------- לוח מובילים ומבצעים ---------- */

export interface TzLeaderRow {
  coordinator: TzCoordinator;
  total: number;
  boxCount: number;
}

/** רכזים פעילים ממוינים: score יורד, ואז סכום יורד. */
export function leaderboard(coordinators: readonly TzCoordinator[], boxes: readonly TzBox[]): TzLeaderRow[] {
  return coordinators
    .filter((c) => c.active)
    .map((c) => ({ coordinator: c, total: coordinatorTotal(boxes, c.id), boxCount: coordinatorBoxes(boxes, c.id).length }))
    .sort((a, b) => b.coordinator.score - a.coordinator.score || b.total - a.total);
}

export function campaignProgress(campaign: TzCampaign, boxes: readonly TzBox[]): { sum: number; goal: number; pct: number } {
  const sum = campaignTotal(boxes, campaign.id);
  const goal = campaign.goal || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((sum / goal) * 100)) : 0;
  return { sum, goal, pct };
}

/* ---------- הלוח הייעודי (מבודד — tzEvents בלבד, אין db.events!) ---------- */

export interface TzGridCell {
  iso: IsoDate;
  /** מספר לועזי (בעברי: "יום.חודש"). */
  dayNum: string;
  /** היום העברי בגימטריה. */
  hebDay: string;
  inMonth: boolean;
  holiday: string | null;
  /** חג עצירת-מלאכה (FULL_HOLIDAYS) — תצוגה מודגשת. */
  fullHoliday: boolean;
  events: TzEvent[];
}

export interface TzGrid {
  cells: TzGridCell[];
  /** כותרת ראשית (לועזי: חודש+שנה; עברי: החודש העברי בגימטריה). */
  label: string;
  subLabel: string;
  prevIso: IsoDate;
  nextIso: IsoDate;
}

const fmtMonthYear = new Intl.DateTimeFormat('he', { month: 'long', year: 'numeric' });
const fmtHebMonth = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' });
const fmtHebYear = new Intl.DateTimeFormat('he-u-ca-hebrew', { year: 'numeric' });

function cellOf(d: Date, inMonth: boolean, hebMode: boolean, byDate: Map<string, TzEvent[]>): TzGridCell {
  const iso = isoOf(d);
  const hol = holidayOf(d);
  return {
    iso,
    dayNum: hebMode ? d.getDate() + '.' + (d.getMonth() + 1) : String(d.getDate()),
    hebDay: gem(hpOf(iso, d).day),
    inMonth,
    holiday: hol,
    fullHoliday: !!hol && FULL_HOLIDAYS.includes(hol),
    events: byDate.get(iso) ?? [],
  };
}

/**
 * גריד חודשי לועזי/עברי עם האירועים הייעודיים בלבד. hebMode — החודש העברי
 * המלא (א׳ עד סוף החודש); לועזי — 42 תאים בדפוס הלוח הראשי.
 */
export function buildTzGrid(tzEvents: readonly TzEvent[], anchorIso: IsoDate, hebMode: boolean): TzGrid {
  const byDate = new Map<string, TzEvent[]>();
  for (const ev of tzEvents) {
    if (!ev.date) continue;
    const arr = byDate.get(ev.date) ?? [];
    arr.push(ev);
    byDate.set(ev.date, arr);
  }
  const anchor = new Date(anchorIso + 'T12:00:00');

  if (!hebMode) {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    const cells: TzGridCell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      cells.push(cellOf(d, d.getMonth() === anchor.getMonth(), false, byDate));
    }
    return {
      cells,
      label: fmtMonthYear.format(first),
      subLabel: fmtHebMonth.format(first) + '–' + fmtHebMonth.format(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)),
      prevIso: isoOf(new Date(first.getFullYear(), first.getMonth() - 1, 15)),
      nextIso: isoOf(new Date(first.getFullYear(), first.getMonth() + 1, 15)),
    };
  }

  // עברי: אחורה עד א׳ בחודש, ואז קדימה עד סוף החודש העברי
  let d = new Date(anchor);
  while (hpOf(isoOf(d), d).day !== 1) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  const first = d;
  const monthName = hpOf(isoOf(first), first).month;
  const days: Date[] = [];
  let cur = first;
  while (hpOf(isoOf(cur), cur).month === monthName && days.length < 31) {
    days.push(cur);
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  const last = days[days.length - 1];
  // ריפוד לתחילת השבוע (ראשון) — תאים מחוץ לחודש
  const cells: TzGridCell[] = [];
  for (let i = first.getDay(); i > 0; i--)
    cells.push(cellOf(new Date(first.getFullYear(), first.getMonth(), first.getDate() - i), false, true, byDate));
  for (const day of days) cells.push(cellOf(day, true, true, byDate));
  while (cells.length % 7 !== 0) {
    const lastCell = new Date(cells[cells.length - 1].iso + 'T12:00:00');
    cells.push(cellOf(new Date(lastCell.getFullYear(), lastCell.getMonth(), lastCell.getDate() + 1), false, true, byDate));
  }
  return {
    cells,
    label: monthName + ' ' + gemYear(fmtHebYear.format(first)),
    subLabel: fmtMonthYear.format(first) + ' – ' + fmtMonthYear.format(last),
    prevIso: isoOf(new Date(first.getFullYear(), first.getMonth(), first.getDate() - 1)),
    nextIso: isoOf(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)),
  };
}

export { DAY_NAMES };
