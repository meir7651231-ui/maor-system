/**
 * 🏡 אירוח משפחתי — ספק המרכזייה (BUILD-ORDER-SWITCHBOARD-2026-10-13): מה האירוח עושה בשביל כלים אחרים.
 *
 *   · hosting.availability — "יש יחידה פנויה?": יחידות פנויות בטווח-לילות (שם · סוג · קיבולת · חדרים/מיטות פנויים) —
 *     אותה זמינות של טופס-ההזמנה (occupiedRoomIds), יחידה חסומה לא פנויה (F1), ואורח שעבר את מועד-העזיבה ועוד לא יצא
 *     מחזיק את היחידה הלילה (F8). **בלי מחירים ובלי שמות-אורחים** — זה מה שקו-טלפון ציבורי רשאי לומר.
 *   · hosting.today — ספירות-היום לתקציר: הגעות/עזיבות (כולל באיחור — F8) · בשהייה · לניקיון (hosting.housekeeping) ·
 *     קריאות פתוחות/חירום וקריאות שטופלו היום (hosting.maint). ספירות בלבד — בלי אורחים, בלי כסף.
 * טהור (בלי store/DOM/Date.now — "היום" = ctx.nowMs בשעון-הארגון), קריאה-בלבד מ-hostUnits · hostBookings · hostRecords ·
 * ui.hosting · orgName. בידוד: אין כאן פנקס-שהייה, תשלומים, לוח-ראשי או חדרי-חוגים. נטען בעצלות דרך הרישום.
 */
import { ability, isoAt, type NoInput, type SwitchCtx } from '../../lib/switchboard/contract';
import { featureOn } from '../../lib/config';
import type { HostFault, HostUnit } from '../../types/domain';
import { addDaysIso, arrivalsOn, departuresOn, hostTerms, isIso, occupiedRoomIds, unitHasRooms, unitLiveStatus, ALL_ROOMS } from './lib';

const clampInt = (v: unknown, min: number, max: number, dflt: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.floor(v))) : dflt;

/** "היום" של האירוח — הרגע המוזרק בשעון-הארגון (לא שעון-המכשיר). */
const todayOf = (ctx: SwitchCtx): string => isoAt(ctx.nowMs);

/* ═══════════════ hosting.availability ═══════════════ */

export interface AvailabilityInput {
  /** הלילה הראשון — חסר ⇒ הלילה (היום בשעון-הארגון). */
  readonly fromIso?: string;
  /** כמה לילות (1–30, ברירה 1). */
  readonly nights?: number;
}

export interface FreeUnit {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  /** קיבולת-אורחים (יחידה שלמה). */
  readonly cap: number;
  /** חדרים ביחידה משותפת (0 = מוזמנת כשלמה). */
  readonly rooms: number;
  readonly freeRooms: number;
  /** מיטות בחדרים הפנויים (יחידה משותפת). */
  readonly freeBeds: number;
}

export interface AvailabilityOutput {
  readonly fromIso: string;
  readonly toIso: string;
  readonly nights: number;
  /** כמה יחידות במקום (כולל תפוסות/חסומות). */
  readonly units: number;
  readonly free: readonly FreeUnit[];
  /** שם-העסק (הגדרות ⇐ מיתוג ⇐ שם-הארגון). */
  readonly bizName: string;
}

function availability(ctx: SwitchCtx, input: AvailabilityInput): AvailabilityOutput {
  const today = todayOf(ctx);
  const from = typeof input?.fromIso === 'string' && isIso(input.fromIso) ? input.fromIso : today;
  const nights = clampInt(input?.nights, 1, 30, 1);
  const to = addDaysIso(from, nights);
  const units: readonly HostUnit[] = Array.isArray(ctx.db.hostUnits) ? ctx.db.hostUnits : [];
  const bookings = Array.isArray(ctx.db.hostBookings) ? ctx.db.hostBookings : [];
  const free: FreeUnit[] = [];
  for (const u of units) {
    if (u.status === 'blocked') continue; // F1 — חסומה (תקלה P0/P1 או חסימה ידנית) אינה פנויה
    const occ = occupiedRoomIds(bookings, u, from, to);
    // F8 — אורח בשהייה שמועד-העזיבה שלו עבר ועוד לא יצא מחזיק את היחידה/החדרים שלו (רק כשהטווח מתחיל עד היום)
    if (from <= today) {
      for (const b of bookings) {
        if (b.unitId !== u.id || b.status !== 'in' || b.checkIn > today || b.checkOut > from) continue;
        if (!unitHasRooms(u)) occ.add(ALL_ROOMS);
        else for (const id of b.roomIds.length ? b.roomIds : u.subRooms.map((r) => r.id)) occ.add(id);
      }
    }
    if (!unitHasRooms(u)) {
      if (occ.size === 0) free.push({ id: u.id, name: u.name, type: u.type, cap: u.cap, rooms: 0, freeRooms: 0, freeBeds: 0 });
      continue;
    }
    const open = occ.has(ALL_ROOMS) ? [] : u.subRooms.filter((r) => !occ.has(r.id));
    if (open.length) {
      free.push({ id: u.id, name: u.name, type: u.type, cap: u.cap, rooms: u.subRooms.length, freeRooms: open.length, freeBeds: open.reduce((s, r) => s + (r.beds || 0), 0) });
    }
  }
  const prefs = ctx.db.ui?.hosting;
  const bizName = prefs?.businessName?.trim() || ctx.config.orgName?.trim() || String(ctx.db.orgName ?? '').trim() || hostTerms(ctx.config, prefs).nav;
  return { fromIso: from, toIso: to, nights, units: units.length, free, bizName };
}

