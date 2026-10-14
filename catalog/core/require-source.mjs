/**
 * 🔗 require-source · דורש מקור — חלק טהור בלי עולם (STATIC-VERBS, 14.10.2026).
 *
 * פריט בלי מקור נדחה; פריט עם מקור עובר כמו שהוא; ולעולם לא ממציאים מקור.
 * "מקור" = שדה src/source/sources: טקסט לא-ריק, או {t|title|url} לא-ריק, או רשימה לא-ריקה של כאלה —
 * וכל קישור בו חייב להיות https (כמו safeHttpsUrl באורביט וכמו שער יומן-הבינה: `src` = {t, url:^https://}).
 */

const HTTPS = /^https:\/\/[^\s]+$/;
function oneSource(s) {
  if (typeof s === 'string') return s.trim().length > 0 && (!/^[a-z][a-z0-9+.-]*:/i.test(s.trim()) || HTTPS.test(s.trim()));
  if (!s || typeof s !== 'object' || Array.isArray(s)) return false;
  const url = s.url ?? s.href;
  if (url !== undefined && !(typeof url === 'string' && HTTPS.test(url.trim()))) return false;
  const t = s.t ?? s.title ?? s.text;
  return (typeof t === 'string' && t.trim().length > 0) || (typeof url === 'string' && HTTPS.test(url.trim()));
}

/** האם לפריט יש מקור תקין. @param {any} item @returns {boolean} */
export function hasSource(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  const k = ['src', 'source', 'sources'].find((x) => Object.hasOwn(item, x) && item[x] != null);
  if (!k) return false;
  const v = item[k];
  return Array.isArray(v) ? v.length > 0 && v.every(oneSource) : oneSource(v);
}

/**
 * @param {{text: string, src?: {t: string, url: string}[]}[]} items
 * @returns {{accepted: any[], rejected: number[]}} המקובלים (כמו שהם, לפי הסדר) · אינדקסים של הנדחים
 */
export function requireSource(items) {
  const accepted = [];
  const rejected = [];
  (Array.isArray(items) ? items : []).forEach((it, k) => (hasSource(it) ? accepted.push(it) : rejected.push(k)));
  return { accepted, rejected };
}
