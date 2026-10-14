/**
 * 🗜️ פותח-הפונקציות · המחסן הדחוס (INNER v2, 14.10.2026).
 *
 * קובצי-ה-Part של החלקים הפנימיים (`catalog/sources/inner-*.json`, ‏`catalog/behavior/inner-*.json`) היו ~24MB בריפו —
 * רובם שדות שנגזרים מאחרים: ‏id = ‏source:path#symbol · ‏lang מסיומת-הקובץ · ‏gen: מהנתיב והסמל · ‏parent מהנתיב ומהפונקציה
 * העוטפת · ‏origins.repo/file = ‏repo/path · ‏does מתבנית · וטיפוסים/שמות/תכונות שחוזרים אלפי פעמים.
 * המחסן (`catalog/inner/store/<parts|behavior>-<source>.json`) שומר רק את מה שלא נגזר: שורה לכל חלק, מילונים לכל מה שחוזר.
 * `ensure-gen` פורש אותו בחזרה לקבצים **הזהים ביט-אחר-ביט** לפורמט הקודם (ולכן כל קורא — המצרף, האינדקס, הבדיקות —
 * לא השתנה). כל שורה נבדקת בזמן-הכתיבה: פרישה ⇒ אותו JSON בדיוק; שדה שלא נגזר נכון נשמר במפורש (`x`), ושורה שלא חוזרת
 * בכלל נשמרת כמו שהיא (`raw`). טהור: בלי דיסק.
 */
import { exportName } from './opener.mjs';

export const STORE_VERSION = 1;
const KIND = { value: 'v', accumulator: 'a', envelope: 'e' };
const KIND_OF = { v: 'value', a: 'accumulator', e: 'envelope' };
const FORM = { slice: 's', step: 't' };
const FORM_OF = { s: 'slice', t: 'step' };

/** מילון: ערך ⇒ מספר (לפי סדר-ההופעה הראשון — דטרמיניסטי). */
function dict() {
  const list = []; const at = new Map();
  return { list, of: (v) => { if (!at.has(v)) { at.set(v, list.length); list.push(v); } return at.get(v); } };
}

/** "מה הוא עושה" — אותה תבנית כמו name.mjs#doesOf. */
function doesOf(kind, value, top, mids, line, form, recv) {
  const where = [top, ...mids].join(' ⟵ ');
  const what = kind === 'envelope' ? `ציר-הזמן של ${recv}` : kind === 'accumulator' ? `הערך של "${value}" אחרי הלולאה` : `הערך-בדרך "${value}"`;
  const f = form === 'step' ? 'הנוסחה עצמה, הקלטים הם מה שהיא קוראת' : 'עם כל מה שהוא תלוי בו';
  return `${what} מתוך ${where} (שורה ${line}), כפונקציה טהורה — ${f}.`.slice(0, 238);
}
const valueOf = (symbol, top, mids) => {
  const prefix = [top, ...mids].join('.') + '.';
  return symbol.startsWith(prefix) ? (symbol.slice(prefix.length).match(/^[^:@]+/) ?? [''])[0] : '';
};

/* ═══════════════ חלקים ═══════════════ */

/** שורה ⇒ Part (בדיוק בסדר-המפתחות של build.mjs). */
function partOf(row, S, h) {
  if (row.raw) return row.raw;
  const [f, symbol, top, mids, line, code, n, takes, gives, flags, x = {}] = row;
  const path = S.files[f];
  const kind = KIND_OF[code[0]]; const form = FORM_OF[code[1]];
  const value = valueOf(symbol, top, mids);
  const exp = exportName(symbol);
  const p = {
    id: `${h.source}:${path}#${symbol}`,
    source: h.source,
    path,
    symbol,
    lang: /\.(ts|tsx|mts)$/.test(path) ? 'ts' : 'js',
    what: 'inner',
    name: S.names[n],
    does: doesOf(kind, value, top, mids, line, form, x.recv),
    takes: takes.map(([name, k, t]) => ({ name, kind: k, type: S.types[t] })),
    gives: { kind: gives[0], type: S.types[gives[1]] },
    pure: true,
    example: null,
    tags: [`inner:${kind}`, `form:${form}`, flags & 1 ? 'parent:cataloged' : 'parent:uncataloged', `gen:catalog/inner/gen/${h.short}/${path}.mjs#${exp}`, ...(flags & 2 ? ['via:import'] : []), ...(flags & 4 ? ['via:closure'] : [])],
    parent: `${h.catalog}:${path}#${top}`,
    origins: [{ repo: h.repo, file: path, line, what: `${kind}:${value}` }],
  };
  for (const k of Object.keys(x)) if (k !== 'recv') p[k] = x[k];
  return p;
}

