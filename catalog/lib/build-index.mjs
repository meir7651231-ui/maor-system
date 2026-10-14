/**
 * 📇 בונה-האינדקס (CATALOG-INDEX, 14.10.2026) — טהור: מקבל את קובצי-המקור ואת קובצי-ההתנהגות, מחזיר טקסטים.
 *   index.json   — כל החלקים מכל המקורות, ממוינים · כפולים בין-מקורות · סטטיסטיקה · טבלת "מי מתחבר למי"
 *   verbs.json   — אלפבית-הפעלים (הגדרה: שם, משמעות, צורה, חוקים)
 *   verbs.md     — אותו דבר לקריאה
 *   alphabet.md  — "אותה פעולה, שמות אחרים": לכל פועל כמה חלקים בכל מקור + דוגמאות מעולמות שונים, וכמה פעולות שונות יש בסך-הכול
 * דטרמיניסטי: בלי שעון, הכול ממוין. בלי ערכים מתוך נתונים — רק שמות-חלקים, סוגים ותוויות.
 */
import { VERBS, PRIMARY_ORDER } from './verbs.mjs';
import { crossSourceDups } from './links.mjs';

export const SOURCE_ORDER = ['orbit', 'buildsmart', 'generator', 'rings', 'yeshiva', 'qa-scanner', 'yoman-habina', '14kk', 'mmmm', 'core', 'core-b'];
export const SOURCE_HE = { orbit: 'אורביט', buildsmart: 'בנייה-חכמה', generator: 'המחולל', rings: 'מנוע-הטבעות', yeshiva: 'הישיבה', 'qa-scanner': 'סורק-האיכות', 'yoman-habina': 'יומן-הבינה', '14kk': '14kk', mmmm: 'MMMM', core: 'הליבה', 'core-b': 'ליבות-הפעלים' };
const srcRank = (s) => { const k = SOURCE_ORDER.indexOf(s); return k < 0 ? 99 : k; };
const byKey = (f) => (a, b) => { const x = f(a); const y = f(b); return x < y ? -1 : x > y ? 1 : 0; };
const kindFam = (k) => (k.startsWith('record:') ? 'record:*' : k);
const VOCAB = /^(span|amount|number|times|date|sequence|list|waiting|text|bool|geo|image|sound|file|choice|ui|unknown|record:[a-z][A-Za-z0-9]*)$/;
/** סוג במילון המשותף: record:org-config ⇒ record:orgConfig (כמו באורביט); מחוץ למילון ⇒ unknown. */
export function conformKind(k) {
  if (VOCAB.test(k)) return k;
  if (typeof k === 'string' && k.startsWith('record:')) {
    const c = k.slice(7).replace(/[^A-Za-z0-9]+([A-Za-z0-9])/g, (_, x) => x.toUpperCase()).replace(/[^A-Za-z0-9]/g, '').replace(/^[A-Z]/, (x) => x.toLowerCase());
    if (/^[a-z][A-Za-z0-9]*$/.test(c)) return 'record:' + c;
  }
  return 'unknown';
}
const inc = (o, k, n = 1) => { o[k] = (o[k] ?? 0) + n; };
const sortObj = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)));

