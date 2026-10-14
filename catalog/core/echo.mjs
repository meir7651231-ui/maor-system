/**
 * 📡 הד (echo) — שולחים אות, מודדים אחרי כמה זמן חזר, וממנו המרחק: הדרך הלוך-וחזור, חלקי שתיים.
 * הליבה בלי עולם של: מדידת זמן-תגובה (ping) בין סוכנים/שרת, "דולפין שולח צליל". מקורות: origins.json.
 * טהור: זמן-החזרה מוזרק.
 * @param {{speed: number}} spec
 * @param {number} roundTrip
 * @returns {number}
 */
export function echo(spec, roundTrip) {
  const speed = Math.abs(fin(spec?.speed));
  return (speed * Math.max(0, fin(roundTrip))) / 2;
}

function fin(x) { const v = Number(x); return Number.isFinite(v) ? v : 0; }
