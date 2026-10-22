/**
 * מנוע קופות הצדקה — טהור בלבד (בלי store/DOM); BUILD-ORDER-TZEDAKA-2026-07-30.
 *
 * בידוד (הכרעת בעלים 30.7): כל החישובים על tzBoxes/tzCoordinators/tzCampaigns/
 * tzEvents בלבד — אין תלות ב-db.events/supporters/enrollments.
 * Reuse טהור מ-calLib (lib→lib מותר): isoOf/hpOf/DAY_NAMES/FULL_HOLIDAYS.
 */
import type { Db, IsoDate, TzBox, TzBoxStatus, TzCampaign, TzCollection, TzCoordinator, TzEvent } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { termOf } from '../../lib/config';
import { DAY_NAMES, isoOf } from '../calendar/calLib';
import { buildGrid, type CalViewMode, type MonthGrid, type MonthGridCell } from '../../lib/monthGrid';
import { smartFilter } from '../../lib/search';
import { dateInRange } from '../../lib/date-util';
import { hebAnnualEq, hebPartsOfIso } from '../../lib/hebrew';

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
  kind: 'stale' | 'lost' | 'inactiveCoord' | 'campaignEnding' | 'reminder';
  id: string;
  label: string;
  hint: string;
  /** בתזכורת — המופע שהגיע זמנו (לסימון "✓ בוצע"). */
  date?: IsoDate;
}

/** רשימת הטיפול המשרדי — ממוינת לפי סוג (ישנות → אבודות → רכזים → מבצעים).
 *  config (רשות, swarm-audit): 'קופה' היה קשיח ועקף את termOf('entity.tzBox') —
 *  דליפת-מונח בוורטיקלים; בלי config הנוסח ההיסטורי נשמר ביט-זהה. */
export function needsCare(db: Db, todayIso: IsoDate, config?: OrgConfig): TzCareItem[] {
  const boxTerm = config ? termOf(config, 'entity.tzBox', 'קופה') : 'קופה';
  const out: TzCareItem[] = [];
  for (const b of staleBoxes(db.tzBoxes, todayIso)) {
    const last = lastCollectionIso(b);
    out.push({
      kind: 'stale',
      id: b.id,
      label: boxTerm + ' ' + b.num + ' לא רוקנה מזמן',
      hint: last ? 'ריקון אחרון: ' + last : 'מעולם לא רוקנה (מאז ' + (b.since || '—') + ')',
    });
  }
  for (const b of db.tzBoxes.filter((x) => x.status === 'lost'))
    out.push({ kind: 'lost', id: b.id, label: boxTerm + ' ' + b.num + ' מסומנת כאבודה', hint: 'לברר או להוציא משימוש' });
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
  // תזכורות שהגיע זמנן (בקשת-בעלים 22.10) — אחרי שאר הסוגים, הוותיקה ראשונה
  for (const { ev, date } of dueTzReminders(db.tzEvents, todayIso)) {
    const box = db.tzBoxes.find((b) => b.id === ev.boxId);
    out.push({
      kind: 'reminder',
      id: ev.id,
      date,
      label: '🔔 ' + ev.title + (box ? ' · ' + boxTerm + ' ' + box.num : ''),
      hint: date + ' · ' + TZ_RECUR_LABEL[ev.recur ?? 'once'],
    });
  }
  return out;
}

/* ---------- תזכורות חוזרות (לוח עברי · בקשת-בעלים 22.10) ---------- */

export type TzRecurKey = 'once' | 'monthly' | 'yearly';
export const TZ_RECUR_LABEL: Record<TzRecurKey, string> = {
  once: 'חד-פעמית',
  monthly: 'כל חודש (עברי)',
  yearly: 'כל שנה (עברי)',
};

const prevIso = (iso: IsoDate): IsoDate => {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return isoOf(d);
};
const nextIso = (iso: IsoDate): IsoDate => {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  return isoOf(d);
};

/**
 * האם האירוע חל ביום iso. חד-פעמי = התאריך עצמו. חוזר — מהתאריך שנבחר והלאה, לפי הלוח העברי:
 * חודשי = אותו יום-בחודש העברי; עוגן ל׳ בחודש שאין בו ל׳ ⇒ א׳ בחודש הבא (כלל ל׳ — כמו recurDates).
 * שנתי = hebAnnualEq (מקור-האמת: כללי אדר וכלל ל׳).
 */
