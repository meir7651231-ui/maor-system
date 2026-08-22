/**
 * מיפוי CallBack של ספק-סליקה → רשומת "תשלום-נכנס" גנרית. **טהור** (בלי firebase),
 * כדי שיהיה ניתן-לבדיקה ביחידה.
 *
 * נדרים-פלוס (וספקים אחרים) שולחים ב-CallBack שמות-שדה משלהם — נדרים ב-PascalCase
 * (‏ClientName / Amount / Phone / Mail / Currency…), לעיתים ב-query ולעיתים ב-body.
 * הבורר סובלני-שמות: מנסה כמה וריאנטים לכל שדה-לוגי. `param1`/`param2` = פרמטרים
 * שאנחנו מעבירים בקישור-התשלום ונדרים **מהדהד** אותם ב-CallBack (משמשים ל-org
 * ולמזהה-תומך). ה-caller שומר בנוסף את המטען-הגולמי (`raw`) — כך שאם ספק משנה
 * שם-שדה, שום מידע לא אובד וניתן לדייק את המיפוי מול CallBack אמיתי (תפר-יחיד כאן).
 *
 * שדות נדרים-פלוס הרשמיים (עוד > Webhook + GetHistoryJson, מסמך ה-API):
 *   ClientName · Amount · Currency (1=₪ | 2=$ | ILS/USD) · Phone · Mail · Zeout
 *   (ת"ז/ח.פ) · Groupe (קטגוריה) · TransactionId · Confirmation · KevaId (מזהה
 *   הו"ק, קיים בעסקאות הוראת-קבע) · Adresse · Comments · TransactionType · …
 */
function pick(p, ...keys) {
  for (const k of keys) {
    const v = p[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

/** מטבע מנורמל: '₪' | '$'. נדרים: Currency 1=שקל | 2=דולר (גם ILS/USD). ברירת-מחדל ₪. */
function pickCurrency(p) {
  const raw = pick(p, 'Currency', 'currency', 'cur', 'Coin');
  if (raw === '2' || /usd|\$|דולר/i.test(raw)) return '$';
  return '₪'; // '1' / 'ILS' / ריק / שקל
}

/** סכום מנורמל: מסיר מפריד-אלפים/סמל-מטבע/רווחים לפני ההמרה כדי ש-'1,000'/'₪50'
 * לא ייהפכו ל-NaN (⇒ 'bad amount' 400 ⇒ עסקה אובדת). שומר סימן ונקודה-עשרונית. */
function pickAmount(p) {
  const raw = pick(p, 'Amount', 'amount', 'Sum', 'sum', 'Total');
  return Number(String(raw || 0).replace(/[^\d.-]/g, '')) || 0;
}

/** תאריך-עסקה (נדרים: "dd/MM/yyyy HH:mm:ss") → ISO "yyyy-MM-dd". ריק אם אין —
 * הצרכן (chargeToHist) ייפול ל-isoToday. **מקור-אמת יחיד** ל-webhook ולמשיכה כאחד. */
function pickDate(p) {
  const raw = pick(p, 'TransactionTime', 'Date', 'PaymentDate', 'TransactionDate');
  const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(raw);
  if (!m) return '';
  const [, d, mo, y] = m;
  const pad = (n) => String(n).padStart(2, '0');
  return `${y}-${pad(mo)}-${pad(d)}`;
}

/**
 * @returns {{org:string, amount:number, currency:string, name:string, phone:string,
 *   email:string, zeout:string, category:string, kevaId:string, reference:string}}
 */
function mapPaymentCallback(params) {
  const p = params || {};
  const first = pick(p, 'FirstName', 'firstName', 'PayerFirstName');
  const last = pick(p, 'LastName', 'lastName', 'PayerLastName');
  return {
    // org מגיע מה-query שמגדירים בפאנל נדרים (‏?org=slug), עם נפילה ל-param1 המהודהד
    org: pick(p, 'org', 'param1', 'Param1'),
    amount: pickAmount(p),
    currency: pickCurrency(p),
    // נדרים שולח שם-מלא ב-ClientName; שם-מלא מפורש גובר על FirstName/LastName
    name: pick(p, 'ClientName', 'Name', 'name', 'FullName', 'PayerName') || [first, last].filter(Boolean).join(' '),
    phone: pick(p, 'Phone', 'phone', 'Tel', 'Mobile', 'cell', 'PayerPhone'),
    email: pick(p, 'Mail', 'Email', 'email', 'mail'),
    zeout: pick(p, 'Zeout', 'zeout', 'Tz', 'IdNumber'),
    category: pick(p, 'Groupe', 'Group', 'category', 'Category', 'designation'),
    // מזהה הוראת-קבע — קיים כשהתשלום הוא חיוב הו"ק (מבחין תרומה חד-פעמית מהו"ק)
    kevaId: pick(p, 'KevaId', 'kevaId', 'KevaID'),
    reference: pick(p, 'TransactionId', 'Transaction', 'Confirmation', 'Asmachta', 'AsmachtaNumber', 'reference', 'Reference', 'param2', 'Param2'),
    // מזהה-תורם נדרים (ToremId) — מפתח-שיוך חזק לחיבור-אוטומטי לכרטיס; param3 מהודהד
    toremId: pick(p, 'ToremId', 'ToremID', 'ClientId', 'DonorId', 'param3', 'Param3'),
    // מספר-קבלת-נדרים (§46) ו-4 ספרות אחרונות — לתיעוד ב-hist[] של הכרטיס
    receipt: pick(p, 'KabalaId', 'KabalaNum', 'ReceiptNum'),
    last4: pick(p, 'LastNum', 'Last4', 'CardSuffix').slice(-4),
    // תאריך-העסקה האמיתי (ISO) — נכתב ל-hist[].d גם ב-webhook החי (עקבי עם המשיכה)
    d: pickDate(p),
  };
}

/**
 * 🧼 חיטוי מפתח-דדופ ל-doc-id של Firestore (21.8). reference/TransactionId מגיעים
 * מהספק כמו-שהם — '/' בתוך doc() **זורק** ⇒ 500 ⇒ ה-CallBack (חד-פעמי אצל
 * נדרים) אובד והתשלום נעלם. הכללים:
 *   • מותר [A-Za-z0-9_-]; כל תו אחר ⇒ '_' · תקרת-אורך ~100.
 *   • אם החיטוי שינה משהו (או קוצר) — מוסיפים זנב-hash דטרמיניסטי של המקור,
 *     אחרת שתי אסמכתאות-בעברית שונות היו מתמזגות ל-'ref-___' אחד (דדופ-שווא
 *     שבולע תשלום שני).
 *   • מפתח ריק ⇒ hash של המטען הגולמי (fallback אחרון; ה-caller בדרך-כלל
 *     נופל ל-add() עם id אקראי לפני שמגיעים לכאן).
 * טהור ודטרמיניסטי — אותו קלט ⇒ אותו id (הדדופ נשמר).
 */
function sanitizeDedupKey(raw, payload) {
  const crypto = require('crypto');
  const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
  const s = String(raw ?? '');
  if (!s) return 'h' + hash(JSON.stringify(payload ?? '')).slice(0, 32);
  const clean = s.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 92);
  if (clean !== s) return clean + '-' + hash(s).slice(0, 8);
  return clean;
}

module.exports = { mapPaymentCallback, pick, pickCurrency, pickAmount, pickDate, sanitizeDedupKey };
