/**
 * 📡 relay · מעביר דרך מרכז — חלק טהור בלי עולם (STATIC-VERBS, 14.10.2026).
 *
 * אף אחד לא מדבר ישר: כל הודעה נכנסת למרכז פעם אחת (מקבלת מספר-תחנה), והמרכז מפיץ אותה לכל חבר
 * חוץ מהשולח. הסדר של כל שולח נשמר אצל כל מקבל. כמו המרכזייה של אורביט (כלי שואל כלי אחר רק דרך ask),
 * תור-השליחה (האפליקציה כותבת ל-smsOutbox/mailOutbox והשרת שולח) וצ׳אט-הצוות.
 */

/**
 * @param {{from: 'a'|'b'|'c'|'d', body: string}[]} messages  לפי סדר ההגעה
 * @param {('a'|'b'|'c'|'d')[]} members  מי מחובר למרכז
 * @returns {{n: number, from: string, to: string, body: string}[]} המסירות, לפי סדר-המרכז ואז סדר-החברים
 */
export function relay(messages, members) {
  const who = [...new Set((Array.isArray(members) ? members : []).filter((m) => typeof m === 'string' && m))];
  const out = [];
  let n = 0;
  for (const m of Array.isArray(messages) ? messages : []) {
    if (!m || typeof m !== 'object' || typeof m.from !== 'string') continue;
    const seq = n++;
    for (const to of who) if (to !== m.from) out.push({ n: seq, from: m.from, to, body: m.body });
  }
  return out;
}
