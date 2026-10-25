// קבצים פשוטים בכרטיס — נפתחים בכל מחשב (אקסל / פנקס רשימות), בלי דפדפן ובלי התקנה.
// הקופה כותבת אותם בכל שמירה; בהכנסת כרטיס היא קוראת את מוצרים.csv אם נערך.
// קבלות וסגירות-יום כאן הן העתק לקריאה בלבד — המקור החתום נשאר ב-KUPA.JSON.
import { reportLines, money, validEan13, codeKey } from './kupa.mjs';
import { sha256, hex, utf8 } from './sign.mjs';

export const PRODUCTS_FILE = 'מוצרים.csv';
export const RECEIPTS_FILE = 'קבלות.csv';
export const README_FILE = 'קרא-אותי.txt';
export const REPORTS_DIR = 'דוחות';
const BOM = '﻿';
const HEADER = ['ברקוד', 'שם', 'מחיר', 'מלאי'];

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csvLine(cells) {
  return cells.map(csvCell).join(',');
}

// ברקוד נכתב עם גרש בתחילתו — אקסל משאיר אותו טקסט ולא הופך ל-7.29E+12
export function productsCsv(card) {
  const rows = [HEADER, ...card.products.map((p) => ["'" + p.code, p.name, money(p.price), p.stock ?? ''])];
  return BOM + rows.map(csvLine).join('\r\n') + '\r\n';
}

export function receiptsCsv(card) {
  const rows = [['מספר', 'תאריך', 'סוג', 'תשלום', 'סה"כ', 'מע"מ', 'פריטים']];
  for (const r of card.receipts) {
    rows.push([r.no, r.at.replace('T', ' '), r.type === 'refund' ? 'החזרה' : 'מכירה', r.method === 'cash' ? 'מזומן' : 'אשראי',
      money(r.total), money(r.vat), r.lines.map((l) => `${l.name} x${l.qty}`).join(' | ')]);
  }
  return BOM + rows.map(csvLine).join('\r\n') + '\r\n';
}

const README = `קופה — מה יש בכרטיס
========================
מוצרים.csv   — רשימת המוצרים, המחירים והמלאי.
               אפשר לפתוח באקסל, לשנות מחיר / להוסיף מוצר / לעדכן מלאי, ולשמור.
               כשמחזירים את הכרטיס — הקופה קוראת את השינויים ומודיעה כמה עודכנו.
               עמודות: ברקוד, שם, מחיר (בשקלים, כולל מע"מ), מלאי (ריק = בלי מעקב).
               הברקוד מתחיל בגרש ' כדי שאקסל לא ישבש אותו. השאירו את הגרש.
               שורה עם שגיאה — הקופה לא תקבל את הקובץ ותגיד באיזו שורה.
קבלות.csv    — כל הקבלות (לקריאה בלבד).
דוחות\\       — כל סגירת יום כקובץ טקסט (לקריאה ולהדפסה).
ניהול-הקופה.html — מסך ניהול נוח בדפדפן (כרום / אדג'), אם מותר במחשב.
KUPA.JSON    — הנתונים החתומים של הקופה. לא לגעת: שינוי ידני יגרום לקופה לפסול את הכרטיס.
`;

// כל הקבצים שהקופה כותבת לכרטיס: { נתיב: טקסט }
export function exportCardFiles(card) {
  const files = {
    [PRODUCTS_FILE]: productsCsv(card),
    [RECEIPTS_FILE]: receiptsCsv(card),
    [README_FILE]: BOM + README.replace(/\n/g, '\r\n'),
  };
  for (const z of card.zReports) {
    files[`${REPORTS_DIR}/סגירת-יום-${String(z.no).padStart(4, '0')}.txt`] = BOM + reportLines(card, z).join('\r\n') + '\r\n';
  }
  return files;
}

export function textHash(text) {
  return hex(sha256(utf8(text)));
}

// ── קריאת מוצרים.csv אחרי עריכה במחשב ──
// אקסל שומר "CSV UTF-8" (עם BOM) או "CSV" רגיל בקידוד Windows-1255 — תומכים בשניהם.
export function decodeText(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
  } catch {
    return new TextDecoder('windows-1255').decode(bytes);
  }
}