/** כל המידע שהאינדקס צריך. sources: {name: doc}, behaviors: {name: doc}. */
export function buildIndex(sources, behaviors) {
  const names = Object.keys(sources).sort(byKey(srcRank));
  // הסוגים עוברים למילון המשותף (record:org-config ⇒ record:orgConfig) — כך "מי מתחבר למי" חוצה מקורות
  const parts = names.flatMap((s) => sources[s].parts).map((p) => ({ ...p, takes: p.takes.map((t) => ({ ...t, kind: conformKind(t.kind) })), gives: { ...p.gives, kind: conformKind(p.gives.kind) } }));
  const bySource = (s) => parts.filter((p) => p.source === s);
  const beh = new Map();
  for (const s of Object.keys(behaviors)) for (const e of behaviors[s].parts) beh.set(e.id, e);
  const dups = crossSourceDups(parts);
  const dupOf = new Map();
  for (const g of dups) for (const id of g.members) dupOf.set(id, g.key);

  const stats = {};
  for (const s of names) {
    const st = { parts: 0, pure: 0, what: {}, lang: {}, gives: {}, takes: {}, labeledBy: {}, withVerb: 0 };
    for (const p of bySource(s)) {
      st.parts++; if (p.pure) st.pure++;
      inc(st.what, p.what); inc(st.lang, p.lang); inc(st.gives, kindFam(p.gives.kind));
      for (const t of new Set(p.takes.map((x) => kindFam(x.kind)))) inc(st.takes, t);
      const b = beh.get(p.id);
      if (b) { inc(st.labeledBy, b.labeledBy); if (b.verbs.length) st.withVerb++; }
    }
    for (const k of ['what', 'lang', 'gives', 'takes', 'labeledBy']) st[k] = sortObj(st[k]);
    stats[s] = st;
  }
  const total = { parts: parts.length, what: {}, lang: {}, gives: {}, verbs: {} };
  for (const p of parts) { inc(total.what, p.what); inc(total.lang, p.lang); inc(total.gives, kindFam(p.gives.kind)); }
  for (const e of beh.values()) for (const v of e.verbs) if (!v.implied) inc(total.verbs, v.id + ':' + e.labeledBy);
  for (const k of ['what', 'lang', 'gives', 'verbs']) total[k] = sortObj(total[k]);

  // מי מתחבר למי: לכל סוג — כמה נותנים אותו וכמה לוקחים אותו, לפי מקור; ומטריצת מקור⇒מקור (מספר זוגות נותן⇒לוקח)
  const byKind = {};
  for (const p of parts) {
    const g = p.gives.kind;
    if (g !== 'unknown' && g !== 'ui') { byKind[g] ??= { gives: {}, takes: {} }; inc(byKind[g].gives, p.source); }
    for (const t of new Set(p.takes.map((x) => x.kind))) if (t !== 'unknown' && t !== 'ui') { byKind[t] ??= { gives: {}, takes: {} }; inc(byKind[t].takes, p.source); }
  }
  const matrix = {};
  for (const a of names) { matrix[a] = {}; for (const b of names) matrix[a][b] = 0; }
  for (const k of Object.keys(byKind)) for (const [a, ga] of Object.entries(byKind[k].gives)) for (const [b, tb] of Object.entries(byKind[k].takes)) matrix[a][b] += ga * tb;
  const kinds = Object.keys(byKind).sort();
  const plugs = {
    note: 'זוג = חלק שנותן סוג X × חלק שלוקח סוג X (רשומות — רק אותה ישות בדיוק, אחרי יישור לשם-אחד: record:org-config = record:orgConfig). בלי unknown ו-ui.',
    byKind: Object.fromEntries(kinds.map((k) => [k, { gives: sortObj(byKind[k].gives), takes: sortObj(byKind[k].takes), pairs: Object.values(byKind[k].gives).reduce((a, b) => a + b, 0) * Object.values(byKind[k].takes).reduce((a, b) => a + b, 0) }])),
    sourceMatrix: matrix,
  };

  // הליבה (catalog/core): כל חלק-ליבה מצביע (tags: twin:<id>) על החלקים בקטלוג שהוא ה"תאום בלי עולם" שלהם
  const ids = new Set(parts.map((p) => p.id));
  const coreOf = new Map();
  const twins = parts.filter((p) => p.source === 'core').map((p) => {
    const tw = (p.tags ?? []).filter((t) => t.startsWith('twin:')).map((t) => t.slice(5)).filter((id) => ids.has(id)).sort();
    for (const id of tw) coreOf.set(id, p.id);
    const origins = (p.tags ?? []).filter((t) => t.startsWith('origin:'));
    return { core: p.id, verb: (p.tags.find((t) => t.startsWith('verb:')) ?? '').slice(5), combination: (p.tags.find((t) => t.startsWith('combination:')) ?? '').slice(12).split('+').filter(Boolean), origins: origins.length, sources: [...new Set(origins.map((t) => t.split(':')[1]))].sort(byKey(srcRank)), twins: tw };
  });

  const rows = parts.slice().sort(byKey((p) => p.id)).map((p) => {
    const b = beh.get(p.id);
    const r = { id: p.id, source: p.source, name: p.name, what: p.what, lang: p.lang, takes: p.takes.map((t) => t.kind), gives: p.gives.kind, pure: p.pure };
    if (dupOf.has(p.id)) r.dup = dupOf.get(p.id);
    if (coreOf.has(p.id)) r.core = coreOf.get(p.id);
    if (b) {
      r.labeledBy = b.labeledBy;
      const vs = b.verbs.filter((v) => !v.implied).map((v) => v.id);
      if (vs.length) r.verbs = vs;
      if (b.primary) r.primary = b.primary;
      if (b.material && vs.length) r.material = b.material;
      if (b.traits) r.traits = b.traits;
    }
    return r;
  });

  return {
    version: 1, generatedAt: null,
    sources: names.map((s) => ({ source: s, repo: sources[s].repo, ref: sources[s].ref, parts: sources[s].parts.length })),
    totals: total, stats, plugs,
    twins: { note: 'חלק-ליבה (catalog/core) = הפעולה בלי עולם; twins = החלקים בקטלוג שממנה חולצה; origins = כמה מקומות בקוד נמצאה (catalog/core/origins.json).', list: twins },
    dups: { groups: dups.length, parts: dups.reduce((a, g) => a + g.members.length, 0), byConfidence: sortObj(dups.reduce((o, g) => (inc(o, g.confidence), o), {})), list: dups },
    parts: rows,
  };
}

