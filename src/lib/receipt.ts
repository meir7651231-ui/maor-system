/**
 * קבלת תרומה כקובץ טקסט להורדה — בדומה ל-receipt() באב-טיפוס.
 * הקובץ נפתח ב-Notepad/Excel, ולכן מתחיל ב-BOM כדי שהעברית תזוהה כ-UTF-8.
 */
import { hebDateFull } from './hebrew';
import { amountInWords } from './hebrewNumber';

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
  /** קבלת סעיף 46 פורמלית — מוסיף סכום-במילים, ת"ז תורם, נוסח §46 וחתימה. */
  taxReceipt?: boolean;
  /** מספר עמותה/מלכ"ר (למילוי בהגדרות/אשף). */
  orgTaxId?: string;
  /** ת"ז / ח"פ התורם. */
  payerId?: string;
  /** שם החותם על הקבלה. */
  signatory?: string;
  /**
   * סימון מקור/העתק (5.5d — הוראות ניהול ספרים לקבלה ממוחשבת): הנפקה ראשונה =
   * "מקור"; הורדה חוזרת (redownloadReceipt) = "העתק נאמן למקור". חסר ⇒ מקור.
   */
  copy?: boolean;
  /** הצגת שורת מקור/העתק (feature core.receipt.copymark). חסר/true = מוצג. */
  mark?: boolean;
  /**
   * סיכום העסקה (feature courses.receipt.summary) — שורות "סה"כ עסקה / שולם עד
   * כה / יתרה / תשלום הבא" כמו legacy receipt() (legacy-main-script.js:1258-1266).
   * מועבר רק כשהדגל דלוק — בלעדיו הקבלה זהה לקודמת.
   */
  summary?: {
    totalDue: number;
    paidSoFar: number;
    balance: number;
    /** תאריך התשלום הבא (ISO) — שורה עברי+לועזי כשקיים. */
    nextDate?: string;
  };
}

/** לועזי בפורמט he-IL בצהריים מקומי — עקבי עם שורת התאריך של הקבלה. */
function hebrewLocaleDate(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00');
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('he-IL');
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

  // קבלת סעיף 46 פורמלית — פריסה רשמית עם סכום-במילים, ת"ז ונוסח §46.
  if (o.taxReceipt) {
    const curSym = cur === '$' ? '$' : '₪';
    const words = amountInWords(o.amount, cur === '$' ? '$' : '₪');
    return [
      ...(o.mark === false ? [] : [o.copy ? 'העתק נאמן למקור' : 'מקור']),
      (o.orgName || 'מאור החסד'),
      o.orgTaxId ? 'מס׳ עמותה/מלכ"ר: ' + o.orgTaxId : '',
      '',
      'קבלה על תרומה — לפי סעיף 46 לפקודת מס הכנסה',
      'קבלה מס׳: ' + o.rid,
      'תאריך: ' + (heb ? heb + ' · ' : '') + gregorian,
      '',
      'התקבל בתודה מאת: ' + o.payer,
      o.payerId ? 'ת"ז / ח"פ: ' + o.payerId : '',
      'סכום: ' + curSym + o.amount.toLocaleString('he-IL'),
      'במילים: ' + words,
      o.method ? 'אמצעי תשלום: ' + o.method : '',
      'עבור: ' + o.forWhat,
      '',
      'תרומה זו מוכרת לצורכי מס לפי סעיף 46 לפקודת מס הכנסה.',
      'קבלה זו מהווה אסמכתא לתרומה שהתקבלה.',
      '',
      'בכבוד רב,',
      (o.signatory ? o.signatory : '') + '  ______________________',
      'חתימה וחותמת',
      o.site ? 'אתר: ' + o.site : '',
    ];
  }

  return [
    ...(o.mark === false ? [] : [o.copy ? 'העתק נאמן למקור' : 'מקור']),
    'קבלה — ' + (o.orgName || 'מאור החסד'),
    'קבלה מס׳: ' + o.rid,
    // תאריך עברי + לועזי, כמו באב-טיפוס
    'תאריך: ' + (heb ? heb + ' · ' : '') + gregorian,
    'התקבל מאת: ' + o.payer,
    'סכום: ' + cur + o.amount,
    o.method ? 'אמצעי תשלום: ' + o.method : '',
    'עבור: ' + o.forWhat,
    // סיכום העסקה — verbatim מלגאסי receipt() (legacy:1264-1265)
    o.summary
      ? 'סה"כ עסקה: ₪' + o.summary.totalDue + ' · שולם עד כה: ₪' + o.summary.paidSoFar + ' · יתרה: ₪' + o.summary.balance
      : '',
    o.summary?.nextDate
      ? 'תשלום הבא: ' + hebDateFull(o.summary.nextDate) + ' · ' + hebrewLocaleDate(o.summary.nextDate)
      : '',
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
