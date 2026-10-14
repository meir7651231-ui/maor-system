#!/usr/bin/env node
/**
 * 🧲 המצרף · שורת-פקודה (COMBINER, 14.10.2026).
 *   node catalog/combiner/cli.mjs "חמנייה"            # טבלה
 *   node catalog/combiner/cli.mjs "חמנייה" --json     # JSON
 *   node catalog/combiner/cli.mjs --random [seed]     # מילה אקראית מהמילון (זרע = דטרמיניסטי)
 *   node catalog/combiner/cli.mjs "חמנייה" --save     # שומר מתכון ב-catalog/recipes/ (נהיה חלק חדש)
 *   node catalog/combiner/cli.mjs "חמנייה" --dig      # כותב בקשות-חפירה ב-catalog/combiner/dig/
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { assemble, askChips, findGoal, pickWord, recipeFrom, kindHe, actionOf, whereLine, STATUS_HE, STATUS_ORDER, PROJECTS, VERB_HE } from './core.mjs';
import { CATALOG, HERE, loadGoals, loadIndex } from './load.mjs';

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
  console.error('שימוש: node catalog/combiner/cli.mjs "<מילה>" [--json] [--save] [--dig] | --random [seed]');
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
if (flag('--dig')) writeDig(a);

if (JSON_OUT) {
  console.log(JSON.stringify(a, null, 1));
  process.exit(0);
}

const proofMark = (s) => (s.proof === 'proven' ? '✅ מוכח בהרצה · ' + s.cases + ' קלטים' : s.proof === 'example' ? '☑️ נבדק על דוגמה' : '· מהשם בלבד');
console.log('\n🧲 «' + goal.word + '» — ' + goal.title + '\n');
console.log('מה יצא: ' + a.outcome + '\n');
for (const n of a.needs) {
  const head = (n.need.group ? n.need.group + ' › ' : '') + n.need.behavior;
  console.log(STATUS_HE[n.status] + ' │ ' + head + '   [' + VERB_HE(n.need.verb) + ' · ' + kindHe(n.need.material) + ']');
  if (n.chain) {
    n.chain.steps.forEach((s, i) => {
      console.log('    ' + (i ? '→ ' : '  ') + s.action.he + (s.action.plain ? ' — ' + s.action.plain : '') + '   (' + proofMark(s) + (s.flow?.status === 'proven' ? ' · זרימה ✅' : '') + ')');
      console.log('        ' + whereLine(s.where));
    });
    if (n.groupFlow) console.log('    ⟵ זרימה מ«' + n.groupFlow.from + '» ' + (n.groupFlow.status === 'proven' ? '✅ ' + n.groupFlow.cases : '✗'));
  } else {
    const act = actionOf(n.need.verb);
    if (act.plain) console.log('    ' + act.he + ' — ' + act.plain);
    for (const pl of n.places) console.log('    ⛏️ ' + pl.project + ' · ' + pl.name + ' · ' + pl.file + (pl.lines ? ':' + pl.lines : '') + (pl.inside ? ' (בתוך: ' + pl.inside + ')' : '') + (pl.action ? ' · ' + pl.action + ' · ' + pl.proof : '') + ' — ' + pl.why);
  }
}
console.log('\nפרויקטים: ' + a.projects.map((s) => PROJECTS[s]?.he || s).join(', '));
console.log(STATUS_ORDER.map((s) => STATUS_HE[s] + ': ' + a.counts[s]).join(' · '));

function writeDig(asm) {
  const dir = join(HERE, 'dig');
  mkdirSync(dir, { recursive: true });
  for (const m of asm.dig) writeFileSync(join(dir, m.goal + '.' + m.need + '.json'), JSON.stringify(m, null, 1) + '\n');
}
