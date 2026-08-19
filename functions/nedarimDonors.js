/**
 * פרסור רשימת-התורמים של נדרים (GetTormimCsv) → רשומות-תורם מסודרות. **טהור**.
 *
 * הפורמט (אומת מול קובץ-אמת): **UTF-16LE**, מופרד-טאבים (TSV), CRLF. שורה 1 =
 * כותרות. חלק מהתאים עטופים ב-`="..."` (פורמט-טקסט של Excel לשמירת אפסים מובילים).
 * מיפוי לפי **שמות-הכותרות** (עמיד לשינוי-סדר). מזהה-תורם (ToremId) = מפתח-השיוך.
 */

/** ניקוי תא: הסרת עטיפת ="..."‏, ביטול-כפילות-מרכאות, "null"/אפסים ⇒ ריק. */
function unwrapCell(cell) {
  let s = String(cell == null ? '' : cell).trim();
  const m = /^="([\s\S]*)"$/.exec(s);
  if (m) s = m[1];
  s = s.replace(/""/g, '"').trim();
  if (s.toLowerCase() === 'null') s = '';
  return s;
}

const HDR = {
  zeout: 'מספר זהות',
  familyName: 'שם משפחה',
  firstName: 'שם פרטי',
  address: 'כתובת',
  city: 'עיר',
  phone: 'טלפון 1',
  phone2: 'טלפון 2',
  phone3: 'טלפון 3',
  email: 'אימייל',
  notes: 'הערות',
  toremId: 'מזהה תורם',
};

/**
 * @param {string} text - טקסט ה-CSV המפוענח (UTF-16LE כבר פוענח למחרוזת).
 * @returns {Array<{toremId,zeout,name,firstName,familyName,address,phone,phone2,phone3,email,notes}>}
 */
function parseDonorsTsv(text) {
  const rows = String(text || '').split(/\r?\n/).filter((r) => r.length > 0);
  if (rows.length < 2) return [];
  const header = rows[0].split('\t').map((h) => h.trim());
  const col = {};
  for (const key of Object.keys(HDR)) col[key] = header.indexOf(HDR[key]);
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].split('\t');
    const get = (j) => (j >= 0 && j < cells.length ? unwrapCell(cells[j]) : '');
    let zeout = get(col.zeout);
    if (/^0+$/.test(zeout) || zeout.length < 4) zeout = ''; // אפסים/מספר-סידורי = לא ת"ז אמיתית
    const firstName = get(col.firstName);
    const familyName = get(col.familyName);
    const name = [firstName, familyName].filter(Boolean).join(' ').trim();
    const toremId = get(col.toremId);
    if (!name && !toremId) continue; // שורת-סיכום/ריקה
    out.push({
      toremId,
      zeout,
      name,
      firstName,
      familyName,
      address: [get(col.address), get(col.city)].filter(Boolean).join(', '),
      phone: get(col.phone),
      phone2: get(col.phone2),
      phone3: get(col.phone3),
      email: get(col.email),
      notes: get(col.notes),
    });
  }
  return out;
}

module.exports = { parseDonorsTsv, unwrapCell };