/** JSON עם חלק אחד בכל שורה (diff קריא). */
export function indexText(ix) {
  const { parts, dups, ...head } = ix;
  const lines = JSON.stringify({ ...head, dups: { ...dups, list: '§' }, parts: '¶' }, null, 1).split('\n');
  const out = [];
  for (const l of lines) {
    if (l.includes('"list": "§"')) out.push(' "list": [\n' + dups.list.map((g) => '  ' + JSON.stringify(g)).join(',\n') + '\n ]' + (l.trim().endsWith(',') ? ',' : ''));
    else if (l.includes('"parts": "¶"')) out.push(' "parts": [\n' + parts.map((p) => '  ' + JSON.stringify(p)).join(',\n') + '\n ]' + (l.trim().endsWith(',') ? ',' : ''));
    else out.push(l);
  }
  return out.join('\n') + '\n';
}

/* ═══════════════ אלפבית-הפעלים ═══════════════ */

export function verbsJson(atomLaws) {
  const box = new Map();
  for (const l of atomLaws ?? []) { if (!box.has(l.atom)) box.set(l.atom, []); box.get(l.atom).push({ id: l.id, says: l.says }); }
  return {
    version: 1, generatedAt: null,
    note: 'החוקים רצים מ-catalog/lib/verbs.mjs (check). boxLaws = 30 החוקים של המאמת (src/lib/atoms/verify/laws.ts) שרצים על 8 החלקים עצמם.',
    primaryOrder: PRIMARY_ORDER,
    verbs: VERBS.map((v) => {
      const o = { id: v.id, he: v.he, means: v.means, takes: v.takes, gives: v.gives };
      if (v.box) o.box = true;
      if (v.staticOnly) { o.staticOnly = true; o.laws = []; }
      else o.laws = v.laws.map((l) => ({ id: l.id, says: l.says, ...(l.sweep ? { sweep: true } : {}), ...(l.catches ? { catches: l.catches } : {}) }));
      if (v.mined) { o.mined = true; o.core = 'catalog/core/' + v.id + '.mjs'; if (v.combination) o.combination = v.combination; }
      if (v.boxLaws) o.boxLaws = box.get(v.boxLaws) ?? [];
      o.cues = { he: v.cues?.he ?? [], en: v.cues?.en ?? [] };
      return o;
    }),
  };
}

