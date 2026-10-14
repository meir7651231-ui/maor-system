/**
 * 🔬 הצד השני של ההשוואה (PRODUCT, 14.10.2026) — node בלבד.
 *
 * אותו מניפסט, אבל כל צורך רץ **כמו שהמכונה הוכיחה אותו**: חלק בודד — בארגז-החול של קורא-ההתנהגות (loadRunners +
 * callerFor, מהקוד המקורי שנארז בזיכרון); שילוב — דרך המתכון השמור (run-combo.mjs › comboFunction).
 * הבדיקה (product-distribution.test) משווה: מה שהחבילה הסטטית מחזירה = מה שהחלק המוכח מחזיר, על אותם קלטים.
 */
import path from 'node:path';
import { loadIndex, loadParts, loadRecipes } from '../combiner/load.mjs';
import { loadRunners, partByHome, SEED } from '../combiner/combine.mjs';
import { comboFunction } from '../combiner/run-combo.mjs';
import { callerFor } from '../lib/sandbox.mjs';

/** {מזהה-צורך: פונקציה} — כל אחת רצה בארגז-החול (שגיאה ⇒ זורקת, כמו בזמן-הריצה). */
export async function provenFunctions(assembly) {
  const raw = new Map(loadParts().map((p) => [p.id, p]));
  const ix = loadIndex({ recipes: loadRecipes().filter((r) => !r.combo) });
  const singles = assembly.needs.filter((n) => n.form === 'single' || n.form === 'on');
  const parts = [...new Set(singles.map((n) => partByHome(ix, n.steps[0].id)))];
  if (parts.some((p) => !p)) throw new Error('חלק חסר באינדקס');
  const runners = await loadRunners(parts, raw);
  const out = {};
  for (const n of assembly.needs) {
    if (!n.steps.length) continue;
    if (n.combo) { out[n.id] = await comboFunction(path.basename(n.combo.recipe)); continue; }
    const R = runners.get(partByHome(ix, n.steps[0].id).id);
    if (!R) throw new Error('החלק לא נטען להרצה: ' + n.steps[0].id);
    const c = callerFor(R.ctx, R.fn, SEED, R.self);
    out[n.id] = (...args) => {
      const r = c(args);
      if ('err' in r) throw new Error(r.err);
      if (r.async) throw new Error('אסינכרוני');
      return r.v;
    };
  }
  return out;
}

/** כלי-המדידה (PRODUCT-V2): {as: פונקציה} — כל אחד החלק המוכח עצמו, בארגז-החול (כמו צורך של חלק בודד). */
export async function provenExtras(assembly) {
  const raw = new Map(loadParts().map((p) => [p.id, p]));
  const ix = loadIndex({ recipes: loadRecipes().filter((r) => !r.combo) });
  const xs = assembly.extras || [];
  const parts = xs.map((x) => partByHome(ix, x.id));
  if (parts.some((p) => !p)) throw new Error('כלי-מדידה חסר באינדקס');
  const runners = await loadRunners([...new Set(parts)], raw);
  const out = {};
  xs.forEach((x, k) => {
    const R = runners.get(parts[k].id);
    if (!R) throw new Error('כלי-המדידה לא נטען להרצה: ' + x.id);
    const c = callerFor(R.ctx, R.fn, SEED, R.self);
    out[x.as] = (...args) => { const r = c(args); if ('err' in r) throw new Error(r.err); if (r.async) throw new Error('אסינכרוני'); return r.v; };
  });
  return out;
}
