/**
 * 🎵 ממיר כל פריט (map) — צליל בגובה אחר: כל התווים של הצליל (תדר f, התחלה t, משך d, עוצמה g) נשארים, רק התדר מוכפל ביחס.
 * הליבה בלי עולם של צליל-המטבע של פרנס׳לע (src/components/parnasa/sound.ts:83–89):
 *   `for (const [f, g, d] of [[2637, .14, .34], [3960, .08, .24], …]) tone(f * j, t, d, g);` — אותו מטבע, מוכפל ב-j.
 * כאן הצליל הוא נתון — רשימת `{f, t, d, g}` (בדיוק הארגומנטים של `tone(f, t, d, g)`), בלי WebAudio.
 * יחס חיובי בלבד (גובה אמיתי): שלילי ⇒ ערכו המוחלט, 0/לא-מספר ⇒ 1 (אותו גובה).
 * @param {{f: number, t: number, d: number, g: number}[]} notes
 * @param {number} ratio
 * @returns {{f: number, t: number, d: number, g: number}[]}
 */
export function transposeNotes(notes, ratio) {
  const j = Math.abs(Number(ratio)) || 1;
  return (Array.isArray(notes) ? notes : []).filter((n) => n && typeof n === 'object').map((n) => ({ ...n, f: Number(n.f) * j }));
}
