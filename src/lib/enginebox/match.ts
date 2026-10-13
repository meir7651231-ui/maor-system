/**
 * 🧰 ארגז-המנועים — המתאים (BUILD-ORDER-ENGINEBOX-2026-10-13): "אתה יכול לחבר את המנוע פה ופה ושם, והתוצאה תהיה זה".
 *
 *   · catalogFor(config) — החלקים שבארגז של הארגון: המודול דלוק (moduleOn — parnasa/hosting הם opt-in) והדגל דלוק
 *     (featureOn על תת-הדגל, ובלעדיו על דגל-הכלי) — אותם שערים בדיוק של המרכזייה.
 *   · connectOptions({ start, picked, stored, config }) — הלקוח התחיל ממוצר (או ממנוע אחד) ובחר מנוע מהארגז: כל זוג
 *     זכר⇄נקבה באותו מחבר, ששני צדדיו חיים, בין שני כלים שונים. `into` = המנוע שנבחר נותן לתוך ההתחלה; `from` =
 *     ההתחלה נותנת לתוך המנוע שנבחר. התוצאה — מהצד המקבל. `linked` = מחובר עכשיו (שמור, או ברירת-המחדל).
 *   · futureOptions(...) — אותם זוגות כשלפחות צד אחד עוד לא בנוי — לרשימת "בקרוב" כנה, לעולם לא מעורבב באפשרויות.
 * מזהה זר ⇒ []. לעולם לא זורק. סדר דטרמיניסטי (כיוון · סדר-החלקים · סדר-המחברים). טהור: בלי React/store/DOM/שעון.
 */
import { featureOn, moduleOn } from '../config';
import type { OrgConfig } from '../../types/config';
import { PARTS, partById, partOrder, productById, type Part } from './parts';
import { plugInfo, plugOrder, type PlugType } from './plugs';
import { effectiveLinks, linkKey } from './links';

export type ConnectSide = 'into' | 'from';

/** אפשרות-חיבור אחת להצגה. */
export interface ConnectOption {
  readonly key: string;
  readonly giver: string;
  readonly giverName: string;
  readonly needer: string;
  readonly neederName: string;
  readonly plug: PlugType;
  readonly plugLabel: string;
  /** מה יוצא מהנותן. */
  readonly gives: string;
  /** מה קורה כשמחברים (מהצד המקבל). */
  readonly result: string;
  readonly side: ConnectSide;
  readonly linked: boolean;
}

/** אפשרות "בקרוב": אותה צורה, בלי linked, ועם מה שחסר. */
export interface FutureOption extends Omit<ConnectOption, 'linked'> {
  /** איזה צד עוד לא בנוי. */
  readonly missing: 'give' | 'need' | 'both';
}

export interface ConnectQuery {
  /** מזהה מוצר או מזהה חלק. */
  readonly start: string;
  /** מזהה החלק שנבחר מהארגז. */
  readonly picked: string;
  /** `ui.engineLinks` השמור (חסר ⇒ ברירת-המחדל). */
  readonly stored?: readonly string[] | null;
  readonly config: OrgConfig;
}

function partOn(p: Part, config: OrgConfig): boolean {
  return moduleOn(config, p.module) && featureOn(config, p.flag ?? p.module);
}

/** החלקים שבארגז של הארגון (בסדר-החלקים). קונפיג פגום ⇒ []. */
export function catalogFor(config: OrgConfig): Part[] {
  try {
    return PARTS.filter((p) => partOn(p, config));
  } catch {
    return [];
  }
}