export function verbsMd(vj) {
  const L = [];
  L.push('# 🔤 אלפבית-הפעלים · The Verb Alphabet', '');
  L.push('> **בעברית פשוטה:** רשימה קטנה וקבועה של **פעולות בלי עולם**. "מחלק" מחלק שעות-תפילה, תשלומי-תרומה ומשיכות-כנף של דרקון — אותה פעולה.');
  L.push('> הבקשה מביאה את העולם (חמנייה, רמזור, דרקון); החלק מביא רק את הפעולה.', '');
  L.push(`**${vj.verbs.length} פעלים** · ${vj.verbs.filter((v) => !v.staticOnly).length} עם חוקים שרצים · ${vj.verbs.filter((v) => v.staticOnly).length} מזוהים רק משם/חתימה (static-only) · ${vj.verbs.reduce((a, v) => a + v.laws.length, 0)} חוקים (+ ${vj.verbs.reduce((a, v) => a + (v.boxLaws?.length ?? 0), 0)} חוקי-המאמת של 8 פעלי-הארגז).`, '');
  L.push('קוד: [`lib/verbs.mjs`](./lib/verbs.mjs) · מכונה-קריאה: [`verbs.json`](./verbs.json) · מי מקיים מה: [`alphabet.md`](./alphabet.md).', '');
  L.push('**איך פועל "מתקיים" בחלק:** מריצים את החלק בארגז-חול על קלטים עם זרע, מנסים כל קישור ("איזה קלט הוא הרשימה"), וכל החוקים של הפועל צריכים לעבור על כל המקרים (n/n), עם מספיק מקרים ועם מקרה-עד שהחלק לא טריוויאלי (לא זהות, לא קבוע, ותלוי בקלט). לכל חוק יש "מוטנט" — מימוש מקולקל שהחוק תופס (`catalog/__tests__/verbs.test.ts`).', '');
  L.push('| # | id | פועל | משמעות | מקבל ⇒ נותן | חוקים |', '|---:|---|---|---|---|---:|');
  vj.verbs.forEach((v, k) => L.push(`| ${k + 1} | \`${v.id}\`${v.box ? ' 📦' : ''}${v.mined ? ' 🌀' : ''}${v.combination ? '🧩' : ''} | **${v.he}** | ${v.means} | ${v.takes.length ? v.takes.map((t) => '`' + t + '`').join(' + ') : '—'} ⇒ \`${v.gives}\` | ${v.staticOnly ? 'static-only' : v.laws.length + (v.boxLaws ? ' + ' + v.boxLaws.length : '')} |`));
  L.push('', '📦 = אחד מ-8 פעלי-הארגז (החלקים הקטנים של אורביט). 🌀 = פועל-זמן/תנועה שנכרה מהקוד שלנו — הליבה ב-`core/<id>.mjs`, כל המקומות שבהם נמצא ב-[`core/origins.json`](./core/origins.json); 🧩 = נמצא כשילוב של שתי ליבות (קופץ = מתקפל × דועך).', '');
  L.push('## החוקים', '');
  for (const v of vj.verbs) {
    L.push(`### \`${v.id}\` — ${v.he}`, '', v.means, '');
    if (v.staticOnly) { L.push('_static-only: אין חוק חד שאפשר לבדוק מבחוץ. מזוהה משם הפעולה ומהחתימה — רמזים: ' + [...v.cues.he, ...v.cues.en].map((c) => '`' + c + '`').join(' · ') + '._', ''); continue; }
    if (v.mined) L.push(`ליבה: [\`${v.core}\`](./${v.core.replace('catalog/', '')})${v.combination ? ' · 🧩 נמצא כשילוב: ' + v.combination.map((c) => '`' + c + '`').join(' × ') : ''}`, '');
    for (const l of v.laws) L.push(`- \`${l.id}\`${l.sweep ? ' (סריקה)' : ''} — ${l.says}${l.catches ? ' · _תופס מוטנט: ' + l.catches + '_' : ''}`);
    if (v.boxLaws?.length) {
      L.push('', `<details><summary>${v.boxLaws.length} חוקי-המאמת על החלק עצמו</summary>`, '');
      for (const l of v.boxLaws) L.push(`- \`${l.id}\` — ${l.says}`);
      L.push('', '</details>');
    }
    L.push('');
  }
  return L.join('\n');
}

/* ═══════════════ "אותה פעולה, שמות אחרים" ═══════════════ */

const worldOf = (p) => {
  const segs = p.path.split('/');
  const m = /src\/components\/([^/]+)/.exec(p.path) ?? /src\/lib\/([^/.]+)/.exec(p.path) ?? /lib\/([^/]+)/.exec(p.path);
  return p.source + ':' + (m ? m[1] : segs.slice(0, -1).join('/') || segs[0]);
};

