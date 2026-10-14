/**
 * 🔗 אותו חלק בכמה פרויקטים (CATALOG-INDEX, 14.10.2026) — מוצא חלקים שהועתקו בין מקורות
 * (המחולל העתיק 1,485 חלקים מאורביט ומ-BuildSmart ל-Dart; אורביט ו-MMMM חולקים קוד TS).
 * מפתח = שם-הסמל מנורמל (אותיות וספרות בלבד, אותיות קטנות). קישור נשמר רק כשיש לפחות שני מקורות.
 * ביטחון: declared (המחולל אומר from:maor/from:buildsmart) · signature (אותו מספר קלטים ואותו סוג-פלט) · name (רק השם).
 */

const GENERIC = new Set(['build', 'main', 'run', 'render', 'default', 'index', 'init', 'create', 'update', 'handler', 'helper', 'helpers', 'utils', 'util', 'state', 'props', 'widget', 'screen', 'page', 'app', 'config', 'setup', 'start', 'stop', 'reset', 'clear', 'apply', 'value', 'values', 'items', 'label', 'title', 'format', 'parse', 'load', 'save', 'open', 'close', 'toggle', 'select', 'submit', 'cancel', 'refresh', 'button', 'header', 'footer', 'content', 'layout', 'theme', 'style', 'styles', 'colors', 'data', 'model', 'store', 'context', 'provider', 'service', 'client', 'server', 'router', 'routes', 'test', 'tests', 'check', 'validate', 'normalize', 'sort', 'filter', 'merge', 'split', 'join', 'next', 'today', 'empty', 'build']);

export const SOURCE_ALIAS = { maor: 'orbit', orbit: 'orbit', buildsmart: 'buildsmart' };

export function dupKey(part) {
  if (part.what === 'engine') return null;
  const k = String(part.symbol).replace(/~\d+$/, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  if (k.length < 6 || GENERIC.has(k)) return null;
  return k;
}

/** קבוצות-כפולים בין מקורות: [{key, members:[{id, source}], confidence}] — ממוין לפי key. */
export function crossSourceDups(parts) {
  const by = new Map();
  for (const p of parts) {
    const k = dupKey(p);
    if (!k) continue;
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(p);
  }
  const out = [];
  for (const [key, ps] of by) {
    const sources = new Set(ps.map((p) => p.source));
    if (sources.size < 2) continue;
    const declared = ps.some((p) => (p.tags ?? []).some((t) => t.startsWith('from:') && sources.has(SOURCE_ALIAS[t.slice(5)] ?? t.slice(5))));
    const arity = new Set(ps.map((p) => p.takes.length));
    const gives = new Set(ps.map((p) => (p.gives.kind.startsWith('record:') ? 'record' : p.gives.kind)));
    const confidence = declared ? 'declared' : arity.size === 1 && gives.size === 1 ? 'signature' : 'name';
    out.push({ key, confidence, sources: [...sources].sort(), members: ps.map((p) => p.id).sort() });
  }
  return out.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}
