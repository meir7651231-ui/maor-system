/**
 * 🏭 המפעל · הרישום של המנועים שנמצאו אוטומטית (ATOMS-FACTORY, 14.10.2026).
 *
 * המפרק מוציא כרטיסי-מנוע (`GenEngine`) — כל אחד ב-chunk עצל משלו (`generated/lazy.ts`). כאן הם נרשמים בזמן-ריצה,
 * כדי ש-`engineCard`/`placeById` (engines/index.ts) — ואיתם היכולות, השרשרת, ההרכבה והתצוגות — יכירו אותם בלי שינוי-חוזה.
 * **אפס ייבוא של כרטיס שנוצר כאן** (רק טיפוסים): הקובץ יושב ב-chunk של atoms, והכרטיסים נטענים רק כשמישהו מבקש.
 * המקום שנוצר תואם ל-`Place` של החוזה (מזהה · מנוע · שם · סוג · תוצאות) + מפרט-הקריאה ההצהרתי שלו.
 */
import type { EngineCard, EngineId, Place } from '../contract';
import type { GenEngine, GenPlace } from '../decompose/types';

const ENGINES = new Map<string, EngineCard>();
const RAW = new Map<string, GenEngine>();
const PLACES = new Map<string, GenPlace>();

/** כרטיס-המנוע של החוזה ממנוע שנוצר: אותם מקומות (עם המפרט), הפירוק בשמות העבריים. */
export function genCardOf(g: GenEngine): EngineCard {
  return {
    id: g.id as EngineId,
    name: g.name,
    emoji: g.emoji,
    from: g.from,
    computes: g.computes,
    parts: g.parts.map((p) => (p.atom ? { num: p.num, name: p.name, computes: p.computes, atom: p.atom } : { num: p.num, name: p.name, computes: p.computes })),
    // המקום שנוצר = Place של החוזה + המפרט (המזהה של המנוע מחרוזת — החוזה מכיר רק את שלושת הראשונים)
    places: g.places as unknown as Place[],
  };
}

/** רושם מנועים שנוצרו (אידמפוטנטי — אותו מזהה נרשם פעם אחת; מנוע-יד באותו מזהה לא נדרס). */
export function registerGenerated(list: readonly GenEngine[], handIds: readonly string[] = ['zmanim', 'whatNeed', 'bookings']): void {
  for (const g of Array.isArray(list) ? list : []) {
    if (!g || typeof g.id !== 'string' || handIds.includes(g.id) || RAW.has(g.id)) continue;
    RAW.set(g.id, g);
    ENGINES.set(g.id, genCardOf(g));
    for (const p of g.places) if (p && typeof p.id === 'string' && !PLACES.has(p.id)) PLACES.set(p.id, p);
  }
}

export const genEngineCard = (id: string): EngineCard | undefined => ENGINES.get(id);
export const genPlace = (id: string): GenPlace | undefined => PLACES.get(id);
export const genEngine = (id: string): GenEngine | undefined => RAW.get(id);
export const isGeneratedEngine = (id: string): boolean => RAW.has(id);
/** כל המנועים שנרשמו, בסדר הרישום. */
export const generatedCards = (): EngineCard[] => [...ENGINES.values()];
