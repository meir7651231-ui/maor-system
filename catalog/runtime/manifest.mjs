/**
 * 📜 הרכבה ⇒ מניפסט-ריצה (PRODUCT, 14.10.2026) — node בלבד.
 *
 * לוקח את מה שהמכונה הרכיבה למילה (assemble — אותה הרכבה שה-cli וה-lab מציגים) ומתרגם כל צעד לשלושה דברים:
 *   · איפה הקוד שרץ: הליבה (`catalog/core/*.mjs`), קובץ-המקור של אורביט (TS), או המודול הפנימי (`catalog/inner/gen/…`)
 *     — אותו בית שמכונת-השילוב מריצה (combine.mjs: homeOf);
 *   · כמה קלטים יש לו (arity — לחיבור שרשרת, כמו composeChain);
 *   · מאיפה הוא בא: פרויקט · קובץ:שורה (origins של הליבות; לחלק של אורביט — שורת ההגדרה בקובץ שלו).
 * שילוב (🧩) נושא את המתכון השמור (`catalog/recipes/combo-*.json`): הצורה, `at`, הגרף, וכמה חוקים עבר.
 */
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG, loadGoals, loadIndex, loadParts, loadRecipes } from '../combiner/load.mjs';
import { assemble, PROJECTS, provenAs, stepView } from '../combiner/core.mjs';
import { graphParts } from '../combiner/graph.mjs';

