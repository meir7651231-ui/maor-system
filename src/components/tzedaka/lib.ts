/**
 * מנוע קופות הצדקה — טהור בלבד (בלי store/DOM); BUILD-ORDER-TZEDAKA-2026-07-30.
 *
 * בידוד (הכרעת בעלים 30.7): כל החישובים על tzBoxes/tzCoordinators/tzCampaigns/
 * tzEvents בלבד — אין תלות ב-db.events/supporters/enrollments.
 * Reuse טהור מ-calLib (lib→lib מותר): isoOf/hpOf/DAY_NAMES/FULL_HOLIDAYS.
 */
import type { Db, IsoDate, TzBox, TzCampaign, TzCoordinator, TzEvent } from '../../types/domain';
import { DAY_NAMES, isoOf } from '../calendar/calLib';
import { buildMonthGrid, type MonthGrid, type MonthGridCell } from '../../lib/monthGrid';

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

export type TzGridCell = MonthGridCell<TzEvent>;
export type TzGrid = MonthGrid<TzEvent>;

/**
 * גריד חודשי לועזי/עברי עם האירועים הייעודיים בלבד — wrapper דק על הגנרי
 * המשותף ב-lib/monthGrid (חולץ באשכול חנות 3; החתימה נשמרת כמות שהיא).
 */
export function buildTzGrid(tzEvents: readonly TzEvent[], anchorIso: IsoDate, hebMode: boolean): TzGrid {
  return buildMonthGrid(tzEvents, anchorIso, hebMode);
}

export { DAY_NAMES };
