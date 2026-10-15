/**
 * ▶️ מריץ שילוב שמנוע-השרטוטים מצא (`catalog/blueprints/found/*.json`) ⇒ פונקציה רגילה — כמו run-combo.mjs של מכונת-השילוב:
 * כל צומת רץ בארגז-החול מהקוד המקורי (אותם חלקים), בלי להעתיק שורת-חישוב. (לבדיקות ולהדגמה — לא חלק מהחיפוש.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex } from '../combiner/core.mjs';
import { loadParts, loadProofs, loadBehavior, loadLeads } from '../combiner/load.mjs';
import { loadRunners, composeGraph, partByHome, SEED } from '../combiner/combine.mjs';
import { graphNodes } from '../combiner/graph.mjs';
import { VERB_BY_ID as LAW_VERBS } from '../lib/verbs.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let IX = null;
const world = () => { if (!IX) { const parts = loadParts(); IX = { raw: new Map(parts.map((p) => [p.id, p])), ix: buildIndex(parts, { proofs: loadProofs(), behavior: loadBehavior(), recipes: [], leads: loadLeads() }) }; } return IX; };

/** רשומת-שילוב (combo עם graph) ⇒ פונקציה. */
export async function graphFunction(combo, seed = SEED) {
  const { ix, raw } = world();
  const parts = graphNodes(combo.graph).map((n) => partByHome(ix, n.part));
  if (parts.some((p) => !p)) throw new Error('חלק לא נמצא באינדקס');
  const runners = await loadRunners([...new Set(parts)], raw);
  const Rs = parts.map((p) => runners.get(p.id));
  if (Rs.some((R) => !R)) throw new Error('חלק לא נטען להרצה');
  const sig = combo.sig || LAW_VERBS.get(combo.verb).ref.sig;
  const composed = composeGraph(combo.graph, Rs, seed, sig.map((t, k) => ({ ...t, name: combo.graph.inputs[k] })));
  return (...args) => { const r = composed.call(args); if ('err' in r) throw new Error(r.err); return r.v; };
}
export async function foundFunction(file) {
  return graphFunction(JSON.parse(fs.readFileSync(path.join(HERE, 'found', file), 'utf8')).combo);
}
