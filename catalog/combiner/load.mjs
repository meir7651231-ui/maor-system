/**
 * 📂 המצרף · טוען מהדיסק (node בלבד): כל המקורות, ההוכחות, תוויות קורא-ההתנהגות (אם התמזג), המתכונים והמטרות.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, normGoal } from './core.mjs';
import { labelsFromBehavior } from './verbs.mjs';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const CATALOG = resolve(HERE, '..');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const jsonFiles = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => join(dir, f)) : []);

export function loadParts() {
  return jsonFiles(join(CATALOG, 'sources')).flatMap((f) => readJson(f).parts || []);
}
export function loadProofs() {
  const p = join(HERE, 'proofs.json');
  return existsSync(p) ? readJson(p) : { parts: {}, flows: {} };
}
/** קורא-ההתנהגות: `catalog/behavior/*.json`. חסר ⇒ null (התיוג הסטטי). */
export function loadBehavior() {
  const files = jsonFiles(join(CATALOG, 'behavior'));
  if (!files.length) return null;
  const m = labelsFromBehavior(files.map(readJson));
  return m.size ? m : null;
}
export function loadRecipes() {
  return jsonFiles(join(CATALOG, 'recipes')).map(readJson);
}
/** מילון-המטרות (`catalog/goals/*.json`) קודם, ואז ה-fixtures למילים שאין בו. */
export function loadGoals() {
  const dict = jsonFiles(join(CATALOG, 'goals')).flatMap((f) => {
    const d = readJson(f);
    return Array.isArray(d) ? d : Array.isArray(d.goals) ? d.goals : [d];
  });
  const fixtures = readJson(join(HERE, 'fixtures', 'goals.json')).goals;
  const seen = new Set();
  const out = [];
  for (const [i, g] of [...dict, ...fixtures].entries()) {
    const n = normGoal(g, i);
    if (!n.word || !n.needs.length || seen.has(n.word)) continue;
    seen.add(n.word);
    out.push(n);
  }
  return out;
}
export function loadIndex(opts = {}) {
  return buildIndex(loadParts(), { proofs: loadProofs(), behavior: loadBehavior(), recipes: opts.recipes ?? loadRecipes() });
}
