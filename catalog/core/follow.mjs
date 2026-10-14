/**
 * 🐾 הולך אחרי (follow) — בכל צעד מתקרב חלק קבוע מהדרך אל המטרה: אף פעם לא עובר אותה, וכשהגיע — נשאר.
 * הליבה בלי עולם של: מצלמה/עכבר שנגררים בעדינות, החלקת-ערך (ממוצע נע), ציפור שהולכת אחרי השכנה. מקורות: origins.json.
 * טהור: צעד אחד; הלולאה אצל הקורא.
 * @param {{target: number, pullPct: number}} spec
 * @param {number} current
 * @returns {number}
 */
export function follow(spec, current) {
  const target = fin(spec?.target);
  const k = Math.min(100, Math.abs(fin(spec?.pullPct))) / 100;
  const c = fin(current);
  return c + (target - c) * k;
}

function fin(x) { const v = Number(x); return Number.isFinite(v) ? v : 0; }
