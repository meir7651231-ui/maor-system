/**
 * ▶️ מריץ שילוב שמור (MACHINE-V2, 14.10.2026) — מתכון `catalog/recipes/combo-*.json` ⇒ פונקציה רגילה.
 * כל צעד רץ בארגז-החול מהקוד המקורי (אותם חלקים, אותם קבצים שהמכונה הוכיחה) — בלי להעתיק שורת-חישוב אחת.
 *   const heading = await comboFunction('combo-sun-heading-number.json');
 *   heading({ lat: 31.778, lon: 35.235 }, 300, '2026-10-14')  // ⇒ 109.9 (מזרח)
 */
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG, loadIndex, loadParts, loadRecipes } from './load.mjs';
import { loadRunners, composeGraph, composeChain, compose, partByHome, SEED } from './combine.mjs';
import { VERB_BY_ID as LAW_VERBS } from '../lib/verbs.mjs';

export async function comboFunction(file) {
  const rec = JSON.parse(fs.readFileSync(path.join(CATALOG, 'recipes', file), 'utf8'));
  const c = rec.combo;
  const raw = new Map(loadParts().map((p) => [p.id, p]));
  const ix = loadIndex({ recipes: loadRecipes().filter((r) => !r.combo) });
  const ids = c.form === 'graph' ? c.graph.nodes.map((n) => n.part) : c.steps;
  const parts = ids.map((id) => partByHome(ix, id));
  if (parts.some((p) => !p)) throw new Error('חלק חסר באינדקס: ' + ids[parts.indexOf(null)]);
  const runners = await loadRunners([...new Set(parts)], raw);
  const Rs = parts.map((p) => runners.get(p.id));
  if (Rs.some((R) => !R)) throw new Error('חלק לא נטען להרצה');
  let composed;
  if (c.form === 'graph') {
    const ref = LAW_VERBS.get(c.verb).ref.sig;
    composed = composeGraph(c.graph, Rs, SEED, ref.map((t, k) => ({ ...t, name: c.graph.inputs[k] })));
  } else composed = c.form === 'pair' ? compose('pair', Rs[0], Rs[1], SEED, c.at ?? 0) : composeChain(Rs, SEED);
  return (...args) => {
    const r = composed.call(args);
    if ('err' in r) throw new Error(r.err);
    return r.v;
  };
}
