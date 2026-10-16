#!/usr/bin/env node
/**
 * ⚖️ RECIPES2 · חפיפת מבחן ג׳ (הערת-מנהל 16.10.2026) — לכל מטרה ב-ג׳: האם היא כבר הייתה (לפי התנהגות, לא לפי שם)
 * באחד המבחנים שנפתחו — א׳ (hidden/targets-hidden.mjs) · ב׳ (hidden/b/targets-b.mjs) · הציבורי של SP-FAIR (targets.mjs).
 *
 * אותה חתימה ⇒ 600 קלטים אקראיים (catalog/grow/lib.mjs › extraSamples, זרע קבוע) + סט-הקלטים הקבוע (samplesOf) +
 * קלטי-הלחץ (stressSamples): השוואת פלטים (sameOut — 12 ספרות).
 *   · זהה          — אותו פלט בכל הקלטים (גם null מול null).
 *   · זהה-חוץ-מקצוות — אף פעם לא שונות כששתיהן מוגדרות; שונות רק בקלטים שבהם אחת מחזירה null (רשימה ריקה, חלון
 *                     רחב מהרשימה…), ושוות בלפחות חצי מכל הקלטים. (ניסיון ראשון — "עד 10% קצוות" — פספס את windowSums
 *                     של ב׳: זהה בכל מקום מוגדר, שונה ב-29% מהקלטים שבהם אחת מהן לא מוגדרת.)
 *   · חדשה          — אחרת.
 * דטרמיניסטי. הפלט: hidden/c/overlap.json. לא חלק מהמנוע (חסום לו כמו כל hidden/).
 *
 *   node catalog/spfair/overlap.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as L from '../grow/lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const imp = async (f) => (await import(pathToFileURL(path.join(HERE, f)).href)).TARGETS;
const SUITES = { 'א׳': await imp('hidden/targets-hidden.mjs'), 'ב׳': await imp('hidden/b/targets-b.mjs'), 'ציבורי': await imp('targets.mjs') };
const C = await imp('hidden/c/targets-c.mjs');

const safe = (f, a) => { try { const v = f(...a); return v === undefined || (typeof v === 'number' && !Number.isFinite(v)) ? null : v; } catch { return null; } };
const inputsOf = (sig) => [...L.samplesOf(sig), ...L.stressSamples(sig), ...L.extraSamples(sig, 600, 0x0c0c)];

export function classify(T, others) {
  const sig = T.sig.split('>')[0].split(',');
  const I = inputsOf(sig); const want = I.map((a) => safe(T.f, a));
  let best = { kind: 'חדשה' };
  for (const [suite, O] of others) for (const U of O) {
    if (U.sig !== T.sig) continue;
    let same = 0; let edge = 0;
    for (let k = 0; k < I.length; k++) {
      const u = safe(U.f, I[k]);
      if (L.sameOut(u, want[k])) { same++; continue; }
      if (u === null || want[k] === null) edge++;
    }
    const n = I.length;
    const kind = same === n ? 'זהה' : same + edge === n && same >= 0.5 * n ? 'זהה-חוץ-מקצוות' : null;
    if (!kind) continue;
    const rank = kind === 'זהה' ? 2 : 1;
    if (rank > (best.kind === 'זהה' ? 2 : best.kind === 'חדשה' ? 0 : 1)) best = { kind, suite, match: U.id, differOn: n - same };
  }
  return best;
}

const rows = C.map((T) => ({ id: T.id, sig: T.sig, ...classify(T, Object.entries(SUITES)) }));
const count = (k) => rows.filter((r) => r.kind === k).length;
const out = { about: 'RECIPES2 · חפיפת מבחן ג׳ מול א׳/ב׳/הציבורי — לפי התנהגות (overlap.mjs). לא לערוך ביד', inputsPerSig: '|samplesOf| + 12 לחץ + 600 אקראיים', total: rows.length, same: count('זהה'), sameButEdges: count('זהה-חוץ-מקצוות'), fresh: count('חדשה'), rows };
const text = JSON.stringify(out, null, 1) + '\n';
const file = path.join(HERE, 'hidden/c/overlap.json');
if (process.argv.includes('--check')) { if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) { console.error('✗ overlap.json לא זהה להרצה חוזרת'); process.exit(1); } console.log('✓ overlap: אותם בתים'); }
else { fs.writeFileSync(file, text); console.log(`ג׳: ${out.total} · זהות ${out.same} · זהות-חוץ-מקצוות ${out.sameButEdges} · חדשות ${out.fresh}`); }
