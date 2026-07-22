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

export function downloadReceipt(o: ReceiptInfo): void {
  const cur = o.currency || '₪';
  const d = new Date(o.date);
  const gregorian = isNaN(d.getTime()) ? o.date : d.toLocaleDateString('he-IL');
  const heb = hebDateFull(o.date);
  const lines = [
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
  // כמו באב-טיפוס: שורות ריקות מסוננות, BOM בתחילת הקובץ
  const text = '\uFEFF' + lines.filter((x) => x !== '').join('\n');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `receipt-${o.rid}.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
