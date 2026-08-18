/**
 * מיפוי CallBack של ספק-סליקה → רשומת "תשלום-נכנס" גנרית. **טהור** (בלי firebase),
 * כדי שיהיה ניתן-לבדיקה ביחידה.
 *
 * נדרים-פלוס (וספקים אחרים) שולחים ב-CallBack שמות-שדה משלהם — לרוב PascalCase
 * (‏Amount / Phone / FirstName…), לעיתים ב-query ולעיתים ב-body. הבורר סובלני-שמות:
 * מנסה כמה וריאנטים לכל שדה-לוגי. `param1`/`param2` = פרמטרים שאנחנו מעבירים
 * בקישור-התשלום ונדרים **מהדהד** אותם ב-CallBack (משמשים ל-org ולמזהה-תומך).
 * ה-caller שומר בנוסף את המטען-הגולמי (`raw`) — כך שאם ספק משנה שם-שדה, שום
 * מידע לא אובד וניתן לדייק את המיפוי מול CallBack אמיתי (תפר-יחיד כאן).
 */
function pick(p, ...keys) {
  for (const k of keys) {
    const v = p[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

/** @returns {{org:string, amount:number, name:string, phone:string, reference:string}} */
function mapPaymentCallback(params) {
  const p = params || {};
  const first = pick(p, 'FirstName', 'firstName', 'PayerFirstName');
  const last = pick(p, 'LastName', 'lastName', 'PayerLastName');
  return {
    // org מגיע מה-query שמגדירים בפאנל נדרים (‏?org=slug), עם נפילה ל-param1 המהודהד
    org: pick(p, 'org', 'param1', 'Param1'),
    amount: Number(pick(p, 'Amount', 'amount', 'Sum', 'sum', 'Total') || 0),
    name: pick(p, 'Name', 'name', 'FullName', 'PayerName') || [first, last].filter(Boolean).join(' '),
    phone: pick(p, 'Phone', 'phone', 'Tel', 'Mobile', 'cell', 'PayerPhone'),
    reference: pick(p, 'TransactionId', 'Transaction', 'Asmachta', 'AsmachtaNumber', 'reference', 'Reference', 'param2', 'Param2'),
  };
}

module.exports = { mapPaymentCallback, pick };
