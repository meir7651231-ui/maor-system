/**
 * קבלת תרומה כקובץ טקסט להורדה — בדומה ל-receipt() באב-טיפוס.
 * הקובץ נפתח ב-Notepad/Excel, ולכן מתחיל ב-BOM כדי שהעברית תזוהה כ-UTF-8.
 */
import { hebDateFull } from './hebrew';
import { amountInWords } from './hebrewNumber';
import { featureOn } from './config';
import type { OrgConfig } from '../types/config';

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
  /** קוד-אימות (#11, feature core.receipt.verifycode) — true = מוצג; חסר = לא. */
  verify?: boolean;
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
/**
 * 🔍 קוד-אימות דטרמיניסטי (ROADMAP-100 ‏#11, 5.8.2026): ‏FNV-1a על השדות
 * היציבים של הקבלה (rid|סכום|מטבע|תאריך) → 6 תווי base36 בקיבוץ XXX-XXX.
 * לא חתימה קריפטוגרפית — הוכחת-התאמה מול רישומי-המערכת (זיוף-סכום/תאריך
 * מתגלה בכלי-האימות שבהגדרות). ‏payer מוחרג במכוון (שינוי-שם ⇒ אזעקת-שווא).
 */
export function receiptVerifyCode(rid: string, amount: number, currency: string, date: string): string {
  const s = rid + '|' + amount + '|' + (currency || '₪') + '|' + date.slice(0, 10);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const code = h.toString(36).toUpperCase().padStart(7, '0').slice(-6);
  return code.slice(0, 3) + '-' + code.slice(3);
}

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
      ...(o.verify ? ['קוד-אימות: ' + receiptVerifyCode(o.rid, o.amount, cur, o.date)] : []),
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
    ...(o.verify ? ['קוד-אימות: ' + receiptVerifyCode(o.rid, o.amount, cur, o.date)] : []),
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

/* ---------- קבלה כ-PDF (5.5d, הכרעת-בעלים 9.8: "הלקוח בוחר בכפתור") ---------- */

/** escaping ל-HTML — שם-תורם/ייעוד הם קלט חופשי ואסור שיוזרקו למסמך. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * הקבלה כ-HTML מוכן-להדפסה — טהור (מחרוזת בלבד). אותן שורות בדיוק כמו קובץ
 * הטקסט (receiptLines = מקור-אמת יחיד לתוכן) בפריסה רשמית: שורת מקור/העתק,
 * גוף, וקו-חתימה. המשתמש בוחר "שמירה כ-PDF" בחלון-ההדפסה של הדפדפן.
 */
export function receiptHtml(o: ReceiptInfo): string {
  const lines = receiptLines(o).filter((x) => x !== '');
  const [first, ...rest] = lines;
  const body = rest.map((ln) => '<div class="ln">' + esc(ln) + '</div>').join('\n');
  return (
    '<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8">' +
    '<title>' + esc('קבלה ' + o.rid) + '</title>' +
    '<style>' +
    'body{font-family:"Segoe UI",Arial,"Noto Sans Hebrew",sans-serif;color:#111;margin:0;padding:32px;direction:rtl}' +
    '.sheet{max-width:520px;margin:0 auto;border:1px solid #bbb;border-radius:10px;padding:28px 32px}' +
    '.mark{font-size:12px;letter-spacing:.08em;color:#555;text-align:left}' +
    '.ln{font-size:14.5px;line-height:1.9}' +
    '.ln:first-of-type{font-size:19px;font-weight:700;margin-bottom:6px}' +
    '@media print{body{padding:0}.sheet{border:none}}' +
    '</style></head><body><div class="sheet">' +
    '<div class="mark">' + esc(first) + '</div>' +
    body +
    '</div></body></html>'
  );
}

/**
 * הדפסה/PDF דרך iframe נסתר — לא window.open (חוסמי-חלונות בולעים אותו בלי
 * שגיאה). ה-iframe מוסר מושהה — חלון-ההדפסה מחזיק את המסמך; הסרה מיידית
 * מרוקנת אותו. ביטול בחלון-ההדפסה = פשוט לא מודפס.
 */
export function printReceipt(o: ReceiptInfo): void {
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.insetInlineEnd = '-9999px';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.setAttribute('aria-hidden', 'true');
  frame.srcdoc = receiptHtml(o);
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      setTimeout(() => frame.remove(), 60_000);
    }
  };
  document.body.appendChild(frame);
}

/**
 * מסירת-קבלה לפי בחירת-הלקוח (db.ui.receiptFmt): ‏'pdf' ⇒ חלון-הדפסה
 * (שמירה כ-PDF); חסר/'txt' ⇒ קובץ הטקסט ההיסטורי — ביט-זהה להיום.
 */
export function deliverReceipt(o: ReceiptInfo, fmt?: 'txt' | 'pdf'): void {
  if (fmt === 'pdf') printReceipt(o);
  else downloadReceipt(o);
}

/**
 * הפורמט האפקטיבי למסירה: הבחירה השמורה, אך רק כשדגל-הפיצ׳ר דלוק — כיבוי
 * `core.receipt.pdf` מחזיר את הארגון לקובץ-טקסט גם אם נבחר PDF (מתג-חירום).
 */
export function receiptFmtOf(config: OrgConfig, ui: { receiptFmt?: 'txt' | 'pdf' }): 'txt' | 'pdf' | undefined {
  return featureOn(config, 'core.receipt.pdf') ? ui.receiptFmt : undefined;
}