export function tzOccursOn(ev: Pick<TzEvent, 'date' | 'recur'>, iso: IsoDate): boolean {
  if (!ev.recur) return ev.date === iso;
  if (iso < ev.date) return false;
  const a = hebPartsOfIso(ev.date);
  const q = hebPartsOfIso(iso);
  if (ev.recur === 'yearly') return hebAnnualEq({ day: a.day, month: a.month }, q);
  if (q.day === a.day) return true;
  // ל׳ חסר: היום הוא א׳ והיום שלפניו היה כ״ט ⇒ לחודש הקודם אין ל׳
  return a.day === 30 && q.day === 1 && hebPartsOfIso(prevIso(iso)).day === 29;
}

/** האם המופע בתאריך הזה סומן "בוצע". */
export function tzOccDone(ev: Pick<TzEvent, 'done' | 'recur' | 'doneDates'>, iso: IsoDate): boolean {
  return ev.recur ? (ev.doneDates ?? []).includes(iso) : ev.done;
}

/** פריסת האירועים לטווח [from..to] — אירוע חוזר הופך למופע לכל יום שבו הוא חל (אותו id, date=המופע). */
export function expandTzEvents(events: readonly TzEvent[], fromIso: IsoDate, toIso: IsoDate): TzEvent[] {
  const out: TzEvent[] = [];
  for (const ev of events) {
    if (!ev.recur) {
      out.push(ev);
      continue;
    }
    for (let iso = ev.date > fromIso ? ev.date : fromIso, guard = 0; iso <= toIso && guard < 4000; iso = nextIso(iso), guard++) {
      if (tzOccursOn(ev, iso)) out.push({ ...ev, date: iso, done: tzOccDone(ev, iso) });
    }
  }
  return out;
}

/** המופע הקרוב של תזכורת מהיום והלאה (כולל היום) שעוד לא בוצע — '' כשאין (חד-פעמית שעברה/בוצעה). */
export function nextTzOccurrence(ev: TzEvent, todayIso: IsoDate): IsoDate | '' {
  if (!ev.recur) return !ev.done && ev.date >= todayIso ? ev.date : '';
  for (let iso = ev.date > todayIso ? ev.date : todayIso, guard = 0; guard < 400; iso = nextIso(iso), guard++) {
    if (tzOccursOn(ev, iso) && !tzOccDone(ev, iso)) return iso;
  }
  return '';
}

/**
 * תזכורות שהגיע זמנן (kind='reminder'): חד-פעמית שתאריכה עבר ולא בוצעה; חוזרת — המופע האחרון
 * עד היום (סריקה של עד 400 יום אחורה) כשלא סומן. מופע ישן שלא סומן מתחלף בחדש — לא נערמים.
 */
export function dueTzReminders(events: readonly TzEvent[], todayIso: IsoDate): { ev: TzEvent; date: IsoDate }[] {
  const out: { ev: TzEvent; date: IsoDate }[] = [];
  for (const ev of events) {
    if (ev.kind !== 'reminder') continue;
    if (!ev.recur) {
      if (!ev.done && ev.date <= todayIso) out.push({ ev, date: ev.date });
      continue;
    }
    for (let iso = todayIso, guard = 0; iso >= ev.date && guard < 400; iso = prevIso(iso), guard++) {
      if (tzOccursOn(ev, iso)) {
        if (!tzOccDone(ev, iso)) out.push({ ev, date: iso });
        break;
      }
    }
  }
  return out.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
}

