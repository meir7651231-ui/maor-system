#!/usr/bin/env node
/** מחצב · המפעיל — פקודה אחת: מפקד ← מחלצים ← משטרה ← לוח-מצב. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const REPOS = [
  ['/home/user/maor-system', 'maor'],
  [process.env.BS_TIP || '/tmp/claude-0/-home-user/2d086046-4b60-52a1-9aee-58e2962b1958/scratchpad/bs-tip', 'buildsmart'],
  ['/home/user/yoman-habina', 'yoman'],
];
const run = (script, args) => execFileSync('node', [new URL(script, import.meta.url).pathname, ...args], { stdio: 'inherit' });
for (const [root, name] of REPOS) { if (fs.existsSync(root)) run('./census.mjs', [root, name]); }
for (const [, name] of REPOS) for (const x of ['tokens', 'flags', 'terms', 'engines', 'actions', 'strings', 'components', 'verticals', 'knowledge', 'functions', 'styles', 'consts', 'schema', 'icons', 'regexes']) { try { run(`./extract/${x}.mjs`, [name]); } catch {} }
run('./reconcile.mjs', []);
run('./wiring-check.mjs', []);
run('./contract-check.mjs', []);
try { run('./refine.mjs', []); } catch {}
try { run('./dedup.mjs', []); } catch {}
try { run('./dedup-deep.mjs', []); } catch {}
// לוח-מצב
const R = new URL('./registry/', import.meta.url).pathname;
let totalAtoms = 0, rows = [];
for (const f of fs.readdirSync(R).filter(f => f.startsWith('atoms-'))) {
  const a = JSON.parse(fs.readFileSync(R + f)); totalAtoms += a.length;
  rows.push(`| ${f.replace('atoms-','').replace('.json','')} | ${a.length} |`);
}
let census = '';
for (const f of fs.readdirSync(R).filter(f => f.startsWith('census-'))) {
  const c = JSON.parse(fs.readFileSync(R + f));
  census += `| ${c.repo} | ${c.totals.files.toLocaleString()} | ${c.totals.lines.toLocaleString()} | ${c.totals.orphans} |\n`;
}
fs.writeFileSync(new URL('./STATUS.md', import.meta.url),
`# 🏗️ מחצב — לוח-מצב\n_עדכון: ${process.env.MACHTZEV_DATE || 'ידני'}_\n\n## מפקד (שלב 0)\n| ריפו | קבצים | שורות | 🚨 יתומים |\n|---|---|---|---|\n${census}\n## אטומים שחולצו\n| שכבה·ריפו | אטומים |\n|---|---|\n${rows.join('\n')}\n| **סה"כ** | **${totalAtoms}** |\n\n## המחלצים הבאים בתור\nL5-strings (כל מחרוזת) → L2-actions (כל לחיצה) → L1-components → L3-screens (מניפסטים) → L6-engines → L7-verticals → זיקוק-כפילויות → הרכבה.\n`);
console.log('\n📊 לוח-המצב עודכן: machtzev/STATUS.md');
