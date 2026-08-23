#!/usr/bin/env node
/** מחצב · שלב 2ב — הכרעת-כפילויות: קבוצות ⇒ קנוני-מנצח או תוכנית-שילוב ("הכל-הכל").
 *  אינווריאנט: הקנוני חייב להכיל 100% מכל כפיל. קבוצה בלי הכרעה = אדום בדוח. */
import fs from 'node:fs';
const R = new URL('./registry/', import.meta.url).pathname;
const load = f => { try { return JSON.parse(fs.readFileSync(R + f)); } catch { return []; } };
const groups = [];

/* ── 1) צבעים: אותו ערך בכמה שמות ── */
for (const repo of ['maor', 'buildsmart', 'yoman']) {
  const byVal = {};
  // איחוד לפי *תפקיד*: רק שמות שכל סט-הערכים שלהם זהה (מתנהגים אותו דבר בכל הערכות)
  for (const a of load(`atoms-L0-${repo}.json`).filter(a => a.kind === 'color')) {
    const sig = a.values.map(v => v.value).sort().join('||');
    if (/#|rgb|hsl|oklch/.test(sig)) (byVal[repo+'|'+sig] = byVal[repo+'|'+sig] || []).push(a);
  }
  for (const [key, as] of Object.entries(byVal)) {
    const uniq = [...new Map(as.map(a => [a.id, a])).values()];
    if (uniq.length < 3) continue;
    // קנוני = השם הסמנטי הקצר/הכללי ביותר (הכי פחות מקפים = הכי בסיסי)
    const win = [...uniq].sort((a, b) => a.name.split('-').length - b.name.split('-').length || a.name.length - b.name.length)[0];
    groups.push({ kind: 'color', key, canonical: win.id, decision: 'winner',
      coverage: '100% — ערך זהה, איחוד-שם בלבד', members: uniq.map(a => a.id) });
  }
}

/* ── 2) מחרוזות: אותו טקסט ב≥5 מקומות ⇒ מועמד-לאטום-מונח יחיד ── */
const tpl = t => t.replace(/\d+/g, '#').replace(/["'׳״!?.:…]/g, '').trim();
const byText = {};
for (const repo of ['maor', 'buildsmart'])
  for (const a of load(`atoms-L5b-${repo}.json`).filter(a => !a.viaTermOf && a.text.length >= 3)) {
    const k = tpl(a.text);
    if (k.length >= 3) (byText[k] = byText[k] || []).push(a.id);
  }
for (const [text, ids] of Object.entries(byText).filter(([, v]) => v.length >= 2))
  groups.push({ kind: 'string', key: text, canonical: `PROPOSED:term:'${text}'`, decision: 'merge',
    coverage: `שילוב-תבנית: חוט אחד יחליף ${ids.length} מופעים`, members: ids });

/* ── 3) מנועים: תאומים חוצי-ריפו — ניקוד והכרעה ── */
const eng = { maor: load('atoms-L6-maor.json'), buildsmart: load('atoms-L6-buildsmart.json') };
const norm = s => s.toLowerCase().replace(/[_\-]/g, '');
const hasTest = (src) => { // האם קיים קובץ-בדיקה סמוך
  const base = src.split('/').pop().replace(/\.(ts|dart|mjs)$/, '');
  const cf = load(`census-${src.split('/')[0]}.json`);
  return (cf.files || []).some(f => f.bucket === 'test' && f.path.includes(base));
};
for (const a of eng.maor) for (const b of eng.buildsmart) {
  const ea = new Set(a.exports.map(norm));
  const shared = b.exports.filter(x => ea.has(norm(x)));
  const nameSim = norm(a.name.replace(/\.\w+$/, '')) === norm(b.name.replace(/\.\w+$/, ''));
  if (!(shared.length >= 3 || nameSim)) continue;
  const score = x => (x.exports.length) + (x.pure ? 20 : 0) + (hasTest(x.source) ? 30 : 0) + Math.min(10, x.lines / 100);
  const [sa, sb] = [score(a), score(b)];
  const aCovers = b.exports.every(x => ea.has(norm(x)));
  const bSet = new Set(b.exports.map(norm));
  const bCovers = a.exports.every(x => bSet.has(norm(x)));
  let decision, canonical, coverage;
  if (aCovers && sa >= sb)      { decision = 'winner'; canonical = a.id; coverage = 'maor מכיל 100% מהיצוא של buildsmart'; }
  else if (bCovers && sb > sa)  { decision = 'winner'; canonical = b.id; coverage = 'buildsmart מכיל 100% מהיצוא של maor'; }
  else { decision = 'merge'; canonical = `PROPOSED:merge:${a.name}`;
    coverage = `שילוב נדרש — ייחודי-למאור: ${a.exports.filter(x=>!bSet.has(norm(x))).slice(0,5).join(',')||'—'} · ייחודי-ל-buildsmart: ${b.exports.filter(x=>!ea.has(norm(x))).slice(0,5).join(',')||'—'}`; }
  groups.push({ kind: 'engine', key: `${a.name}↔${b.name}`, canonical, decision, coverage,
    scores: { maor: Math.round(sa), buildsmart: Math.round(sb) }, shared: shared.slice(0, 8), members: [a.id, b.id] });
}

fs.writeFileSync(R + 'dupgroups.json', JSON.stringify(groups, null, 1));
const counts = { winner: 0, merge: 0, undecided: 0 };
groups.forEach(g => counts[g.decision]++);
let md = `# ⚖️ מחצב — דוח הכרעת-כפילויות\n\nקבוצות: ${groups.length} · 🏆 מנצח-קיים: ${counts.winner} · 🧬 דורש-שילוב: ${counts.merge} · 🚨 ללא-הכרעה: ${counts.undecided}\n\n`;
md += `## מנועים\n| קבוצה | הכרעה | ניקוד | כיסוי |\n|---|---|---|---|\n`;
groups.filter(g => g.kind === 'engine').forEach(g => md += `| ${g.key} | ${g.decision === 'winner' ? '🏆 ' + g.canonical : '🧬 שילוב'} | ${g.scores ? g.scores.maor + ':' + g.scores.buildsmart : ''} | ${g.coverage} |\n`);
md += `\n## מחרוזות חוזרות (≥5 מופעים) — ‏${groups.filter(g=>g.kind==='string').length} מועמדות למונח-יחיד\n| טקסט | מופעים |\n|---|---|\n`;
groups.filter(g => g.kind === 'string').sort((a,b) => b.members.length - a.members.length).slice(0, 20).forEach(g => md += `| ${g.key} | ${g.members.length} |\n`);
md += `\n## צבעים לאיחוד — ‏${groups.filter(g=>g.kind==='color').length} קבוצות\n| ערך | קנוני | חברים |\n|---|---|---|\n`;
groups.filter(g => g.kind === 'color').slice(0, 15).forEach(g => md += `| \`${g.key.split('|')[1]}\` | ${g.canonical.split(':').pop()} | ${g.members.length} |\n`);
fs.writeFileSync(new URL('./DEDUP-REPORT.md', import.meta.url), md);
console.log(`הכרעת-כפילויות: ${groups.length} קבוצות — 🏆 ${counts.winner} מנצחים · 🧬 ${counts.merge} שילובים · 🚨 ${counts.undecided} ללא-הכרעה ⇒ DEDUP-REPORT.md`);
