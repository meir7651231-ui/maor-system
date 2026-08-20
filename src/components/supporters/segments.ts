/**
 * סגמנטים שמורים — מנוע טהור לצד ה"שליטה המלאה" של הקוקפיט.
 *
 * הגדרות-סגמנט מובנות מעל אותם נתונים קיימים (‏db.supporters), כל אחת עם פרדיקט
 * דטרמיניסטי ומונה-חי. אפס שינוי-סכמה. משמש את רצועת-הקוקפיט (צ׳יפים עם מונה) —
 * לחיצה מנתבת למסך-הנתונים לחפירה.
 */
import type { Supporter } from '../../types/domain';
import { supIls, supLast, supUsd } from './lib';
import { cockpitAtRisk, daysSince } from './cockpit';

export type SegmentKey = 'atrisk' | 'goldsilent' | 'hok' | 'gave12m' | 'noemail';

export interface SegmentDef {
  key: SegmentKey;
  label: string;
  /** צבע-נקודה סמנטי לצ׳יפ. */
  dot: string;
  match: (sp: Supporter, todayIso: string, rate: number) => boolean;
}

/** ערך-כולל בש״ח-שקול (דטרמיניסטי — בלי supScore/שעון). */
function totalIls(sp: Supporter, rate: number): number {
  return supIls(sp) + supUsd(sp) * rate;
}

/** סף "זהב" לסגמנט הזהב-השקטים (₪-שקול מצטבר). */
export const SEGMENT_GOLD_ILS = 5000;
/** סף שקט (ימים) לסגמנט הזהב-השקטים. */
export const SEGMENT_GOLD_SILENT_DAYS = 60;

export const SEGMENTS: readonly SegmentDef[] = [
  {
    key: 'atrisk',
    label: 'בסיכון נטישה',
    dot: '#b45309',
    // נתן-בעבר, שקט מעל הסף, בלי יעד-קשר — זהה להגדרת הקוקפיט (מקור-אמת אחד).
    match: (sp, today) => {
      // מימוש דרך cockpitAtRisk כדי לשמור מקור-אמת יחיד (ראה segmentCounts).
      void sp;
      void today;
      return false;
    },
  },
  {
    key: 'goldsilent',
    label: 'זהב · שקטים 60+ יום',
    dot: '#a05008',
    match: (sp, today, rate) =>
      totalIls(sp, rate) >= SEGMENT_GOLD_ILS && daysSince(supLast(sp), today) >= SEGMENT_GOLD_SILENT_DAYS,
  },
  {
    key: 'hok',
    label: 'הו״ק פעילות',
    dot: '#2e7d32',
    match: (sp) => sp.hok?.active === true,
  },
  {
    key: 'gave12m',
    label: 'תרמו ב-12 החודשים',
    dot: '#1d4ed8',
    match: (sp, today) => {
      const last = supLast(sp);
      return !!last && daysSince(last, today) <= 365;
    },
  },
  {
    key: 'noemail',
    label: 'ללא אימייל',
    dot: '#8a8172',
    match: (sp) => !sp.email,
  },
] as const;

export interface SegmentCount {
  key: SegmentKey;
  label: string;
  dot: string;
  count: number;
}

/**
 * מונה-חי לכל סגמנט. 'atrisk' עובר דרך cockpitAtRisk (מקור-אמת יחיד עם הקוקפיט),
 * השאר דרך הפרדיקט המקומי.
 */
export function segmentCounts(
  supporters: readonly Supporter[],
  todayIso: string,
  rate = 3.7,
): SegmentCount[] {
  const atRiskCount = cockpitAtRisk(supporters, todayIso).length;
  return SEGMENTS.map((seg) => ({
    key: seg.key,
    label: seg.label,
    dot: seg.dot,
    count:
      seg.key === 'atrisk'
        ? atRiskCount
        : supporters.reduce((n, sp) => n + (seg.match(sp, todayIso, rate) ? 1 : 0), 0),
  }));
}

/** פרדיקט-סגמנט בודד (למסננים חיצוניים) — 'atrisk' עוטף את מנוע-הקוקפיט. */
export function matchSegment(
  sp: Supporter,
  key: SegmentKey,
  supporters: readonly Supporter[],
  todayIso: string,
  rate = 3.7,
): boolean {
  if (key === 'atrisk') return cockpitAtRisk(supporters, todayIso).some((s) => s.id === sp.id);
  const def = SEGMENTS.find((s) => s.key === key);
  return def ? def.match(sp, todayIso, rate) : false;
}
