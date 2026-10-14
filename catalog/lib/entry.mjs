/**
 * 🏷️ שורה בקובץ-ההתנהגות (CATALOG-VERBS, 14.10.2026): תוצאת-ההרצה (או הסיבה שלא הורץ) ⇒ תווית.
 * run = נמדד · static = ניחוש משם/חתימה (עם סיבה). "חומר" = על איזה סוג הפעולה עובדת (רשומת-תורם, תאריך, סכום…).
 */
import { hintOf } from './shape.mjs';
import { traitKey } from './probe.mjs';
import { staticLabel } from './static-label.mjs';

const lowerCamel = (s) => String(s).replace(/^[A-Z]/, (c) => c.toLowerCase());
export function kindOfDesc(d, name = '') {
  if (!d) return 'unknown';
  const h = d.h || hintOf(name);
  switch (d.t) {
    case 'obj': return 'record:' + lowerCamel(d.n || name.replace(/s$/, '') || 'item');
    case 'rec': case 'map': return 'list';
    case 'str': return h === 'iso' ? 'date' : h === 'hhmm' || h === 'isodt' ? 'times' : 'text';
    case 'num': return h === 'ms' || h === 'minutes' ? 'times' : h === 'amount' ? 'amount' : 'number';
    case 'int': return 'number';
    case 'bool': return 'bool';
    case 'lit': return 'choice';
    case 'arr': case 'tup': case 'set': return 'list';
    case 'date': return 'times';
    case 'or': { const live = d.of.filter((x) => x.t !== 'null' && x.t !== 'undef'); return live.length === 1 ? kindOfDesc(live[0], name) : 'unknown'; }
    default: return 'unknown';
  }
}
export function materialOf(part, sig, i) {
  if (i == null || i < 0) return part.takes[0]?.kind ?? part.gives.kind;
  const t = sig?.takes?.[i];
  if (t?.d?.t === 'arr') return kindOfDesc(t.d.of, t.name.replace(/s$/, ''));
  const k = part.takes[i]?.kind;
  return k && k !== 'unknown' ? k : kindOfDesc(t?.d, t?.name);
}

export function notRunReason(p) {
  if (!p.pure) return 'impure';
  if (p.lang === 'dart') return 'dart — אין SDK בסביבה';
  if (p.lang === 'py') return 'python — לא מורץ כאן (לפי ההנחיה)';
  if (p.lang === 'machine') return 'machine — אין מריץ';
  if (p.lang === 'json') return 'json — נתונים';
  if (p.what === 'engine') return 'engine — מנוע שלם, לא פונקציה';
  if (p.what === 'component') return 'component — רכיב-מסך';
  return 'not-runnable';
}

export function entryFor(p, res, sig) {
  if (res && res.status === 'ran') {
    const e = { id: p.id, labeledBy: 'run', verbs: res.verbs, primary: res.primary, material: res.primary ? materialOf(p, sig, res.primaryArg) : (p.takes[0]?.kind ?? p.gives.kind), cases: res.ok };
    if (!res.verbs.length) e.traits = traitKey(res.traits);
    if (res.hash) e.hash = res.hash;
    return e;
  }
  const st = staticLabel(p);
  const reason = res ? res.status + (res.why ? ' — ' + res.why : '') : notRunReason(p);
  return { id: p.id, labeledBy: 'static', verbs: st.verbs, primary: st.primary, material: st.material, reason };
}

export function tally(entries) {
  const t = { run: 0, runWithVerb: 0, twin: 0, static: 0, staticWithVerb: 0, why: {} };
  for (const e of entries) {
    t[e.labeledBy]++;
    if (e.labeledBy === 'run' && e.verbs.length) t.runWithVerb++;
    if (e.labeledBy === 'static' && e.verbs.length) t.staticWithVerb++;
    if (e.reason) { const k = e.reason.split(' — ')[0].split(':')[0]; t.why[k] = (t.why[k] ?? 0) + 1; }
  }
  t.why = Object.fromEntries(Object.entries(t.why).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)));
  return t;
}
