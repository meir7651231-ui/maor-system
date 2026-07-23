/**
 * קבלת תרומה כקובץ טקסט להורדה — בדומה ל-receipt() באב-טיפוס.
 * הקובץ נפתח ב-Notepad/Excel, ולכן מתחיל ב-BOM כדי שהעברית תזוהה כ-UTF-8.
 */
import { hebDateFull } from './hebrew';

export interface ReceiptInfo {
  /** מספר אסמכתה (D-{seq} / R-{seq}). */
  rid: string;
  orgName: string;
  /** שם התורם/המשלם. */
  payer: string;
  amount: number;
  /** ברירת מחדל ₪. */
  currency?: string;
  method?: string;
  /** תאריך ISO ‏(YYYY-MM-DD). */
  date: string;
  /** ייעוד התשלום ("עבור ..."). */
  forWhat: string;
  /** אתר הארגון — שורה אופציונלית בתחתית. */
  site?: string;
}

/**
 * שורות הקבלה — טהור (בלי DOM), כדי שאפשר לבדוק את התוכן ובעיקר את התאריך.
 * הלועזי מפורש בצהריים מקומי (T12:00:00) כמו hebDateFull — אחרת באזור זמן ממערב
 * ל-UTC הלועזי היה נופל ליום הקודם וסותר את התאריך העברי על אותה קבלה.
 */
export function receiptLines(o: ReceiptInfo): string[] {
  const cur = o.currency || '₪';
  const d = new Date(o.date.slice(0, 10) + 'T12:00:00');
  const gregorian = isNaN(d.getTime()) ? o.date : d.toLocaleDateString('he-IL');
  const heb = hebDateFull(o.date);
  return [
    'קבלה — ' + (o.orgName || 'מאור החסד'),
    'קבלה מס׳: ' + o.rid,
    // תאריך עברי + לועזי, כמו באב-טיפוס
    'תאריך: ' + (heb ? heb + ' · ' : '') + gregorian,
    'התקבל מאת: ' + o.payer,
    'סכום: ' + cur + o.amount,
    o.method ? 'אמצעי תשלום: ' + o.method : '',
    'עבור: ' + o.forWhat,
    o.site ? 'אתר: ' + o.site : '',
    'תודה על תמיכתכם',
  ];
}

export function downloadReceipt(o: ReceiptInfo): void {
  const lines = receiptLines(o);
  // כמו באב-טיפוס: שורות ריקות מסוננות, BOM בתחילת הקובץ
  const text = '\uFEFF' + lines.filter((x) => x !== '').join('\n');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `receipt-${o.rid}.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
