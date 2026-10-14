/**
 * 🪞 התפקידים של עוזרי-המכונה (SELF, 14.10.2026).
 *
 * לכל עוזר שהתפקיד שלו ידוע מהקוד (ממיין · מסיר-כפולים · מטביע-חותם · סופר · מנרמל · מגביל…): **רק** החוקים של הפועל
 * שהתפקיד אומר, באותו ארגז-חול (catalog/lib/sandbox.mjs — הקובץ המקורי נארז בזיכרון) ובאותו זרע של הקורא.
 * `adapt` = מתאם-תפקיד שרץ בתוך הארגז: עוטף את העוזר כך שהקלט/הפלט שלו הם של הפועל (למשל: מזהה ⇒ {id}).
 * נכשל ⇒ החוק הראשון שנכשל + הסיבה = באג במכונה (ratchet ב-catalog/__tests__/self.test.ts).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { bundleFile, loadInSandbox, callerFor, resolvePart } from '../lib/sandbox.mjs';
import { probePart, evalVerb, bindingsOf, baseCases, fOf, fnvHash } from '../lib/probe.mjs';
import { VERB_BY_ID } from '../lib/verbs.mjs';
export { ORIGINS } from './parts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const STR = { t: 'str' };
const lit = (...v) => ({ t: 'lit', v });

export const ROLES = [
  // ── מטביע-חותם: אותו אורך תמיד · תכנים שונים ⇒ חותמות שונים · אות אחת משנה רבע
  // behaviorHash = חותם(צורה) + '-' + חותם(פלטים): כל חצי — fnvHex. (עד SELF: fnvHash(…).toString(16) ⇒ 7 או 8 תווים — נכשל)
  { path: 'catalog/self/parts.mjs', symbol: 'fnvHex', as: 'fnvHex', verb: 'fingerprint', role: 'שני חצאי behaviorHash · מימוש-הייחוס של «מטביע חותם»', takes: [{ name: 's', d: STR }] },
  { path: 'catalog/self/parts.mjs', symbol: 'fnvHexPoints', verb: 'fingerprint', role: 'wordId · ref של מפקדי-הליבות', takes: [{ name: 's', d: STR }] },
  // (hashOf של ensure-gen = sha256 של node:crypto — בארגז-החול אין crypto, ולכן הוא לא כאן; הוא חותם-תקן ממילא)
  { path: 'catalog/combiner/core.mjs', symbol: 'wordId', verb: 'fingerprint', role: 'מזהה-קובץ למילה (מתכונים)', takes: [{ name: 'w', d: STR }] },
  { path: 'catalog/lib/verbs.mjs', symbol: 'fnv', verb: 'fingerprint', role: 'מימוש-הייחוס של הפועל', takes: [{ name: 's', d: STR }] },
  // ── מסיר-כפולים
  // ── סובל כשל (הליבה המוכחת catalog/core/tolerate.mjs) — בשימוש של ensure-gen: קריאה שנכשלת ⇒ null
  { path: 'catalog/core/tolerate.mjs', symbol: 'attempt', as: 'attempt·ensure-gen', verb: 'tolerate', role: 'read/readPack של ensure-gen', takes: [{ name: 'texts', d: { t: 'arr', of: lit('{"a":1}', '[1,2]', 'שבור', '', '3', 'null', '{"x":') } }], adapt: '(fn) => (texts) => (Array.isArray(texts) ? texts.map((t) => fn((x) => { if (typeof x !== "string") throw new TypeError("not text"); return JSON.parse(x); }, t, null)) : [])' },
  { path: 'catalog/combiner/verbs.mjs', symbol: 'uniq', verb: 'dedupe', role: 'הפעלים של המילון — כל פועל פעם אחת', takes: [{ name: 'ids', d: { t: 'arr', of: lit('sort', 'filter', 'dedupe', 'map', 'group', 'count') } }], adapt: '(fn) => (ids) => fn(ids.map((id) => ({ id }))).map((v) => v.id)' },
  {
    // האינדקס מאחד "אותו חלק שהועתק בין פרויקטים" — פריט = [סמל, סוג-קלט, פלט-על-אותם-קלטים]; כפול = אותם שלושה
    path: 'catalog/combiner/core.mjs', symbol: 'buildIndex', as: 'buildIndex·homes', verb: 'dedupe', role: 'איחוד-הבתים של האינדקס',
    takes: [{ name: 'items', d: { t: 'arr', max: 6, of: { t: 'tup', of: [lit('norm', 'nextStage', 'fmtDm'), lit('text', 'number'), lit('a1', 'b2', 'c3')] } } }],
    adapt: `(fn) => (items) => {
      const id = (k) => 't:f' + String(k).padStart(3, '0') + '.mjs#' + items[k][0];
      const parts = items.map((t, k) => ({ id: id(k), source: 't', path: 'f.mjs', symbol: t[0], lang: 'js', what: 'function', name: 'מחשב ערך', does: '', takes: [{ name: 'x', kind: t[1], type: 'unknown' }], gives: { kind: 'text', type: 'unknown' }, pure: true, example: null, tags: [] }));
      const behavior = new Map(items.map((t, k) => [id(k), { labeledBy: 'run', verbs: [], hash: 'shape0-' + t[2] }]));
      const ix = fn(parts, { behavior });
      return ix.parts.map((p) => items[Number(p.id.slice(3, 6))]);
    }`,
  },
  // ── סופר לפי קבוצה
  { path: 'catalog/lib/entry.mjs', symbol: 'tally', verb: 'tally', role: 'מוני קובץ-ההתנהגות', takes: [{ name: 'labels', d: { t: 'arr', of: lit('run', 'twin', 'static') } }], adapt: '(fn) => (labels) => { const t = fn(labels.map((l) => ({ id: l, labeledBy: l, verbs: [] }))); return { run: t.run, twin: t.twin, static: t.static }; }' },
  // ── מנרמל
  { path: 'catalog/combiner/core.mjs', symbol: 'normWord', verb: 'normalize', role: 'המילה שהבעלים הקליד', takes: [{ name: 'w', d: STR }] },
  { path: 'catalog/combiner/core.mjs', symbol: 'resolveVerb', verb: 'normalize', role: 'פועל מהמילון ⇒ פועל באלפבית (gate ⇒ validate, NEW:x ⇒ x)', takes: [{ name: 'v', d: lit('gate', 'NEW:gate', 'NEW:sort', 'NEW:fly', 'search', 'sort', 'NEW:search', 'minmax', 'fly') }] },
  { path: 'catalog/lib/build-index.mjs', symbol: 'conformKind', verb: 'normalize', role: 'סוג ⇒ המילון המשותף (record:org-config ⇒ record:orgConfig)', takes: [{ name: 'k', d: lit('text', 'record:org-config', 'record:OrgConfig', 'record:_a', 'record:9x', 'Text', 'record:a-b-c', 'geo') }] },
  // ── מזיז
  { path: 'catalog/lib/verbs.mjs', symbol: 'isoPlus', verb: 'offset', role: 'תאריך + ימים (חוקי-הזמן)', takes: [{ name: 'iso', d: { t: 'str', h: 'iso' } }, { name: 'days', d: { t: 'int', lo: -400, hi: 400 } }] },
  // ── מגביל
  { path: 'catalog/lib/verbs-net.mjs', symbol: 'kOf', verb: 'clamp', role: 'כמה שכנים (1..8)', takes: [{ name: 'near', d: { t: 'int', lo: -20, hi: 30 } }], adapt: '(fn) => (near) => fn({ near })' },
  // ── ממיין
  { path: 'catalog/self/parts.mjs', symbol: 'byId', verb: 'sort', role: 'כל הממיינים-לפי-id (מפקדים · אינדקס · קורא · פותח)', takes: [{ name: 'ids', d: { t: 'arr', of: lit('orbit:a#x', 'orbit:b#y', 'core:c#z', 'inner-orbit:a#x.v', 'buildsmart:q#w', 'core-b:p#t') } }], adapt: '(fn) => (ids) => ids.map((id) => ({ id })).sort(fn).map((o) => o.id)' },
  { path: 'catalog/self/parts.mjs', symbol: 'rankCounts', verb: 'sort', role: 'מונים בסדר יורד (index.json · open-*.json · totals.why)', takes: [{ name: 'keys', d: { t: 'arr', u: true, of: lit('text', 'list', 'date', 'number', 'bool', 'geo', 'sound', 'form:slice', 'privacy') } }], adapt: '(fn) => (keys) => Object.keys(fn(Object.fromEntries(keys.map((k) => [k, k.length % 3]))))' },
];

/** מריץ את כל התפקידים. מחזיר [{part, verb, held, holds, law?, why?}] ממוין. */
export async function runRoles({ B, seed }) {
  const out = [];
  const files = [...new Set(ROLES.map((r) => r.path))].sort();
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    const text = fs.readFileSync(abs, 'utf8');
    const roles = ROLES.filter((r) => r.path === rel);
    const exported = (s) => new RegExp('export\\s+(async\\s+)?(function|const|let|class)\\s+' + s + '\\b').test(text);
    const expose = [...new Set(roles.map((r) => r.symbol).filter((s) => !exported(s)))].sort();
    let mod = null; let why = null;
    try { mod = loadInSandbox(await bundleFile(abs, { expose, esm: true, cli: true })); } catch (err) { why = String((err && err.message) || err).split('\n')[0].slice(0, 140); }
    for (const r of roles) {
      const part = 'machine:' + rel + '#' + (r.as ?? r.symbol);
      const row = { part, verb: r.verb, role: r.role };
      const got = mod && resolvePart(mod.exports, r.symbol);
      if (!got) { out.push({ ...row, held: false, law: 'load', why: why ?? 'not-callable' }); continue; }
      const fn = r.adapt ? vm.runInContext('(' + r.adapt + ')', mod.ctx)(got.fn) : got.fn;
      const sig = { takes: r.takes };
      const s = (fnvHash(part + '|' + r.verb) ^ seed) >>> 0;
      const verb = VERB_BY_ID.get(r.verb);
      const res = probePart({ sig, call: callerFor(mod.ctx, fn, s), seed: s, B, verbs: [verb] });
      const h = res.status === 'ran' ? res.verbs.find((v) => v.id === r.verb) : null;
      if (h) { out.push({ ...row, held: true, holds: h.holds }); continue; }
      // לא עמד: החוק הראשון שנכשל (אותם מקרים, אותו זרע)
      const call = callerFor(mod.ctx, fn, s);
      const cases = baseCases(sig, call, s, B);
      let law = null; let reason = res.status !== 'ran' ? res.status : null;
      for (const b of cases.length ? bindingsOf(verb, sig, cases) : []) {
        const rep = evalVerb(verb, b, sig, cases, fOf(call), s, B, true);
        if (!rep) continue;
        const bad = Object.entries(rep.laws).find(([, L]) => L.fail);
        if (bad) { law = bad[0]; reason = bad[1].why; break; }
        reason ??= !rep.witness ? 'אין מקרה-עד' : !rep.dep ? 'הפלט לא תלוי בקלט' : 'פחות מדי מקרים';
      }
      out.push({ ...row, held: false, law: law ?? '-', why: String(reason ?? '?').slice(0, 200) });
    }
  }
  return out.sort((a, b) => (a.part < b.part ? -1 : a.part > b.part ? 1 : a.verb < b.verb ? -1 : 1));
}
