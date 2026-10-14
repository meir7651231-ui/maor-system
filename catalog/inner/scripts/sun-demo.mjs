#!/usr/bin/env node
/**
 * ☀️ הדגמה (INNER, 14.10.2026): כיוון השמש בשמיים — מורכב **רק** מחלקים פנימיים שהורמו מתוך חישוב-הזריחה של אורביט
 * (telephony/lib/zmanim.mjs · solarEventUTCmin): `eqTime` (משוואת-הזמן) ו-`utc:step` (הנוסחה
 * "באיזו דקה השמש בזווית-שעה HA"). עם HA=0 היא נותנת את חצות-היום; זווית-השעה בכל רגע = (רגע − חצות-היום)/4 מעלות.
 * הכיוון (אזימוט) — בלי שורה גאומטרית חדשה (MACHINE-V2): השילוב המוכח `catalog/recipes/combo-sun-heading-number.json`
 * (זמני-היום ⇒ הכדור והסיבוב של היקום-3D ⇒ מרחק-המטבע ⇒ זווית-מיחס; עבר את כל חוקי «מכוון לפי השמש»). מריץ בארגז-החול של הקטלוג.
 *   node catalog/inner/scripts/sun-demo.mjs [YYYY-MM-DD]
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleFile, loadInSandbox } from '../../lib/sandbox.mjs';
import { comboFunction } from '../../combiner/run-combo.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const GEN = path.join(ROOT, 'catalog/inner/gen/orbit/telephony/lib/zmanim.mjs.mjs');
const JERUSALEM = { lat: 31.778, lon: 35.235, utcOffsetMin: 180 }; // שעון-קיץ ישראל (אוקטובר עד סוף החודש)

/** זווית-השעה וכיוון השמש בשלושה רגעים. מחזיר שורות {clock, ha, az, dir}. */
export async function sunDirections(iso = '2026-10-14', clocks = ['08:00', '12:00', '16:00'], at = JERUSALEM) {
  const { exports: z } = loadInSandbox(await bundleFile(GEN, { esm: true }));
  const [y, m, d] = iso.split('-').map(Number);
  const eqTime = z.inner$solarEventUTCmin$eqTime(y, m, d);
  const noonUtc = z.inner$solarEventUTCmin$utc$$step(at.lon, false, eqTime, 0); // HA = 0 ⇒ חצות-היום (UTC-דקות)
  const heading = await comboFunction('combo-sun-heading-number.json');
  return clocks.map((clock) => {
    const [hh, mm] = clock.split(':').map(Number);
    const ha = (hh * 60 + mm - at.utcOffsetMin - noonUtc) / 4; // מעלות: שלילי = לפני חצות-היום (מזרח), חיובי = אחרי (מערב)
    const az = heading({ lat: at.lat, lon: at.lon }, hh * 60 + mm - at.utcOffsetMin, iso); // השילוב — כל צעד הוא חלק מוכח
    const dir = az < 135 ? 'מזרח' : az <= 225 ? 'דרום' : 'מערב';
    return { clock, ha: Math.round(ha * 10) / 10, az: Math.round(az), dir };
  });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) await (await import('../lib/ensure-gen.mjs')).ensureGen({ sources: ['orbit'], quiet: true });
if (isMain) for (const r of await sunDirections(process.argv[2])) console.log(`${r.clock} · זווית-שעה ${r.ha > 0 ? '+' : ''}${r.ha}° · אזימוט ${r.az}° ⇒ ${r.dir}`);