export function alphabetData(sources, behaviors) {
  const parts = new Map();
  for (const s of Object.keys(sources)) for (const p of sources[s].parts) parts.set(p.id, p);
  const per = {};
  for (const v of VERBS) per[v.id] = { run: {}, twin: {}, static: {}, primaryRun: [] };
  const candidates = new Map();
  const hashes = new Map();
  let runParts = 0; let runWithVerb = 0;
  for (const s of Object.keys(behaviors).sort(byKey(srcRank))) {
    for (const e of behaviors[s].parts) {
      if (e.labeledBy === 'run') { runParts++; if (e.verbs.length) runWithVerb++; }
      for (const v of e.verbs) if (!v.implied && per[v.id]) inc(per[v.id][e.labeledBy], s);
      if (e.labeledBy === 'run' && e.primary) per[e.primary].primaryRun.push(e.id);
      if (e.labeledBy === 'run' && !e.verbs.length && e.traits) { if (!candidates.has(e.traits)) candidates.set(e.traits, []); candidates.get(e.traits).push(e.id); }
      if (e.labeledBy === 'run' && e.hash) { if (!hashes.has(e.hash)) hashes.set(e.hash, []); hashes.get(e.hash).push(e.id); }
    }
  }
  // דוגמאות: שמות שונים מעולמות שונים — סבב על המקורות, ובתוך מקור — עולם (מודול) שעוד לא נבחר
  for (const v of VERBS) {
    const pool = per[v.id].primaryRun.map((id) => parts.get(id)).filter(Boolean);
    const twins = [];
    for (const s of Object.keys(behaviors)) for (const e of behaviors[s].parts) if (e.labeledBy === 'twin' && e.primary === v.id) twins.push(parts.get(e.id));
    const chosen = []; const worlds = new Set(); const namesSeen = new Set();
    const take = (p, how) => { if (!p || worlds.has(worldOf(p)) || namesSeen.has(p.name)) return false; chosen.push({ id: p.id, source: p.source, name: p.name, world: worldOf(p).split(':')[1], how }); worlds.add(worldOf(p)); namesSeen.add(p.name); return true; };
    const bySrc = new Map();
    for (const p of pool.sort(byKey((p) => p.id))) { if (!bySrc.has(p.source)) bySrc.set(p.source, []); bySrc.get(p.source).push(p); }
    const order = [...bySrc.keys()].sort(byKey(srcRank));
    for (let round = 0; chosen.length < 4 && round < 50; round++) {
      let any = false;
      for (const s of order) { if (chosen.length >= 4) break; const list = bySrc.get(s); while (list.length) { const p = list.shift(); if (take(p, 'run')) { any = true; break; } } }
      if (!any) break;
    }
    if (chosen.length < 4) for (const p of twins.sort(byKey((p) => p.id))) { if (chosen.length >= 4) break; if (!chosen.some((c) => c.source === p.source)) take(p, 'twin'); }
    // פחות משלוש דוגמאות מדודות ⇒ משלימים מניחוש-השם (מסומן "שם בלבד"), ממקור שעוד לא מיוצג
    if (chosen.length < 3) {
      const stat = [];
      for (const s of Object.keys(behaviors)) for (const e of behaviors[s].parts) if (e.labeledBy === 'static' && e.primary === v.id && e.verbs[0]?.by === 'first') stat.push(parts.get(e.id));
      for (const p of stat.filter(Boolean).sort(byKey((p) => srcRank(p.source) + ':' + p.id))) { if (chosen.length >= 3) break; if (!chosen.some((c) => c.source === p.source)) take(p, 'static'); }
    }
    per[v.id].examples = chosen;
    per[v.id].primaryCount = per[v.id].primaryRun.length;
    delete per[v.id].primaryRun;
  }
  // "const" = על הקלטים שלנו הפלט לא זז — הקלטים לא הגיעו לתחום של החלק. זו לא פעולה; נספר בנפרד
  const notReached = [...candidates.entries()].filter(([t]) => / const/.test(t)).reduce((a, [, ids]) => a + ids.length, 0);
  const cand = [...candidates.entries()].filter(([t]) => !/ const/.test(t)).map(([traits, ids]) => ({ traits, members: ids.sort(), sources: [...new Set(ids.map((id) => id.split(':')[0]))].sort(byKey(srcRank)) }))
    .filter((c) => c.members.length >= 3 || c.sources.length >= 2)
    .sort((a, b) => b.members.length - a.members.length || (a.traits < b.traits ? -1 : 1));
  const twinsExact = [...hashes.values()].filter((ids) => ids.length >= 2).map((ids) => ids.sort()).sort((a, b) => b.length - a.length || (a[0] < b[0] ? -1 : 1));
  const usedVerbs = VERBS.filter((v) => Object.keys(per[v.id].run).length || Object.keys(per[v.id].twin).length);
  return { per, candidates: cand, notReached, twinsExact, runParts, runWithVerb, usedVerbs: usedVerbs.map((v) => v.id), parts };
}