/** תזכורות הקופה — עם המופע הקרוב (או שהגיע זמנו), הקרובה ראשונה. */
export function boxReminders(events: readonly TzEvent[], boxId: string, todayIso: IsoDate): { ev: TzEvent; when: IsoDate | '' }[] {
  const due = new Map(dueTzReminders(events, todayIso).map((d) => [d.ev.id, d.date]));
  return events
    .filter((e) => e.kind === 'reminder' && e.boxId === boxId)
    .map((ev) => ({ ev, when: due.get(ev.id) ?? nextTzOccurrence(ev, todayIso) }))
    .sort((x, y) => (x.when || '9999') < (y.when || '9999') ? -1 : (x.when || '9999') > (y.when || '9999') ? 1 : 0);
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

/* ---------- חיפוש/סינון/מיון (UX סינון 1) — טהור, smartFilter הקיים ---------- */

/** הריקון האחרון של רכז — על-פני כל קופותיו ('' כשאין). */
function coordinatorLastCollection(boxes: readonly TzBox[], coordId: string): IsoDate | '' {
  let last: IsoDate | '' = '';
  for (const b of coordinatorBoxes(boxes, coordId)) {
    const l = lastCollectionIso(b);
    if (l > last) last = l;
  }
  return last;
}

/**
 * סינון+מיון הרכזים: q דרך smartFilter על השם (עברית, שגיאות-כתיב);
 * 'stale' = ריקון-אחרון-ישן-קודם (מי שדורש דחיפה למעלה; מעולם-לא ראשון).
 */
export function filterCoordinators(
  coords: readonly TzCoordinator[],
  boxes: readonly TzBox[],
  q: string,
  onlyActive: boolean,
  sort: 'name' | 'score' | 'total' | 'stale',
): TzCoordinator[] {
  const base = onlyActive ? coords.filter((c) => c.active) : [...coords];
  // גם מילות השם בנפרד — כדי ששגיאת-כתיב במילה אחת תיתפס (levenshtein פר-מילה)
  const list = smartFilter(q, base, (c) => [c.name, ...c.name.split(/\s+/)]);
  const cmp: Record<typeof sort, (a: TzCoordinator, b: TzCoordinator) => number> = {
    name: (a, b) => a.name.localeCompare(b.name, 'he'),
    score: (a, b) => b.score - a.score,
    total: (a, b) => coordinatorTotal(boxes, b.id) - coordinatorTotal(boxes, a.id),
    stale: (a, b) =>
      coordinatorLastCollection(boxes, a.id).localeCompare(coordinatorLastCollection(boxes, b.id)),
  };
  return [...list].sort(cmp[sort]);
}

export interface TzBoxRow {
  box: TzBox;
  coordName: string;
  famName: string;
  last: IsoDate | '';
  total: number;
}

/** מבט "כל הקופות" — כל הקופות עם שם הרכז והמשפחה, חיפוש/סינון/מיון. */
export function boxesOverview(
  db: Db,
  q: string,
  status: TzBoxStatus | '',
  sort: 'num' | 'lastCollection' | 'total',
): TzBoxRow[] {
  let rows: TzBoxRow[] = db.tzBoxes.map((box) => ({
    box,
    coordName: db.tzCoordinators.find((c) => c.id === box.coordinatorId)?.name ?? '',
    famName: db.families.find((f) => f.id === box.famId)?.name ?? '',
    last: lastCollectionIso(box),
    total: boxTotal(box),
  }));
  if (status) rows = rows.filter((r) => r.box.status === status);
  rows = smartFilter(q, rows, (r) => [
    '#' + r.box.num,
    r.box.num,
    r.coordName,
    ...r.coordName.split(/\s+/),
    r.famName,
  ]);
  const cmp: Record<typeof sort, (a: TzBoxRow, b: TzBoxRow) => number> = {
    num: (a, b) => (parseInt(a.box.num, 10) || 0) - (parseInt(b.box.num, 10) || 0),
    lastCollection: (a, b) => a.last.localeCompare(b.last), // ישן/מעולם-לא ראשון — לרדיפה
    total: (a, b) => b.total - a.total,
  };
  return [...rows].sort(cmp[sort]);
}

/** סינון היסטוריית ריקונים — טווח תאריכים (כוללני, dateInRange המשותף) + מבצע. */
export function filterCollections(
  box: TzBox,
  fromIso: IsoDate | '',
  toIso: IsoDate | '',
  campaignId: string,
): TzCollection[] {
  return box.collections.filter(
    (c) => dateInRange(c.date, fromIso, toIso) && (!campaignId || c.campaignId === campaignId),
  );
}

/* ---------- תדפיס שטח וייצוא (CONNECT חיבור 6) ---------- */

/**
 * שורות תדפיס הרכז — רשימת הקופות שלו לסבב שטח: מספר, משפחה, כתובת,
 * טלפון וריקון אחרון. טהור — ההורדה בדפוס downloadText הקיים.
 */
export function coordinatorPrintLines(db: Db, coordinatorId: string, config?: OrgConfig): string[] {
  const T = (k: string, fb: string) => (config ? termOf(config, k, fb) : fb);
  const coord = db.tzCoordinators.find((c) => c.id === coordinatorId);
  const boxes = coordinatorBoxes(db.tzBoxes, coordinatorId).filter((b) => b.status === 'home' || b.status === 'office');
  const lines = [
    'רשימת קופות — ' + (coord?.name ?? ''),
    '='.repeat(30),
  ];
  for (const b of boxes) {
    const fam = db.families.find((f) => f.id === b.famId);
    const last = lastCollectionIso(b);
    lines.push(
      [
        '#' + b.num,
        fam ? T('entity.familyOf', 'משפחת') + ' ' + fam.name : 'במשרד',
        fam ? [fam.address, fam.city].filter(Boolean).join(', ') : '',
        fam?.phone ?? '',
        last ? 'ריקון אחרון: ' + last : 'טרם רוקנה',
      ]
        .filter(Boolean)
        .join(' · '),
    );
  }
  if (boxes.length === 0) lines.push('אין קופות פעילות');
  return lines;
}

/**
 * שורות CSV של כל הריקונים — תאריך, רכז, קופה, משפחה, סכום, מבצע.
 * שקיפות מלאה: כל ריקון שנרשם מיוצא.
 */
export function collectionsCsvRows(db: Db, config?: OrgConfig): (string | number)[][] {
  const T = (k: string, fb: string) => (config ? termOf(config, k, fb) : fb);
  const rows: (string | number)[][] = [['תאריך', 'רכז', 'קופה', T('entity.family', 'משפחה'), 'סכום', 'מבצע']];
  for (const b of db.tzBoxes) {
    const coord = db.tzCoordinators.find((c) => c.id === b.coordinatorId);
    const fam = db.families.find((f) => f.id === b.famId);
    for (const c of b.collections) {
      const camp = c.campaignId ? db.tzCampaigns.find((p) => p.id === c.campaignId) : undefined;
      rows.push([c.date, coord?.name ?? '', '#' + b.num, fam?.name ?? '', c.amount, camp?.name ?? '']);
    }
  }
  return rows;
}

export type TzGridCell = MonthGridCell<TzEvent>;
export type TzGrid = MonthGrid<TzEvent>;

/**
 * גריד יומי/שבועי/חודשי לועזי/עברי עם האירועים הייעודיים בלבד — wrapper דק על
 * הגנרי המשותף ב-lib/monthGrid. `mode` אופציונלי (בקשת-בעלים 30.8), ברירת-מחדל
 * 'month' ⇒ תאימות-לאחור מלאה לחתימה הישנה.
 */
export function buildTzGrid(tzEvents: readonly TzEvent[], anchorIso: IsoDate, hebMode: boolean, mode: CalViewMode = 'month'): TzGrid {
  return buildGrid(tzEvents, anchorIso, hebMode, mode);
}

export { DAY_NAMES };

/* ---------- 🔐 ייעוד לקופה (22.10) — אותו חוזה-ראוּת כמו התורמים ---------- */

/** האם הקופה גלויה לעובד/ת עם ייעודים מותרים. allowed=null/ריק ⇒ הכל; קופה בלי ייעוד ⇒ לא גלויה למוגבל/ת
 *  (כמו supporterVisibleForDesignations — הכרעת-בעלים 19.8 "רואה רק את הייעוד שלו"). */
export function tzBoxVisible(box: { designation?: string }, allowed: readonly string[] | null): boolean {
  if (!allowed || !allowed.length) return true;
  const d = (box.designation ?? '').trim();
  return !!d && allowed.some((a) => a.trim() === d);
}

/**
 * נקודת-חנק אחת לכל משטחי-הקופות: הקופות הגלויות, הרכזים שיש להם לפחות קופה גלויה אחת, והאירועים
 * שלא מקושרים לקופה/רכז מוסתרים. allowed=null ⇒ אותם מערכים בדיוק (אותה הפניה — ביט-זהה ללא-מוגבל/ת).
 */
export function visibleTzForDesignations(
  db: Pick<Db, 'tzBoxes' | 'tzCoordinators' | 'tzEvents'>,
  allowed: readonly string[] | null,
): Pick<Db, 'tzBoxes' | 'tzCoordinators' | 'tzEvents'> {
  if (!allowed || !allowed.length) return { tzBoxes: db.tzBoxes, tzCoordinators: db.tzCoordinators, tzEvents: db.tzEvents };
  const tzBoxes = db.tzBoxes.filter((b) => tzBoxVisible(b, allowed));
  const boxIds = new Set(tzBoxes.map((b) => b.id));
  const coordIds = new Set(tzBoxes.map((b) => b.coordinatorId));
  const tzCoordinators = db.tzCoordinators.filter((c) => coordIds.has(c.id));
  const tzEvents = db.tzEvents.filter((e) => (e.boxId ? boxIds.has(e.boxId) : e.coordinatorId ? coordIds.has(e.coordinatorId) : true));
  return { tzBoxes, tzCoordinators, tzEvents };
}

/** ייעודי-הקופות הקיימים (distinct, ממויין) — להצעה בטופס-הקופה ובכרטיס-העובד. */
export function tzDesignations(boxes: readonly { designation?: string }[]): string[] {
  return [...new Set(boxes.map((b) => (b.designation ?? '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
