#!/usr/bin/env node
/**
 * 🧲 המצרף · שורת-פקודה (COMBINER, 14.10.2026).
 *   node catalog/combiner/cli.mjs "חמנייה"            # טבלה
 *   node catalog/combiner/cli.mjs "חמנייה" --json     # JSON
 *   node catalog/combiner/cli.mjs --random [seed]     # מילה אקראית מהמילון (זרע = דטרמיניסטי)
 *   node catalog/combiner/cli.mjs "חמנייה" --save     # שומר מתכון ב-catalog/recipes/ (נהיה חלק חדש)
 *   node catalog/combiner/cli.mjs "חמנייה" --missing  # כותב בקשות-בנייה ב-catalog/combiner/missing/
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { assemble, askChips, findGoal, pickWord, recipeFrom, TIER_HE, kindHe } from './core.mjs';
import { CATALOG, HERE, loadGoals, loadIndex } from './load.mjs';
import { VERB_BY_ID, RECIPE_VERB } from './verbs.mjs';

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const JSON_OUT = flag('--json');
const goals = loadGoals();

let word = args.find((a) => !a.startsWith('--'));
if (flag('--random')) {
  const i = args.indexOf('--random');
  const seed = Number(args[i + 1]) || 1;
  word = pickWord(goals, seed).word;
  if (args[i + 1] && word === args[i + 1]) word = undefined;
}
if (!word) {
  console.error('שימוש: node catalog/combiner/cli.mjs "<מילה>" [--json] [--save] [--missing] | --random [seed]');
  process.exit(2);
}

const goal = findGoal(word, goals);
if (!goal) {
  const ask = askChips(word);
  if (JSON_OUT) console.log(JSON.stringify(ask, null, 1));
  else {
    console.log('❓ ' + ask.question);
    console.log('   פעלים: ' + ask.verbs.map((v) => v.he + ' (' + v.id + ')').join(' · '));
    console.log('   חומרים: ' + ask.materials.map((m) => m.he + ' (' + m.id + ')').join(' · '));
  }
  process.exit(0);
}

const ix = loadIndex();
const a = assemble(goal, ix);

if (flag('--save')) {
  const r = recipeFrom(a);
  mkdirSync(join(CATALOG, 'recipes'), { recursive: true });
  writeFileSync(join(CATALOG, 'recipes', r.id + '.json'), JSON.stringify(r, null, 1) + '\n');
}
if (flag('--missing')) writeMissing(a);

if (JSON_OUT) {
  console.log(JSON.stringify(a, null, 1));
  process.exit(0);
}

const proofMark = (s) => (s.proof === 'proven' ? '✅ מוכח · ' + s.cases + ' קלטים' : s.proof === 'example' ? '☑️ נבדק על דוגמה' : s.tier === 'runnable' ? '▶ ניתן להרצה' : '· סטטי');
console.log('\n🧲 «' + goal.word + '» — ' + goal.title + '\n');
console.log('מה יצא: ' + a.outcome + '\n');
const rows = [];
for (const n of a.needs) {
  const head = (n.need.group ? n.need.group + ' › ' : '') + n.need.behavior;
  const verb = VERB_BY_ID[n.need.verb]?.he || (n.need.verb === RECIPE_VERB.id ? RECIPE_VERB.he : n.need.verb);
  if (!n.chain) {
    rows.push(['❌', head, verb + ' · ' + kindHe(n.need.material), 'חסר — נשלח לבנייה']);
    continue;
  }
  const chain = n.chain.steps.map((s) => '[' + s.project + '] ' + s.name + ' (' + proofMark(s) + (s.flow?.status === 'proven' ? ' · זרימה ✅' : '') + ')').join(' → ');
  const gf = n.groupFlow ? ' ⟵ זרימה מ«' + n.groupFlow.from + '» ' + (n.groupFlow.status === 'proven' ? '✅ ' + n.groupFlow.cases : '✗') : '';
  rows.push(['טבעת ' + n.ring, head, verb + ' · ' + kindHe(n.need.material), chain + gf]);
}
for (const r of rows) console.log(r[0].padEnd(7) + ' │ ' + r[1] + '\n        │   ' + r[2] + ' ⇒ ' + r[3]);
console.log('\nפרויקטים: ' + a.projects.join(', ') + ' · דרגת השרשראות: ' + a.needs.filter((n) => n.chain).map((n) => TIER_HE[n.chain.tier]).join(' / '));
if (a.missing.length) console.log('\n🚧 חסר (' + a.missing.length + '): ' + a.missing.map((m) => m.behavior + ' [' + m.verb + ' · ' + m.material + ']').join(' · '));

function writeMissing(asm) {
  const dir = join(HERE, 'missing');
  mkdirSync(dir, { recursive: true });
  for (const m of asm.missing) writeFileSync(join(dir, m.goal + '.' + m.need + '.json'), JSON.stringify(m, null, 1) + '\n');
}
