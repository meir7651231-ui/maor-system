#!/usr/bin/env node
/**
 * 🧲 המצרף · בונה את הנתונים של המעבדה + בקשות-הבנייה (COMBINER, 14.10.2026).
 *   node catalog/combiner/build.mjs          # כותב lab-data.json + missing/*.json
 *   node catalog/combiner/build.mjs --check  # יציאה 1 אם לא מעודכן
 * lab-data.json = האינדקס המתויג והמאוחד (בלי קוד), ההוכחות, המטרות והמתכונים — מה שהדף צריך כדי להרכיב בדפדפן.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { assemble, KINDS, PROJECTS } from './core.mjs';
import { VERBS, RECIPE_VERB } from './verbs.mjs';
import { HERE, loadGoals, loadIndex, loadProofs, loadRecipes, loadBehavior } from './load.mjs';

export function buildAll() {
  const recipes = loadRecipes();
  const ix = loadIndex({ recipes });
  const goals = loadGoals();
  const proofs = loadProofs();
  // רק חלקים עם פועל משתתפים בחיפוש (ליבה, מזין או מסיים) — השאר לא נשלחים לדף
  const slim = ix.parts.filter((p) => p.verbs.length).map((p) => {
    const { does: _d, labeledBy: _l, ...rest } = p;
    if (!rest.proof) delete rest.proof;
    return rest;
  });
  const lab = {
    about: 'נבנה ע״י catalog/combiner/build.mjs — לא לערוך ביד',
    labeledBy: loadBehavior() ? 'behavior' : 'static',
    verbs: VERBS.map((v) => ({ id: v.id, he: v.he, plain: v.plain, takes: v.takes || [], staticOnly: !!v.staticOnly })),
    recipeVerb: RECIPE_VERB,
    kinds: KINDS,
    projects: PROJECTS,
    goals,
    recipes,
    flows: proofs.flows,
    parts: slim,
  };
  const missing = {};
  for (const g of goals) for (const m of assemble(g, ix).missing) missing[m.goal + '.' + m.need + '.json'] = JSON.stringify(m, null, 1) + '\n';
  return { lab: JSON.stringify(lab) + '\n', missing };
}

const MISSING_DIR = join(HERE, 'missing');
const LAB = join(HERE, 'lab-data.json');

if (process.argv[1] && process.argv[1].endsWith('build.mjs')) {
  const { lab, missing } = buildAll();
  const cur = existsSync(MISSING_DIR) ? readdirSync(MISSING_DIR).filter((f) => f.endsWith('.json')).sort() : [];
  if (process.argv.includes('--check')) {
    const stale =
      (existsSync(LAB) ? readFileSync(LAB, 'utf8') : '') !== lab ||
      JSON.stringify(cur) !== JSON.stringify(Object.keys(missing).sort()) ||
      cur.some((f) => readFileSync(join(MISSING_DIR, f), 'utf8') !== missing[f]);
    if (stale) {
      console.error('lab-data.json / missing/ לא מעודכנים — הריצו node catalog/combiner/build.mjs');
      process.exit(1);
    }
    process.exit(0);
  }
  writeFileSync(LAB, lab);
  mkdirSync(MISSING_DIR, { recursive: true });
  for (const f of cur) if (!missing[f]) unlinkSync(join(MISSING_DIR, f));
  for (const [f, t] of Object.entries(missing)) writeFileSync(join(MISSING_DIR, f), t);
  console.log('🧲 lab-data.json (' + Math.round(lab.length / 1024) + 'KB) · ' + Object.keys(missing).length + ' בקשות-בנייה');
}
