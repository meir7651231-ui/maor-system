#!/usr/bin/env node
/**
 * 📏 מד-הכיסוי של מילון המטרות (MINED-VERBS, 14.10.2026) — כמה מ-940 ההתנהגויות יש להן חלק בקטלוג שעושה את הפועל שלהן.
 *
 * "מכוסה" = לפועל של ההתנהגות יש לפחות חלק אחד בקטלוג שמתויג בו (catalog/behavior/*.json — הורץ, תאום או משם; לא implied).
 *   לפני — האלפבית של 45 הפעלים ו-9 המקורות (בלי הליבה, ופעלי-הזמן-והתנועה = "NEW" כמו שהמילון כתב אותם).
 *   אחרי — 60 הפעלים + מקור הליבה (catalog/core), שבו כל פועל-זמן/תנועה מתקיים n/n.
 * גם לפי חומר (פועל + אותו סוג-חומר) — המחמיר יותר.
 *
 *   node catalog/scripts/goals-coverage.mjs           # כותב catalog/goals/coverage.json + coverage.md
 *   node catalog/scripts/goals-coverage.mjs --check   # יציאה 1 אם לא מעודכן
 * דטרמיניסטי: בלי שעון, הכול ממוין.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDir } from '../lib/build-all.mjs';
import { MOTION_VERBS } from '../lib/verbs-motion.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = path.join(ROOT, 'catalog/goals');
const MINED = new Set(MOTION_VERBS.map((v) => v.id));

export function coverage(root = ROOT) {
  const files = fs.readdirSync(path.join(root, 'catalog/goals')).filter((f) => f.endsWith('.json') && f !== 'schema.json' && f !== 'coverage.json').sort();
  const needs = files.flatMap((f) => JSON.parse(fs.readFileSync(path.join(root, 'catalog/goals', f), 'utf8')).goals.flatMap((g) => g.needs.map((n) => ({ ...n, word: g.word }))));
  const sources = readDir(path.join(root, 'catalog/sources'));
  const behaviors = readDir(path.join(root, 'catalog/behavior'));
  const kindOf = new Map(Object.values(sources).flatMap((d) => d.parts.map((p) => [p.id, [p.gives.kind, ...p.takes.map((t) => t.kind)]])));
  /** פועל ⇒ {parts, kinds} לפי סט-מקורות. */
  const index = (srcs) => {
    const m = new Map();
    for (const s of srcs) for (const e of behaviors[s]?.parts ?? []) for (const v of e.verbs) {
      if (v.implied) continue;
      if (!m.has(v.id)) m.set(v.id, { parts: 0, kinds: new Set() });
      const x = m.get(v.id); x.parts++;
      for (const k of kindOf.get(e.id) ?? []) x.kinds.add(k.startsWith('record:') ? 'record:*' : k);
    }
    return m;
  };
  const all = Object.keys(behaviors).sort();
  const before = index(all.filter((s) => s !== 'core'));
  const after = index(all);
  const fam = (k) => (k.startsWith('record:') ? 'record:*' : k);
  const measure = (ix, isBefore) => {
    let verb = 0; let mat = 0;
    const perVerb = {};
    for (const n of needs) {
      const v = isBefore && MINED.has(n.verb) ? null : n.verb; // לפני: פעלי-הזמן-והתנועה היו NEW
      const hit = v && ix.get(v);
      perVerb[n.verb] ??= { needs: 0, covered: 0 };
      perVerb[n.verb].needs++;
      if (hit) { verb++; perVerb[n.verb].covered++; if (hit.kinds.has(fam(n.material))) mat++; }
    }
    return { verb, material: mat, perVerb };
  };
  const b = measure(before, true); const a = measure(after, false);
  const total = needs.length;
  const verbs = [...new Set(needs.map((n) => n.verb))].sort();
  const rows = verbs.map((v) => ({ verb: v, mined: MINED.has(v), needs: a.perVerb[v].needs, before: b.perVerb[v].covered, after: a.perVerb[v].covered, parts: after.get(v)?.parts ?? 0 }))
    .sort((x, y) => y.needs - x.needs || (x.verb < y.verb ? -1 : 1));
  return {
    version: 1, generatedAt: null,
    note: 'מכוסה = לפועל של ההתנהגות יש חלק בקטלוג שמתויג בו (catalog/behavior). לפני = 45 פעלים, 9 מקורות. אחרי = 60 פעלים + הליבה (catalog/core). material = גם אותו סוג-חומר.',
    behaviors: total,
    newVerbsLeft: needs.filter((n) => n.verb.startsWith('NEW:')).length,
    before: { byVerb: b.verb, byVerbAndMaterial: b.material, pct: Math.round((1000 * b.verb) / total) / 10 },
    after: { byVerb: a.verb, byVerbAndMaterial: a.material, pct: Math.round((1000 * a.verb) / total) / 10 },
    uncoveredAfter: rows.filter((r) => r.after < r.needs).map((r) => r.verb),
    verbs: rows,
  };
}

export function coverageMd(c) {
  const L = ['# 📏 מד-הכיסוי · מילון המטרות מול הקטלוג', ''];
  L.push(`**${c.behaviors} התנהגויות.** לפני: **${c.before.byVerb}** (${c.before.pct}%) יש להן חלק שעושה את הפועל · אחרי: **${c.after.byVerb}** (${c.after.pct}%). גם לפי חומר: ${c.before.byVerbAndMaterial} ⇒ ${c.after.byVerbAndMaterial}. פעלי-NEW שנשארו: ${c.newVerbsLeft}.`, '');
  L.push('לפני = 45 הפעלים ו-9 המקורות (פעלי-הזמן-והתנועה היו `NEW:`). אחרי = 60 פעלים + הליבה (`catalog/core`) — 15 פעלים שנכרו מהקוד שלנו. נוצר ע"י `node catalog/scripts/goals-coverage.mjs`.', '');
  if (c.uncoveredAfter.length) L.push('**עדיין בלי חלק:** ' + c.uncoveredAfter.map((v) => '`' + v + '`').join(' · ') + ' — פעלים static-only שאף מפקד לא תייג (אין חוק חד), לא פעולות חסרות.', '');
  L.push('| פועל | 🌀 | התנהגויות | לפני | אחרי | חלקים בקטלוג |', '|---|:-:|---:|---:|---:|---:|');
  for (const r of c.verbs) L.push(`| \`${r.verb}\` | ${r.mined ? '🌀' : ''} | ${r.needs} | ${r.before} | ${r.after} | ${r.parts} |`);
  return L.join('\n') + '\n';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await (await import('../inner/lib/ensure-gen.mjs')).ensureGen({ quiet: true, modules: false }); // החלקים הפנימיים — מהמחסן (INNER v2)
  const c = coverage();
  const out = { 'coverage.json': JSON.stringify(c, null, 2) + '\n', 'coverage.md': coverageMd(c) };
  let stale = 0;
  for (const [f, text] of Object.entries(out)) {
    const abs = path.join(DIR, f);
    const cur = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
    if (cur === text) continue;
    if (process.argv.includes('--check')) { console.error('✗ catalog/goals/' + f + ' לא מעודכן — הרץ: node catalog/scripts/goals-coverage.mjs'); stale++; }
    else { fs.writeFileSync(abs, text); console.log('✓ catalog/goals/' + f); }
  }
  console.log(`כיסוי: ${c.before.byVerb}/${c.behaviors} ⇒ ${c.after.byVerb}/${c.behaviors}`);
  if (stale) process.exit(1);
}
