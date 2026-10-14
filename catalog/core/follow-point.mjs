import { follow } from './follow.mjs';

/**
 * 🐾 הולך אחרי — על נקודה: בכל צעד הנקודה מתקרבת חלק קבוע מהדרך אל נקודת-המטרה, ב-x וב-y באותו צעד.
 * הליבה בלי עולם של הכדור בדף ההרשמה שנגרר אחרי העכבר (src/lib/three-scene.ts:257–258):
 *   `tg.x += (mo.x - tg.x) * 0.05; tg.y += (mo.y - tg.y) * 0.05;` — אותו צעד-הליכה-אחרי, פעם על x ופעם על y.
 * כאן: אותו דבר בדיוק, דרך ליבת «הולך אחרי» (catalog/core/follow.mjs) — פעם לכל ציר; `pullPct` = ה-0.05 (באחוזים).
 * טהור: צעד אחד; הלולאה אצל הקורא.
 * @param {{target: {x: number, y: number}, pullPct: number}} spec
 * @param {{x: number, y: number}} current
 * @returns {{x: number, y: number}}
 */
export function followPoint(spec, current) {
  const t = spec?.target ?? {};
  const pull = spec?.pullPct;
  return { x: follow({ target: t.x, pullPct: pull }, current?.x), y: follow({ target: t.y, pullPct: pull }, current?.y) };
}
