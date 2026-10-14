/**
 * 📂 המצרף · טוען מהדיסק (node בלבד): כל המקורות, ההוכחות, תוויות קורא-ההתנהגות, המתכונים, המטרות והמקומות-הידועים.
 * גנרי: כל קובץ ב-`catalog/sources/` וב-`catalog/behavior/` נטען — קבצים חדשים של הכורים נכנסים בלי שינוי-קוד.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, normGoal } from './core.mjs';
import { labelsFromBehavior, useAlphabet } from './verbs.mjs';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const CATALOG = resolve(HERE, '..');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const jsonFiles = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => join(dir, f)) : []);

/** כל `catalog/sources/*.json` — גם `core`, `core-b`, `inner-*` ומה שיבוא; כל קובץ עם `parts[]`. */
export function loadParts() {
  return jsonFiles(join(CATALOG, 'sources')).flatMap((f) => {
    const d = readJson(f);
    return Array.isArray(d) ? d : d.parts || [];
  });
}
/** מקומות ידועים בקוד (`leads.json`) — מוצגים תחת ⛏️ / 🔎. */
export function loadLeads() {
  const p = join(HERE, 'leads.json');
  return existsSync(p) ? readJson(p).leads || [] : [];
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
/**
 * המטרות: מילון-המטרות (`catalog/goals/<עולם>.json`) + ה-fixtures. מטרה של הבעלים (`owner: true` — החמנייה שהוא בדק ביד)
 * גוברת על המילון באותה מילה; שאר ה-fixtures רק משלימים מילים שאין במילון.
 */
export function loadGoals() {
  const dict = jsonFiles(join(CATALOG, 'goals'))
    .filter((f) => !f.endsWith('schema.json'))
    .flatMap((f) => {
      const d = readJson(f);
      return (Array.isArray(d) ? d : d.goals || []).map((g) => ({ ...g, world: d.world }));
    });
  const fixtures = readJson(join(HERE, 'fixtures', 'goals.json')).goals.map((g) => ({ ...g, world: g.world || 'בדיקה' }));
  const out = new Map();
  for (const g of fixtures.filter((x) => x.owner)) out.set(g.word, g);
  for (const g of dict) if (!out.has(g.word)) out.set(g.word, g);
  for (const g of fixtures) if (!out.has(g.word)) out.set(g.word, g);
  return [...out.values()].map(normGoal).filter((g) => g.word && g.needs.length);
}
/** האלפבית של קורא-ההתנהגות (`catalog/verbs.json`), אם קיים — נטען פעם אחת. */
export function loadAlphabet() {
  const p = join(CATALOG, 'verbs.json');
  if (!existsSync(p)) return null;
  const list = readJson(p).verbs;
  useAlphabet(list);
  return list;
}
loadAlphabet();
export function loadIndex(opts = {}) {
  return buildIndex(loadParts(), { proofs: loadProofs(), behavior: loadBehavior(), recipes: opts.recipes ?? loadRecipes(), leads: loadLeads() });
}
