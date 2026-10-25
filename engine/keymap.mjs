// פריסת המקשים של המכשיר (ClockworkPi PicoCalc) עם המדבקות בעברית — מקור אחד לסימולטור, למדבקות ולתיעוד.
// כל מקש: { phys: שם המקש הפיזי, k: שם המקש במנוע (register.press), label: המדבקה, cls: צבע, w: רוחב יחסי }
// cls: fn = פעולה (תכלת) · pay = תשלום (ירוק) · red = ביטול/מחיקה (ורוד) · act = פעולה ישירה (צהוב) · num = ספרה · quick = מוצר מהיר
const K = (phys, k, label, cls, w = 1) => ({ phys, k, label, cls, w });
const Q = (phys, n) => K(phys, `Q${n}`, '', 'quick');

export const ROWS = [
  [K('◀', 'MINUS', '−1', 'fn', 0.8), K('▲', 'UP', '▲', 'fn', 0.8), K('▶', 'PLUS', '+1', 'fn', 0.8), null,
    K('F1', 'MENU', 'תפריט', 'fn', 1.4), K('F2', 'REFUND', 'החזרה', 'fn', 1.4), K('F3', 'DISC', 'הנחה', 'fn', 1.4), K('F4', 'PCT', '% שורה', 'fn', 1.4), K('F5', 'BPCT', '% סל', 'fn', 1.4)],
  [K('', '', '', 'gap', 0.8), K('▼', 'DOWN', '▼', 'fn', 0.8), K('', '', '', 'gap', 0.8), null,
    K('Esc', 'CANCEL', 'בטל', 'red', 1.4), K('Tab', 'BASKET', '₪ סל', 'fn', 1.4), K('CapsLK', 'QTY', '× כמות', 'fn', 1.4), K('Del', 'DEL', 'מחק', 'red', 1.4), K('Back', 'C', 'C', 'red', 1.4)],
  [K('', '', '', 'gap', 2.4), null,
    K('`', '00', '00', 'num'), K('/', '.', '.', 'num'), K('\\', 'X', 'דוח X', 'act'), K('-', 'Z', 'סגירת יום', 'act'), K('=', 'STOCK', 'מלאי', 'act'), K('[', 'COPY', 'העתק', 'act'), K(']', 'DRAWER', 'מגירה', 'act')],
  '1234567890'.split('').map((d) => K(d, d, d, 'num')),
  'QWERTYUIOP'.split('').map((c, i) => Q(c, i + 1)),
  [...'ASDFGHJKL'.split('').map((c, i) => Q(c, i + 11)), K('Enter', 'OK', 'אישור', 'fn')],
  [...'ZXCVBNM,.'.split('').map((c, i) => Q(c, i + 20)), K('', '', '', 'gap')],
  [K('Shift-L', 'PRICE', 'מחיר', 'fn', 1.5), K('Ctrl', 'PCHK', 'בדיקת מחיר', 'act'), K('Alt', 'CLOCK', 'שעון', 'act'), K('Space', 'CASH', 'מזומן', 'pay', 2.7), Q(';', 29), Q("'", 30), K('Shift-R', 'CREDIT', 'אשראי', 'pay', 1.5)],
];

// כל המקשים הפעילים (לבדיקות ולתיעוד)
export function allKeys() {
  return ROWS.flat().filter((x) => x && x.k);
}
