// ─────────────────────────────────────────────────────────────────────────────
// telephony · validators — בדיקת XML well-formed (טהור) + JSON-Schema (תת-קבוצה).
// אפס-תלויות (Node בלי DOM/ajv). מספיק לאימות-פלטי-המנוע ולבדיקת-fixtures.
// ─────────────────────────────────────────────────────────────────────────────

// ── 96. XML well-formed (בודק-מחסנית-תגים) ───────────────────────────────────
/** בודק תקינות-מבנה בסיסית: תגים מאוזנים, comment/prolog/self-closing תקינים. */
export function xmlWellFormed(xml) {
  const s = String(xml);
  const stack = [];
  let i = 0;
  const errors = [];
  while (i < s.length) {
    const lt = s.indexOf('<', i);
    if (lt < 0) break;
    // טקסט לפני התג: ודא אין '<' חשוף כבר טופל; בדוק '&' לא-מוגן.
    if (s.slice(i, lt).includes('&') && !/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/.test(s.slice(i, lt))) {
      errors.push('& לא-מוגן');
    }
    if (s.startsWith('<!--', lt)) {
      const end = s.indexOf('-->', lt + 4);
      if (end < 0) { errors.push('comment לא-סגור'); break; }
      i = end + 3;
      continue;
    }
    if (s.startsWith('<?', lt)) {
      const end = s.indexOf('?>', lt + 2);
      if (end < 0) { errors.push('prolog לא-סגור'); break; }
      i = end + 2;
      continue;
    }
    const gt = s.indexOf('>', lt);
    if (gt < 0) { errors.push('תג לא-סגור'); break; }
    const tag = s.slice(lt + 1, gt).trim();
    if (tag.startsWith('/')) {
      const name = tag.slice(1).trim();
      if (!stack.length || stack[stack.length - 1] !== name) errors.push(`תג-סגירה לא-תואם: </${name}>`);
      else stack.pop();
    } else if (tag.endsWith('/')) {
      // self-closing — לא נכנס למחסנית
    } else {
      const name = tag.split(/[\s/]/)[0];
      if (name) stack.push(name);
    }
    i = gt + 1;
  }
  if (stack.length) errors.push(`תגים לא-סגורים: ${stack.join(',')}`);
  return { valid: errors.length === 0, errors };
}

// ── 97. JSON-Schema (תת-קבוצת draft-07 שהמנוע משתמש בה) ───────────────────────
/** מאמת obj מול schema. תומך: type/required/properties/additionalProperties/
 *  items/enum/pattern/minLength/minimum/maximum/minItems/uniqueItems/oneOf. */
export function validateAgainstSchema(obj, schema, path = '') {
  const errors = [];
  const add = (m) => errors.push(`${path || '(root)'}: ${m}`);
  const typeOf = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);

  if (schema.type) {
    const t = typeOf(obj);
    const ok = schema.type === 'integer' ? (t === 'number' && Number.isInteger(obj)) : t === schema.type;
    if (!ok) { add(`type צפוי ${schema.type}, קיבל ${t}`); return errors; }
  }
  if (schema.enum && !schema.enum.includes(obj)) add(`ערך לא-ברשימה: ${JSON.stringify(obj)}`);
  if (typeof obj === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern).test(obj)) add(`לא-תואם pattern`);
    if (schema.minLength != null && obj.length < schema.minLength) add(`קצר מ-minLength`);
  }
  if (typeof obj === 'number') {
    if (schema.minimum != null && obj < schema.minimum) add(`קטן מ-minimum`);
    if (schema.maximum != null && obj > schema.maximum) add(`גדול מ-maximum`);
  }
  if (Array.isArray(obj)) {
    if (schema.minItems != null && obj.length < schema.minItems) add(`פחות מ-minItems`);
    if (schema.uniqueItems && new Set(obj.map((x) => JSON.stringify(x))).size !== obj.length) add(`פריטים כפולים`);
    if (schema.items) obj.forEach((it, idx) => errors.push(...validateAgainstSchema(it, schema.items, `${path}[${idx}]`)));
  }
  if (schema.type === 'object' || schema.properties) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const req of schema.required || []) if (!(req in obj)) add(`שדה-חובה חסר: ${req}`);
      const props = schema.properties || {};
      for (const [k, v] of Object.entries(obj)) {
        if (props[k]) errors.push(...validateAgainstSchema(v, props[k], path ? `${path}.${k}` : k));
        else if (schema.additionalProperties === false) add(`שדה לא-מותר: ${k}`);
        else if (schema.additionalProperties && typeof schema.additionalProperties === 'object')
          errors.push(...validateAgainstSchema(v, schema.additionalProperties, path ? `${path}.${k}` : k));
      }
    }
  }
  if (schema.oneOf) {
    const passes = schema.oneOf.filter((sub) => validateAgainstSchema(obj, sub, path).length === 0).length;
    if (passes !== 1) add(`oneOf: התאים ל-${passes} (צריך 1)`);
  }
  return errors;
}
