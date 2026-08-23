#!/usr/bin/env node
/** מחצב · מחלץ L8 — אטום פר-מסמך-ידע: סוג, תאריך, כותרת, גודל (פילוסופיית kb_engine). */
import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync(new URL(`../registry/census-${process.argv[2]}.json`, import.meta.url)));
const atoms = [];
for (const f of census.files.filter(f => f.domain === 'knowledge' && f.path.endsWith('.md'))) {
  let head = ''; try { head = fs.readFileSync(`${census.root}/${f.path}`, 'utf8').slice(0, 400); } catch { continue; }
  const base = f.path.split('/').pop();
  const type = (base.match(/^(CLOSED|BUILD-ORDER|RUNBOOK|ANALYSIS|ROADMAP|INSP|HANDOFF|NORTH-STAR|ATOMS|SALES|LEGACY|INVENTORY|VISION|PROTOCOL|SOLA|TELEPHONY|README|CATALOG|WIRING|PARITY|LAUNCH|AGENT|EDITOR)/i) || ['other'])[0].toUpperCase();
  atoms.push({ id: `L8:${census.repo}:${f.path}`, level: 'L8-knowledge', name: base, type,
    date: (base.match(/20\d\d-\d\d-\d\d/) || [null])[0], lines: f.lines,
    title: (head.match(/^#\s*(.+)$/m) || ['',''])[1].slice(0, 80), source: `${census.repo}/${f.path}` });
}
fs.writeFileSync(new URL(`../registry/atoms-L8-${census.repo}.json`, import.meta.url), JSON.stringify(atoms, null, 1));
const t = {}; atoms.forEach(a => t[a.type] = (t[a.type]||0)+1);
console.log(`L8 ${census.repo}: ${atoms.length} מסמכי-ידע —`, JSON.stringify(Object.fromEntries(Object.entries(t).sort((a,b)=>b[1]-a[1]).slice(0,6))));
