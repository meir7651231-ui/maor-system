/**
 * 🧰 globalSetup של vitest (INNER v2, 14.10.2026): לפני כל ריצת-בדיקות — ensure-gen משחזר את הקבצים הנוצרים שלא בריפו
 * (catalog/inner/gen/** · catalog/sources/inner-*.json · catalog/behavior/inner-*.json) מהמחסן/החבילות/הקוד.
 * מהיר כשהכול מעודכן; בשכפול טרי — אורביט נוצר מחדש מהקוד (~45 שניות) והחיצוניים נפרשים מהחבילות.
 */
import { ensureGen } from './ensure-gen.mjs';

export default async function setup() {
  await ensureGen();
}
