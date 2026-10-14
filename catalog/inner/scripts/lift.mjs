#!/usr/bin/env node
/**
 * 📈 ההרמה (INNER, 14.10.2026) — כמה התנהגויות ממילון-המטרות מקבלות חלק **מוכח** רק בזכות החלקים הפנימיים.
 * ⇒ catalog/inner/lift.json
 *
 * התנהגות = (פועל, חומר) מתוך catalog/goals/*.json (940). "מכוסה" = יש חלק עם labeledBy:"run" שהפועל שלו מתקיים n/n
 * והחומר שלו (סוג הקלט שהפועל נקשר אליו, או החומר הראשי) שווה בדיוק לחומר שבמילון. שני מקורות-הוכחה:
 *   · פעלי-האלפבית (catalog/verbs.json) — מתוך catalog/behavior/*.json;
 *   · תכונות-התנועה (lib/motion.mjs) לפעלי-NEW של המילון (decay · countdown · accumulate · oscillate · orbit) —
 *     לחלקים הפנימיים מ-`motion`, ולחלקים השלמים מקו-הבסיס (motion-baseline.json), כדי שההשוואה תהיה הוגנת.
 * הפעלים הזמניים של המילון ממופים לאלפבית בטבלה גלויה (VERB_MAP). פועל static-only (route/relay/…) לא מוכח בהרצה אף פעם.
 * קורא קבצים בלבד. דטרמיניסטי.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CHECK = process.argv.includes('--check');

/** הפעלים הזמניים של מילון-המטרות ⇒ האלפבית (או תכונת-תנועה). */
export const VERB_MAP = {
  gate: ['validate', 'compare'], minmax: ['extreme'], 'rank-tiers': ['tier'], search: ['lookup', 'fuzzy'], 'round-robin': ['rotate'],
  'daily-snapshot': ['bucket'], 'route-channel': ['route'], 'tolerate-failure': ['tolerate'], 'hub-relay': ['relay'], 'frame-swap': ['freeze'],
  'NEW:decay': ['~decay'], 'NEW:countdown': ['~countdown'], 'NEW:accumulate': ['~accumulate'], 'NEW:oscillate': ['~oscillate'], 'NEW:orbit': ['~orbit'],
};