/** חלק ⇒ שורה, עם החילוץ ההפוך של top/mids מ-parent ו-does. */
function rowOf(p, S, h) {
  const path = p.path;
  const top = String(p.parent ?? '').split('#').slice(1).join('#');
  const tag = (pre) => (p.tags.find((t) => t.startsWith(pre)) ?? '').slice(pre.length);
  const kind = tag('inner:'); const form = tag('form:');
  const line = p.origins?.[0]?.line ?? null;
  // mids מתוך does: "… מתוך top ⟵ m1 ⟵ m2 (שורה N)…"
  const m = /מתוך (.*) \(שורה /.exec(p.does);
  const chain = m ? m[1].split(' ⟵ ') : [top];
  const mids = chain[0] === top ? chain.slice(1) : [];
  const recv = kind === 'envelope' ? (/^ציר-הזמן של (.*) מתוך /.exec(p.does) ?? [])[1] : undefined;
  const flags = (p.tags.includes('parent:cataloged') ? 1 : 0) | (p.tags.includes('via:import') ? 2 : 0) | (p.tags.includes('via:closure') ? 4 : 0);
  if (!KIND[kind] || !FORM[form]) return { raw: p };
  const row = [S.files.of(path), p.symbol, top, mids, line, KIND[kind] + FORM[form], S.names.of(p.name), p.takes.map((t) => [t.name, t.kind, S.types.of(t.type)]), [p.gives.kind, S.types.of(p.gives.type)], flags];
  const x = recv !== undefined ? { recv } : {};
  if (Object.keys(x).length) row.push(x);
  return row;
}

const view = (S) => ({ files: S.files.list, names: S.names.list, types: S.types.list });

/**
 * doc (inner-<source>.json) ⇒ מחסן. h = { short, catalog }. כל שורה מאומתת: פרישה ⇒ אותו JSON.
 * מחזיר { store, overrides } — overrides = כמה שורות צריכות שדה מפורש / raw (0 = הכול נגזר).
 */
export function packParts(doc, { short, catalog }) {
  const S = { files: dict(), names: dict(), types: dict() };
  const h = { source: doc.source, repo: doc.repo, short, catalog };
  const rows = [];
  let overrides = 0;
  for (const p of doc.parts) {
    let row = rowOf(p, S, h);
    const want = JSON.stringify(p);
    if (!row.raw && JSON.stringify(partOf(row, view(S), h)) !== want) {
      // שדה שלא נגזר נכון ⇒ נשמר במפורש (בלי לשנות את סדר-המפתחות)
      const got = partOf(row, view(S), h);
      const x = { ...(row[10] ?? {}) };
      for (const k of Object.keys(p)) if (JSON.stringify(got[k]) !== JSON.stringify(p[k])) x[k] = p[k];
      row = [...row.slice(0, 10), x];
      if (JSON.stringify(partOf(row, view(S), h)) !== want) row = { raw: p };
      overrides++;
    }
    rows.push(row);
  }
  const store = { v: STORE_VERSION, kind: 'parts', source: doc.source, short, catalog, repo: doc.repo, ref: doc.ref, generatedAt: doc.generatedAt, files: S.files.list, names: S.names.list, types: S.types.list, rows };
  return { store, overrides };
}

/** מחסן ⇒ doc (inner-<source>.json). */
export function unpackParts(store) {
  const h = { source: store.source, repo: store.repo, short: store.short, catalog: store.catalog };
  const S = { files: store.files, names: store.names, types: store.types };
  return { source: store.source, repo: store.repo, ref: store.ref, generatedAt: store.generatedAt, parts: store.rows.map((r) => partOf(r, S, h)) };
}

/* ═══════════════ התנהגות ═══════════════ */

const LB = { run: 'r', static: 's' };
const ABSENT = [null, null, null, null, -1, -1, 0, 0, 0]; // cases · traits · reason · hash · motion — חסר ⇒ נחתך מסוף-השורה
const LB_OF = { r: 'run', s: 'static' };

/** שורה ⇒ רשומת-התנהגות (סדר-המפתחות של entryFor + motion). */
function entryOf(row, id, T) {
  if (!Array.isArray(row)) return row.raw;
  const [lb, verbs, primary, material, cases = -1, traits = -1, reason = 0, hash = 0, motion = 0] = row;
  const e = { id, labeledBy: LB_OF[lb] ?? lb, verbs, primary, material };
  if (cases !== -1) e.cases = cases;
  if (traits !== -1) e.traits = T[traits];
  if (reason !== 0) e.reason = reason;
  if (hash !== 0) e.hash = hash;
  if (motion !== 0) e.motion = motion;
  return e;
}

/** doc (behavior/inner-<source>.json) ⇒ מחסן; ids = סדר-החלקים (מהמקור). */
export function packBehavior(doc, ids) {
  const T = dict();
  const aligned = doc.parts.length === ids.length && doc.parts.every((e, k) => e.id === ids[k]);
  let overrides = 0;
  const rows = doc.parts.map((e) => {
    const r = [LB[e.labeledBy] ?? e.labeledBy, e.verbs, e.primary, e.material, 'cases' in e ? e.cases : -1, 'traits' in e ? T.of(e.traits) : -1, 'reason' in e ? e.reason : 0, 'hash' in e ? e.hash : 0, 'motion' in e ? e.motion : 0];
    while (r.length > 4 && r[r.length - 1] === ABSENT[r.length - 1]) r.pop();
    if (aligned && JSON.stringify(entryOf(r, e.id, T.list)) === JSON.stringify(e)) return r;
    overrides++;
    return { raw: e };
  });
  const { parts: _p, ...head } = doc;
  return { store: { v: STORE_VERSION, kind: 'behavior', head, aligned, traits: T.list, rows }, overrides };
}

/** מחסן ⇒ doc; ids = סדר-החלקים (מהמקור). */
export function unpackBehavior(store, ids) {
  return { ...store.head, parts: store.rows.map((r, k) => entryOf(r, ids[k], store.traits)) };
}

/* ═══════════════ כתיבה ═══════════════ */

/** JSON של מחסן: כותרת ומילונים בשורה-לכל-מילון, ואז שורה לכל רשומה (diff קריא, שורה = חלק). */
export function storeText(store) {
  const { rows, ...head } = store;
  const keys = Object.keys(head).filter((k) => head[k] !== undefined);
  const lines = keys.map((k) => `${JSON.stringify(k)}: ${JSON.stringify(head[k])}`);
  return `{\n${lines.join(',\n')},\n"rows": [\n${rows.map((r) => JSON.stringify(r)).join(',\n')}\n]}\n`;
}
/** הטקסט של קובץ-Part / קובץ-התנהגות פרוש — בדיוק כמו קודם (build.mjs / prove.mjs). */
export const docText = (doc) => JSON.stringify(doc, null, 1) + '\n';