/* ═══════════════ hosting.today ═══════════════ */

export interface HostTodayOutput {
  readonly todayIso: string;
  readonly arrivals: number;
  readonly lateArrivals: number;
  readonly departures: number;
  readonly overdueDepartures: number;
  readonly inHouse: number;
  /** יחידות לניקיון — null כש-hosting.housekeeping כבוי. */
  readonly dirty: number | null;
  /** קריאות פתוחות — null כש-hosting.maint כבוי. */
  readonly openFaults: number | null;
  /** מתוכן P0/P1. */
  readonly urgentFaults: number | null;
  /** קריאות שנסגרו היום (תיאור · יחידה) — null כש-hosting.maint כבוי. */
  readonly handled: ReadonlyArray<{ readonly desc: string; readonly unit: string }> | null;
  /** מונח-היחידות של הארגון. */
  readonly unitsWord: string;
}

const clip = (s: string, n: number): string => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
};

function hostToday(ctx: SwitchCtx): HostTodayOutput {
  const today = todayOf(ctx);
  const units: readonly HostUnit[] = Array.isArray(ctx.db.hostUnits) ? ctx.db.hostUnits : [];
  const bookings = Array.isArray(ctx.db.hostBookings) ? ctx.db.hostBookings : [];
  const records = Array.isArray(ctx.db.hostRecords) ? ctx.db.hostRecords : [];
  const arr = arrivalsOn(bookings, today);
  const dep = departuresOn(bookings, today);
  const maint = featureOn(ctx.config, 'hosting.maint');
  const faults = maint ? records.filter((r): r is HostFault => r.kind === 'fault') : [];
  const open = faults.filter((f) => f.status !== 'done');
  const unitName = (id: string): string => units.find((u) => u.id === id)?.name ?? '';
  return {
    todayIso: today,
    arrivals: arr.length,
    lateArrivals: arr.filter((a) => a.late).length,
    departures: dep.length,
    overdueDepartures: dep.filter((d) => d.overdue).length,
    inHouse: bookings.filter((b) => b.status === 'in').length,
    dirty: featureOn(ctx.config, 'hosting.housekeeping') ? units.filter((u) => unitLiveStatus(u, bookings, today) === 'dirty').length : null,
    openFaults: maint ? open.length : null,
    urgentFaults: maint ? open.filter((f) => f.priority <= 1).length : null,
    handled: maint
      ? faults
          .filter((f) => f.status === 'done' && isoAt(Date.parse(f.updatedAt)) === today && Number.isFinite(Date.parse(f.updatedAt)))
          .map((f) => ({ desc: clip(f.desc, 60), unit: f.unitId ? unitName(f.unitId) : '' }))
      : null,
    unitsWord: hostTerms(ctx.config, ctx.db.ui?.hosting).units,
  };
}

/** שורות-התקציר: הגעות/עזיבות/בשהייה · לניקיון · חירום/פתוחות · מה טופל היום ("הנזילה טופלה"). */
function todayLines(o: HostTodayOutput): string[] {
  const late = (n: number): string => (n ? ' (' + n + ' באיחור)' : '');
  const out = ['🏡 הגעות היום: ' + o.arrivals + late(o.lateArrivals) + ' · עזיבות: ' + o.departures + late(o.overdueDepartures) + ' · בשהייה: ' + o.inHouse];
  if (o.dirty) out.push('🧹 ' + o.unitsWord + ' לניקיון: ' + o.dirty);
  if (o.urgentFaults) out.push('🚨 קריאות חירום פתוחות (P0/P1): ' + o.urgentFaults);
  else if (o.openFaults) out.push('🔧 קריאות תחזוקה פתוחות: ' + o.openFaults);
  for (const h of (o.handled ?? []).slice(0, 3)) out.push('✅ טופל היום: ' + h.desc + (h.unit ? ' · ' + h.unit : ''));
  return out;
}

/* ═══════════════ היכולות ═══════════════ */

export const abilities = {
  'hosting.today': ability<NoInput, HostTodayOutput>({ run: hostToday, today: { input: {}, lines: todayLines } }),
  'hosting.availability': ability<AvailabilityInput, AvailabilityOutput>({ run: availability }),
};