const readDir = (d) => Object.fromEntries(fs.readdirSync(d).filter((f) => f.endsWith('.json') && f !== 'schema.json').sort().map((f) => [f.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'))]));

export function computeLift(root = ROOT) {
  const goals = readDir(path.join(root, 'catalog/goals'));
  const sources = readDir(path.join(root, 'catalog/sources'));
  const behaviors = readDir(path.join(root, 'catalog/behavior'));
  const basePath = path.join(root, 'catalog/inner/motion-baseline.json');
  const baseline = fs.existsSync(basePath) ? JSON.parse(fs.readFileSync(basePath, 'utf8')) : { sources: {} };
  const verbIds = new Set(JSON.parse(fs.readFileSync(path.join(root, 'catalog/verbs.json'), 'utf8')).verbs.map((v) => v.id));
  const partOf = new Map(Object.values(sources).flatMap((d) => d.parts.map((p) => [p.id, p])));

  /** (פועל|~תכונה, חומר) ⇒ [מזהי-חלקים], בנפרד לבסיס ולפנימיים. */
  const cover = { base: new Map(), inner: new Map() };
  const add = (side, verb, mat, id) => { const k = verb + '|' + mat; if (!cover[side].has(k)) cover[side].set(k, []); cover[side].get(k).push(id); };
  const kindsOn = (p, on) => (on && on !== '*' ? on.split('+').map((n) => p.takes.find((t) => t.name === n)?.kind).filter(Boolean) : []);
  for (const [s, d] of Object.entries(behaviors)) {
    const side = s.startsWith('inner-') ? 'inner' : 'base';
    for (const e of d.parts) {
      if (e.labeledBy !== 'run') continue;
      const p = partOf.get(e.id);
      if (!p) continue;
      for (const v of e.verbs) {
        const mats = new Set([...kindsOn(p, v.on), ...(e.primary === v.id ? [e.material] : [])]);
        for (const m of mats) add(side, v.id, m, e.id);
      }
      for (const mo of e.motion ?? []) for (const m of motionMats(p, mo)) add(side, '~' + mo.id, m, e.id);
    }
  }
  for (const [s, b] of Object.entries(baseline.sources ?? {})) for (const [id, ms] of Object.entries(b.parts ?? {})) {
    const p = partOf.get(id);
    if (!p) continue;
    for (const mo of ms) for (const m of motionMats(p, mo)) add('base', '~' + mo.id, m, id);
    void s;
  }

  const needs = [];
  for (const [file, doc] of Object.entries(goals)) for (const g of doc.goals) for (const n of g.needs) needs.push({ file, word: g.word, ...n });
  const rows = needs.map((n) => {
    const targets = verbIds.has(n.verb) ? [n.verb] : VERB_MAP[n.verb] ?? [];
    const hit = (side) => targets.flatMap((t) => (cover[side].get(t + '|' + n.material) ?? []).map((id) => ({ t, id })));
    return { ...n, targets, base: hit('base'), inner: hit('inner') };
  });
  const status = (r) => (!r.targets.length ? 'unmapped' : r.base.length ? (r.inner.length ? 'both' : 'base-only') : r.inner.length ? 'inner-only' : 'none');
  const counts = {};
  for (const r of rows) { const k = status(r); counts[k] = (counts[k] ?? 0) + 1; }
  const pairKey = (r) => r.verb + '|' + r.material;
  const pairs = new Map();
  for (const r of rows) if (!pairs.has(pairKey(r))) pairs.set(pairKey(r), status(r));
  const pairCounts = {};
  for (const v of pairs.values()) pairCounts[v] = (pairCounts[v] ?? 0) + 1;
  // הדוגמאות: חלק פנימי אחד לכל זוג (פועל, חומר) שנוסף רק בזכות הפנימיים; עדיפות לחלק שהשם שלו קצר והוא slice
  const gained = rows.filter((r) => status(r) === 'inner-only');
  const byPair = new Map();
  for (const r of gained) { const k = pairKey(r); if (!byPair.has(k)) byPair.set(k, { verb: r.verb, material: r.material, behaviors: [], parts: r.inner }); byPair.get(k).behaviors.push(`${r.word}: ${r.behavior}`); }
  const pick = (ids) => ids.map((x) => partOf.get(x.id)).sort((a, b) => (a.tags.includes('form:slice') === b.tags.includes('form:slice') ? (a.id < b.id ? -1 : 1) : a.tags.includes('form:slice') ? -1 : 1))[0];
  const examples = [...byPair.values()].sort((a, b) => b.behaviors.length - a.behaviors.length || (a.verb + a.material < b.verb + b.material ? -1 : 1)).map((g) => {
    const p = pick(g.parts);
    return { verb: g.verb, material: g.material, behaviors: g.behaviors.length, sample: g.behaviors.slice(0, 3), innerParts: new Set(g.parts.map((x) => x.id)).size, part: { id: p.id, name: p.name, parent: p.parent } };
  });
  const top = [];
  for (const r of gained) {
    const p = pick(r.inner);
    top.push({ word: r.word, behavior: r.behavior, verb: r.verb, material: r.material, part: p.id, name: p.name });
  }
  return {
    version: 1, generatedAt: null,
    note: 'כיסוי (פועל, חומר) של מילון-המטרות: בסיס = חלקים שלמים; inner = חלקים פנימיים. "inner-only" = התנהגות שמקבלת חלק מוכח רק בזכות הפותח.',
    verbMap: VERB_MAP,
    behaviors: { total: rows.length, ...Object.fromEntries(Object.entries(counts).sort()) },
    pairs: { total: pairs.size, ...Object.fromEntries(Object.entries(pairCounts).sort()) },
    examples, top: top.slice(0, 20),
  };
}

function motionMats(p, mo) {
  if (mo.id === 'orbit') return ['geo'];
  const on = p.takes.find((t) => t.name === mo.on)?.kind;
  return [...new Set([p.gives.kind, ...(mo.id === 'countdown' && on ? [on] : [])].filter((k) => k && k !== 'unknown'))];
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const text = JSON.stringify(computeLift(), null, 1) + '\n';
  const file = path.join(ROOT, 'catalog/inner/lift.json');
  if (CHECK) { if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) { console.error('✗ catalog/inner/lift.json לא מעודכן — הרץ: node catalog/inner/scripts/lift.mjs'); process.exit(1); } console.log('✓ lift.json מעודכן'); }
  else { fs.writeFileSync(file, text); const j = JSON.parse(text); console.log('התנהגויות:', JSON.stringify(j.behaviors), '· זוגות:', JSON.stringify(j.pairs)); }
}
