// ─────────────────────────────────────────────────────────────────────────────
// telephony · normalize — נרמול מספר-טלפון ל-E.164.
// טהור, אפס תלויות. ברירת-המחדל: ישראל (+972). מספר בין-לאומי שכבר עם + נשמר.
// אין כאן שום קריאת-ספק — רק עיבוד-מחרוזת מקומי (pure-downstream).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * מנרמל מספר גולמי ל-E.164. מחזיר null אם לא ניתן.
 * חוקים (ישראל = ברירת-מחדל):
 *   +972…            → נשמר (מנוקה מרווחים/מקפים)
 *   00972… / 972…    → +972…
 *   0XXXXXXXXX       → +972XXXXXXXXX  (מסיר 0 מוביל)
 *   +<country>…      → נשמר כפי-שהוא (בין-לאומי)
 *   00<country>…     → +<country>…
 * @param {string} raw
 * @param {string} [defaultCc='972'] קידומת-מדינה כברירת-מחדל (בלי +)
 * @returns {string|null}
 */
export function toE164(raw, defaultCc = '972') {
  if (typeof raw !== 'string') return null;
  // שדה עם שני-מספרים ("050.../052...") — קח את הראשון (אחרת מתמזג לזבל).
  raw = raw.split(/[/;,]| ו | או /)[0];
  // שמור אם היה + מוביל, ואז השאר ספרות בלבד.
  const hadPlus = raw.trim().startsWith('+');
  let d = raw.replace(/[^\d]/g, '');
  if (!d) return null;

  // קילוף אפס-גזע לאומי אחרי קידומת-המדינה: +<cc>0<rest> → +<cc><rest>.
  const trunk = (e164) => (e164 && e164.startsWith(`+${defaultCc}0`) ? `+${defaultCc}${e164.slice(defaultCc.length + 2)}` : e164);

  if (hadPlus) {
    // כבר בין-לאומי: +<ספרות>. אורך סביר 8..15.
    return d.length >= 8 && d.length <= 15 ? trunk(`+${d}`) : null;
  }
  // 00 מוביל = חיוג בין-לאומי → הפוך ל-+.
  if (d.startsWith('00')) {
    d = d.slice(2);
    return d.length >= 8 && d.length <= 15 ? trunk(`+${d}`) : null;
  }
  // מתחיל בקידומת-המדינה (בלי +) — קבל אם האורך הכולל הגיוני.
  if (d.startsWith(defaultCc) && d.length >= defaultCc.length + 7) {
    return trunk(`+${d}`);
  }
  // מספר מקומי עם 0 מוביל → החלף ב-+<cc>.
  if (d.startsWith('0')) {
    const local = d.replace(/^0+/, '');
    if (local.length < 7) return null;
    return `+${defaultCc}${local}`;
  }
  // מספר בלי + ובלי 0 מוביל: אורך-NSN ישראלי (7-9) ⇒ הצמד קידומת-מדינה;
  // אורך 10+ ⇒ ככל-הנראה מספר בין-לאומי שכולל כבר קידומת-מדינה (לא להצמיד +972!).
  if (d.length >= 7 && d.length <= 9) {
    return `+${defaultCc}${d}`;
  }
  if (d.length >= 10 && d.length <= 15) {
    return `+${d}`;
  }
  return null;
}

/**
 * השוואת-מספרים ניטרלית-לפורמט: שני גלמיים מייצגים אותו מספר?
 * @returns {boolean}
 */
export function sameNumber(a, b, defaultCc = '972') {
  const na = toE164(a, defaultCc);
  const nb = toE164(b, defaultCc);
  return na !== null && na === nb;
}
