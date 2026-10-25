// הדפסה למדפסת קבלות אמיתית (ESC/POS) — עברית.
// מדפסת קבלות מדפיסה משמאל לימין ולא יודעת עברית לבד, ולכן:
//  1. סדר חזותי: כל שורה (שנכתבה בסדר לוגי, מימין לשמאל) מתהפכת — מספרים ואנגלית נשארים משמאל לימין.
//  2. קידוד: עברית בטבלת התווים של המדפסת. ברירת מחדל: CP862 = עמוד 36 ב-ESC t
//     (לפי מסד היכולות של python-escpos לדגמי Epson TM-T20; עמוד 49 = CP1255).
//     לאמת על המדפסת עצמה בשורת בדיקה.

const MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[', '<': '>', '>': '<', '{': '}', '}': '{' };
const REPLACE = { '₪': 'ש"ח', '×': 'x', '—': '-', '–': '-', '·': '-', '″': '"', '׳': "'", '״': '"', '✓': 'V', '⚠': '!', '‏': '', '‎': '' };

export function normalize(s) {
  return [...String(s)].map((c) => (c in REPLACE ? REPLACE[c] : c)).join('');
}

// סוג כיווני לפי Unicode (תת-קבוצה: אין הטבעות מפורשות ואין ערבית)
function bidiType(c) {
  const u = c.codePointAt(0);
  if (u >= 0x5d0 && u <= 0x5ea) return 'R';
  if (/[A-Za-z]/.test(c)) return 'L';
  if (/[0-9]/.test(c)) return 'EN';
  if (c === '+' || c === '-') return 'ES';
  if (/[%$#°]/.test(c)) return 'ET';
  if (/[,.:/]/.test(c)) return 'CS';
  if (c === ' ') return 'WS';
  return 'ON';
}

// אלגוריתם הכיווניות של Unicode (UAX #9) לפסקה מימין לשמאל: כללי W4–W7, N1–N2, I1–I2, L1, L2, L4
export function bidiSegment(text) {
  const ch = [...text];
  const t = ch.map(bidiType);
  const n = t.length;
  // W4: מפריד יחיד בין שתי ספרות ⇒ ספרה (89.90, 1-3, 25/10)
  for (let i = 1; i < n - 1; i++) {
    if (t[i - 1] === 'EN' && t[i + 1] === 'EN' && (t[i] === 'ES' || t[i] === 'CS')) t[i] = 'EN';
  }
  // W5: סימני מטבע/אחוז צמודים לספרה ⇒ ספרה (18%)
  for (let i = 0; i < n; i++) {
    if (t[i] !== 'ET') continue;
    let j = i;
    while (j < n && t[j] === 'ET') j++;
    if ((i > 0 && t[i - 1] === 'EN') || (j < n && t[j] === 'EN')) for (let k = i; k < j; k++) t[k] = 'EN';
    i = j - 1;
  }
  // W6
  for (let i = 0; i < n; i++) if (t[i] === 'ES' || t[i] === 'ET' || t[i] === 'CS') t[i] = 'ON';
  // W7: ספרה שהחזק הקודם לפניה אות לטינית ⇒ L
  let lastStrong = 'R';
  for (let i = 0; i < n; i++) {
    if (t[i] === 'L' || t[i] === 'R') lastStrong = t[i];
    else if (t[i] === 'EN' && lastStrong === 'L') t[i] = 'L';
  }
  // N1/N2: ניטרליים מקבלים את כיוון שכניהם אם זהה (ספרה = R), אחרת R
  const dirOf = (x) => (x === 'L' ? 'L' : 'R');
  for (let i = 0; i < n; i++) {
    if (t[i] !== 'WS' && t[i] !== 'ON') continue;
    let j = i;
    while (j < n && (t[j] === 'WS' || t[j] === 'ON')) j++;
    const before = i > 0 ? dirOf(t[i - 1]) : 'R';
    const after = j < n ? dirOf(t[j]) : 'R';
    const d = before === after ? before : 'R';
    for (let k = i; k < j; k++) t[k] = d;
    i = j - 1;
  }
  // I1/I2 בפסקה מימין לשמאל (רמה 1): R ⇒ 1; L ו-EN ⇒ 2
  const lvl = t.map((x) => (x === 'R' ? 1 : 2));
  // L1: רווחים בסוף ⇒ רמת הבסיס
  for (let i = n - 1; i >= 0 && ch[i] === ' '; i--) lvl[i] = 1;
  // L4: שיקוף סוגריים ברמה אי-זוגית
  const out = ch.map((c, i) => (lvl[i] % 2 && MIRROR[c] ? MIRROR[c] : c));
  // L2: היפוך מהרמה הגבוהה לנמוכה
  for (let level = 2; level >= 1; level--) {
    for (let i = 0; i < n;) {
      if (lvl[i] < level) { i++; continue; }
      let j = i;
      while (j < n && lvl[j] >= level) j++;
      out.splice(i, j - i, ...out.slice(i, j).reverse());
      lvl.splice(i, j - i, ...lvl.slice(i, j).reverse());
      i = j;
    }
  }
  return out.join('');
}

// שורת קבלה = חלקים מופרדים ברווח כפול ומעלה ("שם ....... סכום").
// כל חלק עובר את האלגוריתם לבד, וסדר החלקים מתהפך (הראשון בלוגי ⇒ הכי ימני בדפוס).
// חלק בלי אף אות עברית (כמות × מחיר, סכום, תאריך) מודפס בדיוק כפי שנכתב — במכוון,
// כי האלגוריתם הרשמי היה הופך "1 x 89.90" ל-"x 89.90 1", וזה לא קריא בקבלה.
export function toVisual(line) {
  const parts = normalize(line).split(/( {2,})/);
  const hasHeb = (p) => [...p].some((c) => c.codePointAt(0) >= 0x5d0 && c.codePointAt(0) <= 0x5ea);
  return parts.reverse().map((p) => (/^ *$/.test(p) || !hasHeb(p) ? p : bidiSegment(p))).join('');
}

// CP862: א–ת ⇒ 0x80–0x9A, ASCII כרגיל, כל השאר ⇒ '?'
export function encodeCp862(s) {
  return Uint8Array.from([...s].map((c) => {
    const u = c.codePointAt(0);
    if (u >= 0x5d0 && u <= 0x5ea) return u - 0x5d0 + 0x80;
    if (u >= 0x20 && u < 0x7f) return u;
    return 0x3f;
  }));
}
// CP1255: א–ת ⇒ 0xE0–0xFA
export function encodeCp1255(s) {
  return Uint8Array.from([...s].map((c) => {
    const u = c.codePointAt(0);
    if (u >= 0x5d0 && u <= 0x5ea) return u - 0x5d0 + 0xe0;
    if (u >= 0x20 && u < 0x7f) return u;
    return 0x3f;
  }));
}

const CODEPAGES = { cp862: { n: 36, enc: encodeCp862 }, cp1255: { n: 49, enc: encodeCp1255 } };

// מסמך שלם למדפסת: אתחול, בחירת טבלת עברית, השורות (מרופדות לרוחב ובסדר חזותי), הזנה וחיתוך
export function escposDocument(lines, { width = 48, codepage = 'cp862', cut = true } = {}) {
  const cp = CODEPAGES[codepage];
  if (!cp) throw new Error('codepage: cp862 | cp1255');
  const parts = [Uint8Array.of(0x1b, 0x40), Uint8Array.of(0x1b, 0x74, cp.n)];
  for (const l of lines) {
    const logical = normalize(l);
    const padded = logical + ' '.repeat(Math.max(0, width - [...logical].length)); // ריפוד בסוף הלוגי ⇒ מיושר לימין בדפוס
    parts.push(cp.enc(toVisual(padded).slice(0, width)), Uint8Array.of(0x0a));
  }
  parts.push(Uint8Array.of(0x1b, 0x64, 4)); // הזנת 4 שורות
  if (cut) parts.push(Uint8Array.of(0x1d, 0x56, 0x42, 0x00)); // חיתוך חלקי
  const len = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
