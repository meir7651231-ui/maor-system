#!/usr/bin/env node
/** מחצב · שלב 2 — זיקוק: איתור מנועים-תאומים בין ריפו + ריכוז מחרוזות-קשיחות. */
import fs from 'node:fs';
const R = new URL('./registry/', import.meta.url).pathname;
const load = f => { try { return JSON.parse(fs.readFileSync(R + f)); } catch { return []; } };

// 1) מנועים-תאומים: חפיפת שמות-יצוא בין maor ל-buildsmart
const eng = { maor: load('atoms-L6-maor.json'), buildsmart: load('atoms-L6-buildsmart.json') };
const twins = [];
for (const a of eng.maor) for (const b of eng.buildsmart) {
  const ea = new Set(a.exports.map(x => x.toLowerCase())), shared = b.exports.filter(x => ea.has(x.toLowerCase()));
  const nameSim = a.name.replace(/\.(ts|dart)$/,'').toLowerCase() === b.name.replace(/\.(ts|dart)$/,'').toLowerCase();
  if (shared.length >= 3 || (nameSim && shared.length >= 1) || (nameSim && a.exports.length && b.exports.length))
    twins.push({ maor: a.source, buildsmart: b.source, sharedExports: shared.slice(0, 8), nameSim });
}
// 2) מחרוזות-קשיחות במאור — ריכוז לפי קובץ
const hard = load('atoms-L5b-maor.json').filter(a => !a.viaTermOf);
const byFile = {};
hard.forEach(a => { const f = a.source.split(':')[0]; byFile[f] = (byFile[f] || 0) + 1; });
const topFiles = Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 25);
// 3) טוקנים-כפולים סמנטית: אותו ערך-צבע בכמה שמות (מועמדי-איחוד)
const toks = load('atoms-L0-maor.json').filter(a => a.kind === 'color');
const byVal = {};
toks.forEach(a => a.values.forEach(v => { if (/^#|rgb|hsl/.test(v.value)) (byVal[v.value] = byVal[v.value] || new Set()).add(a.name); }));
const dupColors = Object.entries(byVal).filter(([, s]) => s.size >= 3).map(([v, s]) => [v, [...s]]).slice(0, 15);

let md = `# 🧪 מחצב — דוח-זיקוק ראשון\n\n## מנועים-תאומים (מועמדים לאטום קנוני אחד)\n| maor | buildsmart | יצוא משותף |\n|---|---|---|\n`;
twins.slice(0, 30).forEach(t => md += `| ${t.maor.split('/').pop()} | ${t.buildsmart.split('/').pop()} | ${t.sharedExports.join(', ') || '(שם-זהה)'} |\n`);
md += `\nסה"כ ${twins.length} זוגות-תאומים.\n\n## מחרוזות-קשיחות במאור (עוקפות termOf) — ‏${hard.length} · ‏25 הקבצים המובילים\n| קובץ | מחרוזות |\n|---|---|\n`;
topFiles.forEach(([f, n]) => md += `| ${f.replace('maor/', '')} | ${n} |\n`);
md += `\n## צבעים-כפולים (אותו ערך ≥3 שמות — מועמדי-איחוד לטוקן אחד)\n| ערך | שמות |\n|---|---|\n`;
dupColors.forEach(([v, names]) => md += `| \`${v}\` | ${names.slice(0, 6).join(', ')}${names.length > 6 ? ` +${names.length-6}` : ''} |\n`);
fs.writeFileSync(new URL('./REFINE-REPORT.md', import.meta.url), md);
console.log(`זיקוק: ${twins.length} מנועים-תאומים · ${hard.length} מחרוזות-קשיחות · ${dupColors.length} ערכי-צבע כפולים ⇒ REFINE-REPORT.md`);