const TRAIT_HE = (t) => t
  .replace(/^in\[([^\]]*)\]>/, (_, a) => (a ? a.split(',').map(heClass).join(' + ') : 'בלי קלט שמשפיע') + ' ⇒ ')
  .replace(/(⇒ )([^ ]+)/, (_, a, b) => a + b.split('|').map(heClass).join(' או '))
  .replace(' const', ' · תמיד אותו פלט').replace(' len=', ' · אותו אורך').replace(' len<', ' · מתקצר').replace(' len>', ' · מתארך').replace(' len~', ' · אורך משתנה').replace(' ⊆', ' · רק פריטים מהקלט')
  .replace(' rec:ext', ' · מוסיף שדות לרשומה').replace(' rec:same', ' · אותם שדות').replace(' rec:part', ' · חלק מהשדות').replace(' rec:new', ' · רשומה חדשה').replace(' rec:mix', '')
  .replace(/ int\+$/, ' · שלם לא-שלילי').replace(/ int$/, ' · שלם').replace(/ real\+$/, ' · לא-שלילי').replace(/ real$/, '');
function heClass(c) {
  return { arr: 'רשימה', obj: 'רשומה', str: 'טקסט', num: 'מספר', bool: 'כן/לא', time: 'זמן', nil: 'כלום', map: 'מפה', set: 'קבוצה', date: 'תאריך', fn: 'פונקציה', nan: 'לא-מספר', promise: 'הבטחה', deep: 'עמוק' }[c] ?? c;
}

