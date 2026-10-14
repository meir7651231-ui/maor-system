// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/validators.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const typeOf = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);
export function inner$xmlWellFormed$s(xml) {
    const s = String(xml);
    return s;
}
export function inner$xmlWellFormed$lt(xml, i) {
    const s = String(xml);
    const lt = s.indexOf('<', i);
    return lt;
}
export function inner$xmlWellFormed$lt$$step(s, i) {
    const lt = s.indexOf('<', i);
    return lt;
}
export function inner$xmlWellFormed$end(xml, i) {
    const s = String(xml);
    const lt = s.indexOf('<', i);
    const end = s.indexOf('-->', lt + 4);
    return end;
}
export function inner$xmlWellFormed$end$$step(s, lt) {
    const end = s.indexOf('-->', lt + 4);
    return end;
}
export function inner$xmlWellFormed$end_L27(xml, i) {
    const s = String(xml);
    const lt = s.indexOf('<', i);
    const end = s.indexOf('?>', lt + 2);
    return end;
}
export function inner$xmlWellFormed$end_L27$$step(s, lt) {
    const end = s.indexOf('?>', lt + 2);
    return end;
}
export function inner$xmlWellFormed$gt(xml, i) {
    const s = String(xml);
    const lt = s.indexOf('<', i);
    const gt = s.indexOf('>', lt);
    return gt;
}
export function inner$xmlWellFormed$gt$$step(s, lt) {
    const gt = s.indexOf('>', lt);
    return gt;
}
export function inner$xmlWellFormed$tag(xml, i) {
    const s = String(xml);
    const lt = s.indexOf('<', i);
    const gt = s.indexOf('>', lt);
    const tag = s.slice(lt + 1, gt).trim();
    return tag;
}
export function inner$xmlWellFormed$tag$$step(s, lt, gt) {
    const tag = s.slice(lt + 1, gt).trim();
    return tag;
}
export function inner$xmlWellFormed$name(xml, i) {
    const s = String(xml);
    const lt = s.indexOf('<', i);
    const gt = s.indexOf('>', lt);
    const tag = s.slice(lt + 1, gt).trim();
    const name = tag.slice(1).trim();
    return name;
}
export function inner$xmlWellFormed$name$$step(tag) {
    const name = tag.slice(1).trim();
    return name;
}
export function inner$xmlWellFormed$name_L42(xml, i) {
    const s = String(xml);
    const lt = s.indexOf('<', i);
    const gt = s.indexOf('>', lt);
    const tag = s.slice(lt + 1, gt).trim();
    const name = tag.split(/[\s/]/)[0];
    return name;
}
export function inner$xmlWellFormed$name_L42$$step(tag) {
    const name = tag.split(/[\s/]/)[0];
    return name;
}
export function inner$validateAgainstSchema$t(obj) {
    const t = typeOf(obj);
    return t;
}
export function inner$validateAgainstSchema$ok(obj, schema) {
    const t = typeOf(obj);
    const ok = schema.type === 'integer' ? (t === 'number' && Number.isInteger(obj)) : t === schema.type;
    return ok;
}
export function inner$validateAgainstSchema$ok$$step(obj, schema, t) {
    const ok = schema.type === 'integer' ? (t === 'number' && Number.isInteger(obj)) : t === schema.type;
    return ok;
}

export const SIGS = {
  inner$xmlWellFormed$s: [{"name":"xml","d":{"t":"any"},"opt":false}],
  inner$xmlWellFormed$lt: [{"name":"xml","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$xmlWellFormed$lt$$step: [{"name":"s","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$xmlWellFormed$end: [{"name":"xml","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$xmlWellFormed$end$$step: [{"name":"s","d":{"t":"str"},"opt":false},{"name":"lt","d":{"t":"num"},"opt":false}],
  inner$xmlWellFormed$end_L27: [{"name":"xml","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$xmlWellFormed$end_L27$$step: [{"name":"s","d":{"t":"str"},"opt":false},{"name":"lt","d":{"t":"num"},"opt":false}],
  inner$xmlWellFormed$gt: [{"name":"xml","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$xmlWellFormed$gt$$step: [{"name":"s","d":{"t":"str"},"opt":false},{"name":"lt","d":{"t":"num"},"opt":false}],
  inner$xmlWellFormed$tag: [{"name":"xml","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$xmlWellFormed$tag$$step: [{"name":"s","d":{"t":"str"},"opt":false},{"name":"lt","d":{"t":"num"},"opt":false},{"name":"gt","d":{"t":"num"},"opt":false}],
  inner$xmlWellFormed$name: [{"name":"xml","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$xmlWellFormed$name$$step: [{"name":"tag","d":{"t":"str"},"opt":false}],
  inner$xmlWellFormed$name_L42: [{"name":"xml","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$xmlWellFormed$name_L42$$step: [{"name":"tag","d":{"t":"str"},"opt":false}],
  inner$validateAgainstSchema$t: [{"name":"obj","d":{"t":"any"},"opt":false}],
  inner$validateAgainstSchema$ok: [{"name":"obj","d":{"t":"any"},"opt":false},{"name":"schema","d":{"t":"any"},"opt":false}],
  inner$validateAgainstSchema$ok$$step: [{"name":"obj","d":{"t":"any"},"opt":false},{"name":"schema","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"lit","v":["string","number","bigint","boolean","symbol","undefined","object","function","array","null"]},"opt":false}],
};