// פירוק CSV: מרכאות, שורות CRLF, מפריד פסיק או נקודה-פסיק (לפי שורת הכותרת)
export function parseCsv(text) {
  const firstLine = text.split(/\r?\n/, 1)[0];
  const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function cleanCode(raw) {
  let s = String(raw).trim();
  const f = s.match(/^="?(.*?)"?$/); // ="7290..." (צורה שאקסל מכיר)
  if (f && s.startsWith('=')) s = f[1];
  return s.replace(/^'/, '').trim();
}

function parsePrice(raw) {
  let s = String(raw).replace(/[₪\s]/g, '');
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
  else if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

// מחזיר { products, errors:[{line, msg}] } — בלי לגעת בכרטיס.
// known = ברקודים שכבר קיימים בקופה: הם מתקבלים כמו שהם (גם קוד-חנות בלי ספרת ביקורת),
// ספרת הביקורת נבדקת רק לברקוד חדש בן 13 ספרות (שגיאת הקלדה).
export function parseProductsCsv(bytes, known = []) {
  const knownKeys = new Set(known.map(codeKey));
  const rows = parseCsv(decodeText(bytes));
  const errors = [];
  if (!rows.length) return { products: [], errors: [{ line: 1, msg: 'הקובץ ריק' }] };
  const head = rows[0].map((h) => h.trim());
  const col = Object.fromEntries(HEADER.map((h) => [h, head.indexOf(h)]));
  for (const h of ['ברקוד', 'שם', 'מחיר']) if (col[h] < 0) errors.push({ line: 1, msg: `חסרה עמודה "${h}"` });
  if (errors.length) return { products: [], errors };
  const products = [], seen = new Map();
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const code = cleanCode(r[col['ברקוד']] ?? '');
    const name = String(r[col['שם']] ?? '').trim();
    const priceRaw = String(r[col['מחיר']] ?? '').trim();
    const stockRaw = col['מלאי'] >= 0 ? String(r[col['מלאי']] ?? '').trim() : '';
    if (/^\d+(\.\d+)?E\+\d+$/i.test(code)) return errors.push({ line, msg: `הברקוד השתבש באקסל (${code}) — הקלידו אותו מחדש עם ' בהתחלה` });
    if (!/^\d{4,14}$/.test(code)) return errors.push({ line, msg: `ברקוד לא תקין: "${code}"` });
    if (code.length === 13 && !validEan13(code) && !knownKeys.has(codeKey(code))) return errors.push({ line, msg: `ספרת הביקורת של הברקוד ${code} שגויה — בדקו שהוקלד נכון` });
    if (!name) return errors.push({ line, msg: 'חסר שם מוצר' });
    const price = parsePrice(priceRaw);
    if (price === null) return errors.push({ line, msg: `מחיר לא תקין: "${priceRaw}"` });
    let stock = null;
    if (stockRaw !== '') {
      if (!/^-?\d+$/.test(stockRaw)) return errors.push({ line, msg: `מלאי לא תקין: "${stockRaw}"` });
      stock = Number(stockRaw);
    }
    const key = codeKey(code);
    if (seen.has(key)) return errors.push({ line, msg: `הברקוד ${code} מופיע פעמיים (גם בשורה ${seen.get(key)})` });
    seen.set(key, line);
    products.push({ code, name, price, stock });
  });
  return { products, errors };
}

// החלה על הכרטיס — הכול או כלום: שגיאה אחת ⇒ שום שינוי
export function importProductsCsv(card, bytes) {
  const { products, errors } = parseProductsCsv(bytes, card.products.map((p) => p.code));
  if (errors.length) return { card, errors };
  const before = new Map(card.products.map((p) => [codeKey(p.code), p]));
  for (const p of products) { const o = before.get(codeKey(p.code)); if (o) p.code = o.code; } // אקסל מחק אפסים מובילים ⇒ שומרים את הצורה המקורית
  let added = 0, changed = 0;
  for (const p of products) {
    const o = before.get(codeKey(p.code));
    if (!o) added++;
    else if (o.name !== p.name || o.price !== p.price || o.stock !== p.stock) changed++;
  }
  const removed = card.products.filter((p) => !products.some((n) => codeKey(n.code) === codeKey(p.code))).length;
  // מונה הברקודים הפנימיים לא חוזר אחורה ולא מתנגש בקוד שהוקלד ידנית
  let internal = card.seq.internal;
  for (const p of products) if (/^2\d{12}$/.test(p.code)) internal = Math.max(internal, Number(p.code.slice(1, 12)));
  return { card: { ...card, products, seq: { ...card.seq, internal } }, added, changed, removed, errors: [] };
}
