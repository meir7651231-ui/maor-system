/**
 * שליחה-מרובה — טהור, ‏ללא רשת/DOM.
 * נבנה לבקשת-בעלים 25.8: "אפשרות לשליחה מרובה של וואטסאפ ומיילים".
 *
 * הכללים:
 * - מייל: דדופ לפי כתובת מנורמלת (lowercase+trim); שורות בלי מייל מסוננות.
 * - וואטסאפ: דדופ לפי-ספרות (‏waDigits) — שני-תורמים-אותו-טלפון = הודעה-אחת;
 *   שורות בלי טלפון-תקין (`waDigits==null`) מסוננות.
 * - הסינון-קודם-דדופ ⇒ הספירה שמוצגת בכפתור/במודאל = מספר-הנמענים בפועל
 *   (לא מספר-המסומנים) ⇒ המזכירה רואה אמת ולא צריכה לנחש כמה יישלח.
 */
import { waDigits } from './wa';

export interface BulkMailRow {
  id: string;
  name: string;
  email: string;
}
export interface BulkWaRow {
  id: string;
  name: string;
  phone: string;
  digits: string; // '972…' — מוכן ל-wa.me
}

/** מנרמל כתובת-מייל להשוואת-דדופ (case-insensitive, ‏trim). */
export function normEmail(s: string): string {
  return (s || '').trim().toLowerCase();
}

/** נמעני-מייל מרוכזים — מסונן ומדוד. שומר את השם/מזהה של ה**ראשון** באותה כתובת. */
export function bulkMailRecipients<T extends { id: string; name: string; email?: string }>(
  sups: readonly T[],
): BulkMailRow[] {
  const seen = new Set<string>();
  const out: BulkMailRow[] = [];
  for (const sp of sups) {
    const e = normEmail(sp.email || '');
    if (!e || !e.includes('@')) continue;
    if (seen.has(e)) continue;
    seen.add(e);
    out.push({ id: sp.id, name: sp.name || '', email: sp.email!.trim() });
  }
  return out;
}

/** נמעני-וואטסאפ מרוכזים — מסונן ומדוד לפי-ספרות. */
export function bulkWaRecipients<T extends { id: string; name: string; phone?: string }>(
  sups: readonly T[],
): BulkWaRow[] {
  const seen = new Set<string>();
  const out: BulkWaRow[] = [];
  for (const sp of sups) {
    const digits = waDigits(sp.phone || '');
    if (!digits) continue;
    if (seen.has(digits)) continue;
    seen.add(digits);
    out.push({ id: sp.id, name: sp.name || '', phone: sp.phone!, digits });
  }
  return out;
}
