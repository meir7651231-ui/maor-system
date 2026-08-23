#!/usr/bin/env node
/** מחצב · כפילויות ברזולוציית-הפירוק-המלא: גופי-פונקציה זהים, שמות-כפולים,
 *  regex זהים, ועיצוב-מולחם שכבר יש לו אטום בפלטה (מועמד-חיווט-מיידי). */
import fs from 'node:fs';
import crypto from 'node:crypto';
const R = new URL('./registry/', import.meta.url).pathname;
const load = f => { try { return JSON.parse(fs.readFileSync(R + f)); } catch { return []; } };
const roots = Object.fromEntries(fs.readdirSync(R).filter(f=>f.startsWith('census-')).map(f=>{const c=JSON.parse(fs.readFileSync(R+f));return [c.repo,c.root];}));
const findings = { bodyTwins: [], nameTwins: [], regexTwins: [], styleRewire: [] };

/* 1) גופי-פונקציה זהים (נרמול: בלי רווחים/הערות) — כפילות אמיתית ברמת-הקוד */
const byHash = new Map(), byName = new Map();
for (const repo of ['maor', 'buildsmart']) {
  for (const a of load(`atoms-L6b-${repo}.json`)) {
    const [file, range] = [a.source.replace(/^[^/]+\//, '').replace(/:\d+-\d+$/, ''), a.source.match(/:(\d+)-(\d+)$/)];
    if (!range) continue;
    let txt; try { txt = fs.readFileSync(`${roots[repo]}/${file}`, 'utf8'); } catch { continue; }
    const body = txt.split('\n').slice(+range[1] - 1, +range[2]).join('\n')
      .replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');
    if (body.length < 60) continue; // גוף-זעיר — רעש
    const h = crypto.createHash('sha1').update(body).digest('hex').slice(0, 12);
    byHash.set(h, (byHash.get(h) || []).concat(a.id));
    byName.set(a.name, (byName.get(a.name) || []).concat(a.id));
  }
}
for (const [h, ids] of byHash.entries()) if (ids.length >= 2) findings.bodyTwins.push({ hash: h, members: ids });
for (const [n, ids] of byName.entries()) {
  const files = new Set(ids.map(i => i.split('#')[0]));
  if (files.size >= 2) findings.nameTwins.push({ name: n, members: ids.slice(0, 6), count: ids.length });
}

/* 2) regex זהים בכמה מקומות */
const byRe = new Map();
for (const repo of ['maor', 'buildsmart'])
  for (const a of load(`atoms-L12-${repo}.json`)) byRe.set(a.pattern, (byRe.get(a.pattern) || []).concat(a.id));
for (const [p, ids] of byRe.entries()) if (ids.length >= 3) findings.regexTwins.push({ pattern: p.slice(0, 50), count: ids.length });

/* 3) עיצוב-מולחם שערכו כבר קיים בפלטה — חיווט-מיידי במקום ערך-פרטי */
const pigments = new Set();
for (const a of load('atoms-L0-maor.json')) for (const v of a.values) pigments.add(v.value.toLowerCase());
for (const a of load('atoms-L0b-maor.json'))
  if (pigments.has(String(a.value).toLowerCase()))
    findings.styleRewire.push({ style: a.prop + ':' + a.value, count: a.count });

fs.writeFileSync(R + 'dupdeep.json', JSON.stringify(findings, null, 1));
const bt = findings.bodyTwins.reduce((s, g) => s + g.members.length, 0);
let md = `# 🔍 מחצב — כפילויות ברזולוציית-הפירוק-המלא\n\n`;
md += `## 1. גופי-פונקציה זהים לחלוטין — ${findings.bodyTwins.length} קבוצות (${bt} פונקציות)\n| חברים |\n|---|\n`;
findings.bodyTwins.slice(0, 15).forEach(g => md += `| ${g.members.map(m => m.replace(/^L6b:/, '')).join(' ↔ ')} |\n`);
md += `\n## 2. שם-זהה בקבצים שונים — ${findings.nameTwins.length} שמות\n| שם | מופעים |\n|---|---|\n`;
findings.nameTwins.sort((a, b) => b.count - a.count).slice(0, 15).forEach(g => md += `| ${g.name} | ${g.count} |\n`);
md += `\n## 3. regex זהה ≥3 מקומות — ${findings.regexTwins.length}\n| תבנית | מופעים |\n|---|---|\n`;
findings.regexTwins.sort((a, b) => b.count - a.count).slice(0, 10).forEach(g => md += `| \`${g.pattern}\` | ${g.count} |\n`);
md += `\n## 4. עיצוב-מולחם שכבר יש לו פיגמנט בפלטה — ${findings.styleRewire.length} (חיווט-מיידי!)\n| style | מופעים |\n|---|---|\n`;
findings.styleRewire.sort((a, b) => b.count - a.count).slice(0, 10).forEach(g => md += `| ${g.style} | ${g.count} |\n`);
fs.writeFileSync(new URL('./DUPDEEP-REPORT.md', import.meta.url), md);
console.log(`עומק: ${findings.bodyTwins.length} קבוצות גוף-זהה (${bt} פונקציות) · ${findings.nameTwins.length} שמות-כפולים · ${findings.regexTwins.length} regex-כפולים · ${findings.styleRewire.length} עיצובים-לחיווט-מיידי`);
