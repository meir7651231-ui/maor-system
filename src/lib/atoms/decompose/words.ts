/**
 * 🔨 המפרק · מילים פשוטות (ATOMS-DECOMPOSE, 14.10.2026).
 * כלל-השמות של הבעלים: פעלים פשוטים, ובלי המילים מיזוג, ניתוב, הסלמה, סלחני, יחסי, אטום, רצף, טווח ("ברצף" מותר).
 * ההערות בקוד כתובות בשפת-מתכנתים — כאן הן הופכות למילים שמותר להראות. טהור. ⚠️ תחביר-מחיק בלבד (Node טוען ישירות).
 */

/** המילים האסורות (בדיקה: "ברצף" מותר). */
export const FORBIDDEN_WORDS = ['מיזוג', 'ניתוב', 'הסלמה', 'סלחני', 'יחסי', 'אטום', 'רצף', 'טווח'] as const;

/** האם יש בטקסט מילה אסורה. "ברצף" לבדו מותר. */
export function hasForbidden(s: string): string | null {
  const t = String(s ?? '').replace(/ברצף/g, '');
  for (const w of FORBIDDEN_WORDS) if (t.includes(w)) return w;
  return null;
}

const SWAPS: readonly (readonly [RegExp, string])[] = [
  [/מיזוגים/g, 'איחודים'],
  [/מיזוג/g, 'איחוד'],
  [/ממוזג(ת|ים|ות)?/g, 'מאוחד$1'],
  [/ממזג(ת|ים|ות)?/g, 'מאחד$1'],
  [/ניתובים/g, 'שליחות'],
  [/ניתוב/g, 'שליחה'],
  [/הסלמה/g, 'העברה הלאה'],
  [/סלחני(ת|ים|ות)?/g, 'שמוצא גם עם טעות'],
  [/יחסיי?(ת|ים|ות)?/g, 'ביחס'],
  [/אטומים/g, 'חלקים'],
  [/אטום/g, 'חלק'],
  [/ברצף/g, '\uE000'],
  [/רצפים/g, 'שורות'],
  [/רצף/g, 'שורה'],
  [/\uE000/g, 'ברצף'],
  [/טווחים/g, 'תקופות'],
  [/טווח/g, 'תקופה'],
];

/** החלפת המילים האסורות במילים פשוטות. */
export function plainWords(s: string): string {
  let t = String(s ?? '');
  for (const [re, to] of SWAPS) t = t.replace(re, to);
  return t;
}

/** האם יש בטקסט עברית. */
export const hasHebrew = (s: string): boolean => /[א-ת]/.test(String(s ?? ''));

/**
 * הערה מהקוד ⇒ שם קצר: המשפט הראשון עד הפסקה הראשונה (— . : ; ⇒ או סוגריים), בלי קוד בגרשיים-הפוכים,
 * בלי אימוג'י וסימני-קוד, עד 9 מילים. אין עברית ⇒ ''.
 */
export function shortName(doc: string): string {
  const first = cleanDoc(doc).split(/\s+—\s+|\s+-\s+|\.\s|\.$|:\s|;\s|\s⇒\s|\s\(|\s←\s|\s→\s/)[0] ?? '';
  const words = first.split(/\s+/).filter(Boolean);
  const out = (words.length > 9 ? words.slice(0, 9).join(' ') + '…' : words.join(' ')).trim();
  return hasHebrew(out) ? plainWords(out) : '';
}

/** הערה מהקוד ⇒ משפט אחד (עד 160 תווים). אין עברית ⇒ ''. */
export function oneSentence(doc: string): string {
  const s = cleanDoc(doc);
  const m = /^(.+?[.!?])(\s|$)/.exec(s);
  let out = (m ? m[1] : s).trim();
  if (out.length > 160) out = out.slice(0, 159).replace(/\s+\S*$/, '') + '…';
  return hasHebrew(out) ? plainWords(out) : '';
}

/** ניקוי הערה: בלי קוד בגרשיים-הפוכים, בלי סימוני-קוד, רווחים מכווצים. */
export function cleanDoc(doc: string): string {
  return String(doc ?? '')
    .replace(/\{@link\s+([^}]+)\}/g, '$1')
    .replace(/`[^`]*`/g, '')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
    .replace(/\s*\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s·•*\-–—:,]+/, '')
    .trim();
}