const ROOT = path.resolve(CATALOG, '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const REPO_HE = { 'maor-system': 'אורביט', buildsmart: 'בנייה חכמה', '-ai-chat-server': 'המחולל', 'yeshiva-engine': 'הישיבה', 'yoman-habina': 'יומן הבינה', '14kk': '14kk', mmmm: 'MMMM', MMMM: 'MMMM', 'qa-scanner': 'סורק QA' };
const repoHe = (r) => REPO_HE[String(r || '').replace(/^meir7651231-ui\//, '').replace(/@.*$/, '')] || r;
const RUN_CORE = new Set(['core', 'core-b', 'core-c']);

/** הבית שרץ (כמו combine.mjs › homeOf): ליבה · אורביט (TS/JS טהור) · פנימי עם מודול-gen. */
function runnableHome(p, raw) {
  for (const h of p.homes) {
    const r = raw.get(h.id);
    if (!r) continue;
    if (r.source.startsWith('inner-') && (r.tags || []).some((t) => t.startsWith('gen:'))) return r;
    if ((RUN_CORE.has(r.source) || r.source === 'orbit') && r.pure && /\.(ts|tsx|mjs|js)$/.test(r.path)) return r;
  }
  return null;
}

/** השורה שבה מוגדר הסמל בקובץ (1-based) — לחלק של אורביט: `function x` / `const x =`. */
function lineOf(file, name) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) return null;
  const lines = fs.readFileSync(abs, 'utf8').split('\n');
  const re = new RegExp('(function\\s+' + name + '\\b|\\bconst\\s+' + name + '\\s*=)');
  const k = lines.findIndex((l) => re.test(l));
  return k < 0 ? null : k + 1;
}

/** מקורות-המוצא עם שורה: ליבה ⇒ origins*.json (best ראשון); אורביט ⇒ הגדרת הסמל; פנימי ⇒ השורה בפונקציה-ההורה. */
function originsOf(r, role) {
  const pick = (list) => (list || []).slice().sort((a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0)).map((o) => ({ project: repoHe(o.repo) || PROJECTS[o.source]?.he || o.source, file: o.file, line: o.line, ...(o.best ? { best: true } : {}) }));
  if (r.source === 'core-c') return pick(readJson('catalog/core/origins-c.json')[r.symbol]);
  if (r.source === 'core-b') return pick(readJson('catalog/core/origins-b.json')[role]);
  if (r.source === 'core') return pick(readJson('catalog/core/origins.json').verbs[role]?.origins);
  const name = r.source.startsWith('inner-') ? r.symbol.split('.').pop() : r.symbol;
  // חלק פנימי: השורה שהפותח רשם (origins של המקור הפנימי) — שם-הערך (`sum:step`) אינו הגדרה שאפשר לחפש בקובץ
  const at = r.source.startsWith('inner-') ? (r.origins || []).find((o) => o.file === r.path && Number.isInteger(o.line)) : null;
  return [{ project: PROJECTS[r.source.replace(/^inner-/, '')]?.he || r.source, file: r.path, line: lineOf(r.path, name) ?? at?.line ?? null, best: true }];
}

/** צעד ⇒ מה שזמן-הריצה והחבילה צריכים. `module`+`export` = מה מייבאים; `key` = מזהה-החלק (מפתח בחבילה). */
function stepOf(s, ix, raw) {
  const p = ix.byId.get(s.id);
  const r = p && runnableHome(p, raw);
  if (!r) throw new Error('לצעד אין בית שרץ: ' + s.id);
  const gen = (r.tags || []).find((t) => t.startsWith('gen:'));
  const [module, exp] = gen ? gen.slice(4).split('#') : [r.path, r.symbol];
  return {
    id: s.id, key: s.id, name: s.name, role: s.role, roleHe: s.roleHe, project: s.project, inner: !!s.inner,
    proof: s.proof, cases: s.cases, laws: s.laws,
    arity: r.takes.length, module, export: exp, home: r.id,
    origins: originsOf(r, s.role),
  };
}

/** המתכון השמור של שילוב: לפי הפועל והחלקים (combo-<פועל>-<חומר>.json — החומר יכול להיות של צורך אחר באותו פועל). */
function comboRecipe(chain) {
  const ids = chain.steps.map((s) => s.id);
  const r = loadRecipes().find((x) => x.combo && x.combo.verb === chain.combo.verb && JSON.stringify(x.combo.form === 'graph' ? graphParts(x.combo.graph) : x.combo.steps) === JSON.stringify(ids));
  if (!r) throw new Error('אין מתכון-שילוב שמור ל-' + ids.join(' ⇒ '));
  return r;
}

const STATUS_HE = { proven: '✅ מוכח בהרצה', inner: '✅ מוכח — חלק פנימי', combo: '✅ מוכח — שילוב' };

/**
 * כלי-מדידה של המסך (PRODUCT-V2): חלק מוכח אחד, **שנבחר ביד** בשמו המלא ובתפקיד שהוא מוכח לו (סכום · הפרש · אחוז · הגדול-מבין)
 * — כדי שכל מספר במסך (ק״מ, חיסכון, אחוז-בזמן, עומס) ייצא מחלק מוכח עם "נמצא ב:", ולא מחשבון של הדף.
 * לא מוכח לתפקיד ⇒ שגיאה (לא נכנס לחבילה).
 */
function extraOf(x, ix, raw) {
  const p = ix.byId.get(x.part) || ix.parts.find((q) => q.homes.some((h) => h.id === x.part));
  if (!p) throw new Error('כלי-מדידה: החלק לא באינדקס — ' + x.part);
  if (!provenAs(p, x.role)) throw new Error('כלי-מדידה: ' + x.part + ' לא מוכח כ-' + x.role);
  return { as: x.key, says: x.says, ...stepOf(stepView(p, null, {}, x.role), ix, raw) };
}

/** המניפסט של מילה: {word, emoji, does, counts, needs:[{id, behavior, verb, material, status, form, steps, combo?}], extras?}. */
export function productManifest(word, extras = []) {
  const goal = loadGoals().find((g) => g.word === word);
  if (!goal) throw new Error('אין מילה כזו במילון: ' + word);
  const raw = new Map(loadParts().map((p) => [p.id, p]));
  const ix = loadIndex();
  const a = assemble(goal, ix);
  const needs = a.needs.map((n) => {
    const base = { id: n.need.id, behavior: n.need.behavior, verb: n.need.verb, verbHe: n.chain?.steps?.[0]?.roleHe ?? null, material: n.need.material, status: n.status, statusHe: STATUS_HE[n.status] || n.status };
    if (!n.chain) return { ...base, form: null, steps: [] };
    const steps = n.chain.steps.map((s) => stepOf(s, ix, raw));
    if (!n.chain.combo) {
      if (steps.length !== 1) throw new Error('שרשרת-מתאמים (טבעת ' + n.chain.ring + ') עוד לא נתמכת בזמן-הריצה: ' + n.need.behavior);
      return { ...base, verbHe: steps[0].roleHe, form: 'single', steps };
    }
    const rec = comboRecipe(n.chain);
    const c = rec.combo;
    return {
      ...base, verbHe: n.chain.combo.verbHe, form: c.form, steps,
      combo: { recipe: 'catalog/recipes/' + rec.id + '.json', verb: c.verb, form: c.form, holds: c.holds, laws: c.laws, line: n.chain.combo.line, ...(c.hint ? { hint: c.hint } : {}), ...(c.at !== undefined ? { at: c.at } : {}), ...(c.slot !== undefined ? { slot: c.slot, many: c.many } : {}), ...(c.graph ? { graph: c.graph } : {}) },
    };
  });
  const counts = { needs: needs.length, proven: needs.filter((n) => n.status === 'proven').length, inner: needs.filter((n) => n.status === 'inner').length, combo: needs.filter((n) => n.status === 'combo').length, open: needs.filter((n) => !n.steps.length).length };
  return { word: goal.word, emoji: goal.emoji, does: goal.does, world: goal.world, counts, needs, ...(extras.length ? { extras: extras.map((x) => extraOf(x, ix, raw)) } : {}) };
}
