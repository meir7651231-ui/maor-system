/**
 * 🔄 חלק `rotate` — סבב הוגן (פורק ממנוע "מה צריך?", חלק 11: כל מפרסם מקבל את תורו, יום-יום).
 * לא יודע מה הוא מסבב: פרסומות, תורנויות, משימות. טהור, לא זורק.
 */

/** אינדקס-התור ב-n (גם שלילי — מודולו חיובי). רשימה ריקה ⇒ ‎-1. */
export function turnIndex(length: number, n: number): number {
  const len = Number.isFinite(length) ? Math.floor(length) : 0;
  if (len < 1) return -1;
  const k = Number.isFinite(n) ? Math.floor(n) : 0;
  return ((k % len) + len) % len;
}

/** של מי התור במספר n (מספר-יום, מספר-סבב). רשימה ריקה ⇒ null. */
export function turnOf<T>(list: readonly T[], n: number): T | null {
  if (!Array.isArray(list)) return null;
  const i = turnIndex(list.length, n);
  return i < 0 ? null : list[i];
}

/** מספר-יום מוחלט של תאריך ISO (ימים מ-1970, צהרי-UTC — בלי תלות באזור-הזמן). פגום ⇒ 0. ל"סבב לפי יום". */
export function dayIndex(iso: string): number {
  const t = Date.parse(String(iso) + 'T12:00:00Z');
  return Number.isFinite(t) ? Math.floor(t / 86_400_000) : 0;
}

/** שיבוץ בתורות: פריט i לאדם (start+i) — round robin. אין אנשים ⇒ []. */
export function fairAssign<I, P>(items: readonly I[], people: readonly P[], start = 0): { item: I; person: P }[] {
  if (!Array.isArray(items) || !Array.isArray(people) || !people.length) return [];
  const s = Number.isFinite(start) ? Math.floor(start) : 0;
  return items.map((item, i) => ({ item, person: people[turnIndex(people.length, s + i)] }));
}