/** חלקי ההתחלה (מוצר ⇒ חלקיו; חלק ⇒ הוא עצמו) שבארגז, וחלק-הבחירה — או null כשאין מה להתאים. */
function sides(q: ConnectQuery): { start: Part[]; picked: Part } | null {
  if (!q || typeof q !== 'object') return null;
  const on = new Set(catalogFor(q.config).map((p) => p.id));
  const picked = partById(q.picked);
  if (!picked || !on.has(picked.id)) return null;
  const product = productById(q.start);
  const startIds = product ? product.parts : partById(q.start) ? [q.start] : [];
  if (startIds.includes(picked.id)) return null; // כבר חלק מההתחלה — אין מה לחבר
  const start = startIds.map((id) => partById(id)).filter((p): p is Part => !!p && on.has(p.id));
  return start.length ? { start, picked } : null;
}

interface RawPair {
  readonly g: Part;
  readonly n: Part;
  readonly plug: PlugType;
  readonly gives: string;
  readonly result: string;
  readonly side: ConnectSide;
  readonly giveLive: boolean;
  readonly needLive: boolean;
}

function pairs(givers: readonly Part[], needers: readonly Part[], side: ConnectSide): RawPair[] {
  const out: RawPair[] = [];
  for (const g of givers) {
    for (const n of needers) {
      if (g.id === n.id || g.module === n.module) continue;
      for (const give of g.gives) {
        for (const need of n.needs) {
          if (give.plug !== need.plug) continue;
          out.push({ g, n, plug: give.plug, gives: give.label, result: need.result, side, giveLive: give.live, needLive: need.live });
        }
      }
    }
  }
  return out;
}

function allPairs(q: ConnectQuery): RawPair[] {
  const s = sides(q);
  if (!s) return [];
  return [...pairs([s.picked], s.start, 'into'), ...pairs(s.start, [s.picked], 'from')];
}

const SIDE_ORDER: Record<ConnectSide, number> = { into: 0, from: 1 };

function byOrder(a: RawPair, b: RawPair): number {
  return SIDE_ORDER[a.side] - SIDE_ORDER[b.side] || partOrder(a.g.id) - partOrder(b.g.id) || partOrder(a.n.id) - partOrder(b.n.id) || plugOrder(a.plug) - plugOrder(b.plug);
}

function shape(p: RawPair): Omit<ConnectOption, 'linked'> {
  return {
    key: linkKey(p.g.id, p.plug, p.n.id),
    giver: p.g.id,
    giverName: p.g.name,
    needer: p.n.id,
    neederName: p.n.name,
    plug: p.plug,
    plugLabel: plugInfo(p.plug)?.label ?? p.plug,
    gives: p.gives,
    result: p.result,
    side: p.side,
  };
}

/** זוגות ייחודיים לפי מפתח (הראשון בסדר נשמר — שני Give זהים באותו מחבר לא מכפילים אפשרות). */
function uniq<T extends { key: string }>(list: readonly T[]): T[] {
  const seen = new Set<string>();
  return list.filter((x) => (seen.has(x.key) ? false : (seen.add(x.key), true)));
}

/** "אפשר לחבר פה ופה ושם": כל החיבורים ששני צדדיהם בנויים, עם התוצאה ועם מצב-החיבור. לעולם לא זורק. */
export function connectOptions(q: ConnectQuery): ConnectOption[] {
  try {
    const live = allPairs(q).filter((p) => p.giveLive && p.needLive).sort(byOrder);
    const linked = effectiveLinks(q.stored);
    return uniq(live.map(shape)).map((o) => ({ ...o, linked: linked.has(o.key) }));
  } catch {
    return [];
  }
}

/** "בקרוב": זוגות שלפחות צד אחד שלהם עוד לא בנוי — לעולם לא מוצעים לחיבור. לעולם לא זורק. */
export function futureOptions(q: ConnectQuery): FutureOption[] {
  try {
    const live = new Set(connectOptions(q).map((o) => o.key));
    const fut = allPairs(q)
      .filter((p) => !(p.giveLive && p.needLive))
      .sort(byOrder)
      .map((p): FutureOption => ({ ...shape(p), missing: !p.giveLive && !p.needLive ? 'both' : !p.giveLive ? 'give' : 'need' }));
    return uniq(fut).filter((o) => !live.has(o.key));
  } catch {
    return [];
  }
}