export function alphabetMd(sources, behaviors) {
  const A = alphabetData(sources, behaviors);
  const srcs = Object.keys(behaviors).sort(byKey(srcRank));
  const total = Object.values(sources).reduce((a, d) => a + d.parts.length, 0);
  const L = [];
  L.push('# 🔤 אותה פעולה, שמות אחרים · Same action, different names', '');
  L.push('> **הבעלים:** "מכונה שבונה כל דבר משילוב חלקים קטנים". כאן קוראים כל חלק לפי **מה שהוא עושה** — מריצים אותו ובודקים חוקים — ולא לפי השם שלו או העולם שבשבילו נבנה.', '');
  const verbsHeld = A.usedVerbs.length;
  L.push('## השורה התחתונה', '');
  L.push(`- **${total.toLocaleString('en-US')} חלקים** ב-${Object.keys(sources).length} מקורות. **${A.runParts.toLocaleString('en-US')} הורצו** בארגז-חול; **${A.runWithVerb.toLocaleString('en-US')}** מהם מקיימים לפחות פועל אחד מהאלפבית (n/n מקרים).`);
  L.push(`- **${verbsHeld} פעולות שונות** מתוך ${VERBS.filter((v) => !v.staticOnly).length} הפעלים-עם-חוקים נמצאו בפועל בחלקים שהורצו (או בתאומים שלהם).`);
  L.push(`- **${A.candidates.length} מועמדים לפעלים חדשים** — קבוצות של חלקים שהורצו, לא התאימו לשום פועל, והתנהגו אותו דבר (אותה "חתימת-התנהגות"); ו-**${A.twinsExact.length} קבוצות של תאומים מדויקים** (אותה צורה, אותם פלטים על אותם קלטים).`);
  L.push(`- **${A.notReached} חלקים הורצו אבל הקלטים שלנו לא הגיעו לתחום שלהם** (הפלט לא זז — למשל מזהה שלא קיים בקטלוג הפנימי). הם לא נספרים כפעולה.`);
  L.push(`- **כמה פעולות שונות יש בכל הפרויקטים יחד:** **${verbsHeld} מוכחות** (חוקים שעברו n/n על חלקים אמיתיים). לכל היותר **${verbsHeld + A.candidates.length}** אם כל מועמד יתברר כפעולה נפרדת (המועמדים מקובצים לפי צורה גסה, ולכן זה גבול עליון). כל השאר — אותן פעולות בשמות אחרים.`, '');
  L.push('**איך לקרוא:** "הורץ" = התווית נמדדה (labeledBy: run). "תאום" = חלק של המחולל (Dart) שהוא העתק מוצהר של חלק שהורץ, ומקבל את התווית שלו. "סטטי" = ניחוש משם/חתימה בלבד (Dart/Python/לא-טהור) — נספר בנפרד ולא נכנס לשורה התחתונה.', '');
  L.push('## לכל פועל: כמה חלקים בכל מקור', '');
  L.push('| פועל | ' + srcs.map((s) => SOURCE_HE[s] ?? s).join(' | ') + ' | הורץ | תאום | סטטי |');
  L.push('|---|' + srcs.map(() => '---:').join('|') + '|---:|---:|---:|');
  for (const v of VERBS) {
    const c = A.per[v.id];
    const cell = (s) => { const r = c.run[s] ?? 0; const t = c.twin[s] ?? 0; return r || t ? String(r + t) + (t ? 'ᵗ' : '') : '·'; };
    const sumO = (o) => Object.values(o).reduce((a, b) => a + b, 0);
    L.push(`| **${v.he}** \`${v.id}\`${v.staticOnly ? ' ⓢ' : ''} | ` + srcs.map(cell).join(' | ') + ` | ${sumO(c.run)} | ${sumO(c.twin)} | ${sumO(c.static)} |`);
  }
  L.push('', 'ᵗ = כולל תאומים. ⓢ = static-only (אין חוק חד — רק ניחוש). · = אין. בדוגמאות: "שם בלבד" = ניחוש משם החלק (לא הורץ), מוצג רק כשאין מספיק דוגמאות מדודות.', '');
  L.push('## אותה פעולה בעולמות שונים', '');
  for (const v of VERBS) {
    const ex = A.per[v.id].examples;
    if (!ex.length) continue;
    L.push(`### ${v.he} \`${v.id}\``, '', v.means, '');
    L.push(ex.map((x) => `**"${x.name}"** (${SOURCE_HE[x.source] ?? x.source} · ${x.world}${x.how === 'twin' ? ' · תאום' : x.how === 'static' ? ' · שם בלבד' : ''})`).join(' = '), '');
  }
  L.push('## מועמדים לפעלים חדשים', '');
  L.push('חלקים שהורצו, לא התאימו לאף פועל, וקיבלו אותה **חתימת-התנהגות** (אילו קלטים משפיעים, מה יוצא, ואיך: אורך, תת-קבוצה, קבוע). כמו שמנוע-הטבעות קוצר טבלאות חדשות — כאן נקצרות פעולות חדשות. 15 הגדולות:', '');
  L.push('| # | חתימה | בעברית | חלקים | מקורות | דוגמאות |', '|---:|---|---|---:|---|---|');
  A.candidates.slice(0, 15).forEach((c, k) => {
    const ex = c.members.slice(0, 3).map((id) => '"' + (A.parts.get(id)?.name ?? id) + '"').join(' · ');
    L.push(`| ${k + 1} | \`${c.traits}\` | ${TRAIT_HE(c.traits)} | ${c.members.length} | ${c.sources.map((s) => SOURCE_HE[s] ?? s).join(', ')} | ${ex} |`);
  });
  L.push('', `(כל ${A.candidates.length} המועמדים, עם כל החברים — ב-[\`index.json\`](./index.json) תחת \`parts[].traits\`.)`, '');
  L.push('## תאומים מדויקים (אותם פלטים על אותם קלטים)', '');
  L.push('| # | חלקים |', '|---:|---|');
  A.twinsExact.slice(0, 15).forEach((ids, k) => L.push(`| ${k + 1} | ${ids.map((id) => '"' + (A.parts.get(id)?.name ?? id) + '" `' + id.split(':')[0] + '`').join(' = ')} |`));
  L.push('', `(${A.twinsExact.length} קבוצות; שם-קובץ ושם-פונקציה שונים — אותה התנהגות בדיוק.)`, '');
  return L.join('\n') + '\n';
}
