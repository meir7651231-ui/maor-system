/**
 * 🔨 המפרק · המד (ATOMS-DECOMPOSE, 14.10.2026) — כמו המד של המחולל של הבעלים.
 * (א) כמה מהמקומות שפורקו ביד המפרק מצא לבד (recall). (ב) כמה חיבורים (מקום × חלק) נותנים תוצאה אמיתית על נתונים.
 * טהור: הנתונים ו"עכשיו" מוזרקים.
 */
import { ATOM_IDS, type AtomId } from '../contract';
import { genericPreviewOf, type GenericCtx, type GenericPreview } from './genericPreview';
import type { GenEngine } from './types';

export interface RealConnection {
  engine: string;
  place: string;
  atom: AtomId;
  preview: GenericPreview;
}

/** כל החיבורים שנותנים תוצאה אמיתית (פרטי-ברירת-המחדל של החלק). כמה הקשרים ⇒ הראשון שנותן תוצאה. */
export function realConnections(engines: readonly GenEngine[], ctxs: readonly GenericCtx[]): RealConnection[] {
  const out: RealConnection[] = [];
  for (const e of engines)
    for (const pl of e.places)
      for (const atom of ATOM_IDS) {
        if (!pl.results[atom]) continue;
        for (const ctx of ctxs) {
          const pv = genericPreviewOf(pl, atom, {}, ctx);
          if (pv) {
            out.push({ engine: e.id, place: pl.id, atom, preview: pv });
            break;
          }
        }
      }
  return out;
}

/** ספירה לפי מנוע. */
export function countByEngine(conns: readonly RealConnection[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of conns) out[c.engine] = (out[c.engine] ?? 0) + 1;
  return out;
}

/** מפתח-ההתאמה של מקום שפורק ביד: אילו מקומות/פונקציות של המפרק נחשבים "מצאו אותו". */
export interface RecallKey {
  hand: string;
  /** מזהי מקומות או פונקציות-גישה שנוצרו (`<מודול>.<…>` / `<מודול>.fn.<פונקציה>`). */
  any: readonly string[];
}

/** כמה מקומות-יד נמצאו: מקום נחשב נמצא אם אחד מהמזהים קיים במנוע שנוצר, **ובאותו סוג** כמו מקום-היד. */
export function recall(
  engines: readonly GenEngine[],
  hand: readonly { id: string; kind: string }[],
  keys: readonly RecallKey[],
): { found: string[]; missed: string[]; pct: number } {
  const kinds = new Map<string, string>();
  for (const e of engines) {
    for (const p of e.places) kinds.set(p.id, p.kind);
    for (const p of e.fnPlaces) kinds.set(p.id, p.kind);
  }
  const keyOf = new Map(keys.map((k) => [k.hand, k.any]));
  const found: string[] = [];
  const missed: string[] = [];
  for (const h of hand) {
    const any = keyOf.get(h.id) ?? [];
    if (any.some((id) => kinds.get(id) === h.kind)) found.push(h.id);
    else missed.push(h.id);
  }
  return { found, missed, pct: hand.length ? Math.round((found.length / hand.length) * 1000) / 10 : 0 };
}
