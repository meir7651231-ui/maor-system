/**
 * 🧩 ארגז המנועים · שכבת החלקים — כרטיסי המנועים הגדולים (ATOMS-ENGINES, 14.10.2026).
 * כל כרטיס: הפירוק לחלקים קטנים + המקומות (הצד הזכר) עם משפט-תוצאה לכל חלק שמתחבר.
 */
import type { EngineCard, EngineId, Place } from '../contract';
import { ZMANIM_CARD } from './zmanim';
import { WHAT_NEED_CARD } from './whatNeed';
import { BOOKINGS_CARD } from './bookings';

/** בסדר ENGINE_IDS. */
export const ENGINE_CARDS: readonly EngineCard[] = [ZMANIM_CARD, WHAT_NEED_CARD, BOOKINGS_CARD];

const BY_ID = new Map<string, EngineCard>(ENGINE_CARDS.map((c) => [c.id, c]));
const PLACE_BY_ID = new Map<string, Place>(ENGINE_CARDS.flatMap((c) => c.places.map((p) => [p.id, p] as const)));

export function engineCard(id: EngineId | string): EngineCard | undefined {
  return BY_ID.get(id);
}

export function placeById(id: string): Place | undefined {
  return PLACE_BY_ID.get(id);
}

export { ZMANIM_CARD, WHAT_NEED_CARD, BOOKINGS_CARD };
