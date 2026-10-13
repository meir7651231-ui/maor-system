/**
 * 🧩 ארגז המנועים — עזרי-תצוגה טהורים (בלי DOM/store), מעל התפר בלבד.
 */
import type { BoxPart, EngineBoxSource } from './types';

/** נקודת-ההתחלה כפי שהמסך מציג אותה: מוצר, או מנוע בודד. */
export interface BoxStart {
  id: string;
  name: string;
  emoji: string;
  kind: 'product' | 'part';
  parts: BoxPart[];
}

/** מזהה-התחלה ⇒ מוצר (קודם) או מנוע בודד; לא נמצא ⇒ null. */
export function resolveStart(source: EngineBoxSource, id: string): BoxStart | null {
  const product = source.products().find((p) => p.id === id);
  if (product) return { id: product.id, name: product.name, emoji: product.emoji, kind: 'product', parts: product.parts };
  const part = source.parts().find((p) => p.id === id);
  if (part) return { id: part.id, name: part.name, emoji: part.emoji, kind: 'part', parts: [part] };
  return null;
}

/** שלב 2: כל מנועי-הארגז חוץ מאלה שכבר בהתחלה (ובלי כפולים לפי id). */
export function pickableParts(source: EngineBoxSource, start: BoxStart): BoxPart[] {
  const own = new Set(start.parts.map((p) => p.id));
  const seen = new Set<string>();
  const out: BoxPart[] = [];
  for (const p of source.parts()) {
    if (own.has(p.id) || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

/** "חיבור אחד" / "3 חיבורים" — עברית פשוטה. */
export function linksLabel(n: number): string {
  if (n <= 0) return 'עוד אין חיבורים';
  if (n === 1) return 'חיבור אחד';
  return n + ' חיבורים';
}
