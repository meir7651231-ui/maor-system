/**
 * 📇 בודק-החוזה של הקטלוג (CATALOG, 14.10.2026) — משותף לסקריפט-המפקד ולבדיקה.
 * מממש את תת-הקבוצה של JSON Schema ש-`catalog/schema.json` משתמש בה ($ref · type · enum · pattern · minLength ·
 * maxLength · required · properties · additionalProperties:false · items · oneOf), ועוד כללי-החוזה שסכמה לא מבטאת:
 * id = `<source>:<path>#<symbol>` · ממוין ויחיד · שם ≤ 9 מילים בעברית. בלי תלויות. טהור.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'schema.json'), 'utf8'));

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'number' ? (Number.isInteger(v) ? 'integer' : 'number') : typeof v);

function resolve(s) {
  if (s && s.$ref) {
    const path = s.$ref.replace(/^#\//, '').split('/');
    let cur = SCHEMA;
    for (const k of path) cur = cur[k];
    return cur;
  }
  return s;
}

/** אימות ערך מול סכמה. מחזיר רשימת שגיאות (ריקה = תקין). */
export function validateSchema(value, schema = SCHEMA, at = '$') {
  const s = resolve(schema);
  const errs = [];
  if (s.oneOf) {
    const ok = s.oneOf.filter((alt) => validateSchema(value, alt, at).length === 0).length;
    if (ok !== 1) errs.push(`${at}: oneOf — ${ok} התאמות`);
    return errs;
  }
  if (s.enum && !s.enum.includes(value)) errs.push(`${at}: לא אחד מ-${s.enum.join('|')}`);
  if (s.type) {
    const t = typeOf(value);
    const okType = s.type === t || (s.type === 'number' && t === 'integer');
    if (!okType) return [...errs, `${at}: צריך ${s.type}, יש ${t}`];
  }
  if (typeof value === 'string') {
    if (s.minLength != null && value.length < s.minLength) errs.push(`${at}: קצר מ-${s.minLength}`);
    if (s.maxLength != null && value.length > s.maxLength) errs.push(`${at}: ארוך מ-${s.maxLength}`);
    if (s.pattern && !new RegExp(s.pattern, 'u').test(value)) errs.push(`${at}: לא תואם ${s.pattern}`);
  }
  if (Array.isArray(value) && s.items) value.forEach((v, i) => errs.push(...validateSchema(v, s.items, `${at}[${i}]`)));
  if (typeOf(value) === 'object') {
    for (const k of s.required ?? []) if (!(k in value)) errs.push(`${at}: חסר ${k}`);
    for (const [k, v] of Object.entries(value)) {
      if (s.properties?.[k]) errs.push(...validateSchema(v, s.properties[k], `${at}.${k}`));
      else if (s.additionalProperties === false) errs.push(`${at}: שדה לא מוכר ${k}`);
    }
  }
  return errs;
}

/** הפעלים שבהם שם של חלק אורביט מתחיל (כלל-השם: פועל בהווה). מקורות אחרים — לא חובה. */
export const NAME_VERBS = new Set(
  (
    'בונה מחשב מחזיר בודק מוצא ממיין מסנן יוצר הופך מחלק מאחד מנרמל מעגל מזיז סופר מסדר מוסיף מוריד מבין מזהה מסתיר מחליף מראה שולח מעביר ' +
    'אומר מצייר פותח סוגר מזהיר קובע כותב ממיר גוזר מריץ מרים מקבץ מפרק מתקן מרפא מנקה מציע מצרף מפצל מאמת מחפש מפענח קורא מוחק מסכם מתרגם ' +
    'מתאים מדרג מחבר מקצר מפיק מייצא מייבא מכין מבטל מאשר משלים מעדכן מקדם מדמה מתכנן מחייג נותן מצמיד מצביע מקבל מוציא שומר טוען ממלא מגדיר ' +
    'מפריד מחלץ מעריך צובע מושיב מסווג ממפה משווה מציג מחיל זורע מכפיל משכפל פותר מקריא דוחה מסנכרן מדגיש מערבב מאזן מקרין מעצב מכניס מרכיב ' +
    'פורס מתחיל מתמחר מנתח מתזמן מגביל מקפל ממזער מגלגל מונה מודד מסמן עונה מגיש עובר מדלג רושם מצטט יודע מסיר מאחזר מפעיל מכבה מחשבת מצמצם מגזים מתאר מנקד מרחיב מאתר מכווץ מדפיס מקודד מפרסם ממליץ מתרגם מוודא מנבא מקצה מגדל מרוקן מביא מקים מנתק בוחר מבקש אוסף משנה'
  ).split(' '),
);

/** כללי-החוזה לחלק אחד, מעבר לסכמה. `strict` ⇒ גם "השם מתחיל בפועל מהרשימה". */
export function validatePart(p, { strict = true } = {}) {
  const errs = validateSchema(p, SCHEMA.$defs.part, 'part');
  if (p.id !== `${p.source}:${p.path}#${p.symbol}`) errs.push('id ≠ <source>:<path>#<symbol>');
  const words = String(p.name ?? '').trim().split(/\s+/).filter(Boolean).map((w, i) => (i === 0 ? w.replace(/[,.;:]+$/, '') : w));
  if (!/[א-ת]/.test(p.name ?? '')) errs.push('name: אין עברית');
  if (words.length > 9) errs.push('name: יותר מ-9 מילים');
  if (/[A-Za-z]/.test(p.name ?? '')) errs.push('name: יש אותיות לטיניות');
  if (strict && !NAME_VERBS.has(words[0])) errs.push('name: לא מתחיל בפועל (' + words[0] + ')');
  if (!/[א-ת]/.test(p.does ?? '')) errs.push('does: אין עברית');
  return errs;
}

/** כללי-החוזה לקובץ-מקור שלם: סכמה · כל id מתחיל ב-source · ממוין ויחיד. */
export function validateSource(doc, { strict = false } = {}) {
  const errs = validateSchema(doc);
  if (errs.length) return errs;
  let prev = '';
  for (const p of doc.parts) {
    if (p.source !== doc.source) errs.push(p.id + ': source שונה מהקובץ');
    if (p.id <= prev) errs.push(p.id + ': לא ממוין או כפול');
    prev = p.id;
    for (const e of validatePart(p, { strict })) errs.push(p.id + ': ' + e);
  }
  return errs;
}
