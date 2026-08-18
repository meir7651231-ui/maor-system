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
    amount: Number(pick(p, 'Amount', 'amount', 'Sum', 'sum', 'Total') || 0),
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
  };
}

module.exports = { mapPaymentCallback, pick, pickCurrency };
